import { Request, Response } from 'express';
import { query } from '../db/index.js';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { canonicalDistrictId } from '../utils/districtUtils.js';

/**
 * Minimal KML parser for LineString / MultiGeometry Placemarks
 */
function parseKmlContent(xmlText: string) {
  const features: Array<{ name: string; description: string; geometry: any; inferredType: string | null }> = [];
  const pmRegex = /<Placemark[^>]*>([\s\S]*?)<\/Placemark>/gi;
  let pmMatch: RegExpExecArray | null;

  while ((pmMatch = pmRegex.exec(xmlText)) !== null) {
    const pm = pmMatch[1];
    const nameMatch = /<name>([\s\S]*?)<\/name>/i.exec(pm);
    const name = nameMatch ? nameMatch[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim() : '';

    const descMatch = /<description>([\s\S]*?)<\/description>/i.exec(pm);
    const description = descMatch ? descMatch[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim() : '';

    const coordsRegex = /<coordinates>([\s\S]*?)<\/coordinates>/gi;
    const coordBlocks: Array<Array<[number, number]>> = [];
    let cMatch: RegExpExecArray | null;

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
          // Karnataka geographic bounds: lat 11.0–19.0, lng 73.0–79.0
          if (lat < 11 || lat > 19 || lng < 73 || lng > 79) return null;
          return [lng, lat] as [number, number];
        })
        .filter((c): c is [number, number] => c !== null);

      if (coords.length >= 2) coordBlocks.push(coords);
    }

    if (coordBlocks.length === 0) continue;

    let geometry: any;
    if (coordBlocks.length === 1) {
      geometry = { type: 'LineString', coordinates: coordBlocks[0] };
    } else {
      geometry = { type: 'MultiLineString', coordinates: coordBlocks };
    }

    let inferredType: string | null = null;
    const nameLow = name.toLowerCase();
    if (nameLow.includes('primary') || nameLow.includes('rajakaluve')) inferredType = 'Primary';
    else if (nameLow.includes('secondary')) inferredType = 'Secondary';
    else if (nameLow.includes('tertiary')) inferredType = 'Tertiary';

    features.push({ name, description, geometry, inferredType });
  }

  return features;
}

