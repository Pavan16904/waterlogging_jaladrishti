import React from 'react';
import { 
  Layers, 
  Eye, 
  EyeOff, 
  Sliders, 
  Map as MapIcon, 
  Activity, 
  Droplet, 
  Radio, 
  Mountain, 
  SplitSquareVertical,
  HelpCircle,
  Sparkles,
  CloudRain,
  Gauge,
  ShieldAlert,
  Zap,
  Play
} from 'lucide-react';

export type ActiveSensorLayer = 'rgb' | 'ndwi' | 'mndwi' | 'ndvi' | 'sar_vv' | 'sar_vh' | 'dem' | 'severity' | 'probability' | 'realtime_radar' | 'iot_sensors';
export type BaseMapType = 'dark' | 'satellite' | 'street' | 'light';

interface LayerControlProps {
  activeLayer: ActiveSensorLayer;
  setActiveLayer: (layer: ActiveSensorLayer) => void;
  baseMap: BaseMapType;
  setBaseMap: (bm: BaseMapType) => void;
  layerOpacity: number;
  setLayerOpacity: (op: number) => void;
  showComparison: boolean;
  setShowComparison: (show: boolean) => void;
  splitPosition: number;
  setSplitPosition: (pos: number) => void;
  showIoTSensorsOverlay?: boolean;
  setShowIoTSensorsOverlay?: (show: boolean) => void;
  isNowcastActive?: boolean;
  setIsNowcastActive?: (active: boolean) => void;
  onOpenIoTSensors?: () => void;
  onOpenEmergencyOps?: () => void;
}

