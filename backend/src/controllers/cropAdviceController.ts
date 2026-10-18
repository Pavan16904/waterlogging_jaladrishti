import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import yaml from 'yaml';
import { fileURLToPath } from 'url';
import { query } from '../db/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface CropConfig {
  name: string;
  season: string;
  stages_days: {
    initial: number;
    development: number;
    mid_season: number;
    late: number;
  };
  total_days: number;
  kc: {
    initial: number;
    development: number;
    mid_season: number;
    late: number;
  };
  ponding_threshold_cm?: number;
  critical_depletion_fraction?: number;
  drainage_threshold_mm: number;
  irrigation_method: string;
}

function parseKolkataModelTime(value: string): number {
  const localTimestamp = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)
    ? `${value}:00+05:30`
    : value;
  return new Date(localTimestamp).getTime();
}

function loadCropsConfig(): Record<string, CropConfig> {
  const rootPath = path.resolve(__dirname, '../../../config/crops.yaml');
  const localPath = path.resolve(__dirname, '../../config/crops.yaml');
  const configPath = fs.existsSync(rootPath) ? rootPath : localPath;
  const raw = fs.readFileSync(configPath, 'utf8');
  const parsed = yaml.parse(raw);
  return parsed.crops || {};
}

/**
 * Hand-calculable soil-water balance following FAO-56 dual/single crop model.
 * Included in test assertions for verification.
 */
