import { spawn, execSync } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const LOGS_DIR = path.join(ROOT_DIR, 'logs');
const PID_FILE = path.join(LOGS_DIR, 'pids.json');

function isPortHealthy(port) {
  return new Promise((resolve) => {
    const testPath = port === 8000 ? '/docs' : port === 5000 ? '/health' : '/';
    const req = http.get(`http://127.0.0.1:${port}${testPath}`, { timeout: 1500 }, (res) => {
      resolve(res.statusCode < 500);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
  });
}

if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  try {
    fs.appendFileSync(path.join(LOGS_DIR, 'runner.log'), line + '\n');
  } catch {}
}

const processes = {};
let shuttingDown = false;

function freePort(port) {
  try {
    const stdout = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    const lines = stdout.trim().split('\n');
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      const state = parts[parts.length - 2];
      const pid = parts[parts.length - 1];
      const isTracked = Object.values(processes).some(p => p && String(p.pid) === pid);
      if (pid && pid !== '0' && pid !== String(process.pid) && !isTracked && (state === 'LISTENING' || parts.includes('LISTENING'))) {
        try {
          execSync(`taskkill /F /T /PID ${pid}`, { stdio: 'ignore' });
          log(`Freed port ${port} from stale PID ${pid}`);
        } catch {}
      }
    }
  } catch {}
}

const isWin = process.platform === 'win32';
const npmCmd = isWin ? 'npm.cmd' : 'npm';
const pythonCmd = 'python';

const SERVICES = [
  {
    name: 'backend',
    command: npmCmd,
    args: ['--prefix', 'backend', 'run', 'dev'],
    cwd: ROOT_DIR,
    port: 5000,
    logFile: path.join(LOGS_DIR, 'backend.log'),
    shell: isWin,
  },
  {
    name: 'frontend',
    command: npmCmd,
    args: ['--prefix', 'frontend', 'run', 'dev'],
    cwd: ROOT_DIR,
    port: 3001,
    logFile: path.join(LOGS_DIR, 'frontend.log'),
    shell: isWin,
  },
  {
    name: 'ml-service',
    command: pythonCmd,
    args: ['-m', 'uvicorn', 'main:app', '--app-dir', 'ml_service', '--host', '127.0.0.1', '--port', '8000'],
    cwd: ROOT_DIR,
    port: 8000,
    logFile: path.join(LOGS_DIR, 'ml.log'),
    shell: false,
  },
];

function savePids() {
  const pids = {
    runner: process.pid,
    updated_at: new Date().toISOString(),
    services: {},
  };
  for (const [name, proc] of Object.entries(processes)) {
    if (proc && proc.pid) {
      pids.services[name] = proc.pid;
    }
  }
  try {
    fs.writeFileSync(PID_FILE, JSON.stringify(pids, null, 2));
  } catch {}
}

async function startService(svc) {
  if (shuttingDown) return;

  if (await isPortHealthy(svc.port)) {
    log(`Service [${svc.name}] is already healthy on port ${svc.port}. Adopting.`);
    try {
      const stdout = execSync(`netstat -ano | findstr :${svc.port}`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
      const lines = stdout.trim().split('\n');
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && pid !== '0' && pid !== String(process.pid)) {
          processes[svc.name] = { pid: parseInt(pid, 10), isAdopted: true };
          savePids();
          break;
        }
      }
    } catch {}
    return;
  }

  log(`Starting service [${svc.name}] on port ${svc.port}...`);
  freePort(svc.port);

  let outStream;
  try {
    outStream = fs.createWriteStream(svc.logFile, { flags: 'a' });
  } catch {}

  const child = spawn(svc.command, svc.args, {
    cwd: svc.cwd,
    env: { ...process.env, PORT: String(svc.port) },
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: svc.shell ?? false,
    windowsHide: true,
  });

  processes[svc.name] = child;
  savePids();

  child.stdout.on('data', (data) => {
    if (outStream) outStream.write(data);
    process.stdout.write(`[${svc.name}] ${data}`);
  });

  child.stderr.on('data', (data) => {
    if (outStream) outStream.write(data);
    process.stderr.write(`[${svc.name}] ${data}`);
  });

  child.on('error', (err) => {
    log(`Service [${svc.name}] error: ${err.message}`);
  });

  child.on('exit', (code, signal) => {
    log(`Service [${svc.name}] exited (code: ${code}, signal: ${signal})`);
    delete processes[svc.name];
    savePids();

    if (!shuttingDown) {
      log(`Auto-restart: restoring service [${svc.name}] in 2 seconds...`);
      setTimeout(() => startService(svc), 2000);
    }
  });
}

function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  log('Stopping all JalaDrishti AI live services...');

  for (const [name, proc] of Object.entries(processes)) {
    if (proc && proc.pid) {
      try {
        execSync(`taskkill /F /T /PID ${proc.pid}`, { stdio: 'ignore' });
        log(`Stopped ${name} (PID: ${proc.pid})`);
      } catch {}
    }
  }

  for (const svc of SERVICES) {
    freePort(svc.port);
  }

  if (fs.existsSync(PID_FILE)) {
    try { fs.unlinkSync(PID_FILE); } catch {}
  }

  log('All live services stopped cleanly.');
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

process.on('uncaughtException', (err) => {
  log(`Supervisor Uncaught Exception: ${err.message}`);
});

process.on('unhandledRejection', (reason) => {
  log(`Supervisor Unhandled Rejection: ${reason}`);
});

async function main() {
  log('=== JalaDrishti AI Permanent Live Supervisor Starting ===');
  for (const svc of SERVICES) {
    await startService(svc);
  }
  log('=== All services running live. Auto-restart active. ===');

  // Periodic heartbeat & adopted service monitor
  setInterval(async () => {
    if (shuttingDown) return;
    for (const svc of SERVICES) {
      const proc = processes[svc.name];
      if (!proc) {
        startService(svc);
      } else if (proc.isAdopted) {
        const healthy = await isPortHealthy(svc.port);
        if (!healthy) {
          log(`Adopted service [${svc.name}] became unresponsive. Restarting...`);
          delete processes[svc.name];
          startService(svc);
        }
      }
    }
    savePids();
  }, 10000);
}

main();
