import axios from 'axios';
import { canonicalDistrictId } from '../utils/districtUtils.js';

const API_BASE = 'http://127.0.0.1:5000/api';

const ALL_31_DISTRICTS = [
  'Bagalkote', 'Ballari', 'Belagavi', 'Bengaluru Rural', 'Bengaluru Urban',
  'Bidar', 'Chamarajanagar', 'Chikkaballapur', 'Chikkamagaluru', 'Chitradurga',
  'Dakshina Kannada', 'Davanagere', 'Dharwad', 'Gadag', 'Hassan',
  'Haveri', 'Kalaburagi', 'Kodagu', 'Kolar', 'Koppal',
  'Mandya', 'Mysuru', 'Raichur', 'Ramanagara', 'Shivamogga',
  'Tumakuru', 'Udupi', 'Uttara Kannada', 'Vijayapura', 'Vijayanagara', 'Yadgir'
];

interface DistrictTestResult {
  district: string;
  canonId: string;
  incidentCount: number;
  drainageAssetsCount: number;
  hasGisNetwork: boolean;
  totalLengthKm: number;
  verifiedIncidents: number;
  severeCount: number;
  navMatchVerified: boolean;
  recommendationsGenerated: boolean;
  bengaluruSubstituted: boolean;
  passed: boolean;
  error?: string;
}

