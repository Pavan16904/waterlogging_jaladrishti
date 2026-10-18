import { Request, Response } from 'express';
import { openMeteoIngestionService } from '../services/openMeteoIngestionService.js';
import { observedRainfallService } from '../services/adapters/observedRainfallService.js';
import { riverLevelSource } from '../services/adapters/riverLevelSource.js';
import { sentinelFloodService } from '../services/adapters/sentinelFloodService.js';
import { mqttSensorService } from '../services/adapters/mqttSensorService.js';
import { redisService } from '../services/redisService.js';
import { activeDriver } from '../db/index.js';

export async function getDataPipelineStatus(req: Request, res: Response) {
  try {
    const [
      openMeteoStatus,
      gpmStatus,
      ksndmcStatus,
      imdStatus,
      riverStatus,
      mqttStatus,
    ] = await Promise.all([
      openMeteoIngestionService.getStatus(),
      observedRainfallService.getGpmStatus(),
      observedRainfallService.getKsndmcStatus(),
      observedRainfallService.getImdStatus(),
      riverLevelSource.getStatus(),
      mqttSensorService.getStatus(),
    ]);

    const sources = [openMeteoStatus, gpmStatus, ksndmcStatus, imdStatus, riverStatus, mqttStatus].map((source) => ({
      ...source,
      status: source.status === 'unconfigured' ? 'not connected' : source.status,
    }));

    const liveCount = sources.filter((s) => s.status === 'live').length;
    const notConnectedCount = sources.filter((s) => s.status === 'not connected').length;
    const errorCount = sources.filter((s) => s.status === 'error').length;
    const staleCount = sources.filter((s) => s.status === 'stale').length;

    res.json({
      timestamp: new Date().toISOString(),
      summary: {
        total_sources: sources.length,
        live: liveCount,
        not_connected: notConnectedCount,
        stale: staleCount,
        error: errorCount,
        database_driver: activeDriver,
        redis: redisService.getStatus(),
      },
      sources,
    });
  } catch (err: any) {
    res.status(500).json({
      error: 'Failed to retrieve data pipeline status',
      message: err.message,
    });
  }
}

/**
 * Event-triggered Copernicus Sentinel-1 SAR flood check for a district
 */
export async function triggerSatelliteFloodCheck(req: Request, res: Response) {
  try {
    const districtId = req.params.districtId;
    if (!districtId) {
      return res.status(400).json({ error: 'districtId path parameter is required' });
    }

    const result = await sentinelFloodService.checkDistrictFloodExtent(districtId);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: 'Sentinel-1 flood check failed', message: err.message });
  }
}

/**
 * Trigger immediate forecast ingestion across all 31 districts
 */
export async function triggerForecastIngestion(req: Request, res: Response) {
  try {
    const result = await openMeteoIngestionService.ingestAllDistricts();
    res.json({
      status: 'completed',
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Ingestion failed', message: err.message });
  }
}
