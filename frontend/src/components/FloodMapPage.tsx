import React, { useState, useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Polygon, Popup, useMap, Tooltip, CircleMarker } from 'react-leaflet';
import { StudyArea, SeverityZone, DrainageAdvisory, AnalysisRun, IoTSensor, RadarMeta, LiveAlert, RealtimeNowcast } from '../types';
import { RadarPlaybackBar } from './RadarPlaybackBar';
import { LiveIoTSensorsDrawer } from './LiveIoTSensorsDrawer';
import { EmergencyOpsModal } from './EmergencyOpsModal';
import { api } from '../services/api';
import { 
  MapPin, 
  Play, 
  RefreshCw, 
  Layers, 
  AlertTriangle, 
  Droplets, 
  ShieldCheck, 
  CloudRain, 
  Calendar, 
  ChevronRight, 
  ExternalLink,
  Cpu,
  Info,
  Maximize2,
  TrendingDown,
  Wrench,
  CheckCircle2,
  Sliders,
  Compass,
  Search,
  Filter,
  Eye,
  Activity,
  Zap,
  Radio,
  Gauge,
  Power,
  BatteryCharging,
  Signal,
  Flame,
  Clock,
  ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FloodMapPageProps {
  studyAreas: StudyArea[];
  selectedAreaId: string;
  onSelectArea: (id: string) => void;
  run: AnalysisRun | null;
  zones: SeverityZone[];
  advisories: DrainageAdvisory[];
  isAnalyzing: boolean;
  onRunAnalysis: () => void;
  preEventDate: string;
  setPreEventDate: (date: string) => void;
  postEventDate: string;
  setPostEventDate: (date: string) => void;
  rainfallMm: number;
  setRainfallMm: (val: number) => void;
  onNavigateToDrainage: () => void;
  radarMeta?: RadarMeta | null;
  iotSensors?: IoTSensor[];
  alerts?: LiveAlert[];
  onRefreshTelemetry?: () => void;
  liveRainfallData?: any; // Live today's rainfall from Open-Meteo
}

// Map center adjuster on study area change or zone select
function MapCenterController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.2 });
  }, [center, zoom, map]);
  return null;
}