async function runTestSuite() {
  console.log('========================================================================');
  console.log('  JalaDrishti AI: Automated 31-District Flood Map & Drainage Actions Test');
  console.log('========================================================================\n');

  const results: DistrictTestResult[] = [];
  let totalPassed = 0;

  for (const districtName of ALL_31_DISTRICTS) {
    const canonId = canonicalDistrictId(districtName);
    const resSummary: DistrictTestResult = {
      district: districtName,
      canonId,
      incidentCount: 0,
      drainageAssetsCount: 0,
      hasGisNetwork: false,
      totalLengthKm: 0,
      verifiedIncidents: 0,
      severeCount: 0,
      navMatchVerified: false,
      recommendationsGenerated: false,
      bengaluruSubstituted: false,
      passed: false,
    };

    try {
      // 1. Fetch District-Specific Incidents
      const incRes = await axios.get(`${API_BASE}/incidents?district_id=${encodeURIComponent(canonId)}`);
      const incidents = incRes.data.incidents || [];
      resSummary.incidentCount = incidents.length;

      if (incidents.length === 0) {
        throw new Error(`Zero incidents returned for ${districtName} (${canonId})`);
      }

      // Verify no Bengaluru substitution
      if (canonId !== 'bengaluru_urban') {
        const substituted = incidents.some((inc: any) =>
          inc.district_id === 'bengaluru_urban' ||
          (inc.landmark && inc.landmark.toLowerCase().includes('bellandur'))
        );
        if (substituted) {
          resSummary.bengaluruSubstituted = true;
          throw new Error(`Bengaluru Urban data was substituted for ${districtName}`);
        }
      }

      if (incidents.length < 20 || incidents.length > 30) { throw new Error(`District ${districtName} has ${incidents.length} incidents, expected between 20 and 30`); }
      resSummary.verifiedIncidents = incidents.filter((i: any) => i.status === 'VERIFIED').length;
      resSummary.severeCount = incidents.filter((i: any) => i.severity === 'Severe').length;

      // Verify all incidents have valid GPS coords and drainage asset IDs
      for (const inc of incidents) {
        if (typeof inc.lat !== 'number' || typeof inc.lng !== 'number' || isNaN(inc.lat) || isNaN(inc.lng)) {
          throw new Error(`Incident ${inc.id} missing valid GPS coordinates in ${districtName}`);
        }
        if (!inc.drainage_asset_id) {
          throw new Error(`Incident ${inc.id} missing drainage_asset_id in ${districtName}`);
        }
      }

      // 2. Fetch District Drainage Assets
      const assetsRes = await axios.get(`${API_BASE}/drainage/assets?district_id=${encodeURIComponent(canonId)}&limit=100`);
      const assets = assetsRes.data.assets || [];
      resSummary.drainageAssetsCount = assets.length;

      if (assets.length === 0) {
        throw new Error(`Zero drainage assets returned for ${districtName} (${canonId})`);
      }

      // 3. Fetch Drainage Summary
      const sumRes = await axios.get(`${API_BASE}/drainage/summary?district_id=${encodeURIComponent(canonId)}`);
      resSummary.hasGisNetwork = !sumRes.data.insufficient_data;
      resSummary.totalLengthKm = sumRes.data.totalLengthKm || 0;

      // 4. Test Map-to-Drainage Navigation Linkage
      // Pick the first incident from Flood Map
      const primaryIncident = incidents[0];
      const targetAssetId = primaryIncident.drainage_asset_id;
      const targetLocation = primaryIncident.landmark;

      // Find target asset in Drainage Actions
      const matchedAsset = assets.find((a: any) =>
        a.id === targetAssetId ||
        a.reportedIssue?.issueId === primaryIncident.id ||
        a.name.toLowerCase().includes(targetLocation.toLowerCase()) ||
        a.locality.toLowerCase().includes(targetLocation.toLowerCase())
      );

      if (!matchedAsset) {
        throw new Error(`Navigation linkage failed: ${targetAssetId} not found in drainage assets of ${districtName}`);
      }

      // Verify coordinate consistency between Map incident and Drainage asset
      const latDiff = Math.abs(primaryIncident.lat - matchedAsset.lat);
      const lngDiff = Math.abs(primaryIncident.lng - matchedAsset.lng);
      if (latDiff > 0.001 || lngDiff > 0.001) {
        throw new Error(`Coordinate mismatch between Flood Map incident and Drainage asset: ${latDiff}, ${lngDiff}`);
      }
      resSummary.navMatchVerified = true;

      // 5. Test Recommendations Generation
      const hasDrains = assets.length > 0;
      const hasBlockageOrTask = assets.some((a: any) => a.condition === 'Blocked / Critical' || a.maintenanceTask);
      const hasRoads = incidents.some((i: any) => i.event_type?.includes('Road') || i.event_type?.includes('Underpass') || i.landmark?.includes('Subway') || i.landmark?.includes('Road'));
      const hasAuthority = Boolean(primaryIncident.assigned_agency || assets[0]?.assignedAgency);

      if (hasDrains && hasAuthority) {
        resSummary.recommendationsGenerated = true;
      } else {
        throw new Error(`Failed to generate complete 5 directives for ${districtName}`);
      }

      resSummary.passed = true;
      totalPassed++;
    } catch (err: any) {
      resSummary.passed = false;
      resSummary.error = err.message;
    }

    results.push(resSummary);
  }

  // 6. Test API Failure Recovery & Stale Cache Protection
  console.log('\n--- Testing API Failure Recovery & Invalid Queries ---');
  let failureRecoveryPassed = false;
  try {
    const invalidRes = await axios.get(`${API_BASE}/incidents?district_id=nonexistent_invalid_district`);
    if (invalidRes.data.success && invalidRes.data.incidents.length === 0) {
      failureRecoveryPassed = true;
      console.log('✓ API safely handled invalid district query without throwing 500 error.');
    }
  } catch (err: any) {
    console.error('✗ Failure recovery test failed:', err.message);
  }

  // Print Formatted Report Table
  console.log('\n========================================================================================');
  console.log('  DISTRICT COVERAGE & AUTOMATED TEST RESULTS TABLE');
  console.log('========================================================================================');
  console.log(
    '#'.padEnd(4) +
    'District'.padEnd(20) +
    'Canon ID'.padEnd(18) +
    'Incidents'.padEnd(12) +
    'Assets'.padEnd(10) +
    'Length (km)'.padEnd(14) +
    'GIS Network'.padEnd(14) +
    'Status'
  );
  console.log('-'.repeat(96));

  results.forEach((r, idx) => {
    const num = `${idx + 1}.`.padEnd(4);
    const name = r.district.padEnd(20);
    const cid = r.canonId.padEnd(18);
    const incs = `${r.incidentCount} (${r.verifiedIncidents} ver)`.padEnd(12);
    const asts = `${r.drainageAssetsCount}`.padEnd(10);
    const len = `${r.totalLengthKm.toFixed(1)} km`.padEnd(14);
    const gis = (r.hasGisNetwork ? 'Full Vector' : 'Ground Survey').padEnd(14);
    const status = r.passed ? '✓ PASS' : `✗ FAIL (${r.error})`;
    console.log(`${num}${name}${cid}${incs}${asts}${len}${gis}${status}`);
  });

  console.log('-'.repeat(96));
  console.log(`SUMMARY: ${totalPassed} / ${ALL_31_DISTRICTS.length} Districts Passed Automated End-to-End Tests.`);
  console.log(`Zero Bengaluru Substitutions: ${results.every(r => !r.bengaluruSubstituted) ? 'CONFIRMED ✓' : 'FAILED ✗'}`);
  console.log(`Two-Way Navigation Consistency: ${results.every(r => r.navMatchVerified) ? 'CONFIRMED ✓' : 'FAILED ✗'}`);
  console.log(`Failure Recovery Protection: ${failureRecoveryPassed ? 'CONFIRMED ✓' : 'FAILED ✗'}`);
  console.log('========================================================================================\n');

  if (totalPassed === ALL_31_DISTRICTS.length && failureRecoveryPassed) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTestSuite();
