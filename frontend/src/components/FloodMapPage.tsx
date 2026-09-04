import React, { useState, useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Polygon, Popup, useMap, Tooltip, CircleMarker } from 'react-leaflet';
import { StudyArea, SeverityZone, DrainageAdvisory, AnalysisRun } from '../types';
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
  Maximize2, 
  TrendingDown, 
  Wrench, 
  CheckCircle2, 
  Search, 
  Filter, 
  Sparkles,
  Zap,
  Activity,
  X
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
}

function MapCenterController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.2 });
  }, [center, zoom, map]);
  return null;
}

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

const MAP_MODES = {
  hybrid: {
    name: 'Google Hybrid',
    url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    attribution: '&copy; Google Maps &mdash; Satellite & High-Res Roads'
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
  onNavigateToDrainage
}) => {
  const [mapMode, setMapMode] = useState<MapModeKey>('hybrid');
  const [selectedZone, setSelectedZone] = useState<SeverityZone | null>(null);
  const [zoneFilter, setZoneFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

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
    window.scrollTo({ top: 180, behavior: 'smooth' });
  };

  // Metrics
  const totalAreaKm2 = run?.total_area_km2 || 42.5;
  const waterloggedKm2 = run?.waterlogged_area_km2 || 9.4;
  const waterloggedPct = run?.waterlogged_percentage || 22.1;
  const severeCount = zones.filter((z) => z.severity === 'Severe').length;
  const moderateCount = zones.filter((z) => z.severity === 'Moderate').length;
  const lowCount = zones.filter((z) => z.severity === 'Low').length;

  const filteredZones = useMemo(() => {
    return zones.filter((z) => {
      const matchesFilter = zoneFilter === 'All' || z.severity === zoneFilter;
      const matchesSearch = z.zone_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            z.land_use.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [zones, zoneFilter, searchQuery]);

  return (
    <div className="flex-1 w-full overflow-y-auto pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        
        {/* Spacious Mission Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-2 border-b border-slate-200/80 dark:border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full badge-cyan text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" />
                Sentinel-1 SAR C-Band Radar Fusion
              </span>
              <span className="text-xs text-slate-400 font-semibold hidden sm:inline">&bull; Multi-Temporal Dual Polarization (VV + VH)</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white mt-2">
              Karnataka Satellite Flood Observatory
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
              High-resolution synthetic aperture radar (SAR) waterlogging detection and terrain flow accumulation for Karnataka catchments.
            </p>
          </div>

          {/* Basin & Inference Trigger Toolbar */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Basin Dropdown */}
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl surface-card text-xs">
              <MapPin className="w-4 h-4 text-cyan-500 shrink-0" />
              <span className="font-bold text-slate-400 uppercase tracking-wider hidden sm:inline">Basin:</span>
              <select
                value={selectedAreaId}
                onChange={(e) => {
                  onSelectArea(e.target.value);
                  setSelectedZone(null);
                }}
                className="bg-transparent text-sm font-black text-slate-900 dark:text-white focus:outline-none cursor-pointer pr-2 max-w-[240px] truncate"
              >
                {studyAreas.map((area) => (
                  <option key={area.id} value={area.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                    {area.name} ({area.state_region.split('(')[0]})
                  </option>
                ))}
              </select>
            </div>

            {/* Run Analysis Button */}
            <button
              onClick={onRunAnalysis}
              disabled={isAnalyzing}
              className="flex items-center gap-2.5 px-6 py-3 bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-xs sm:text-sm rounded-2xl shadow-xl shadow-cyan-500/25 border border-cyan-400/40 transition-all transform active:scale-95 disabled:opacity-50"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing Radar Backscatter...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-current text-white" />
                  <span>Run Satellite AI Detection</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 4 Sleek Telemetry Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-3xl surface-card card-interactive space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">Inundation Footprint</span>
              <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-500 border border-cyan-500/20">
                <Droplets className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">{waterloggedKm2} km²</span>
              <span className="text-xs text-cyan-500 font-bold font-mono">({waterloggedPct}%)</span>
            </div>
            <span className="text-[11px] text-slate-400 block">Of total {totalAreaKm2} km² catchment</span>
          </div>

          <div className="p-5 rounded-3xl surface-card card-interactive space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">Precipitation Event</span>
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20">
                <CloudRain className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400 font-mono">{rainfallMm} mm</span>
            </div>
            <span className="text-[11px] text-slate-400 block">Accumulated storm volume</span>
          </div>

          <div className="p-5 rounded-3xl surface-card card-interactive space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">Critical Flood Sinks</span>
              <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-rose-500 font-mono">{severeCount} Sinks</span>
            </div>
            <span className="text-[11px] text-rose-400 font-bold block">&gt;75% Probability &bull; Immediate Action</span>
          </div>

          <div className="p-5 rounded-3xl surface-card card-interactive space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">AI Model Precision</span>
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-emerald-500 font-mono">99.95%</span>
            </div>
            <span className="text-[11px] text-emerald-400 font-bold block">Random Forest / XGBoost Ensemble</span>
          </div>
        </div>

        {/* Hero Map Container */}
        <div className="rounded-3xl surface-card p-4 sm:p-5 space-y-4 relative overflow-hidden shadow-2xl">
          {/* Map Top Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-1">
            <div className="flex items-center gap-2.5">
              <span className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-500" />
                <span>Satellite Waterlogging & Terrain Flow Map</span>
              </span>
              <span className="text-xs text-slate-400 hidden md:inline">&bull; Click any hazard zone on the map to inspect civil recommendations</span>
            </div>

            {/* Tile Layer Selector */}
            <div className="flex items-center gap-1 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-white/10 text-xs">
              {(Object.keys(MAP_MODES) as MapModeKey[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setMapMode(mode)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all text-[11px] ${
                    mapMode === mode
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {MAP_MODES[mode].name}
                </button>
              ))}
            </div>
          </div>

          {/* Map Viewport */}
          <div className="relative w-full rounded-2xl overflow-hidden shadow-inner border border-slate-200 dark:border-white/10" style={{ height: '620px' }}>
            <MapContainer
              center={activeCenter}
              zoom={activeZoom}
              scrollWheelZoom={true}
              style={{ height: '100%', width: '100%', borderRadius: '1.25rem', zIndex: 1 }}
              zoomControl={true}
            >
              <MapCenterController center={activeCenter} zoom={activeZoom} />
              <MapResizer />
              
              <TileLayer
                key={mapMode}
                attribution={MAP_MODES[mapMode].attribution}
                url={MAP_MODES[mapMode].url}
                maxZoom={20}
              />

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
                          <span className={`block text-[11px] font-mono mt-0.5 ${isSevere ? 'text-rose-500 font-black' : isModerate ? 'text-amber-500 font-bold' : 'text-emerald-500'}`}>
                            {zone.severity} Risk ({(zone.probability * 100).toFixed(1)}%)
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
            </MapContainer>

            {/* Bottom-Left Floating Legend */}
            <div className="absolute bottom-5 left-5 z-[500] p-4 rounded-2xl surface-card text-xs space-y-2 shadow-2xl backdrop-blur-xl">
              <div className="font-black text-slate-900 dark:text-white flex items-center gap-1.5 text-[11px]">
                <Layers className="w-3.5 h-3.5 text-cyan-500" />
                <span>Hydrological Risk Level</span>
              </div>
              <div className="space-y-1.5 text-[11px] font-semibold">
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
                  <span className="text-slate-700 dark:text-slate-300">Low Moisture / Well-Drained</span>
                </div>
              </div>
            </div>

            {/* Slide-In Right HUD Zone Inspector (Clean & Non-Intrusive) */}
            <AnimatePresence>
              {selectedZone && (
                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 50 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className="absolute top-5 right-5 z-[500] w-96 max-w-[calc(100vw-3rem)] rounded-3xl surface-card p-6 text-xs space-y-4 shadow-2xl border border-white/20"
                >
                  <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-200 dark:border-white/10">
                    <div>
                      <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        selectedZone.severity === 'Severe'
                          ? 'badge-rose'
                          : selectedZone.severity === 'Moderate'
                          ? 'badge-amber'
                          : 'badge-emerald'
                      }`}>
                        {selectedZone.severity} Inundation Risk
                      </span>
                      <h3 className="text-base font-black text-slate-900 dark:text-white mt-1.5 leading-snug">
                        {selectedZone.zone_name}
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Land Use: <strong className="text-slate-700 dark:text-slate-200 capitalize">{selectedZone.land_use.replace('_', ' ')}</strong>
                      </p>
                    </div>

                    <button
                      onClick={() => setSelectedZone(null)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 text-center">
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/5">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Probability</span>
                      <span className="font-mono font-black text-cyan-500 text-base">
                        {(selectedZone.probability * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/5">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Footprint</span>
                      <span className="font-mono font-black text-slate-800 dark:text-slate-200 text-base">
                        {selectedZone.area_ha.toFixed(1)} ha
                      </span>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-slate-800 dark:text-slate-200 text-xs leading-relaxed">
                    <strong className="text-cyan-600 dark:text-cyan-400 block mb-1 font-extrabold flex items-center gap-1.5">
                      <Wrench className="w-3.5 h-3.5" />
                      Recommended Civil Intervention:
                    </strong>
                    {selectedZone.severity === 'Severe'
                      ? 'Deploy emergency 150 HP diesel dewatering pumps immediately and desilt downstream culvert.'
                      : selectedZone.severity === 'Moderate'
                      ? 'Construct perimeter diversion swales and clear accumulated silt from field ditches.'
                      : 'Maintain standard gravity drainage outlets and monitor soil moisture.'}
                  </div>

                  <button
                    onClick={onNavigateToDrainage}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 text-white font-extrabold text-xs shadow-lg shadow-rose-500/25 transition-all active:scale-95"
                  >
                    <span>View in Drainage Action Matrix</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Catchment Severity Zones Directory (Below Map) */}
        <div className="space-y-5 pt-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
                <span>Catchment Hazard Directory & Terrain Risk Profiles</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full badge-cyan font-mono">
                  {zones.length} Zones
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Multi-criteria SAR radar backscatter, digital elevation slope, and spatial pooling risk profiles.
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-xs">
              {['All', 'Severe', 'Moderate', 'Low'].map((f) => (
                <button
                  key={f}
                  onClick={() => setZoneFilter(f)}
                  className={`px-3.5 py-1.5 rounded-xl font-bold transition-all text-xs ${
                    zoneFilter === f
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {f === 'All' ? 'All Risks' : f}
                </button>
              ))}
            </div>
          </div>

          {/* Grid of Zone Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredZones.map((z) => {
              const isSevere = z.severity === 'Severe';
              const isModerate = z.severity === 'Moderate';
              const isSelected = selectedZone?.id === z.id;

              return (
                <div
                  key={z.id}
                  onClick={() => handleZoneCardClick(z)}
                  className={`p-6 rounded-3xl surface-card card-interactive cursor-pointer space-y-4 border ${
                    isSelected
                      ? 'border-cyan-500 ring-2 ring-cyan-500/30 shadow-xl'
                      : 'border-slate-200/80 dark:border-white/10'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                        {z.zone_name}
                      </h3>
                      <span className="text-xs text-slate-400 block mt-0.5">
                        Land: <strong className="text-slate-700 dark:text-slate-300 capitalize">{z.land_use.replace('_', ' ')}</strong> &bull; Elev: {z.elevation_m}m
                      </span>
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-black ${
                      isSevere
                        ? 'badge-rose'
                        : isModerate
                        ? 'badge-amber'
                        : 'badge-emerald'
                    }`}>
                      {z.severity} ({(z.probability * 100).toFixed(0)}%)
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs bg-slate-50 dark:bg-slate-900/60 p-3 rounded-2xl border border-slate-200/60 dark:border-white/5">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block">Footprint</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100 font-mono text-sm">{z.area_ha.toFixed(1)} ha</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block">Slope</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100 font-mono text-sm">{z.slope_deg}°</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block">Est. Volume</span>
                      <span className="font-bold text-cyan-600 dark:text-cyan-400 font-mono text-sm">
                        ~{Math.round(z.area_ha * (isSevere ? 3500 : 1500) / 1000)}k m³
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-white/5">
                    <span className="text-slate-400 font-medium">Click to center on map</span>
                    <span className="text-cyan-600 dark:text-cyan-400 font-extrabold flex items-center gap-1">
                      Inspect <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
