import { Request, Response } from 'express';
import { query } from '../db/index.js';

export async function getAdvisoriesByRun(req: Request, res: Response) {
  try {
    const { runId } = req.params;
    const result = await query(
      `SELECT da.*, sz.severity, sz.elevation_m, sz.slope_deg, sz.land_use, sz.area_ha, sz.probability
       FROM drainage_advisories da
       JOIN severity_zones sz ON da.zone_id = sz.id
       WHERE da.analysis_run_id = $1
       ORDER BY da.urgency_score DESC;`,
      [runId]
    );
    return res.json({ success: true, count: result.rowCount, data: result.rows });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function getAllAdvisories(req: Request, res: Response) {
  try {
    const result = await query(
      `SELECT da.*, sa.name as study_area_name, ar.post_event_date
       FROM drainage_advisories da
       JOIN analysis_runs ar ON da.analysis_run_id = ar.id
       JOIN study_areas sa ON ar.study_area_id = sa.id
       ORDER BY da.created_at DESC
       LIMIT 50;`
    );
    return res.json({ success: true, count: result.rowCount, data: result.rows });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
