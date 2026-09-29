import { Request, Response } from 'express';
import { query } from '../db/index.js';
import axios from 'axios';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';

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
      return res.status(404).json({ success: false, error: 'No analysis runs found for this study area' });
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

    return res.json({
      success: true,
      run,
      zones: zonesResult.rows,
      advisories: advResult.rows
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function runNewAnalysis(req: Request, res: Response) {
  try {
    const { studyAreaId, preEventDate, postEventDate, rainfallMm, modelType } = req.body;

    // Fetch study area and its existing baseline zones
    const saResult = await query(`SELECT * FROM study_areas WHERE id = $1;`, [studyAreaId]);
    if (saResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Study area not found' });
    }
    const studyArea = saResult.rows[0];

    // Fetch baseline zones for this study area
    const baselineZonesResult = await query(
      `SELECT sz.id, sz.zone_name as name, sz.elevation_m, sz.slope_deg, sz.land_use, sz.area_ha, sz.is_persistent, sz.ndwi, sz.mndwi, sz.ndvi, sz.vv_db, sz.vh_db, sz.geojson_feature
       FROM severity_zones sz
       JOIN analysis_runs ar ON sz.analysis_run_id = ar.id
       WHERE ar.study_area_id = $1
       LIMIT 10;`,
      [studyAreaId]
    );

    let zonesToAnalyze = baselineZonesResult.rows;
    
    // If no baseline zones, synthesize realistic zone points inside the bounding box
    if (zonesToAnalyze.length === 0) {
      const cLat = studyArea.center_lat;
      const cLng = studyArea.center_lng;
      zonesToAnalyze = [
        {
          id: `${studyAreaId}_z1`,
          name: `${studyArea.name} - Primary Drainage Sump`,
          elevation_m: 870.0,
          slope_deg: 0.8,
          land_use: 'urban_builtup',
          area_ha: 15.0,
          is_persistent: true,
          ndwi: 0.58,
          mndwi: 0.72,
          ndvi: 0.10,
          vv_db: -20.5,
          vh_db: -27.8,
          geojson_feature: {
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [[[cLng - 0.01, cLat - 0.01], [cLng + 0.01, cLat - 0.01], [cLng + 0.01, cLat + 0.01], [cLng - 0.01, cLat + 0.01], [cLng - 0.01, cLat - 0.01]]]
            }
          }
        },
        {
          id: `${studyAreaId}_z2`,
          name: `${studyArea.name} - Secondary Depression`,
          elevation_m: 875.0,
          slope_deg: 1.4,
          land_use: 'residential',
          area_ha: 8.0,
          is_persistent: false,
          ndwi: 0.35,
          mndwi: 0.42,
          ndvi: 0.25,
          vv_db: -15.2,
          vh_db: -21.4,
          geojson_feature: {
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [[[cLng + 0.015, cLat + 0.005], [cLng + 0.03, cLat + 0.005], [cLng + 0.03, cLat + 0.02], [cLng + 0.015, cLat + 0.02], [cLng + 0.015, cLat + 0.005]]]
            }
          }
        },
        {
          id: `${studyAreaId}_z3`,
          name: `${studyArea.name} - Elevated Ridge Buffer`,
          elevation_m: 905.0,
          slope_deg: 4.5,
          land_use: 'vegetation',
          area_ha: 25.0,
          is_persistent: false,
          ndwi: -0.38,
          mndwi: -0.48,
          ndvi: 0.62,
          vv_db: -7.5,
          vh_db: -13.2,
          geojson_feature: {
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [[[cLng - 0.03, cLat + 0.015], [cLng - 0.015, cLat + 0.015], [cLng - 0.015, cLat + 0.03], [cLng - 0.03, cLat + 0.03], [cLng - 0.03, cLat + 0.015]]]
            }
          }
        }
      ];
    }

    // Default dates: today as post-event, 7 days ago as pre-event
    const todayDefault = new Date().toISOString().split('T')[0];
    const preDefault = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];

    // Call Python FastAPI ML Service
    const mlResponse = await axios.post(`${ML_SERVICE_URL}/api/ml/analyze-scene`, {
      study_area_id: studyAreaId,
      study_area_name: studyArea.name,
      pre_event_date: preEventDate || preDefault,
      post_event_date: postEventDate || todayDefault,
      model_type: modelType || 'random_forest',
      rainfall_override_mm: rainfallMm ? parseFloat(rainfallMm) : 65.0,
      zones: zonesToAnalyze
    });

    const mlData = mlResponse.data;
    const newRunId = `run_${Date.now()}`;

    const todayInsert = new Date().toISOString().split('T')[0];
    const preInsert = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];

    // Store in database
    await query(
      `INSERT INTO analysis_runs (id, study_area_id, model_type, pre_event_date, post_event_date, rainfall_mm, total_area_km2, waterlogged_area_km2, waterlogged_percentage, severe_count, moderate_count, low_count)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12);`,
      [
        newRunId,
        studyAreaId,
        modelType || 'random_forest',
        preEventDate || preInsert,
        postEventDate || todayInsert,
        rainfallMm ? parseFloat(rainfallMm) : 65.0,
        mlData.total_area_km2,
        mlData.total_waterlogged_km2,
        mlData.waterlogged_percentage,
        mlData.severity_breakdown.Severe || 0,
        mlData.severity_breakdown.Moderate || 0,
        mlData.severity_breakdown.Low || 0
      ]
    );

    // Store zones and advisories
    for (const z of mlData.analyzed_zones) {
      const randSuffix = Math.random().toString(36).substring(2, 8);
      const zoneDbId = `z_${Date.now()}_${randSuffix}`;
      await query(
        `INSERT INTO severity_zones (id, analysis_run_id, zone_name, severity, probability, elevation_m, slope_deg, land_use, area_ha, is_persistent, ndwi, mndwi, ndvi, vv_db, vh_db, geojson_feature)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16);`,
        [
          zoneDbId,
          newRunId,
          z.name || z.zone_name,
          z.severity,
          z.waterlogging_probability,
          z.elevation_m,
          z.slope_deg,
          z.land_use || 'urban_builtup',
          z.area_ha || 5.0,
          z.is_persistent || false,
          z.ndwi,
          z.mndwi,
          z.ndvi,
          z.vv_db,
          z.vh_db,
          JSON.stringify(z.geojson_feature)
        ]
      );

      if (z.advisory) {
        const advId = `adv_${Date.now()}_${randSuffix}`;
        const adv = z.advisory;
        const firstAdvisory = adv.detailed_advisories?.[0] || { title: 'Routine Inspection', diagnosis: 'Normal baseline', action: 'Standard check' };
        await query(
          `INSERT INTO drainage_advisories (id, analysis_run_id, zone_id, zone_name, priority, urgency_score, title, diagnosis, action_recommendation, estimated_volume_m3, mitigation_actions)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11);`,
          [
            advId,
            newRunId,
            zoneDbId,
            z.name || z.zone_name,
            adv.priority,
            adv.urgency_score,
            firstAdvisory.title,
            firstAdvisory.diagnosis,
            firstAdvisory.action,
            adv.estimated_stagnant_volume_m3 || 0,
            JSON.stringify(adv.mitigation_actions || [])
          ]
        );
      }
    }

    return res.json({
      success: true,
      runId: newRunId,
      analysis: mlData
    });
  } catch (err: any) {
    console.error('Error running analysis:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}
