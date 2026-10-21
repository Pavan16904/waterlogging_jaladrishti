import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, '../backend/data/waterlogging.sqlite');
const db = new DatabaseSync(dbPath);

console.log('--- Current incident counts by district ---');
const before = db.prepare('SELECT district_id, COUNT(*) as c FROM incidents GROUP BY district_id').all();
console.log(before);

// Delete synthetic cookie-cutter incidents for districts that have no genuine field surveys
const del = db.prepare(`
  DELETE FROM incidents
  WHERE district_id NOT IN ('ballari', 'bengaluru_urban', 'kodagu')
`);
const info = del.run();
console.log(`Deleted ${info.changes} synthetic incidents.`);

console.log('--- Remaining genuine incident counts by district ---');
const after = db.prepare('SELECT district_id, severity, COUNT(*) as c FROM incidents GROUP BY district_id, severity').all();
console.log(after);

db.close();
