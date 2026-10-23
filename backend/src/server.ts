import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import zlib from 'node:zlib';
import apiRoutes from './routes/api.js';
import { initializeDatabase, query } from './db/index.js';
import { seedDatabase } from './db/seed.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));
app.use(morgan('dev'));

// Built-in lightweight gzip response compression for payloads > 1KB
app.use((req, res, next) => {
  const acceptEncoding = (req.headers['accept-encoding'] as string) || '';
  if (!acceptEncoding.includes('gzip')) return next();

  const originalSend = res.send;
  res.send = function (body: any): any {
    if (body && (typeof body === 'string' || Buffer.isBuffer(body))) {
      const buf = Buffer.isBuffer(body) ? body : Buffer.from(body, 'utf-8');
      if (buf.length > 1024) {
        res.setHeader('Content-Encoding', 'gzip');
        res.removeHeader('Content-Length');
        const compressed = zlib.gzipSync(buf);
        return res.end(compressed);
      }
    }
    return originalSend.call(this, body);
  };
  next();
});

// Mount API routes
app.use('/api', apiRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'JalaDrishti AI Waterlogging & Drainage Advisory Backend',
    timestamp: new Date().toISOString()
  });
});

// Mounting backend gateway
async function startServer() {
  // Start listening immediately so gateway is always reachable and frontend never sees ECONNREFUSED
  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`[+] Node.js Backend Gateway running on http://127.0.0.1:${PORT}`);
  });

  try {
    await initializeDatabase();
    const existing = await query('SELECT COUNT(*) as count FROM incidents;');
    const count = Number(existing.rows?.[0]?.count || 0);
    if (count === 0) {
      console.log('[*] Database empty. Seeding initial district hotspots...');
      await seedDatabase();
    } else {
      console.log(`[+] Database ready with ${count} incidents.`);
    }
  } catch (err: any) {
    console.error('[-] Initialization warning:', err.message);
  }
}

process.on('uncaughtException', (err) => {
  console.error('[!] Uncaught Exception in backend:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('[!] Unhandled Rejection in backend:', reason);
});

process.on('SIGTERM', () => {
  console.log('[*] SIGTERM received. Gracefully shutting down...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('[*] SIGINT received. Gracefully shutting down...');
  process.exit(0);
});

startServer();
