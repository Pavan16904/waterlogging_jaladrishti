import { KARNATAKA_108_PLANTS } from '../data/karnataka108Plants';
import { KARNATAKA_SOILS } from '../data/karnatakaSoils';
import { KARNATAKA_31_DISTRICTS_WEATHER } from '../data/karnatakaDistrictsWeather';
import { evaluateCropRecommendation } from '../services/cropRecommendationEngine';

declare const process: any;

console.log('====================================================');
console.log('  JALADRISHTI AI — CROP ADVISOR AUTOMATED TEST SUITE');
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

// ── Test 1: Exactly 108 Plant Types ──
assert(
  KARNATAKA_108_PLANTS.length === 108,
  'Catalogue contains exactly 108 plants',
  `Expected 108, found ${KARNATAKA_108_PLANTS.length}`
);

// ── Test 2: Zero Duplicate IDs or Names ──
const ids = new Set<string>();
const names = new Set<string>();
let hasDuplicates = false;
for (const p of KARNATAKA_108_PLANTS) {
  if (ids.has(p.id)) {
    hasDuplicates = true;
    console.error(`Duplicate ID found: ${p.id}`);
  }
  if (names.has(p.name)) {
    hasDuplicates = true;
    console.error(`Duplicate Name found: ${p.name}`);
  }
  ids.add(p.id);
  names.add(p.name);
}
assert(!hasDuplicates && ids.size === 108, 'Zero duplicate IDs or plant names');

// ── Test 3: Agricultural Categories Representation ──
const categories = new Set(KARNATAKA_108_PLANTS.map((p) => p.category));
assert(
  categories.size >= 10,
  'All 10 agricultural categories represented',
  `Categories found: ${Array.from(categories).join(', ')}`
);

// ── Test 4: Plant Attributes Completeness ──
let allAttributesValid = true;
for (const p of KARNATAKA_108_PLANTS) {
  if (
    !p.id ||
    !p.name ||
    !p.kannadaName ||
    !p.scientificName ||
    !p.waterDemand ||
    !p.optimalPh ||
    !p.optimalTemp ||
    !p.seasons.length ||
    !p.fertilizerSchedule.length
  ) {
    allAttributesValid = false;
    console.error(`Incomplete attributes for crop: ${p.id}`);
    break;
  }
}
assert(allAttributesValid, 'All 108 crops have complete agronomic attributes & fertilizer schedules');

// ── Test 5: All 31 Karnataka Districts Present ──
assert(
  KARNATAKA_31_DISTRICTS_WEATHER.length === 31,
  'All 31 Karnataka districts present in registry',
  `Found ${KARNATAKA_31_DISTRICTS_WEATHER.length}`
);

// ── Test 6: District Geo Coordinates Validity ──
let allCoordsValid = true;
for (const d of KARNATAKA_31_DISTRICTS_WEATHER) {
  if (d.lat < 11.5 || d.lat > 18.5 || d.lng < 74.0 || d.lng > 78.6 || !d.zone) {
    allCoordsValid = false;
    console.error(`Invalid coordinates or missing ACZ for district: ${d.id}`);
    break;
  }
}
assert(allCoordsValid, 'All districts have valid Karnataka bounding coordinates and ACZ zones');

// ── Test 7: Karnataka Soils Coverage ──
assert(
  KARNATAKA_SOILS.length >= 8,
  'At least 8 authentic Karnataka soil categories loaded',
  `Found ${KARNATAKA_SOILS.length}`
);

// ── Test 8: Recommendation Engine Evaluation (Rice baseline) ──
const riceRes = evaluateCropRecommendation({
  districtId: 'ballari',
  soilId: 'clay_loam',
  selectedCropId: 'rice',
  season: 'Kharif',
  farmType: 'Field / Open Land',
  waterSource: 'Canal & Borewell',
  userPh: 6.5,
  currentTempC: 28,
  currentHumidity: 82,
  rainfallTodayMm: 42,
  forecast24hMm: 25,
});

assert(
  riceRes.scores.overallScore >= 80 && riceRes.scores.badgeLabel === 'Highly Suitable',
  'Rice in Ballari under Kharif yields Highly Suitable (>=80%)',
  `Score: ${riceRes.scores.overallScore}%`
);

assert(
  riceRes.alternatives.length === 5,
  'Engine generates exactly 5 alternative crop suggestions',
  `Found ${riceRes.alternatives.length}`
);

assert(
  riceRes.fertilizerGuidance.length >= 4,
  'Engine outputs stage-specific fertilizer schedule',
  `Found ${riceRes.fertilizerGuidance.length} stages`
);

assert(
  riceRes.sevenDayImpact.length === 7,
  'Engine generates 7-day weather impact forecast',
  `Found ${riceRes.sevenDayImpact.length} days`
);

// ── Test 9: Sensitivity to Soil & Season Changes ──
const offSeasonRes = evaluateCropRecommendation({
  districtId: 'ballari',
  soilId: 'coastal_sandy',
  selectedCropId: 'rice',
  season: 'Summer',
  farmType: 'Rainfed Dryland',
  waterSource: 'Rainfed',
  currentTempC: 38,
  rainfallTodayMm: 0,
  forecast24hMm: 0,
});

assert(
  offSeasonRes.scores.overallScore < riceRes.scores.overallScore,
  'Engine lowers score for rainfed rice in coastal sand during summer',
  `Off-season score: ${offSeasonRes.scores.overallScore}% vs Baseline: ${riceRes.scores.overallScore}%`
);

console.log(`\n====================================================`);
console.log(`  SUMMARY: ${passedTests}/${totalTests} TESTS PASSED`);
console.log(`====================================================\n`);
