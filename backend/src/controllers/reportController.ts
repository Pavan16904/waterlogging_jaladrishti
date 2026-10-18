import { Request, Response } from 'express';
import { query } from '../db/index.js';

export async function exportCsvReport(req: Request, res: Response) {
  try {
    const { runId } = req.params;
    const zones = await query(`SELECT * FROM severity_zones WHERE analysis_run_id = $1`, [runId]);
    if (zones.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'No zones found for this run' });
    }
    const header = 'id,zone_name,severity,probability,elevation_m,slope_deg,land_use,area_ha\n';
    const csvRows = zones.rows.map(z => 
      `"${z.id}","${z.zone_name}","${z.severity}",${z.probability},${z.elevation_m},${z.slope_deg},"${z.land_use}",${z.area_ha}`
    ).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="waterlogging_report_${runId}.csv"`);
    return res.send(header + csvRows);
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function getReportSummaryJson(req: Request, res: Response) {
  try {
    const { runId } = req.params;
    const runResult = await query(`SELECT * FROM analysis_runs WHERE id = $1`, [runId]);
    if (runResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Run not found' });
    }
    const zonesResult = await query(`SELECT * FROM severity_zones WHERE analysis_run_id = $1`, [runId]);
    const advResult = await query(`SELECT * FROM drainage_advisories WHERE analysis_run_id = $1`, [runId]);
    return res.json({
      success: true,
      run: runResult.rows[0],
      totalZones: zonesResult.rowCount,
      zones: zonesResult.rows,
      advisories: advResult.rows
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
