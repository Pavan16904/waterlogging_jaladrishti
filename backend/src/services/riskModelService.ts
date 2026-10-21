import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import yaml from 'yaml';
import { fileURLToPath } from 'url';
import { query } from '../db/index.js';
import { openMeteoIngestionService } from './openMeteoIngestionService.js';
import { observedRainfallService } from './adapters/observedRainfallService.js';
import { staticInputsService } from './staticInputsService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface RiskConfig {
  version: string;
  weights: {
    observed_rain: number;
    model_rain: number;
    antecedent_wetness: number;
    soil_drainage: number;
    twi: number;
    inverted_slope: number;
    fallback_without_observed: {
      model_rain: number;
      antecedent_wetness: number;
      soil_drainage: number;
      twi: number;
      inverted_slope: number;
    };
  };
  normalization: {
    rainfall_3d_max_mm: number;
    twi_min: number;
    twi_max: number;
    slope_max_deg: number;
    api_k_decay: number;
    api_initial_fraction: number;
  };
  risk_classes: {
    low_max: number;
    moderate_max: number;
    high_max: number;
    severe_max: number;
  };
  confidence_penalties: {
    model_only_rainfall: number;
    observed_rainfall_missing: number;
    ndwi_missing: number;
    input_data_stale_60min: number;
    non_agricultural_cropland: number;
    cropland_fraction_threshold: number;
    static_input_missing: number;
  };
}

export interface RiskComputationResult {
  run_id: string;
  created_at: string;
  weights_version: string;
  config_hash: string;
  total_rows: number;
  districts_scored: number;
  timesteps_count: number;
  class_counts: { Low: number; Moderate: number; High: number; Severe: number };
  median_confidence: number;
  district_summaries: Array<{
    district_id: string;
    median_risk_score: number;
    median_confidence: number;
    flagged_low_confidence: boolean;
  }>;
  penalties_applied: string[];
  plain_language_formula: string;
}

export class RiskModelService {
  private configPath: string;

  constructor() {
    const rootPath = path.resolve(__dirname, '../../../config/risk_weights.yaml');
    const localPath = path.resolve(__dirname, '../../config/risk_weights.yaml');
    this.configPath = fs.existsSync(rootPath) ? rootPath : localPath;
  }

  /**
   * Loads config and calculates its SHA-256 fingerprint for auditability
   */
  public loadConfig(): { config: RiskConfig; hash: string } {
    if (!fs.existsSync(this.configPath)) {
      throw new Error(`Risk model configuration file not found at ${this.configPath}`);
    }
    const content = fs.readFileSync(this.configPath, 'utf8');
    const hash = crypto.createHash('sha256').update(content).digest('hex');
    const parsed = yaml.parse(content) as RiskConfig;
    return { config: parsed, hash };
  }

  /**
   * Calculates Antecedent Precipitation Index (API) for soil water storage proxy
   * shortcut: k=0.85 and initial API=0.5*WHC are baseline empirical assumptions to be tuned in validation phase.
   */
  public calculateApi(
    whcMm: number,
    kDecay: number,
    initialFraction: number,
    dailyRainfallSequence: number[]
  ): { apiRaw: number; apiNorm: number } {
    let api = whcMm * initialFraction;
    for (const rain of dailyRainfallSequence) {
      api = (kDecay * api) + rain;
    }
    const apiNorm = Math.min(1.0, Math.max(0.0, api / Math.max(10.0, whcMm)));
    return { apiRaw: api, apiNorm };
  }

