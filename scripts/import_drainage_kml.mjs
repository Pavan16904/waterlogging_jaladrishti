/**
 * JalaDrishti AI — KML → SQLite Drainage Lines Importer
 * Source: OpenCity.in Karnataka Drainage Map (Public Domain)
 *         BBMP Bengaluru Stormwater Drains (Public Domain)
 *
 * Usage: node scripts/import_drainage_kml.mjs
 *
 * Converts KML Placemark/LineString features to GeoJSON and inserts into
 * drainage_lines table. Deterministic IDs prevent duplicates on re-import.
 */

import fs from 'fs';
import path from 'path';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const KML_DIR = path.join(ROOT, 'backend', 'data', 'drainage_kml');
const DB_PATH = path.join(ROOT, 'backend', 'data', 'waterlogging.sqlite');

// Mapping from KML filename → district_id, metadata
const KML_MANIFEST = [
  {
    file: 'bengaluru_urban_karnataka.kml',
    district_id: 'bengaluru_urban',
    drain_type: 'Unknown',  // Karnataka district-level data has no type classification
    source_url: 'https://data.opencity.in/dataset/karnataka-drainage-map/resource/f3080230-3bf2-40ab-bc8a-5e026103f523',
    source_dataset: 'Karnataka Drainage Map — Bengaluru Urban',
    source_org: 'Government of Karnataka / OpenCity.in',
    dataset_date: null,   // not published in metadata
  },
  {
    file: 'bengaluru_primary_swds.kml',
    district_id: 'bengaluru_urban',
    drain_type: 'Primary',
    source_url: 'https://data.opencity.in/dataset/bengaluru-stormwater-drains-maps/resource/114758e9-c356-46e0-afdb-e1d52f972863',
    source_dataset: 'Bengaluru Primary Stormwater Drains Map 2022',
    source_org: 'Bruhat Bengaluru Mahanagara Palike (BBMP) / OpenCity.in',
    dataset_date: '2022',
  },
  {
    file: 'bengaluru_all_swds.kml',
    district_id: 'bengaluru_urban',
    drain_type: 'Unknown', // all tiers merged, type in name
    source_url: 'https://data.opencity.in/dataset/bengaluru-stormwater-drains-maps/resource/801779e6-ed81-457d-bd2a-7e3cc95ad1ee',
    source_dataset: 'Bengaluru Stormwater Drains Map 2022 (All Tiers)',
    source_org: 'Bruhat Bengaluru Mahanagara Palike (BBMP) / OpenCity.in',
    dataset_date: '2022',
  },
  {
    file: 'ballari_karnataka.kml',
    district_id: 'ballari',
    drain_type: 'Unknown',
    source_url: 'https://data.opencity.in/dataset/karnataka-drainage-map/resource/fb94c483-91bd-4985-9529-7d40947d3872',
    source_dataset: 'Karnataka Drainage Map — Ballari',
    source_org: 'Government of Karnataka / OpenCity.in',
    dataset_date: null,
  },
];

