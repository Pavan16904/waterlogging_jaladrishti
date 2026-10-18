import {
  BALLARI_DRAINAGE_ASSETS,
  calculateDrainageSummary,
  getDrainageAssetsForDistrict,
} from '../data/karnatakaDrainageAssets';
import { KARNATAKA_31_DISTRICTS_WEATHER } from '../data/karnatakaDistrictsWeather';

declare const process: any;

console.log('====================================================');
console.log('  JALADRISHTI AI — DRAINAGE ADVISORY AUTOMATED TESTS');
console.log('====================================================\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  [PASS] ${testName}`);
  } else {
    console.error(`  [FAIL] ${testName} ${detail ? `(${detail})` : ''}`);
    process.exitCode = 1;
  }
}

// ── Test 1: Ballari Baseline Total Assets ──
assert(
  BALLARI_DRAINAGE_ASSETS.length === 24,
  'Ballari baseline contains exactly 24 assets',
  `Found ${BALLARI_DRAINAGE_ASSETS.length}`
);

// ── Test 2: Summary Calculation Metrics (Matching reference screenshot) ──
const summary = calculateDrainageSummary(BALLARI_DRAINAGE_ASSETS);

assert(
  summary.totalAssets === 24,
  'Summary reports 24 total drainage assets',
  `Found ${summary.totalAssets}`
);

assert(
  summary.reportedIssues === 5,
  'Summary reports 5 reported issues',
  `Found ${summary.reportedIssues}`
);

assert(
  summary.underMaintenance === 2,
  'Summary reports 2 assets under maintenance',
  `Found ${summary.underMaintenance}`
);

assert(
  summary.functionalAssets === 17,
  'Summary reports 17 functional assets',
  `Found ${summary.functionalAssets}`
);

assert(
  Math.abs(summary.totalLengthKm - 38.4) < 0.2,
  'Summary reports ~38.4 km total drainage length',
  `Found ${summary.totalLengthKm} km`
);

// ── Test 3: Network Breakdown ──
const nb = summary.networkBreakdown;
assert(
  nb.majorDrains === 6 &&
    nb.secondaryDrains === 10 &&
    nb.stormWaterDrains === 5 &&
    nb.culverts === 2 &&
    nb.outfallPoints === 1,
  'Network breakdown matches: 6 Major, 10 Secondary, 5 Storm Water, 2 Culverts, 1 Outfall',
  `Found Major: ${nb.majorDrains}, Sec: ${nb.secondaryDrains}, Storm: ${nb.stormWaterDrains}, Culvert: ${nb.culverts}, Outfall: ${nb.outfallPoints}`
);

// ── Test 4: Average Utilization & Buckets ──
assert(
  summary.averageUtilizationPct === 64,
  'Average capacity utilization is exactly 64%',
  `Found ${summary.averageUtilizationPct}%`
);

const ub = summary.utilizationBuckets;
assert(
  ub.greaterThan90 === 2 &&
    ub.between70And90 === 5 &&
    ub.between50And70 === 8 &&
    ub.lessThan50 === 9,
  'Capacity buckets match: 2 (>90%), 5 (70-90%), 8 (50-70%), 9 (<50%)',
  `Found: >90%: ${ub.greaterThan90}, 70-90%: ${ub.between70And90}, 50-70%: ${ub.between50And70}, <50%: ${ub.lessThan50}`
);

// ── Test 5: Condition Counts ──
const cc = summary.conditionCounts;
assert(
  cc.good === 17 && cc.moderate === 5 && cc.blockedCritical === 2 && cc.underMaintenance === 0,
  'Condition counts match: Good (17), Moderate (5), Blocked/Critical (2), Under Maintenance (0)',
  `Found: Good: ${cc.good}, Mod: ${cc.moderate}, Blocked: ${cc.blockedCritical}, Maint: ${cc.underMaintenance}`
);

// ── Test 6: Geographic Coordinates Validity ──
let allCoordsValid = true;
for (const a of BALLARI_DRAINAGE_ASSETS) {
  if (a.lat < 14.5 || a.lat > 16.0 || a.lng < 75.5 || a.lng > 77.5) {
    allCoordsValid = false;
    console.error(`Invalid coordinates for asset ${a.id}: lat=${a.lat}, lng=${a.lng}`);
    break;
  }
}
assert(allCoordsValid, 'All Ballari assets have valid coordinates within Ballari district bounds');

// ── Test 7: Multi-District Support ──
const blrAssets = getDrainageAssetsForDistrict('bengaluru_urban', 12.9716, 77.5946);
assert(
  blrAssets.length > 0 && blrAssets[0].districtId === 'bengaluru_urban',
  'Dynamic asset generator supports other Karnataka districts (e.g. Bengaluru Urban)',
  `Generated ${blrAssets.length} assets`
);

console.log(`\n====================================================`);
console.log(`  SUMMARY: ${passedTests}/${totalTests} TESTS PASSED`);
console.log(`====================================================\n`);