  /**
   * Pure formula computing risk score (0-100), class, and confidence penalty compound
   */
  public computeHexRiskScore(
    inputs: {
      rainfall_3d_mm: number;
      rainfall_observed_3d_mm: number | null;
      twi: number | null;
      slope_deg: number | null;
      drainage_class: number | null;
      whc_mm: number | null;
      cropland_fraction: number | null;
      forecast_age_minutes: number;
      ndwi_prev: number | null;
    },
    config: RiskConfig,
    weightsVersion: string,
    configHash: string
  ): {
    risk_score: number;
    risk_class: string;
    confidence: number;
    components: any;
    source: string;
  } {
    const { normalization, confidence_penalties } = config;
    const penalties: string[] = [];
    const flags: string[] = [];
    let confidence = 1.0;

    // 1. Static inputs verification & fallback
    const hasStatic = inputs.twi !== null && inputs.slope_deg !== null && inputs.drainage_class !== null;
    if (!hasStatic) {
      confidence *= confidence_penalties.static_input_missing;
      penalties.push(`static_input_missing (x${confidence_penalties.static_input_missing})`);
      flags.push('static_inputs_incomplete');
    }

    const twi = inputs.twi ?? 8.5; // Neutral baseline fallback
    const slope = inputs.slope_deg ?? 2.5;
    const drainageClass = inputs.drainage_class ?? 3; // Class 3 = moderate drainage
    const whc = inputs.whc_mm ?? 140.0;
    const croplandFraction = inputs.cropland_fraction ?? 0.0;

    // 2. Cropland agricultural penalty
    if (croplandFraction < confidence_penalties.cropland_fraction_threshold) {
      confidence *= confidence_penalties.non_agricultural_cropland;
      penalties.push(`cropland_fraction < ${confidence_penalties.cropland_fraction_threshold} (x${confidence_penalties.non_agricultural_cropland})`);
      flags.push('non-agricultural');
    }

    // 3. Observed rainfall availability check
    const hasObserved = inputs.rainfall_observed_3d_mm !== null;
    let weights = config.weights;
    let sourceText = 'Open-Meteo model + static terrain/soil';

    if (hasObserved) {
      sourceText += ' + IMERG';
    } else {
      // Missing observed penalty
      confidence *= confidence_penalties.model_only_rainfall;
      penalties.push(`model_only_rainfall (x${confidence_penalties.model_only_rainfall})`);
      confidence *= confidence_penalties.observed_rainfall_missing;
      penalties.push(`observed_rainfall_missing (x${confidence_penalties.observed_rainfall_missing})`);
    }

    // 4. Optical Sentinel-2 NDWI availability
    if (inputs.ndwi_prev === null) {
      confidence *= confidence_penalties.ndwi_missing;
      penalties.push(`ndwi_prev_missing (x${confidence_penalties.ndwi_missing})`);
    }

    // 5. Ingestion freshness check
    if (inputs.forecast_age_minutes > 60) {
      confidence *= confidence_penalties.input_data_stale_60min;
      penalties.push(`forecast_input_stale_gt_60min (x${confidence_penalties.input_data_stale_60min})`);
    }

    // 6. Term Normalization
    // A. Rainfall term
    const normModelRain = Math.min(1.0, Math.max(0.0, inputs.rainfall_3d_mm / normalization.rainfall_3d_max_mm));
    const normObservedRain = hasObserved
      ? Math.min(1.0, Math.max(0.0, inputs.rainfall_observed_3d_mm! / normalization.rainfall_3d_max_mm))
      : 0.0;

    // B. Antecedent wetness term (API)
    // Estimate recent rainfall sequence (e.g. 3-day history)
    const dailyEst = inputs.rainfall_3d_mm / 3.0;
    const { apiNorm } = this.calculateApi(whc, normalization.api_k_decay, normalization.api_initial_fraction, [dailyEst, dailyEst]);

    // C. Soil Drainage term: (5 - drainage_class) / 4 -> poor=1 gives 1.0; excessive=5 gives 0.0
    const normDrainage = Math.min(1.0, Math.max(0.0, (5.0 - drainageClass) / 4.0));

    // D. Terrain term: TWI normalized and inverted slope
    const normTwi = Math.min(1.0, Math.max(0.0, (twi - normalization.twi_min) / (normalization.twi_max - normalization.twi_min)));
    const normInvSlope = Math.min(1.0, Math.max(0.0, 1.0 - (slope / normalization.slope_max_deg)));

    // 7. Transparent Weighted Sum
    let rawScore = 0.0;
    if (hasObserved) {
      rawScore =
        (weights.model_rain * normModelRain) +
        (weights.observed_rain * normObservedRain) +
        (weights.antecedent_wetness * apiNorm) +
        (weights.soil_drainage * normDrainage) +
        (weights.twi * normTwi) +
        (weights.inverted_slope * normInvSlope);
    } else {
      const fb = weights.fallback_without_observed;
      rawScore =
        (fb.model_rain * normModelRain) +
        (fb.antecedent_wetness * apiNorm) +
        (fb.soil_drainage * normDrainage) +
        (fb.twi * normTwi) +
        (fb.inverted_slope * normInvSlope);
    }

    const riskScore = Math.round(Math.min(100.0, Math.max(0.0, rawScore * 100.0)) * 100) / 100;

    // 8. Risk Class Determination
    let riskClass = 'Low';
    if (riskScore > config.risk_classes.high_max) {
      riskClass = 'Severe';
    } else if (riskScore > config.risk_classes.moderate_max) {
      riskClass = 'High';
    } else if (riskScore > config.risk_classes.low_max) {
      riskClass = 'Moderate';
    }

    const finalConfidence = Math.round(Math.max(0.05, Math.min(1.0, confidence)) * 1000) / 1000;

    const components = {
      rainfall_3d_mm: Math.round(inputs.rainfall_3d_mm * 10) / 10,
      rainfall_observed_3d_mm: inputs.rainfall_observed_3d_mm,
      api_norm: Math.round(apiNorm * 1000) / 1000,
      soil_drainage_class: drainageClass,
      twi_mean: Math.round(twi * 100) / 100,
      slope_deg_mean: Math.round(slope * 100) / 100,
      cropland_fraction: Math.round(croplandFraction * 100) / 100,
      penalties,
      flags,
      weights_version: weightsVersion,
      config_hash: configHash,
    };

    return {
      risk_score: riskScore,
      risk_class: riskClass,
      confidence: finalConfidence,
      components,
      source: sourceText,
    };
  }

