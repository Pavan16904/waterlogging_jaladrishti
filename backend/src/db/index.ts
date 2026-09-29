import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
// @ts-ignore
import { DatabaseSync } from 'node:sqlite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pg;

export let activeDriver: 'postgres' | 'sqlite' = 'sqlite';
let sqliteDb: any = null;

export const pool = new Pool({
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'abhi2003',
  host: process.env.PGHOST || 'localhost',
  port: parseInt(process.env.PGPORT || '5432', 10),
  database: process.env.PGDATABASE || 'waterlogging_db',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 1500, // Short timeout to rapidly fall back if PostgreSQL is offline
});

// Initialize or return SQLite singleton
export function getSqliteDb(): any {
  if (!sqliteDb) {
    const dataDir = path.join(__dirname, '..', '..', 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const dbPath = path.join(dataDir, 'waterlogging.sqlite');
    sqliteDb = new DatabaseSync(dbPath);
    sqliteDb.exec('PRAGMA foreign_keys = ON;');
  }
  return sqliteDb;
}

export function initSqliteSchema(db: any) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS study_areas (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      state_region TEXT NOT NULL,
      country TEXT NOT NULL DEFAULT 'India',
      description TEXT,
      center_lat REAL NOT NULL,
      center_lng REAL NOT NULL,
      zoom_level INTEGER NOT NULL DEFAULT 13,
      bounds_geojson TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS satellite_scenes (
      id TEXT PRIMARY KEY,
      study_area_id TEXT REFERENCES study_areas(id) ON DELETE CASCADE,
      event_name TEXT NOT NULL,
      acquisition_date TEXT NOT NULL,
      sensor_type TEXT NOT NULL,
      cloud_cover_pct REAL DEFAULT 0.0,
      rainfall_mm REAL DEFAULT 0.0,
      is_post_event INTEGER DEFAULT 0,
      raw_bands_meta TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS analysis_runs (
      id TEXT PRIMARY KEY,
      study_area_id TEXT REFERENCES study_areas(id) ON DELETE CASCADE,
      model_type TEXT NOT NULL DEFAULT 'random_forest',
      pre_event_date TEXT NOT NULL,
      post_event_date TEXT NOT NULL,
      rainfall_mm REAL NOT NULL DEFAULT 45.0,
      total_area_km2 REAL NOT NULL,
      waterlogged_area_km2 REAL NOT NULL,
      waterlogged_percentage REAL NOT NULL,
      severe_count INTEGER NOT NULL DEFAULT 0,
      moderate_count INTEGER NOT NULL DEFAULT 0,
      low_count INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS severity_zones (
      id TEXT PRIMARY KEY,
      analysis_run_id TEXT REFERENCES analysis_runs(id) ON DELETE CASCADE,
      zone_name TEXT NOT NULL,
      severity TEXT NOT NULL,
      probability REAL NOT NULL,
      elevation_m REAL NOT NULL,
      slope_deg REAL NOT NULL,
      land_use TEXT NOT NULL,
      area_ha REAL NOT NULL,
      is_persistent INTEGER DEFAULT 0,
      ndwi REAL,
      mndwi REAL,
      ndvi REAL,
      vv_db REAL,
      vh_db REAL,
      geojson_feature TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS drainage_advisories (
      id TEXT PRIMARY KEY,
      analysis_run_id TEXT REFERENCES analysis_runs(id) ON DELETE CASCADE,
      zone_id TEXT REFERENCES severity_zones(id) ON DELETE CASCADE,
      zone_name TEXT NOT NULL,
      priority TEXT NOT NULL,
      urgency_score INTEGER NOT NULL,
      title TEXT NOT NULL,
      diagnosis TEXT NOT NULL,
      action_recommendation TEXT NOT NULL,
      estimated_volume_m3 REAL NOT NULL DEFAULT 0.0,
      mitigation_actions TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS irrigation_advisories (
      id TEXT PRIMARY KEY,
      crop_name TEXT NOT NULL,
      growth_stage TEXT NOT NULL,
      soil_type TEXT NOT NULL,
      days_since_planting INTEGER NOT NULL,
      et0_mm_day REAL NOT NULL,
      crop_coefficient_kc REAL NOT NULL,
      etc_mm_day REAL NOT NULL,
      taw_mm REAL NOT NULL,
      raw_mm REAL NOT NULL,
      current_depletion_mm REAL NOT NULL,
      status TEXT NOT NULL,
      recommended_gross_mm REAL NOT NULL,
      water_volume_m3 REAL NOT NULL,
      field_area_ha REAL NOT NULL,
      advisory_summary TEXT NOT NULL,
      forecast_payload TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS model_evaluations (
      id TEXT PRIMARY KEY,
      model_name TEXT NOT NULL,
      accuracy REAL NOT NULL,
      precision_val REAL NOT NULL,
      recall_val REAL NOT NULL,
      f1_score REAL NOT NULL,
      roc_auc REAL NOT NULL,
      metrics_payload TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

function parseJsonIfPossible(val: any) {
  if (typeof val === 'string' && (val.startsWith('{') || val.startsWith('['))) {
    try {
      return JSON.parse(val);
    } catch {
      return val;
    }
  }
  return val;
}

function processSqliteRow(row: any) {
  if (!row || typeof row !== 'object') return row;
  const out: any = {};
  for (const [key, value] of Object.entries(row)) {
    if (key === 'is_persistent' || key === 'is_post_event') {
      out[key] = Boolean(value);
    } else if (typeof value === 'string' && (value.startsWith('{') || value.startsWith('['))) {
      out[key] = parseJsonIfPossible(value);
    } else {
      out[key] = value;
    }
  }
  return out;
}

export async function query(text: string, params?: any[]): Promise<{ rows: any[]; rowCount: number }> {
  if (activeDriver === 'postgres') {
    try {
      const res = await pool.query(text, params);
      return { rows: res.rows, rowCount: res.rowCount || 0 };
    } catch (pgErr) {
      console.warn('[!] PostgreSQL query failed, switching to SQLite fallback:', (pgErr as any)?.message);
      activeDriver = 'sqlite';
    }
  }

  // SQLite execution
  const db = getSqliteDb();
  let sql = text.trim();

  // Handle TRUNCATE TABLE
  if (/^TRUNCATE\s+TABLE/i.test(sql)) {
    const tablePart = sql.replace(/^TRUNCATE\s+TABLE\s+/i, '').replace(/CASCADE\s*;?$/i, '').trim();
    const tables = tablePart.split(',').map(t => t.trim().replace(/;$/, ''));
    db.exec('PRAGMA foreign_keys = OFF;');
    for (const table of tables) {
      if (table) db.exec(`DELETE FROM ${table};`);
    }
    db.exec('PRAGMA foreign_keys = ON;');
    return { rows: [], rowCount: 0 };
  }

  const safeParams: any[] = (params || []).map(p => {
    if (typeof p === 'boolean') return p ? 1 : 0;
    if (p !== null && typeof p === 'object') return JSON.stringify(p);
    return p;
  });

  // Replace PostgreSQL positional parameters ($1, $2, ...) with ?
  sql = sql.replace(/\$[0-9]+/g, '?');

  const isSelect = /^\s*SELECT/i.test(sql);
  if (isSelect) {
    const stmt = db.prepare(sql);
    const rawRows = stmt.all(...safeParams);
    const rows = rawRows.map(processSqliteRow);
    return { rows, rowCount: rows.length };
  } else {
    const stmt = db.prepare(sql);
    const result = stmt.run(...safeParams);
    return { rows: [], rowCount: Number(result.changes || 0) };
  }
}

export async function initializeDatabase() {
  try {
    const client = await pool.connect();
    activeDriver = 'postgres';
    console.log('[*] Connected to PostgreSQL (waterlogging_db)');
    
    const schemaSqlPath = path.join(__dirname, 'schema.sql');
    if (fs.existsSync(schemaSqlPath)) {
      const schemaSql = fs.readFileSync(schemaSqlPath, 'utf8');
      await client.query(schemaSql);
      console.log('[+] Database tables initialized successfully (PostgreSQL).');
    }
    client.release();
  } catch (err: any) {
    activeDriver = 'sqlite';
    console.log('[*] PostgreSQL service not detected on localhost:5432.');
    console.log('[+] Seamlessly using built-in persistent SQLite database (backend/data/waterlogging.sqlite).');
    const db = getSqliteDb();
    initSqliteSchema(db);
    console.log('[+] Database tables initialized successfully (SQLite).');
  }
}
