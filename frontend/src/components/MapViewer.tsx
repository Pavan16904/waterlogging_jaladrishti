import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Polygon, Popup, useMap, Tooltip, CircleMarker, Marker } from 'react-leaflet';
import { StudyArea, SeverityZone, DrainageAdvisory, IoTSensor, RadarMeta } from '../types';
import { ActiveSensorLayer, BaseMapType } from './LayerControlPanel';
import { RadarPlaybackBar } from './RadarPlaybackBar';
import { 
  AlertTriangle, 
  Droplets, 
  Mountain, 
  Radio, 
  ShieldCheck, 
  Compass, 
  Info, 
  ArrowUpRight,
  Gauge,
  Power,
  BatteryCharging,
  Signal,
  TrendingUp,
  TrendingDown,
  CloudRain,
  Zap
} from 'lucide-react';
import L from 'leaflet';

interface MapViewerProps {
  studyArea: StudyArea | null;
  zones: SeverityZone[];
  advisories: DrainageAdvisory[];
  activeLayer: ActiveSensorLayer;
  baseMap: BaseMapType;
  layerOpacity: number;
  showComparison: boolean;
  splitPosition: number;
  onSelectZone: (zone: SeverityZone) => void;
  // Real-Time Doppler & IoT Telemetry Props
  radarMeta?: RadarMeta | null;
  iotSensors?: IoTSensor[];
  showIoTSensors?: boolean;
  isNowcastActive?: boolean;
  onTriggerPumpCommand?: (sensor: IoTSensor, command: 'AUTO' | 'MANUAL_ON' | 'MANUAL_OFF' | 'EMERGENCY_BOOST') => void;
}

// Map center adjuster on study area change
function MapCenterController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.5 });
  }, [center, zoom, map]);
  return null;
}

const BASE_MAP_URLS: Record<BaseMapType, { url: string; attribution: string }> = {
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap'
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye'
  },
  street: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors'
  },
  light: {
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap'
  }
};

