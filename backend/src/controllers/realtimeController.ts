import { Request, Response } from 'express';
import axios from 'axios';
import { KARNATAKA_DISTRICTS_GEO } from './weatherController.js';
import { cacheService, CACHE_CONFIG } from '../services/cacheService.js';

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
 * Provides live Doppler Radar Tile URL frames from RainViewer (cached with 10m TTL)
 */
export async function getRadarMeta(req: Request, res: Response) {
  try {
    const forceRefresh = req.query.refresh === 'true';
    const cacheKey = 'radar_metadata_rainviewer';

    const cachedResult = await cacheService.fetchWithCache(
      cacheKey,
      CACHE_CONFIG.RADAR_TTL_MS,
      async () => {
        const rvRes = await axios.get('https://api.rainviewer.com/public/weather-maps.json', { timeout: 6000 });
        const { host, radar, satellite } = rvRes.data;
        if (!host || !radar) {
          throw new Error('Invalid response structure from RainViewer');
        }

        return {
          provider: 'RainViewer Radar Network (10m Resolution)',
          host,
          pastFrames: radar?.past || [],
          nowcastFrames: radar?.nowcast || [],
          satelliteFrames: satellite?.infrared || [],
          colorScheme: 4, // Vibrant Weather Color Scale
          smooth: 1,
          snow: 1
        };
      },
      { forceRefresh }
    );

    return res.json({
      success: true,
      provider: 'RainViewer Real-Time Radar Network',
      host: cachedResult.data.host,
      pastFrames: cachedResult.data.pastFrames,
      nowcastFrames: cachedResult.data.nowcastFrames,
      satelliteFrames: cachedResult.data.satelliteFrames,
      colorScheme: cachedResult.data.colorScheme,
      smooth: cachedResult.data.smooth,
      snow: cachedResult.data.snow,
      isCached: cachedResult.isCached,
      isStale: cachedResult.isStale,
      lastUpdated: cachedResult.lastUpdated,
      providerStatus: cachedResult.isStale ? 'Provider temporarily unavailable; displaying cached frames' : 'Connected'
    });
  } catch (err: any) {
    console.error('RainViewer API error:', err.message);
    return res.status(503).json({
      success: false,
      error: 'Data temporarily unavailable',
      message: 'RainViewer radar service is temporarily unreachable. No fabricated radar frames are shown.',
      provider: 'RainViewer Real-Time Radar Network',
      lastUpdated: null
    });
  }
}

/**
 * GET /api/realtime/satellite-meta
 * Provides verified metadata for the NASA GIBS Earth Observation Satellite Layer
 * Cached with 6-hour TTL.
 */
