import assert from 'assert';
import { initializeDatabase, query } from '../db/index.js';
import { riskModelService } from '../services/riskModelService.js';
import { districtsService } from '../services/districtsService.js';

async function runPhase2Tests() {
  console.log('====================================================');
  console.log('   JalaDrishti AI - Phase 2 Risk Model Test Suite   ');
  console.log('====================================================\n');

  await initializeDatabase();
  const { config, hash } = riskModelService.loadConfig();

  // Test 1: Config loading & hashing
  console.log('--- Test 1: Configuration & Version Hash ---');
  assert.ok(hash && hash.length === 64, 'Config hash must be 64-char SHA-256');
  assert.strictEqual(config.version, '1.0.0', 'Config version must match 1.0.0');
  console.log(`[PASS] Config verified: version ${config.version}, hash: ${hash.substring(0, 12)}...`);

  // Test 2: Unit test: Zero rainfall, zero TWI, good drainage vs Heavy rainfall, high TWI, poor drainage
  console.log('\n--- Test 2: Low-Risk Extreme vs High-Risk Extreme ---');
  const lowRiskHex = riskModelService.computeHexRiskScore(
    {
      rainfall_3d_mm: 0.0,
      rainfall_observed_3d_mm: null,
      twi: 2.0, // lowest TWI
      slope_deg: 20.0, // steep slope
      drainage_class: 5, // excessive drainage
      whc_mm: 180.0,
      cropland_fraction: 0.85,
      forecast_age_minutes: 10,
      ndwi_prev: null,
    },
    config,
    config.version,
    hash
  );

  const highRiskHex = riskModelService.computeHexRiskScore(
    {
      rainfall_3d_mm: 150.0, // extreme rainfall
      rainfall_observed_3d_mm: null,
      twi: 18.0, // highest TWI
      slope_deg: 0.5, // flat terrain
      drainage_class: 1, // very poor drainage
      whc_mm: 120.0,
      cropland_fraction: 0.85,
      forecast_age_minutes: 10,
      ndwi_prev: null,
    },
    config,
    config.version,
    hash
  );

  console.log(`Low-risk scenario score: ${lowRiskHex.risk_score} (class: ${lowRiskHex.risk_class})`);
  console.log(`High-risk scenario score: ${highRiskHex.risk_score} (class: ${highRiskHex.risk_class})`);

  assert.ok(lowRiskHex.risk_score <= 25.0, 'Zero-rain, good-drainage hex must score Low');
  assert.strictEqual(lowRiskHex.risk_class, 'Low');
  assert.ok(highRiskHex.risk_score >= 75.0, 'Heavy-rain, poor-drainage, high-TWI hex must score Severe');
  assert.strictEqual(highRiskHex.risk_class, 'Severe');
  console.log('[PASS] Low-risk and high-risk extremes validated.');

  // Test 3: Monotonicity: Increasing rainfall never decreases risk_score
  console.log('\n--- Test 3: Monotonicity with Respect to Rainfall ---');
  const rainLevels = [0, 10, 25, 50, 75, 100, 125, 150];
  let prevScore = -1;
  for (const rain of rainLevels) {
    const res = riskModelService.computeHexRiskScore(
      {
        rainfall_3d_mm: rain,
        rainfall_observed_3d_mm: null,
        twi: 10.0,
        slope_deg: 2.0,
        drainage_class: 3,
        whc_mm: 140.0,
        cropland_fraction: 0.85,
        forecast_age_minutes: 10,
        ndwi_prev: null,
      },
      config,
      config.version,
      hash
    );
    console.log(`Rainfall: ${rain}mm -> Risk Score: ${res.risk_score}`);
    assert.ok(res.risk_score >= prevScore, `Monotonicity violated: ${res.risk_score} < ${prevScore}`);
    prevScore = res.risk_score;
  }
  console.log('[PASS] Monotonicity confirmed: risk strictly non-decreasing with rainfall.');

  // Test 4: Missing observed input: score computed, confidence lower, penalty listed
  console.log('\n--- Test 4: Missing Observed Input Penalty & Confidence ---');
  const withoutObserved = riskModelService.computeHexRiskScore(
    {
      rainfall_3d_mm: 45.0,
      rainfall_observed_3d_mm: null,
      twi: 10.0,
      slope_deg: 2.0,
      drainage_class: 3,
      whc_mm: 140.0,
      cropland_fraction: 0.85,
      forecast_age_minutes: 10,
      ndwi_prev: null,
    },
    config,
    config.version,
    hash
  );

  const withObserved = riskModelService.computeHexRiskScore(
    {
      rainfall_3d_mm: 45.0,
      rainfall_observed_3d_mm: 42.0,
      twi: 10.0,
      slope_deg: 2.0,
      drainage_class: 3,
      whc_mm: 140.0,
      cropland_fraction: 0.85,
      forecast_age_minutes: 10,
      ndwi_prev: null,
    },
    config,
    config.version,
    hash
  );

  console.log(`With observed rain confidence: ${withObserved.confidence}`);
  console.log(`Without observed rain confidence: ${withoutObserved.confidence}`);
  console.log(`Penalties listed:`, withoutObserved.components.penalties);

  assert.ok(withoutObserved.confidence < withObserved.confidence, 'Confidence must drop when observed rain is missing');
  assert.ok(
    withoutObserved.components.penalties.some((p: string) => p.includes('observed_rainfall_missing')),
    'Penalties list must contain observed_rainfall_missing'
  );
  console.log('[PASS] Missing observed input handling validated.');

  // Test 5: Missing static input: confidence drops by 0.6 factor and hex is flagged
  console.log('\n--- Test 5: Missing Static Input Penalty & Flag ---');
  const missingStatic = riskModelService.computeHexRiskScore(
    {
      rainfall_3d_mm: 45.0,
      rainfall_observed_3d_mm: null,
      twi: null, // missing static
      slope_deg: null, // missing static
      drainage_class: null, // missing static
      whc_mm: null,
      cropland_fraction: 0.85,
      forecast_age_minutes: 10,
      ndwi_prev: null,
    },
    config,
    config.version,
    hash
  );

  console.log(`Missing static confidence: ${missingStatic.confidence}`);
  console.log(`Flags:`, missingStatic.components.flags);
  console.log(`Penalties:`, missingStatic.components.penalties);

  assert.ok(
    missingStatic.components.penalties.some((p: string) => p.includes('static_input_missing (x0.6)')),
    'Must list static_input_missing penalty factor 0.6'
  );
  assert.ok(
    missingStatic.components.flags.includes('static_inputs_incomplete'),
    'Must set static_inputs_incomplete flag'
  );
  console.log('[PASS] Missing static input penalty and flagging confirmed.');

  // Test 6: Full Run, Idempotency & 31-District Coverage
  console.log('\n--- Test 6: Execution, Coverage & Idempotency ---');
  await query('DELETE FROM waterlog_hex_scores');
  // First run with sample hexes
  const run1 = await riskModelService.computeAllDistricts({ sampleHexesPerDistrict: 25 });
  console.log(`Run 1 inserted ${run1.total_rows} rows across ${run1.districts_scored} districts.`);
  assert.strictEqual(run1.districts_scored, 31, 'All 31 districts must be scored');

  // Verify rows in DB
  const count1Res = await query('SELECT COUNT(*) as count FROM waterlog_hex_scores');
  const count1 = parseInt(count1Res.rows[0]?.count || '0', 10);
  console.log(`DB row count after Run 1: ${count1}`);

  // Re-run with same configuration to verify idempotency
  const run2 = await riskModelService.computeAllDistricts({ sampleHexesPerDistrict: 25 });
  const count2Res = await query('SELECT COUNT(*) as count FROM waterlog_hex_scores');
  const count2 = parseInt(count2Res.rows[0]?.count || '0', 10);
  console.log(`DB row count after Run 2 (Idempotency check): ${count2}`);

  assert.strictEqual(count1, count2, 'Idempotency failed: second run modified row count instead of replacing');
  console.log('[PASS] Idempotency confirmed: row count remained identical.');

  // Verify all 31 districts have rows
  const distCoverageRes = await query('SELECT COUNT(DISTINCT district_id) as count FROM waterlog_hex_scores');
  const coveredDistricts = parseInt(distCoverageRes.rows[0]?.count || '0', 10);
  assert.strictEqual(coveredDistricts, 31, 'All 31 districts must be represented in waterlog_hex_scores');
  console.log(`[PASS] 31-district coverage confirmed (${coveredDistricts}/31 districts present).`);

  // Verify audit log in risk_model_runs
  const auditRes = await query('SELECT * FROM risk_model_runs WHERE run_id = $1', [run1.run_id]);
  assert.strictEqual(auditRes.rows.length, 1, 'Audit record must exist in risk_model_runs');
  console.log(`[PASS] Audit record registered in risk_model_runs with hash ${auditRes.rows[0].config_hash.substring(0, 8)}...`);

  console.log('\n====================================================');
  console.log('   ALL PHASE 2 UNIT & INTEGRATION TESTS PASSED!    ');
  console.log('====================================================\n');
}

runPhase2Tests().then(() => {
  process.exit(0);
}).catch((err) => {
  console.error('\n[FAIL] Phase 2 tests failed:', err);
  process.exit(1);
});
