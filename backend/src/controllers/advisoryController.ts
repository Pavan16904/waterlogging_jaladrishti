import { Request, Response } from 'express';
import { query } from '../db/index.js';

export async function getAdvisoriesByRun(req: Request, res: Response) {
  try {
    const { runId } = req.params;
    const result = await query(
      `SELECT * FROM drainage_advisories 
       WHERE analysis_run_id = $1 
       ORDER BY urgency_score DESC;`,
      [runId]
    );
    return res.json({
      success: true,
      count: result.rowCount,
      data: result.rows
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function getAllAdvisories(req: Request, res: Response) {
  try {
    const result = await query(
      `SELECT * FROM drainage_advisories 
       ORDER BY urgency_score DESC;`
    );
    return res.json({
      success: true,
      count: result.rowCount,
      data: result.rows
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