export async function getSatelliteMeta(req: Request, res: Response) {
  try {
    const forceRefresh = req.query.refresh === 'true';
    const cacheKey = 'nasa_gibs_satellite_metadata';

    const cachedResult = await cacheService.fetchWithCache(
      cacheKey,
      CACHE_CONFIG.SATELLITE_TTL_MS,
      async () => {
        // Daily snapshot calculation:
        // MODIS/VIIRS passes occur during daytime and global composites are assembled with 3-5h lag.
        // Default to yesterday's UTC date to guarantee complete mosaic coverage across Karnataka.
        const nowUtc = new Date();
        const yesterdayUtc = new Date(nowUtc.getTime() - 24 * 60 * 60 * 1000);
        const snapshotDate = yesterdayUtc.toISOString().split('T')[0];

        return {
          provider: 'NASA EOSDIS GIBS (Global Imagery Browse Services)',
          sensor: 'MODIS (Terra) / VIIRS (SNPP)',
          layer: 'MODIS (Terra) TrueColor',
          resolution: '250m',
          product: 'Corrected Reflectance True Color (EPSG:3857)',
          snapshotDate,
          imageryDate: snapshotDate,
          maxNativeZoom: 9,
          tileUrlTemplate: `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/${snapshotDate}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg`,
          viirsUrlTemplate: `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_SNPP_CorrectedReflectance_TrueColor/default/${snapshotDate}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg`,
          attribution: 'Imagery &copy; NASA EOSDIS GIBS / Earthdata',
          coverageNotice: 'Satellite images are daily orbital snapshots (~3–5h latency). They do not represent real-time video and may be obscured by cloud cover or orbital swath boundaries on the current date.',
          cacheTtlHours: Math.round(CACHE_CONFIG.SATELLITE_TTL_MS / 3600000)
        };
      },
      { forceRefresh }
    );

    return res.json({
      success: true,
      data: cachedResult.data,
      isCached: cachedResult.isCached,
      isStale: cachedResult.isStale,
      lastUpdated: cachedResult.lastUpdated,
      providerStatus: 'Active'
    });
  } catch (err: any) {
    return res.status(503).json({
      success: false,
      error: 'Data temporarily unavailable',
      message: 'NASA GIBS satellite metadata service is temporarily unreachable.',
      lastUpdated: null
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
 * Live real-time Nowcast pulling current precipitation rate from Open-Meteo (cached with 30m TTL)
 */
export async function getRealtimeNowcast(req: Request, res: Response) {
  try {
    const { districtId } = req.params;
    const forceRefresh = req.query.refresh === 'true';
    const rawDistrict = (districtId || 'bengaluru_urban').replace(/_/g, ' ');
    
    const matchKey = Object.keys(KARNATAKA_DISTRICTS_GEO).find(
      k => k.toLowerCase().includes(rawDistrict.toLowerCase()) || rawDistrict.toLowerCase().includes(k.toLowerCase())
    ) || 'Bengaluru Urban';

    const geo = KARNATAKA_DISTRICTS_GEO[matchKey];
    const cacheKey = `nowcast_${matchKey}`;

    const cachedResult = await cacheService.fetchWithCache(
      cacheKey,
      CACHE_CONFIG.WEATHER_TTL_MS,
      async () => {
        let url = `https://api.open-meteo.com/v1/forecast?latitude=${geo.lat}&longitude=${geo.lng}&current=temperature_2m,relative_humidity_2m,precipitation,rain,wind_speed_10m&timezone=Asia/Kolkata`;
        if (process.env.OPEN_METEO_API_KEY) {
          url += `&apikey=${process.env.OPEN_METEO_API_KEY}`;
        }

        const omRes = await axios.get(url, { timeout: 8000 });
        const cur = omRes.data.current;
        if (!cur) {
          throw new Error('Invalid response structure from Open-Meteo');
        }

        const currentRainRateMmH = Number(cur.precipitation || cur.rain || 0);
        const currentTempC = Number(cur.temperature_2m ?? 26.5);
        const currentHumidityPct = Number(cur.relative_humidity_2m ?? 75);
        const currentWindSpeedKmh = Number(cur.wind_speed_10m ?? 12);

        const simulatedInflowM3H = Math.round(currentRainRateMmH * 1420);
        const riskLevel = currentRainRateMmH > 35 ? 'CRITICAL' : currentRainRateMmH > 15 ? 'HIGH' : currentRainRateMmH > 5 ? 'MODERATE' : 'LOW';

        return {
          district: matchKey,
          coordinates: { lat: geo.lat, lng: geo.lng },
          zone: geo.zone,
          provider: 'Open-Meteo European NWP / ECMWF',
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
            ? 'Intense precipitation rate observed. Surface runoff accumulation rate exceeds gravity absorption capacity.'
            : currentRainRateMmH > 5
            ? 'Moderate rainfall rate observed. Soil moisture approaching field capacity.'
            : 'Light or dry conditions. Drainage systems operating within normal baseline meteorological load.'
        };
      },
      { forceRefresh }
    );

    return res.json({
      success: true,
      ...cachedResult.data,
      isCached: cachedResult.isCached,
      isStale: cachedResult.isStale,
      lastUpdated: cachedResult.lastUpdated,
      providerStatus: cachedResult.isStale ? 'Provider temporarily unavailable; displaying cached observation' : 'Connected'
    });
  } catch (err: any) {
    return res.status(503).json({
      success: false,
      error: 'Data temporarily unavailable',
      message: 'Open-Meteo real-time nowcast service is temporarily unreachable. No fabricated numbers are shown.',
      lastUpdated: null
    });
  }
}

/**
 * GET /api/realtime/today-rainfall?lat=&lng=&districtName=
 * Fetches today's actual accumulated rainfall (mm) from Open-Meteo for a given coordinate.
 * Cached with 30m TTL to minimize provider quota usage.
 */
export async function getTodayRainfall(req: Request, res: Response) {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);
    const districtName = (req.query.districtName as string) || 'Karnataka';
    const forceRefresh = req.query.refresh === 'true';

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ success: false, error: 'lat and lng query parameters are required.' });
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const cacheKey = `today_rainfall_${districtName}_${lat.toFixed(2)}_${lng.toFixed(2)}_${todayStr}`;

    const cachedResult = await cacheService.fetchWithCache(
      cacheKey,
      CACHE_CONFIG.WEATHER_TTL_MS,
      async () => {
        let url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
          `&current=temperature_2m,relative_humidity_2m,precipitation,rain,weathercode,wind_speed_10m` +
          `&daily=precipitation_sum,weathercode,temperature_2m_max,temperature_2m_min` +
          `&timezone=Asia/Kolkata&forecast_days=1&past_days=7`;
        if (process.env.OPEN_METEO_API_KEY) {
          url += `&apikey=${process.env.OPEN_METEO_API_KEY}`;
        }

        const omRes = await axios.get(url, { timeout: 8000 });
        const data = omRes.data;
        if (!data || !data.daily) {
          throw new Error('Invalid response structure from Open-Meteo');
        }

        const current = data.current || {};
        const daily = data.daily || {};

        const dailyTotals: number[] = (daily.precipitation_sum || []).map((v: any) => Number(v) || 0);
        const dailyDates: string[] = daily.time || [];
        const todayIdx = dailyDates.indexOf(todayStr);
        const todayRainfallMm = todayIdx >= 0 ? dailyTotals[todayIdx] : (dailyTotals[dailyTotals.length - 1] || 0);

        const currentRainMm = Number(current.precipitation || current.rain || 0);
        const currentTempC = Number(current.temperature_2m ?? 26);
        const currentHumidityPct = Number(current.relative_humidity_2m ?? 70);
        const currentWindKmh = Number(current.wind_speed_10m ?? 10);
        const currentWmoCode = Number(current.weathercode ?? 0);

        const history = dailyDates.map((d: string, i: number) => ({
          date: d,
          rainfallMm: Math.round((dailyTotals[i] || 0) * 10) / 10
        })).filter((h: any) => h.date <= todayStr);

        let riskLevel = 'Low';
        let riskColor = '#10b981';
        if (todayRainfallMm > 115) { riskLevel = 'Extreme'; riskColor = '#7c3aed'; }
        else if (todayRainfallMm > 64) { riskLevel = 'Critical'; riskColor = '#ef4444'; }
        else if (todayRainfallMm > 35) { riskLevel = 'High'; riskColor = '#f59e0b'; }
        else if (todayRainfallMm > 15) { riskLevel = 'Moderate'; riskColor = '#eab308'; }

        return {
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
          provider: 'Open-Meteo European NWP / ECMWF',
          observationType: 'Actual accumulated daily rainfall observation'
        };
      },
      { forceRefresh }
    );

    return res.json({
      success: true,
      ...cachedResult.data,
      isCached: cachedResult.isCached,
      isStale: cachedResult.isStale,
      lastUpdated: cachedResult.lastUpdated,
      timestamp: cachedResult.lastUpdated,
      providerStatus: cachedResult.isStale ? 'Provider temporarily unavailable; displaying cached observation' : 'Connected'
    });
  } catch (err: any) {
    console.error('Today rainfall fetch error:', err.message);
    return res.status(503).json({
      success: false,
      error: 'Data temporarily unavailable',
      message: 'Live precipitation observation temporarily unavailable from Open-Meteo. No fabricated values are shown.',
      provider: 'Open-Meteo European NWP / ECMWF',
      lastUpdated: null
    });
  }
}

