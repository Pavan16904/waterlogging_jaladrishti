import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as h3 from 'h3-js';
import { query } from '../db/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface DistrictFeature {
  district_id: string;
  district_name: string;
  center_lat: number;
  center_lng: number;
  hexCount: number;
}

export class DistrictsService {
  private geojsonPath: string;
  private cachedDistricts: DistrictFeature[] | null = null;

  constructor() {
    // Look in project root /data or relative paths
    const rootPath = path.resolve(__dirname, '../../../data/karnataka_districts.geojson');
    const localPath = path.resolve(__dirname, '../../data/karnataka_districts.geojson');
    this.geojsonPath = fs.existsSync(rootPath) ? rootPath : localPath;
  }

  public getGeoJson(): any {
    if (!fs.existsSync(this.geojsonPath)) {
      throw new Error(`Districts GeoJSON not found at ${this.geojsonPath}`);
    }
    const raw = fs.readFileSync(this.geojsonPath, 'utf8');
    return JSON.parse(raw);
  }

  public verifyDistrictCount(): { count: number; isValid: boolean; districtNames: string[] } {
    const geo = this.getGeoJson();
    const count = Array.isArray(geo.features) ? geo.features.length : 0;
    const districtNames = (geo.features || []).map((f: any) => f.properties.district_name || f.properties.district_id);
    return {
      count,
      isValid: count === 31,
      districtNames,
    };
  }

  /**
   * Generates H3 Resolution 7 cells for a polygon / multipolygon feature
   */
  public getHexesForFeature(feature: any, resolution: number = 7): string[] {
    const geom = feature.geometry;
    let cells: string[] = [];

    if (geom.type === 'Polygon') {
      cells = h3.polygonToCells(geom.coordinates, resolution, true);
    } else if (geom.type === 'MultiPolygon') {
      for (const poly of geom.coordinates) {
        const polyCells = h3.polygonToCells(poly, resolution, true);
        cells = cells.concat(polyCells);
      }
    }
    // Remove duplicates if any overlap
    return Array.from(new Set(cells));
  }

  /**
   * Initializes and populates district_hexes in database if empty
   */
  public async ensureDistrictHexesSeeded(): Promise<{ seeded: boolean; totalHexes: number }> {
    try {
      const checkRes = await query('SELECT COUNT(*) as count FROM district_hexes');
      const existingCount = parseInt(checkRes.rows[0]?.count || '0', 10);
      if (existingCount >= 10000) {
        return { seeded: false, totalHexes: existingCount };
      }

      if (existingCount > 0) {
        await query('DELETE FROM district_hexes');
      }

      console.log('[*] Seeding H3 Resolution 7 district_hexes for all 31 Karnataka districts...');
      const geo = this.getGeoJson();
      let totalInserted = 0;

      await query('BEGIN');
      try {
        for (const feature of geo.features) {
          const districtId = feature.properties.district_id;
          const districtName = feature.properties.district_name;
          const hexes = this.getHexesForFeature(feature, 7);

          for (const cell of hexes) {
            const [lat, lng] = h3.cellToLatLng(cell);
            await query(
              `INSERT INTO district_hexes (h3_index, district_id, district_name, lat, lng, resolution)
               VALUES ($1, $2, $3, $4, $5, 7)
               ON CONFLICT (h3_index) DO NOTHING`,
              [cell, districtId, districtName, lat, lng]
            );
          }
          totalInserted += hexes.length;
        }
        await query('COMMIT');
      } catch (insertErr) {
        await query('ROLLBACK');
        throw insertErr;
      }

      console.log(`[+] Successfully seeded ${totalInserted} H3 Res 7 hexes across 31 districts.`);
      return { seeded: true, totalHexes: totalInserted };
    } catch (err: any) {
      console.error('[-] Error seeding district_hexes:', err.message);
      throw err;
    }
  }

  /**
   * Retrieves list of 31 districts with centroids
   */
  public getDistrictsWithCentroids(): DistrictFeature[] {
    if (this.cachedDistricts) return this.cachedDistricts;

    const geo = this.getGeoJson();
    const result: DistrictFeature[] = [];

    for (const f of geo.features) {
      const hexes = this.getHexesForFeature(f, 7);
      let sumLat = 0;
      let sumLng = 0;
      for (const h of hexes) {
        const [lat, lng] = h3.cellToLatLng(h);
        sumLat += lat;
        sumLng += lng;
      }
      const centerLat = hexes.length > 0 ? sumLat / hexes.length : 12.9716;
      const centerLng = hexes.length > 0 ? sumLng / hexes.length : 77.5946;

      result.push({
        district_id: f.properties.district_id,
        district_name: f.properties.district_name,
        center_lat: centerLat,
        center_lng: centerLng,
        hexCount: hexes.length,
      });
    }

    this.cachedDistricts = result;
    return result;
  }
}

export const districtsService = new DistrictsService();
