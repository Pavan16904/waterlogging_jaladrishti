import { Request, Response } from 'express';
import { query } from '../db/index.js';

export async function getLatestAnalysis(req: Request, res: Response) {
  try {
    const { studyAreaId } = req.params;

    // Find latest run for this study area
    const runResult = await query(
      `SELECT * FROM analysis_runs 
       WHERE study_area_id = $1 
       ORDER BY created_at DESC 
       LIMIT 1;`,
      [studyAreaId]
    );

    if (runResult.rows.length === 0) {
      return res.json({
        success: true,
        status: 'NO_RUNS',
        message: 'No analysis runs found for this study area.',
        run: null,
        zones: [],
        advisories: []
      });
    }

    const run = runResult.rows[0];

    // Fetch zones
    const zonesResult = await query(
      `SELECT id, zone_name, severity, probability, elevation_m, slope_deg, land_use, area_ha, is_persistent, ndwi, mndwi, ndvi, vv_db, vh_db, geojson_feature
       FROM severity_zones 
       WHERE analysis_run_id = $1
       ORDER BY probability DESC;`,
      [run.id]
    );

    // Fetch advisories
    const advResult = await query(
      `SELECT * FROM drainage_advisories 
       WHERE analysis_run_id = $1 
       ORDER BY urgency_score DESC;`,
      [run.id]
    );

    const mappedZones = zonesResult.rows.map((z: any) => {
      let geo = z.geojson_feature;
      if (typeof geo === 'string') {
        try { geo = JSON.parse(geo); } catch { geo = null; }
      }
      const props = geo?.properties || {};
      return {
        ...z,
        geojson_feature: geo,
        crop_type: props.crop_type || 'Agricultural Crop Parcel',
        waterlogging_status: props.waterlogging_status || (z.severity === 'Severe' ? 'Root-Zone Inundation (>40 cm)' : z.severity === 'Moderate' ? 'Surface Ponding (15-40 cm)' : 'Adequate Aeration (<15 cm)'),
        source: 'SRTM 30m + Hydrological Baseline Simulation',
        source_status: 'historical_model',
        observation_time: run.created_at || new Date().toISOString(),
        confidence: props.confidence ?? z.probability ?? 0.85,
        field_id: props.field_id || z.id,
        village: props.village || (z.zone_name.split(' - ')[1] || z.zone_name),
        current_status: props.current_status || (z.severity === 'Severe' ? 'Water Standing' : z.severity === 'Moderate' ? 'Saturated' : 'Normal'),
        suggested_action: props.suggested_action || (z.severity === 'Severe' ? 'Enable drainage pump' : z.severity === 'Moderate' ? 'Field drainage check' : 'Routine monitoring')
      };
    });

    return res.json({
      success: true,
      status: 'AVAILABLE',
      provenance: 'Historical Hydrological Simulation & DEM Baseline',
      run,
      zones: mappedZones,
      advisories: advResult.rows
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export function runNewAnalysis(_req: Request, res: Response) {
  return res.status(503).json({
    success: false,
    status: 'UNAVAILABLE',
    error: 'Autonomous ML satellite pipeline requires live Google Earth Engine or Copernicus Hub connection.'
  });
}
