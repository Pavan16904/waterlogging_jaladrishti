// Verification of drainage advisory & summary endpoints across varied districts
const districts = ['bengaluru_urban', 'ballari', 'kalaburagi', 'mysuru', 'kodagu'];

async function test() {
  for (const id of districts) {
    try {
      const advRes = await fetch(`http://127.0.0.1:5000/api/realtime/drainage-advisory/${id}`);
      const advJson = await advRes.json();
      const adv = advJson.data || {};

      const sumRes = await fetch(`http://127.0.0.1:5000/api/drainage/summary?district_id=${id}`);
      const sum = await sumRes.json();

      console.log(`========================================`);
      console.log(`District: ${id} (${adv.districtName || adv.district})`);
      console.log(`  Guidance Level: ${adv.guidanceLevel}`);
      console.log(`  Priority:       ${adv.priority}`);
      console.log(`  Insufficient:   ${adv.insufficient_data === true}`);
      console.log(`  Headline:       ${adv.guidanceHeadline}`);
      console.log(`  Total Assets:   ${sum.totalAssets ?? 0}`);
      console.log(`  Reported Issues:${sum.reportedIssues ?? 0}`);
      console.log(`  Drainage Km:    ${sum.totalLengthKm ?? 0}`);
      console.log(`  Source:         ${sum.source || 'N/A'}`);
      console.log(`  Evidence Lines: ${adv.drainageEvidence?.totalLines ?? 0}`);
      console.log(`  Incidents:      ${adv.incidentEvidence?.totalIncidents ?? 0} (Severe: ${adv.incidentEvidence?.severeIncidents ?? 0})`);
    } catch (err) {
      console.error(`Error for ${id}:`, err.message);
    }
  }
}

test();
