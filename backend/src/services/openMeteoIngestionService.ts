import axios from 'axios';
import { districtsService } from './districtsService.js';
import { query } from '../db/index.js';
import { redisService } from './redisService.js';

interface IngestionStatus {
  source: string;
  name: string;
  status: 'live' | 'stale' | 'error';
  fetched_at: string | null;
  age_seconds: number | null;
  row_count: number;
  reason: string;
}

export class OpenMeteoIngestionService {
  private lastFetchedAt: Date | null = null;
  private lastError: string | null = null;
  private isIngesting: boolean = false;
  private failureCount: number = 0;

  public async getStatus(): Promise<IngestionStatus> {
    const now = Date.now();
    let rowCount = 0;
    let statusReadError: string | null = null;
    try {
      const res = await query('SELECT COUNT(*) as count, MAX(fetched_at) as latest FROM weather_snapshots');
      rowCount = Number(res.rows[0]?.count || 0);
      if (res.rows[0]?.latest) {
        this.lastFetchedAt = new Date(res.rows[0].latest);
      }
    } catch (err) {
      statusReadError = err instanceof Error ? err.message : String(err);
    }

    const ageSeconds = this.lastFetchedAt
      ? Math.max(0, Math.round((now - this.lastFetchedAt.getTime()) / 1000))
      : null;
    const status: IngestionStatus['status'] = statusReadError || this.lastError
      ? 'error'
      : ageSeconds !== null && ageSeconds <= 1800
        ? 'live'
        : 'stale';
    const hasApiKey = Boolean(process.env.OPEN_METEO_API_KEY);
    const reason = statusReadError
      ? `Unable to read stored forecast status: ${statusReadError}`
      : this.lastError
        ? `Ingestion error: ${this.lastError}; previous good snapshots are preserved.`
        : this.lastFetchedAt
          ? `Open-Meteo forecasts stored (${hasApiKey ? 'API key configured' : 'public tier; no key required'}).`
          : 'Waiting for the first successful Open-Meteo forecast fetch.';

    return {
      source: 'open_meteo',
      name: 'Open-Meteo NWP Forecast (current, hourly, daily)',
      status,
      fetched_at: this.lastFetchedAt ? this.lastFetchedAt.toISOString() : null,
      age_seconds: ageSeconds,
      row_count: rowCount,
      reason,
    };
  }

  public async getRowCount(): Promise<number> {
    try {
      const res = await query('SELECT COUNT(*) as count FROM weather_snapshots');
      return parseInt(res.rows[0]?.count || '0', 10);
    } catch {
      return 0;
    }
  }

