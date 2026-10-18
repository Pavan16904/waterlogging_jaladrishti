import { Request, Response } from 'express';
import { query } from '../db/index.js';

export async function getIncidents(req: Request, res: Response) {
  try {
    const { district_id } = req.query;
    let sql = 'SELECT * FROM incidents';
    const params: any[] = [];

    if (district_id && typeof district_id === 'string' && district_id.trim()) {
      sql += ' WHERE district_id = ?';
      params.push(district_id.trim().toLowerCase());
    }

    sql += ' ORDER BY created_at DESC';

    const result = await query(sql, params);
    return res.json({
      success: true,
      count: result.rows.length,
      incidents: result.rows,
      district_id: district_id || null,
      source: 'JalaDrishti Verified Incidents & Persistent Citizen SOS Store',
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
      image_url
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
        recommended_action, lat, lng, severity, image_url, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      typeof lat === 'number' ? lat : null,
      typeof lng === 'number' ? lng : null,
      severity || 'Moderate',
      image_url || null,
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
        lat,
        lng,
        severity: severity || 'Moderate',
        image_url: image_url || null,
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

