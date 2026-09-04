import { Request, Response } from 'express';
import { query } from '../db/index.js';

export async function getStudyAreas(req: Request, res: Response) {
  try {
    const result = await query(
      `SELECT id, name, state_region, country, description, center_lat, center_lng, zoom_level, bounds_geojson, created_at
       FROM study_areas ORDER BY name ASC;`
    );
    return res.json({ success: true, count: result.rowCount, data: result.rows });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export async function getStudyAreaById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT * FROM study_areas WHERE id = $1;`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Study area not found' });
    }
    return res.json({ success: true, data: result.rows[0] });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
