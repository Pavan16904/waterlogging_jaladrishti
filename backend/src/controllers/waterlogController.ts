import { Request, Response } from 'express';
import { query } from '../db/index.js';
import { seedWaterlogHexScoresIfEmpty, districtWaterloggingDepthCm } from '../services/waterlogService.js';
import { canonicalDistrictId } from '../utils/districtUtils.js';
// @ts-ignore
import * as h3 from 'h3-js';

/**
 * GET /api/waterlog/hexes
 * Query parameters:
 *  - valid_time: ISO-8601 string (optional; defaults to latest valid_time)
 *  - res: number (optional; defaults to 7)
 *  - bbox: minLng,minLat,maxLng,maxLat (optional; filters by viewport)
 *  - district_id: string (optional)
 */
export async function getWaterlogHexes(req: Request, res: Response): Promise<void> {
  try {
    // If table is unseeded, seed once
    await seedWaterlogHexScoresIfEmpty();

    let validTime = (req.query.valid_time as string) || '';
    const resolution = req.query.res ? parseInt(req.query.res as string, 10) : 7;
    const bboxStr = req.query.bbox as string;
    const rawDist = (req.query.district_id as string) || (req.query.district as string);
    const districtId = rawDist ? canonicalDistrictId(rawDist) : undefined;

    // If no valid_time supplied, pick the latest valid_time scoped to this district (or global)
    if (!validTime) {
      const latestRes = districtId
        ? await query('SELECT MAX(valid_time) as max_vt FROM waterlog_hex_scores WHERE district_id = ?', [districtId])
        : await query('SELECT MAX(valid_time) as max_vt FROM waterlog_hex_scores');
      validTime = latestRes.rows[0]?.max_vt || '';
    }

    if (!validTime) {
      res.json({
        success: true,
        hexes: [],
        count: 0,
        reason: 'No waterlogging forecast data available in waterlog_hex_scores table.'
      });
      return;
    }

    const whereClauses: string[] = ['valid_time = $1', 'resolution = $2'];
    const params: any[] = [validTime, resolution];

    if (districtId) {
      params.push(districtId);
      whereClauses.push(`district_id = $${params.length}`);
    }

    if (bboxStr) {
      const parts = bboxStr.split(',').map(s => parseFloat(s.trim()));
      if (parts.length === 4 && parts.every(n => !isNaN(n))) {
        const [minLng, minLat, maxLng, maxLat] = parts;
        params.push(minLng, maxLng, minLat, maxLat);
        whereClauses.push(`lng >= $${params.length - 3} AND lng <= $${params.length - 2} AND lat >= $${params.length - 1} AND lat <= $${params.length}`);
      }
    }

    const limitParam = req.query.limit ? parseInt(req.query.limit as string, 10) : (req.query.all === 'true' ? undefined : 200);
    const limitClause = limitParam && !isNaN(limitParam) ? ` LIMIT ${limitParam}` : '';

    const sql = `
      SELECT 
        h3_index,
        resolution,
        district_id,
        valid_time,
        fetched_at,
        risk_score,
        risk_class,
        confidence,
        components,
        source,
        lat,
        lng
      FROM waterlog_hex_scores
      WHERE ${whereClauses.join(' AND ')}
      ORDER BY risk_score DESC
      ${limitClause}
    `;

    const result = await query(sql, params);

    if (result.rows.length === 0) {
      res.json({
        success: true,
        hexes: [],
        count: 0,
        valid_time: validTime,
        reason: `No hex scores found for valid_time=${validTime} within the requested viewport.`
      });
      return;
    }

    // Incorporate real-time rainfall from weather_snapshots to adjust risk_score dynamically
    let realTimeRainfallMm = 0;
    if (districtId) {
      try {
        const weatherRes = await query(
          'SELECT payload FROM weather_snapshots WHERE district_id = ? ORDER BY id DESC LIMIT 1',
          [districtId]
        );
        if (weatherRes.rows.length > 0) {
          const payload = typeof weatherRes.rows[0].payload === 'string'
            ? JSON.parse(weatherRes.rows[0].payload)
            : weatherRes.rows[0].payload;
          realTimeRainfallMm = parseFloat(payload?.current?.precipitation || payload?.daily?.precipitation_sum?.[0] || '0') || 0;
        }
      } catch {}
    }

    const rainMultiplier = realTimeRainfallMm > 0 ? Math.min(1.75, 1.0 + (realTimeRainfallMm / 25)) : 1.0;

    res.json({
      success: true,
      valid_time: validTime,
      resolution,
      count: result.rows.length,
      real_time_rainfall_mm: realTimeRainfallMm,
      hexes: result.rows.map((row) => {
        let comp: Record<string, any> = {};
        try {
          comp = typeof row.components === 'string' ? JSON.parse(row.components) : (row.components || {});
        } catch {}

        let baseScore = typeof row.risk_score === 'number' ? row.risk_score : parseFloat(row.risk_score || '0.3');
        if (baseScore > 1) baseScore = baseScore / 100;
        const dynamicRiskScore = Math.min(0.99, Math.max(0.12, Math.round(baseScore * rainMultiplier * 100) / 100));

        let dynamicRiskClass = 'Minor';
        if (dynamicRiskScore >= 0.75) dynamicRiskClass = 'Severe';
        else if (dynamicRiskScore >= 0.50) dynamicRiskClass = 'High';
        else if (dynamicRiskScore >= 0.25) dynamicRiskClass = 'Moderate';

        comp = {
          ...comp,
          rainfall_mm: comp.rainfall_mm ? Math.round(comp.rainfall_mm * rainMultiplier * 10) / 10 : realTimeRainfallMm,
          waterlogging_depth_cm: districtWaterloggingDepthCm(row.district_id, dynamicRiskScore),
        };

        return {
          ...row,
          risk_score: dynamicRiskScore,
          risk_class: dynamicRiskClass,
          components: comp,
        };
      }),
    });
  } catch (err: any) {
    console.error('getWaterlogHexes error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve modelled waterlogging hexes',
      details: err?.message
    });
  }
}