  /**
   * Fetches weather for a single coordinate with retry and exponential backoff
   */
  public async fetchOpenMeteoWithBackoff(lat: number, lng: number, maxRetries: number = 3): Promise<any> {
    const baseUrl = process.env.OPEN_METEO_BASE_URL || 'https://api.open-meteo.com/v1';
    let url = `${baseUrl}/forecast?latitude=${lat.toFixed(4)}&longitude=${lng.toFixed(4)}` +
      `&current=precipitation,temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m,cloud_cover` +
      `&minutely_15=precipitation` +
      `&hourly=precipitation,precipitation_probability,temperature_2m,relative_humidity_2m,dew_point_2m,apparent_temperature,weather_code,surface_pressure,visibility,wind_speed_10m,wind_direction_10m,uv_index,et0_fao_evapotranspiration` +
      `&daily=precipitation_sum,precipitation_probability_max,temperature_2m_max,temperature_2m_min,weather_code,uv_index_max,et0_fao_evapotranspiration` +
      `&past_days=2&forecast_days=8&timezone=Asia%2FKolkata`;

    if (process.env.OPEN_METEO_API_KEY) {
      url += `&apikey=${process.env.OPEN_METEO_API_KEY}`;
    }

    let delay = 1000;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await axios.get(url, { timeout: 12000 });
        return response.data;
      } catch (err: any) {
        if (attempt === maxRetries) {
          throw new Error(`Open-Meteo request failed after ${maxRetries} attempts: ${err.message}`);
        }
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2; // exponential backoff
      }
    }
  }

  /**
   * Ingest a single district on demand and store snapshot in database & cache
   */
  public async ingestSingleDistrict(districtId: string): Promise<any> {
    const districts = districtsService.getDistrictsWithCentroids();
    const normalized = districtId.toLowerCase().trim().replace(/[\s-]+/g, '_');
    const district = districts.find(d => d.district_id === normalized) || districts[0];
    if (!district) throw new Error(`District not found: ${districtId}`);

    const weatherData = await this.fetchOpenMeteoWithBackoff(district.center_lat, district.center_lng);
    if (!weatherData?.current || !weatherData?.hourly || !weatherData?.daily) {
      throw new Error(`Invalid response structure for district ${district.district_id}`);
    }

    const modelTime = weatherData.current.time || weatherData.hourly.time?.[0];
    const offsetSeconds = Number(weatherData.utc_offset_seconds || 0);
    const hasTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(modelTime);
    const parsedModelTime = hasTimezone
      ? new Date(modelTime)
      : new Date(Date.parse(`${modelTime}Z`) - offsetSeconds * 1000);

    const fetchedAt = new Date().toISOString();
    await query(
      `INSERT INTO weather_snapshots (district_id, fetched_at, model_valid_time, source, payload)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        district.district_id,
        fetchedAt,
        parsedModelTime.toISOString(),
        'open-meteo',
        weatherData,
      ]
    );

    await redisService.set(
      `weather:snapshot:${district.district_id}`,
      {
        district_id: district.district_id,
        district_name: district.district_name,
        fetched_at: fetchedAt,
        data: weatherData,
      },
      1800
    );

    return { weatherData, fetchedAt, modelValidTime: parsedModelTime.toISOString() };
  }

  /**
   * Ingests weather forecasts for all 31 districts.
   * Invariant: Never overwrites last good data with an error.
   */
  public async ingestAllDistricts(): Promise<{ successCount: number; failureCount: number }> {
    if (this.isIngesting) {
      console.log('[*] Open-Meteo ingestion already in progress, skipping overlapping run.');
      return { successCount: 0, failureCount: 0 };
    }

    this.isIngesting = true;
    let successCount = 0;
    let failureCount = 0;

    try {
      const districts = districtsService.getDistrictsWithCentroids();
      console.log(`[*] Starting Open-Meteo 15-min forecast ingestion for all ${districts.length} districts...`);

      for (const district of districts) {
        try {
          const weatherData = await this.fetchOpenMeteoWithBackoff(district.center_lat, district.center_lng);
          if (!weatherData?.current || !weatherData?.hourly || !weatherData?.daily) {
            throw new Error(`Invalid response structure for district ${district.district_id}`);
          }

          const modelTime = weatherData.current.time || weatherData.hourly.time?.[0];
          if (typeof modelTime !== 'string') {
            throw new Error(`Missing model valid time for district ${district.district_id}`);
          }
          const offsetSeconds = Number(weatherData.utc_offset_seconds || 0);
          const hasTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(modelTime);
          const parsedModelTime = hasTimezone
            ? new Date(modelTime)
            : new Date(Date.parse(`${modelTime}Z`) - offsetSeconds * 1000);
          if (Number.isNaN(parsedModelTime.getTime())) {
            throw new Error(`Invalid model valid time for district ${district.district_id}`);
          }

          const fetchedAt = new Date().toISOString();
          await query(
            `INSERT INTO weather_snapshots (district_id, fetched_at, model_valid_time, source, payload)
             VALUES ($1, $2, $3, $4, $5)`,
            [
              district.district_id,
              fetchedAt,
              parsedModelTime.toISOString(),
              'open-meteo',
              weatherData,
            ]
          );

          await redisService.set(
            `weather:snapshot:${district.district_id}`,
            {
              district_id: district.district_id,
              district_name: district.district_name,
              fetched_at: fetchedAt,
              data: weatherData,
            },
            1800
          );

          this.lastFetchedAt = new Date(fetchedAt);
          successCount++;
          await new Promise((r) => setTimeout(r, 150));
        } catch (err) {
          failureCount++;
          const message = err instanceof Error ? err.message : String(err);
          console.warn(`[!] Forecast ingestion error for ${district.district_name} (${district.district_id}): ${message}. Previous good data preserved.`);
        }
      }

      if (successCount > 0) {
        this.lastError = failureCount > 0 ? `${failureCount}/${districts.length} districts had transient failures` : null;
        this.failureCount = 0;
        console.log(`[+] Open-Meteo ingestion finished: ${successCount} districts updated successfully.`);
      } else {
        this.failureCount++;
        this.lastError = `All ${districts.length} district requests failed`;
        console.error('[-] Open-Meteo ingestion completely failed for this cycle. Last good data was NOT overwritten.');
      }
    } catch (err) {
      this.lastError = err instanceof Error ? err.message : String(err);
      throw err;
    } finally {
      this.isIngesting = false;
    }

    return { successCount, failureCount };
  }
}

export const openMeteoIngestionService = new OpenMeteoIngestionService();
