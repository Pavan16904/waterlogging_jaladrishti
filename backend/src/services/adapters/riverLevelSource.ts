import axios from 'axios';
import { query } from '../../db/index.js';

export interface RiverLevelReading {
  station_id: string;
  station_name: string;
  river_name: string;
  basin: string;
  district_id: string;
  water_level_m: number;
  danger_level_m: number;
  warning_level_m: number;
  observed_at: string;
  source: string;
}

export class RiverLevelSource {
  private lastFetchedAt: Date | null = null;
  private lastError: string | null = null;

  public async getStatus() {
    const hasKey = Boolean(process.env.INDIA_WRIS_API_KEY);
    let rowCount = 0;
    try {
      const res = await query("SELECT COUNT(*) as count FROM river_levels WHERE source LIKE '%India-WRIS%' OR source LIKE '%CWC%'");
      rowCount = parseInt(res.rows[0]?.count || '0', 10);
    } catch {}

    if (!hasKey) {
      return {
        source: 'cwc_india_wris',
        name: 'India-WRIS / Central Water Commission River Stages (Tungabhadra)',
        status: 'unconfigured' as const,
        fetched_at: null,
        age_seconds: null,
        row_count: rowCount,
        reason: 'INDIA_WRIS_API_KEY not configured. Requires institutional data exchange approval on Central Water Commission / India-WRIS portal (indiawris.gov.in).',
      };
    }

    const now = Date.now();
    const ageSeconds = this.lastFetchedAt ? Math.round((now - this.lastFetchedAt.getTime()) / 1000) : null;

    const statusVal: 'live' | 'stale' | 'unconfigured' | 'error' = this.lastError
      ? 'error'
      : (ageSeconds !== null && ageSeconds < 3600 ? 'live' : 'stale');

    return {
      source: 'cwc_india_wris',
      name: 'India-WRIS / Central Water Commission River Stages (Tungabhadra)',
      status: statusVal,
      fetched_at: this.lastFetchedAt ? this.lastFetchedAt.toISOString() : null,
      age_seconds: ageSeconds,
      row_count: rowCount,
      reason: this.lastError || 'Live CWC Tungabhadra hydro-telemetry operational.',
    };
  }

  /**
   * Fetches river levels from India-WRIS / CWC telemetry endpoints when configured
   */
  public async fetchRiverLevels(): Promise<RiverLevelReading[]> {
    if (!process.env.INDIA_WRIS_API_KEY) {
      // Unconfigured -- no fabricated data
      return [];
    }

    try {
      const apiKey = process.env.INDIA_WRIS_API_KEY;
      const resp = await axios.get('https://indiawris.gov.in/api/v1/telemetry/rivers/tungabhadra', {
        headers: { 'X-API-KEY': apiKey },
        timeout: 10000,
      });

      this.lastFetchedAt = new Date();
      this.lastError = null;

      const readings: RiverLevelReading[] = resp.data?.readings || [];
      const now = new Date().toISOString();

      for (const r of readings) {
        await query(
          `INSERT INTO river_levels (station_id, station_name, river_name, basin, district_id, water_level_m, danger_level_m, warning_level_m, observed_at, fetched_at, source)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            r.station_id,
            r.station_name,
            r.river_name || 'Tungabhadra',
            r.basin || 'Krishna-Tungabhadra',
            r.district_id || 'ballari',
            r.water_level_m,
            r.danger_level_m,
            r.warning_level_m,
            r.observed_at,
            now,
            'India-WRIS/CWC',
          ]
        );
      }

      return readings;
    } catch (err: any) {
      this.lastError = err.message;
      console.warn(`[!] India-WRIS river level ingestion failed: ${err.message}`);
      return [];
    }
  }
}

export const riverLevelSource = new RiverLevelSource();