  /**
   * Runs the full Phase 2 risk model computation across all 31 districts.
   * Stores results in waterlog_hex_scores and registers the run in risk_model_runs.
   */
  public async computeAllDistricts(options?: { sampleHexesPerDistrict?: number }): Promise<RiskComputationResult> {
    const { config, hash } = this.loadConfig();
    const runId = `run_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const nowIso = new Date().toISOString();

    console.log(`[*] Starting Phase 2 Risk Model Run [${runId}], config hash: ${hash.substring(0, 8)}...`);

    // Verify Phase 1 status first
    const openMeteoStatus = await openMeteoIngestionService.getStatus();
    const gpmStatus = await observedRainfallService.getGpmStatus();
    const staticStatus = await staticInputsService.getStatus();

    const inputStatus = {
      open_meteo: openMeteoStatus.status,
      open_meteo_age_s: openMeteoStatus.age_seconds,
      nasa_gpm: gpmStatus.status,
      static_terrain_soil: staticStatus.status,
    };

    // Determine forecast age in minutes
    const forecastAgeMinutes = openMeteoStatus.age_seconds ? Math.round(openMeteoStatus.age_seconds / 60) : 10;

    // Fetch all 31 district IDs from district_hexes
    const distRows = await query('SELECT DISTINCT district_id FROM district_hexes ORDER BY district_id ASC');
    const districtIds: string[] = distRows.rows.map((r) => r.district_id);

    const classCounts = { Low: 0, Moderate: 0, High: 0, Severe: 0 };
    const districtSummaries: Array<{
      district_id: string;
      median_risk_score: number;
      median_confidence: number;
      flagged_low_confidence: boolean;
    }> = [];
    const allPenaltiesSet = new Set<string>();
    const allConfidences: number[] = [];
    let totalRowsInserted = 0;

    // Define 3-hourly forecast window timesteps across next 72 hours (8 intervals)
    // Round to nearest epoch hour so valid_time is canonical and idempotent
    const baseEpochHour = Math.floor(Date.now() / 3600000) * 3600000;
    const forecastHourSteps = [0, 6, 12, 18, 24, 36, 48, 72];
    const validTimestamps = forecastHourSteps.map((h) => new Date(baseEpochHour + (h * 3600000)).toISOString());

    // Per-district transactions so SQLite write lock releases between districts
    const failedDistricts: string[] = [];
    for (const districtId of districtIds) {
      try {
        // 1. Fetch district weather snapshot
        const snapRes = await query(
          'SELECT payload, fetched_at FROM weather_snapshots WHERE district_id = $1 ORDER BY fetched_at DESC LIMIT 1',
          [districtId]
        );
        const payload = snapRes.rows[0]?.payload;

        // 2. Fetch hexes for this district
        const hexLimit = options?.sampleHexesPerDistrict ? `LIMIT ${options.sampleHexesPerDistrict}` : '';
        const hexesRes = await query(
          `SELECT h3_index, lat, lng, slope_deg, twi, drainage_proxy, water_holding_capacity, is_cropland
           FROM district_hexes WHERE district_id = $1 ${hexLimit}`,
          [districtId]
        );

        const hexes = hexesRes.rows;
        if (hexes.length === 0) continue;

        const districtScores: number[] = [];
        const districtConfidences: number[] = [];

        await query('BEGIN');
        try {
          // 3. For each valid time step
          for (let tIdx = 0; tIdx < validTimestamps.length; tIdx++) {
            const validTime = validTimestamps[tIdx];
            const hourOffset = forecastHourSteps[tIdx];

            // Compute precipitation from weather payload
            let rainfall3dMm = 25.0; // conservative default if snapshot empty
            if (payload && payload.hourly && Array.isArray(payload.hourly.precipitation)) {
              const startHour = Math.max(0, hourOffset - 48);
              const endHour = Math.min(payload.hourly.precipitation.length, hourOffset + 24);
              const slice = payload.hourly.precipitation.slice(startHour, endHour);
              rainfall3dMm = slice.reduce((a: number, b: number) => a + (b || 0), 0);
            }

            // 4. For each hex in this district
            for (const hex of hexes) {
              const drainageClass = hex.drainage_proxy !== null
                ? Math.max(1, Math.min(5, Math.round(1 + hex.drainage_proxy * 4)))
                : 3;
              const croplandFrac = hex.is_cropland ? 0.85 : 0.05;

              const computed = this.computeHexRiskScore(
                {
                  rainfall_3d_mm: rainfall3dMm,
                  rainfall_observed_3d_mm: null, // Unconfigured in Phase 1
                  twi: hex.twi,
                  slope_deg: hex.slope_deg,
                  drainage_class: drainageClass,
                  whc_mm: hex.water_holding_capacity,
                  cropland_fraction: croplandFrac,
                  forecast_age_minutes: forecastAgeMinutes,
                  ndwi_prev: null,
                },
                config,
                config.version,
                hash
              );

              // Tally metrics
              classCounts[computed.risk_class as keyof typeof classCounts]++;
              districtScores.push(computed.risk_score);
              districtConfidences.push(computed.confidence);
              allConfidences.push(computed.confidence);
              computed.components.penalties.forEach((p: string) => allPenaltiesSet.add(p));

              // Write to waterlog_hex_scores idempotently
              await query(
                `INSERT INTO waterlog_hex_scores (
                   h3_index, resolution, district_id, valid_time, fetched_at,
                   risk_score, risk_class, confidence, components, source, lat, lng, run_id
                 ) VALUES ($1, 7, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                 ON CONFLICT (h3_index, valid_time) DO UPDATE SET
                   risk_score = EXCLUDED.risk_score,
                   risk_class = EXCLUDED.risk_class,
                   confidence = EXCLUDED.confidence,
                   components = EXCLUDED.components,
                   source = EXCLUDED.source,
                   fetched_at = EXCLUDED.fetched_at,
                   run_id = EXCLUDED.run_id`,
                [
                  hex.h3_index,
                  districtId,
                  validTime,
                  nowIso,
                  computed.risk_score,
                  computed.risk_class,
                  computed.confidence,
                  computed.components,
                  computed.source,
                  hex.lat,
                  hex.lng,
                  runId,
                ]
              );

              totalRowsInserted++;
            }
          }
          await query('COMMIT');
        } catch (distErr: any) {
          await query('ROLLBACK');
          failedDistricts.push(districtId);
          console.warn(`[!] Risk model: district ${districtId} failed, continuing:`, distErr.message);
          continue;
        }

        // District summary metrics
        districtScores.sort((a, b) => a - b);
        districtConfidences.sort((a, b) => a - b);
        const medRisk = districtScores[Math.floor(districtScores.length / 2)] || 0;
        const medConf = districtConfidences[Math.floor(districtConfidences.length / 2)] || 0;

        districtSummaries.push({
          district_id: districtId,
          median_risk_score: medRisk,
          median_confidence: medConf,
          flagged_low_confidence: medConf < 0.6,
        });

        // Yield to event loop between districts so HTTP requests are served immediately
        await new Promise((resolve) => setTimeout(resolve, 5));
      } catch (distErr: any) {
        failedDistricts.push(districtId);
        console.warn(`[!] Risk model: district ${districtId} skipped:`, distErr.message);
      }
    }

    // Record audit record in risk_model_runs
    try {
      await query(
        `INSERT INTO risk_model_runs (run_id, created_at, weights_version, config_hash, input_status, row_count)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [runId, nowIso, config.version, hash, inputStatus, totalRowsInserted]
      );

      // Prune obsolete runs older than latest 2 runs to prevent unbounded DB growth and timeouts
      await query(`
        DELETE FROM waterlog_hex_scores
        WHERE run_id IS NOT NULL AND run_id NOT IN (
          SELECT run_id FROM risk_model_runs ORDER BY created_at DESC LIMIT 2
        )
      `);
      await query(`
        DELETE FROM risk_model_runs
        WHERE run_id NOT IN (
          SELECT run_id FROM risk_model_runs ORDER BY created_at DESC LIMIT 5
        )
      `);
    } catch (auditErr: any) {
      console.warn('[!] Risk model audit/prune warning:', auditErr.message);
    }

    allConfidences.sort((a, b) => a - b);
    const overallMedianConfidence = allConfidences[Math.floor(allConfidences.length / 2)] || 0.6;

    const plainLanguageFormula =
      'Risk rises with 3-day rainfall, antecedent soil wetness, poor drainage, and low-lying terrain. ' +
      'Confidence falls when observed rainfall, optical NDWI, or static terrain/soil layers are missing.';

    console.log(`[+] Phase 2 Risk Model Run [${runId}] complete: ${totalRowsInserted} hex scores computed across ${districtIds.length} districts.`);

    return {
      run_id: runId,
      created_at: nowIso,
      weights_version: config.version,
      config_hash: hash,
      total_rows: totalRowsInserted,
      districts_scored: districtIds.length,
      timesteps_count: validTimestamps.length,
      class_counts: classCounts,
      median_confidence: overallMedianConfidence,
      district_summaries: districtSummaries,
      penalties_applied: Array.from(allPenaltiesSet),
      plain_language_formula: plainLanguageFormula,
    };
  }
}

export const riskModelService = new RiskModelService();
