import { Request, Response } from 'express';
import { query } from '../db/index.js';
import { canonicalDistrictId } from '../utils/districtUtils.js';

export async function getIncidents(req: Request, res: Response) {
  try {
    const { district_id, severity, event_type, status, include_rejected, has_coords, date_from, date_to } = req.query;
    let sql = 'SELECT * FROM incidents WHERE 1=1';
    const params: any[] = [];

    if (district_id && typeof district_id === 'string' && district_id.trim()) {
      const d = district_id.trim().toLowerCase();
      if (d !== 'all' && d !== 'all_karnataka' && d !== 'karnataka') {
        const canon = canonicalDistrictId(d);
        sql += ' AND (district_id = ? OR district_id = ?)';
        params.push(canon, d);
      }
    }

    // Severity filter with normalization (Critical -> Severe, Medium -> Moderate, Low -> Minor)
    if (severity && typeof severity === 'string' && severity.trim() && severity.toUpperCase() !== 'ALL') {
      const s = severity.trim().toLowerCase();
      let normalized = 'Moderate';
      if (s === 'severe' || s === 'critical') normalized = 'Severe';
      else if (s === 'high') normalized = 'High';
      else if (s === 'moderate' || s === 'medium') normalized = 'Moderate';
      else if (s === 'minor' || s === 'low') normalized = 'Minor';
      sql += ' AND LOWER(severity) = ?';
      params.push(normalized.toLowerCase());
    }

    // Event type filter
    if (event_type && typeof event_type === 'string' && event_type.trim() && event_type.toUpperCase() !== 'ALL') {
      sql += ' AND LOWER(event_type) = ?';
      params.push(event_type.trim().toLowerCase());
    }

    // Status filter
    if (status && typeof status === 'string' && status.trim() && status.toUpperCase() !== 'ALL') {
      const st = status.trim().toUpperCase();
      if (st === 'ACTIVE') {
        sql += " AND status IN ('VERIFIED', 'SUBMITTED_UNVERIFIED', 'IN_PROGRESS')";
      } else {
        sql += ' AND status = ?';
        params.push(st);
      }
    } else if (include_rejected !== 'true') {
      // Exclude rejected records by default from active listing, but keep in history
      sql += " AND status != 'REJECTED'";
    }

    // Has coordinates filter
    if (has_coords === 'true') {
      sql += ' AND lat IS NOT NULL AND lng IS NOT NULL';
    } else if (has_coords === 'false') {
      sql += ' AND (lat IS NULL OR lng IS NULL)';
    }

    // Date range filter
    if (date_from && typeof date_from === 'string' && date_from.trim()) {
      sql += ' AND created_at >= ?';
      params.push(date_from.trim());
    }
    if (date_to && typeof date_to === 'string' && date_to.trim()) {
      sql += ' AND created_at <= ?';
      params.push(date_to.trim());
    }

    sql += ' ORDER BY created_at DESC';

    const result = await query(sql, params);
    const rows = result.rows || [];

    // Compute empirical counts
    const mapped = rows.filter((r: any) => typeof r.lat === 'number' && typeof r.lng === 'number' && !isNaN(r.lat) && !isNaN(r.lng));
    const unmapped = rows.filter((r: any) => r.lat === null || r.lng === null || isNaN(r.lat) || isNaN(r.lng));

    const by_severity = {
      severe: rows.filter((r: any) => (r.severity || '').toLowerCase() === 'severe' || (r.severity || '').toLowerCase() === 'critical').length,
      high: rows.filter((r: any) => (r.severity || '').toLowerCase() === 'high').length,
      moderate: rows.filter((r: any) => (r.severity || '').toLowerCase() === 'moderate' || (r.severity || '').toLowerCase() === 'medium').length,
      minor: rows.filter((r: any) => (r.severity || '').toLowerCase() === 'minor' || (r.severity || '').toLowerCase() === 'low').length,
    };

    const by_status = {
      verified: rows.filter((r: any) => r.status === 'VERIFIED').length,
      pending: rows.filter((r: any) => r.status === 'SUBMITTED_UNVERIFIED').length,
      in_progress: rows.filter((r: any) => r.status === 'IN_PROGRESS').length,
      resolved: rows.filter((r: any) => r.status === 'RESOLVED').length,
      historical: rows.filter((r: any) => r.status === 'HISTORICAL').length,
      rejected: rows.filter((r: any) => r.status === 'REJECTED').length,
    };

    return res.json({
      success: true,
      count: rows.length,
      mapped_count: mapped.length,
      unmapped_count: unmapped.length,
      by_severity,
      by_status,
      incidents: rows,
      district_id: district_id || null,
      source: 'JalaDrishti Verified Incidents & Shared Drainage Repository',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Error fetching incidents:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve genuine incident records',
      details: error.message
    });
  }
}

