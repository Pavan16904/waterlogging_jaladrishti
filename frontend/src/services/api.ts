import axios from 'axios';
import { StudyArea, SeverityZone, DrainageAdvisory, AnalysisRun, FAO56IrrigationResult, ModelMetrics, SatelliteMeta, LiveDrainageAdvisory } from '../types';

const API_BASE = '/api';

export const api = {
  // Study Areas
  getStudyAreas: async (): Promise<StudyArea[]> => {
    const res = await axios.get(`${API_BASE}/study-areas`);
    return res.data.data;
  },

  getStudyAreaById: async (id: string): Promise<StudyArea> => {
    const res = await axios.get(`${API_BASE}/study-areas/${id}`);
    return res.data.data;
  },

  // Analysis
  getLatestAnalysis: async (studyAreaId: string): Promise<{ run: AnalysisRun; zones: SeverityZone[]; advisories: DrainageAdvisory[] }> => {
    const res = await axios.get(`${API_BASE}/analysis/${studyAreaId}/latest`);
    return res.data;
  },

  runAnalysis: async (payload: {
    studyAreaId: string;
    preEventDate?: string;
    postEventDate?: string;
    rainfallMm?: number;
    modelType?: string;
  }): Promise<{ success: boolean; runId: string; analysis: any }> => {
    const res = await axios.post(`${API_BASE}/analysis/run`, payload);
    return res.data;
  },

  // Advisories
  getAdvisoriesByRun: async (runId: string): Promise<DrainageAdvisory[]> => {
    const res = await axios.get(`${API_BASE}/advisories/run/${runId}`);
    return res.data.data;
  },

  getAllAdvisories: async (): Promise<DrainageAdvisory[]> => {
    const res = await axios.get(`${API_BASE}/advisories`);
    return res.data.data;
  },

  // FAO-56 Irrigation
  calculateIrrigation: async (payload: {
    cropName: string;
    daysSincePlanting: number;
    soilType?: string;
    districtName?: string;
    tempMinC?: number;
    tempMaxC?: number;
    recentRainfallMm?: number;
    currentDepletionMm?: number;
    latitudeDeg?: number;
    fieldAreaHa?: number;
  }): Promise<FAO56IrrigationResult> => {
    const res = await axios.post(`${API_BASE}/irrigation/calculate`, payload);
    return res.data.data;
  },

  getCropCatalog: async (): Promise<{ crops: string[]; categories: Record<string, string[]>; soils: string[]; soil_details: any; karnataka_districts: any; crop_details: any }> => {
    const res = await axios.get(`${API_BASE}/irrigation/catalog`);
    return res.data.data;
  },

  getKarnatakaDistricts: async (): Promise<{ count: number; districts: Record<string, any> }> => {
    const res = await axios.get(`${API_BASE}/irrigation/karnataka-districts`);
    return res.data.data;
  },

  // ML Performance Metrics
  getModelMetrics: async (): Promise<ModelMetrics> => {
    const res = await axios.get(`${API_BASE}/metrics`);
    return res.data.data;
  },

  // Report Summary
  getReportSummary: async (runId: string): Promise<any> => {
    const res = await axios.get(`${API_BASE}/reports/summary/${runId}`);
    return res.data;
  },

  // Open-Meteo Real Weather Observatory
  getDistrictWeather: async (district: string, refresh = false, signal?: AbortSignal): Promise<any> => {
    const res = await axios.get(
      `${API_BASE}/weather/forecast/${encodeURIComponent(district)}${refresh ? '?refresh=true' : ''}`,
      { signal }
    );
    const body = res.data;
    if (body && body.data) {
      return {
        success: body.success ?? true,
        isCached: body.isCached,
        isStale: body.isStale,
        lastUpdated: body.lastUpdated,
        provider: body.provider,
        ...body.data
      };
    }
    return body;
  },

  getAllDistrictsWeather: async (refresh = false): Promise<any[]> => {
    const res = await axios.get(`${API_BASE}/weather/summary${refresh ? '?refresh=true' : ''}`);
    return res.data?.data || (Array.isArray(res.data) ? res.data : []);
  },

  // Real-Time Doppler Radar, IoT Telemetry, Remote Actuator & Live Nowcast
  getRadarMeta: async (refresh = false): Promise<any> => {
    const res = await axios.get(`${API_BASE}/realtime/radar-meta${refresh ? '?refresh=true' : ''}`);
    return res.data;
  },

  // NASA GIBS Earth Observation Satellite Layer Metadata
  getSatelliteMeta: async (refresh = false): Promise<{ success: boolean; data: SatelliteMeta; lastUpdated?: string; isCached?: boolean; isStale?: boolean }> => {
    const res = await axios.get(`${API_BASE}/realtime/satellite-meta${refresh ? '?refresh=true' : ''}`);
    return res.data;
  },

  // Weather-Based Drainage Guidance (Requirement 3)
  getLiveDrainageAdvisory: async (districtId: string, refresh = false): Promise<{ success: boolean; data: LiveDrainageAdvisory; lastUpdated?: string; isCached?: boolean; isStale?: boolean; providerStatus?: string }> => {
    const res = await axios.get(`${API_BASE}/realtime/drainage-advisory/${encodeURIComponent(districtId)}${refresh ? '?refresh=true' : ''}`);
    return res.data;
  },

  // District-specific waterlogging incidents for advisory evidence
  getDistrictIncidents: async (districtId: string): Promise<{ incidents: any[]; count: number }> => {
    const res = await axios.get(`${API_BASE}/incidents?district_id=${encodeURIComponent(districtId)}&limit=100`);
    return res.data;
  },

  // District-specific drainage infrastructure summary from database
  getDrainageSummary: async (districtId: string): Promise<any> => {
    const res = await axios.get(`${API_BASE}/drainage/summary?district_id=${encodeURIComponent(districtId)}`);
    return res.data;
  },

  // District-specific drainage assets from database
  getDrainageAssets: async (districtId: string, limit = 100): Promise<any> => {
    const res = await axios.get(`${API_BASE}/drainage/assets?district_id=${encodeURIComponent(districtId)}&limit=${limit}`);
    return res.data;
  },


  getIoTSensors: async (districtId?: string): Promise<{ summary: any; sensors: any[] }> => {
    const res = await axios.get(`${API_BASE}/realtime/iot-sensors${districtId ? `?districtId=${encodeURIComponent(districtId)}` : ''}`);
    return res.data;
  },

  updatePumpActuator: async (sensorId: string, command: 'AUTO' | 'MANUAL_ON' | 'MANUAL_OFF' | 'EMERGENCY_BOOST'): Promise<any> => {
    const res = await axios.post(`${API_BASE}/realtime/pump-actuator`, { sensorId, command });
    return res.data;
  },

  getLiveAlerts: async (params?: { district_id?: string; status?: string; include_resolved?: boolean; limit?: number }): Promise<{ count: number; alerts: any[] }> => {
    const q = new URLSearchParams();
    if (params?.district_id) q.set('district_id', params.district_id);
    if (params?.status) q.set('status', params.status);
    if (params?.include_resolved) q.set('include_resolved', 'true');
    if (params?.limit) q.set('limit', String(params.limit));
    const qs = q.toString() ? `?${q.toString()}` : '';
    const res = await axios.get(`${API_BASE}/realtime/live-alerts${qs}`);
    return res.data;
  },

  getRealtimeNowcast: async (districtId: string, refresh = false): Promise<any> => {
    const res = await axios.get(`${API_BASE}/realtime/nowcast/${encodeURIComponent(districtId)}${refresh ? '?refresh=true' : ''}`);
    return res.data;
  },

  // Modelled precipitation from Open-Meteo; this is not a ground observation.
  getTodayRainfall: async (lat: number, lng: number, districtName?: string, refresh = false): Promise<{
    success: boolean;
    date: string;
    modeledDailyPrecipitationMm: number;
    currentPrecipitationMm: number;
    currentTempC: number;
    currentHumidityPct: number;
    currentWindKmh: number;
    currentWmoCode: number;
    last7DaysHistory: Array<{ date: string; precipitationMm: number }>;
    timestamp: string;
    provider?: string;
    dataType?: string;
    providerValidTime?: string;
    timezone?: string;
    providerUtcOffsetSeconds?: number;
    providerLatencyMs?: number;
    backendRetrievedAt?: string;
    isCached?: boolean;
    isStale?: boolean;
    providerStatus?: string;
    error?: string;
    message?: string;
  }> => {
    const params = new URLSearchParams({ lat: String(lat), lng: String(lng) });
    if (districtName) params.set('districtName', districtName);
    if (refresh) params.set('refresh', 'true');
    const res = await axios.get(`${API_BASE}/realtime/today-rainfall?${params}`);
    return res.data;
  },

  // Early Warning & Pre-Flood Precaution Forecast
  getEarlyWarningForecast: async (districtId: string, refresh = false): Promise<any> => {
    const res = await axios.get(`${API_BASE}/realtime/early-warning/${encodeURIComponent(districtId)}${refresh ? '?refresh=true' : ''}`);
    return res.data;
  },

  // Modelled Waterlogging Risk Hex Map
  getWaterlogHexes: async (params: { valid_time?: string; res?: number; bbox?: string; district_id?: string; district?: string; limit?: number }): Promise<{ success: boolean; hexes: any[]; count: number; valid_time?: string; reason?: string }> => {
    const queryParams = new URLSearchParams();
    if (params.valid_time) queryParams.set('valid_time', params.valid_time);
    if (params.res) queryParams.set('res', String(params.res));
    if (params.bbox) queryParams.set('bbox', params.bbox);
    const dId = params.district_id || params.district;
    if (dId) queryParams.set('district_id', dId);
    if (params.limit) queryParams.set('limit', String(params.limit));
    const res = await axios.get(`${API_BASE}/waterlog/hexes?${queryParams.toString()}`);
    return res.data;
  },

  // Modelled Waterlogging Risk Areas (15-25 top catchment risk areas grounded in empirical data)
  getEstimatedRiskAreas: async (districtId: string, limit = 20): Promise<{
    success: boolean;
    district_id: string;
    count: number;
    by_severity: { severe: number; high: number; moderate: number; minor: number };
    rainfall_context: any;
    drainage_context: any;
    history_context: any;
    risk_areas: any[];
    source: string;
    freshness: string;
  }> => {
    const res = await axios.get(`${API_BASE}/waterlog/risk-areas?district_id=${encodeURIComponent(districtId)}&limit=${limit}`);
    return res.data;
  },

  getWaterlogStatus: async (districtId?: string): Promise<any> => {
    const query = districtId ? `?district_id=${encodeURIComponent(districtId)}` : '';
    const res = await axios.get(`${API_BASE}/waterlog/status${query}`);
    return res.data;
  },

  // Phase 3 Endpoints
  getWeatherByDistrictId: async (districtId: string): Promise<any> => {
    const res = await axios.get(`${API_BASE}/weather/district/${encodeURIComponent(districtId)}`);
    return res.data;
  },

  getCropWaterAdvice: async (params: { district: string; crop: string; sowing_date?: string; days_since_sowing?: number; soil: string; plot_area?: number }): Promise<any> => {
    const q = new URLSearchParams({
      district: params.district,
      crop: params.crop,
      soil: params.soil,
      plot_area: String(params.plot_area ?? 1.0),
    });
    if (params.sowing_date) q.set('sowing_date', params.sowing_date);
    if (params.days_since_sowing !== undefined) q.set('days_since_sowing', String(params.days_since_sowing));
    const res = await axios.get(`${API_BASE}/crop/advice?${q.toString()}`);
    return res.data;
  },

  getDrainageActions: async (district: string, date?: string): Promise<any> => {
    const q = new URLSearchParams({ district });
    if (date) q.set('date', date);
    const res = await axios.get(`${API_BASE}/drainage/actions?${q.toString()}`);
    return res.data;
  },

  getPipelineStatus: async (): Promise<any> => {
    const res = await axios.get(`${API_BASE}/status`);
    return res.data;
  },

  getWaterlogSummary: async (districtId?: string): Promise<any> => {
    const q = districtId ? `?district_id=${encodeURIComponent(districtId)}` : '';
    const res = await axios.get(`${API_BASE}/waterlog/summary${q}`);
    return res.data;
  },

  // Genuine Waterlogging Incidents & Shared Drainage Repository
  getIncidents: async (params?: {
    district_id?: string;
    severity?: string;
    event_type?: string;
    status?: string;
    include_rejected?: boolean;
    has_coords?: boolean;
    date_from?: string;
    date_to?: string;
    limit?: number;
  }): Promise<any> => {
    const q = new URLSearchParams();
    if (params?.district_id) q.set('district_id', params.district_id);
    if (params?.severity && params.severity !== 'ALL') q.set('severity', params.severity);
    if (params?.event_type && params.event_type !== 'ALL') q.set('event_type', params.event_type);
    if (params?.status && params.status !== 'ALL') q.set('status', params.status);
    if (params?.include_rejected) q.set('include_rejected', 'true');
    if (params?.has_coords !== undefined) q.set('has_coords', String(params.has_coords));
    if (params?.date_from) q.set('date_from', params.date_from);
    if (params?.date_to) q.set('date_to', params.date_to);
    if (params?.limit) q.set('limit', String(params.limit));
    const queryStr = q.toString() ? `?${q.toString()}` : '';
    const res = await axios.get(`${API_BASE}/incidents${queryStr}`);
    return res.data;
  },

  submitIncident: async (data: any): Promise<any> => {
    const res = await axios.post(`${API_BASE}/incidents`, data);
    return res.data;
  },

  updateIncidentStatus: async (id: string, status: string): Promise<any> => {
    const res = await axios.patch(`${API_BASE}/incidents/${encodeURIComponent(id)}/status`, { status });
    return res.data;
  },

  // Genuine Satellite-Derived Surface Water Extent (NASA OPERA DSWx-S1 Sentinel-1 SAR)
  getOperaFloodObservations: async (districtId?: string): Promise<any> => {
    const q = districtId ? `?district_id=${encodeURIComponent(districtId)}` : '';
    const res = await axios.get(`${API_BASE}/satellite/opera-dswx${q}`);
    return res.data;
  },

  importDrainageDistrict: async (districtId: string): Promise<any> => {
    const res = await axios.post(`${API_BASE}/drainage/import/${encodeURIComponent(districtId)}`);
    return res.data;
  },

  getDrainageLines: async (districtId: string, type?: string): Promise<any> => {
    const q = type ? `&type=${encodeURIComponent(type)}` : '';
    const res = await axios.get(`${API_BASE}/drainage/lines?district_id=${encodeURIComponent(districtId)}${q}`);
    return res.data;
  }
};
