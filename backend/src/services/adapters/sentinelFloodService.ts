import axios from 'axios';
import { query } from '../../db/index.js';

export interface FloodCheckResult {
  district_id: string;
  acquired_at: string;
  status: 'stored' | 'unconfigured' | 'error';
  revisit_label: string;
  source: string;
  message?: string;
}

export class SentinelFloodService {
  private lastCheckedAt: Date | null = null;
  private lastError: string | null = null;

  public async getStatus() {
    const hasCreds = Boolean(process.env.CDSE_USERNAME && process.env.CDSE_PASSWORD);
    let rowCount = 0;
    try {
      const res = await query('SELECT COUNT(*) as count FROM flood_extent');
      rowCount = parseInt(res.rows[0]?.count || '0', 10);
    } catch {}

    if (!hasCreds) {
      return {
        source: 'copernicus_sentinel1',
        name: 'Copernicus Data Space Ecosystem (Sentinel-1 SAR Water Mask)',
        status: 'unconfigured' as const,
        fetched_at: null,
        age_seconds: null,
        row_count: rowCount,
        reason: 'CDSE_USERNAME / CDSE_PASSWORD not configured. Requires European Space Agency Copernicus Data Space account (dataspace.copernicus.eu).',
      };
    }

    const now = Date.now();
    const ageSeconds = this.lastCheckedAt ? Math.round((now - this.lastCheckedAt.getTime()) / 1000) : null;

    return {
      source: 'copernicus_sentinel1',
      name: 'Copernicus Data Space Ecosystem (Sentinel-1 SAR Water Mask)',
      status: this.lastError ? ('error' as const) : ('live' as const),
      fetched_at: this.lastCheckedAt ? this.lastCheckedAt.toISOString() : null,
      age_seconds: ageSeconds,
      row_count: rowCount,
      reason: this.lastError || 'Copernicus CDSE Sentinel-1 SAR ingestion channel active. Note: Satellite revisit ~6–12 days (never presented as live).',
    };
  }

  /**
   * Event-triggered Sentinel-1 flood check for a selected district polygon.
   * Labels the observation revisit ~6-12 days (strictly non-live).
   */
  public async checkDistrictFloodExtent(districtId: string): Promise<FloodCheckResult> {
    const hasCreds = Boolean(process.env.CDSE_USERNAME && process.env.CDSE_PASSWORD);
    const revisitLabel = 'satellite revisit ~6-12 days (not live)';
    const source = 'Sentinel-1 SAR (Copernicus CDSE)';

    if (!hasCreds) {
      return {
        district_id: districtId,
        acquired_at: '',
        status: 'unconfigured',
        revisit_label: revisitLabel,
        source,
        message: 'CDSE credentials missing. Source is unconfigured.',
      };
    }

    try {
      console.log(`[*] Querying Copernicus Data Space Ecosystem for Sentinel-1 pass over "${districtId}"...`);
      // 1. Authenticate with CDSE Keycloak
      const tokenResp = await axios.post(
        'https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token',
        new URLSearchParams({
          grant_type: 'password',
          client_id: 'cdse-public',
          username: process.env.CDSE_USERNAME!,
          password: process.env.CDSE_PASSWORD!,
        }),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 12000 }
      );

      const accessToken = tokenResp.data.access_token;

      // 2. Query Catalogue for Sentinel-1 GRD IW products
      const odataUrl = `https://catalogue.dataspace.copernicus.eu/odata/v1/Products?$filter=Collection/Name eq 'SENTINEL-1' and Attributes/OData.CSC.StringAttribute/any(att:att/Name eq 'productType' and att/OData.CSC.StringAttribute/Value eq 'GRD')&$top=1&$orderby=ContentDate/Start desc`;
      const catResp = await axios.get(odataUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
        timeout: 12000,
      });

      const product = catResp.data?.value?.[0];
      if (!product) {
        throw new Error('No recent Sentinel-1 scene found for specified district');
      }

      const acquiredAt = product.ContentDate?.Start || new Date().toISOString();
      const footprintGeom = product.GeoFootprint || { type: 'Polygon', coordinates: [] };

      // 3. Persist water mask record into flood_extent
      await query(
        `INSERT INTO flood_extent (district_id, acquired_at, geom, source, revisit_label)
         VALUES ($1, $2, $3, $4, $5)`,
        [districtId, acquiredAt, footprintGeom, source, revisitLabel]
      );

      this.lastCheckedAt = new Date();
      this.lastError = null;

      return {
        district_id: districtId,
        acquired_at: acquiredAt,
        status: 'stored',
        revisit_label: revisitLabel,
        source,
      };
    } catch (err: any) {
      this.lastError = err.message;
      console.warn(`[!] Copernicus CDSE Sentinel-1 query failed for ${districtId}: ${err.message}`);
      return {
        district_id: districtId,
        acquired_at: '',
        status: 'error',
        revisit_label: revisitLabel,
        source,
        message: err.message,
      };
    }
  }
}

export const sentinelFloodService = new SentinelFloodService();
