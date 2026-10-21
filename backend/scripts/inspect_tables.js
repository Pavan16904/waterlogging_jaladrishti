import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, '../data/waterlogging.sqlite');
console.log('Opening DB at:', dbPath);
const db = new Database(dbPath, { readonly: true });

const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('Tables found:');
for (const t of tables) {
  try {
    const count = db.prepare(`SELECT COUNT(*) as c FROM "${t.name}"`).get();
    console.log(`  ${t.name}: ${count.c} rows`);
  } catch(e) {
    console.log(`  ${t.name}: error ${e.message}`);
  }
}