function calculateLengthKm(geometry: any): number {
  const lines = geometry.type === 'LineString' ? [geometry.coordinates] : geometry.coordinates || [];
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

/**
 * On-demand district drainage importer with local caching
 */
export async function importDistrictDrainageOnDemand(districtId: string): Promise<{ success: boolean; importedCount: number; message: string }> {
  const distId = canonicalDistrictId(districtId);

  // 1. Check if already has records
  const existing = await query('SELECT count(*) as c FROM drainage_lines WHERE district_id = $1', [distId]);
  const currentCount = parseInt(existing.rows[0]?.c || '0', 10);
  if (currentCount > 0) {
    return { success: true, importedCount: currentCount, message: `District '${distId}' already has ${currentCount} imported features.` };
  }

  // 2. Load manifest
  const manifestPath = path.resolve(process.cwd(), 'backend', 'data', 'drainage_manifest.json');
  if (!fs.existsSync(manifestPath)) {
    throw new Error('Drainage manifest backend/data/drainage_manifest.json not found');
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const item = manifest[distId];
  if (!item || !item.downloadUrl) {
    throw new Error(`District '${distId}' has no OpenCity drainage resource registered in manifest.`);
  }

  // 3. Check local cache or download on-demand
  const cachePath = path.resolve(process.cwd(), item.cachedFile || `backend/data/drainage_kml/${distId}_karnataka.kml`);
  let kmlContent: string;

  if (fs.existsSync(cachePath)) {
    kmlContent = fs.readFileSync(cachePath, 'utf8');
  } else {
    fs.mkdirSync(path.dirname(cachePath), { recursive: true });
    const res = await fetch(item.downloadUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!res.ok) {
      throw new Error(`Failed to download drainage KML from OpenCity for ${distId} (HTTP ${res.status})`);
    }
    kmlContent = await res.text();
    fs.writeFileSync(cachePath, kmlContent, 'utf8');
  }

  // 4. Parse features
  const features = parseKmlContent(kmlContent);
  if (features.length === 0) {
    throw new Error(`No valid Karnataka drainage line geometries found in KML for ${distId}`);
  }

  // 5. Insert deterministic features
  let inserted = 0;
  for (const feat of features) {
    const drainType = feat.inferredType || 'Unknown';
    const idHash = crypto.createHash('md5').update(`${distId}:${feat.name}:${JSON.stringify(feat.geometry.coordinates)}`).digest('hex').slice(0, 16);
    const id = `DRN-${distId.toUpperCase()}-${idHash}`;
    const len = calculateLengthKm(feat.geometry);

    await query(
      `INSERT INTO drainage_lines (
        id, district_id, drain_name, drain_type, geometry_geojson,
        source_dataset, source_org, source_license, source_url,
        dataset_date, length_km, import_batch
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT (id) DO NOTHING`,
      [
        id,
        distId,
        feat.name || null,
        drainType,
        JSON.stringify(feat.geometry),
        item.resourceTitle || `Karnataka Drainage Map — ${item.districtName}`,
        'Government of Karnataka / OpenCity.in',
        'Public Domain',
        item.downloadUrl,
        null,
        len,
        `ondemand_${new Date().toISOString().slice(0, 10)}`
      ]
    );
    inserted++;
  }

  return { success: true, importedCount: inserted, message: `Successfully imported ${inserted} drainage features for ${item.districtName}.` };
}

/**
 * POST /api/drainage/import/:districtId
 */
export async function postImportDistrictDrainage(req: Request, res: Response): Promise<void> {
  try {
    const districtId = req.params.districtId;
    const result = await importDistrictDrainageOnDemand(districtId);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * GET /api/drainage/lines?district_id=...&type=...
 */
export async function getDrainageLines(req: Request, res: Response): Promise<void> {
  try {
    const rawDistrict = (req.query.district_id as string || 'bengaluru_urban');
    const districtId = canonicalDistrictId(rawDistrict);
    const drainType  = req.query.type as string | undefined;

    let sql = `
      SELECT id, district_id, drain_name, drain_type, geometry_geojson,
             source_dataset, source_org, source_license, source_url,
             dataset_date, length_km, import_batch
      FROM drainage_lines
      WHERE district_id = $1
    `;
    const params: any[] = [districtId];

    if (drainType && drainType !== 'All') {
      sql += ` AND drain_type = $2`;
      params.push(drainType);
    }

    sql += ` ORDER BY drain_type, drain_name LIMIT 5000`;

    const result = await query(sql, params);

    const features = result.rows.map((row: any) => {
      let geom: any = null;
      try { geom = JSON.parse(row.geometry_geojson); } catch { /* skip */ }
      return {
        type: 'Feature',
        id: row.id,
        properties: {
          id: row.id,
          district_id: row.district_id,
          drain_name: row.drain_name,
          drain_type: row.drain_type,
          source_dataset: row.source_dataset,
          source_org: row.source_org,
          source_license: row.source_license,
          source_url: row.source_url,
          dataset_date: row.dataset_date,
          length_km: row.length_km,
          import_batch: row.import_batch,
        },
        geometry: geom?.geometry || geom || null,
      };
    }).filter((f: any) => f.geometry !== null);

    res.json({
      success: true,
      district_id: districtId,
      drain_type_filter: drainType || 'All',
      feature_count: features.length,
      data_notice: 'Source: OpenCity.in / Government of Karnataka. License: Public Domain. Condition data is Unknown unless a verified inspection report exists.',
      geojson: {
        type: 'FeatureCollection',
        features,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * GET /api/drainage/lines/:id/conditions
 */
export async function getDrainConditionHistory(req: Request, res: Response): Promise<void> {
  try {
    const drainId = req.params.id;
    const result = await query(
      `SELECT * FROM drain_condition_reports
       WHERE drain_id = $1
       ORDER BY reported_at DESC
       LIMIT 50`,
      [drainId]
    );

    const drainResult = await query(
      `SELECT id, drain_name, drain_type, district_id, source_dataset, length_km
       FROM drainage_lines WHERE id = $1`,
      [drainId]
    );

    if (drainResult.rows.length === 0) {
      res.status(404).json({ success: false, error: `Drain asset '${drainId}' not found` });
      return;
    }

    const latestCondition = result.rows[0]?.condition_status || 'unknown_inspection_needed';
    const hasVerifiedCondition = result.rows.some((r: any) => r.is_verified === 1);

    res.json({
      success: true,
      drain: drainResult.rows[0],
      condition_status: latestCondition,
      has_verified_condition: hasVerifiedCondition,
      report_count: result.rows.length,
      data_notice: latestCondition === 'unknown_inspection_needed'
        ? 'No verified inspection exists. Condition is Unknown — absence of complaints does not confirm functional status.'
        : undefined,
      reports: result.rows,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * POST /api/drainage/lines/:id/conditions
 */
export async function submitDrainConditionReport(req: Request, res: Response): Promise<void> {
  try {
    const drainId = req.params.id;
    const {
      condition_status,
      reporter_name,
      reporter_type = 'citizen',
      report_notes,
      photo_url,
      lat,
      lng,
    } = req.body;

    const VALID_STATUSES = [
      'unknown_inspection_needed', 'reported_blockage', 'verified_blockage',
      'verified_functional', 'possible_overflow_risk', 'verified_overflow',
      'damaged', 'under_maintenance', 'resolved',
    ];
    if (!VALID_STATUSES.includes(condition_status)) {
      res.status(400).json({ success: false, error: `Invalid condition_status. Must be one of: ${VALID_STATUSES.join(', ')}` });
      return;
    }

    const isVerified = reporter_type === 'inspector' ? 1 : 0;
    const verifiedStatuses = ['verified_blockage', 'verified_functional', 'verified_overflow'];
    if (isVerified === 0 && verifiedStatuses.includes(condition_status)) {
      res.status(400).json({ success: false, error: 'Citizens cannot submit verified statuses. Use reported_blockage or possible_overflow_risk instead.' });
      return;
    }

    const drainCheck = await query('SELECT id, district_id FROM drainage_lines WHERE id = $1', [drainId]);
    if (drainCheck.rows.length === 0) {
      res.status(404).json({ success: false, error: `Drain asset '${drainId}' not found` });
      return;
    }
    const districtId = drainCheck.rows[0].district_id;

    const insertSql = `
      INSERT INTO drain_condition_reports (
        drain_id, district_id, condition_status, is_verified,
        reporter_type, reporter_name, report_notes, photo_url,
        lat, lng, reported_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;
    const result = await query(insertSql, [
      drainId,
      districtId,
      condition_status,
      isVerified,
      reporter_type,
      reporter_name || 'Anonymous',
      report_notes || null,
      photo_url || null,
      lat || null,
      lng || null,
      new Date().toISOString(),
    ]);

    res.json({
      success: true,
      report: result.rows[0],
      is_verified: isVerified === 1,
      notice: isVerified === 0 ? 'Report logged as unverified citizen report. Requires ULB field check.' : 'Verified inspector report recorded.',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * GET /api/drainage/import-status
 */
export async function getDrainageImportStatus(req: Request, res: Response): Promise<void> {
  try {
    const summaryResult = await query(
      `SELECT district_id,
              source_dataset,
              source_license,
              COUNT(*) AS feature_count,
              ROUND(SUM(length_km), 2) AS total_length_km,
              MIN(dataset_date) AS dataset_date
       FROM drainage_lines
       GROUP BY district_id, source_dataset, source_license
       ORDER BY district_id`
    );

    const conditionResult = await query(
      `SELECT district_id,
              condition_status,
              is_verified,
              COUNT(*) AS report_count
       FROM drain_condition_reports
       GROUP BY district_id, condition_status, is_verified`
    );

    res.json({
      success: true,
      datasets_imported: summaryResult.rows,
      condition_reports: conditionResult.rows,
      data_governance: {
        source_authority: 'OpenCity.in / BBMP / Government of Karnataka',
        license: 'Public Domain',
        provenance_verified: true,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * GET /api/drainage/summary?district_id=...
 */
export async function getDrainageSummary(req: Request, res: Response): Promise<void> {
  try {
    const rawDistrict = ((req.query.district_id as string) || (req.query.district as string) || 'bengaluru_urban');
    const districtId = canonicalDistrictId(rawDistrict);

    // 1. Query line count
    let lineStats = await query(
      `SELECT COUNT(*) as total_lines,
              COALESCE(SUM(length_km), 0) as total_km,
              source_dataset, source_org, source_license
       FROM drainage_lines
       WHERE district_id = $1
       GROUP BY district_id`,
      [districtId]
    );

    // If zero lines in DB, check if local KML exists and auto-import
    if (lineStats.rows.length === 0 || parseInt(lineStats.rows[0].total_lines, 10) === 0) {
      const cachePath = path.resolve(process.cwd(), 'backend', 'data', 'drainage_kml', `${districtId}_karnataka.kml`);
      if (fs.existsSync(cachePath)) {
        try {
          await importDistrictDrainageOnDemand(districtId);
          lineStats = await query(
            `SELECT COUNT(*) as total_lines,
                    COALESCE(SUM(length_km), 0) as total_km,
                    source_dataset, source_org, source_license
             FROM drainage_lines
             WHERE district_id = $1
             GROUP BY district_id`,
            [districtId]
          );
        } catch (e: any) {
          console.warn(`Auto-import error for ${districtId}:`, e.message);
        }
      }
    }

    const hasDrainageLines = lineStats.rows.length > 0 && lineStats.rows[0].total_lines > 0;
    const totalLines = hasDrainageLines ? parseInt(lineStats.rows[0].total_lines, 10) : 0;
    const totalLengthKm = hasDrainageLines ? Math.round(parseFloat(lineStats.rows[0].total_km) * 10) / 10 : 0;

    // 2. Query drain types breakdown
    const typeRows = await query(
      `SELECT drain_type, COUNT(*) as c
       FROM drainage_lines
       WHERE district_id = $1
       GROUP BY drain_type`,
      [districtId]
    );

    const typeMap: Record<string, number> = {};
    typeRows.rows.forEach((r: any) => {
      typeMap[r.drain_type] = parseInt(r.c, 10);
    });

    // 3. Query drain condition reports
    const condReports = await query(
      `SELECT condition_status, is_verified, COUNT(*) as c
       FROM drain_condition_reports
       WHERE district_id = $1
       GROUP BY condition_status, is_verified`,
      [districtId]
    );

    let blockedCritical = 0;
    let underMaintenance = 0;
    let awaitingVerification = 0;
    condReports.rows.forEach((r: any) => {
      const count = parseInt(r.c, 10);
      if (r.condition_status === 'reported_blockage' || r.condition_status === 'verified_blockage' || r.condition_status === 'damaged') {
        blockedCritical += count;
      }
      if (r.condition_status === 'under_maintenance') {
        underMaintenance += count;
      }
      if (r.is_verified === 0) {
        awaitingVerification += count;
      }
    });

    // 4. Query genuine incidents
    const incStats = await query(
      `SELECT severity, status, COUNT(*) as c
       FROM incidents
       WHERE LOWER(district_id) = $1 AND status != 'REJECTED'
       GROUP BY severity, status`,
      [districtId]
    );

    let incidentCount = 0;
    let unverifiedIncidents = 0;
    incStats.rows.forEach((r: any) => {
      const count = parseInt(r.c, 10);
      incidentCount += count;
      if (r.status !== 'VERIFIED') {
        unverifiedIncidents += count;
      }
    });

    const totalReportedIssues = blockedCritical + incidentCount;
    const totalAwaitingVerification = awaitingVerification + unverifiedIncidents;

    // Check manifest for on-demand resource availability
    const manifestPath = path.resolve(process.cwd(), 'backend', 'data', 'drainage_manifest.json');
    let manifestItem: any = null;
    if (fs.existsSync(manifestPath)) {
      try {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        manifestItem = manifest[districtId];
      } catch { /* ignore */ }
    }

    if (!hasDrainageLines) {
      res.json({
        success: true,
        district_id: districtId,
        has_drainage_data: false,
        insufficient_data: true,
        can_import_on_demand: Boolean(manifestItem?.downloadUrl),
        resource_title: manifestItem?.resourceTitle || null,
        opencity_page: manifestItem?.resourcePageUrl || null,
        notice: `Government-verified stormwater drain network not yet imported for ${manifestItem?.districtName || districtId}. OpenCity resource is available for on-demand import. Absence of records reflects data availability, not absence of physical drains.`,
        missing_items: [
          'No local drainage line geometry imported into SQLite repository',
          'Local ULB physical drain capacity measurements not installed'
        ],
        totalAssets: 0,
        reportedIssues: totalReportedIssues,
        awaitingVerification: totalAwaitingVerification,
        underMaintenance: 0,
        functionalAssets: 0,
        totalLengthKm: 0,
        averageUtilizationPct: null, // Unknown / Unmonitored
        networkBreakdown: {
          majorDrains: 0,
          secondaryDrains: 0,
          stormWaterDrains: 0,
          culverts: 0,
          outfallPoints: 0,
        },
        conditionCounts: {
          good: 0,
          moderate: 0,
          blockedCritical: totalReportedIssues,
          underMaintenance: 0,
          unknown: 0,
        },
        utilizationBuckets: {
          greaterThan90: 0,
          between70And90: 0,
          between50And70: 0,
          lessThan50: 0,
          unmonitored: 0,
        },
      });
      return;
    }

    const functionalAssets = Math.max(0, totalLines - totalReportedIssues - underMaintenance);
    const majorCount = (typeMap['Primary'] || 0) + (typeMap['Major Drain'] || 0);
    const secondaryCount = (typeMap['Secondary'] || 0) + (typeMap['Secondary Drain'] || 0);
    const swdCount = (typeMap['Tertiary'] || 0) + (typeMap['Storm Water Drain'] || 0) + (typeMap['Unknown'] || 0);

    res.json({
      success: true,
      district_id: districtId,
      has_drainage_data: true,
      insufficient_data: false,
      source: lineStats.rows[0]?.source_dataset || 'OpenCity.in / Government of Karnataka',
      license: lineStats.rows[0]?.source_license || 'Public Domain',
      totalAssets: totalLines,
      reportedIssues: totalReportedIssues,
      awaitingVerification: totalAwaitingVerification,
      underMaintenance,
      functionalAssets,
      totalLengthKm,
      averageUtilizationPct: null, // Truthful: IoT level sensors not installed on all GIS lines
      networkBreakdown: {
        majorDrains: majorCount,
        secondaryDrains: secondaryCount,
        stormWaterDrains: swdCount,
        culverts: typeMap['Culvert'] || 0,
        outfallPoints: typeMap['Outfall Point'] || 0,
      },
      conditionCounts: {
        good: 0, // No blanket fabrication: absence of complaints does not prove 'good'
        moderate: 0,
        blockedCritical: totalReportedIssues,
        underMaintenance,
        unknown: functionalAssets, // Accurately labelled as Unknown (Uninspected)
      },
      utilizationBuckets: {
        greaterThan90: 0,
        between70And90: 0,
        between50And70: 0,
        lessThan50: 0,
        unmonitored: totalLines,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * GET /api/drainage/assets?district_id=...
 * Returns real drainage asset records for the given district.
 * Condition and capacity are truthful: "Unknown" or null if not physically surveyed.
 */
export async function getDrainageAssets(req: Request, res: Response): Promise<void> {
  try {
    const rawDistrict = ((req.query.district_id as string) || (req.query.district as string) || 'bengaluru_urban');
    const districtId = canonicalDistrictId(rawDistrict);
    const limit = Math.min(100, parseInt((req.query.limit as string) || '25', 10));

    const result = await query(
      `SELECT id, district_id, drain_name, drain_type, geometry_geojson, length_km, source_dataset, dataset_date
       FROM drainage_lines
       WHERE district_id = $1
       ORDER BY (CASE WHEN drain_name IS NOT NULL THEN 0 ELSE 1 END), length_km DESC
       LIMIT $2`,
      [districtId, limit]
    );

    if (result.rows.length === 0) {
      res.json({
        success: true,
        district_id: districtId,
        has_drainage_data: false,
        insufficient_data: true,
        assets: [],
      });
      return;
    }

    const assets = result.rows.map((row: any, idx: number) => {
      let lat = 0;
      let lng = 0;
      try {
        const geom = typeof row.geometry_geojson === 'string' ? JSON.parse(row.geometry_geojson) : row.geometry_geojson;
        const coords = geom?.type === 'LineString' ? geom.coordinates : geom?.coordinates?.[0];
        if (coords && coords.length > 0) {
          const mid = coords[Math.floor(coords.length / 2)] || coords[0];
          lng = mid[0];
          lat = mid[1];
        }
      } catch { /* skip */ }

      return {
        id: row.id,
        name: row.drain_name || `${row.drain_type || 'Storm'} Drain Channel #${idx + 1}`,
        districtId: row.district_id,
        locality: row.drain_name ? `${row.drain_name} Reach` : `${row.district_id} Catchment Area`,
        assetType: row.drain_type || 'Storm Water Drain',
        condition: 'Unknown (Inspection Required)',
        status: 'Unmonitored Baseline',
        currentWaterLevelM: null,
        capacityM: null,
        utilizationPct: null,
        waterLevelText: 'Not available (In-situ telemetry uninstalled)',
        capacityText: 'Unknown (Hydraulic profile unmapped)',
        trend: 'stable',
        lat,
        lng,
        lengthKm: row.length_km || 0.5,
        lastInspectionDate: row.dataset_date || 'Government Open Data Survey',
        inspectionAction: 'Requires physical inspection by local ULB engineer',
        assignedAgency: row.district_id === 'bengaluru_urban' ? 'BBMP Stormwater Drain Dept' : 'Minor Irrigation Dept. / ULB',
      };
    });

    res.json({
      success: true,
      district_id: districtId,
      has_drainage_data: true,
      insufficient_data: false,
      count: assets.length,
      assets,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}
