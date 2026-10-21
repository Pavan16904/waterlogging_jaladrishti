import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, '../backend/data/waterlogging.sqlite');
console.log('Connecting to:', dbPath);
const db = new DatabaseSync(dbPath);

console.log('--- Table counts ---');
const tables = ['drainage_lines', 'drain_condition_reports', 'incidents', 'waterlog_hex_scores', 'study_areas'];
for (const t of tables) {
  try {
    const row = db.prepare(`SELECT COUNT(*) as c FROM ${t}`).get();
    console.log(`${t}: ${row.c} rows`);
  } catch (e) {
    console.log(`${t}: error ${e.message}`);
  }
}

console.log('\n--- drainage_lines by district_id ---');
try {
  const rows = db.prepare(`SELECT district_id, COUNT(*) as c FROM drainage_lines GROUP BY district_id`).all();
  console.log(rows);
} catch (e) {
  console.log('Error querying drainage_lines:', e.message);
}

console.log('\n--- incidents by district_id ---');
try {
  const rows = db.prepare(`SELECT district_id, severity, COUNT(*) as c FROM incidents GROUP BY district_id, severity`).all();
  console.log(rows.slice(0, 30));
} catch (e) {
  console.log('Error querying incidents:', e.message);
}