export async function createIncident(req: Request, res: Response) {
  try {
    const {
      id,
      district_id,
      district_name,
      reporter_name,
      reporter_phone,
      landmark,
      water_depth,
      urgency,
      status,
      assigned_agency,
      recommended_action,
      lat,
      lng,
      severity,
      image_url,
      event_type,
      drainage_asset_id,
      source_type
    } = req.body;

    if (!district_id || !landmark) {
      return res.status(400).json({
        success: false,
        error: 'district_id and landmark are required'
      });
    }

    const reportId = id || `inc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const insertSql = `
      INSERT INTO incidents (
        id, district_id, district_name, reporter_name, reporter_phone,
        landmark, water_depth, urgency, status, assigned_agency,
        recommended_action, lat, lng, severity, image_url,
        event_type, drainage_asset_id, source_type,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      reportId,
      district_id.toLowerCase().trim(),
      district_name || district_id,
      reporter_name || 'Anonymous Citizen',
      reporter_phone || 'Not Provided',
      landmark,
      water_depth || 'moderate',
      urgency || 'moderate',
      status || 'SUBMITTED_UNVERIFIED',
      assigned_agency || 'KSDMA / District Control Room',
      recommended_action || 'Inspect drainage outfall and clear surface blockage',
      typeof lat === 'number' && !isNaN(lat) ? lat : null,
      typeof lng === 'number' && !isNaN(lng) ? lng : null,
      severity || 'Moderate',
      image_url || null,
      event_type || 'Road waterlogging',
      drainage_asset_id || null,
      source_type || 'CITIZEN_REPORT',
      now,
      now
    ];

    await query(insertSql, params);

    return res.status(201).json({
      success: true,
      message: 'Genuine incident report recorded successfully',
      incident: {
        id: reportId,
        district_id,
        district_name,
        landmark,
        water_depth,
        urgency,
        status: status || 'SUBMITTED_UNVERIFIED',
        lat: typeof lat === 'number' && !isNaN(lat) ? lat : null,
        lng: typeof lng === 'number' && !isNaN(lng) ? lng : null,
        severity: severity || 'Moderate',
        image_url: image_url || null,
        event_type: event_type || 'Road waterlogging',
        drainage_asset_id: drainage_asset_id || null,
        source_type: source_type || 'CITIZEN_REPORT',
        created_at: now
      }
    });
  } catch (error: any) {
    console.error('Error creating incident:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to record incident report',
      details: error.message
    });
  }
}

export async function updateIncidentStatus(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!id || !status) {
      return res.status(400).json({
        success: false,
        error: 'Incident id and status are required'
      });
    }

    const now = new Date().toISOString();
    await query('UPDATE incidents SET status = ?, updated_at = ? WHERE id = ?', [status, now, id]);

    return res.json({
      success: true,
      message: `Incident ${id} updated to status ${status}`,
      id,
      status,
      updated_at: now
    });
  } catch (error: any) {
    console.error('Error updating incident status:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update incident status',
      details: error.message
    });
  }
}

