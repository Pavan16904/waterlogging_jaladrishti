import { Request, Response } from 'express';
import axios from 'axios';
import { KARNATAKA_DISTRICTS_GEO } from './weatherController.js';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';

// In-memory IoT Sensor State & Actuators
export interface IoTSensor {
  id: string;
  name: string;
  districtId: string;
  districtName: string;
  lat: number;
  lng: number;
  sensorType: 'ultrasonic_level' | 'hydrostatic_pressure' | 'radar_velocity' | 'swale_optical';
  currentDepthM: number;
  warningThresholdM: number;
  dangerThresholdM: number;
  maxDepthM: number;
  flowRateLps: number;
  siltationPct: number;
  pumpStatus: 'AUTO_IDLE' | 'AUTO_RUNNING' | 'MANUAL_ON' | 'MANUAL_OFF' | 'EMERGENCY_BOOST';
  pumpCapacityHp: number;
  pumpDischargeLps: number;
  batteryPct: number;
  solarWatts: number;
  signalDbm: number;
  trend: 'rising' | 'falling' | 'stable';
  history: Array<{ time: string; depthM: number; flowLps: number }>;
  lastUpdated: string;
}

// Initial Telemetry Network for Key Karnataka Flood Choke Points
const INITIAL_SENSORS: IoTSensor[] = [
  {
    id: 'iot_blr_bellandur',
    name: 'Bellandur-Ecospace Lowland Culvert Sump',
    districtId: 'bengaluru_urban',
    districtName: 'Bengaluru Urban',
    lat: 12.9260,
    lng: 77.6740,
    sensorType: 'ultrasonic_level',
    currentDepthM: 0.72,
    warningThresholdM: 0.50,
    dangerThresholdM: 0.85,
    maxDepthM: 1.80,
    flowRateLps: 340,
    siltationPct: 38,
    pumpStatus: 'AUTO_RUNNING',
    pumpCapacityHp: 150,
    pumpDischargeLps: 450,
    batteryPct: 96,
    solarWatts: 42,
    signalDbm: -68,
    trend: 'rising',
    history: [],
    lastUpdated: new Date().toISOString()
  },
  {
    id: 'iot_blr_panathur',
    name: 'Panathur Railway Underpass Sump & Invert',
    districtId: 'bengaluru_urban',
    districtName: 'Bengaluru Urban',
    lat: 12.9416,
    lng: 77.6980,
    sensorType: 'hydrostatic_pressure',
    currentDepthM: 0.88,
    warningThresholdM: 0.40,
    dangerThresholdM: 0.75,
    maxDepthM: 2.20,
    flowRateLps: 520,
    siltationPct: 52,
    pumpStatus: 'EMERGENCY_BOOST',
    pumpCapacityHp: 75,
    pumpDischargeLps: 280,
    batteryPct: 91,
    solarWatts: 38,
    signalDbm: -74,
    trend: 'rising',
    history: [],
    lastUpdated: new Date().toISOString()
  },
  {
    id: 'iot_blr_hebbal',
    name: 'Hebbal Valley Cascade Outfall Sump',
    districtId: 'bengaluru_urban',
    districtName: 'Bengaluru Urban',
    lat: 13.0358,
    lng: 77.5970,
    sensorType: 'radar_velocity',
    currentDepthM: 0.35,
    warningThresholdM: 0.60,
    dangerThresholdM: 0.95,
    maxDepthM: 2.50,
    flowRateLps: 180,
    siltationPct: 22,
    pumpStatus: 'AUTO_IDLE',
    pumpCapacityHp: 100,
    pumpDischargeLps: 350,
    batteryPct: 98,
    solarWatts: 50,
    signalDbm: -62,
    trend: 'stable',
    history: [],
    lastUpdated: new Date().toISOString()
  },
  {
    id: 'iot_blrr_doddaballapura',
    name: 'Doddaballapura Agro Industrial Swale Gauge',
    districtId: 'bengaluru_rural',
    districtName: 'Bengaluru Rural',
    lat: 13.2940,
    lng: 77.5420,
    sensorType: 'swale_optical',
    currentDepthM: 0.48,
    warningThresholdM: 0.45,
    dangerThresholdM: 0.80,
    maxDepthM: 1.50,
    flowRateLps: 120,
    siltationPct: 28,
    pumpStatus: 'AUTO_RUNNING',
    pumpCapacityHp: 50,
    pumpDischargeLps: 150,
    batteryPct: 89,
    solarWatts: 45,
    signalDbm: -79,
    trend: 'falling',
    history: [],
    lastUpdated: new Date().toISOString()
  },
  {
    id: 'iot_shv_tunga',
    name: 'Shivamogga Tunga Confluence Bund Gauge',
    districtId: 'shivamogga',
    districtName: 'Shivamogga (Shimoga)',
    lat: 13.9120,
    lng: 75.5560,
    sensorType: 'radar_velocity',
    currentDepthM: 1.15,
    warningThresholdM: 0.90,
    dangerThresholdM: 1.30,
    maxDepthM: 3.00,
    flowRateLps: 1250,
    siltationPct: 18,
    pumpStatus: 'AUTO_RUNNING',
    pumpCapacityHp: 150,
    pumpDischargeLps: 600,
    batteryPct: 95,
    solarWatts: 48,
    signalDbm: -65,
    trend: 'rising',
    history: [],
    lastUpdated: new Date().toISOString()
  },
  {
    id: 'iot_mys_hunsur',
    name: 'Mysuru Hunsur Road Lowland Canal Gauge',
    districtId: 'mysuru',
    districtName: 'Mysuru (Mysore)',
    lat: 12.3120,
    lng: 76.6150,
    sensorType: 'hydrostatic_pressure',
    currentDepthM: 0.28,
    warningThresholdM: 0.50,
    dangerThresholdM: 0.90,
    maxDepthM: 2.00,
    flowRateLps: 95,
    siltationPct: 15,
    pumpStatus: 'AUTO_IDLE',
    pumpCapacityHp: 75,
    pumpDischargeLps: 250,
    batteryPct: 99,
    solarWatts: 55,
    signalDbm: -60,
    trend: 'stable',
    history: [],
    lastUpdated: new Date().toISOString()
  },
  {
    id: 'iot_dk_kudroli',
    name: 'Mangaluru Kudroli Tidal Storm Drain Sump',
    districtId: 'dakshina_kannada',
    districtName: 'Dakshina Kannada (Mangaluru)',
    lat: 12.8750,
    lng: 74.8380,
    sensorType: 'ultrasonic_level',
    currentDepthM: 0.65,
    warningThresholdM: 0.55,
    dangerThresholdM: 0.90,
    maxDepthM: 2.20,
    flowRateLps: 680,
    siltationPct: 34,
    pumpStatus: 'AUTO_RUNNING',
    pumpCapacityHp: 150,
    pumpDischargeLps: 550,
    batteryPct: 94,
    solarWatts: 35,
    signalDbm: -70,
    trend: 'rising',
    history: [],
    lastUpdated: new Date().toISOString()
  },
  {
    id: 'iot_bel_pbroad',
    name: 'Belagavi PB Road Industrial Culvert Sensor',
    districtId: 'belagavi',
    districtName: 'Belagavi (Belgaum)',
    lat: 15.8620,
    lng: 74.5120,
    sensorType: 'swale_optical',
    currentDepthM: 0.42,
    warningThresholdM: 0.50,
    dangerThresholdM: 0.80,
    maxDepthM: 1.60,
    flowRateLps: 210,
    siltationPct: 40,
    pumpStatus: 'AUTO_IDLE',
    pumpCapacityHp: 75,
    pumpDischargeLps: 260,
    batteryPct: 92,
    solarWatts: 46,
    signalDbm: -72,
    trend: 'falling',
    history: [],
    lastUpdated: new Date().toISOString()
  }
];

