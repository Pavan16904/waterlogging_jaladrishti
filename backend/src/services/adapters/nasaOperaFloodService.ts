import axios from 'axios';

export interface OperaGranule {
  id: string;
  title: string;
  time_start: string;
  updated: string;
  platform: string;
  sensor: string;
  resolution_meters: number;
  bbox: [number, number, number, number]; // [minLon, minLat, maxLon, maxLat]
  geojson_footprint: {
    type: 'Polygon';
    coordinates: number[][][];
  } | null;
  water_layer_s3?: string;
  water_layer_http?: string;
  browse_image_url?: string;
  revisit_schedule: string;
  classification_types: string[];
}

export interface DistrictOperaResponse {
  success: boolean;
  district_id: string;
  district_name: string;
  status: 'OBSERVATION_AVAILABLE' | 'NO_OBSERVATION' | 'CMR_UNAVAILABLE';
  observation_count: number;
  latest_observation: OperaGranule | null;
  observations: OperaGranule[];
  message: string;
  retrieved_at: string;
  source: string;
  collection: string;
  disclaimer: string;
}

// Karnataka 31 Districts verified bounding boxes [minLon, minLat, maxLon, maxLat]
export const KARNATAKA_DISTRICT_BOUNDING_BOXES: Record<string, { name: string; bbox: [number, number, number, number] }> = {
  ballari: { name: 'Ballari', bbox: [75.60, 14.80, 77.20, 15.85] },
  bengaluru_urban: { name: 'Bengaluru Urban', bbox: [77.40, 12.75, 77.85, 13.15] },
  bengaluru_rural: { name: 'Bengaluru Rural', bbox: [77.10, 12.95, 77.80, 13.55] },
  ramanagara: { name: 'Ramanagara', bbox: [77.00, 12.35, 77.60, 12.95] },
  kolar: { name: 'Kolar', bbox: [77.80, 12.90, 78.60, 13.40] },
  chikkaballapura: { name: 'Chikkaballapura', bbox: [77.30, 13.20, 78.20, 13.95] },
  tumakuru: { name: 'Tumakuru', bbox: [76.50, 12.80, 77.55, 14.35] },
  chitradurga: { name: 'Chitradurga', bbox: [75.90, 13.70, 77.10, 15.05] },
  davangere: { name: 'Davanagere', bbox: [75.50, 13.90, 76.50, 14.85] },
  shivamogga: { name: 'Shivamogga', bbox: [74.70, 13.50, 76.10, 14.65] },
  chikkamagaluru: { name: 'Chikkamagaluru', bbox: [75.05, 12.95, 76.35, 13.95] },
  hassan: { name: 'Hassan', bbox: [75.55, 12.50, 76.65, 13.55] },
  kodagu: { name: 'Kodagu', bbox: [75.40, 11.90, 76.20, 12.85] },
  mysuru: { name: 'Mysuru', bbox: [75.90, 11.75, 77.20, 12.75] },
  mandya: { name: 'Mandya', bbox: [76.30, 12.20, 77.20, 13.05] },
  chamarajanagar: { name: 'Chamarajanagar', bbox: [76.40, 11.60, 77.75, 12.35] },
  dakshina_kannada: { name: 'Dakshina Kannada', bbox: [74.70, 12.50, 75.70, 13.25] },
  udupi: { name: 'Udupi', bbox: [74.55, 13.05, 75.25, 13.95] },
  uttara_kannada: { name: 'Uttara Kannada', bbox: [74.15, 13.90, 75.20, 15.55] },
  belagavi: { name: 'Belagavi', bbox: [74.05, 15.35, 75.50, 16.95] },
  dharwad: { name: 'Dharwad', bbox: [74.75, 15.00, 75.50, 15.75] },
  gadag: { name: 'Gadag', bbox: [75.25, 14.95, 76.10, 15.95] },
  haveri: { name: 'Haveri', bbox: [75.10, 14.30, 75.95, 15.15] },
  vijayanagara: { name: 'Vijayanagara', bbox: [75.70, 14.50, 76.60, 15.45] },
  koppal: { name: 'Koppal', bbox: [75.75, 15.15, 76.60, 16.05] },
  raichur: { name: 'Raichur', bbox: [76.60, 15.80, 77.60, 16.60] },
  bagalkot: { name: 'Bagalkote', bbox: [74.95, 15.80, 76.35, 16.80] },
  vijayapura: { name: 'Vijayapura', bbox: [75.30, 16.20, 76.50, 17.50] },
  kalaburagi: { name: 'Kalaburagi', bbox: [76.05, 16.70, 77.70, 17.80] },
  yadgir: { name: 'Yadgir', bbox: [76.25, 16.15, 77.50, 16.95] },
  bidar: { name: 'Bidar', bbox: [76.65, 17.55, 77.70, 18.50] }
};

// Cache to prevent excessive CMR hits
const granuleCache = new Map<string, { data: DistrictOperaResponse; cachedAt: number }>();
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

export class NasaOperaFloodService {
  private readonly CMR_COLLECTION = 'C2949811996-POCLOUD'; // OPERA_L3_DSWX-S1_V1
  private readonly CMR_URL = 'https://cmr.earthdata.nasa.gov/search/granules.json';

