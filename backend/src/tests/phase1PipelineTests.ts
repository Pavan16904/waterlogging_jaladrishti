import assert from 'assert';
import { initializeDatabase, query } from '../db/index.js';
import { districtsService } from '../services/districtsService.js';
import { openMeteoIngestionService } from '../services/openMeteoIngestionService.js';
import { observedRainfallService } from '../services/adapters/observedRainfallService.js';
import { riverLevelSource } from '../services/adapters/riverLevelSource.js';
import { sentinelFloodService } from '../services/adapters/sentinelFloodService.js';
import { mqttSensorService } from '../services/adapters/mqttSensorService.js';
import { staticInputsService } from '../services/staticInputsService.js';

async function runPhase1Verification() {
  console.log('====================================================');
  console.log('   JalaDrishti AI - Phase 1 Pipeline Verification  ');
  console.log('====================================================\n');

  // 1. Initialize database & tables
  await initializeDatabase();

  // 2. Task 1: Verify 31 Karnataka districts
  console.log('\n--- Task 1: Districts & H3 Res 7 Cells ---');
  const districtCheck = districtsService.verifyDistrictCount();
  console.log(`District Count: ${districtCheck.count}`);
  assert.strictEqual(districtCheck.count, 31, 'Must have exactly 31 Karnataka districts');
  assert.strictEqual(districtCheck.isValid, true, 'Districts validation flag must be true');

  // Seed district_hexes
  const seedResult = await districtsService.ensureDistrictHexesSeeded();
  console.log(`district_hexes seeded: ${seedResult.seeded}, count: ${seedResult.totalHexes}`);
  assert.ok(seedResult.totalHexes > 1000, 'Must have thousands of H3 res 7 cells covering districts');

  // Verify district_hexes count from DB
  const dbHexCountRes = await query('SELECT COUNT(*) as count FROM district_hexes');
  const dbHexCount = parseInt(dbHexCountRes.rows[0]?.count || '0', 10);
  console.log(`Database district_hexes row count: ${dbHexCount}`);
  assert.ok(dbHexCount > 1000, 'district_hexes table must have seeded cells');

  // 3. Task 5: Static Inputs (SRTM DEM, SoilGrids, ESA WorldCover)
  console.log('\n--- Task 5: Static Terrain & Soil Inputs ---');
  const staticResult = await staticInputsService.computeAndCacheStaticBaselines(100);
  console.log(`Computed and cached static baselines for ${staticResult.updatedCount} cells`);
  const staticStatus = await staticInputsService.getStatus();
  console.log('Static inputs status:', staticStatus.status, 'computed rows:', staticStatus.row_count);
  assert.strictEqual(staticStatus.status, 'live');
  assert.ok(staticStatus.row_count > 0);

  // 4. Task 7: MQTT Sensor readings & health checks (stale & stuck)
  console.log('\n--- Task 7: Sensors & Device Health Verification ---');
  // Record test readings:
  // Normal device
  await mqttSensorService.recordReading({
    device_id: 'DEV_NORMAL_01',
    ts: new Date().toISOString(),
    value: 1.45,
    battery: 95,
    lat: 12.97,
    lon: 77.59,
  });

  // Stale device: ts 30 minutes ago
  const staleTime = new Date(Date.now() - 30 * 60 * 1000).toISOString();
  await mqttSensorService.recordReading({
    device_id: 'DEV_STALE_01',
    ts: staleTime,
    value: 2.10,
    battery: 40,
    lat: 12.98,
    lon: 77.60,
  });

  // Stuck device: 6 identical readings
  for (let i = 0; i < 6; i++) {
    await mqttSensorService.recordReading({
      device_id: 'DEV_STUCK_01',
      ts: new Date(Date.now() - (6 - i) * 60 * 1000).toISOString(),
      value: 3.50,
      battery: 88,
      lat: 12.99,
      lon: 77.61,
    });
  }

  const health = await mqttSensorService.evaluateDeviceHealth();
  const normalDev = health.find(d => d.device_id === 'DEV_NORMAL_01');
  const staleDev = health.find(d => d.device_id === 'DEV_STALE_01');
  const stuckDev = health.find(d => d.device_id === 'DEV_STUCK_01');

  console.log('Device DEV_NORMAL_01:', normalDev);
  console.log('Device DEV_STALE_01:', staleDev);
  console.log('Device DEV_STUCK_01:', stuckDev);

  assert.strictEqual(normalDev?.is_stale, false, 'DEV_NORMAL_01 should NOT be stale');
  assert.strictEqual(staleDev?.is_stale, true, 'DEV_STALE_01 MUST be flagged stale (>15 min)');
  assert.strictEqual(stuckDev?.is_stuck, true, 'DEV_STUCK_01 MUST be flagged stuck (6 identical values)');

  // 5. Tasks 3, 4, 6: Unconfigured source behavior
  console.log('\n--- Tasks 3, 4, 6: Unconfigured Sources Check ---');
  const gpmStatus = await observedRainfallService.getGpmStatus();
  const ksndmcStatus = await observedRainfallService.getKsndmcStatus();
  const imdStatus = await observedRainfallService.getImdStatus();
  const cwcStatus = await riverLevelSource.getStatus();
  const sentinelStatus = await sentinelFloodService.getStatus();

  console.log('NASA GPM Status:', gpmStatus.status, 'Reason:', gpmStatus.reason);
  console.log('KSNDMC Status:', ksndmcStatus.status, 'Reason:', ksndmcStatus.reason);
  console.log('IMD Status:', imdStatus.status, 'Reason:', imdStatus.reason);
  console.log('CWC Tungabhadra Status:', cwcStatus.status, 'Reason:', cwcStatus.reason);
  console.log('Copernicus Sentinel-1 Status:', sentinelStatus.status, 'Reason:', sentinelStatus.reason);

  assert.strictEqual(gpmStatus.status, 'unconfigured');
  assert.strictEqual(ksndmcStatus.status, 'unconfigured');
  assert.strictEqual(imdStatus.status, 'unconfigured');
  assert.strictEqual(cwcStatus.status, 'unconfigured');
  assert.strictEqual(sentinelStatus.status, 'unconfigured');

  // 6. Task 2: Forecast Ingestion for sample district
  console.log('\n--- Task 2: Open-Meteo Forecast Ingestion Check ---');
  // Test forecast ingestion for first district
  const districts = districtsService.getDistrictsWithCentroids();
  console.log(`Total districts with centroids: ${districts.length}`);
  const sampleDistrict = districts[0];
  console.log(`Sample district: ${sampleDistrict.district_name} (${sampleDistrict.district_id}) at [${sampleDistrict.center_lat.toFixed(4)}, ${sampleDistrict.center_lng.toFixed(4)}]`);

  // Run full ingestion or test single
  console.log('Ingesting Open-Meteo forecast for districts...');
  const ingestRes = await openMeteoIngestionService.ingestAllDistricts();
  console.log(`Ingested: ${ingestRes.successCount} succeeded, ${ingestRes.failureCount} failed`);
  assert.ok(ingestRes.successCount > 0, 'Must successfully ingest at least 1 district');

  const snapshotCount = await openMeteoIngestionService.getRowCount();
  console.log(`weather_snapshots row count: ${snapshotCount}`);
  assert.ok(snapshotCount > 0, 'weather_snapshots table must contain stored payloads');

  const openMeteoStatus = await openMeteoIngestionService.getStatus();
  console.log('Open-Meteo Status:', openMeteoStatus.status, 'Age (s):', openMeteoStatus.age_seconds);
  assert.strictEqual(openMeteoStatus.status, 'live');

  console.log('\n[PASS] All Phase 1 verification checks succeeded!\n');
}

runPhase1Verification().then(() => {
  process.exit(0);
}).catch((err) => {
  console.error('\n[FAIL] Phase 1 verification failed:', err);
  process.exit(1);
});
