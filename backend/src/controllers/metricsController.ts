import { Request, Response } from 'express';
import { query } from '../db/index.js';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';

export async function getModelMetrics(req: Request, res: Response) {
  try {
    // 1. Try fetching from Python ML Service first
    try {
      const mlResponse = await axios.get(`${ML_SERVICE_URL}/api/ml/metrics`, { timeout: 2000 });
      if (mlResponse.data && mlResponse.data.primary_model_rf) {
        return res.json({ success: true, source: 'ml_microservice', data: mlResponse.data });
      }
    } catch {
      // ML service not running or returned error, proceed to fallback
    }

    // 2. Try PostgreSQL stored metrics
    try {
      const dbResult = await query(`SELECT * FROM model_evaluations LIMIT 1;`);
      if (dbResult.rows.length > 0 && dbResult.rows[0].metrics_payload) {
        return res.json({ success: true, source: 'database_cache', data: dbResult.rows[0].metrics_payload });
      }
    } catch {
      // Database not connected or table missing, proceed to file artifact
    }

    // 3. Fallback to physical evaluation artifact on disk
    const candidatePaths = [
      path.resolve(process.cwd(), '../ml_service/artifacts/evaluation_metrics.json'),
      path.resolve(process.cwd(), 'ml_service/artifacts/evaluation_metrics.json'),
      path.resolve(__dirname, '../../../ml_service/artifacts/evaluation_metrics.json'),
      path.resolve(__dirname, '../../ml_service/artifacts/evaluation_metrics.json')
    ];

    for (const p of candidatePaths) {
      if (fs.existsSync(p)) {
        try {
          const raw = fs.readFileSync(p, 'utf-8');
          const parsed = JSON.parse(raw);
          if (parsed.primary_model_rf) {
            return res.json({ 
              success: true, 
              source: 'ml_artifacts_disk', 
              data: parsed,
              filePath: p
            });
          }
        } catch {
          // Continue to next path
        }
      }
    }

    return res.status(404).json({ 
      success: false, 
      error: 'Evaluation metrics artifact not found in ml_service/artifacts.',
      requiredSetup: 'Run python ml_service/train_model.py to generate models and evaluation_metrics.json'
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