// Minimal KML parser — no external dependency required
function parseKml(xmlText) {
  const features = [];

  // Extract all Placemark blocks
  const pmRegex = /<Placemark[^>]*>([\s\S]*?)<\/Placemark>/gi;
  let pmMatch;
  while ((pmMatch = pmRegex.exec(xmlText)) !== null) {
    const pm = pmMatch[1];

    // Name
    const nameMatch = /<name>([\s\S]*?)<\/name>/i.exec(pm);
    const name = nameMatch ? nameMatch[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim() : '';

    // Description
    const descMatch = /<description>([\s\S]*?)<\/description>/i.exec(pm);
    const description = descMatch ? descMatch[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim() : '';

    // Collect all coordinate strings (handles MultiGeometry with multiple LineStrings)
    const coordsRegex = /<coordinates>([\s\S]*?)<\/coordinates>/gi;
    const coordBlocks = [];
    let cMatch;
    while ((cMatch = coordsRegex.exec(pm)) !== null) {
      const block = cMatch[1].trim();
      const coords = block
        .split(/\s+/)
        .map(s => s.trim())
        .filter(s => s.length > 0)
        .map(s => {
          const parts = s.split(',');
          if (parts.length < 2) return null;
          const lng = parseFloat(parts[0]);
          const lat = parseFloat(parts[1]);
          if (isNaN(lng) || isNaN(lat)) return null;
          // Karnataka bounds check: lat 11.5–18.5, lng 74–78.6
          if (lat < 11 || lat > 19 || lng < 73 || lng > 79) return null;
          return [lng, lat];
        })
        .filter(Boolean);
      if (coords.length >= 2) coordBlocks.push(coords);
    }

    if (coordBlocks.length === 0) continue;

    let geometry;
    if (coordBlocks.length === 1) {
      geometry = { type: 'LineString', coordinates: coordBlocks[0] };
    } else {
      geometry = { type: 'MultiLineString', coordinates: coordBlocks };
    }

    // Infer drain_type from name if possible (for BBMP combined file)
    let inferredType = null;
    const nameLow = name.toLowerCase();
    if (nameLow.includes('primary')) inferredType = 'Primary';
    else if (nameLow.includes('secondary')) inferredType = 'Secondary';
    else if (nameLow.includes('tertiary')) inferredType = 'Tertiary';

    features.push({ name, description, geometry, inferredType });
  }

  return features;
}

function lengthKm(geometry) {
  const lines = geometry.type === 'LineString' ? [geometry.coordinates] : geometry.coordinates;
  let total = 0;
  for (const coords of lines) {
    for (let i = 1; i < coords.length; i++) {
      const [lng1, lat1] = coords[i - 1];
      const [lng2, lat2] = coords[i];
      const R = 6371;
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLng = (lng2 - lng1) * Math.PI / 180;
      const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
      total += R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
  }
  return Math.round(total * 100) / 100;
}

function deterministicId(sourceUrl, featureIndex, name) {
  const raw = `${sourceUrl}::${featureIndex}::${name}`;
  return 'DL-' + crypto.createHash('sha1').update(raw).digest('hex').substring(0, 16).toUpperCase();
}

function main() {
  const db = new DatabaseSync(DB_PATH);

  // Apply migration if table doesn't exist
  const migrationSql = fs.readFileSync(
    path.join(ROOT, 'backend', 'src', 'db', 'migrations', '004_drainage_lines.sql'),
    'utf8'
  );
  // Split by semicolons and run each statement
  migrationSql.split(';').map(s => s.trim()).filter(Boolean).forEach(stmt => {
    try { db.prepare(stmt).run(); } catch (e) { /* table already exists */ }
  });

  const batchId = new Date().toISOString();
  const report = [];

  const insertStmt = db.prepare(`
    INSERT INTO drainage_lines (
      id, district_id, drain_name, drain_type, geometry_geojson,
      source_url, source_dataset, source_org, source_license, dataset_date,
      kml_name, kml_description, length_km, import_batch, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(id) DO NOTHING
  `);

  for (const manifest of KML_MANIFEST) {
    const kmlPath = path.join(KML_DIR, manifest.file);
    if (!fs.existsSync(kmlPath)) {
      report.push({ file: manifest.file, status: 'MISSING', inserted: 0, skipped: 0 });
      console.warn(`MISSING: ${kmlPath}`);
      continue;
    }

    const xmlText = fs.readFileSync(kmlPath, 'utf8');
    const features = parseKml(xmlText);
    console.log(`Parsed ${features.length} line features from ${manifest.file}`);

    let inserted = 0, skipped = 0, invalid = 0;
    features.forEach((feat, idx) => {
      const id = deterministicId(manifest.source_url, idx, feat.name);
      const drainType = feat.inferredType || manifest.drain_type;
      const geojsonStr = JSON.stringify({ type: 'Feature', geometry: feat.geometry, properties: { name: feat.name } });
      const lenKm = lengthKm(feat.geometry);

      try {
        const info = insertStmt.run(
          id,
          manifest.district_id,
          feat.name || null,
          drainType,
          geojsonStr,
          manifest.source_url,
          manifest.source_dataset,
          manifest.source_org,
          'Public Domain',
          manifest.dataset_date || null,
          feat.name || null,
          feat.description || null,
          lenKm,
          batchId
        );
        if (info.changes > 0) inserted++;
        else skipped++;
      } catch (e) {
        invalid++;
        console.warn(`  Error inserting feature ${idx}: ${e.message}`);
      }
    });

    report.push({ file: manifest.file, district: manifest.district_id, status: 'OK', features: features.length, inserted, skipped, invalid });
    console.log(`  ${manifest.file}: ${inserted} inserted, ${skipped} skipped (duplicate), ${invalid} invalid`);
  }

  console.log('\n=== IMPORT REPORT ===');
  report.forEach(r => console.log(JSON.stringify(r)));

  // Count by district
  const counts = db.prepare('SELECT district_id, COUNT(*) as n FROM drainage_lines GROUP BY district_id').all();
  console.log('\n=== DRAINAGE LINES IN DB BY DISTRICT ===');
  counts.forEach(r => console.log(`  ${r.district_id}: ${r.n} lines`));
  console.log('TOTAL:', counts.reduce((s, r) => s + r.n, 0));

  db.close();
}

main();