export const MapViewer: React.FC<MapViewerProps> = ({
  studyArea,
  zones,
  advisories,
  activeLayer,
  baseMap,
  layerOpacity,
  showComparison,
  splitPosition,
  onSelectZone,
  radarMeta = null,
  iotSensors = [],
  showIoTSensors = true,
  isNowcastActive = false,
  onTriggerPumpCommand
}) => {
  // Radar Animation Loop State
  const [radarFrameIndex, setRadarFrameIndex] = useState<number>(0);
  const [isRadarPlaying, setIsRadarPlaying] = useState<boolean>(true);
  const [radarOpacity, setRadarOpacity] = useState<number>(0.75);

  const radarFrames = radarMeta?.pastFrames || [];
  const currentRadarFrame = radarFrames[radarFrameIndex];

  // Auto loop radar frames
  useEffect(() => {
    if (!isRadarPlaying || radarFrames.length === 0 || activeLayer !== 'realtime_radar') {
      return;
    }
    const timer = setInterval(() => {
      setRadarFrameIndex((prev) => (prev + 1) % radarFrames.length);
    }, 750);
    return () => clearInterval(timer);
  }, [isRadarPlaying, radarFrames.length, activeLayer]);

  const center: [number, number] = useMemo(() => {
    if (studyArea) {
      return [studyArea.center_lat, studyArea.center_lng];
    }
    return [12.9352, 77.6850]; // Default Bengaluru
  }, [studyArea]);

  const zoom = studyArea?.zoom_level || 13;

  // Helper to determine style based on active layer
  const getZoneStyle = (zone: SeverityZone) => {
    let fillColor = '#10b981';
    let strokeColor = '#34d399';
    let fillOpacity = layerOpacity * 0.7;

    switch (activeLayer) {
      case 'severity':
        if (zone.severity === 'Severe') {
          fillColor = '#ef4444';
          strokeColor = '#f87171';
        } else if (zone.severity === 'Moderate') {
          fillColor = '#f59e0b';
          strokeColor = '#fbbf24';
        } else {
          fillColor = '#10b981';
          strokeColor = '#34d399';
        }
        break;

      case 'probability':
        const p = zone.probability;
        if (p >= 0.75) {
          fillColor = '#e11d48';
          strokeColor = '#f43f5e';
        } else if (p >= 0.50) {
          fillColor = '#f97316';
          strokeColor = '#fb923c';
        } else if (p >= 0.30) {
          fillColor = '#3b82f6';
          strokeColor = '#60a5fa';
        } else {
          fillColor = '#06b6d4';
          strokeColor = '#22d3ee';
        }
        break;

      case 'mndwi':
      case 'ndwi':
        const indexVal = activeLayer === 'mndwi' ? (zone.mndwi ?? 0) : (zone.ndwi ?? 0);
        if (indexVal > 0.4) {
          fillColor = '#0284c7';
          strokeColor = '#38bdf8';
        } else if (indexVal > 0.1) {
          fillColor = '#06b6d4';
          strokeColor = '#67e8f9';
        } else {
          fillColor = '#64748b';
          strokeColor = '#94a3b8';
        }
        break;

      case 'ndvi':
        const ndviVal = zone.ndvi ?? 0.3;
        if (ndviVal > 0.45) {
          fillColor = '#16a34a';
          strokeColor = '#4ade80';
        } else if (ndviVal > 0.2) {
          fillColor = '#84cc16';
          strokeColor = '#a3e635';
        } else {
          fillColor = '#ca8a04';
          strokeColor = '#facc15';
        }
        break;

      case 'sar_vv':
      case 'sar_vh':
        const sarVal = activeLayer === 'sar_vv' ? (zone.vv_db ?? -14) : (zone.vh_db ?? -20);
        if (sarVal < -18.0) {
          fillColor = '#4338ca';
          strokeColor = '#818cf8';
        } else if (sarVal < -13.0) {
          fillColor = '#6366f1';
          strokeColor = '#a5b4fc';
        } else {
          fillColor = '#8b5cf6';
          strokeColor = '#c084fc';
        }
        break;

      case 'dem':
        if (zone.slope_deg < 1.0) {
          fillColor = '#dc2626';
          strokeColor = '#f87171';
        } else if (zone.slope_deg < 2.5) {
          fillColor = '#ea580c';
          strokeColor = '#fb923c';
        } else {
          fillColor = '#10b981';
          strokeColor = '#34d399';
        }
        break;

      case 'realtime_radar':
        // Transparent polygons with glowing dashed boundary when viewing radar
        fillColor = zone.severity === 'Severe' ? '#ef4444' : '#06b6d4';
        strokeColor = zone.severity === 'Severe' ? '#f87171' : '#38bdf8';
        fillOpacity = 0.15;
        break;

      case 'rgb':
      default:
        fillColor = '#0284c7';
        strokeColor = '#38bdf8';
        break;
    }

    return {
      fillColor,
      color: strokeColor,
      weight: activeLayer === 'realtime_radar' ? 1.5 : 2,
      opacity: 0.9,
      fillOpacity
    };
  };

  return (
    <div className="relative flex-1 h-full w-full bg-dark-900 overflow-hidden">
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        zoomControl={false}
        className="w-full h-full z-10"
      >
        <MapCenterController center={center} zoom={zoom} />

        {/* 1. Base Tile Layer */}
        <TileLayer
          url={BASE_MAP_URLS[baseMap].url}
          attribution={BASE_MAP_URLS[baseMap].attribution}
          maxZoom={19}
        />

        {/* 2. Real-Time RainViewer Live Doppler Radar Layer */}
        {activeLayer === 'realtime_radar' && currentRadarFrame && radarMeta?.host && (
          <TileLayer
            key={`radar_${currentRadarFrame.time}`}
            url={`${radarMeta.host}${currentRadarFrame.path}/256/{z}/{x}/{y}/4/1_1.png`}
            opacity={radarOpacity}
            zIndex={100}
            maxZoom={19}
          />
        )}

        {/* 3. Study Area Bounding Outline */}
        {studyArea?.bounds_geojson?.coordinates && (
          <Polygon
            positions={studyArea.bounds_geojson.coordinates[0].map((coord: number[]) => [coord[1], coord[0]])}
            pathOptions={{
              color: '#0ea5e9',
              weight: 1.5,
              dashArray: '4, 6',
              fillOpacity: 0.02
            }}
          />
        )}

        {/* 4. Render Severity Zones */}
        {zones.map((zone) => {
          const latLngCoords: [number, number][] = zone.geojson_feature.geometry.coordinates[0].map(
            (coord: number[]) => [coord[1], coord[0]]
          );

          const matchingAdvisory = advisories.find((a) => a.zone_id === zone.id);

          return (
            <Polygon
              key={zone.id}
              positions={latLngCoords}
              pathOptions={getZoneStyle(zone)}
              eventHandlers={{
                click: () => onSelectZone(zone)
              }}
            >
              <Tooltip sticky direction="top" className="custom-leaflet-tooltip">
                <div className="text-xs font-sans">
                  <p className="font-bold text-slate-100">{zone.zone_name}</p>
                  <p className="text-[11px] text-slate-300">
                    Severity: <span className={zone.severity === 'Severe' ? 'text-rose-400 font-semibold' : zone.severity === 'Moderate' ? 'text-amber-400 font-semibold' : 'text-emerald-400 font-semibold'}>{zone.severity}</span> ({(zone.probability * 100).toFixed(0)}%)
                  </p>
                </div>
              </Tooltip>

              <Popup className="custom-leaflet-popup">
                <div className="p-1 space-y-2 text-xs font-sans min-w-[240px]">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2 border-b border-slate-700 pb-1.5">
                    <div>
                      <h4 className="font-bold text-slate-100 text-sm">{zone.zone_name}</h4>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">
                        Land Use: {zone.land_use.replace('_', ' ')}
                      </span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        zone.severity === 'Severe'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : zone.severity === 'Moderate'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      }`}
                    >
                      {zone.severity}
                    </span>
                  </div>

                  {/* Multi-Sensor Feature Values */}
                  <div className="grid grid-cols-2 gap-1.5 text-[11px] bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                    <div>
                      <span className="text-slate-400">Probability:</span>
                      <p className="font-mono font-semibold text-cyan-300">{(zone.probability * 100).toFixed(1)}%</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Area Inundated:</span>
                      <p className="font-mono font-semibold text-slate-200">{zone.area_ha.toFixed(1)} ha</p>
                    </div>
                    <div>
                      <span className="text-slate-400">DEM Elevation:</span>
                      <p className="font-mono font-semibold text-slate-200">{zone.elevation_m.toFixed(1)} m</p>
                    </div>
                    <div>
                      <span className="text-slate-400">Terrain Slope:</span>
                      <p className="font-mono font-semibold text-slate-200">{zone.slope_deg.toFixed(1)}°</p>
                    </div>
                    <div>
                      <span className="text-slate-400">MNDWI / NDWI:</span>
                      <p className="font-mono font-semibold text-sky-300">{zone.mndwi?.toFixed(2)} / {zone.ndwi?.toFixed(2)}</p>
                    </div>
                    <div>
                      <span className="text-slate-400">SAR VV / VH:</span>
                      <p className="font-mono font-semibold text-purple-300">{zone.vv_db?.toFixed(1)} / {zone.vh_db?.toFixed(1)} dB</p>
                    </div>
                  </div>

                  {/* Priority Drainage Action Preview */}
                  {matchingAdvisory && (
                    <div className="p-2 rounded bg-slate-800/80 border border-slate-700/80 text-[11px] space-y-1">
                      <div className="flex items-center gap-1 font-semibold text-cyan-400">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                        <span>{matchingAdvisory.priority}</span>
                      </div>
                      <p className="text-slate-300 leading-tight line-clamp-2">
                        {matchingAdvisory.action_recommendation}
                      </p>
                    </div>
                  )}
                </div>
              </Popup>
            </Polygon>
          );
        })}

        {/* 5. Live IoT Ultrasonic Sump Markers */}
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
                fillOpacity: 0.9
              }}
            >
              <Tooltip sticky direction="top" className="custom-leaflet-tooltip">
                <div className="text-xs font-sans">
                  <div className="flex items-center gap-1.5 font-bold text-slate-100">
                    <Gauge className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{sensor.name}</span>
                  </div>
                  <div className="text-[11px] font-mono mt-0.5 text-cyan-300">
                    Depth: {(sensor.currentDepthM * 100).toFixed(0)}cm • Flow: {sensor.flowRateLps} L/s
                  </div>
                </div>
              </Tooltip>

              <Popup className="custom-leaflet-popup">
                <div className="p-1 space-y-2.5 text-xs font-sans min-w-[260px]">
                  {/* Sump Node Header */}
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

                  {/* Depth & Discharge Readout */}
                  <div className="grid grid-cols-2 gap-2 bg-slate-900 p-2 rounded-xl border border-slate-800 text-[11px] font-mono">
                    <div>
                      <span className="text-slate-400 text-[10px] font-sans">Inundation Level</span>
                      <p className={`text-base font-black ${isDanger ? 'text-red-400' : 'text-cyan-300'}`}>
                        {(sensor.currentDepthM * 100).toFixed(0)} cm
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] font-sans">Sump Inflow</span>
                      <p className="text-base font-black text-sky-300">{sensor.flowRateLps} L/s</p>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] font-sans">Siltation</span>
                      <p className="font-semibold text-amber-300">{sensor.siltationPct}% Silt</p>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] font-sans">4G Signal</span>
                      <p className="font-semibold text-emerald-300">{sensor.signalDbm} dBm</p>
                    </div>
                  </div>

                  {/* Dewatering Pump Remote Actuator */}
                  <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700 space-y-1.5">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="font-bold text-slate-300 flex items-center gap-1">
                        <Power className="w-3 h-3 text-cyan-400" />
                        Pump Status:
                      </span>
                      <span className="font-mono font-bold text-emerald-400">
                        {sensor.pumpStatus.replace(/_/g, ' ')}
                      </span>
                    </div>

                    {onTriggerPumpCommand && (
                      <div className="grid grid-cols-3 gap-1 pt-1">
                        <button
                          onClick={() => onTriggerPumpCommand(sensor, 'AUTO')}
                          className={`py-1 rounded text-[9px] font-bold ${sensor.pumpStatus.startsWith('AUTO') ? 'bg-cyan-500 text-white' : 'bg-slate-700 text-slate-300'}`}
                        >
                          AUTO
                        </button>
                        <button
                          onClick={() => onTriggerPumpCommand(sensor, 'MANUAL_ON')}
                          className={`py-1 rounded text-[9px] font-bold ${sensor.pumpStatus === 'MANUAL_ON' ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-300'}`}
                        >
                          FORCE ON
                        </button>
                        <button
                          onClick={() => onTriggerPumpCommand(sensor, 'EMERGENCY_BOOST')}
                          className={`py-1 rounded text-[9px] font-bold ${sensor.pumpStatus === 'EMERGENCY_BOOST' ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-700 text-red-300'}`}
                        >
                          BOOST
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}

      </MapContainer>

      {/* 6. Floating Radar Playback Bar when Doppler layer is active */}
      {activeLayer === 'realtime_radar' && (
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

      {/* Before / After Split Screen Divider Line Visualizer */}
      {showComparison && (
        <div
          className="absolute top-0 bottom-0 pointer-events-none z-20 flex items-center justify-center"
          style={{ left: `${splitPosition}%` }}
        >
          <div className="w-0.5 h-full bg-cyan-400 shadow-glow-cyan"></div>
          <div className="w-6 h-6 rounded-full bg-cyan-500 border-2 border-white flex items-center justify-center shadow-lg -ml-3">
            <Compass className="w-3.5 h-3.5 text-white animate-spin" />
          </div>
        </div>
      )}

      {/* Floating Active Layer & Nowcast Indicator Overlay */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 pointer-events-none">
        <div className="glass-panel px-3 py-1.5 rounded-lg border border-slate-700/80 text-xs flex items-center gap-2 shadow-lg">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></div>
          <span className="text-slate-400">Active Sensor Overlay:</span>
          <span className="font-semibold text-cyan-300 uppercase tracking-wide">
            {activeLayer === 'realtime_radar' ? '🔴 Live Doppler Precipitation' : activeLayer.replace('_', ' ')}
          </span>
        </div>

        {isNowcastActive && (
          <div className="glass-panel px-3 py-1.5 rounded-lg border border-red-500/50 bg-red-950/40 text-xs flex items-center gap-2 shadow-lg text-red-300 animate-fadeIn">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            <span className="font-bold">Real-Time Open-Meteo Nowcast Active</span>
          </div>
        )}
      </div>
    </div>
  );
};