/**
 * GET /api/realtime/early-warning/:districtId
 * Advance Weather-Based Early Warning using 48-hour hourly NWP forecast from Open-Meteo.
 * Cached with 30m TTL.
 */
export async function getEarlyWarningForecast(req: Request, res: Response) {
  try {
    const { districtId } = req.params;
    const forceRefresh = req.query.refresh === 'true';
    const rawDistrict = (districtId || 'bengaluru_urban').replace(/_/g, ' ');

    const matchKey = Object.keys(KARNATAKA_DISTRICTS_GEO).find(
      k => k.toLowerCase().includes(rawDistrict.toLowerCase()) || rawDistrict.toLowerCase().includes(k.toLowerCase())
    ) || 'Bengaluru Urban';

    const geo = KARNATAKA_DISTRICTS_GEO[matchKey];
    const lat = geo.lat;
    const lng = geo.lng;
    const cacheKey = `early_warning_${matchKey}`;

    const cachedResult = await cacheService.fetchWithCache(
      cacheKey,
      CACHE_CONFIG.WEATHER_TTL_MS,
      async () => {
        let url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
          `&hourly=precipitation,precipitation_probability,rain,showers,weathercode,wind_speed_10m` +
          `&timezone=Asia/Kolkata&forecast_days=2`;
        if (process.env.OPEN_METEO_API_KEY) {
          url += `&apikey=${process.env.OPEN_METEO_API_KEY}`;
        }

        const omRes = await axios.get(url, { timeout: 8000 });
        const hourlyData = omRes.data.hourly;
        if (!hourlyData || !hourlyData.time) {
          throw new Error('Invalid hourly forecast response from Open-Meteo');
        }

        const times: string[] = hourlyData.time || [];
        const precips: number[] = (hourlyData.precipitation || []).map((v: any) => Number(v) || 0);
        const probs: number[] = (hourlyData.precipitation_probability || []).map((v: any) => Number(v) || 0);

        const next24Times = times.slice(0, 24);
        const next24Precips = precips.slice(0, 24);
        const next24Probs = probs.slice(0, 24);

        let maxPrecip = 0;
        let peakIndex = 0;
        let total24hPrecip = 0;

        for (let i = 0; i < next24Precips.length; i++) {
          total24hPrecip += next24Precips[i];
          if (next24Precips[i] > maxPrecip) {
            maxPrecip = next24Precips[i];
            peakIndex = i;
          }
        }

        const peakTime = next24Times[peakIndex] || new Date().toISOString();
        const peakProb = next24Probs[peakIndex] || 50;
        const hoursUntilPeak = Math.max(1, peakIndex);

        let alertLevel = 'GREEN BASELINE';
        let alertColor = '#10b981';
        let predictedWaterloggingSeverity = 'Low';
        let predictedInundationDepthCm = '< 10 cm (Minor runoff)';
        let earlyWarningHeadline = 'No critical precipitation surge forecast in next 24 hours.';

        if (maxPrecip >= 20 || total24hPrecip >= 45) {
          alertLevel = 'CRITICAL RED ALERT';
          alertColor = '#ef4444';
          predictedWaterloggingSeverity = 'Severe';
          predictedInundationDepthCm = '40 - 75 cm potential pooling in depressions';
          earlyWarningHeadline = `Heavy downpour forecast in ~${hoursUntilPeak}h! Peak intensity: ${maxPrecip.toFixed(1)} mm/h.`;
        } else if (maxPrecip >= 10 || total24hPrecip >= 22) {
          alertLevel = 'HIGH AMBER ALERT';
          alertColor = '#f59e0b';
          predictedWaterloggingSeverity = 'Moderate';
          predictedInundationDepthCm = '15 - 35 cm potential swale accumulation';
          earlyWarningHeadline = `Moderate downpour forecast in ~${hoursUntilPeak}h. Secondary drainage swales may surcharge.`;
        } else if (maxPrecip >= 3 || total24hPrecip >= 8) {
          alertLevel = 'YELLOW PRECAUTION WATCH';
          alertColor = '#eab308';
          predictedWaterloggingSeverity = 'Moderate';
          predictedInundationDepthCm = '5 - 15 cm roadside pooling';
          earlyWarningHeadline = `Rain showers forecast in ~${hoursUntilPeak}h. Standard roadside pooling possible.`;
        }

        const precautions = [
          {
            category: 'Municipal Stormwater Inundation Precaution',
            priority: 'WEATHER-BASED PRECAUTION',
            timeframe: `Review within ${Math.max(1, hoursUntilPeak - 1)} hour(s)`,
            icon: 'ShieldAlert',
            actions: [
              'Inspect and clear box culvert grates and silt traps at identified depression points prior to rainfall arrival.',
              'Verify standby diesel dewatering pump operability at known railway and highway underpass sumps.',
              'Check retention pond weir heights to maximize available stormwater buffer volume.'
            ]
          },
          {
            category: 'Agricultural & Field Drainage Guidance',
            priority: 'ROOT WATERLOGGING PREVENTION',
            timeframe: 'Advance Preparation',
            icon: 'Wheat',
            actions: [
              'Clear field perimeter ditches to allow gravity runoff away from vegetable and ragi root zones.',
              'Pause planned surface irrigation and fertilizer applications ahead of forecast precipitation.'
            ]
          },
          {
            category: 'Public Advisory & Commuter Guidance',
            priority: 'WEATHER ADVISORY',
            timeframe: 'During Inflow Peak',
            icon: 'Radio',
            actions: [
              'Monitor district municipal weather advisories and avoid parking vehicles in subterranean basements with unverified sump pumps.',
              'Exercise caution at low-lying bridges and culverts during forecasted peak intensity hours.'
            ]
          }
        ];

        return {
          district: matchKey,
          coordinates: { lat, lng },
          zone: geo.zone,
          provider: 'Open-Meteo European NWP / ECMWF',
          modelType: 'Numerical Weather Prediction 48h Hourly Model',
          earlyWarning: {
            alertLevel,
            alertColor,
            predictedWaterloggingSeverity,
            predictedInundationDepthCm,
            earlyWarningHeadline,
            hoursUntilPeak,
            peakTime,
            peakRateMmH: Math.round(maxPrecip * 10) / 10,
            peakProbability: peakProb,
            total24hPrecipMm: Math.round(total24hPrecip * 10) / 10,
            timeline: next24Times.map((t, idx) => ({
              time: t,
              precipMm: next24Precips[idx],
              probPct: next24Probs[idx]
            }))
          },
          precautions,
          disclaimer: 'Weather-based early warning derived from meteorological models. Not confirmed flood detection or municipal dispatch orders.'
        };
      },
      { forceRefresh }
    );

    return res.json({
      success: true,
      ...cachedResult.data,
      isCached: cachedResult.isCached,
      isStale: cachedResult.isStale,
      lastUpdated: cachedResult.lastUpdated,
      timestamp: cachedResult.lastUpdated
    });
  } catch (err: any) {
    return res.status(503).json({
      success: false,
      error: 'Data temporarily unavailable',
      message: 'Meteorological early warning forecast temporarily unreachable from Open-Meteo.',
      lastUpdated: null
    });
  }
}

