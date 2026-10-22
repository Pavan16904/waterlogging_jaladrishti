import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const PID_FILE = path.join(ROOT_DIR, 'logs', 'pids.json');

console.log('Stopping all JalaDrishti AI live services...');

if (fs.existsSync(PID_FILE)) {
  try {
    const data = JSON.parse(fs.readFileSync(PID_FILE, 'utf8'));
    if (data.runner) {
      try {
        execSync(`taskkill /F /T /PID ${data.runner}`, { stdio: 'ignore' });
        console.log(`[+] Stopped supervisor runner (PID: ${data.runner})`);
      } catch {}
    }
    if (data.services) {
      for (const [name, pid] of Object.entries(data.services)) {
        try {
          execSync(`taskkill /F /T /PID ${pid}`, { stdio: 'ignore' });
          console.log(`[+] Stopped ${name} (PID: ${pid})`);
        } catch {}
      }
    }
    fs.unlinkSync(PID_FILE);
  } catch (e) {
    console.warn('Warning reading PID file:', e.message);
  }
}

// Ensure ports are freed
const PORTS = [5000, 3001, 8000];
for (const port of PORTS) {
  try {
    const stdout = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    const lines = stdout.trim().split('\n');
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      const state = parts[parts.length - 2];
      const pid = parts[parts.length - 1];
      if (pid && pid !== '0' && (state === 'LISTENING' || parts.includes('LISTENING'))) {
        try {
          execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
          console.log(`[+] Freed port ${port} (PID: ${pid})`);
        } catch {}
      }
    }
  } catch {}
}

console.log('[+] All JalaDrishti services are successfully stopped.');
