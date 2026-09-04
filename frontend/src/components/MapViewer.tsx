import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Polygon, Popup, useMap, Tooltip, CircleMarker } from 'react-leaflet';
import { StudyArea, SeverityZone, DrainageAdvisory } from '../types';
import { ActiveSensorLayer, BaseMapType } from './LayerControlPanel';
import { AlertTriangle, Droplets, Mountain, Radio, ShieldCheck, Compass, Info, ArrowUpRight } from 'lucide-react';
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
  onSelectZone
}) => {
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
        // Color gradient from low blue to high magenta/red
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
        // Spectral water index - deep blues and cyans
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
        // Vegetation index - greens
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
        // Radar backscatter - violet to deep navy
        const sarVal = activeLayer === 'sar_vv' ? (zone.vv_db ?? -14) : (zone.vh_db ?? -20);
        if (sarVal < -18.0) {
          fillColor = '#4338ca'; // Smooth specular open water
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
        // Elevation / slope
        if (zone.slope_deg < 1.0) {
          fillColor = '#dc2626'; // Flat basin depression (highest flood risk)
          strokeColor = '#f87171';
        } else if (zone.slope_deg < 2.5) {
          fillColor = '#ea580c';
          strokeColor = '#fb923c';
        } else {
          fillColor = '#10b981';
          strokeColor = '#34d399';
        }
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
      weight: 2,
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

        {/* Base Tile Layer */}
        <TileLayer
          url={BASE_MAP_URLS[baseMap].url}
          attribution={BASE_MAP_URLS[baseMap].attribution}
          maxZoom={19}
        />

        {/* Render Study Area Bounding Outline if available */}
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

        {/* Render Severity Polygons */}
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
      </MapContainer>

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

      {/* Floating Active Layer Indicator Overlay */}
      <div className="absolute top-4 left-4 z-20 pointer-events-none">
        <div className="glass-panel px-3 py-1.5 rounded-lg border border-slate-700/80 text-xs flex items-center gap-2 shadow-lg">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></div>
          <span className="text-slate-400">Active Sensor Overlay:</span>
          <span className="font-semibold text-cyan-300 uppercase tracking-wide">{activeLayer.replace('_', ' ')}</span>
        </div>
      </div>
    </div>
  );
};
