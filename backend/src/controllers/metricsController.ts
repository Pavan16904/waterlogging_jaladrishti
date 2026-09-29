import { Request, Response } from 'express';
import { query } from '../db/index.js';
import axios from 'axios';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';

export async function getModelMetrics(req: Request, res: Response) {
  try {
    // Try fetching from Python ML Service first
    try {
      const mlResponse = await axios.get(`${ML_SERVICE_URL}/api/ml/metrics`, { timeout: 3000 });
      return res.json({ success: true, source: 'ml_microservice', data: mlResponse.data });
    } catch (e) {
      // Fallback to PostgreSQL stored metrics
      const dbResult = await query(`SELECT * FROM model_evaluations LIMIT 1;`);
      if (dbResult.rows.length > 0) {
        return res.json({ success: true, source: 'database_cache', data: dbResult.rows[0].metrics_payload });
      }
      throw new Error('Metrics unavailable');
    }
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
