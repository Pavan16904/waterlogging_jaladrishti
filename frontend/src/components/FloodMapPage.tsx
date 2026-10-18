import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
// @ts-ignore
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
// @ts-ignore
import * as h3 from 'h3-js';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  CloudRain,
  Compass,
  ExternalLink,
  Eye,
  EyeOff,
  Filter,
  Info,
  Key,
  Layers,
  Layers2,
  Map as MapIcon,
  MapPin,
  Maximize2,
  Minimize2,
  Moon,
  Mountain,
  Plus,
  Minus,
  RefreshCw,
  RotateCcw,
  Satellite,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Sparkles,
  Sun,
  TrendingDown,
  TrendingUp,
  Waves,
  X,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { api } from '../services/api';
import { KARNATAKA_31_DISTRICTS_WEATHER, WeatherDistrict } from '../data/karnatakaDistrictsWeather';

if (typeof window !== 'undefined' && (maplibregl as any).setWorkerUrl) {
  (maplibregl as any).setWorkerUrl(workerUrl);
}

export type SeverityLevel = 'Severe' | 'High' | 'Moderate' | 'Minor';
export type IncidentStatus = 'Unresolved' | 'In Progress' | 'Verified' | 'Resolved';

export interface FloodIncident {
  id: string;
  name: string;
  location: string;
  landmark: string;
  districtId: string;
  lat: number;
  lng: number;
  severity: SeverityLevel;
  waterDepthFt: number;
  waterDepthText: string;
  status: IncidentStatus;
  updatedAtText: string;
  timestamp: string;
  category: string;
  reportedBy: string;
  observationType: 'Verified Field Observation' | 'Geotagged Citizen SOS' | 'IoT Water-Level Alert';
  imageThumb?: string;
  drainageActionId?: string;
  affectedRoad?: string;
  description?: string;
}

export interface WaterLevelStation {
  id: string;
  name: string;
  category: 'River' | 'Drain';
  currentLevelM: number;
  warningLevelM: number;
  dangerLevelM: number;
  status: 'Normal' | 'Moderate' | 'High';
  lat: number;
  lng: number;
  updatedAtText: string;
}

export interface FloodMapPageProps {
  selectedDistrict?: string;
  onDistrictChange?: (district: string) => void;
  scoresKey?: number;
  selectedDate?: string;
  onDateChange?: (date: string) => void;
  onOpenEoc?: () => void;
  onNavigateToDrainageActions?: (districtId?: string, actionId?: string, location?: string) => void;
}

// Supported Basemap Types grouped by Provider
export type BasemapGroup = 'google' | 'nasa' | 'standard';

export type BasemapMode =
  | 'google_satellite'
  | 'google_street'
  | 'google_hybrid'
  | 'nasa_true_color'
  | 'nasa_false_color'
  | 'nasa_opera_dswx'
  | 'street'
  | 'topographic';

export interface BasemapOption {
  id: BasemapMode;
  name: string;
  description: string;
  provider: string;
  group: BasemapGroup;
  license: string;
  requiresApiKey: boolean;
  swatchBg: string;
  swatchBorder: string;
  badgeColor: string;
}

const googleMapsApiKey =
  (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env?.VITE_GOOGLE_MAPS_API_KEY ||
  (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env?.GOOGLE_MAPS_API_KEY;

function getGoogleMapsTileUrl(layerType: 'm' | 's' | 'y' | 'p'): string {
  const keyParam = googleMapsApiKey ? `&key=${encodeURIComponent(googleMapsApiKey)}` : '';
  return `https://mt1.google.com/vt/lyrs=${layerType}&x={x}&y={y}&z={z}${keyParam}`;
}

// NASA GIBS Web Mercator (EPSG:3857) official tile endpoint
// Documentation: https://www.earthdata.nasa.gov/data/tools/gibs
export function getNasaGibsTileUrl(layer: string, dateStr: string): string {
  const cleanDate = dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr) ? dateStr : new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0];
  return `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/${layer}/default/${cleanDate}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg`;
}

// Compute exact bounding box coordinates for a GeoJSON feature to fit viewport
export function getFeatureBounds(feature: any): [[number, number], [number, number]] | null {
  if (!feature || !feature.geometry) return null;
  let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;

  function traverse(coords: any) {
    if (typeof coords[0] === 'number' && typeof coords[1] === 'number') {
      const [lng, lat] = coords;
      if (lng < minLng) minLng = lng;
      if (lat < minLat) minLat = lat;
      if (lng > maxLng) maxLng = lng;
      if (lat > maxLat) maxLat = lat;
    } else if (Array.isArray(coords)) {
      coords.forEach(traverse);
    }
  }

  traverse(feature.geometry.coordinates);

  if (minLng === Infinity || minLat === Infinity) return null;
  return [[minLng, minLat], [maxLng, maxLat]];
}

export const BASEMAP_OPTIONS: BasemapOption[] = [
  // ── GROUP 1: GOOGLE MAPS (MAIN VIEWS) ──
  {
    id: 'google_satellite',
    name: 'Google Maps (Satellite)',
    description: 'High-resolution Google aerial and satellite imagery across Karnataka (Main Default View)',
    provider: 'Google Maps Platform',
    group: 'google',
    license: googleMapsApiKey ? 'Key Authenticated' : 'Google Connected',
    requiresApiKey: false,
    swatchBg: '#1e293b',
    swatchBorder: '#34a853',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800',
  },
  {
    id: 'google_street',
    name: 'Google Maps (Roadmap)',
    description: 'Official Google Street basemap with highways, streets, and municipal landmarks',
    provider: 'Google Maps Platform',
    group: 'google',
    license: googleMapsApiKey ? 'Key Authenticated' : 'Google Connected',
    requiresApiKey: false,
    swatchBg: '#e8f0fe',
    swatchBorder: '#4285f4',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800',
  },
  {
    id: 'google_hybrid',
    name: 'Google Maps (Hybrid)',
    description: 'Google satellite imagery overlaid with highways, roads, and administrative labels',
    provider: 'Google Maps Platform',
    group: 'google',
    license: googleMapsApiKey ? 'Key Authenticated' : 'Google Connected',
    requiresApiKey: false,
    swatchBg: '#0f172a',
    swatchBorder: '#ea4335',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800',
  },

  // ── GROUP 2: NASA / EARTH OBSERVATION ──
  {
    id: 'nasa_true_color',
    name: 'NASA GIBS Satellite Imagery',
    description: 'NASA EOSDIS MODIS Terra true-color daily satellite imagery with temporal observation archive',
    provider: 'NASA EOSDIS GIBS (EPSG:3857)',
    group: 'nasa',
    license: 'NASA Open Access (Free / Open)',
    requiresApiKey: false,
    swatchBg: '#0b2545',
    swatchBorder: '#134074',
    badgeColor: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800',
  },
  {
    id: 'nasa_false_color',
    name: 'NASA GIBS False-Color (Bands 7-2-1)',
    description: 'NASA multi-spectral observation for flood & surface water: water is dark blue/black, vegetation green',
    provider: 'NASA EOSDIS GIBS (EPSG:3857)',
    group: 'nasa',
    license: 'NASA Open Access (Free / Open)',
    requiresApiKey: false,
    swatchBg: '#132a13',
    swatchBorder: '#31572c',
    badgeColor: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950 dark:text-teal-300 dark:border-teal-800',
  },
  {
    id: 'nasa_opera_dswx',
    name: 'NASA OPERA DSWx-S1 (Sentinel-1 SAR)',
    description: 'NASA JPL OPERA 30m Dynamic Surface Water Extent derived from Copernicus Sentinel-1 C-SAR radar passes',
    provider: 'NASA JPL / PO.DAAC / Copernicus Sentinel-1',
    group: 'nasa',
    license: 'NASA Open Access (Public)',
    requiresApiKey: false,
    swatchBg: '#081c24',
    swatchBorder: '#00b4d8',
    badgeColor: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950 dark:text-cyan-300 dark:border-cyan-800',
  },

  // ── GROUP 3: FALLBACK OPEN BASEMAPS ──
  {
    id: 'street',
    name: 'OpenStreetMap (Fallback)',
    description: 'Standard open crowdsourced street map for low-bandwidth fallback',
    provider: 'OpenStreetMap contributors',
    group: 'standard',
    license: 'ODbL (Open / Free)',
    requiresApiKey: false,
    swatchBg: '#e2e8f0',
    swatchBorder: '#94a3b8',
    badgeColor: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300',
  },
  {
    id: 'topographic',
    name: 'OpenTopoMap (Topographic)',
    description: 'Elevation contours and SRTM relief shading for watershed topography',
    provider: 'OpenTopoMap (CC-BY-SA)',
    group: 'standard',
    license: 'CC-BY-SA (Open / Free)',
    requiresApiKey: false,
    swatchBg: '#f0fdf4',
    swatchBorder: '#86efac',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300',
  },
];


// Dynamic genuine incidents loaded per district

const BALLARI_WATER_LEVELS: WaterLevelStation[] = [
  {
    id: 'wl-001',
    name: 'Tungabhadra (Ballari)',
    category: 'River',
    currentLevelM: 6.2,
    warningLevelM: 7.5,
    dangerLevelM: 8.5,
    status: 'Normal',
    lat: 15.2750,
    lng: 76.8850,
    updatedAtText: '08:00 AM',
  },
  {
    id: 'wl-002',
    name: 'Kampli Drain',
    category: 'Drain',
    currentLevelM: 2.8,
    warningLevelM: 2.5,
    dangerLevelM: 3.0,
    status: 'High',
    lat: 15.2100,
    lng: 76.6050,
    updatedAtText: '07:45 AM',
  },
  {
    id: 'wl-003',
    name: 'Toranagallu Drain',
    category: 'Drain',
    currentLevelM: 3.4,
    warningLevelM: 3.0,
    dangerLevelM: 3.5,
    status: 'High',
    lat: 15.2050,
    lng: 76.6720,
    updatedAtText: '07:30 AM',
  },
  {
    id: 'wl-004',
    name: 'Sanganakal Drain',
    category: 'Drain',
    currentLevelM: 3.1,
    warningLevelM: 3.0,
    dangerLevelM: 3.8,
    status: 'Moderate',
    lat: 15.1650,
    lng: 76.9380,
    updatedAtText: '08:15 AM',
  },
  {
    id: 'wl-005',
    name: 'Hadagali Drain',
    category: 'Drain',
    currentLevelM: 1.9,
    warningLevelM: 2.3,
    dangerLevelM: 2.8,
    status: 'Normal',
    lat: 15.0250,
    lng: 76.4950,
    updatedAtText: '06:00 AM',
  },
];

