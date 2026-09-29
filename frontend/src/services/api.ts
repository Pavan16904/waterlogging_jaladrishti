import axios from 'axios';
import { StudyArea, SeverityZone, DrainageAdvisory, AnalysisRun, FAO56IrrigationResult, ModelMetrics } from '../types';

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
  getDistrictWeather: async (district: string): Promise<any> => {
    const res = await axios.get(`${API_BASE}/weather/forecast/${encodeURIComponent(district)}`);
    return res.data.data;
  },

  getAllDistrictsWeather: async (): Promise<any[]> => {
    const res = await axios.get(`${API_BASE}/weather/summary`);
    return res.data.data;
  },

  // Real-Time Doppler Radar, IoT Telemetry, Remote Actuator & Live Nowcast
  getRadarMeta: async (): Promise<any> => {
    const res = await axios.get(`${API_BASE}/realtime/radar-meta`);
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

  getLiveAlerts: async (): Promise<{ count: number; alerts: any[] }> => {
    const res = await axios.get(`${API_BASE}/realtime/live-alerts`);
    return res.data;
  },

  getRealtimeNowcast: async (districtId: string): Promise<any> => {
    const res = await axios.get(`${API_BASE}/realtime/nowcast/${encodeURIComponent(districtId)}`);
    return res.data;
  },

  // Live Today Rainfall from Open-Meteo (actual accumulated mm for today)
  getTodayRainfall: async (lat: number, lng: number, districtName?: string): Promise<{
    success: boolean;
    date: string;
    todayRainfallMm: number;
    currentRainRateMm: number;
    currentTempC: number;
    currentHumidityPct: number;
    currentWindKmh: number;
    currentWmoCode: number;
    riskLevel: string;
    riskColor: string;
    last7DaysHistory: Array<{ date: string; rainfallMm: number }>;
    timestamp: string;
    fallback?: boolean;
  }> => {
    const params = new URLSearchParams({ lat: String(lat), lng: String(lng) });
    if (districtName) params.set('districtName', districtName);
    const res = await axios.get(`${API_BASE}/realtime/today-rainfall?${params}`);
    return res.data;
  }
};