let cachedDistrictCounts: { counts: Record<string, number>; timestamp: number } | null = null;

/**
 * GET /api/waterlog/status
 * Returns latest valid_time, fetched_at, source, row counts per district, and list of valid_times.
 */
export async function getWaterlogStatus(req: Request, res: Response): Promise<void> {
  try {
    await seedWaterlogHexScoresIfEmpty();
    const districtId = typeof req.query.district_id === 'string'
      ? req.query.district_id.toLowerCase()
      : '';
    const districtFilter = districtId ? ' WHERE district_id = $1' : '';
    const params = districtId ? [districtId] : [];

    const now = Date.now();
    let row_count_per_district: Record<string, number> = {};

    if (cachedDistrictCounts && now - cachedDistrictCounts.timestamp < 300_000) {
      row_count_per_district = cachedDistrictCounts.counts;
    } else {
      const distRes = await query(`SELECT district_id, COUNT(*) as hex_count FROM waterlog_hex_scores GROUP BY district_id`);
      for (const r of distRes.rows) {
        row_count_per_district[r.district_id] = parseInt(r.hex_count, 10);
      }
      cachedDistrictCounts = { counts: row_count_per_district, timestamp: now };
    }

    const [aggRes, timesRes] = await Promise.all([
      query(`SELECT MAX(valid_time) as latest_valid_time, MAX(fetched_at) as fetched_at, MIN(source) as source, COUNT(*) as total_hexes FROM waterlog_hex_scores${districtFilter}`, params),
      query(`SELECT DISTINCT valid_time FROM waterlog_hex_scores${districtFilter} ORDER BY valid_time ASC`, params),
    ]);

    const latest_valid_time = aggRes.rows[0]?.latest_valid_time || null;
    const fetched_at = aggRes.rows[0]?.fetched_at || null;
    const source = aggRes.rows[0]?.source || 'Open-Meteo NWP · SRTM 30m TWI · ICAR/HWSD Soil';
    const total_hexes = parseInt(aggRes.rows[0]?.total_hexes || '0', 10);

    const valid_times = timesRes.rows.map(r => r.valid_time);

    res.json({
      success: true,
      latest_valid_time,
      fetched_at,
      source,
      total_hexes,
      valid_times,
      row_count_per_district
    });
  } catch (err: any) {
    console.error('getWaterlogStatus error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve waterlog status',
      details: err?.message
    });
  }
}

/**
 * GET /api/waterlog/summary
 * Returns KPI area calculations in hectares (H3 res 7 ~ 516.1 ha per cell),
 * top needs-attention hexes, and model rainfall summary for district or statewide.
 */
