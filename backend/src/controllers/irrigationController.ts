import { Request, Response } from 'express';
import { query } from '../db/index.js';
import axios from 'axios';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

export async function calculateIrrigation(req: Request, res: Response) {
  try {
    const {
      cropName,
      daysSincePlanting,
      soilType,
      districtName,
      tempMinC,
      tempMaxC,
      recentRainfallMm,
      currentDepletionMm,
      latitudeDeg,
      fieldAreaHa
    } = req.body;

    const mlResponse = await axios.post(`${ML_SERVICE_URL}/api/ml/irrigation-advisory`, {
      crop_name: cropName || 'Tomato',
      days_since_planting: parseInt(daysSincePlanting || '45', 10),
      soil_type: soilType || 'Red Sandy Loam (Karnataka Plains)',
      district_name: districtName || 'Bengaluru Urban',
      temp_min_c: tempMinC !== undefined ? parseFloat(tempMinC) : undefined,
      temp_max_c: tempMaxC !== undefined ? parseFloat(tempMaxC) : undefined,
      recent_rainfall_mm: parseFloat(recentRainfallMm || '0.0'),
      current_depletion_mm: parseFloat(currentDepletionMm || '14.0'),
      latitude_deg: latitudeDeg !== undefined ? parseFloat(latitudeDeg) : undefined,
      field_area_ha: parseFloat(fieldAreaHa || '2.0')
    });

    const result = mlResponse.data;
    const advisoryId = `irrig_${Date.now()}`;

    // Store in PostgreSQL
    await query(
      `INSERT INTO irrigation_advisories (
        id, crop_name, growth_stage, soil_type, days_since_planting, 
        et0_mm_day, crop_coefficient_kc, etc_mm_day, taw_mm, raw_mm, 
        current_depletion_mm, status, recommended_gross_mm, water_volume_m3, 
        field_area_ha, advisory_summary, forecast_payload
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17);`,
      [
        advisoryId,
        result.crop,
        result.growth_stage,
        result.soil_type,
        result.days_since_planting,
        result.et0_reference_mm_day,
        result.crop_coefficient_kc,
        result.etc_crop_water_need_mm_day,
        result.taw_total_available_water_mm,
        result.raw_readily_available_water_mm,
        result.current_depletion_mm,
        result.irrigation_status,
        result.recommended_gross_mm,
        result.required_water_volume_m3,
        result.field_area_ha,
        result.advisory_summary,
        JSON.stringify(result.forecast_7day)
      ]
    );

    return res.json({ success: true, data: result, id: advisoryId });
  } catch (err: any) {
    console.error('Irrigation computation error:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function getKarnatakaDistricts(req: Request, res: Response) {
  try {
    const mlResponse = await axios.get(`${ML_SERVICE_URL}/api/ml/karnataka-districts`);
    return res.json({ success: true, data: mlResponse.data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function getCropCatalog(req: Request, res: Response) {
  try {
    const mlResponse = await axios.get(`${ML_SERVICE_URL}/api/ml/crop-catalog`);
    return res.json({ success: true, data: mlResponse.data });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function getPastIrrigationAdvisories(req: Request, res: Response) {
  try {
    const result = await query(
      `SELECT * FROM irrigation_advisories ORDER BY created_at DESC LIMIT 20;`
    );
    return res.json({ success: true, data: result.rows });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