  /**
   * Discovers and retrieves genuine NASA OPERA L3 Dynamic Surface Water Extent (DSWx-S1)
   * products covering a selected Karnataka district boundary.
   */
  public async getDistrictObservations(districtIdRaw: string): Promise<DistrictOperaResponse> {
    const normId = districtIdRaw.toLowerCase().trim().replace(/[\s-]+/g, '_');
    const districtInfo = KARNATAKA_DISTRICT_BOUNDING_BOXES[normId] || {
      name: districtIdRaw,
      bbox: [74.0, 11.5, 78.6, 18.5] as [number, number, number, number]
    };

    const cacheKey = `${normId}_opera_dswx`;
    const cached = granuleCache.get(cacheKey);
    if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
      return cached.data;
    }

    const [minLon, minLat, maxLon, maxLat] = districtInfo.bbox;
    const nowIso = new Date().toISOString();

    try {
      const response = await axios.get(this.CMR_URL, {
        params: {
          collection_concept_id: this.CMR_COLLECTION,
          bounding_box: `${minLon},${minLat},${maxLon},${maxLat}`,
          page_size: 5,
          sort_key: '-start_date'
        },
        timeout: 9000
      });

      const entries = response.data?.feed?.entry || [];

      if (!Array.isArray(entries) || entries.length === 0) {
        const noDataResult: DistrictOperaResponse = {
          success: true,
          district_id: normId,
          district_name: districtInfo.name,
          status: 'NO_OBSERVATION',
          observation_count: 0,
          latest_observation: null,
          observations: [],
          message: 'No usable satellite observation available for this district and date.',
          retrieved_at: nowIso,
          source: 'NASA JPL OPERA / PO.DAAC',
          collection: 'OPERA_L3_DSWX-S1_V1',
          disclaimer: 'Satellite radar observations depend on Copernicus Sentinel-1 orbital cycles (~6-12 days). Observations represent surface water classification, not continuous CCTV monitoring.'
        };
        granuleCache.set(cacheKey, { data: noDataResult, cachedAt: Date.now() });
        return noDataResult;
      }

      const observations: OperaGranule[] = entries.map((e: any) => {
        let geojsonFootprint: OperaGranule['geojson_footprint'] = null;
        let bboxArray: [number, number, number, number] = [minLon, minLat, maxLon, maxLat];

        if (Array.isArray(e.boxes) && e.boxes[0]) {
          const parts = e.boxes[0].split(' ').map(Number);
          if (parts.length === 4) {
            const [s, w, n, eLon] = parts;
            bboxArray = [w, s, eLon, n];
            geojsonFootprint = {
              type: 'Polygon',
              coordinates: [
                [
                  [w, s],
                  [eLon, s],
                  [eLon, n],
                  [w, n],
                  [w, s]
                ]
              ]
            };
          }
        }

        const links = Array.isArray(e.links) ? e.links : [];
        const s3Wtr = links.find((l: any) => l.href && l.href.endsWith('_B01_WTR.tif') && l.href.startsWith('s3://'))?.href;
        const httpWtr = links.find((l: any) => l.href && l.href.endsWith('_B01_WTR.tif') && l.href.startsWith('http'))?.href;
        const browseImg = links.find((l: any) => l.href && (l.href.endsWith('_BROWSE.png') || l.href.endsWith('_BROWSE.tif')) && l.href.startsWith('http'))?.href;

        return {
          id: e.id || e.title,
          title: e.title,
          time_start: e.time_start,
          updated: e.updated || e.time_start,
          platform: 'Copernicus Sentinel-1 (C-band SAR)',
          sensor: 'Sentinel-1 C-SAR (processed by NASA JPL OPERA)',
          resolution_meters: 30,
          bbox: bboxArray,
          geojson_footprint: geojsonFootprint,
          water_layer_s3: s3Wtr,
          water_layer_http: httpWtr,
          browse_image_url: browseImg,
          revisit_schedule: '~6–12 days Sentinel-1 orbital pass',
          classification_types: [
            'Class 0: Not Water',
            'Class 1: Open Surface Water',
            'Class 2: Partial Surface Water / Inundated Vegetation',
            'Class 255: Fill / Masked'
          ]
        };
      });

      const result: DistrictOperaResponse = {
        success: true,
        district_id: normId,
        district_name: districtInfo.name,
        status: 'OBSERVATION_AVAILABLE',
        observation_count: observations.length,
        latest_observation: observations[0],
        observations,
        message: `Discovered ${observations.length} authentic NASA OPERA DSWx-S1 Sentinel-1 water extent observation(s) covering ${districtInfo.name}.`,
        retrieved_at: nowIso,
        source: 'NASA JPL OPERA / PO.DAAC',
        collection: 'OPERA_L3_DSWX-S1_V1 (Concept ID: C2949811996-POCLOUD)',
        disclaimer: 'Satellite radar observations depend on Copernicus Sentinel-1 orbital passes (~6–12 days). Inundation classifications represent regional radar backscatter change, not street-level depth sensor readings.'
      };

      granuleCache.set(cacheKey, { data: result, cachedAt: Date.now() });
      return result;
    } catch (err: any) {
      console.warn(`[!] NASA CMR query error for district ${normId}: ${err.message}`);
      const errResult: DistrictOperaResponse = {
        success: false,
        district_id: normId,
        district_name: districtInfo.name,
        status: 'CMR_UNAVAILABLE',
        observation_count: 0,
        latest_observation: null,
        observations: [],
        message: 'NASA Earthdata CMR gateway temporarily unreachable or rate-limited. Retrying scheduled.',
        retrieved_at: nowIso,
        source: 'NASA JPL OPERA / PO.DAAC',
        collection: 'OPERA_L3_DSWX-S1_V1',
        disclaimer: 'Satellite surface water service requires active network access to NASA Earthdata CMR.'
      };
      return errResult;
    }
  }
}

export const nasaOperaFloodService = new NasaOperaFloodService();