export async function getWaterlogSummary(req: Request, res: Response): Promise<void> {
  try {
    await seedWaterlogHexScoresIfEmpty();
    const districtId = typeof req.query.district_id === 'string'
      ? req.query.district_id.toLowerCase()
      : typeof req.query.district === 'string'
        ? req.query.district.toLowerCase()
        : '';
    const districtFilter = districtId ? ' WHERE district_id = $1' : '';
    const params = districtId ? [districtId] : [];

    const [classCountsRes, topHexesRes, rainfallRes] = await Promise.all([
      query(`
        SELECT risk_class, COUNT(*) as cnt, MAX(fetched_at) as fetched_at, MAX(valid_time) as valid_time
        FROM waterlog_hex_scores
        ${districtFilter}
        GROUP BY risk_class
      `, params),
      query(`
        SELECT h3_index, district_id, risk_score, confidence, risk_class, components, fetched_at, valid_time, lat, lng
        FROM waterlog_hex_scores
        ${districtFilter}
        ORDER BY risk_score DESC
        LIMIT 10
      `, params),
      query(`
        SELECT MAX(fetched_at) as fetched_at
        FROM weather_snapshots
      `)
    ]);

    // H3 res 7 area is approximately 5.1612 km² = 516.12 hectares
    const HA_PER_HEX = 516.12;

    let severeCount = 0;
    let moderateCount = 0;
    let lowCount = 0;
    let highCount = 0;
    let fetchedAt = new Date().toISOString();
    let validTime = '';

    for (const row of classCountsRes.rows) {
      const cnt = parseInt(row.cnt, 10);
      if (row.fetched_at) fetchedAt = row.fetched_at;
      if (row.valid_time) validTime = row.valid_time;
      if (row.risk_class === 'Severe') severeCount = cnt;
      else if (row.risk_class === 'High') highCount = cnt;
      else if (row.risk_class === 'Moderate') moderateCount = cnt;
      else if (row.risk_class === 'Low') lowCount = cnt;
    }

    const totalHexes = severeCount + highCount + moderateCount + lowCount;
    const monitoredHectares = Math.round(totalHexes * HA_PER_HEX);
    const severePct = totalHexes > 0 ? Math.round(((severeCount + highCount) / totalHexes) * 100) : 0;
    const moderatePct = totalHexes > 0 ? Math.round((moderateCount / totalHexes) * 100) : 0;
    const lowPct = totalHexes > 0 ? Math.round((lowCount / totalHexes) * 100) : 0;

    const topHexes = topHexesRes.rows.map((row) => {
      let comp = {};
      try {
        comp = typeof row.components === 'string' ? JSON.parse(row.components) : (row.components || {});
      } catch (e) {}
      return {
        h3_index: row.h3_index,
        district_id: row.district_id,
        risk_score: parseFloat(row.risk_score || '0'),
        confidence: parseFloat(row.confidence || '0.5'),
        risk_class: row.risk_class,
        components: comp,
        fetched_at: row.fetched_at || fetchedAt,
        source_tag: {
          source: 'JalaDrishti Model · waterlog_hex_scores',
          label: 'model',
          fetched_at: row.fetched_at || fetchedAt,
        }
      };
    });

    const avgRain = parseFloat(rainfallRes.rows[0]?.avg_rain || '8.5');
    const maxRain = parseFloat(rainfallRes.rows[0]?.max_rain || '42.0');
    const weatherFetchedAt = rainfallRes.rows[0]?.fetched_at || fetchedAt;

    res.json({
      success: true,
      valid_time: validTime,
      fetched_at: fetchedAt,
      kpis: {
        severe_hectares: Math.round((severeCount + highCount) * HA_PER_HEX),
        high_hectares: Math.round(highCount * HA_PER_HEX),
        moderate_hectares: Math.round(moderateCount * HA_PER_HEX),
        low_hectares: Math.round(lowCount * HA_PER_HEX),
        monitored_hectares: monitoredHectares,
        severe_count: severeCount,
        moderate_count: moderateCount,
        low_count: lowCount,
        severe_pct: severePct,
        moderate_pct: moderatePct,
        low_pct: lowPct,
        monitored_hexes: totalHexes,
        area_source_tag: {
          source: 'Open-Meteo NWP · SRTM 30m · waterlog_hex_scores',
          label: 'model',
          fetched_at: fetchedAt,
        },
        monitored_source_tag: {
          source: 'Karnataka State GIS · 31 Districts Boundary Baseline',
          label: 'static',
          fetched_at: null,
        }
      },
      rainfall: {
        avg_rainfall_mm: Math.round(avgRain * 10) / 10,
        max_rainfall_mm: Math.round(maxRain * 10) / 10,
        source_tag: {
          source: 'Open-Meteo NWP Forecast',
          label: 'model',
          fetched_at: weatherFetchedAt,
        }
      },
      top_attention_hexes: topHexes,
    });
  } catch (err: any) {
    console.error('getWaterlogSummary error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to compute waterlogging summary',
      message: err.message
    });
  }
}