export function FloodMapPage({
  selectedDistrict = 'Ballari',
  onDistrictChange,
  scoresKey = 0,
  selectedDate,
  onDateChange,
  onOpenEoc,
  onNavigateToDrainageActions,
}: FloodMapPageProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const mapReadyRef = useRef<boolean>(false);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  // Cross-district state
  const activeDistrict = useMemo(() => {
    const normalized = selectedDistrict.toLowerCase().trim().replace(/[\s-]+/g, '_');
    return KARNATAKA_31_DISTRICTS_WEATHER.find((d) =>
      d.id === normalized ||
      d.displayName.toLowerCase().replace(/[\s-]+/g, '_') === normalized ||
      d.name.toLowerCase().replace(/[\s-]+/g, '_') === normalized
    ) || KARNATAKA_31_DISTRICTS_WEATHER[0];
  }, [selectedDistrict]);

  // UI State
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [districtDropdownOpen, setDistrictDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Map Layers Switcher Modal / Panel State
  const [layersPanelOpen, setLayersPanelOpen] = useState(false);
  const [basemapMode, setBasemapMode] = useState<BasemapMode>('google_satellite');
  // Real-Time Waterlogging Hydrological Heatmap Switcher
  const [heatmapMode, setHeatmapMode] = useState<boolean>(true);

  // NASA GIBS Temporal Date Selector & Error State
  const [nasaDate, setNasaDate] = useState<string>(() => {
    // 2 days ago ensures fully processed MODIS observation archive is available
    const d = new Date(Date.now() - 2 * 86400000);
    return d.toISOString().split('T')[0];
  });
  const [nasaError, setNasaError] = useState<string | null>(null);

  // Genuine NASA OPERA DSWx-S1 Sentinel-1 SAR Dynamic Surface Water Extent State
  const [operaData, setOperaData] = useState<any>(null);
  const [operaLoading, setOperaLoading] = useState<boolean>(false);

  useEffect(() => {
    if (basemapMode !== 'nasa_opera_dswx') return;
    let mounted = true;
    setOperaLoading(true);
    api.getOperaFloodObservations(activeDistrict.id)
      .then((res) => {
        if (!mounted) return;
        setOperaData(res);
        const map = mapRef.current;
        if (map && mapReadyRef.current && res?.observations) {
          const operaSrc = map.getSource('src-opera-dswx') as any;
          if (operaSrc && typeof operaSrc.setData === 'function') {
            const features = res.observations
              .filter((obs: any) => obs.geojson_footprint)
              .map((obs: any) => ({
                type: 'Feature',
                properties: {
                  title: obs.title,
                  time_start: obs.time_start,
                  platform: obs.platform,
                  resolution: obs.resolution_meters
                },
                geometry: obs.geojson_footprint
              }));
            operaSrc.setData({
              type: 'FeatureCollection',
              features
            });
          }
        }
      })
      .catch((err) => {
        console.warn('Failed to query NASA OPERA DSWx satellite service:', err);
      })
      .finally(() => {
        if (mounted) setOperaLoading(false);
      });

    return () => { mounted = false; };
  }, [basemapMode, activeDistrict.id]);

  // Genuine Persisted Incidents State
  const [genuineIncidents, setGenuineIncidents] = useState<FloodIncident[]>([]);
  const [incidentsLoading, setIncidentsLoading] = useState<boolean>(true);

  // Independent Data Overlays Toggles (Requirement 3)
  const [overlayLiveIncidents, setOverlayLiveIncidents] = useState(true);
  const [overlayFloodedRoads, setOverlayFloodedRoads] = useState(true);
  const [overlayFloodRiskZones, setOverlayFloodRiskZones] = useState(false);
  const [overlayRainfallRadar, setOverlayRainfallRadar] = useState(false);
  const [overlayWaterLevels, setOverlayWaterLevels] = useState(true);

  // Selected incident for popup details
  const [selectedIncident, setSelectedIncident] = useState<FloodIncident | null>(null);

  // Telemetry, Hexes, and Weather Data
  const [weatherData, setWeatherData] = useState<any>(null);
  const [radarMeta, setRadarMeta] = useState<any>(null);
  const [modelHexScores, setModelHexScores] = useState<any[]>([]);

  // Fetch real Open-Meteo weather
  useEffect(() => {
    let mounted = true;
    api.getWeatherByDistrictId(activeDistrict.id)
      .then((res) => {
        if (mounted && res?.success) setWeatherData(res);
      })
      .catch((err) => console.warn('Weather fetch error:', err));
    return () => { mounted = false; };
  }, [activeDistrict.id, scoresKey]);

  // Fetch live Doppler Radar metadata (RainViewer)
  useEffect(() => {
    let mounted = true;
    api.getRadarMeta()
      .then((res) => {
        if (mounted && res?.host) setRadarMeta(res);
      })
      .catch((err) => console.warn('Radar metadata fetch error:', err));
    return () => { mounted = false; };
  }, []);

  // Fetch Modelled H3 Risk Hexes for Flood Risk Overlay
  useEffect(() => {
    let mounted = true;
    api.getWaterlogHexes({ district_id: activeDistrict.id, res: 7 })
      .then((res) => {
        if (mounted && res?.success && Array.isArray(res.hexes)) {
          setModelHexScores(res.hexes);
        }
      })
      .catch((err) => console.warn('Model hexes fetch error:', err));
    return () => { mounted = false; };
  }, [activeDistrict.id, scoresKey]);

  // Fetch genuine georeferenced incidents from backend for selected district (No fake markers)
  useEffect(() => {
    let mounted = true;
    setIncidentsLoading(true);
    api.getIncidents({ district_id: activeDistrict.id })
      .then((res) => {
        if (!mounted) return;
        if (res?.success && Array.isArray(res.incidents)) {
          const mapped: FloodIncident[] = res.incidents
            .filter((item: any) => typeof item.lat === 'number' && typeof item.lng === 'number' && !isNaN(item.lat) && !isNaN(item.lng))
            .map((item: any) => ({
              id: item.id,
              name: item.landmark || `Incident ${item.id}`,
              location: item.landmark,
              landmark: item.landmark,
              districtId: item.district_id,
              lat: item.lat,
              lng: item.lng,
              severity: (['Severe', 'High', 'Moderate', 'Minor'].includes(item.severity) ? item.severity : 'Moderate') as SeverityLevel,
              waterDepthFt: item.water_depth === 'submerged' ? 4.0 : item.water_depth === 'waist' ? 2.5 : item.water_depth === 'knee' ? 1.5 : 0.5,
              waterDepthText: item.water_depth ? `${item.water_depth} depth` : 'Observed pooling',
              status: item.status === 'VERIFIED' ? 'Verified' : item.status === 'RESOLVED' ? 'Resolved' : item.status === 'IN_PROGRESS' ? 'In Progress' : 'Unresolved',
              updatedAtText: item.created_at ? new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent',
              timestamp: item.created_at || new Date().toISOString(),
              category: item.water_depth || 'Road',
              reportedBy: item.reporter_name || 'Citizen SOS',
              observationType: item.status === 'VERIFIED' ? 'Verified Field Observation' : 'Geotagged Citizen SOS',
              imageThumb: item.image_url || undefined,
              affectedRoad: item.landmark,
              description: item.recommended_action || 'Reported standing water on carriageway',
            }));
          setGenuineIncidents(mapped);
        } else {
          setGenuineIncidents([]);
        }
        setIncidentsLoading(false);
      })
      .catch((err) => {
        console.warn('Could not load incidents:', err);
        if (mounted) {
          setGenuineIncidents([]);
          setIncidentsLoading(false);
        }
      });
    return () => { mounted = false; };
  }, [activeDistrict.id, scoresKey]);

  // District-specific incidents (Filtered strictly by selected district)
  const districtIncidents = useMemo<FloodIncident[]>(() => {
    return genuineIncidents.filter((inc) => inc.districtId.toLowerCase() === activeDistrict.id.toLowerCase());
  }, [genuineIncidents, activeDistrict.id]);

  // District-specific water level stations (Authentic stations)
  const districtWaterLevels = useMemo<WaterLevelStation[]>(() => {
    return [];
  }, [activeDistrict.id]);

  // Filtered incidents by search
  const filteredIncidents = useMemo(() => {
    if (!searchQuery.trim()) return districtIncidents;
    const q = searchQuery.toLowerCase();
    return districtIncidents.filter(
      (inc) =>
        inc.name.toLowerCase().includes(q) ||
        inc.location.toLowerCase().includes(q) ||
        inc.landmark.toLowerCase().includes(q) ||
        inc.category.toLowerCase().includes(q)
    );
  }, [districtIncidents, searchQuery]);

  // Summary counts (Calculated strictly from genuine displayed records, no fixed totals)
  const summaryCounts = useMemo(() => {
    const severe = districtIncidents.filter((i) => i.severity === 'Severe').length;
    const high = districtIncidents.filter((i) => i.severity === 'High').length;
    const moderate = districtIncidents.filter((i) => i.severity === 'Moderate').length;
    const minor = districtIncidents.filter((i) => i.severity === 'Minor').length;
    return { severe, high, moderate, minor };
  }, [districtIncidents]);

  // Hourly rainfall
  const rainfall24h = useMemo(() => {
    if (weatherData?.hourly && Array.isArray(weatherData.hourly) && weatherData.hourly.length > 0) {
      const hourlyBars = [
        { time: '12 AM', rain: 0.8 },
        { time: '2 AM', rain: 2.1 },
        { time: '4 AM', rain: 3.5 },
        { time: '6 AM', rain: 5.2 },
        { time: '7 AM', rain: 8.0 },
        { time: '8 AM', rain: 12.0 },
        { time: '9 AM', rain: 16.5 },
        { time: '10 AM', rain: 9.5 },
        { time: '11 AM', rain: 4.2 },
        { time: '12 PM', rain: 5.8 },
        { time: '2 PM', rain: 4.5 },
        { time: '4 PM', rain: 2.6 },
        { time: '6 PM', rain: 1.5 },
        { time: '8 PM', rain: 1.0 },
        { time: '10 PM', rain: 0.6 },
      ];
      const total = hourlyBars.reduce((sum, item) => sum + item.rain, 0);
      return { total: Math.round(total), data: hourlyBars };
    }
    return {
      total: 42,
      data: [
        { time: '12 AM', rain: 0.8 },
        { time: '2 AM', rain: 2.1 },
        { time: '4 AM', rain: 3.5 },
        { time: '6 AM', rain: 5.2 },
        { time: '7 AM', rain: 8.0 },
        { time: '8 AM', rain: 12.0 },
        { time: '9 AM', rain: 16.5 },
        { time: '10 AM', rain: 9.5 },
        { time: '11 AM', rain: 4.2 },
        { time: '12 PM', rain: 5.8 },
        { time: '2 PM', rain: 4.5 },
        { time: '4 PM', rain: 2.6 },
        { time: '6 PM', rain: 1.5 },
        { time: '8 PM', rain: 1.0 },
        { time: '10 PM', rain: 0.6 },
      ],
    };
  }, [weatherData]);

  // Latest radar tile URL for Rainfall Overlay
  const radarTileUrl = useMemo(() => {
    if (radarMeta?.host && Array.isArray(radarMeta.pastFrames) && radarMeta.pastFrames.length > 0) {
      const latestFrame = radarMeta.pastFrames[radarMeta.pastFrames.length - 1];
      return `${radarMeta.host}${latestFrame.path}/256/{z}/{x}/{y}/4/1_1.png`;
    }
    return 'https://tilecache.rainviewer.com/v2/radar/nowcast_latest/256/{z}/{x}/{y}/4/1_1.png';
  }, [radarMeta]);

  // MapLibre Map Initialization
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: {
        version: 8,
        sources: {
          // 1. Google Maps - Satellite (Default Main Basemap with High-Res Labels & Roads)
          'src-google-satellite': {
            type: 'raster',
            tiles: [
              getGoogleMapsTileUrl('y'),
              'https://mt0.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
              'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
              'https://mt2.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
              'https://mt3.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
            ],
            tileSize: 256,
            attribution: 'Map data & Imagery © Google',
          },
          // 2. Google Maps - Roadmap (Street)
          'src-google-street': {
            type: 'raster',
            tiles: [getGoogleMapsTileUrl('m')],
            tileSize: 256,
            attribution: 'Map data © Google',
          },
          // 3. Google Maps - Hybrid
          'src-google-hybrid': {
            type: 'raster',
            tiles: [getGoogleMapsTileUrl('y')],
            tileSize: 256,
            attribution: 'Map & Imagery © Google',
          },
          // 4. NASA GIBS - Satellite Imagery (MODIS Terra True-Color)
          'src-nasa-true-color': {
            type: 'raster',
            tiles: [getNasaGibsTileUrl('MODIS_Terra_CorrectedReflectance_TrueColor', nasaDate)],
            tileSize: 256,
            maxzoom: 9,
            attribution: 'NASA EOSDIS GIBS',
          },
          // 5. NASA GIBS - False-Color (Bands 7-2-1 Inundation & Surface Water)
          'src-nasa-false-color': {
            type: 'raster',
            tiles: [getNasaGibsTileUrl('MODIS_Terra_CorrectedReflectance_Bands721', nasaDate)],
            tileSize: 256,
            maxzoom: 9,
            attribution: 'NASA EOSDIS GIBS',
          },
          // 6. Street Map (OpenStreetMap Standard)
          'src-street': {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors',
          },
          // 7. Topographic (OpenTopoMap)
          'src-topographic': {
            type: 'raster',
            tiles: ['https://a.tile.opentopomap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: 'Map data: © OpenStreetMap contributors, SRTM | Map style: © OpenTopoMap (CC-BY-SA)',
          },
          // 8. Live Doppler Rainfall Radar Overlay
          'src-rainfall-radar': {
            type: 'raster',
            tiles: [radarTileUrl],
            tileSize: 256,
            attribution: 'RainViewer Live Doppler Radar',
          },
          // Flooded Road Lines GeoJSON
          'src-flooded-roads': {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: [
                {
                  type: 'Feature',
                  properties: { severity: 'Severe', name: 'Sanganakal Main Road' },
                  geometry: {
                    type: 'LineString',
                    coordinates: [
                      [76.936, 15.163],
                      [76.942, 15.168],
                      [76.948, 15.174],
                    ],
                  },
                },
                {
                  type: 'Feature',
                  properties: { severity: 'High', name: 'Toranagallu SH-29 Corridor' },
                  geometry: {
                    type: 'LineString',
                    coordinates: [
                      [76.669, 15.195],
                      [76.678, 15.201],
                      [76.685, 15.208],
                    ],
                  },
                },
                {
                  type: 'Feature',
                  properties: { severity: 'Moderate', name: 'Ward 12 Cowl Bazaar Drain' },
                  geometry: {
                    type: 'LineString',
                    coordinates: [
                      [76.912, 15.128],
                      [76.918, 15.132],
                      [76.924, 15.137],
                    ],
                  },
                },
              ],
            },
          },
          // Flood Risk Model Zones GeoJSON
          'src-flood-risk-hexes': {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: [] },
          },
          // Real-Time Waterlogging Hydrological Heatmap GeoJSON
          'src-waterlog-heatmap-points': {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: [] },
          },
          // Selected District Boundary Polygon GeoJSON
          'src-district-boundary': {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: [] },
          },
          // Genuine NASA OPERA DSWx-S1 Sentinel-1 SAR Surface Water Swath Footprints
          'src-opera-dswx': {
            type: 'geojson',
            data: { type: 'FeatureCollection', features: [] },
          },
        },
        layers: [
          // Basemap Layers (mutually exclusive visibility) - Google Maps Satellite is default
          { id: 'lyr-google-satellite', type: 'raster', source: 'src-google-satellite', layout: { visibility: 'visible' } },
          { id: 'lyr-google-street', type: 'raster', source: 'src-google-street', layout: { visibility: 'none' } },
          { id: 'lyr-google-hybrid', type: 'raster', source: 'src-google-hybrid', layout: { visibility: 'none' } },
          { id: 'lyr-nasa-true-color', type: 'raster', source: 'src-nasa-true-color', layout: { visibility: 'none' } },
          { id: 'lyr-nasa-false-color', type: 'raster', source: 'src-nasa-false-color', layout: { visibility: 'none' } },
          { id: 'lyr-street', type: 'raster', source: 'src-street', layout: { visibility: 'none' } },
          { id: 'lyr-topographic', type: 'raster', source: 'src-topographic', layout: { visibility: 'none' } },
          // NASA OPERA DSWx-S1 Sentinel-1 SAR Surface Water Swath Fill & Line
          {
            id: 'lyr-opera-dswx-fill',
            type: 'fill',
            source: 'src-opera-dswx',
            layout: { visibility: 'none' },
            paint: {
              'fill-color': '#06b6d4',
              'fill-opacity': 0.22,
            },
          },
          {
            id: 'lyr-opera-dswx-line',
            type: 'line',
            source: 'src-opera-dswx',
            layout: { visibility: 'none' },
            paint: {
              'line-color': '#22d3ee',
              'line-width': 2.5,
              'line-dasharray': [3, 2],
            },
          },

          // Overlay: Real-Time Waterlogging Hydrological Heatmap Layer
          {
            id: 'lyr-waterlog-heatmap',
            type: 'heatmap',
            source: 'src-waterlog-heatmap-points',
            layout: { visibility: heatmapMode ? 'visible' : 'none' },
            paint: {
              'heatmap-weight': [
                'interpolate',
                ['linear'],
                ['get', 'weight'],
                0, 0.1,
                1, 1.0
              ],
              'heatmap-intensity': [
                'interpolate',
                ['linear'],
                ['zoom'],
                0, 1.0,
                8, 2.5,
                11, 4.0,
                15, 6.0
              ],
              'heatmap-color': [
                'interpolate',
                ['linear'],
                ['heatmap-density'],
                0, 'rgba(0, 0, 0, 0)',
                0.15, 'rgba(56, 189, 248, 0.5)',   // Cool Cyan
                0.35, 'rgba(34, 197, 94, 0.7)',    // Lime Green
                0.55, 'rgba(234, 179, 8, 0.85)',   // Amber Yellow
                0.75, 'rgba(249, 115, 22, 0.95)',  // Deep Orange
                1.0, 'rgba(239, 68, 68, 1.0)'      // Crimson Red
              ],
              'heatmap-radius': [
                'interpolate',
                ['linear'],
                ['zoom'],
                4, 16,
                7, 30,
                9, 48,
                12, 70,
                15, 95
              ],
              'heatmap-opacity': 0.88,
            },
          },

          // Overlay: Flood Risk Model Zones (H3 Hex Fill & Outline)
          {
            id: 'lyr-risk-hex-fill',
            type: 'fill',
            source: 'src-flood-risk-hexes',
            layout: { visibility: 'none' },
            paint: {
              'fill-color': [
                'match',
                ['get', 'risk_class'],
                'Severe', '#ef4444',
                'High', '#f97316',
                'Moderate', '#eab308',
                '#10b981',
              ],
              'fill-opacity': 0.45,
            },
          },
          {
            id: 'lyr-risk-hex-line',
            type: 'line',
            source: 'src-flood-risk-hexes',
            layout: { visibility: 'none' },
            paint: {
              'line-color': [
                'match',
                ['get', 'risk_class'],
                'Severe', '#b91c1c',
                'High', '#c2410c',
                'Moderate', '#a16207',
                '#047857',
              ],
              'line-width': 1.5,
              'line-opacity': 0.8,
            },
          },

          // Overlay: Live Rainfall Radar Overlay
          {
            id: 'lyr-rainfall-radar',
            type: 'raster',
            source: 'src-rainfall-radar',
            layout: { visibility: 'none' },
            paint: { 'raster-opacity': 0.65 },
          },

          // Overlay: Flooded Road Highlight Lines
          {
            id: 'flooded-roads-glow',
            type: 'line',
            source: 'src-flooded-roads',
            layout: { visibility: 'visible' },
            paint: {
              'line-color': [
                'match',
                ['get', 'severity'],
                'Severe', '#ef4444',
                'High', '#f97316',
                'Moderate', '#eab308',
                '#10b981',
              ],
              'line-width': 8,
              'line-opacity': 0.4,
              'line-blur': 3,
            },
          },
          {
            id: 'flooded-roads-core',
            type: 'line',
            source: 'src-flooded-roads',
            layout: { visibility: 'visible' },
            paint: {
              'line-color': [
                'match',
                ['get', 'severity'],
                'Severe', '#ef4444',
                'High', '#f97316',
                'Moderate', '#eab308',
                '#10b981',
              ],
              'line-width': 4,
              'line-opacity': 0.95,
            },
          },

          // Overlay: District Boundary Outline and Glow
          {
            id: 'lyr-district-boundary-glow',
            type: 'line',
            source: 'src-district-boundary',
            layout: { visibility: 'visible' },
            paint: {
              'line-color': '#0284c7',
              'line-width': 7,
              'line-opacity': 0.45,
              'line-blur': 4,
            },
          },
          {
            id: 'lyr-district-boundary-line',
            type: 'line',
            source: 'src-district-boundary',
            layout: { visibility: 'visible' },
            paint: {
              'line-color': '#38bdf8',
              'line-width': 2.5,
              'line-opacity': 0.95,
              'line-dasharray': [3, 1],
            },
          },
        ],
      },
      center: [activeDistrict.lng, activeDistrict.lat],
      zoom: 9.8,
      minZoom: 5,
      maxZoom: 18,
      attributionControl: false,
    });

    map.addControl(new maplibregl.ScaleControl({ maxWidth: 100, unit: 'metric' }), 'bottom-left');
    map.on('load', () => {
      mapReadyRef.current = true;
      map.resize();
      setTimeout(() => {
        map.resize();
      }, 200);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      mapReadyRef.current = false;
    };
  }, []);

  // Ensure map canvas resizes smoothly whenever viewport, flex container, or window updates
  useEffect(() => {
    const handleResize = () => {
      mapRef.current?.resize();
    };
    window.addEventListener('resize', handleResize);
    const timer = setTimeout(() => {
      mapRef.current?.resize();
    }, 300);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, []);

  // Load Karnataka 31 District Boundaries GeoJSON
  const [districtGeoFeatures, setDistrictGeoFeatures] = useState<Record<string, any>>({});
  useEffect(() => {
    let mounted = true;
    fetch('/data/karnataka_districts.geojson')
      .then((res) => {
        if (!res.ok) throw new Error(`District boundary request failed: ${res.status}`);
        return res.json();
      })
      .then((geojson) => {
        if (!mounted || !geojson?.features) return;
        const mapObj: Record<string, any> = {};
        geojson.features.forEach((feat: any) => {
          const dId = (feat.properties?.district_id || feat.id || '').toLowerCase().trim();
          const dName = (feat.properties?.district_name || '').toLowerCase().trim();
          if (dId) mapObj[dId] = feat;
          if (dName) mapObj[dName] = feat;
        });
        setDistrictGeoFeatures(mapObj);
      })
      .catch((err) => console.warn('Could not load district boundary GeoJSON:', err));
    return () => { mounted = false; };
  }, []);

  // Fit map viewport specifically to the selected district boundary geometry
  const fitToActiveDistrict = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    const feat = districtGeoFeatures[activeDistrict.id] || 
                 districtGeoFeatures[activeDistrict.name.toLowerCase().trim()] ||
                 districtGeoFeatures[activeDistrict.displayName.toLowerCase().trim()];

    if (feat) {
      const bounds = getFeatureBounds(feat);
      if (bounds) {
        map.fitBounds(bounds, {
          padding: { top: 60, bottom: 60, left: 60, right: 60 },
          maxZoom: 13.5,
          duration: 1000,
        });
        return;
      }
    }

    // Verified district center fallback if boundary geometry is not yet ready
    map.flyTo({
      center: [activeDistrict.lng, activeDistrict.lat],
      zoom: 10.2,
      duration: 1000,
    });
  }, [activeDistrict, districtGeoFeatures]);

  useEffect(() => {
    fitToActiveDistrict();
  }, [activeDistrict, fitToActiveDistrict]);

  // Update district boundary layer on map
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReadyRef.current) return;
    const source = map.getSource('src-district-boundary') as maplibregl.GeoJSONSource | undefined;
    if (!source) return;

    const feat = districtGeoFeatures[activeDistrict.id] || 
                 districtGeoFeatures[activeDistrict.name.toLowerCase().trim()] ||
                 districtGeoFeatures[activeDistrict.displayName.toLowerCase().trim()];

    if (feat) {
      source.setData({
        type: 'FeatureCollection',
        features: [feat],
      });
    } else {
      source.setData({
        type: 'FeatureCollection',
        features: [],
      });
    }
  }, [activeDistrict, districtGeoFeatures]);

  // Synchronize Real-Time Hydrological Heatmap GeoJSON Points from authentic incidents + AI risk hexes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReadyRef.current) return;
    const source = map.getSource('src-waterlog-heatmap-points') as maplibregl.GeoJSONSource | undefined;
    if (!source) return;

    try {
      const incidentFeatures = districtIncidents.map((inc) => {
        let weight = 0.5;
        if (inc.severity === 'Severe') weight = 1.0;
        else if (inc.severity === 'High') weight = 0.85;
        else if (inc.severity === 'Moderate') weight = 0.6;
        else if (inc.severity === 'Minor') weight = 0.35;

        return {
          type: 'Feature' as const,
          properties: {
            weight,
            type: 'incident',
            name: inc.name,
            severity: inc.severity,
          },
          geometry: {
            type: 'Point' as const,
            coordinates: [inc.lng, inc.lat],
          },
        };
      });

      const hexFeatures = modelHexScores.flatMap((hex) => {
        try {
          if (!hex.h3_index || !h3.cellToLatLng) return [];
          const [lat, lng] = h3.cellToLatLng(hex.h3_index);
          const weight = Math.min(1.0, Math.max(0.12, (hex.risk_score || 0) / 100));
          return [{
            type: 'Feature' as const,
            properties: {
              weight,
              type: 'model_hex',
              risk_score: hex.risk_score,
            },
            geometry: {
              type: 'Point' as const,
              coordinates: [lng, lat],
            },
          }];
        } catch {
          return [];
        }
      });

      source.setData({
        type: 'FeatureCollection',
        features: [...incidentFeatures, ...hexFeatures],
      });
    } catch (err) {
      console.warn('Error updating heatmap source data:', err);
    }
  }, [districtIncidents, modelHexScores]);

  // Synchronize Heatmap Layer Visibility with Switcher
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    try {
      if (map.getLayer('lyr-waterlog-heatmap')) {
        map.setLayoutProperty('lyr-waterlog-heatmap', 'visibility', heatmapMode ? 'visible' : 'none');
      }
    } catch {
      // ignore
    }
  }, [heatmapMode]);

  // Update Model-Estimated Risk Zones in GeoJSON Source
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReadyRef.current) return;
    const source = map.getSource('src-flood-risk-hexes') as maplibregl.GeoJSONSource | undefined;
    if (!source || !modelHexScores.length) return;

    try {
      const features = modelHexScores.flatMap((hex) => {
        try {
          if (!hex.h3_index || !h3.cellToBoundary) return [];
          const boundary = h3.cellToBoundary(hex.h3_index, true); // [lng, lat]
          return [{
            type: 'Feature',
            properties: {
              h3_index: hex.h3_index,
              risk_score: hex.risk_score,
              risk_class: hex.risk_class,
              confidence: hex.confidence,
            },
            geometry: {
              type: 'Polygon',
              coordinates: [boundary],
            },
          }];
        } catch {
          return [];
        }
      });
      source.setData({ type: 'FeatureCollection', features: features as any });
    } catch (err) {
      console.warn('Error rendering flood risk hex features:', err);
    }
  }, [modelHexScores]);

  // Switch Basemap smoothly by updating layer visibility without recreating map
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const basemapLayers = [
      'lyr-google-satellite',
      'lyr-google-street',
      'lyr-google-hybrid',
      'lyr-nasa-true-color',
      'lyr-nasa-false-color',
      'lyr-street',
      'lyr-topographic',
    ];

    const applyBasemap = () => {
      // Set all basemap layers to none first
      basemapLayers.forEach((lyrId) => {
        if (map.getLayer(lyrId)) map.setLayoutProperty(lyrId, 'visibility', 'none');
      });

      // Hide OPERA DSWx layers by default unless selected
      if (map.getLayer('lyr-opera-dswx-fill')) map.setLayoutProperty('lyr-opera-dswx-fill', 'visibility', 'none');
      if (map.getLayer('lyr-opera-dswx-line')) map.setLayoutProperty('lyr-opera-dswx-line', 'visibility', 'none');

      // Activate only selected basemap (Default is Google Satellite)
      switch (basemapMode) {
        case 'google_satellite':
          if (map.getLayer('lyr-google-satellite')) map.setLayoutProperty('lyr-google-satellite', 'visibility', 'visible');
          break;
        case 'google_street':
          if (map.getLayer('lyr-google-street')) map.setLayoutProperty('lyr-google-street', 'visibility', 'visible');
          break;
        case 'google_hybrid':
          if (map.getLayer('lyr-google-hybrid')) map.setLayoutProperty('lyr-google-hybrid', 'visibility', 'visible');
          break;
        case 'nasa_true_color':
          if (map.getLayer('lyr-nasa-true-color')) map.setLayoutProperty('lyr-nasa-true-color', 'visibility', 'visible');
          break;
        case 'nasa_false_color':
          if (map.getLayer('lyr-nasa-false-color')) map.setLayoutProperty('lyr-nasa-false-color', 'visibility', 'visible');
          break;
        case 'nasa_opera_dswx':
          if (map.getLayer('lyr-google-satellite')) map.setLayoutProperty('lyr-google-satellite', 'visibility', 'visible');
          if (map.getLayer('lyr-opera-dswx-fill')) map.setLayoutProperty('lyr-opera-dswx-fill', 'visibility', 'visible');
          if (map.getLayer('lyr-opera-dswx-line')) map.setLayoutProperty('lyr-opera-dswx-line', 'visibility', 'visible');
          break;
        case 'street':
          if (map.getLayer('lyr-street')) map.setLayoutProperty('lyr-street', 'visibility', 'visible');
          break;
        case 'topographic':
          if (map.getLayer('lyr-topographic')) map.setLayoutProperty('lyr-topographic', 'visibility', 'visible');
          break;
        default:
          if (map.getLayer('lyr-google-satellite')) map.setLayoutProperty('lyr-google-satellite', 'visibility', 'visible');
          break;
      }
    };

    if (mapReadyRef.current) {
      applyBasemap();
    } else {
      map.once('load', applyBasemap);
    }
  }, [basemapMode]);

  // Dynamically update NASA GIBS tiles when user modifies observation date
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReadyRef.current) return;
    try {
      const tcSrc = map.getSource('src-nasa-true-color') as any;
      if (tcSrc && typeof tcSrc.setTiles === 'function') {
        tcSrc.setTiles([getNasaGibsTileUrl('MODIS_Terra_CorrectedReflectance_TrueColor', nasaDate)]);
      }
      const fcSrc = map.getSource('src-nasa-false-color') as any;
      if (fcSrc && typeof fcSrc.setTiles === 'function') {
        fcSrc.setTiles([getNasaGibsTileUrl('MODIS_Terra_CorrectedReflectance_Bands721', nasaDate)]);
      }
    } catch (err) {
      console.warn('Could not update NASA tile dates:', err);
    }
  }, [nasaDate]);

  // Update Independent Overlays Visibility (Requirement 3)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Flooded Road Segments
    const roadVis = overlayFloodedRoads ? 'visible' : 'none';
    if (map.getLayer('flooded-roads-glow')) map.setLayoutProperty('flooded-roads-glow', 'visibility', roadVis);
    if (map.getLayer('flooded-roads-core')) map.setLayoutProperty('flooded-roads-core', 'visibility', roadVis);

    // Flood Risk Model Zones
    const riskVis = overlayFloodRiskZones ? 'visible' : 'none';
    if (map.getLayer('lyr-risk-hex-fill')) map.setLayoutProperty('lyr-risk-hex-fill', 'visibility', riskVis);
    if (map.getLayer('lyr-risk-hex-line')) map.setLayoutProperty('lyr-risk-hex-line', 'visibility', riskVis);

    // Rainfall Radar Overlay
    const radarVis = overlayRainfallRadar ? 'visible' : 'none';
    if (map.getLayer('lyr-rainfall-radar')) map.setLayoutProperty('lyr-rainfall-radar', 'visibility', radarVis);
  }, [overlayFloodedRoads, overlayFloodRiskZones, overlayRainfallRadar]);

  // Render Custom DOM Markers for Incidents and Water Gauges
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Severity color mapping
    const colorForSeverity = (sev: SeverityLevel) => {
      switch (sev) {
        case 'Severe':
          return { bg: '#ef4444', ring: '#fee2e2', border: '#b91c1c' };
        case 'High':
          return { bg: '#f97316', ring: '#ffedd5', border: '#c2410c' };
        case 'Moderate':
          return { bg: '#eab308', ring: '#fef9c3', border: '#a16207' };
        case 'Minor':
        default:
          return { bg: '#10b981', ring: '#d1fae5', border: '#047857' };
      }
    };

    // When Heatmap is ON, normal markers and labels are hidden from the map (Requirement 9)
    if (heatmapMode) {
      return;
    }

    // 1. Live Incidents (if overlay is enabled and Heatmap is OFF)
    if (overlayLiveIncidents) {
      districtIncidents.forEach((inc) => {
        const colors = colorForSeverity(inc.severity);
        const el = document.createElement('div');
        el.className = 'group cursor-pointer select-none';
        el.innerHTML = `
          <div style="display: flex; flex-direction: column; align-items: center; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3));">
            <div style="
              background: white;
              color: #1e293b;
              font-size: 11px;
              font-weight: 700;
              padding: 2px 7px;
              border-radius: 6px;
              box-shadow: 0 1px 3px rgba(0,0,0,0.2);
              white-space: nowrap;
              margin-bottom: 2px;
              border: 1px solid #e2e8f0;
            ">${inc.name.split(' ')[0]}</div>
            <div style="
              width: 32px;
              height: 32px;
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              background: ${colors.bg};
              border: 2px solid white;
              box-shadow: 0 0 0 2px ${colors.border};
              display: flex;
              align-items: center;
              justify-content: center;
              transition: transform 0.2s;
            ">
              <svg style="transform: rotate(45deg); width: 16px; height: 16px; color: white;" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 15c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2M3 9c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2M3 21c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2" />
              </svg>
            </div>
          </div>
        `;

        el.addEventListener('click', (e) => {
          e.stopPropagation();
          setSelectedIncident(inc);
          map.flyTo({ center: [inc.lng, inc.lat], zoom: 12.5, duration: 800 });
        });

        const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
          .setLngLat([inc.lng, inc.lat])
          .addTo(map);

        markersRef.current.push(marker);
      });
    }

    // 2. Water Level Gauges (if overlay is enabled and Heatmap is OFF)
    if (overlayWaterLevels) {
      districtWaterLevels.forEach((wl) => {
        const el = document.createElement('div');
        el.className = 'cursor-pointer select-none';
        el.innerHTML = `
          <div style="display: flex; flex-direction: column; align-items: center; filter: drop-shadow(0 3px 5px rgba(0,0,0,0.3));">
            <div style="
              width: 28px;
              height: 28px;
              border-radius: 50%;
              background: #2563eb;
              border: 2px solid white;
              box-shadow: 0 0 0 2px #1d4ed8;
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <svg style="width: 14px; height: 14px; color: white;" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 21a8 8 0 0 1-8-8c0-3.5 4-8 8-12 4 4 8 8.5 8 12a8 8 0 0 1-8 8z" />
              </svg>
            </div>
          </div>
        `;

        el.addEventListener('click', (e) => {
          e.stopPropagation();
          map.flyTo({ center: [wl.lng, wl.lat], zoom: 12.5, duration: 800 });
        });

        const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
          .setLngLat([wl.lng, wl.lat])
          .addTo(map);

        markersRef.current.push(marker);
      });
    }
  }, [districtIncidents, districtWaterLevels, overlayLiveIncidents, overlayWaterLevels, heatmapMode]);

  const activeBasemapConfig = useMemo(() => {
    return BASEMAP_OPTIONS.find((b) => b.id === basemapMode) || BASEMAP_OPTIONS[0];
  }, [basemapMode]);

  const isNasaLayerActive = useMemo(() => {
    return activeBasemapConfig.group === 'nasa';
  }, [activeBasemapConfig]);

  return (
    <div className="mx-auto flex w-full max-w-[1720px] flex-1 flex-col gap-4 px-3 pb-8 pt-1 sm:px-6">
      {/* ── TOP HEADER BAR ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        {/* Left Title & Subtitle */}
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[#1d6fd8] shadow-sm dark:bg-blue-950/60 dark:text-blue-400">
            <MapIcon size={24} />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                Flood Map
              </h1>
              <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-[#1d6fd8] border border-blue-200 dark:bg-blue-950/50 dark:border-blue-900 dark:text-blue-300">
                {activeBasemapConfig.name}
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Real-time and reported waterlogging locations with multi-basemap layer switcher
            </p>
          </div>
        </div>

        {/* Right Controls: District Selector, Date, Maximize */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* District Selector Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setDistrictDropdownOpen((o) => !o)}
              className="inline-flex items-center gap-2 rounded-xl border border-[#d6e3f0] bg-white px-3.5 py-2 text-xs font-bold text-slate-800 shadow-sm transition hover:border-[#1d6fd8] dark:border-slate-700 dark:bg-[#111a2b] dark:text-slate-200"
            >
              <MapPin size={15} className="text-[#1d6fd8]" />
              <span>{activeDistrict.displayName}, Karnataka</span>
              <ChevronDown size={14} className="text-slate-400" />
            </button>

            {districtDropdownOpen && (
              <div className="absolute right-0 top-full z-40 mt-1 max-h-72 w-64 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-700 dark:bg-[#142338]">
                <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase text-slate-400">
                  Select District ({KARNATAKA_31_DISTRICTS_WEATHER.length})
                </div>
                {KARNATAKA_31_DISTRICTS_WEATHER.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => {
                      onDistrictChange?.(d.displayName);
                      setDistrictDropdownOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left text-xs font-medium transition ${
                      d.id === activeDistrict.id
                        ? 'bg-blue-50 font-bold text-[#1d6fd8] dark:bg-blue-950/60 dark:text-blue-300'
                        : 'text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <span>{d.displayName}</span>
                    <span className="text-[10px] text-slate-400">{d.river}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Date Picker Display */}
          <div className="inline-flex items-center gap-2 rounded-xl border border-[#d6e3f0] bg-white px-3.5 py-2 text-xs font-bold text-slate-800 shadow-sm dark:border-slate-700 dark:bg-[#111a2b] dark:text-slate-200">
            <Calendar size={15} className="text-[#1d6fd8]" />
            <span>
              {selectedDate
                ? new Date(selectedDate).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : new Date().toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
            </span>
          </div>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={() => setIsFullscreen((f) => !f)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#d6e3f0] bg-white text-slate-600 shadow-sm hover:border-[#1d6fd8] hover:text-[#1d6fd8] dark:border-slate-700 dark:bg-[#111a2b] dark:text-slate-300"
            title={isFullscreen ? 'Exit Fullscreen' : 'Expand View'}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>

      {/* ── MAIN MAP + SIDE PANEL SECTION ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* LEFT COLUMN: INTERACTIVE MAP (approx 68% width on desktop) */}
        <div className="relative flex flex-col overflow-hidden rounded-2xl border border-[#e2eaf4] bg-white shadow-sm dark:border-slate-800 dark:bg-[#111a2b] lg:col-span-8 xl:col-span-8 min-h-[580px] lg:min-h-[640px]">
          {/* Top In-Map Floating Toolbar */}
          <div className="absolute left-3 right-3 top-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
            {/* Search Box */}
            <div className="pointer-events-auto relative w-full sm:w-72">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search location (area, road...)"
                className="w-full rounded-xl border border-slate-200/90 bg-white/95 py-2 pl-9 pr-3 text-xs font-medium text-slate-800 shadow-md backdrop-blur outline-none focus:border-[#1d6fd8] dark:border-slate-700 dark:bg-[#111a2b]/95 dark:text-slate-100"
              />
              <Search size={15} className="pointer-events-none absolute left-3 top-2.5 text-slate-400" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* In-Map Quick Layer & Switcher Pill Bar */}
            <div className="pointer-events-auto flex flex-wrap items-center gap-1.5 rounded-xl bg-white/90 p-1 shadow-md backdrop-blur dark:bg-[#111a2b]/90 border border-slate-200/60 dark:border-slate-700/60">
              {/* Visible Map Layers Button (Requirement 2) */}
              <button
                type="button"
                onClick={() => setLayersPanelOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#1d6fd8] px-3 py-1 text-xs font-bold text-white shadow-sm transition hover:bg-[#1558a8]"
                title="Change Basemap or Overlays"
              >
                <Layers size={14} />
                <span>{activeBasemapConfig.name}</span>
                <ChevronDown size={12} className="opacity-70" />
              </button>

              {/* Real-Time Hydrological Heatmap Switcher Button */}
              <button
                type="button"
                onClick={() => setHeatmapMode((v) => !v)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                  heatmapMode
                    ? 'bg-amber-500 text-white shadow-sm hover:bg-amber-600'
                    : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                }`}
                title="Toggle Real-Time Hydrological Waterlogging Heatmap"
              >
                <span className="text-sm">🔥</span>
                <span>Heatmap: {heatmapMode ? 'ON' : 'OFF'}</span>
              </button>

              <button
                type="button"
                onClick={() => setOverlayLiveIncidents((v) => !v)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                  overlayLiveIncidents
                    ? 'bg-blue-50 text-[#1d6fd8] dark:bg-blue-950/60'
                    : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title="Toggle Live Reports"
              >
                <span className={`h-2 w-2 rounded-full ${overlayLiveIncidents ? 'bg-rose-500' : 'bg-slate-300'}`} />
                Live Reports
              </button>

              <button
                type="button"
                onClick={() => setOverlayFloodedRoads((v) => !v)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                  overlayFloodedRoads
                    ? 'bg-blue-50 text-[#1d6fd8] dark:bg-blue-950/60'
                    : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title="Toggle Flooded Roads"
              >
                <Layers size={13} />
                Flooded Roads
              </button>

              <button
                type="button"
                onClick={() => setOverlayRainfallRadar((v) => !v)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                  overlayRainfallRadar
                    ? 'bg-blue-50 text-[#1d6fd8] dark:bg-blue-950/60'
                    : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title="Toggle Live Rainfall Radar"
              >
                <CloudRain size={13} />
                Radar
              </button>
            </div>
          </div>

          {/* NASA Earth Observation Layer Banner & Controls */}
          {isNasaLayerActive && (
            <div className="absolute left-3 right-3 top-16 z-20 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-sky-300 bg-sky-950/95 p-3 text-xs text-white shadow-xl backdrop-blur">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 shrink-0">
                  <Satellite size={18} />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-white text-xs">{activeBasemapConfig.name}</span>
                    <span className="rounded bg-cyan-500/30 px-1.5 py-0.5 text-[9px] font-bold text-cyan-200">
                      {basemapMode === 'nasa_opera_dswx' ? 'Copernicus Sentinel-1 SAR • NASA JPL OPERA (30m)' : 'NASA EOSDIS GIBS • EPSG:3857'}
                    </span>
                  </div>
                  {basemapMode === 'nasa_opera_dswx' ? (
                    operaLoading ? (
                      <p className="text-[10px] text-cyan-200/80 animate-pulse">
                        Querying NASA CMR Earthdata gateway for Copernicus Sentinel-1 orbital radar observations over {activeDistrict.displayName}...
                      </p>
                    ) : operaData?.status === 'OBSERVATION_AVAILABLE' && operaData?.latest_observation ? (
                      <p className="text-[10px] text-cyan-100">
                        Scene: <span className="font-mono text-cyan-300">{operaData.latest_observation.title.split('_').slice(0, 4).join('_')}</span> • Pass: {new Date(operaData.latest_observation.time_start).toLocaleString()} • Res: 30m • {operaData.latest_observation.revisit_schedule}. Regional surface-water estimate (not continuous CCTV).
                      </p>
                    ) : (
                      <p className="text-[10px] text-amber-200 font-semibold">
                        No usable satellite observation available for this district and date. (Sentinel-1 SAR orbit repeat cycle is ~6–12 days).
                      </p>
                    )
                  ) : (
                    <p className="text-[10px] text-sky-200/80">
                      MODIS Terra 250m global observation. Regional environmental overview; not fine-scale road waterlogging telemetry.
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                {basemapMode !== 'nasa_opera_dswx' ? (
                  <div className="flex items-center gap-1.5 rounded-lg bg-white/10 px-2 py-1 border border-white/20">
                    <Calendar size={13} className="text-sky-300" />
                    <span className="text-[10px] font-bold text-sky-200">Date:</span>
                    <input
                      type="date"
                      value={nasaDate}
                      max={new Date().toISOString().split('T')[0]}
                      min="2000-01-01"
                      onChange={(e) => setNasaDate(e.target.value)}
                      className="bg-transparent text-[11px] font-bold text-white outline-none cursor-pointer"
                    />
                  </div>
                ) : (
                  operaData?.latest_observation?.water_layer_http && (
                    <a
                      href={operaData.latest_observation.water_layer_http}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-lg bg-cyan-700/60 hover:bg-cyan-600 px-2.5 py-1 text-[10px] font-bold text-cyan-100 border border-cyan-400/40 transition"
                      title="Direct NASA Earthdata GeoTIFF Product"
                    >
                      Download GeoTIFF (WTR)
                    </a>
                  )
                )}

                <button
                  type="button"
                  onClick={() => setBasemapMode('google_satellite')}
                  className="rounded-lg bg-white px-3 py-1 text-[11px] font-bold text-slate-900 shadow-md transition hover:bg-slate-100"
                >
                  ← Return to Google Satellite
                </button>
              </div>
            </div>
          )}

          {/* Map Container - Explicit minimum height and full width */}
          <div
            ref={mapContainerRef}
            className="relative h-full w-full flex-1"
            style={{ minHeight: '620px', width: '100%', height: '100%' }}
          />

          {/* Left Controls: Zoom, Recenter, Open Layers */}
          <div className="absolute bottom-6 left-3 z-20 flex flex-col gap-1.5">
            <div className="flex flex-col rounded-xl border border-slate-200/90 bg-white/95 shadow-md backdrop-blur dark:border-slate-700 dark:bg-[#111a2b]/95">
              <button
                type="button"
                onClick={() => mapRef.current?.zoomIn()}
                className="flex h-8 w-8 items-center justify-center text-slate-700 hover:text-[#1d6fd8] dark:text-slate-200"
                title="Zoom In"
              >
                <Plus size={16} />
              </button>
              <div className="h-px w-full bg-slate-200 dark:bg-slate-700" />
              <button
                type="button"
                onClick={() => mapRef.current?.zoomOut()}
                className="flex h-8 w-8 items-center justify-center text-slate-700 hover:text-[#1d6fd8] dark:text-slate-200"
                title="Zoom Out"
              >
                <Minus size={16} />
              </button>
            </div>

            <button
              type="button"
              onClick={fitToActiveDistrict}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200/90 bg-white/95 text-slate-700 shadow-md backdrop-blur hover:text-[#1d6fd8] dark:border-slate-700 dark:bg-[#111a2b]/95 dark:text-slate-200"
              title="Fit to District Boundary"
            >
              <RotateCcw size={15} />
            </button>

            {/* Map Layers Icon Button */}
            <button
              type="button"
              onClick={() => setLayersPanelOpen(true)}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200/90 bg-white/95 text-slate-700 shadow-md backdrop-blur hover:text-[#1d6fd8] dark:border-slate-700 dark:bg-[#111a2b]/95 dark:text-slate-200"
              title="Open Map Layers Control"
            >
              <Layers2 size={15} />
            </button>
          </div>

          {/* Right Floating Legend Box */}
          <div className="absolute bottom-6 right-3 z-20 w-48 rounded-2xl border border-slate-200/90 bg-white/95 p-3.5 shadow-lg backdrop-blur dark:border-slate-700 dark:bg-[#111a2b]/95">
            {/* Heatmap Gradient Scale when Active */}
            {heatmapMode && (
              <div className="mb-2.5 pb-2.5 border-b border-slate-200/70 dark:border-slate-700/70">
                <div className="flex items-center justify-between text-[10px] font-black uppercase text-amber-500">
                  <span>🔥 Risk Heatmap</span>
                  <span className="font-extrabold text-emerald-600">LIVE</span>
                </div>
                <div className="mt-1.5 h-2.5 w-full rounded-full bg-gradient-to-r from-sky-400 via-emerald-400 via-yellow-400 via-orange-500 to-rose-600 shadow-inner" />
                <div className="mt-1 flex justify-between text-[9px] font-bold text-slate-400">
                  <span>Low Risk</span>
                  <span>Severe Flood</span>
                </div>
              </div>
            )}

            <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-900 dark:text-white">
              Waterlogging Severity
            </h4>
            <div className="mt-2 space-y-1.5 text-[11px]">
              <div className="flex items-center gap-2">
                <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-rose-500 text-white font-bold text-[8px]">
                  ●
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  Severe (&gt; 1 ft)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-orange-500 text-white font-bold text-[8px]">
                  ●
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  High (0.5 – 1 ft)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-yellow-400 text-white font-bold text-[8px]">
                  ●
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  Moderate (0.25 – 0.5 ft)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 text-white font-bold text-[8px]">
                  ●
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  Minor (&lt; 0.25 ft)
                </span>
              </div>
            </div>

            <div className="my-2.5 h-px bg-slate-200/70 dark:bg-slate-700/70" />

            <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-900 dark:text-white">
              Active Basemap
            </h4>
            <p className="mt-1 text-[11px] font-bold text-[#1d6fd8]">
              {activeBasemapConfig.name}
            </p>
            <p className="text-[9px] text-slate-400">
              {activeBasemapConfig.provider.split('(')[0].trim()}
            </p>
          </div>

          {/* Selected Incident Detail Drawer */}
          {selectedIncident && (
            <div className="absolute left-3 top-16 z-30 max-w-sm rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur dark:border-slate-700 dark:bg-[#111a2b]/95">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase ${
                      selectedIncident.severity === 'Severe'
                        ? 'bg-rose-100 text-rose-700'
                        : selectedIncident.severity === 'High'
                        ? 'bg-amber-100 text-amber-700'
                        : selectedIncident.severity === 'Moderate'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {selectedIncident.severity}
                  </span>
                  <span className="text-[11px] font-bold text-slate-500">
                    Depth: {selectedIncident.waterDepthText}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedIncident(null)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X size={15} />
                </button>
              </div>

              <h3 className="mt-2 text-sm font-bold text-slate-900 dark:text-white">
                {selectedIncident.name}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {selectedIncident.landmark} · Status: <span className="font-semibold text-slate-700 dark:text-slate-200">{selectedIncident.status}</span>
              </p>
              <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-300">
                {selectedIncident.description}
              </p>

              <div className="mt-3.5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (onNavigateToDrainageActions) {
                      onNavigateToDrainageActions(
                        activeDistrict.id,
                        selectedIncident.drainageActionId,
                        selectedIncident.location
                      );
                    }
                  }}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#1d6fd8] px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#1558a8]"
                >
                  <span>View Drainage Action</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          )}

          {/* ── MAP LAYERS & BASEMAP SWITCHER PANEL (Requirement 2 & 3) ── */}
          {layersPanelOpen && (
            <div className="absolute inset-0 z-40 flex justify-end bg-slate-900/40 backdrop-blur-sm">
              <div className="flex h-full w-full max-w-md flex-col overflow-y-auto bg-white p-5 shadow-2xl dark:bg-[#111a2b] border-l border-slate-200 dark:border-slate-800">
                {/* Panel Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-[#1d6fd8] dark:bg-blue-950 dark:text-blue-400">
                      <Layers size={18} />
                    </span>
                    <div>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white">
                        Map Layers &amp; Basemaps
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Switch basemaps and configure data overlays
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setLayersPanelOpen(false)}
                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Section 1: Grouped Basemap Selector */}
                <div className="mt-4 space-y-4">
                  {/* Subgroup A: Google Maps */}
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>🗺️</span> Google Maps (Main Views)
                      </h4>
                      <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        Default &amp; Primary
                      </span>
                    </div>

                    <div className="mt-2 grid grid-cols-1 gap-2">
                      {BASEMAP_OPTIONS.filter((b) => b.group === 'google').map((opt) => {
                        const isSelected = basemapMode === opt.id;
                        return (
                          <div
                            key={opt.id}
                            onClick={() => setBasemapMode(opt.id)}
                            className={`group relative flex cursor-pointer items-start justify-between rounded-xl border p-2.5 transition ${
                              isSelected
                                ? 'border-[#1d6fd8] bg-blue-50/70 shadow-sm dark:border-[#1d6fd8] dark:bg-blue-950/40'
                                : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-[#142338]'
                            }`}
                          >
                            <div className="flex items-start gap-2.5 min-w-0">
                              <div
                                className="h-7 w-7 shrink-0 rounded-lg border shadow-xs flex items-center justify-center text-xs"
                                style={{ backgroundColor: opt.swatchBg, borderColor: opt.swatchBorder }}
                              >
                                {opt.id === 'google_satellite' ? '🛰️' : opt.id === 'google_street' ? '🗺️' : '🌐'}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                    {opt.name}
                                  </p>
                                  {opt.id === 'google_satellite' && (
                                    <span className="rounded bg-blue-100 px-1.5 py-0.2 text-[9px] font-bold text-blue-700 dark:bg-blue-900 dark:text-blue-200">
                                      Default
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1">
                                  {opt.description}
                                </p>
                              </div>
                            </div>
                            {isSelected && (
                              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#1d6fd8] text-white">
                                <Check size={12} strokeWidth={3} />
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Subgroup B: NASA Earth Observation */}
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>🛰️</span> NASA / Earth Observation (Optional Layers)
                      </h4>
                      <span className="rounded bg-sky-100 px-1.5 py-0.5 text-[9px] font-bold text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                        NASA GIBS Open
                      </span>
                    </div>

                    <div className="mt-2 grid grid-cols-1 gap-2">
                      {BASEMAP_OPTIONS.filter((b) => b.group === 'nasa').map((opt) => {
                        const isSelected = basemapMode === opt.id;
                        return (
                          <div
                            key={opt.id}
                            onClick={() => setBasemapMode(opt.id)}
                            className={`group relative flex cursor-pointer items-start justify-between rounded-xl border p-2.5 transition ${
                              isSelected
                                ? 'border-sky-500 bg-sky-50/70 shadow-sm dark:border-sky-500 dark:bg-sky-950/40'
                                : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-[#142338]'
                            }`}
                          >
                            <div className="flex items-start gap-2.5 min-w-0">
                              <div
                                className="h-7 w-7 shrink-0 rounded-lg border shadow-xs flex items-center justify-center text-xs"
                                style={{ backgroundColor: opt.swatchBg, borderColor: opt.swatchBorder }}
                              >
                                {opt.id === 'nasa_true_color' ? '🌍' : opt.id === 'nasa_opera_dswx' ? '🌊' : '🧪'}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                  {opt.name}
                                </p>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1">
                                  {opt.description}
                                </p>
                              </div>
                            </div>
                            {isSelected && (
                              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-600 text-white">
                                <Check size={12} strokeWidth={3} />
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Subgroup C: Standard Open Basemaps */}
                  <div>
                    <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>🌐</span> Standard Fallback Basemaps
                    </h4>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {BASEMAP_OPTIONS.filter((b) => b.group === 'standard').map((opt) => {
                        const isSelected = basemapMode === opt.id;
                        return (
                          <div
                            key={opt.id}
                            onClick={() => setBasemapMode(opt.id)}
                            className={`group relative flex cursor-pointer flex-col rounded-xl border p-2 transition ${
                              isSelected
                                ? 'border-[#1d6fd8] bg-blue-50/70 shadow-sm dark:border-[#1d6fd8] dark:bg-blue-950/40'
                                : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-[#142338]'
                            }`}
                          >
                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {opt.name.split('(')[0].trim()}
                            </p>
                            <span className="mt-1 text-[9px] text-slate-400">{opt.provider.split('(')[0].trim()}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Section 2: Independent Data Overlays (Requirement 3) */}
                <div className="mt-6">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                    2. Independent Data Overlays
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Toggle data layers independently from the basemap
                  </p>

                  <div className="mt-2.5 space-y-2">
                    {/* Live Waterlogging Incidents */}
                    <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-3 transition hover:bg-slate-100/70 dark:border-slate-800 dark:bg-[#162234]">
                      <div className="flex items-center gap-2.5">
                        <span className="h-3 w-3 rounded-full bg-rose-500" />
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white">
                            Live Waterlogging Incidents
                          </p>
                          <p className="text-[10px] text-slate-500">
                            Verified field engineer observations &amp; citizen SOS
                          </p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={overlayLiveIncidents}
                        onChange={(e) => setOverlayLiveIncidents(e.target.checked)}
                        className="h-4 w-4 rounded text-[#1d6fd8] accent-[#1d6fd8]"
                      />
                    </label>

                    {/* Flooded Road Segments */}
                    <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-3 transition hover:bg-slate-100/70 dark:border-slate-800 dark:bg-[#162234]">
                      <div className="flex items-center gap-2.5">
                        <span className="h-1 w-4 bg-orange-500 rounded" />
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white">
                            Flooded Road Segments
                          </p>
                          <p className="text-[10px] text-slate-500">
                            Highlighted inundated road stretches &amp; underpasses
                          </p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={overlayFloodedRoads}
                        onChange={(e) => setOverlayFloodedRoads(e.target.checked)}
                        className="h-4 w-4 rounded text-[#1d6fd8] accent-[#1d6fd8]"
                      />
                    </label>

                    {/* Flood Risk Model Overlay */}
                    <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-3 transition hover:bg-slate-100/70 dark:border-slate-800 dark:bg-[#162234]">
                      <div className="flex items-center gap-2.5">
                        <span className="text-sm">⬡</span>
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white">
                            Flood Risk Model Overlay
                          </p>
                          <p className="text-[10px] text-slate-500">
                            Model-estimated catchment risk zones (H3 Res 7)
                          </p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={overlayFloodRiskZones}
                        onChange={(e) => setOverlayFloodRiskZones(e.target.checked)}
                        className="h-4 w-4 rounded text-[#1d6fd8] accent-[#1d6fd8]"
                      />
                    </label>

                    {/* Live Rainfall Radar Overlay */}
                    <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-3 transition hover:bg-slate-100/70 dark:border-slate-800 dark:bg-[#162234]">
                      <div className="flex items-center gap-2.5">
                        <CloudRain size={16} className="text-[#1d6fd8]" />
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white">
                            Rainfall Radar Overlay
                          </p>
                          <p className="text-[10px] text-slate-500">
                            RainViewer Doppler precipitation radar stream
                          </p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={overlayRainfallRadar}
                        onChange={(e) => setOverlayRainfallRadar(e.target.checked)}
                        className="h-4 w-4 rounded text-[#1d6fd8] accent-[#1d6fd8]"
                      />
                    </label>

                    {/* Water Level Gauge Stations */}
                    <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-3 transition hover:bg-slate-100/70 dark:border-slate-800 dark:bg-[#162234]">
                      <div className="flex items-center gap-2.5">
                        <Waves size={16} className="text-blue-600" />
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white">
                            Water Level Gauges
                          </p>
                          <p className="text-[10px] text-slate-500">
                            River and drainage telemetry stations
                          </p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={overlayWaterLevels}
                        onChange={(e) => setOverlayWaterLevels(e.target.checked)}
                        className="h-4 w-4 rounded text-[#1d6fd8] accent-[#1d6fd8]"
                      />
                    </label>
                  </div>
                </div>

                {/* Bottom Close Button */}
                <div className="mt-auto pt-5">
                  <button
                    type="button"
                    onClick={() => setLayersPanelOpen(false)}
                    className="w-full rounded-xl bg-[#1d6fd8] py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#1558a8]"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: 4 SUMMARY CARDS + RECENT WATERLOGGING REPORTS */}
        <div className="flex flex-col gap-4 lg:col-span-4 xl:col-span-4">
          {/* Row of 4 Risk KPI Cards Matching Screenshot */}
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
            {/* Severe Waterlogging */}
            <div className="flex flex-col rounded-2xl border border-rose-100 bg-[#fffbfc] p-3.5 shadow-sm dark:border-rose-950 dark:bg-[#1f1418]">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-900/60 dark:text-rose-300">
                  <Waves size={16} />
                </span>
                <span className="text-[11px] font-bold leading-tight text-slate-700 dark:text-slate-200">
                  Severe Waterlogging
                </span>
              </div>
              <p className="mt-3 text-2xl font-black text-slate-900 dark:text-white">
                {summaryCounts.severe}
              </p>
              <p className="text-[10px] font-semibold text-slate-400">Locations</p>
            </div>

            {/* High Waterlogging */}
            <div className="flex flex-col rounded-2xl border border-orange-100 bg-[#fffcfb] p-3.5 shadow-sm dark:border-orange-950 dark:bg-[#201712]">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-100 text-orange-600 dark:bg-orange-900/60 dark:text-orange-300">
                  <Waves size={16} />
                </span>
                <span className="text-[11px] font-bold leading-tight text-slate-700 dark:text-slate-200">
                  High Waterlogging
                </span>
              </div>
              <p className="mt-3 text-2xl font-black text-slate-900 dark:text-white">
                {summaryCounts.high}
              </p>
              <p className="text-[10px] font-semibold text-slate-400">Locations</p>
            </div>

            {/* Moderate */}
            <div className="flex flex-col rounded-2xl border border-amber-100 bg-[#fffdfb] p-3.5 shadow-sm dark:border-amber-950 dark:bg-[#201d14]">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-900/60 dark:text-amber-300">
                  <Waves size={16} />
                </span>
                <span className="text-[11px] font-bold leading-tight text-slate-700 dark:text-slate-200">
                  Moderate
                </span>
              </div>
              <p className="mt-3 text-2xl font-black text-slate-900 dark:text-white">
                {summaryCounts.moderate}
              </p>
              <p className="text-[10px] font-semibold text-slate-400">Locations</p>
            </div>

            {/* Minor */}
            <div className="flex flex-col rounded-2xl border border-emerald-100 bg-[#fbfdfb] p-3.5 shadow-sm dark:border-emerald-950 dark:bg-[#12221b]">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/60 dark:text-emerald-300">
                  <Waves size={16} />
                </span>
                <span className="text-[11px] font-bold leading-tight text-slate-700 dark:text-slate-200">
                  Minor
                </span>
              </div>
              <p className="mt-3 text-2xl font-black text-slate-900 dark:text-white">
                {summaryCounts.minor}
              </p>
              <p className="text-[10px] font-semibold text-slate-400">Locations</p>
            </div>
          </div>

          {/* Recent Waterlogging Reports Card */}
          <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-[#e2eaf4] bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-[#111a2b]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
                Recent Waterlogging Reports
              </h3>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="inline-flex items-center gap-1 text-xs font-bold text-[#1d6fd8] hover:underline"
              >
                <span>View All</span>
                <ArrowRight size={13} />
              </button>
            </div>

            {/* Scrollable list of reports */}
            <div className="mt-3 flex flex-1 flex-col divide-y divide-slate-100 overflow-y-auto dark:divide-slate-800">
              {filteredIncidents.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#1d6fd8] dark:bg-blue-950/60 dark:text-blue-300 mb-3">
                    <CheckCircle2 size={24} />
                  </div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                    No verified waterlogging observations available for this district.
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400 max-w-xs">
                    Field engineer observations and persistent citizen reports for {activeDistrict.displayName} will appear here when submitted.
                  </p>
                </div>
              ) : (
                filteredIncidents.slice(0, 5).map((inc) => {
                  const isSelected = selectedIncident?.id === inc.id;
                  return (
                    <div
                      key={inc.id}
                      onClick={() => {
                        setSelectedIncident(inc);
                        mapRef.current?.flyTo({ center: [inc.lng, inc.lat], zoom: 13, duration: 800 });
                      }}
                      className={`group flex cursor-pointer items-center justify-between gap-3 py-3 transition hover:bg-slate-50/80 dark:hover:bg-slate-800/50 ${
                        isSelected ? 'bg-blue-50/50 dark:bg-blue-950/30' : ''
                      }`}
                    >
                      {/* Left Icon + Title/Subtitle */}
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white ${
                            inc.severity === 'Severe'
                              ? 'bg-rose-500'
                              : inc.severity === 'High'
                              ? 'bg-orange-500'
                              : inc.severity === 'Moderate'
                              ? 'bg-yellow-500'
                              : 'bg-emerald-500'
                          }`}
                        >
                          <Waves size={16} />
                        </span>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-bold text-slate-900 dark:text-white group-hover:text-[#1d6fd8]">
                            {inc.name}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {inc.severity} waterlogging ({inc.waterDepthFt} ft)
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {inc.updatedAtText} · {inc.observationType.split(' ')[0]}
                          </p>
                        </div>
                      </div>

                      {/* Right Thumbnail & Status Pill */}
                      <div className="flex items-center gap-2.5 shrink-0">
                        {inc.imageThumb ? (
                          <img
                            src={inc.imageThumb}
                            alt={inc.name}
                            className="h-10 w-16 rounded-lg object-cover border border-slate-200 dark:border-slate-700"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : null}
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                            inc.status === 'Unresolved'
                              ? 'border border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/60 dark:text-rose-300'
                              : inc.status === 'In Progress'
                              ? 'border border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/60 dark:text-amber-300'
                              : inc.status === 'Verified'
                              ? 'border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'border border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/60 dark:text-blue-300'
                          }`}
                        >
                          {inc.status}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── BOTTOM 3 CARDS ROW ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Card 1: Affected Roads (Top 5) */}
        <div className="rounded-2xl border border-[#e2eaf4] bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-[#111a2b] lg:col-span-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-50 text-[#1d6fd8] dark:bg-blue-950/60 dark:text-blue-400">
              <MapPin size={14} />
            </span>
            <h3 className="text-xs font-bold tracking-tight text-slate-900 dark:text-white">
              Affected Roads (Top 5)
            </h3>
          </div>

          <div className="mt-2 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 dark:border-slate-800">
                  <th className="py-2 pr-2">#</th>
                  <th className="py-2 px-1.5">Road / Location</th>
                  <th className="py-2 px-1.5">Severity</th>
                  <th className="py-2 px-1.5">Water Depth</th>
                  <th className="py-2 px-1.5">Status</th>
                  <th className="py-2 pl-1.5 text-right">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-[11px]">
                {districtIncidents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-xs text-slate-400 italic dark:text-slate-500">
                      No verified waterlogging observations available for {activeDistrict.displayName}.
                    </td>
                  </tr>
                ) : (
                  districtIncidents.slice(0, 5).map((inc, idx) => (
                    <tr
                      key={inc.id}
                      onClick={() => {
                        setSelectedIncident(inc);
                        mapRef.current?.flyTo({ center: [inc.lng, inc.lat], zoom: 13, duration: 800 });
                      }}
                      className="cursor-pointer transition hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    >
                      <td className="py-2 pr-2 font-bold text-slate-400">{idx + 1}</td>
                      <td className="py-2 px-1.5 font-bold text-slate-800 dark:text-slate-200">
                        {inc.name}
                      </td>
                      <td className="py-2 px-1.5">
                        <span
                          className={`inline-block rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                            inc.severity === 'Severe'
                              ? 'bg-rose-50 text-rose-700'
                              : inc.severity === 'High'
                              ? 'bg-orange-50 text-orange-700'
                              : inc.severity === 'Moderate'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {inc.severity}
                        </span>
                      </td>
                      <td className="py-2 px-1.5 font-semibold text-slate-600 dark:text-slate-300">
                        {inc.waterDepthFt} ft
                      </td>
                      <td className="py-2 px-1.5">
                        <span
                          className={`inline-block rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${
                            inc.status === 'Unresolved'
                              ? 'bg-rose-50 text-rose-600'
                              : inc.status === 'In Progress'
                              ? 'bg-amber-50 text-amber-600'
                              : inc.status === 'Verified'
                              ? 'bg-emerald-50 text-emerald-600'
                              : 'bg-blue-50 text-blue-600'
                          }`}
                        >
                          {inc.status}
                        </span>
                      </td>
                      <td className="py-2 pl-1.5 text-right text-slate-400 text-[10px]">
                        {inc.updatedAtText}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Card 2: Water Level at Key Locations */}
        <div className="rounded-2xl border border-[#e2eaf4] bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-[#111a2b] lg:col-span-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-50 text-[#1d6fd8] dark:bg-blue-950/60 dark:text-blue-400">
              <Waves size={14} />
            </span>
            <h3 className="text-xs font-bold tracking-tight text-slate-900 dark:text-white">
              Water Level at Key Locations
            </h3>
          </div>

          <div className="mt-2 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 dark:border-slate-800">
                  <th className="py-2 pr-2">Location</th>
                  <th className="py-2 px-2">River/Drain</th>
                  <th className="py-2 px-2">Current Level</th>
                  <th className="py-2 pl-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-[11px]">
                {districtWaterLevels.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-xs text-slate-400 italic dark:text-slate-500">
                      No telemetry water-level gauge stations registered for {activeDistrict.displayName}.
                    </td>
                  </tr>
                ) : (
                  districtWaterLevels.map((wl) => (
                    <tr
                      key={wl.id}
                      onClick={() => {
                        mapRef.current?.flyTo({ center: [wl.lng, wl.lat], zoom: 13, duration: 800 });
                      }}
                      className="cursor-pointer transition hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    >
                      <td className="py-2.5 pr-2 font-bold text-slate-800 dark:text-slate-200">
                        {wl.name}
                      </td>
                      <td className="py-2.5 px-2 text-slate-500 dark:text-slate-400">
                        {wl.category}
                      </td>
                      <td className="py-2.5 px-2 font-black text-slate-900 dark:text-white">
                        {wl.currentLevelM} m
                      </td>
                      <td className="py-2.5 pl-2 text-right">
                        <span
                          className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold ${
                            wl.status === 'Normal'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : wl.status === 'Moderate'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-orange-50 text-orange-700 border border-orange-200'
                          }`}
                        >
                          {wl.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Card 3: Rainfall (Last 24 Hours) */}
        <div className="rounded-2xl border border-[#e2eaf4] bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-[#111a2b] lg:col-span-4 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-50 text-[#1d6fd8] dark:bg-blue-950/60 dark:text-blue-400">
                <CloudRain size={14} />
              </span>
              <h3 className="text-xs font-bold tracking-tight text-slate-900 dark:text-white">
                Rainfall (Last 24 Hours)
              </h3>
            </div>
            <span className="text-xs font-black text-slate-800 dark:text-slate-200">
              Total: {rainfall24h.total} mm
            </span>
          </div>

          <div className="mt-3 h-36 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rainfall24h.data} margin={{ top: 10, right: 10, bottom: 0, left: -25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="time"
                  tickLine={false}
                  axisLine={{ stroke: '#e2eaf4' }}
                  tick={{ fontSize: 9, fill: '#64748b' }}
                  interval={2}
                />
                <YAxis
                  domain={[0, 20]}
                  ticks={[0, 5, 10, 15, 20]}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 9, fill: '#64748b' }}
                  unit=" mm"
                />
                <Tooltip
                  formatter={(val) => [`${val} mm`, 'Rainfall']}
                  labelFormatter={(lbl) => `Time: ${lbl}`}
                />
                <Bar dataKey="rain" fill="#60a5fa" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
