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

if (!process.env.PGPASSWORD) {
  console.warn(
    '[!] PGPASSWORD environment variable is not set. ' +
    'PostgreSQL connections will use ~/.pgpass or system auth. ' +
    'Set PGPASSWORD in your .env file to enable PostgreSQL.'
  );
}

export const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 1500 }
    : {
        user: process.env.PGUSER || 'postgres',
        password: process.env.PGPASSWORD || undefined,
        host: process.env.PGHOST || 'localhost',
        port: parseInt(process.env.PGPORT || '5432', 10),
        database: process.env.PGDATABASE || 'waterlogging_db',
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 1500,
      }
);

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
    initSqliteSchema(sqliteDb);
  }
  return sqliteDb;
}

export function initSqliteSchema(db: any) {
  try {
    db.exec('ALTER TABLE waterlog_hex_scores ADD COLUMN run_id TEXT;');
  } catch {
    // Column might not exist yet if table not created, or already exists
  }
  try {
    db.exec('ALTER TABLE incidents ADD COLUMN lat REAL;');
  } catch {}
  try {
    db.exec('ALTER TABLE incidents ADD COLUMN lng REAL;');
  } catch {}
  try {
    db.exec('ALTER TABLE incidents ADD COLUMN severity TEXT;');
  } catch {}
  try {
    db.exec('ALTER TABLE incidents ADD COLUMN image_url TEXT;');
  } catch {}

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

    CREATE TABLE IF NOT EXISTS incidents (
      id TEXT PRIMARY KEY,
      district_id TEXT NOT NULL,
      district_name TEXT NOT NULL,
      reporter_name TEXT NOT NULL,
      reporter_phone TEXT NOT NULL,
      landmark TEXT NOT NULL,
      water_depth TEXT NOT NULL,
      urgency TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'SUBMITTED_UNVERIFIED',
      assigned_agency TEXT DEFAULT 'BBMP / KSDMA Monsoon Control',
      recommended_action TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS risk_model_runs (
      run_id TEXT PRIMARY KEY,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      weights_version TEXT NOT NULL,
      config_hash TEXT NOT NULL,
      input_status TEXT NOT NULL,
      row_count INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS waterlog_hex_scores (
      h3_index TEXT NOT NULL,
      resolution INTEGER NOT NULL,
      district_id TEXT NOT NULL,
      valid_time TEXT NOT NULL,
      fetched_at TEXT NOT NULL,
      risk_score REAL NOT NULL,
      risk_class TEXT NOT NULL,
      confidence REAL NOT NULL,
      components TEXT NOT NULL,
      source TEXT NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      run_id TEXT,
      PRIMARY KEY (h3_index, valid_time)
    );

    CREATE INDEX IF NOT EXISTS idx_waterlog_hex_res_valid ON waterlog_hex_scores (resolution, valid_time);
    CREATE INDEX IF NOT EXISTS idx_waterlog_hex_district_valid ON waterlog_hex_scores (district_id, valid_time);
    CREATE INDEX IF NOT EXISTS idx_waterlog_hex_district ON waterlog_hex_scores (district_id);
    CREATE INDEX IF NOT EXISTS idx_waterlog_hex_lat_lng ON waterlog_hex_scores (lat, lng);
    CREATE INDEX IF NOT EXISTS idx_waterlog_hex_run_id ON waterlog_hex_scores (run_id);

    CREATE TABLE IF NOT EXISTS district_hexes (
      h3_index TEXT PRIMARY KEY,
      district_id TEXT NOT NULL,
      district_name TEXT NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      resolution INTEGER NOT NULL DEFAULT 7,
      slope_deg REAL,
      twi REAL,
      drainage_proxy REAL,
      water_holding_capacity REAL,
      land_cover TEXT,
      is_cropland INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_district_hexes_dist ON district_hexes (district_id);
    CREATE INDEX IF NOT EXISTS idx_district_hexes_coords ON district_hexes (lat, lng);

    CREATE TABLE IF NOT EXISTS weather_snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      district_id TEXT NOT NULL,
      fetched_at TEXT NOT NULL,
      model_valid_time TEXT,
      source TEXT NOT NULL DEFAULT 'open-meteo',
      payload TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_weather_snapshots_dist_time ON weather_snapshots (district_id, fetched_at);

    CREATE TABLE IF NOT EXISTS observed_rainfall (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      district_id TEXT NOT NULL,
      fetched_at TEXT NOT NULL,
      observed_at TEXT NOT NULL,
      rainfall_mm REAL NOT NULL,
      source TEXT NOT NULL,
      label TEXT NOT NULL,
      metadata TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_observed_rainfall_dist_time ON observed_rainfall (district_id, observed_at);

    CREATE TABLE IF NOT EXISTS river_levels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      station_id TEXT NOT NULL,
      station_name TEXT NOT NULL,
      river_name TEXT NOT NULL,
      basin TEXT NOT NULL,
      district_id TEXT NOT NULL,
      water_level_m REAL NOT NULL,
      danger_level_m REAL,
      warning_level_m REAL,
      observed_at TEXT NOT NULL,
      fetched_at TEXT NOT NULL,
      source TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_river_levels_station ON river_levels (station_id, observed_at);
    CREATE INDEX IF NOT EXISTS idx_river_levels_district ON river_levels (district_id);

    CREATE TABLE IF NOT EXISTS flood_extent (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      district_id TEXT NOT NULL,
      acquired_at TEXT NOT NULL,
      geom TEXT NOT NULL,
      source TEXT NOT NULL DEFAULT 'Sentinel-1 SAR (Copernicus CDSE)',
      revisit_label TEXT NOT NULL DEFAULT 'satellite revisit ~6-12 days (not live)',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_flood_extent_dist ON flood_extent (district_id, acquired_at);

    CREATE TABLE IF NOT EXISTS sensor_readings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id TEXT NOT NULL,
      ts TEXT NOT NULL,
      value REAL NOT NULL,
      battery REAL,
      lat REAL NOT NULL,
      lon REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_sensor_readings_device_ts ON sensor_readings (device_id, ts);
  `);

  try {
    db.exec('ALTER TABLE waterlog_hex_scores ADD COLUMN run_id TEXT;');
  } catch {
    // Column already exists
  }
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

  // Handle transaction statements
  if (/^(BEGIN|COMMIT|ROLLBACK|PRAGMA)/i.test(sql)) {
    db.exec(sql);
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