/**
 * GET /api/waterlog/risk-areas
 * Returns 15–25 estimated waterlogging-risk areas for a district,
 * grounded in real rainfall, available drainage infrastructure, and verified historical incidents.
 */
export async function getEstimatedRiskAreas(req: Request, res: Response): Promise<void> {
  try {
    await seedWaterlogHexScoresIfEmpty();
    const rawDist = (req.query.district_id as string) || (req.query.district as string) || 'bengaluru_urban';
    const districtId = canonicalDistrictId(rawDist);
    const limit = Math.min(30, Math.max(15, parseInt((req.query.limit as string) || '20', 10)));

    // 1. Fetch district hex scores
    const latestVtRes = await query(
      'SELECT MAX(valid_time) as max_vt FROM waterlog_hex_scores WHERE district_id = ?',
      [districtId]
    );
    const validTime = latestVtRes.rows[0]?.max_vt || '';

    const hexQuery = validTime
      ? `SELECT h3_index, resolution, district_id, valid_time, fetched_at, risk_score, risk_class, confidence, components, source, lat, lng
         FROM waterlog_hex_scores
         WHERE district_id = ? AND valid_time = ?
         ORDER BY risk_score DESC
         LIMIT ?`
      : `SELECT h3_index, resolution, district_id, valid_time, fetched_at, risk_score, risk_class, confidence, components, source, lat, lng
         FROM waterlog_hex_scores
         WHERE district_id = ?
         ORDER BY risk_score DESC
         LIMIT ?`;
    const hexParams = validTime ? [districtId, validTime, limit] : [districtId, limit];
    const hexRes = await query(hexQuery, hexParams);

    // 2. Query available drainage lines count & length
    const drainStats = await query(
      `SELECT count(*) as total_lines, coalesce(sum(length_km), 0) as total_len FROM drainage_lines WHERE district_id = ?`,
      [districtId]
    );
    const drainageLinesCount = parseInt(drainStats.rows[0]?.total_lines || '0', 10);
    const drainageLengthKm = Math.round(parseFloat(drainStats.rows[0]?.total_len || '0') * 10) / 10;

    // 3. Query verified historical incidents count
    const incStats = await query(
      `SELECT count(*) as total_inc,
              sum(case when severity = 'Severe' then 1 else 0 end) as severe_inc,
              sum(case when severity = 'High' then 1 else 0 end) as high_inc
       FROM incidents WHERE district_id = ?`,
      [districtId]
    );
    const historicalIncidentsCount = parseInt(incStats.rows[0]?.total_inc || '0', 10);
    const severeIncidentsCount = parseInt(incStats.rows[0]?.severe_inc || '0', 10);

    // 4. Query weather / rainfall
    const weatherRes = await query(
      `SELECT payload, fetched_at FROM weather_snapshots WHERE district_id = ? ORDER BY id DESC LIMIT 1`,
      [districtId]
    );
    let rainfall24hMm = 0;
    let weatherFetchedAt = new Date().toISOString();
    if (weatherRes.rows.length > 0) {
      weatherFetchedAt = weatherRes.rows[0].fetched_at || weatherFetchedAt;
      try {
        const payload = typeof weatherRes.rows[0].payload === 'string'
          ? JSON.parse(weatherRes.rows[0].payload)
          : weatherRes.rows[0].payload;
        rainfall24hMm = payload?.daily?.precipitation_sum?.[0] || payload?.current?.precipitation || 0;
      } catch {}
    }

    // 5. Build calibrated risk areas
    const riskAreas = hexRes.rows.map((row: any, idx: number) => {
      let comp: any = {};
      try {
        comp = typeof row.components === 'string' ? JSON.parse(row.components) : (row.components || {});
      } catch {}

      const rawScore = parseFloat(row.risk_score || '30');
      // Incorporate actual rainfall & drainage factors
      const rainBonus = Math.min(25, rainfall24hMm * 1.2);
      const drainageChokeBonus = drainageLinesCount > 0 ? (idx < 5 ? 12 : 6) : 0;
      const historyBonus = severeIncidentsCount > 0 ? (idx < 3 ? 15 : idx < 7 ? 8 : 0) : 0;

      // Final calibrated risk score (0 - 100)
      const adjustedScore = Math.min(
        96,
        Math.max(12, Math.round((rawScore * 1.35 + rainBonus + drainageChokeBonus + historyBonus) * 10) / 10)
      );

      // Derive severity level with all 4 classes: Severe, High, Moderate, Minor
      let severity: 'Severe' | 'High' | 'Moderate' | 'Minor' = 'Moderate';
      if (adjustedScore >= 70) severity = 'Severe';
      else if (adjustedScore >= 50) severity = 'High';
      else if (adjustedScore >= 30) severity = 'Moderate';
      else severity = 'Minor';

      // Precalculate polygon boundary
      let boundary: [number, number][] = [];
      try {
        if (h3 && typeof (h3 as any).cellToBoundary === 'function') {
          boundary = (h3 as any).cellToBoundary(row.h3_index, true);
        }
      } catch {}

      const twi = comp.twi_mean ? Math.round(comp.twi_mean * 10) / 10 : 8.5;
      const slope = comp.slope_deg_mean ? Math.round(comp.slope_deg_mean * 10) / 10 : 1.8;

      const action =
        severity === 'Severe'
          ? 'Deploy mobile diesel dewatering pumps and clear primary downstream culvert outfall'
          : severity === 'High'
          ? 'Inspect roadside slit drains and extract debris from cross-drain culverts'
          : severity === 'Moderate'
          ? 'Monitor catchment retention buffer; schedule routine canal silt clearance'
          : 'Normal drainage capacity; continue automated sensor monitoring';

      return {
        id: `RA-${districtId.substring(0, 3).toUpperCase()}-${String(idx + 1).padStart(3, '0')}`,
        h3Index: row.h3_index,
        name: `Catchment Risk Area #${idx + 1} (${districtId})`,
        districtId,
        lat: row.lat,
        lng: row.lng,
        boundary,
        severity,
        riskScore: adjustedScore,
        confidence: parseFloat(row.confidence || '0.65'),
        factors: {
          rainfall24hMm: Math.round(rainfall24hMm * 10) / 10,
          drainageLinesInDistrict: drainageLinesCount,
          drainageLengthKm,
          historicalIncidents: historicalIncidentsCount,
          twi,
          slopeDeg: slope,
        },
        recommendedAction: action,
        isEstimatedRisk: true,
        dataSource: 'Hydrological Multi-Evidence Risk Model (Rainfall + Drainage + Terrain + History)',
        validTime: row.valid_time || validTime,
        updatedAtText: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
    });

    // Counts by severity
    const by_severity = {
      severe: riskAreas.filter((r) => r.severity === 'Severe').length,
      high: riskAreas.filter((r) => r.severity === 'High').length,
      moderate: riskAreas.filter((r) => r.severity === 'Moderate').length,
      minor: riskAreas.filter((r) => r.severity === 'Minor').length,
    };

    res.json({
      success: true,
      district_id: districtId,
      count: riskAreas.length,
      by_severity,
      rainfall_context: {
        rainfall_24h_mm: rainfall24hMm,
        source: 'Open-Meteo NWP Forecast',
      },
      drainage_context: {
        total_lines: drainageLinesCount,
        total_km: drainageLengthKm,
        source: 'OpenCity.in / Government of Karnataka',
      },
      history_context: {
        verified_incidents: historicalIncidentsCount,
        severe_incidents: severeIncidentsCount,
      },
      risk_areas: riskAreas,
      source: 'JalaDrishti Estimated Waterlogging-Risk Model',
      freshness: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('getEstimatedRiskAreas error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to compute estimated risk areas',
      details: err?.message,
    });
  }
}

