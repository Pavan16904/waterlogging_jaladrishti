import { Request, Response } from 'express';
import { query } from '../db/index.js';
import axios from 'axios';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';

/**
 * Generate 8 diverse catchment micro-zones covering all hazard tiers:
 * - 2 Severe (Red)
 * - 3 Moderate (Yellow)
 * - 3 Low / Safe (Green)
 */
export function generateCatchmentMicroZones(studyAreaId: string, studyArea: any, rainfallMm: number = 45.0) {
  const cLat = Number(studyArea.center_lat) || 12.9716;
  const cLng = Number(studyArea.center_lng) || 77.5946;
  const baseElev = Number(studyArea.elevation_m) || 850.0;
  const areaName = (studyArea.name || 'Catchment').split('(')[0].trim();

  return [
    {
      id: `${studyAreaId}_z1`,
      name: `${areaName} - Primary Drainage Basin & Lake Outfall Sump`,
      target_severity: 'Severe',
      elevation_m: Math.round((baseElev - 18) * 10) / 10,
      slope_deg: 0.6,
      land_use: 'urban_builtup',
      area_ha: 16.5,
      is_persistent: true,
      rainfall_mm: rainfallMm,
      ndwi: 0.62,
      mndwi: 0.74,
      ndvi: 0.12,
      vv_db: -22.5,
      vh_db: -28.2,
      geojson_feature: {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [[[cLng - 0.015, cLat - 0.012], [cLng - 0.002, cLat - 0.012], [cLng - 0.002, cLat + 0.002], [cLng - 0.015, cLat + 0.002], [cLng - 0.015, cLat - 0.012]]]
        }
      }
    },
    {
      id: `${studyAreaId}_z2`,
      name: `${areaName} - Arterial Transit Underpass & Culvert Sump`,
      target_severity: 'Severe',
      elevation_m: Math.round((baseElev - 14) * 10) / 10,
      slope_deg: 0.8,
      land_use: 'commercial',
      area_ha: 8.2,
      is_persistent: true,
      rainfall_mm: rainfallMm,
      ndwi: 0.54,
      mndwi: 0.65,
      ndvi: 0.15,
      vv_db: -19.8,
      vh_db: -25.4,
      geojson_feature: {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [[[cLng + 0.010, cLat - 0.020], [cLng + 0.022, cLat - 0.020], [cLng + 0.022, cLat - 0.008], [cLng + 0.010, cLat - 0.008], [cLng + 0.010, cLat - 0.020]]]
        }
      }
    },
    {
      id: `${studyAreaId}_z3`,
      name: `${areaName} - Secondary Valley Agricultural Stagnation Basin`,
      target_severity: 'Moderate',
      elevation_m: Math.round((baseElev - 4) * 10) / 10,
      slope_deg: 1.6,
      land_use: 'agricultural',
      area_ha: 14.8,
      is_persistent: false,
      rainfall_mm: rainfallMm,
      ndwi: 0.14,
      mndwi: 0.18,
      ndvi: 0.38,
      vv_db: -13.2,
      vh_db: -19.0,
      geojson_feature: {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [[[cLng + 0.018, cLat + 0.008], [cLng + 0.032, cLat + 0.008], [cLng + 0.032, cLat + 0.022], [cLng + 0.018, cLat + 0.022], [cLng + 0.018, cLat + 0.008]]]
        }
      }
    },
    {
      id: `${studyAreaId}_z4`,
      name: `${areaName} - Mid-Catchment Residential Runoff Swale`,
      target_severity: 'Moderate',
      elevation_m: Math.round((baseElev - 1) * 10) / 10,
      slope_deg: 1.9,
      land_use: 'residential',
      area_ha: 11.5,
      is_persistent: false,
      rainfall_mm: rainfallMm,
      ndwi: 0.09,
      mndwi: 0.12,
      ndvi: 0.32,
      vv_db: -12.4,
      vh_db: -18.2,
      geojson_feature: {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [[[cLng - 0.025, cLat + 0.015], [cLng - 0.010, cLat + 0.015], [cLng - 0.010, cLat + 0.028], [cLng - 0.025, cLat + 0.028], [cLng - 0.025, cLat + 0.015]]]
        }
      }
    },
    {
      id: `${studyAreaId}_z5`,
      name: `${areaName} - Inter-Basin Detention & Drainage Channel`,
      target_severity: 'Moderate',
      elevation_m: Math.round((baseElev + 3) * 10) / 10,
      slope_deg: 2.3,
      land_use: 'urban_builtup',
      area_ha: 9.4,
      is_persistent: false,
      rainfall_mm: rainfallMm,
      ndwi: 0.03,
      mndwi: 0.06,
      ndvi: 0.42,
      vv_db: -11.5,
      vh_db: -17.3,
      geojson_feature: {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [[[cLng + 0.005, cLat + 0.025], [cLng + 0.018, cLat + 0.025], [cLng + 0.018, cLat + 0.038], [cLng + 0.005, cLat + 0.038], [cLng + 0.005, cLat + 0.025]]]
        }
      }
    },
    {
      id: `${studyAreaId}_z6`,
      name: `${areaName} - Elevated Watershed Ridge & Forestry Buffer`,
      target_severity: 'Low',
      elevation_m: Math.round((baseElev + 28) * 10) / 10,
      slope_deg: 4.8,
      land_use: 'vegetation',
      area_ha: 28.0,
      is_persistent: false,
      rainfall_mm: rainfallMm,
      ndwi: -0.42,
      mndwi: -0.52,
      ndvi: 0.72,
      vv_db: -7.5,
      vh_db: -13.2,
      geojson_feature: {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [[[cLng - 0.035, cLat - 0.028], [cLng - 0.020, cLat - 0.028], [cLng - 0.020, cLat - 0.015], [cLng - 0.035, cLat - 0.015], [cLng - 0.035, cLat - 0.028]]]
        }
      }
    },
    {
      id: `${studyAreaId}_z7`,
      name: `${areaName} - Permeable Agro-Forestry Eco-Recharge Plateau`,
      target_severity: 'Low',
      elevation_m: Math.round((baseElev + 35) * 10) / 10,
      slope_deg: 5.6,
      land_use: 'vegetation',
      area_ha: 34.5,
      is_persistent: false,
      rainfall_mm: rainfallMm,
      ndwi: -0.48,
      mndwi: -0.58,
      ndvi: 0.78,
      vv_db: -6.8,
      vh_db: -12.4,
      geojson_feature: {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [[[cLng + 0.025, cLat - 0.035], [cLng + 0.040, cLat - 0.035], [cLng + 0.040, cLat - 0.020], [cLng + 0.025, cLat - 0.020], [cLng + 0.025, cLat - 0.035]]]
        }
      }
    },
    {
      id: `${studyAreaId}_z8`,
      name: `${areaName} - Upland Natural Gradient Discharge Terrace`,
      target_severity: 'Low',
      elevation_m: Math.round((baseElev + 42) * 10) / 10,
      slope_deg: 6.8,
      land_use: 'open_permeable',
      area_ha: 22.0,
      is_persistent: false,
      rainfall_mm: rainfallMm,
      ndwi: -0.55,
      mndwi: -0.65,
      ndvi: 0.68,
      vv_db: -6.0,
      vh_db: -11.5,
      geojson_feature: {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [[[cLng - 0.038, cLat + 0.005], [cLng - 0.024, cLat + 0.005], [cLng - 0.024, cLat + 0.020], [cLng - 0.038, cLat + 0.020], [cLng - 0.038, cLat + 0.005]]]
        }
      }
    }
  ];
}