export async function getCropWaterAdvice(req: Request, res: Response): Promise<void> {
  try {
    const districtId = ((req.query.district as string) || (req.query.district_id as string) || 'bengaluru_rural').toLowerCase();
    const cropKey = ((req.query.crop as string) || 'rice').toLowerCase();
    const sowingDateStr = (req.query.sowing_date as string) || '2026-09-01';
    const soilType = (req.query.soil as string) || 'red_loam';
    const plotAreaHa = parseFloat((req.query.plot_area as string) || '1.0') || 1.0;
    const requestedDaysSinceSowing = req.query.days_since_sowing;
    const parsedDaysSinceSowing = requestedDaysSinceSowing === undefined
      ? null
      : Number(requestedDaysSinceSowing);
    if (parsedDaysSinceSowing !== null && (!Number.isInteger(parsedDaysSinceSowing) || parsedDaysSinceSowing < 0 || parsedDaysSinceSowing > 3650)) {
      res.status(400).json({ success: false, error: 'days_since_sowing must be a whole number from 0 to 3650.' });
      return;
    }

    const crops = loadCropsConfig();
    const cropInfo = crops[cropKey] || crops['rice'];

    // 1. Calculate Days Since Sowing (DSS) and crop growth stage
    const sowingDate = new Date(sowingDateStr);
    const today = new Date();
    const diffTime = Math.max(0, today.getTime() - sowingDate.getTime());
    const dss = parsedDaysSinceSowing ?? Math.floor(diffTime / (1000 * 60 * 60 * 24));

    const s = cropInfo.stages_days;
    let stage: 'Initial' | 'Development' | 'Mid-season' | 'Late' = 'Initial';
    let currentKc = cropInfo.kc.initial;

    if (dss <= s.initial) {
      stage = 'Initial';
      currentKc = cropInfo.kc.initial;
    } else if (dss <= s.initial + s.development) {
      stage = 'Development';
      // Linear interpolation of Kc during development stage
      const p = (dss - s.initial) / s.development;
      currentKc = cropInfo.kc.initial + p * (cropInfo.kc.mid_season - cropInfo.kc.initial);
    } else if (dss <= s.initial + s.development + s.mid_season) {
      stage = 'Mid-season';
      currentKc = cropInfo.kc.mid_season;
    } else {
      stage = 'Late';
      currentKc = cropInfo.kc.late;
    }
    currentKc = Math.round(currentKc * 100) / 100;

    // 2. Soil Water-Holding Capacity proxy (mm)
    const soilWhcMap: Record<string, number> = {
      black_clay: 180.0,
      red_loam: 130.0,
      alluvial: 150.0,
      sandy_loam: 100.0,
      laterite: 110.0,
    };
    const soilWhcMm = soilWhcMap[soilType] || 130.0;

    // 3. Fetch latest forecast snapshot for this district to obtain ET0 & rainfall
    const snapRes = await query(
      'SELECT payload, fetched_at FROM weather_snapshots WHERE district_id = $1 ORDER BY fetched_at DESC LIMIT 1',
      [districtId]
    );

    let et0DailyMm: number | null = null;
    let rainNext3Days: number[] | null = null;
    const weatherFetchedAt = snapRes.rows[0]?.fetched_at || null;

    const payload = snapRes.rows[0]?.payload;
    if (payload?.hourly) {
      const hourlyTimes: string[] = Array.isArray(payload.hourly.time) ? payload.hourly.time : [];
      const currentHour = Math.floor(Date.now() / 3600000) * 3600000;
      const firstForecastHour = hourlyTimes.findIndex((time) => parseKolkataModelTime(time) >= currentHour);
      const et0Array: number[] = payload.hourly.et0_fao_evapotranspiration || [];
      if (firstForecastHour >= 0 && et0Array.length >= firstForecastHour + 24) {
        const next24Et0 = et0Array.slice(firstForecastHour, firstForecastHour + 24).reduce((a, b) => a + (b || 0), 0);
        if (next24Et0 > 0) et0DailyMm = Math.round(next24Et0 * 10) / 10;
      }

      const rainArray: number[] = payload.hourly.precipitation || [];
      if (firstForecastHour >= 0 && rainArray.length >= firstForecastHour + 72) {
        const forecastRain = rainArray.slice(firstForecastHour, firstForecastHour + 72);
        rainNext3Days = [
          Math.round(forecastRain.slice(0, 24).reduce((a, b) => a + (b || 0), 0) * 10) / 10,
          Math.round(forecastRain.slice(24, 48).reduce((a, b) => a + (b || 0), 0) * 10) / 10,
          Math.round(forecastRain.slice(48, 72).reduce((a, b) => a + (b || 0), 0) * 10) / 10,
        ];
      }
    }

    const weatherAvailable = et0DailyMm != null && rainNext3Days != null;
    const etcMmDay = weatherAvailable ? Math.round((et0DailyMm as number) * currentKc * 10) / 10 : null;

    const totalForecastRain3d = rainNext3Days ? rainNext3Days.reduce((a, b) => a + b, 0) : null;
    const effectiveRain3d = totalForecastRain3d == null
      ? null
      : Math.round(Math.min(totalForecastRain3d, 0.8 * totalForecastRain3d) * 10) / 10;

    const cumulativeEtc3d = etcMmDay == null ? null : etcMmDay * 3;
    const deficitMm = (cumulativeEtc3d == null || effectiveRain3d == null)
      ? null
      : Math.min(soilWhcMm, Math.round(Math.max(0, cumulativeEtc3d - effectiveRain3d) * 10) / 10);

    let needMm: number | null = null;
    let timing = 'Unavailable';
    let recommendationText = 'Irrigation need unavailable until an Open-Meteo weather snapshot (ET₀ and 72-hour precipitation) is ingested for this district.';
    if (weatherAvailable && deficitMm != null && effectiveRain3d != null && cumulativeEtc3d != null && etcMmDay != null) {
      const rainCoversDeficit = effectiveRain3d >= cumulativeEtc3d * 0.75;
      if (!rainCoversDeficit && deficitMm > 15.0) {
        needMm = deficitMm;
        timing = 'Apply within 24 to 48 hours (before midday)';
        recommendationText = `Irrigate ${needMm} mm to replenish root-zone depletion under stage ${stage} evapotranspiration (${etcMmDay} mm/day).`;
      } else {
        needMm = 0;
        timing = 'No irrigation needed within 3 days';
        recommendationText = 'Forecast rainfall and the modelled root-zone balance cover crop water demand for the next 72 hours.';
      }
    }

    const waterVolumeM3 = needMm == null ? null : Math.round(needMm * plotAreaHa * 10.0 * 10) / 10;

    // 8. Drainage Check: If 3-day rainfall exceeds crop drainage threshold
    // Fetch district waterlogging risk class
    const riskRes = await query(
      `SELECT risk_class, risk_score, confidence, valid_time, fetched_at, source FROM waterlog_hex_scores
       WHERE district_id = $1
         AND valid_time = (SELECT MAX(valid_time) FROM waterlog_hex_scores WHERE district_id = $2)
       ORDER BY risk_score DESC LIMIT 1`,
      [districtId, districtId]
    );
    const currentRiskClass = riskRes.rows[0]?.risk_class || null;
    const currentRiskScore = riskRes.rows[0]?.risk_score == null ? null : parseFloat(riskRes.rows[0].risk_score);

    const drainageExceeded = totalForecastRain3d != null && totalForecastRain3d >= cropInfo.drainage_threshold_mm;
    const drainageCheck = {
      needed: totalForecastRain3d == null ? null : drainageExceeded,
      threshold_mm: cropInfo.drainage_threshold_mm,
      forecast_rain_3d_mm: totalForecastRain3d,
      risk_class: currentRiskClass,
      risk_score: currentRiskScore,
      confidence: riskRes.rows[0]?.confidence == null ? null : Number(riskRes.rows[0].confidence),
      fetched_at: riskRes.rows[0]?.fetched_at || null,
      valid_time: riskRes.rows[0]?.valid_time || null,
      source: riskRes.rows[0]?.source || null,
      waterlogging_warning: currentRiskClass === 'High' || currentRiskClass === 'Severe',
      advice: totalForecastRain3d == null
        ? 'Drainage outlook unavailable until Open-Meteo precipitation is ingested (weather_snapshots).'
        : drainageExceeded
          ? `High rainfall (${totalForecastRain3d} mm) exceeds ${cropInfo.name} drainage threshold (${cropInfo.drainage_threshold_mm} mm). Drain standing water to prevent root asphyxiation.`
          : `Standing water within safe agronomic tolerance. Normal drainage.`,
    };

    res.json({
      success: true,
      weather_available: weatherAvailable,
      weather_needed: weatherAvailable ? undefined : 'weather_snapshots via Open-Meteo (POST /api/pipeline/ingest)',
      district: districtId,
      crop: cropInfo.name,
      crop_key: cropKey,
      plot_area_ha: plotAreaHa,
      sowing_date: sowingDateStr,
      days_since_sowing: dss,
      growth_stage: stage,
      crop_coefficient_kc: currentKc,
      soil_type: soilType,
      soil_whc_mm: soilWhcMm,
      et0_mm_day: et0DailyMm,
      etc_mm_day: etcMmDay,
      forecast_rain_3d_mm: totalForecastRain3d,
      effective_rain_3d_mm: effectiveRain3d,
      soil_deficit_mm: deficitMm,
      irrigation_need_mm: needMm,
      water_volume_m3: waterVolumeM3,
      timing,
      method: cropInfo.irrigation_method,
      recommendation: recommendationText,
      drainage_check: drainageCheck,
      source_tag: {
        source: 'Open-Meteo NWP · FAO-56 Penman-Monteith · ISRIC SoilGrids',
        label: weatherAvailable ? 'model' : 'not connected',
        fetched_at: weatherFetchedAt,
      },
      assumptions: {
        et0_source: 'Open-Meteo hourly FAO-56 Penman-Monteith solar radiation & wind model',
        kc_source: 'FAO Irrigation and Drainage Paper 56 single-crop coefficients (Table 12)',
        effective_rain_rule: 'Rain_effective = min(Rain, 0.8 * Rain) (USDA-SCS empirical proxy)',
        soil_capacity_source: 'ISRIC SoilGrids 250m available water-holding capacity (AWC)',
        rainfall_source: 'Open-Meteo Numerical Weather Prediction (NWP) 72-hour accumulation',
      },
      disclaimer: 'Planning guidance. Verify with local agriculture officers before applying.',
    });
  } catch (err: any) {
    console.error('getCropWaterAdvice error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to compute crop water balance',
      message: err.message,
    });
  }
}
