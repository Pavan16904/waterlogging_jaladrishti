import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import apiRoutes from './routes/api.js';
import { initializeDatabase } from './db/index.js';
import { seedDatabase } from './db/seed.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));
app.use(morgan('dev'));

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

async function startServer() {
  try {
    await initializeDatabase();
    await seedDatabase();
    
    app.listen(Number(PORT), '0.0.0.0', () => {
      console.log(`[+] Node.js Backend Gateway running on http://127.0.0.1:${PORT}`);
    });
  } catch (err: any) {
    console.error('[-] Failed to start server:', err.message);
    process.exit(1);
  }
}

startServer();