export const LayerControlPanel: React.FC<LayerControlProps> = ({
  activeLayer,
  setActiveLayer,
  baseMap,
  setBaseMap,
  layerOpacity,
  setLayerOpacity,
  showComparison,
  setShowComparison,
  splitPosition,
  setSplitPosition,
  showIoTSensorsOverlay = true,
  setShowIoTSensorsOverlay,
  isNowcastActive = false,
  setIsNowcastActive,
  onOpenIoTSensors,
  onOpenEmergencyOps
}) => {
  return (
    <aside className="w-80 glass-nav border-r flex flex-col h-full overflow-y-auto p-5 gap-5 z-20 text-xs transition-colors">
      
      {/* Title */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <Layers className="w-5 h-5 text-cyan-500" />
          <h2 className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white">Sensor & ML Layers</h2>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 font-mono font-bold border border-cyan-500/20">
          Live Radar Sync
        </span>
      </div>

      {/* 1. Real-Time Doppler Radar & Live Nowcast Spotlight */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-br from-cyan-500/10 via-blue-500/10 to-indigo-500/10 border border-cyan-500/30 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-black text-cyan-400 uppercase tracking-wider text-[11px]">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            <span>Real-Time Radar & Nowcast</span>
          </div>
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono font-bold">
            10-Min Live
          </span>
        </div>

        {/* Real-time Doppler Radar Button */}
        <button
          onClick={() => setActiveLayer('realtime_radar')}
          className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all ${
            activeLayer === 'realtime_radar'
              ? 'bg-cyan-500 text-white font-bold shadow-md shadow-cyan-500/30'
              : 'bg-white/80 dark:bg-slate-900/80 text-slate-800 dark:text-slate-200 hover:border-cyan-500/40 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <CloudRain className={`w-4 h-4 ${activeLayer === 'realtime_radar' ? 'text-white' : 'text-cyan-400'}`} />
            <div className="text-left">
              <span className="text-xs block font-bold">Live Doppler Precipitation</span>
              <span className={`text-[9px] ${activeLayer === 'realtime_radar' ? 'text-white/80' : 'text-slate-400'}`}>
                RainViewer Live Reflectivity Loop
              </span>
            </div>
          </div>
          {activeLayer === 'realtime_radar' ? <Eye className="w-4 h-4 text-white" /> : <EyeOff className="w-4 h-4 text-slate-400" />}
        </button>

        {/* Live Dynamic Nowcast Toggle */}
        {setIsNowcastActive && (
          <div className="pt-2 border-t border-cyan-500/20 flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-900 dark:text-white block text-[11px]">🔴 Live ML Nowcast</span>
              <span className="text-[9px] text-slate-500 dark:text-slate-400">Stream dynamic Open-Meteo rain rates</span>
            </div>
            <button
              onClick={() => setIsNowcastActive(!isNowcastActive)}
              className={`w-10 h-5 rounded-full transition-colors relative ${
                isNowcastActive ? 'bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-0.5 ${
                  isNowcastActive ? 'left-5' : 'left-0.5'
                }`}
              />
            </button>
          </div>
        )}
      </div>

      {/* 2. IoT Telemetry & Flood Sump Network */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Gauge className="w-3.5 h-3.5 text-sky-400" />
            <span>IoT Sump & Underpass Network</span>
          </label>
        </div>

        <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-800 dark:text-slate-200">Show IoT Level Markers</span>
            {setShowIoTSensorsOverlay && (
              <button
                onClick={() => setShowIoTSensorsOverlay(!showIoTSensorsOverlay)}
                className={`w-10 h-5 rounded-full transition-colors relative ${
                  showIoTSensorsOverlay ? 'bg-sky-500' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-0.5 ${
                    showIoTSensorsOverlay ? 'left-5' : 'left-0.5'
                  }`}
                />
              </button>
            )}
          </div>

          {onOpenIoTSensors && (
            <button
              onClick={onOpenIoTSensors}
              className="w-full py-1.5 px-3 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 font-bold text-[11px] border border-sky-500/30 flex items-center justify-center gap-1.5 transition-colors"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Open IoT Telemetry Monitor</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. Base Map Switcher */}
      <div className="space-y-2">
        <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <MapIcon className="w-3.5 h-3.5 text-slate-400" />
          <span>Base Map Style</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { id: 'dark', label: 'Dark Matter' },
            { id: 'satellite', label: 'Esri Satellite' },
            { id: 'street', label: 'OpenStreetMap' },
            { id: 'light', label: 'Positron Light' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setBaseMap(item.id as BaseMapType)}
              className={`px-3 py-2 rounded-xl text-left transition-all ${
                baseMap === item.id
                  ? 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/50 font-bold shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-850 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Primary ML & Decision Layers */}
      <div className="space-y-2">
        <label className="text-[11px] font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-cyan-500" />
          <span>AI Detection & Severity</span>
        </label>
        <div className="space-y-2">
          <button
            onClick={() => setActiveLayer('severity')}
            className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
              activeLayer === 'severity'
                ? 'bg-gradient-to-r from-cyan-500/15 to-blue-500/15 text-slate-900 dark:text-white border border-cyan-500/50 font-bold shadow-sm'
                : 'bg-slate-100 dark:bg-slate-850 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              </div>
              <span className="text-xs">Waterlogging Severity Zones</span>
            </div>
            {activeLayer === 'severity' ? <Eye className="w-4 h-4 text-cyan-500" /> : <EyeOff className="w-4 h-4 text-slate-400" />}
          </button>

          <button
            onClick={() => setActiveLayer('probability')}
            className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
              activeLayer === 'probability'
                ? 'bg-gradient-to-r from-blue-500/15 to-indigo-500/15 text-slate-900 dark:text-white border border-blue-500/50 font-bold'
                : 'bg-slate-100 dark:bg-slate-850 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
              <span className="text-xs">Waterlogging Probability Grid</span>
            </div>
            {activeLayer === 'probability' ? <Eye className="w-4 h-4 text-blue-500" /> : <EyeOff className="w-4 h-4 text-slate-400" />}
          </button>
        </div>
      </div>

      {/* 5. Optical Multi-Spectral Indices (Sentinel-2) */}
      <div className="space-y-2">
        <label className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
          <Droplet className="w-3.5 h-3.5 text-emerald-500" />
          <span>Optical Spectral Indices (Sentinel-2)</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { id: 'mndwi', label: 'MNDWI (Water)', formula: '(G-SWIR)/(G+SWIR)' },
            { id: 'ndwi', label: 'NDWI (Open Water)', formula: '(G-NIR)/(G+NIR)' },
            { id: 'ndvi', label: 'NDVI (Vegetation)', formula: '(NIR-R)/(NIR+R)' },
            { id: 'rgb', label: 'Sentinel-2 RGB', formula: 'True Color (B4,B3,B2)' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveLayer(item.id as ActiveSensorLayer)}
              className={`p-2.5 rounded-xl text-left transition-all ${
                activeLayer === item.id
                  ? 'bg-emerald-500/15 border border-emerald-500/50 text-slate-900 dark:text-white font-bold'
                  : 'bg-slate-100 dark:bg-slate-850 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
              }`}
            >
              <span className="text-[11px] font-semibold block">{item.label}</span>
              <p className="text-[9px] text-slate-500 dark:text-slate-400 font-mono mt-0.5 truncate">{item.formula}</p>
            </button>
          ))}
        </div>
      </div>

      {/* 6. SAR Radar & DEM Terrain Context */}
      <div className="space-y-2">
        <label className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
          <Radio className="w-3.5 h-3.5 text-amber-500" />
          <span>SAR Radar & DEM Terrain Context</span>
        </label>
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setActiveLayer('sar_vv')}
              className={`p-2.5 rounded-xl text-left transition-all ${
                activeLayer === 'sar_vv'
                  ? 'bg-amber-500/15 border border-amber-500/50 text-slate-900 dark:text-white font-bold'
                  : 'bg-slate-100 dark:bg-slate-850 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
              }`}
            >
              <span className="text-[11px] font-semibold block">SAR VV Backscatter</span>
              <p className="text-[9px] text-slate-500 font-mono">Specular Dip</p>
            </button>

            <button
              onClick={() => setActiveLayer('sar_vh')}
              className={`p-2.5 rounded-xl text-left transition-all ${
                activeLayer === 'sar_vh'
                  ? 'bg-amber-500/15 border border-amber-500/50 text-slate-900 dark:text-white font-bold'
                  : 'bg-slate-100 dark:bg-slate-850 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
              }`}
            >
              <span className="text-[11px] font-semibold block">SAR VH Backscatter</span>
              <p className="text-[9px] text-slate-500 font-mono">Cross-pol</p>
            </button>
          </div>

          <button
            onClick={() => setActiveLayer('dem')}
            className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
              activeLayer === 'dem'
                ? 'bg-amber-500/15 border border-amber-500/50 text-slate-900 dark:text-white font-bold'
                : 'bg-slate-100 dark:bg-slate-850 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Mountain className="w-4 h-4 text-amber-500" />
              <span>SRTM DEM (Elevation & Slope)</span>
            </div>
            {activeLayer === 'dem' ? <Eye className="w-4 h-4 text-amber-500" /> : <EyeOff className="w-4 h-4 text-slate-400" />}
          </button>
        </div>
      </div>

      {/* 7. Layer Controls & Before/After Comparison */}
      <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-4">
        {/* Opacity Slider */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 text-xs">
            <span className="flex items-center gap-1.5 font-medium">
              <Sliders className="w-3.5 h-3.5 text-cyan-500" />
              <span>Layer Opacity</span>
            </span>
            <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400">{Math.round(layerOpacity * 100)}%</span>
          </div>
          <input
            type="range"
            min={0.1}
            max={1.0}
            step={0.05}
            value={layerOpacity}
            onChange={(e) => setLayerOpacity(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
          />
        </div>

        {/* Before/After Split Comparison Toggle */}
        <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
              <SplitSquareVertical className="w-4 h-4 text-sky-500" />
              <span>Before / After Split</span>
            </span>
            <button
              onClick={() => setShowComparison(!showComparison)}
              className={`w-10 h-5 rounded-full transition-colors relative ${
                showComparison ? 'bg-cyan-500' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-0.5 ${
                  showComparison ? 'left-5' : 'left-0.5'
                }`}
              />
            </button>
          </div>

          {showComparison && (
            <div className="space-y-1 pt-1">
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>Pre-Monsoon Baseline</span>
                <span>Post-Event Inundation</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={splitPosition}
                onChange={(e) => setSplitPosition(parseInt(e.target.value, 10))}
                className="w-full h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
              />
            </div>
          )}
        </div>
      </div>

    </aside>
  );
};