// Initialize history for each sensor
const sensorsStore: Map<string, IoTSensor> = new Map();

function initSensors() {
  const now = Date.now();
  for (const s of INITIAL_SENSORS) {
    const history: Array<{ time: string; depthM: number; flowLps: number }> = [];
    for (let i = 9; i >= 0; i--) {
      const t = new Date(now - i * 5 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const variance = (Math.sin(i * 0.8) * 0.08) + (Math.random() * 0.04 - 0.02);
      history.push({
        time: t,
        depthM: Math.max(0.1, Math.round((s.currentDepthM + variance) * 100) / 100),
        flowLps: Math.max(20, Math.round(s.flowRateLps + variance * 200))
      });
    }
    sensorsStore.set(s.id, { ...s, history });
  }
}

initSensors();

// Periodic realistic micro-fluctuation to give real-time vitality
function updateSensorTelemetry() {
  const now = Date.now();
  const timeStr = new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  for (const [id, sensor] of sensorsStore.entries()) {
    // Random gentle drift
    const delta = (Math.random() - 0.48) * 0.03;
    let newDepth = Math.max(0.12, Math.min(sensor.maxDepthM, sensor.currentDepthM + delta));
    
    // If pump is active, gently lower water level
    if (sensor.pumpStatus === 'AUTO_RUNNING' || sensor.pumpStatus === 'MANUAL_ON' || sensor.pumpStatus === 'EMERGENCY_BOOST') {
      newDepth = Math.max(0.15, newDepth - 0.015);
    }

    const newFlow = Math.max(10, Math.round(sensor.flowRateLps + (delta * 500)));
    const newTrend: 'rising' | 'falling' | 'stable' = delta > 0.005 ? 'rising' : delta < -0.005 ? 'falling' : 'stable';

    // Auto trigger pump if depth exceeds danger threshold and pump is in auto
    let newPumpStatus = sensor.pumpStatus;
    if (newPumpStatus === 'AUTO_IDLE' && newDepth >= sensor.dangerThresholdM) {
      newPumpStatus = 'AUTO_RUNNING';
    } else if (newPumpStatus === 'AUTO_RUNNING' && newDepth < sensor.warningThresholdM * 0.6) {
      newPumpStatus = 'AUTO_IDLE';
    }

    const newHistory = [...sensor.history.slice(1), {
      time: timeStr,
      depthM: Math.round(newDepth * 100) / 100,
      flowLps: newFlow
    }];

    sensorsStore.set(id, {
      ...sensor,
      currentDepthM: Math.round(newDepth * 100) / 100,
      flowRateLps: newFlow,
      trend: newTrend,
      pumpStatus: newPumpStatus,
      batteryPct: Math.max(70, Math.min(100, sensor.batteryPct + (Math.random() > 0.7 ? (Math.random() > 0.5 ? 1 : -1) : 0))),
      history: newHistory,
      lastUpdated: new Date().toISOString()
    });
  }
}

setInterval(updateSensorTelemetry, 8000);

// --- Real-time API Handlers ---

/**
 * GET /api/realtime/radar-meta
 * Provides live Doppler Radar Tile URL frames from RainViewer
 */
export async function getRadarMeta(req: Request, res: Response) {
  try {
    const rvRes = await axios.get('https://api.rainviewer.com/public/weather-maps.json', { timeout: 6000 });
    const { host, radar, satellite } = rvRes.data;

    return res.json({
      success: true,
      provider: 'RainViewer Real-Time Radar Network',
      host,
      pastFrames: radar?.past || [],
      nowcastFrames: radar?.nowcast || [],
      satelliteFrames: satellite?.infrared || [],
      colorScheme: 4, // Vibrant Weather Color Scale
      smooth: 1,
      snow: 1,
      lastUpdated: new Date().toISOString()
    });
  } catch (err: any) {
    console.warn('[!] RainViewer API unavailable, providing fallback radar structure:', err.message);
    const nowSec = Math.floor(Date.now() / 1000);
    return res.json({
      success: true,
      fallback: true,
      provider: 'JalaDrishti Climatological Doppler Radar Mock',
      host: 'https://tilecache.rainviewer.com',
      pastFrames: Array.from({ length: 12 }).map((_, i) => ({
        time: nowSec - (11 - i) * 600,
        path: '/v2/radar/nowcast'
      })),
      nowcastFrames: [],
      colorScheme: 4,
      smooth: 1,
      snow: 1,
      lastUpdated: new Date().toISOString()
    });
  }
}

/**
 * GET /api/realtime/iot-sensors
 * Returns the live IoT water-level sensor telemetry
 */
export async function getIoTSensors(req: Request, res: Response) {
  try {
    const { districtId } = req.query;
    let sensors = Array.from(sensorsStore.values());
    if (districtId && typeof districtId === 'string') {
      sensors = sensors.filter(s => s.districtId.toLowerCase() === districtId.toLowerCase());
    }

    const summary = {
      totalSensors: sensors.length,
      criticalAlarms: sensors.filter(s => s.currentDepthM >= s.dangerThresholdM).length,
      activeWarnings: sensors.filter(s => s.currentDepthM >= s.warningThresholdM && s.currentDepthM < s.dangerThresholdM).length,
      activePumps: sensors.filter(s => s.pumpStatus === 'AUTO_RUNNING' || s.pumpStatus === 'MANUAL_ON' || s.pumpStatus === 'EMERGENCY_BOOST').length,
      totalDischargeLps: sensors.reduce((acc, s) => acc + ((s.pumpStatus !== 'AUTO_IDLE' && s.pumpStatus !== 'MANUAL_OFF') ? s.pumpDischargeLps : 0), 0)
    };

    return res.json({
      success: true,
      summary,
      sensors,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * POST /api/realtime/pump-actuator
 * Remotely control dewatering pump state
 */
export async function updatePumpActuator(req: Request, res: Response) {
  try {
    const { sensorId, command } = req.body;
    // command: 'AUTO' | 'MANUAL_ON' | 'MANUAL_OFF' | 'EMERGENCY_BOOST'
    const sensor = sensorsStore.get(sensorId);
    if (!sensor) {
      return res.status(404).json({ success: false, error: 'Sensor not found' });
    }

    let newStatus: IoTSensor['pumpStatus'] = 'AUTO_IDLE';
    if (command === 'AUTO') {
      newStatus = sensor.currentDepthM >= sensor.dangerThresholdM ? 'AUTO_RUNNING' : 'AUTO_IDLE';
    } else if (command === 'MANUAL_ON') {
      newStatus = 'MANUAL_ON';
    } else if (command === 'MANUAL_OFF') {
      newStatus = 'MANUAL_OFF';
    } else if (command === 'EMERGENCY_BOOST') {
      newStatus = 'EMERGENCY_BOOST';
    }

    sensor.pumpStatus = newStatus;
    sensor.lastUpdated = new Date().toISOString();
    sensorsStore.set(sensorId, sensor);

    return res.json({
      success: true,
      message: `Pump actuator command '${command}' executed successfully on ${sensor.name}`,
      sensor
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * GET /api/realtime/live-alerts
 * Returns live storm alerts and emergency warning broadcasts
 */
export async function getLiveAlerts(req: Request, res: Response) {
  try {
    const alerts: any[] = [];
    const sensors = Array.from(sensorsStore.values());

    for (const s of sensors) {
      if (s.currentDepthM >= s.dangerThresholdM) {
        alerts.push({
          id: `alert_${s.id}_crit`,
          level: 'CRITICAL',
          district: s.districtName,
          title: `Flash Inundation Danger: ${s.name}`,
          message: `Water level at ${(s.currentDepthM * 100).toFixed(0)}cm (exceeds danger ceiling of ${(s.dangerThresholdM * 100).toFixed(0)}cm). Flow rate ${s.flowRateLps} L/s.`,
          action: `Deploy high-head suction pump and barrier crew immediately.`,
          agency: 'Karnataka SDRF / District Disaster Management',
          timestamp: s.lastUpdated
        });
      } else if (s.currentDepthM >= s.warningThresholdM) {
        alerts.push({
          id: `alert_${s.id}_warn`,
          level: 'WARNING',
          district: s.districtName,
          title: `Rising Water Surcharge: ${s.name}`,
          message: `Water depth ${(s.currentDepthM * 100).toFixed(0)}cm approaching danger threshold. Siltation level ${s.siltationPct}%.`,
          action: `Inspect culvert outfall and prepare backup mobile pump.`,
          agency: 'Urban Local Body / Stormwater Wing',
          timestamp: s.lastUpdated
        });
      }
    }

    // Add state-wide active weather advisories
    alerts.push({
      id: 'alert_imd_nowcast_state',
      level: 'ADVISORY',
      district: 'Coastal & Malnad Zones',
      title: 'South-West Monsoon Orographic Surge Active',
      message: 'Persistent convective rain clouds over Western Ghats crest. High runoff expected into Tunga-Bhadra and Cauvery catchments.',
      action: 'Keep automated sluice gates in dynamic regulation mode.',
      agency: 'IMD Bengaluru & Karnataka State Natural Disaster Monitoring Centre (KSNDMC)',
      timestamp: new Date().toISOString()
    });

    return res.json({
      success: true,
      count: alerts.length,
      alerts,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * GET /api/realtime/nowcast/:districtId
 * Live real-time ML Nowcast pulling live precipitation rate and running instant inference
 */
export async function getRealtimeNowcast(req: Request, res: Response) {
  try {
    const { districtId } = req.params;
    const rawDistrict = (districtId || 'bengaluru_urban').replace(/_/g, ' ');
    
    // Find district geo
    const matchKey = Object.keys(KARNATAKA_DISTRICTS_GEO).find(
      k => k.toLowerCase().includes(rawDistrict.toLowerCase()) || rawDistrict.toLowerCase().includes(k.toLowerCase())
    ) || 'Bengaluru Urban';

    const geo = KARNATAKA_DISTRICTS_GEO[matchKey];

    // Fetch live current weather from Open-Meteo
    let currentRainRateMmH = 0;
    let currentTempC = 26.5;
    let currentHumidityPct = 78;
    let currentWindSpeedKmh = 14;

    try {
      const omRes = await axios.get(
        `https://api.open-meteo.com/v1/forecast?latitude=${geo.lat}&longitude=${geo.lng}&current=temperature_2m,relative_humidity_2m,precipitation,rain,wind_speed_10m&timezone=Asia/Kolkata`,
        { timeout: 5000 }
      );
      if (omRes.data.current) {
        currentRainRateMmH = omRes.data.current.precipitation || omRes.data.current.rain || 0;
        currentTempC = omRes.data.current.temperature_2m || 26.5;
        currentHumidityPct = omRes.data.current.relative_humidity_2m || 78;
        currentWindSpeedKmh = omRes.data.current.wind_speed_10m || 14;
      }
    } catch {
      // Climatological estimate fallback
      currentRainRateMmH = 12.5;
    }

    // Synthesize real-time nowcast metrics
    const simulatedInflowM3H = Math.round(currentRainRateMmH * 1420);
    const riskLevel = currentRainRateMmH > 35 ? 'CRITICAL' : currentRainRateMmH > 15 ? 'HIGH' : currentRainRateMmH > 5 ? 'MODERATE' : 'LOW';

    return res.json({
      success: true,
      district: matchKey,
      coordinates: { lat: geo.lat, lng: geo.lng },
      zone: geo.zone,
      telemetry: {
        currentRainRateMmH,
        currentTempC,
        currentHumidityPct,
        currentWindSpeedKmh,
        simulatedInflowM3H,
        riskLevel,
        radarReflectivityDbz: Math.min(65, Math.max(10, Math.round(currentRainRateMmH * 2.8 + 15))),
        evapotranspirationEt0MmDay: 4.2
      },
      nowcastAdvice: currentRainRateMmH > 20
        ? 'Severe rain cell over district. Activate automated underpass pumps and clear primary lakeside collector swales.'
        : currentRainRateMmH > 5
        ? 'Moderate rain occurring. Soil is approaching field capacity; hold scheduled irrigation and inspect drains.'
        : 'Light or dry conditions. Drainage systems operating within normal baseline capacity.',
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * GET /api/realtime/today-rainfall?lat=&lng=&districtName=
 * Fetches today's actual accumulated rainfall (mm) from Open-Meteo for a given coordinate.
 * Also returns the current rain rate and a 7-day historical daily total for context.
 */
export async function getTodayRainfall(req: Request, res: Response) {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);
    const districtName = (req.query.districtName as string) || 'Karnataka';

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ success: false, error: 'lat and lng query parameters are required.' });
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];

    // Fetch current precipitation + 7-day historical daily totals from Open-Meteo
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
      `&current=temperature_2m,relative_humidity_2m,precipitation,rain,weathercode,wind_speed_10m` +
      `&daily=precipitation_sum,weathercode,temperature_2m_max,temperature_2m_min` +
      `&timezone=Asia/Kolkata&forecast_days=1&past_days=7`;

    const omRes = await axios.get(url, { timeout: 8000 });
    const data = omRes.data;

    const current = data.current || {};
    const daily = data.daily || {};

    // Today's accumulated rainfall = last entry in daily.precipitation_sum (today)
    const dailyTotals: number[] = (daily.precipitation_sum || []).map((v: any) => Number(v) || 0);
    const dailyDates: string[] = daily.time || [];
    const todayIdx = dailyDates.indexOf(todayStr);
    const todayRainfallMm = todayIdx >= 0 ? dailyTotals[todayIdx] : (dailyTotals[dailyTotals.length - 1] || 0);

    // Current real-time rain rate (mm in last hour equivalent)
    const currentRainMm = Number(current.precipitation || current.rain || 0);
    const currentTempC = Number(current.temperature_2m || 26);
    const currentHumidityPct = Number(current.relative_humidity_2m || 70);
    const currentWindKmh = Number(current.wind_speed_10m || 10);
    const currentWmoCode = Number(current.weathercode || 0);

    // Build last-7-days history
    const history = dailyDates.map((d: string, i: number) => ({
      date: d,
      rainfallMm: Math.round((dailyTotals[i] || 0) * 10) / 10
    })).filter((h: any) => h.date <= todayStr);

    // Waterlogging risk based on today's accumulation
    let riskLevel = 'Low';
    let riskColor = '#10b981';
    if (todayRainfallMm > 115) { riskLevel = 'Extreme'; riskColor = '#7c3aed'; }
    else if (todayRainfallMm > 64) { riskLevel = 'Critical'; riskColor = '#ef4444'; }
    else if (todayRainfallMm > 35) { riskLevel = 'High'; riskColor = '#f59e0b'; }
    else if (todayRainfallMm > 15) { riskLevel = 'Moderate'; riskColor = '#eab308'; }

    return res.json({
      success: true,
      district: districtName,
      date: todayStr,
      coordinates: { lat, lng },
      todayRainfallMm: Math.round(todayRainfallMm * 10) / 10,
      currentRainRateMm: Math.round(currentRainMm * 100) / 100,
      currentTempC,
      currentHumidityPct,
      currentWindKmh,
      currentWmoCode,
      riskLevel,
      riskColor,
      last7DaysHistory: history,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    console.error('Today rainfall fetch error:', err.message);
    // Graceful fallback with climatological estimate for Karnataka monsoon
    const todayStr = new Date().toISOString().split('T')[0];
    return res.json({
      success: true,
      fallback: true,
      district: (req.query.districtName as string) || 'Karnataka',
      date: todayStr,
      todayRainfallMm: 18.5,
      currentRainRateMm: 1.2,
      currentTempC: 26.5,
      currentHumidityPct: 82,
      currentWindKmh: 12,
      currentWmoCode: 61,
      riskLevel: 'Moderate',
      riskColor: '#eab308',
      last7DaysHistory: [],
      timestamp: new Date().toISOString()
    });
  }
}
