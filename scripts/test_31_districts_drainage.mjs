import fs from 'fs';

const districts = [
  'bagalkote', 'ballari', 'belagavi', 'bengaluru_rural', 'bengaluru_urban',
  'bidar', 'chamarajanagara', 'chikkaballapura', 'chikkamagaluru', 'chitradurga',
  'dakshina_kannada', 'davanagere', 'dharwad', 'gadag', 'hassan',
  'haveri', 'kalaburagi', 'kodagu', 'kolar', 'koppal',
  'mandya', 'mysuru', 'raichur', 'ramanagara', 'shivamogga',
  'tumakuru', 'udupi', 'uttara_kannada', 'vijayanagara', 'vijayapura', 'yadgir'
];

async function run() {
  console.log(`Auditing all ${districts.length} districts via http://127.0.0.1:5000/api/drainage/summary...`);
  
  const results = [];
  for (const id of districts) {
    try {
      const res = await fetch(`http://127.0.0.1:5000/api/drainage/summary?district_id=${id}`);
      if (!res.ok) {
        results.push({ id, status: 'HTTP_ERR', code: res.status });
        continue;
      }
      const data = await res.json();
      results.push({
        id,
        has_drainage_data: data.has_drainage_data,
        insufficient_data: data.insufficient_data,
        totalAssets: data.totalAssets,
        totalLengthKm: data.totalLengthKm,
        can_import_on_demand: data.can_import_on_demand,
        averageUtilizationPct: data.averageUtilizationPct,
        conditionCounts: data.conditionCounts
      });
    } catch (e) {
      results.push({ id, status: 'ERR', error: e.message });
    }
  }

  console.log('\n--- 31 DISTRICT DRAINAGE AUDIT RESULTS ---');
  let validImported = 0;
  let honestInsufficient = 0;
  let invalidOrFabricated = 0;

  for (const r of results) {
    if (r.has_drainage_data) {
      validImported++;
      console.log(`✓ ${r.id.padEnd(20)}: ${r.totalAssets} assets, ${r.totalLengthKm} km, Utilization: ${r.averageUtilizationPct ?? 'Unmonitored'}`);
    } else {
      honestInsufficient++;
      const isHonest = r.insufficient_data === true && r.totalAssets === 0 && r.averageUtilizationPct === null;
      if (!isHonest) invalidOrFabricated++;
      console.log(`- ${r.id.padEnd(20)}: Insufficient data (${r.can_import_on_demand ? 'Resource available in manifest' : 'No resource'}), Honest: ${isHonest}`);
    }
  }

  console.log(`\nSummary: Total: ${results.length}, With Real Data: ${validImported}, Truthful Insufficient Data: ${honestInsufficient}, Fabricated: ${invalidOrFabricated}`);
}

run();
