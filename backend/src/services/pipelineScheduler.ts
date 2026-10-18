import { districtsService } from './districtsService.js';
import { openMeteoIngestionService } from './openMeteoIngestionService.js';
import { riskModelService } from './riskModelService.js';
import { observedRainfallService } from './adapters/observedRainfallService.js';
import { staticInputsService } from './staticInputsService.js';
import { sseBus } from '../controllers/sseController.js';

export class PipelineScheduler {
  private weatherInterval: NodeJS.Timeout | null = null;
  private rainfallInterval: NodeJS.Timeout | null = null;
  private isInitialized: boolean = false;

  public async start(): Promise<void> {
    if (this.isInitialized) return;
    this.isInitialized = true;

    console.log('[*] Initializing JalaDrishti Live Data Pipeline & Cache...');

    try {
      // 1. Verify 31 Karnataka districts and seed H3 resolution 7 district_hexes
      const districtCheck = districtsService.verifyDistrictCount();
      console.log(`[+] Verified Karnataka district boundaries: ${districtCheck.count} districts (Valid: ${districtCheck.isValid})`);
      
      const seedResult = await districtsService.ensureDistrictHexesSeeded();
      if (seedResult.seeded) {
        console.log(`[+] Seeded ${seedResult.totalHexes} H3 Res 7 hexes into district_hexes.`);
      } else {
        console.log(`[*] district_hexes already populated with ${seedResult.totalHexes} cells.`);
      }

      // 2. Compute static geophysical baselines (SRTM DEM, SoilGrids, ESA WorldCover)
      await staticInputsService.computeAndCacheStaticBaselines(500);

      // 3. Kick off immediate initial forecast ingestion
      console.log('[*] Triggering initial Open-Meteo forecast ingestion cycle...');
      this.runIngestion();

      // 4. Kick off immediate observed rainfall cycle
      observedRainfallService.runObservedRainfallCycle().catch((err) => {
        console.warn('[!] Initial rainfall check encountered error:', err.message);
      });

      // 5. Schedule forecast ingestion every 15 minutes (900,000 ms)
      this.weatherInterval = setInterval(() => {
        console.log('[*] [Scheduler] Triggering 15-minute Open-Meteo forecast ingestion...');
        this.runIngestion();
      }, 15 * 60 * 1000);

      // 6. Schedule observed rainfall every 30 minutes (1,800,000 ms)
      this.rainfallInterval = setInterval(() => {
        console.log('[*] [Scheduler] Triggering 30-minute observed rainfall check...');
        observedRainfallService.runObservedRainfallCycle().catch((err) => {
          console.error('[-] Observed rainfall interval error:', err.message);
          sseBus.emit('status-changed', { source: 'observed_rainfall', status: 'error', ts: new Date().toISOString() });
        });
      }, 30 * 60 * 1000);

      console.log('[+] JalaDrishti Data Pipeline Schedulers active: 15-min forecast ingestion & 30-min observed rainfall.');
    } catch (err: any) {
      console.error('[-] Failed to initialize PipelineScheduler:', err.message);
    }
  }

  private async runIngestion(): Promise<void> {
    try {
      const result = await openMeteoIngestionService.ingestAllDistricts();
      const ts = new Date().toISOString();
      if (result.successCount === 0) {
        sseBus.emit('status-changed', { source: 'open_meteo', status: 'error', ts });
        return;
      }

      try {
        const scoringRun = await riskModelService.computeAllDistricts();
        sseBus.emit('scores-updated', {
          run_id: scoringRun.run_id,
          valid_time: scoringRun.created_at,
          rows: scoringRun.total_rows,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error('[-] Waterlogging score recomputation failed:', message);
        sseBus.emit('status-changed', { source: 'waterlog_hex_scores', status: 'error', reason: message, ts });
      }

      sseBus.emit('status-changed', {
        source: 'open_meteo',
        status: result.failureCount > 0 ? 'error' : 'live',
        ts,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[-] Forecast ingestion interval error:', message);
      sseBus.emit('status-changed', { source: 'open_meteo', status: 'error', ts: new Date().toISOString() });
    }
  }

  public stop(): void {
    if (this.weatherInterval) clearInterval(this.weatherInterval);
    if (this.rainfallInterval) clearInterval(this.rainfallInterval);
    this.weatherInterval = null;
    this.rainfallInterval = null;
    this.isInitialized = false;
    console.log('[*] PipelineScheduler stopped.');
  }
}

export const pipelineScheduler = new PipelineScheduler();