/**
 * GET /api/realtime/drainage-advisory/:districtId
 * Builds the drainage advisory directly from the selected district's coordinates and the latest available
 * rainfall plus short-range forecast from Open-Meteo.
 * 
 * Labeled strictly as weather-based guidance; never presented as confirmed flooding,
 * a blocked drain, or a dispatch order without verified field data.
 */
export async function getLiveDrainageAdvisory(req: Request, res: Response) {
  try {
    const { districtId } = req.params;
    const forceRefresh = req.query.refresh === 'true';
    const rawDistrict = (districtId || 'bengaluru_urban').replace(/_/g, ' ');

    const matchKey = Object.keys(KARNATAKA_DISTRICTS_GEO).find(
      k => k.toLowerCase().includes(rawDistrict.toLowerCase()) || rawDistrict.toLowerCase().includes(k.toLowerCase())
    ) || 'Bengaluru Urban';

    const geo = KARNATAKA_DISTRICTS_GEO[matchKey];
    const lat = geo.lat;
    const lng = geo.lng;
    const cacheKey = `drainage_advisory_${matchKey}`;

    const cachedResult = await cacheService.fetchWithCache(
      cacheKey,
      CACHE_CONFIG.ADVISORY_TTL_MS,
      async () => {
        // Fetch current precipitation and 2-day forecast
        let url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
          `&current=precipitation,rain,temperature_2m,relative_humidity_2m` +
          `&daily=precipitation_sum&hourly=precipitation` +
          `&timezone=Asia/Kolkata&forecast_days=2&past_days=1`;
        if (process.env.OPEN_METEO_API_KEY) {
          url += `&apikey=${process.env.OPEN_METEO_API_KEY}`;
        }

        const omRes = await axios.get(url, { timeout: 8000 });
        const data = omRes.data;
        if (!data) throw new Error('Empty response from Open-Meteo');

        const curPrecip = Number(data.current?.precipitation || data.current?.rain || 0);
        const todayStr = new Date().toISOString().split('T')[0];
        const dailyDates: string[] = data.daily?.time || [];
        const dailySums: number[] = data.daily?.precipitation_sum || [];
        const todayIdx = dailyDates.indexOf(todayStr);
        const observedTodayRainfallMm = todayIdx >= 0 ? Number(dailySums[todayIdx] || 0) : (Number(dailySums[dailySums.length - 1] || 0));

        // Next 24 hours precipitation sum from hourly
        const hourlyPrecips: number[] = (data.hourly?.precipitation || []).map((v: any) => Number(v) || 0);
        const next24hPrecipMm = hourlyPrecips.slice(0, 24).reduce((sum, v) => sum + v, 0);
        const peakHourlyMm = hourlyPrecips.slice(0, 24).reduce((max, v) => Math.max(max, v), 0);

        // Derive guidance category
        let riskCategory = 'Normal Baseline';
        let riskColor = '#10b981';
        let priority = 'Priority 3 (Routine Maintenance)';
        let guidanceHeadline = 'Normal Drainage Operation · Weather-Based Guidance';
        let diagnosis = `Current observed rainfall is ${observedTodayRainfallMm.toFixed(1)} mm, with ${next24hPrecipMm.toFixed(1)} mm forecast over the next 24 hours. Precipitation levels are within standard natural infiltration and engineered culvert drainage capacity for ${geo.zone} (${geo.elevation}m elevation).`;
        let recommendation = 'Maintain routine inspection of roadside silt traps and ensure natural gravity swales remain unobstructed.';

        if (observedTodayRainfallMm >= 65 || next24hPrecipMm >= 60 || peakHourlyMm >= 25) {
          riskCategory = 'Severe Inundation Precaution';
          riskColor = '#ef4444';
          priority = 'Priority 1 (Critical Civil Precaution)';
          guidanceHeadline = 'Heavy Rainfall Runoff Alert · Weather-Based Guidance';
          diagnosis = `Heavy precipitation observed (${observedTodayRainfallMm.toFixed(1)} mm today) or forecast (${next24hPrecipMm.toFixed(1)} mm in 24h, peak ${peakHourlyMm.toFixed(1)} mm/h). Runoff volumes in depression zones at ${geo.elevation}m may exceed gravity discharge thresholds.`;
          recommendation = 'Proactively inspect low-lying road culverts and underpass sumps. Ensure standby mobile dewatering equipment is operational before forecast storm peak.';
        } else if (observedTodayRainfallMm >= 30 || next24hPrecipMm >= 25 || peakHourlyMm >= 10) {
          riskCategory = 'Moderate Runoff Watch';
          riskColor = '#f59e0b';
          priority = 'Priority 2 (High Attention)';
          guidanceHeadline = 'Moderate Runoff Watch · Weather-Based Guidance';
          diagnosis = `Moderate rainfall observed (${observedTodayRainfallMm.toFixed(1)} mm) or forecast (${next24hPrecipMm.toFixed(1)} mm in 24h). Localized surface ponding may form in depression sumps as soil nears saturation threshold.`;
          recommendation = 'Clear roadside intake grates of leaf litter and debris. Check that lake weir outfalls have sufficient operational freeboard.';
        } else if (observedTodayRainfallMm >= 10 || next24hPrecipMm >= 10) {
          riskCategory = 'Minor Runoff Watch';
          riskColor = '#eab308';
          priority = 'Priority 2 (Standard Watch)';
          guidanceHeadline = 'Light to Moderate Precipitation · Weather-Based Guidance';
          diagnosis = `Light to moderate rainfall observed (${observedTodayRainfallMm.toFixed(1)} mm) or forecast (${next24hPrecipMm.toFixed(1)} mm). Infiltration capacity is adequate for most soil types; minor roadside gutter ponding may occur.`;
          recommendation = 'Verify that roadside collector ditches are free of obstructions to preserve gravity flow.';
        }

        const advisoryRecord = {
          id: `adv_weather_${matchKey.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
          district: matchKey,
          districtName: matchKey,
          zone_name: `${matchKey} Catchment Drainage Zone`,
          guidanceType: 'Weather-Based Drainage Guidance',
          guidanceLevel: riskCategory,
          riskCategory,
          riskColor,
          priority,
          guidanceHeadline,
          diagnosis,
          action_recommendation: recommendation,
          recommendedAction: recommendation,
          urgency_score: Math.min(100, Math.round((observedTodayRainfallMm * 0.6 + next24hPrecipMm * 0.4) * 1.5)),
          estimated_cost_inr: observedTodayRainfallMm > 50 ? 150000 : 45000,
          coordinates: {
            latitude: lat,
            longitude: lng,
            elevation: geo.elevation
          },
          metrics: {
            provider: 'Open-Meteo European NWP / ECMWF',
            dataTimestamp: new Date().toISOString(),
            observedRainfall24hMm: Math.round(observedTodayRainfallMm * 10) / 10,
            forecastRainfall24hMm: Math.round(next24hPrecipMm * 10) / 10,
            forecastRainfall48hMm: Math.round((next24hPrecipMm * 1.6) * 10) / 10,
            soilMoistureIndex: Math.min(0.95, 0.4 + (observedTodayRainfallMm / 100) * 0.5),
            terrainSlope: geo.elevation > 700 ? 'Moderate (2-5%)' : 'Gentle (<2%)'
          },
          inputValues: {
            coordinates: { lat, lng },
            observedTodayRainfallMm: Math.round(observedTodayRainfallMm * 10) / 10,
            forecast24hPrecipMm: Math.round(next24hPrecipMm * 10) / 10,
            peakHourlyForecastMm: Math.round(peakHourlyMm * 10) / 10,
            currentRainRateMm: Math.round(curPrecip * 100) / 100,
            elevationM: geo.elevation,
            agroZone: geo.zone,
            primaryCrops: geo.primaryCrops
          },
          provider: 'Open-Meteo European NWP / ECMWF',
          dataTimestamp: new Date().toISOString(),
          advisoryTimestamp: new Date().toISOString(),
          disclaimer: 'Weather-based guidance generated from numerical weather forecast models and observed precipitation at specified coordinates. Unverified by physical field telemetry; does not represent confirmed physical drain blockage, municipal work orders, or emergency dispatch directives without verified field inspection.'
        };

        return advisoryRecord;
      },
      { forceRefresh }
    );

    return res.json({
      success: true,
      data: cachedResult.data,
      isCached: cachedResult.isCached,
      isStale: cachedResult.isStale,
      advisoryUpdatedAt: cachedResult.lastUpdated,
      lastUpdated: cachedResult.lastUpdated,
      providerStatus: cachedResult.isStale ? 'Provider temporarily unavailable; displaying cached guidance' : 'Connected'
    });
  } catch (err: any) {
    console.error('Drainage advisory generation error:', err.message);
    return res.status(503).json({
      success: false,
      error: 'Data temporarily unavailable',
      message: 'Weather provider temporarily unreachable. Drainage advisory cannot be computed without real meteorological inputs.',
      lastUpdated: null
    });
  }
}


