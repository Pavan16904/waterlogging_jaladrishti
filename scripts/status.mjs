import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const PID_FILE = path.join(ROOT_DIR, 'logs', 'pids.json');

function checkEndpoint(name, url, port) {
  return new Promise((resolve) => {
    const req = http.get(url, { timeout: 3000 }, (res) => {
      resolve({ name, port, status: 'ONLINE', code: res.statusCode });
    });
    req.on('error', (err) => {
      resolve({ name, port, status: 'OFFLINE', error: err.message });
    });
    req.on('timeout', () => {
      req.destroy();
      resolve({ name, port, status: 'TIMEOUT' });
    });
  });
}

async function main() {
  console.log('====================================================');
  console.log('       JALADRISHTI AI - SERVICE HEALTH CHECK        ');
  console.log('====================================================');

  if (fs.existsSync(PID_FILE)) {
    try {
      const pids = JSON.parse(fs.readFileSync(PID_FILE, 'utf8'));
      console.log(`[Supervisor PID] : ${pids.runner}`);
      console.log(`[Active PIDs]    :`, pids.services);
      console.log(`[Last Heartbeat] : ${pids.updated_at}\n`);
    } catch {}
  } else {
    console.log('[Notice] No active supervisor PID file found.\n');
  }

  const results = await Promise.all([
    checkEndpoint('Backend Express API', 'http://127.0.0.1:5000/health', 5000),
    checkEndpoint('Frontend Vite Web App', 'http://localhost:3001/', 3001),
    checkEndpoint('FastAPI ML Service', 'http://127.0.0.1:8000/docs', 8000),
  ]);

  for (const r of results) {
    const badge = r.status === 'ONLINE' ? '✔ ONLINE ' : '✖ OFFLINE';
    console.log(`${badge} | Port ${r.port} | ${r.name} ${r.code ? `(HTTP ${r.code})` : ''}`);
  }
  console.log('====================================================');
}

main();