// Invalidate size on mount to ensure Leaflet renders tiles immediately
function MapResizer() {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

// Multi-Source Map Tile Modes
const MAP_MODES = {
  hybrid: {
    name: 'Google Hybrid',
    url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    attribution: '&copy; Google Maps &mdash; Satellite & Roads'
  },
  satellite: {
    name: 'Esri Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri World Imagery'
  },
  google_sat: {
    name: 'Google Satellite',
    url: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
    attribution: '&copy; Google Maps Satellite'
  },
  street: {
    name: 'OpenStreetMap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors'
  },
  terrain: {
    name: 'Google Terrain',
    url: 'https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
    attribution: '&copy; Google Maps Terrain'
  }
};

type MapModeKey = keyof typeof MAP_MODES;

export const FloodMapPage: React.FC<FloodMapPageProps> = ({
  studyAreas,
  selectedAreaId,
  onSelectArea,
  run,
  zones,
  advisories,
  isAnalyzing,
  onRunAnalysis,
  preEventDate,
  setPreEventDate,
  postEventDate,
  setPostEventDate,
  rainfallMm,
  setRainfallMm,
  onNavigateToDrainage,
  radarMeta = null,
  iotSensors = [],
  alerts = [],
  onRefreshTelemetry,
  liveRainfallData,
}) => {
  const [mapMode, setMapMode] = useState<MapModeKey>('hybrid');
  const [selectedZone, setSelectedZone] = useState<SeverityZone | null>(null);
  const [zoneFilter, setZoneFilter] = useState<string>('All');
  const [searchZoneQuery, setSearchZoneQuery] = useState<string>('');

  // Real-Time Toggles & Modals
  const [isDopplerRadarActive, setIsDopplerRadarActive] = useState<boolean>(false);
  const [showIoTSensors, setShowIoTSensors] = useState<boolean>(true);
  const [isNowcastActive, setIsNowcastActive] = useState<boolean>(false);
  const [isIoTDrawerOpen, setIsIoTDrawerOpen] = useState<boolean>(false);
  const [isEmergencyOpsOpen, setIsEmergencyOpsOpen] = useState<boolean>(false);

  // Doppler Radar Playback State
  const [radarFrameIndex, setRadarFrameIndex] = useState<number>(0);
  const [isRadarPlaying, setIsRadarPlaying] = useState<boolean>(true);
  const [radarOpacity, setRadarOpacity] = useState<number>(0.75);

  // Nowcast Telemetry State
  const [nowcast, setNowcast] = useState<RealtimeNowcast | null>(null);

  const radarFrames = radarMeta?.pastFrames || [];
  const currentRadarFrame = radarFrames[radarFrameIndex];

  // Auto loop radar frames
  useEffect(() => {
    if (!isRadarPlaying || radarFrames.length === 0 || !isDopplerRadarActive) {
      return;
    }
    const timer = setInterval(() => {
      setRadarFrameIndex((prev) => (prev + 1) % radarFrames.length);
    }, 750);
    return () => clearInterval(timer);
  }, [isRadarPlaying, radarFrames.length, isDopplerRadarActive]);

  // Load Real-Time Nowcast on Area change or when Nowcast is active
  useEffect(() => {
    if (selectedAreaId) {
      loadNowcast(selectedAreaId);
    }
  }, [selectedAreaId]);

  const loadNowcast = async (areaId: string) => {
    try {
      const data = await api.getRealtimeNowcast(areaId);
      if (data && data.telemetry) {
        setNowcast(data);
      }
    } catch (err) {
      console.error('Failed to load real-time nowcast:', err);
    }
  };

  const handlePumpCommand = async (sensor: IoTSensor, command: 'AUTO' | 'MANUAL_ON' | 'MANUAL_OFF' | 'EMERGENCY_BOOST') => {
    try {
      await api.updatePumpActuator(sensor.id, command);
      if (onRefreshTelemetry) onRefreshTelemetry();
    } catch (err) {
      console.error('Failed to trigger pump actuator:', err);
    }
  };

  const currentArea = useMemo(() => {
    return studyAreas.find((a) => a.id === selectedAreaId) || studyAreas[0] || null;
  }, [studyAreas, selectedAreaId]);

  const mapCenter: [number, number] = useMemo(() => {
    if (currentArea) {
      return [currentArea.center_lat, currentArea.center_lng];
    }
    return [12.9352, 77.6850];
  }, [currentArea]);

  const zoom = currentArea?.zoom_level || 13;

  // Fly to selected zone or sensor if clicked
  const activeCenter: [number, number] = useMemo(() => {
    if (selectedZone?.geojson_feature?.geometry?.coordinates?.[0]?.[0]) {
      const coord = selectedZone.geojson_feature.geometry.coordinates[0][0];
      return [coord[1], coord[0]] as [number, number];
    }
    return mapCenter;
  }, [selectedZone, mapCenter]);

  const activeZoom = selectedZone ? 15 : zoom;

  const handleZoneCardClick = (z: SeverityZone) => {
    setSelectedZone(z);
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  // Aggregate metrics
  const totalAreaKm2 = run?.total_area_km2 || 48.0;
  const waterloggedKm2 = run?.waterlogged_area_km2 || 10.5;
  const waterloggedPct = run?.waterlogged_percentage || 21.8;
  const severeCount = zones.filter((z) => z.severity === 'Severe').length;
  const activePumpsCount = iotSensors.filter(s => s.pumpStatus === 'AUTO_RUNNING' || s.pumpStatus === 'MANUAL_ON' || s.pumpStatus === 'EMERGENCY_BOOST').length;

  // Filtered zones for bottom explorer
  const filteredZones = useMemo(() => {
    return zones.filter((z) => {
      const matchesFilter = zoneFilter === 'All' || z.severity === zoneFilter;
      const matchesSearch = z.zone_name.toLowerCase().includes(searchZoneQuery.toLowerCase()) ||
                            z.land_use.toLowerCase().includes(searchZoneQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [zones, zoneFilter, searchZoneQuery]);

  return (
    <div className="flex-1 w-full overflow-y-auto pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 space-y-4">
        
        {/* Real-Time Live Control Ribbon (Doppler Radar, IoT Sensors, Nowcast, Emergency Ops) */}
        <div className="p-3.5 sm:p-4 rounded-3xl bg-gradient-to-r from-slate-900/95 via-cyan-950/40 to-slate-900/95 border border-cyan-500/30 shadow-2xl flex flex-wrap items-center justify-between gap-3 text-xs text-white backdrop-blur-xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 font-extrabold uppercase tracking-wider text-[10px] border border-cyan-500/30">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
              Live Telemetry Stream
            </span>

            {/* Live Doppler Radar Toggle */}
            <button
              onClick={() => setIsDopplerRadarActive(!isDopplerRadarActive)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-bold transition-all ${
                isDopplerRadarActive
                  ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30'
                  : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700'
              }`}
            >
              <CloudRain className="w-4 h-4 text-cyan-400" />
              <span>{isDopplerRadarActive ? 'Doppler Radar Active' : 'Live Doppler Radar'}</span>
            </button>

            {/* IoT Sump Nodes Toggle */}
            <button
              onClick={() => setShowIoTSensors(!showIoTSensors)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-bold transition-all ${
                showIoTSensors
                  ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30'
                  : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700'
              }`}
            >
              <Gauge className="w-4 h-4 text-sky-400" />
              <span>IoT Nodes ({iotSensors.length})</span>
            </button>

            {/* Real-time Dynamic Nowcast Toggle */}
            <button
              onClick={() => setIsNowcastActive(!isNowcastActive)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-bold transition-all ${
                isNowcastActive
                  ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/30 animate-pulse'
                  : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700'
              }`}
            >
              <Zap className="w-4 h-4 text-amber-400" />
              <span>{isNowcastActive ? 'Live Nowcast ON' : '🔴 Stream Nowcast'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* IoT Telemetry Drawer Button */}
            <button
              onClick={() => setIsIoTDrawerOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 font-bold border border-sky-500/30 transition-all"
            >
              <Activity className="w-4 h-4 text-sky-400" />
              <span>Pump Telemetry ({activePumpsCount} Active)</span>
            </button>

            {/* Emergency Operations Center (EOC) Button */}
            <button
              onClick={() => setIsEmergencyOpsOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold border border-rose-500/40 transition-all shadow-[0_0_12px_rgba(244,63,94,0.25)]"
            >
              <ShieldAlert className="w-4 h-4 text-rose-400 animate-pulse" />
              <span>Emergency EOC ({alerts.length})</span>
            </button>
          </div>
        </div>

        {/* Basin Selector & Inference Execution Bar */}
        <div className="p-4 sm:p-5 rounded-3xl glass-card border border-slate-200 dark:border-white/10 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-inner">
              <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold hidden sm:inline">District / Basin:</span>
              <select
                value={selectedAreaId}
                onChange={(e) => {
                  onSelectArea(e.target.value);
                  setSelectedZone(null);
                }}
                className="bg-transparent text-sm font-black text-slate-900 dark:text-white focus:outline-none cursor-pointer pr-2 max-w-[240px] md:max-w-xs truncate"
              >
                {studyAreas.map((area) => (
                  <option key={area.id} value={area.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                    {area.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Event Dates Pill — always today's date is post-event */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <Calendar className="w-3.5 h-3.5 text-sky-400" />
              <span>{preEventDate} &rarr; {postEventDate}</span>
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                TODAY
              </span>
            </div>

            {/* Rainfall Meter Slider */}
            <div className="hidden xl:flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-xs">
              <CloudRain className="w-3.5 h-3.5 text-blue-400" />
              <span className="font-bold text-slate-700 dark:text-slate-300">Rain: {rainfallMm} mm</span>
              <input
                type="range"
                min={20}
                max={200}
                step={5}
                value={rainfallMm}
                onChange={(e) => setRainfallMm(Number(e.target.value))}
                className="w-20 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
            </div>
          </div>

          {/* Inference Trigger Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={onRunAnalysis}
              disabled={isAnalyzing}
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-6 py-2.5 bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-cyan-500/25 border border-cyan-400/40 transition-all transform active:scale-95 disabled:opacity-50"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing Sentinel-1 SAR Backscatter...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current text-white" />
                  <span>Execute Satellite AI Detection</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Live Nowcast Status Banner (when active) */}
        {isNowcastActive && nowcast && (
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-rose-500/15 via-amber-500/10 to-transparent border border-rose-500/30 flex flex-wrap items-center justify-between gap-3 text-xs animate-fadeIn">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-rose-500 text-white animate-pulse">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">
                  🔴 LIVE NOWCAST ({nowcast.district}): {nowcast.telemetry.currentRainRateMmH} mm/h Precipitation
                </span>
                <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                  Simulated Inflow: {nowcast.telemetry.simulatedInflowM3H.toLocaleString()} m³/h &bull; Radar Reflectivity: {nowcast.telemetry.radarReflectivityDbz} dBZ &bull; Temp: {nowcast.telemetry.currentTempC}°C
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded-lg font-black text-[10px] uppercase font-mono ${
                nowcast.telemetry.riskLevel === 'CRITICAL' ? 'bg-red-500 text-white animate-pulse' : 'bg-amber-500 text-white'
              }`}>
                {nowcast.telemetry.riskLevel} FLOOD RISK
              </span>
            </div>
          </div>
        )}

        {/* High-Density Telemetry Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl glass-card border border-slate-200 dark:border-white/10 flex items-center gap-3 card-hover">
            <div className="p-2.5 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/20">
              <Droplets className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Inundation Footprint</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-black text-slate-900 dark:text-white font-mono">{waterloggedKm2} km²</span>
                <span className="text-[10px] text-cyan-400 font-bold font-mono">({waterloggedPct}%)</span>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl glass-card border border-slate-200 dark:border-white/10 flex items-center gap-3 card-hover">
            <div className="p-2.5 rounded-xl bg-blue-500/15 text-blue-400 border border-blue-500/20">
              <CloudRain className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block flex items-center gap-1.5">
                Precipitation Today
                {liveRainfallData && !liveRainfallData.fallback && (
                  <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 text-[9px] font-bold border border-cyan-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>LIVE
                  </span>
                )}
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-black text-blue-500 dark:text-blue-400 font-mono">{rainfallMm} mm</span>
                <span className="text-[10px] text-slate-400 font-medium">
                  {liveRainfallData ? `Open-Meteo · ${liveRainfallData.riskLevel} Risk` : 'Accumulated'}
                </span>
              </div>
              {liveRainfallData && (
                <div className="text-[9px] text-slate-500 mt-0.5">
                  🌡️ {liveRainfallData.currentTempC}°C · 💧 {liveRainfallData.currentHumidityPct}% RH · 💨 {liveRainfallData.currentWindKmh} km/h
                </div>
              )}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl glass-card border border-slate-200 dark:border-white/10 flex items-center gap-3 card-hover">
            <div className="p-2.5 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/20">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Critical Risk Sinks</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-black text-rose-500 font-mono">{severeCount} Zones</span>
                <span className="text-[10px] text-rose-400 font-bold">&gt;75% Prob</span>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl glass-card border border-slate-200 dark:border-white/10 flex items-center gap-3 card-hover">
            <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">AI Radar Accuracy</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-black text-emerald-500 dark:text-emerald-400 font-mono">99.95%</span>
                <span className="text-[10px] text-emerald-400 font-bold">Sentinel Ensemble</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Map Container Card */}
        <div className="rounded-3xl glass-card border border-slate-200 dark:border-white/10 shadow-2xl p-3 sm:p-4 space-y-3 relative overflow-hidden">
          {/* Map Controls Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>Geospatial Radar & Terrain Elevation Viewport</span>
              </span>
              <span className="text-[11px] text-slate-400 hidden md:inline">&bull; Click any zone for deep-dive analysis</span>
            </div>

            {/* Tile Layer Selector */}
            <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-white/10 text-xs">
              {(Object.keys(MAP_MODES) as MapModeKey[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setMapMode(mode)}
                  className={`px-3 py-1 rounded-xl font-bold transition-all text-[11px] ${
                    mapMode === mode
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {MAP_MODES[mode].name}
                </button>
              ))}
            </div>
          </div>

          {/* The High-Resolution Map */}
          <div className="relative w-full rounded-2xl overflow-hidden shadow-inner border border-slate-200 dark:border-white/10" style={{ height: '620px' }}>
            <MapContainer
              center={activeCenter}
              zoom={activeZoom}
              scrollWheelZoom={true}
              style={{ height: '100%', width: '100%', borderRadius: '1rem', zIndex: 1 }}
              zoomControl={true}
            >
              <MapCenterController center={activeCenter} zoom={activeZoom} />
              <MapResizer />
              
              {/* Base Map Tile Layer */}
              <TileLayer
                key={mapMode}
                attribution={MAP_MODES[mapMode].attribution}
                url={MAP_MODES[mapMode].url}
                maxZoom={20}
              />

              {/* Real-Time RainViewer Live Doppler Radar Layer */}
              {isDopplerRadarActive && currentRadarFrame && radarMeta?.host && (
                <TileLayer
                  key={`radar_${currentRadarFrame.time}`}
                  url={`${radarMeta.host}${currentRadarFrame.path}/256/{z}/{x}/{y}/4/1_1.png`}
                  opacity={radarOpacity}
                  zIndex={100}
                  maxZoom={19}
                />
              )}

              {/* Render Severity Polygons */}
              {zones.map((zone) => {
                const isSevere = zone.severity === 'Severe';
                const isModerate = zone.severity === 'Moderate';
                const fillColor = isSevere ? '#ef4444' : isModerate ? '#f59e0b' : '#10b981';
                const strokeColor = isSevere ? '#f87171' : isModerate ? '#fbbf24' : '#34d399';
                const latLngCoords: [number, number][] = zone.geojson_feature?.geometry?.coordinates?.[0]?.map(
                  (coord: number[]) => [coord[1], coord[0]] as [number, number]
                ) || [];

                if (latLngCoords.length === 0) return null;
                const isSelected = selectedZone?.id === zone.id;

                return (
                  <React.Fragment key={zone.id}>
                    <Polygon
                      positions={latLngCoords}
                      pathOptions={{
                        fillColor,
                        fillOpacity: isSelected ? 0.85 : 0.55,
                        color: strokeColor,
                        weight: isSelected ? 3.5 : 1.5
                      }}
                      eventHandlers={{
                        click: () => setSelectedZone(zone)
                      }}
                    >
                      <Tooltip sticky direction="top">
                        <div className="font-bold text-xs p-1">
                          <div>{zone.zone_name}</div>
                          <span className={`block text-[11px] font-mono mt-0.5 ${isSevere ? 'text-rose-400' : isModerate ? 'text-amber-400' : 'text-emerald-400'}`}>
                            {zone.severity} Hazard ({(zone.probability * 100).toFixed(1)}%)
                          </span>
                        </div>
                      </Tooltip>
                    </Polygon>

                    {isSevere && latLngCoords[0] && (
                      <CircleMarker
                        center={latLngCoords[0]}
                        radius={7}
                        pathOptions={{
                          color: '#ef4444',
                          fillColor: '#ef4444',
                          fillOpacity: 1,
                          weight: 2
                        }}
                        eventHandlers={{
                          click: () => setSelectedZone(zone)
                        }}
                      />
                    )}
                  </React.Fragment>
                );
              })}

              {/* Live IoT Ultrasonic Sump Markers */}
              {showIoTSensors && iotSensors.map((sensor) => {
                const isDanger = sensor.currentDepthM >= sensor.dangerThresholdM;
                const isWarning = sensor.currentDepthM >= sensor.warningThresholdM && !isDanger;
                const markerColor = isDanger ? '#ef4444' : isWarning ? '#f59e0b' : '#06b6d4';

                return (
                  <CircleMarker
                    key={sensor.id}
                    center={[sensor.lat, sensor.lng]}
                    radius={isDanger ? 12 : 9}
                    pathOptions={{
                      fillColor: markerColor,
                      color: isDanger ? '#fee2e2' : '#ffffff',
                      weight: 2.5,
                      fillOpacity: 0.95
                    }}
                  >
                    <Tooltip sticky direction="top" className="custom-leaflet-tooltip">
                      <div className="text-xs font-sans">
                        <div className="flex items-center gap-1.5 font-bold text-slate-100">
                          <Gauge className="w-3.5 h-3.5 text-cyan-400" />
                          <span>{sensor.name}</span>
                        </div>
                        <div className="text-[11px] font-mono mt-0.5 text-cyan-300">
                          Depth: {(sensor.currentDepthM * 100).toFixed(0)}cm &bull; Flow: {sensor.flowRateLps} L/s
                        </div>
                      </div>
                    </Tooltip>

                    <Popup className="custom-leaflet-popup">
                      <div className="p-1 space-y-2.5 text-xs font-sans min-w-[260px]">
                        <div className="flex items-start justify-between gap-2 border-b border-slate-700 pb-1.5">
                          <div>
                            <span className="text-[9px] font-mono text-cyan-400 block">IOT TELEMETRY NODE</span>
                            <h4 className="font-bold text-slate-100 text-sm">{sensor.name}</h4>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                            isDanger ? 'bg-red-500 text-white animate-pulse' : isWarning ? 'bg-amber-500 text-white' : 'bg-cyan-600 text-white'
                          }`}>
                            {isDanger ? 'DANGER' : isWarning ? 'WARNING' : 'NORMAL'}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 bg-slate-900 p-2 rounded-xl border border-slate-800 text-[11px] font-mono">
                          <div>
                            <span className="text-slate-400 text-[10px] font-sans">Water Depth</span>
                            <p className={`text-base font-black ${isDanger ? 'text-red-400' : 'text-cyan-300'}`}>
                              {(sensor.currentDepthM * 100).toFixed(0)} cm
                            </p>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[10px] font-sans">Inflow Rate</span>
                            <p className="text-base font-black text-sky-300">{sensor.flowRateLps} L/s</p>
                          </div>
                        </div>

                        {/* Pump Actuator */}
                        <div className="p-2 rounded-xl bg-slate-800 border border-slate-700 space-y-1.5">
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="font-bold text-slate-300 flex items-center gap-1">
                              <Power className="w-3 h-3 text-cyan-400" /> Pump Status:
                            </span>
                            <span className="font-mono font-bold text-emerald-400">
                              {sensor.pumpStatus.replace(/_/g, ' ')}
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-1 pt-1">
                            <button
                              onClick={() => handlePumpCommand(sensor, 'AUTO')}
                              className={`py-1 rounded text-[9px] font-bold ${sensor.pumpStatus.startsWith('AUTO') ? 'bg-cyan-500 text-white' : 'bg-slate-700 text-slate-300'}`}
                            >
                              AUTO
                            </button>
                            <button
                              onClick={() => handlePumpCommand(sensor, 'MANUAL_ON')}
                              className={`py-1 rounded text-[9px] font-bold ${sensor.pumpStatus === 'MANUAL_ON' ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-300'}`}
                            >
                              FORCE ON
                            </button>
                            <button
                              onClick={() => handlePumpCommand(sensor, 'EMERGENCY_BOOST')}
                              className={`py-1 rounded text-[9px] font-bold ${sensor.pumpStatus === 'EMERGENCY_BOOST' ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-700 text-red-300'}`}
                            >
                              BOOST
                            </button>
                          </div>
                        </div>
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}
            </MapContainer>

            {/* Floating Doppler Radar Player Widget */}
            {isDopplerRadarActive && (
              <RadarPlaybackBar
                radarMeta={radarMeta}
                currentFrameIndex={radarFrameIndex}
                setCurrentFrameIndex={setRadarFrameIndex}
                isPlaying={isRadarPlaying}
                setIsPlaying={setIsRadarPlaying}
                radarOpacity={radarOpacity}
                setRadarOpacity={setRadarOpacity}
              />
            )}

            {/* Bottom-Left Floating Legend */}
            <div className="absolute bottom-5 left-5 z-[500] p-3.5 rounded-2xl hud-panel text-xs space-y-2">
              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-[11px]">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>Waterlogging Risk Level</span>
              </div>
              <div className="space-y-1 text-[10px] font-semibold">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]"></span>
                  <span className="text-slate-700 dark:text-slate-300">Severe Inundation (&gt;75% prob)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]"></span>
                  <span className="text-slate-700 dark:text-slate-300">Moderate Stagnation (40-75%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></span>
                  <span className="text-slate-700 dark:text-slate-300">Low / Adequate Soil Moisture</span>
                </div>
                {showIoTSensors && (
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-700/50">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 border border-white"></span>
                    <span className="text-cyan-300 font-mono">Live IoT Sump Sensor Node</span>
                  </div>
                )}
              </div>
            </div>

            {/* Sleek Top-Right HUD Zone Inspector Drawer */}
            <AnimatePresence>
              {selectedZone && (
                <motion.div
                  initial={{ opacity: 0, x: 20, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 20, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-5 right-5 z-[500] w-84 max-w-[calc(100vw-3rem)] rounded-3xl hud-panel p-5 text-xs space-y-3.5 shadow-2xl"
                >
                  <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-200 dark:border-white/10">
                    <div>
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        selectedZone.severity === 'Severe'
                          ? 'badge-neon-rose'
                          : selectedZone.severity === 'Moderate'
                          ? 'badge-neon-amber'
                          : 'badge-neon-emerald'
                      }`}>
                        {selectedZone.severity} Inundation Risk
                      </span>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white mt-1.5 leading-snug">
                        {selectedZone.zone_name}
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Land Use: <strong className="text-slate-300 capitalize">{selectedZone.land_use.replace('_', ' ')}</strong>
                      </p>
                    </div>

                    <button
                      onClick={() => setSelectedZone(null)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    >
                      &times;
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/5">
                      <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-semibold">Probability</span>
                      <span className="font-mono font-black text-cyan-400 text-sm">
                        {(selectedZone.probability * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/5">
                      <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-semibold">Footprint</span>
                      <span className="font-mono font-black text-slate-800 dark:text-slate-200 text-sm">
                        {selectedZone.area_ha.toFixed(1)} ha
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-slate-700 dark:text-slate-300 text-xs leading-relaxed">
                    <strong className="text-cyan-400 block mb-1 font-bold">Recommended Civil Intervention:</strong>
                    {selectedZone.severity === 'Severe'
                      ? 'Deploy emergency 150 HP diesel dewatering pumps immediately and desilt downstream culvert.'
                      : selectedZone.severity === 'Moderate'
                      ? 'Construct perimeter diversion swales and clear accumulated silt from field ditches.'
                      : 'Maintain standard gravity drainage outlets and monitor soil moisture.'}
                  </div>

                  <button
                    onClick={onNavigateToDrainage}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 text-white font-extrabold text-xs shadow-lg shadow-rose-500/25 transition-all"
                  >
                    <span>View in Drainage Action Matrix</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Catchment Severity Zones Explorer (Below the Map) */}
        <div className="space-y-4 pt-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>Catchment Hazard Directory & Hydrological Profiles</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full badge-neon-cyan font-mono">
                  {zones.length} Zones
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Multi-criteria SAR radar backscatter, digital elevation slope, and spatial pooling risk profiles.
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-xs">
              {['All', 'Severe', 'Moderate', 'Low'].map((f) => (
                <button
                  key={f}
                  onClick={() => setZoneFilter(f)}
                  className={`px-3 py-1 rounded-xl font-bold transition-all text-[11px] ${
                    zoneFilter === f
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-white'
                  }`}
                >
                  {f === 'All' ? 'All' : f}
                </button>
              ))}
            </div>
          </div>

          {/* Grid of Zone Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredZones.map((z) => {
              const isSevere = z.severity === 'Severe';
              const isModerate = z.severity === 'Moderate';
              const isSelected = selectedZone?.id === z.id;

              return (
                <div
                  key={z.id}
                  onClick={() => handleZoneCardClick(z)}
                  className={`p-5 rounded-3xl glass-card border transition-all cursor-pointer card-hover space-y-3.5 ${
                    isSelected
                      ? 'border-cyan-400 ring-2 ring-cyan-500/30 shadow-lg shadow-cyan-500/10'
                      : 'border-slate-200 dark:border-white/10'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                        {z.zone_name}
                      </h4>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        Land: <strong className="text-slate-300 capitalize">{z.land_use.replace('_', ' ')}</strong> &bull; Elev: {z.elevation_m}m
                      </span>
                    </div>

                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      isSevere
                        ? 'badge-neon-rose'
                        : isModerate
                        ? 'badge-neon-amber'
                        : 'badge-neon-emerald'
                    }`}>
                      {z.severity} ({(z.probability * 100).toFixed(0)}%)
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-[10px] bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-2xl border border-slate-200/60 dark:border-white/5">
                    <div>
                      <span className="text-slate-400 block">Footprint</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 font-mono text-xs">{z.area_ha.toFixed(1)} ha</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Slope</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 font-mono text-xs">{z.slope_deg}°</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Est. Volume</span>
                      <span className="font-bold text-cyan-400 font-mono text-xs">
                        ~{Math.round(z.area_ha * (isSevere ? 3500 : 1500) / 1000)}k m³
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100 dark:border-white/5">
                    <span className="text-slate-400">Click to focus satellite view</span>
                    <span className="text-cyan-400 font-bold flex items-center gap-0.5">
                      Inspect on Map <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Live IoT Sensors Telemetry Drawer */}
      <LiveIoTSensorsDrawer
        isOpen={isIoTDrawerOpen}
        onClose={() => setIsIoTDrawerOpen(false)}
        sensors={iotSensors}
        onRefresh={() => {
          if (onRefreshTelemetry) onRefreshTelemetry();
        }}
      />

      {/* Emergency Operations Center (EOC) Modal */}
      <EmergencyOpsModal
        isOpen={isEmergencyOpsOpen}
        onClose={() => setIsEmergencyOpsOpen(false)}
        alerts={alerts}
        sensors={iotSensors}
      />
    </div>
  );
};