/**
 * Execute AI ML inference and persist the 8-zone ensemble into DB
 */
export async function executeAndStoreAnalysis(
  studyAreaId: string, 
  preEventDate?: string, 
  postEventDate?: string, 
  rainfallMm?: number, 
  modelType: string = 'random_forest'
) {
  const saResult = await query(`SELECT * FROM study_areas WHERE id = $1;`, [studyAreaId]);
  if (saResult.rows.length === 0) {
    throw new Error('Study area not found');
  }
  const studyArea = saResult.rows[0];

  const rainVal = rainfallMm !== undefined && rainfallMm !== null ? Number(rainfallMm) : 45.0;
  const zonesToAnalyze = generateCatchmentMicroZones(studyAreaId, studyArea, rainVal);

  const todayDefault = new Date().toISOString().split('T')[0];
  const preDefault = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];

  // Call Python FastAPI ML Service
  const mlResponse = await axios.post(`${ML_SERVICE_URL}/api/ml/analyze-scene`, {
    study_area_id: studyAreaId,
    study_area_name: studyArea.name,
    pre_event_date: preEventDate || preDefault,
    post_event_date: postEventDate || todayDefault,
    model_type: modelType || 'random_forest',
    rainfall_override_mm: rainVal,
    zones: zonesToAnalyze
  });

  const mlData = mlResponse.data;
  const newRunId = `run_${Date.now()}`;

  // Store in database
  await query(
    `INSERT INTO analysis_runs (id, study_area_id, model_type, pre_event_date, post_event_date, rainfall_mm, total_area_km2, waterlogged_area_km2, waterlogged_percentage, severe_count, moderate_count, low_count)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12);`,
    [
      newRunId,
      studyAreaId,
      modelType || 'random_forest',
      preEventDate || preDefault,
      postEventDate || todayDefault,
      rainVal,
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

  return { newRunId, mlData };
}

export async function getLatestAnalysis(req: Request, res: Response) {
  try {
    const { studyAreaId } = req.params;
    
    // Find latest run for this study area
    let runResult = await query(
      `SELECT * FROM analysis_runs 
       WHERE study_area_id = $1 
       ORDER BY created_at DESC 
       LIMIT 1;`,
      [studyAreaId]
    );

    // If no run or run had fewer than 6 zones, auto-execute the multi-tier 8-zone analysis
    if (runResult.rows.length === 0) {
      await executeAndStoreAnalysis(studyAreaId);
      runResult = await query(
        `SELECT * FROM analysis_runs WHERE study_area_id = $1 ORDER BY created_at DESC LIMIT 1;`,
        [studyAreaId]
      );
    }

    const run = runResult.rows[0];

    // Fetch zones
    let zonesResult = await query(
      `SELECT id, zone_name, severity, probability, elevation_m, slope_deg, land_use, area_ha, is_persistent, ndwi, mndwi, ndvi, vv_db, vh_db, geojson_feature
       FROM severity_zones 
       WHERE analysis_run_id = $1
       ORDER BY probability DESC;`,
      [run.id]
    );

    // If existing legacy run has fewer than 6 zones, regenerate with all 8 zones immediately
    if (zonesResult.rows.length < 6) {
      await executeAndStoreAnalysis(studyAreaId);
      runResult = await query(
        `SELECT * FROM analysis_runs WHERE study_area_id = $1 ORDER BY created_at DESC LIMIT 1;`,
        [studyAreaId]
      );
      const updatedRun = runResult.rows[0];
      zonesResult = await query(
        `SELECT id, zone_name, severity, probability, elevation_m, slope_deg, land_use, area_ha, is_persistent, ndwi, mndwi, ndvi, vv_db, vh_db, geojson_feature
         FROM severity_zones 
         WHERE analysis_run_id = $1
         ORDER BY probability DESC;`,
        [updatedRun.id]
      );
      const advResult = await query(
        `SELECT * FROM drainage_advisories 
         WHERE analysis_run_id = $1 
         ORDER BY urgency_score DESC;`,
        [updatedRun.id]
      );
      return res.json({
        success: true,
        run: updatedRun,
        zones: zonesResult.rows,
        advisories: advResult.rows
      });
    }

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
    const { newRunId, mlData } = await executeAndStoreAnalysis(
      studyAreaId,
      preEventDate,
      postEventDate,
      rainfallMm ? parseFloat(rainfallMm) : undefined,
      modelType
    );

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
