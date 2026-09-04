import { Request, Response } from 'express';
import { query } from '../db/index.js';

export async function exportCsvReport(req: Request, res: Response) {
  try {
    const { runId } = req.params;
    
    // Fetch run details
    const runRes = await query(
      `SELECT ar.*, sa.name as study_area_name, sa.state_region
       FROM analysis_runs ar
       JOIN study_areas sa ON ar.study_area_id = sa.id
       WHERE ar.id = $1;`,
      [runId]
    );

    if (runRes.rows.length === 0) {
      return res.status(404).send('Analysis run not found');
    }

    const run = runRes.rows[0];

    // Fetch zones and advisories
    const zonesRes = await query(
      `SELECT sz.*, da.priority, da.urgency_score, da.title as advisory_title, da.action_recommendation
       FROM severity_zones sz
       LEFT JOIN drainage_advisories da ON sz.id = da.zone_id
       WHERE sz.analysis_run_id = $1
       ORDER BY sz.probability DESC;`,
      [runId]
    );

    // Build CSV Content
    let csv = 'Zone ID,Zone Name,Severity,Waterlogging Probability,Elevation (m),Slope (deg),Land Use,Area (ha),NDWI,MNDWI,NDVI,VV (dB),VH (dB),Priority,Urgency Score,Drainage Advisory Action\n';

    for (const z of zonesRes.rows) {
      const escape = (str: any) => `"${String(str || '').replace(/"/g, '""')}"`;
      csv += [
        escape(z.id),
        escape(z.zone_name),
        escape(z.severity),
        z.probability,
        z.elevation_m,
        z.slope_deg,
        escape(z.land_use),
        z.area_ha,
        z.ndwi,
        z.mndwi,
        z.ndvi,
        z.vv_db,
        z.vh_db,
        escape(z.priority || 'N/A'),
        z.urgency_score || 0,
        escape(z.action_recommendation || 'Standard monitoring')
      ].join(',') + '\n';
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=Waterlogging_Advisory_Report_${run.study_area_id}_${runId}.csv`);
    return res.status(200).send(csv);
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function getReportSummaryJson(req: Request, res: Response) {
  try {
    const { runId } = req.params;
    const runRes = await query(
      `SELECT ar.*, sa.name as study_area_name, sa.state_region, sa.country, sa.description as area_desc
       FROM analysis_runs ar
       JOIN study_areas sa ON ar.study_area_id = sa.id
       WHERE ar.id = $1;`,
      [runId]
    );

    if (runRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Analysis run not found' });
    }

    const run = runRes.rows[0];
    const zonesRes = await query(
      `SELECT sz.*, da.priority, da.urgency_score, da.title as advisory_title, da.action_recommendation, da.mitigation_actions
       FROM severity_zones sz
       LEFT JOIN drainage_advisories da ON sz.id = da.zone_id
       WHERE sz.analysis_run_id = $1
       ORDER BY sz.probability DESC;`,
      [runId]
    );

    return res.json({
      success: true,
      report_metadata: {
        project_title: 'AI-Based Waterlogging Detection and Drainage Advisory System',
        platform: 'JalaDrishti AI',
        sensors: ['Sentinel-1 SAR', 'Sentinel-2 MSI', 'SRTM DEM', 'IMD Rainfall'],
        generated_at: new Date().toISOString()
      },
      analysis_run: run,
      zones_and_advisories: zonesRes.rows
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
