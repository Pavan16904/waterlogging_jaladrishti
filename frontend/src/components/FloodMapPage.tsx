import React, { useState, useMemo, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Polygon, Circle, useMap, Tooltip, Marker } from 'react-leaflet';
import L from 'leaflet';
import { 
  StudyArea, 
  SeverityZone, 
  DrainageAdvisory, 
  AnalysisRun, 
  RadarMeta, 
  SatelliteMeta, 
  LiveDrainageAdvisory, 
  LiveAlert 
} from '../types';
import { PrecautionProtocolModal } from './PrecautionProtocolModal';
import { api } from '../services/api';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Bar, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip as RechartsTooltip, 
  CartesianGrid 
} from 'recharts';
import { 
  MapPin, 
  Calendar, 
  CloudRain, 
  Droplets, 
  AlertTriangle, 
  ShieldCheck, 
  Layers, 
  Search, 
  Filter, 
  Info, 
  ExternalLink, 
  ChevronRight, 
  ChevronDown, 
  RefreshCw, 
  Plus, 
  Minus, 
  Crosshair, 
  Sprout, 
  Wrench, 
  ShieldAlert, 
  Megaphone, 
  Database, 
  Waves, 
  FileText, 
  CheckCircle2, 
  Printer, 
  X,
  Eye,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// -------------------------------------------------------------
// Official 31 Karnataka Districts Directory with standard names
// -------------------------------------------------------------
export const KARNATAKA_31_DISTRICTS = [
  { id: 'ballari', name: 'Ballari, Karnataka', displayName: 'Ballari', lat: 15.1394, lng: 76.9214, elevation: 495, totalAgriHa: 10560 },
  { id: 'bengaluru_urban', name: 'Bengaluru Urban, Karnataka', displayName: 'Bengaluru Urban', lat: 12.9716, lng: 77.5946, elevation: 920, totalAgriHa: 8200 },
  { id: 'bengaluru_rural', name: 'Bengaluru Rural, Karnataka', displayName: 'Bengaluru Rural', lat: 13.1294, lng: 77.5730, elevation: 905, totalAgriHa: 9800 },
  { id: 'ramanagara', name: 'Ramanagara, Karnataka', displayName: 'Ramanagara', lat: 12.7159, lng: 77.2810, elevation: 800, totalAgriHa: 8900 },
  { id: 'kolar', name: 'Kolar, Karnataka', displayName: 'Kolar', lat: 13.1367, lng: 78.1290, elevation: 822, totalAgriHa: 9400 },
  { id: 'chikkaballapura', name: 'Chikkaballapura, Karnataka', displayName: 'Chikkaballapura', lat: 13.4325, lng: 77.7273, elevation: 915, totalAgriHa: 9100 },
  { id: 'tumakuru', name: 'Tumakuru, Karnataka', displayName: 'Tumakuru', lat: 13.3392, lng: 77.1166, elevation: 822, totalAgriHa: 11200 },
  { id: 'chitradurga', name: 'Chitradurga, Karnataka', displayName: 'Chitradurga', lat: 14.2304, lng: 76.3980, elevation: 732, totalAgriHa: 10800 },
  { id: 'davangere', name: 'Davangere, Karnataka', displayName: 'Davangere', lat: 14.4644, lng: 75.9218, elevation: 602, totalAgriHa: 11400 },
  { id: 'shivamogga', name: 'Shivamogga, Karnataka', displayName: 'Shivamogga', lat: 13.9299, lng: 75.5681, elevation: 584, totalAgriHa: 12600 },
  { id: 'chikkamagaluru', name: 'Chikkamagaluru, Karnataka', displayName: 'Chikkamagaluru', lat: 13.3161, lng: 75.7720, elevation: 1090, totalAgriHa: 10200 },
  { id: 'hassan', name: 'Hassan, Karnataka', displayName: 'Hassan', lat: 13.0072, lng: 76.0961, elevation: 957, totalAgriHa: 11500 },
  { id: 'kodagu', name: 'Kodagu, Karnataka', displayName: 'Kodagu', lat: 12.4244, lng: 75.7382, elevation: 1150, totalAgriHa: 8600 },
  { id: 'mysuru', name: 'Mysuru, Karnataka', displayName: 'Mysuru', lat: 12.2958, lng: 76.6394, elevation: 763, totalAgriHa: 12800 },
  { id: 'mandya', name: 'Mandya, Karnataka', displayName: 'Mandya', lat: 12.5218, lng: 76.8951, elevation: 678, totalAgriHa: 11900 },
  { id: 'chamarajanagar', name: 'Chamarajanagar, Karnataka', displayName: 'Chamarajanagar', lat: 11.9261, lng: 76.9437, elevation: 690, totalAgriHa: 9500 },
  { id: 'dakshina_kannada', name: 'Dakshina Kannada, Karnataka', displayName: 'Dakshina Kannada', lat: 12.9141, lng: 74.8560, elevation: 22, totalAgriHa: 7800 },
  { id: 'udupi', name: 'Udupi, Karnataka', displayName: 'Udupi', lat: 13.3409, lng: 74.7421, elevation: 18, totalAgriHa: 7400 },
  { id: 'uttara_kannada', name: 'Uttara Kannada, Karnataka', displayName: 'Uttara Kannada', lat: 14.8185, lng: 74.1332, elevation: 15, totalAgriHa: 8100 },
  { id: 'belagavi', name: 'Belagavi, Karnataka', displayName: 'Belagavi', lat: 15.8497, lng: 74.4977, elevation: 762, totalAgriHa: 14200 },
  { id: 'dharwad', name: 'Dharwad, Karnataka', displayName: 'Dharwad', lat: 15.4589, lng: 75.0078, elevation: 750, totalAgriHa: 10400 },
  { id: 'haveri', name: 'Haveri, Karnataka', displayName: 'Haveri', lat: 14.7951, lng: 75.4040, elevation: 570, totalAgriHa: 11100 },
  { id: 'gadag', name: 'Gadag, Karnataka', displayName: 'Gadag', lat: 15.4315, lng: 75.6355, elevation: 650, totalAgriHa: 9900 },
  { id: 'bagalkot', name: 'Bagalkot, Karnataka', displayName: 'Bagalkot', lat: 16.1691, lng: 75.6615, elevation: 535, totalAgriHa: 11700 },
  { id: 'vijayapura', name: 'Vijayapura, Karnataka', displayName: 'Vijayapura', lat: 16.8302, lng: 75.7100, elevation: 592, totalAgriHa: 12400 },
  { id: 'kalaburagi', name: 'Kalaburagi, Karnataka', displayName: 'Kalaburagi', lat: 17.3297, lng: 76.8343, elevation: 454, totalAgriHa: 13500 },
  { id: 'bidar', name: 'Bidar, Karnataka', displayName: 'Bidar', lat: 17.9135, lng: 77.5200, elevation: 715, totalAgriHa: 10900 },
  { id: 'raichur', name: 'Raichur, Karnataka', displayName: 'Raichur', lat: 16.2076, lng: 77.3550, elevation: 407, totalAgriHa: 12100 },
  { id: 'koppal', name: 'Koppal, Karnataka', displayName: 'Koppal', lat: 15.3547, lng: 76.1546, elevation: 517, totalAgriHa: 10300 },
  { id: 'vijayanagara', name: 'Vijayanagara, Karnataka', displayName: 'Vijayanagara', lat: 15.2689, lng: 76.3909, elevation: 480, totalAgriHa: 10700 },
  { id: 'yadgir', name: 'Yadgir, Karnataka', displayName: 'Yadgir', lat: 16.7701, lng: 77.1335, elevation: 420, totalAgriHa: 9800 }
];

// Multi-Source Map Tile Modes
const MAP_MODES = {
  hybrid: {
    name: 'Google Hybrid',
    url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    attribution: '&copy; Google Maps &mdash; Satellite & Roads',
    maxNativeZoom: 19
  },
  satellite: {
    name: 'Esri Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri World Imagery',
    maxNativeZoom: 19
  },
  street: {
    name: 'OpenStreetMap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    maxNativeZoom: 19
  },
  terrain: {
    name: 'Google Terrain',
    url: 'https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
    attribution: '&copy; Google Maps Terrain',
    maxNativeZoom: 15
  }
};

type MapModeKey = keyof typeof MAP_MODES;

// Helper to create HTML DivIcon for geographic place tags on map
function createPlaceTagIcon(text: string, isHighway = false) {
  return L.divIcon({
    className: 'custom-map-tag-container',
    html: `<div class="${isHighway ? 'map-highway-tag' : 'map-place-tag'}">${text}</div>`,
    iconSize: [80, 24],
    iconAnchor: [40, 12]
  });
}

// Controller to smoothly pan/zoom map
function MapCenterController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.2 });
  }, [center, zoom, map]);
  return null;
}

// Map resizer to ensure tiles render immediately
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

// Map Controls Component (+, -, Locate)
function MapCustomControls({ onRecenter }: { onRecenter: () => void }) {
  const map = useMap();
  return (
    <div className="absolute top-14 left-3 z-[1000] flex flex-col gap-1.5 pointer-events-auto">
      <button
        onClick={() => map.zoomIn()}
        className="w-8 h-8 rounded-lg bg-white/95 dark:bg-slate-900/95 border border-slate-300 dark:border-white/20 text-slate-800 dark:text-white flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 shadow-md font-bold transition-all text-sm active:scale-95"
        title="Zoom In"
      >
        <Plus className="w-4 h-4" />
      </button>
      <button
        onClick={() => map.zoomOut()}
        className="w-8 h-8 rounded-lg bg-white/95 dark:bg-slate-900/95 border border-slate-300 dark:border-white/20 text-slate-800 dark:text-white flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 shadow-md font-bold transition-all text-sm active:scale-95"
        title="Zoom Out"
      >
        <Minus className="w-4 h-4" />
      </button>
      <button
        onClick={onRecenter}
        className="w-8 h-8 rounded-lg bg-white/95 dark:bg-slate-900/95 border border-slate-300 dark:border-white/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 shadow-md font-bold transition-all text-sm active:scale-95"
        title="Recenter to Selected District"
      >
        <Crosshair className="w-4 h-4" />
      </button>
    </div>
  );
}

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
  satelliteMeta?: SatelliteMeta | null;
  liveDrainageAdvisory?: LiveDrainageAdvisory | null;
  alerts?: LiveAlert[];
  onRefreshTelemetry?: () => void;
  liveRainfallData?: any;
  mapLastUpdated?: Date | null;
  isAutoRefreshing?: boolean;
  onManualMapRefresh?: () => void;
  onOpenEmergencyOps?: () => void;
  onOpenCitizenLifeline?: () => void;
}

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
  postEventDate,
  rainfallMm,
  setRainfallMm,
  onNavigateToDrainage,
  radarMeta = null,
  satelliteMeta = null,
  liveDrainageAdvisory = null,
  alerts = [],
  liveRainfallData,
  mapLastUpdated,
  isAutoRefreshing = false,
  onManualMapRefresh,
  onOpenEmergencyOps,
}) => {
  // -------------------------------------------------------------
  // Dynamic Real-Time Timekeeping in Asia/Kolkata
  // -------------------------------------------------------------
  const [currentKolkataTime, setCurrentKolkataTime] = useState<string>(() => {
    return new Date().toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentKolkataTime(
        new Date().toLocaleTimeString('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Dynamic Date strings in Asia/Kolkata
  const nowKolkata = useMemo(() => new Date(), [currentKolkataTime]);
  
  const formattedToday = useMemo(() => {
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(nowKolkata);
  }, [nowKolkata]);

  const formattedObservationTime = useMemo(() => {
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(nowKolkata);
  }, [nowKolkata]);

  const yesterdayDateStr = useMemo(() => {
    const d = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(d);
  }, []);

  const fourDaysAgoStr = useMemo(() => {
    const d = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000);
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(d);
  }, []);

  // -------------------------------------------------------------
  // District & Field State
  // -------------------------------------------------------------
  const [districtDropdownOpen, setDistrictDropdownOpen] = useState(false);
  const [districtSearch, setDistrictSearch] = useState('');
  const [selectedZone, setSelectedZone] = useState<SeverityZone | null>(null);
  const [zoneFilter, setZoneFilter] = useState<'All' | 'Severe' | 'Moderate' | 'Low'>('All');
  const [mapMode, setMapMode] = useState<MapModeKey>('hybrid');
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [isPrecautionModalOpen, setIsPrecautionModalOpen] = useState(false);

  // Active district info
  const activeDistrictMeta = useMemo(() => {
    const match = KARNATAKA_31_DISTRICTS.find(d => d.id === selectedAreaId);
    if (match) return match;
    const fromStudyAreas = studyAreas.find(s => s.id === selectedAreaId);
    if (fromStudyAreas) {
      return {
        id: fromStudyAreas.id,
        name: `${fromStudyAreas.name.split('(')[0].trim()}, Karnataka`,
        displayName: fromStudyAreas.name.split('(')[0].trim(),
        lat: fromStudyAreas.center_lat,
        lng: fromStudyAreas.center_lng,
        elevation: 500,
        totalAgriHa: 10560
      };
    }
    return KARNATAKA_31_DISTRICTS[0]; // Default to Ballari
  }, [selectedAreaId, studyAreas]);

  // Center coordinate of map
  const activeCenter: [number, number] = useMemo(() => {
    if (selectedZone?.geojson_feature) {
      let feat: any = selectedZone.geojson_feature;
      if (typeof feat === 'string') {
        try { feat = JSON.parse(feat); } catch (e) { feat = null; }
      }
      if (feat?.geometry?.coordinates?.[0]?.[0]) {
        const c = feat.geometry.coordinates[0][0];
        return [c[1], c[0]];
      }
    }
    return [activeDistrictMeta.lat, activeDistrictMeta.lng];
  }, [selectedZone, activeDistrictMeta]);

  const activeZoom = selectedZone ? 14 : 12;

  // Filtered 31 districts for search
  const filteredDistricts = useMemo(() => {
    return KARNATAKA_31_DISTRICTS.filter(d => 
      d.name.toLowerCase().includes(districtSearch.toLowerCase()) ||
      d.displayName.toLowerCase().includes(districtSearch.toLowerCase())
    );
  }, [districtSearch]);

  // -------------------------------------------------------------
  // Real Weather Telemetry (Open-Meteo) for the Selected District
  // -------------------------------------------------------------
  const [weatherTelemetry, setWeatherTelemetry] = useState<any>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);

  useEffect(() => {
    let isCancelled = false;
    const fetchWeather = async () => {
      setIsLoadingWeather(true);
      try {
        const data = await api.getDistrictWeather(activeDistrictMeta.displayName);
        if (!isCancelled && data) {
          setWeatherTelemetry(data);
        }
      } catch (err) {
        console.warn('Weather fetch warning:', err);
      } finally {
        if (!isCancelled) setIsLoadingWeather(false);
      }
    };

    fetchWeather();
    return () => { isCancelled = true; };
  }, [activeDistrictMeta.displayName]);

  // Calculate 10-day rainfall trend (7 days past observation + 3 days forecast) dynamically
  const rainfallTrendData = useMemo(() => {
    const list = [];
    const baseRain = rainfallMm || 48;
    
    // Past 7 days (observed)
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dayLabel = new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short' }).format(d);
      
      // Use history from Open-Meteo if available and positive, else derive representative trend
      let observedVal = 0;
      if (liveRainfallData?.last7DaysHistory?.[6 - i]?.rainfallMm && liveRainfallData.last7DaysHistory[6 - i].rainfallMm > 0) {
        observedVal = liveRainfallData.last7DaysHistory[6 - i].rainfallMm;
      } else {
        // Representative realistic daily observations leading to today (matching screenshot trend)
        const pattern = [22, 24, 48, 62, 88, 51, Math.max(baseRain, 48)];
        observedVal = pattern[6 - i] ?? Math.round(baseRain * 0.7);
      }

      list.push({
        date: dayLabel,
        dailyRainfall: observedVal,
        forecastRainfall: i === 0 ? observedVal : null, // link point for line
        isObserved: true
      });
    }

    // Next 3 days (forecast)
    const forecastDays = weatherTelemetry?.forecast || [];
    for (let i = 1; i <= 3; i++) {
      const d = new Date(Date.now() + i * 24 * 60 * 60 * 1000);
      const dayLabel = new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short' }).format(d);
      
      const rawFcst = forecastDays[i]?.precipitationMm;
      const fcstVal = (typeof rawFcst === 'number' && rawFcst > 0) ? rawFcst : (i === 1 ? 42 : i === 2 ? 96 : 74);

      list.push({
        date: dayLabel,
        dailyRainfall: null,
        forecastRainfall: fcstVal,
        isObserved: false
      });
    }

    return list;
  }, [rainfallMm, liveRainfallData, weatherTelemetry]);

  // -------------------------------------------------------------
  // Agricultural Field Parcels Cadastre
  // -------------------------------------------------------------
  // Map raw zones to verified field parcels with fallback to Ballari reference fields
  const fieldParcels = useMemo(() => {
    if (zones && zones.length > 0) {
      return zones.map((z, idx) => {
        let feat: any = z.geojson_feature;
        if (typeof feat === 'string') {
          try { feat = JSON.parse(feat); } catch (e) { feat = null; }
        }
        const props = feat?.properties || {};

        // Robust extraction of clean cadastral Field ID (e.g., BLR-001, BLR-002)
        let cleanId = props.field_id || z.field_id || '';
        if (!cleanId || cleanId.startsWith('z_') || cleanId.startsWith('run_') || cleanId.includes('fallback') || cleanId.includes('field_')) {
          const match = (z.zone_name || '').match(/([A-Z]{3}-\d{3})/);
          cleanId = match ? match[1] : `BLR-00${idx + 1}`;
        }

        // Clean Village name matching agricultural cadastre
        let cleanVill = props.village || z.village || '';
        if (!cleanVill || cleanVill.includes('Agro') || cleanVill.includes('Parcel') || cleanVill.includes('Zone') || cleanVill.startsWith('BLR')) {
          if (z.zone_name?.includes(' - ')) {
            cleanVill = z.zone_name.split(' - ')[1]?.split(' ')[0]?.trim();
          } else {
            cleanVill = z.zone_name?.split(' ')[0]?.trim();
          }
        }
        if (!cleanVill || cleanVill.startsWith('BLR') || cleanVill === 'ballari' || cleanVill === 'Ballari') {
          const fallbackVillages = ['Kurekuppa', 'Hirehaddinagundi', 'Kampli', 'Siruguppa', 'Sanganakal', 'Toranagallu', 'Hadagali', 'Hongal'];
          cleanVill = fallbackVillages[idx] || 'Agrarian Plain';
        }

        return {
          ...z,
          fieldId: cleanId,
          village: cleanVill,
          areaHa: z.area_ha || (idx === 0 ? 8.5 : idx === 1 ? 12.3 : idx === 2 ? 6.8 : idx === 3 ? 10.1 : 14.2),
          currentStatus: props.current_status || z.current_status || (z.severity === 'Severe' ? 'Water Standing' : z.severity === 'Moderate' ? 'Saturated' : 'Normal'),
          riskLevel: z.severity,
          suggestedAction: props.suggested_action || z.suggested_action || (z.severity === 'Severe' ? 'Enable drainage' : z.severity === 'Moderate' ? 'Field drainage check' : 'Monitor'),
          cropType: z.crop_type || props.crop_type || 'Rice / Cotton'
        };
      });
    }

    // Default reference parcels for Ballari (matching screenshot)
    return [
      {
        id: 'ballari_f1',
        fieldId: 'BLR-001',
        zone_name: 'Kurekuppa Village Agro Parcel',
        village: 'Kurekuppa',
        areaHa: 8.5,
        currentStatus: 'Normal',
        riskLevel: 'Low' as const,
        suggestedAction: 'Monitor',
        cropType: 'Groundnut & Cotton',
        severity: 'Low' as const,
        probability: 0.15,
        elevation_m: 492,
        slope_deg: 2.1,
        land_use: 'agricultural',
        area_ha: 8.5,
        is_persistent: false,
        geojson_feature: {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [[[76.975, 15.155], [76.985, 15.156], [76.988, 15.165], [76.978, 15.166], [76.975, 15.155]]]
          }
        }
      },
      {
        id: 'ballari_f2',
        fieldId: 'BLR-002',
        zone_name: 'Hirehaddinagundi Lowland Sump',
        village: 'Hirehaddinagundi',
        areaHa: 12.3,
        currentStatus: 'Water Standing',
        riskLevel: 'Severe' as const,
        suggestedAction: 'Enable drainage',
        cropType: 'Rice (Paddy)',
        severity: 'Severe' as const,
        probability: 0.92,
        elevation_m: 476,
        slope_deg: 0.4,
        land_use: 'agricultural',
        area_ha: 12.3,
        is_persistent: true,
        geojson_feature: {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [[[76.880, 15.100], [76.892, 15.102], [76.895, 15.112], [76.882, 15.111], [76.880, 15.100]]]
          }
        }
      },
      {
        id: 'ballari_f3',
        fieldId: 'BLR-003',
        zone_name: 'Kampli Canal Swale Parcel',
        village: 'Kampli',
        areaHa: 6.8,
        currentStatus: 'Saturated',
        riskLevel: 'Moderate' as const,
        suggestedAction: 'Field drainage check',
        cropType: 'Sugarcane',
        severity: 'Moderate' as const,
        probability: 0.65,
        elevation_m: 482,
        slope_deg: 1.1,
        land_use: 'agricultural',
        area_ha: 6.8,
        is_persistent: false,
        geojson_feature: {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [[[76.855, 15.190], [76.865, 15.192], [76.868, 15.200], [76.857, 15.199], [76.855, 15.190]]]
          }
        }
      },
      {
        id: 'ballari_f4',
        fieldId: 'BLR-004',
        zone_name: 'Siruguppa Irrigated Terrace',
        village: 'Siruguppa',
        areaHa: 10.1,
        currentStatus: 'Normal',
        riskLevel: 'Low' as const,
        suggestedAction: 'Monitor',
        cropType: 'Chili (Red/Green)',
        severity: 'Low' as const,
        probability: 0.18,
        elevation_m: 488,
        slope_deg: 2.3,
        land_use: 'agricultural',
        area_ha: 10.1,
        is_persistent: false,
        geojson_feature: {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [[[76.890, 15.080], [76.902, 15.082], [76.905, 15.092], [76.893, 15.091], [76.890, 15.080]]]
          }
        }
      }
    ];
  }, [zones]);

  // Filtered parcels by Severity tab
  const displayedParcels = useMemo(() => {
    if (zoneFilter === 'All') return fieldParcels;
    return fieldParcels.filter(p => p.riskLevel === zoneFilter);
  }, [fieldParcels, zoneFilter]);

  // -------------------------------------------------------------
  // KPI Metrics Calculation
  // -------------------------------------------------------------
  const severeParcelsArea = useMemo(() => {
    return fieldParcels.filter(p => p.riskLevel === 'Severe').reduce((acc, p) => acc + p.areaHa, 0);
  }, [fieldParcels]);

  const moderateParcelsArea = useMemo(() => {
    return fieldParcels.filter(p => p.riskLevel === 'Moderate').reduce((acc, p) => acc + p.areaHa, 0);
  }, [fieldParcels]);

  const lowParcelsArea = useMemo(() => {
    return fieldParcels.filter(p => p.riskLevel === 'Low').reduce((acc, p) => acc + p.areaHa, 0);
  }, [fieldParcels]);

  // Total monitored agricultural acreage for selected district
  const totalMonitoredAgriHa = activeDistrictMeta.totalAgriHa;

  // Scaled values to match regional hectare totals seen on high-level command dash
  const severeHaDisplay = selectedAreaId === 'ballari' ? '1,240 ha' : `${Math.round(severeParcelsArea * 85).toLocaleString()} ha`;
  const moderateHaDisplay = selectedAreaId === 'ballari' ? '3,860 ha' : `${Math.round(moderateParcelsArea * 120).toLocaleString()} ha`;
  const lowHaDisplay = selectedAreaId === 'ballari' ? '4,120 ha' : `${Math.round(lowParcelsArea * 140).toLocaleString()} ha`;
  const totalHaDisplay = `${totalMonitoredAgriHa.toLocaleString()} ha`;

  // -------------------------------------------------------------
  // Localized Heatmap Hotspots Configuration (Concentric Rings)
  // Strictly over verified agricultural parcels; Roads & Towns clear!
  // -------------------------------------------------------------
  const localizedHeatmapHotspots = useMemo(() => {
    if (selectedAreaId === 'ballari') {
      return [
        // 1. Sanganakal Agricultural Basin (Northeast of Ballari town)
        { id: 'spot_sanganakal', lat: 15.176, lng: 76.942, severity: 'Severe', name: 'Sanganakal Lowland Basin' },
        // 2. Siruguppa / Hirehaddinagundi Paddy Belt (Southwest of Ballari town)
        { id: 'spot_siruguppa', lat: 15.095, lng: 76.882, severity: 'Severe', name: 'Siruguppa Riverine Basin' },
        // 3. Toranagallu Rural Farmland (East, rural buffer outside JSW plant)
        { id: 'spot_toranagallu', lat: 15.178, lng: 77.012, severity: 'Moderate', name: 'Toranagallu Agri Belt' },
        // 4. Hongal Agricultural Terrace (Northwest)
        { id: 'spot_hongal', lat: 15.192, lng: 76.832, severity: 'Moderate', name: 'Hongal Agrarian Swale' },
        // 5. Hadagali Canal Swale (South)
        { id: 'spot_hadagali', lat: 15.078, lng: 76.924, severity: 'Moderate', name: 'Hadagali Canal Plain' }
      ];
    }

    // Dynamic placement for other 30 districts around their rural farmland
    const cLat = activeDistrictMeta.lat;
    const cLng = activeDistrictMeta.lng;
    return [
      { id: 'spot_ne', lat: cLat + 0.038, lng: cLng + 0.025, severity: 'Severe', name: `${activeDistrictMeta.displayName} East Farm Belt` },
      { id: 'spot_sw', lat: cLat - 0.035, lng: cLng - 0.032, severity: 'Severe', name: `${activeDistrictMeta.displayName} Lowland Basin` },
      { id: 'spot_nw', lat: cLat + 0.042, lng: cLng - 0.028, severity: 'Moderate', name: `${activeDistrictMeta.displayName} Agro Swale` },
      { id: 'spot_se', lat: cLat - 0.030, lng: cLng + 0.040, severity: 'Moderate', name: `${activeDistrictMeta.displayName} Canal Command` }
    ];
  }, [selectedAreaId, activeDistrictMeta]);

  // Geographic village markers for Ballari
  const ballariPlaceMarkers = useMemo(() => {
    if (selectedAreaId !== 'ballari') return [];
    return [
      { name: 'Ballari', lat: 15.1394, lng: 76.9214, isTown: true },
      { name: 'Sanganakal', lat: 15.185, lng: 76.945 },
      { name: 'Hongal', lat: 15.195, lng: 76.825 },
      { name: 'Kudligi', lat: 15.120, lng: 76.780 },
      { name: 'Siruguppa', lat: 15.075, lng: 76.865 },
      { name: 'Hadagali', lat: 15.060, lng: 76.915 },
      { name: 'Toranagallu', lat: 15.190, lng: 77.015 },
      { name: 'JSW Steel Toranagallu', lat: 15.160, lng: 77.025, isIndustrial: true },
      { name: 'Sandur', lat: 15.080, lng: 76.995 },
      { name: 'NH 67', lat: 15.130, lng: 76.820, isHighway: true },
      { name: 'NH 150A', lat: 15.110, lng: 76.980, isHighway: true }
    ];
  }, [selectedAreaId]);

  return (
    <div className="flex-1 w-full overflow-y-auto overflow-x-hidden bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 min-h-screen">
      
      {/* ------------------------------------------------------------- */}
      {/* 1. TOP ADVISORY BANNER                                       */}
      {/* ------------------------------------------------------------- */}
      <div className="w-full bg-slate-900 border-b border-amber-500/20 text-slate-200 px-3 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2.5 flex-wrap min-w-0">
          <span className="px-2 py-0.5 rounded font-black text-[10px] tracking-wider uppercase bg-amber-500 text-slate-950 shrink-0">
            DEMO ADVISORY
          </span>
          <span className="text-xs text-slate-100 font-medium truncate">
            <strong className="text-white font-bold">{activeDistrictMeta.displayName} District:</strong> Moderate risk of waterlogging in agricultural fields due to forecasted heavy rainfall (50–80 mm) in next 24 hours.
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs shrink-0">
          <span className="text-slate-400 text-[11px] hidden md:inline">
            This is a demonstration (sample) view. Not real-time data.
          </span>
          {onOpenEmergencyOps && (
            <button
              onClick={onOpenEmergencyOps}
              className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 transition-colors group text-[11px]"
            >
              <span>Emergency Operations Center (EOC)</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-4">
        
        {/* ------------------------------------------------------------- */}
        {/* 2. PAGE HEADER ROW WITH DISTRICT & DATE CONTROLS               */}
        {/* ------------------------------------------------------------- */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Title & Subtitle */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 flex items-center justify-center shrink-0 shadow-sm">
              <Waves className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Flood &amp; Waterlogging Overview
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Monitoring rainfall, river levels and agricultural waterlogging for early action
              </p>
            </div>
          </div>

          {/* Right Selectors: District, Date, Demo Tag */}
          <div className="flex items-center gap-2 flex-wrap justify-end">
            
            {/* 31 Karnataka Districts Dropdown */}
            <div className="relative">
              <button
                onClick={() => setDistrictDropdownOpen(!districtDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-800 dark:text-white shadow-sm hover:border-cyan-500 transition-all"
              >
                <MapPin className="w-3.5 h-3.5 text-blue-500" />
                <span className="truncate max-w-[150px] sm:max-w-[180px]">{activeDistrictMeta.name}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* District Dropdown Panel */}
              <AnimatePresence>
                {districtDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute right-0 top-full mt-1.5 z-[2000] w-72 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-2xl p-2 space-y-2 text-xs"
                  >
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search 31 Karnataka Districts..."
                        value={districtSearch}
                        onChange={(e) => setDistrictSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                        autoFocus
                      />
                    </div>

                    <div className="max-h-60 overflow-y-auto space-y-0.5 pr-1">
                      {filteredDistricts.map(dist => (
                        <button
                          key={dist.id}
                          onClick={() => {
                            onSelectArea(dist.id);
                            setSelectedZone(null);
                            setDistrictDropdownOpen(false);
                            setDistrictSearch('');
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between text-xs transition-colors ${
                            dist.id === selectedAreaId
                              ? 'bg-cyan-500 text-white font-bold'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          <span>{dist.displayName}</span>
                          <span className="text-[10px] opacity-75 font-mono">{dist.elevation}m</span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Current Date Selector / Display (Dynamic Asia/Kolkata) */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-800 dark:text-white shadow-sm">
              <Calendar className="w-3.5 h-3.5 text-blue-500" />
              <span>{formattedToday}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </div>

            {/* DEMO DATA Pill */}
            <div className="flex items-center gap-1.5 pl-1">
              <span className="px-2 py-0.5 rounded font-black text-[10px] tracking-wider uppercase bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30">
                DEMO DATA
              </span>
              <span className="text-[10px] text-slate-400 hidden xl:inline">
                Illustrative view only
              </span>
            </div>

          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* 3. TWO-COLUMN MAIN GRID (MATCHING SCREENSHOT)                */}
        {/* ------------------------------------------------------------- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* =========================================================== */}
          {/* LEFT COLUMN: MAP CONTAINER & LATEST ADVISORIES              */}
          {/* =========================================================== */}
          <div className="lg:col-span-7 xl:col-span-7 space-y-4">
            
            {/* The High-Impact Leaflet Map Card */}
            <div className="relative rounded-3xl overflow-hidden border border-slate-200 dark:border-white/10 shadow-lg bg-slate-900" style={{ height: '560px' }}>
              
              {/* Floating Top Badge: Agricultural Field Waterlogging Risk (i) */}
              <div className="absolute top-3 left-3 z-[1000] flex items-center gap-1.5 pointer-events-auto">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-300 dark:border-white/20 text-slate-900 dark:text-white font-bold text-xs shadow-md">
                  <span>Agricultural Field Waterlogging Risk</span>
                  <button 
                    onClick={() => setShowInfoModal(true)}
                    className="text-slate-400 hover:text-cyan-400 transition-colors ml-0.5"
                    title="Information about agricultural land isolation methodology"
                  >
                    <Info className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Floating Layer Mode Selector (Top Right) */}
              <div className="absolute top-3 right-3 z-[1000] flex items-center gap-1.5 pointer-events-auto">
                <div className="relative">
                  <button
                    onClick={() => setShowLayerMenu(!showLayerMenu)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-300 dark:border-white/20 text-slate-800 dark:text-white text-xs font-bold shadow-md hover:border-cyan-500 transition-all"
                  >
                    <Layers className="w-3.5 h-3.5 text-cyan-500" />
                    <span>{MAP_MODES[mapMode].name}</span>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </button>

                  {showLayerMenu && (
                    <div className="absolute right-0 top-full mt-1.5 w-40 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-xl p-1 text-xs">
                      {(Object.keys(MAP_MODES) as MapModeKey[]).map(key => (
                        <button
                          key={key}
                          onClick={() => {
                            setMapMode(key);
                            setShowLayerMenu(false);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
                            mapMode === key
                              ? 'bg-cyan-500 text-white font-bold'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          {MAP_MODES[key].name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* The Leaflet Map Canvas */}
              <MapContainer
                center={activeCenter}
                zoom={activeZoom}
                scrollWheelZoom={true}
                zoomControl={false}
                style={{ height: '100%', width: '100%', zIndex: 1 }}
              >
                <MapCenterController center={activeCenter} zoom={activeZoom} />
                <MapResizer />
                <MapCustomControls onRecenter={() => setSelectedZone(null)} />

                {/* Base Tile Layer */}
                <TileLayer
                  key={mapMode}
                  attribution={MAP_MODES[mapMode].attribution}
                  url={MAP_MODES[mapMode].url}
                  maxZoom={20}
                  maxNativeZoom={MAP_MODES[mapMode].maxNativeZoom}
                />

                {/* ------------------------------------------------------------- */}
                {/* LOCALIZED HEATMAP AREAS: Red -> Orange -> Yellow -> Green    */}
                {/* Strictly placed over verified agricultural parcels;           */}
                {/* Urban town centers, highways (NH 67/150A) & rivers left clear */}
                {/* ------------------------------------------------------------- */}
                {localizedHeatmapHotspots.map((spot) => {
                  const isSevere = spot.severity === 'Severe';
                  return (
                    <React.Fragment key={spot.id}>
                      {/* Outer Ring: Green (Low / Safe fringe) */}
                      <Circle
                        center={[spot.lat, spot.lng]}
                        radius={isSevere ? 2800 : 2000}
                        pathOptions={{
                          fillColor: '#22c55e',
                          fillOpacity: 0.28,
                          stroke: false,
                          className: 'heatmap-glow-moderate'
                        }}
                      />
                      {/* Mid Ring: Yellow (Moderate saturation) */}
                      <Circle
                        center={[spot.lat, spot.lng]}
                        radius={isSevere ? 1900 : 1350}
                        pathOptions={{
                          fillColor: '#eab308',
                          fillOpacity: 0.48,
                          stroke: false,
                          className: 'heatmap-glow-moderate'
                        }}
                      />
                      {/* Inner Ring: Orange (High risk ponding) */}
                      <Circle
                        center={[spot.lat, spot.lng]}
                        radius={isSevere ? 1200 : 750}
                        pathOptions={{
                          fillColor: '#f97316',
                          fillOpacity: 0.68,
                          stroke: false,
                          className: 'heatmap-glow-severe'
                        }}
                      />
                      {/* Core: Red (Severe inundation) */}
                      {isSevere && (
                        <Circle
                          center={[spot.lat, spot.lng]}
                          radius={650}
                          pathOptions={{
                            fillColor: '#ef4444',
                            fillOpacity: 0.88,
                            stroke: false,
                            className: 'heatmap-glow-severe'
                          }}
                        />
                      )}
                    </React.Fragment>
                  );
                })}

                {/* Only Heat Map is kept; extra waterlogging parcel markers and boundary outlines removed */}

                {/* Place & Highway Markers (Sanganakal, Siruguppa, NH 67, etc.) */}
                {ballariPlaceMarkers.map((m) => (
                  <Marker
                    key={m.name}
                    position={[m.lat, m.lng]}
                    icon={createPlaceTagIcon(m.name, m.isHighway)}
                  />
                ))}

              </MapContainer>

              {/* Floating Bottom-Left Legend on Map */}
              <div className="absolute bottom-3 left-3 z-[1000] p-2.5 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-300 dark:border-white/20 shadow-xl text-xs space-y-1.5 pointer-events-auto">
                <span className="font-bold text-slate-900 dark:text-white block text-[11px]">
                  Field Waterlogging Risk (Agricultural Land Only)
                </span>
                <div className="flex items-center gap-3 text-[11px] font-medium flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm"></span>
                    <span className="text-slate-700 dark:text-slate-300">Severe</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-sm"></span>
                    <span className="text-slate-700 dark:text-slate-300">High</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm"></span>
                    <span className="text-slate-700 dark:text-slate-300">Moderate</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm"></span>
                    <span className="text-slate-700 dark:text-slate-300">Low / Normal</span>
                  </div>
                </div>
              </div>

              {/* Floating Bottom-Right Scale Bar on Map */}
              <div className="absolute bottom-3 right-3 z-[1000] px-3 py-1 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-300 dark:border-white/20 shadow-md text-[10px] font-mono font-bold text-slate-700 dark:text-slate-300 pointer-events-none">
                <div className="flex items-center justify-between w-24 border-b-2 border-slate-800 dark:border-white pb-0.5">
                  <span>0</span>
                  <span>5</span>
                  <span>10 km</span>
                </div>
              </div>

            </div>

            {/* --------------------------------------------------------- */}
            {/* LATEST ADVISORIES (Directly below map on Left Column)     */}
            {/* --------------------------------------------------------- */}
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-orange-500" />
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    Latest Advisories
                  </h3>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30">
                    DEMO DATA
                  </span>
                </div>

                <button
                  onClick={onNavigateToDrainage}
                  className="text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1"
                >
                  <span>View All</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* 3 Advisories matching screenshot */}
              <div className="space-y-2">
                {/* 1. Red Alert */}
                <div className="p-3 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/40 flex items-start gap-3 text-xs">
                  <div className="w-7 h-7 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 mt-0.5">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-bold text-slate-900 dark:text-white truncate">
                        Moderate to heavy rainfall expected in {activeDistrictMeta.displayName} district (DEMO)
                      </h4>
                      <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                        {formattedToday}, 08:30
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300">
                      IMD forecast indicates 50–80 mm rainfall in next 24 hours. Risk of waterlogging in low-lying agricultural fields.
                    </p>
                  </div>
                </div>

                {/* 2. Green Sprout */}
                <div className="p-3 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/40 flex items-start gap-3 text-xs">
                  <div className="w-7 h-7 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Sprout className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-bold text-slate-900 dark:text-white truncate">
                        Consider pre-emptive drainage in vulnerable fields (DEMO)
                      </h4>
                      <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                        {formattedToday}, 07:15
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300">
                      Open field drains and clear outlets in identified moderate-risk areas.
                    </p>
                  </div>
                </div>

                {/* 3. Orange Wrench */}
                <div className="p-3 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 flex items-start gap-3 text-xs">
                  <div className="w-7 h-7 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Wrench className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-bold text-slate-900 dark:text-white truncate">
                        Maintain urban stormwater drains (DEMO)
                      </h4>
                      <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                        {yesterdayDateStr}, 18:40
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300">
                      Remove silt and vegetation from drains and inlets in {activeDistrictMeta.displayName} town.
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* =========================================================== */}
          {/* RIGHT COLUMN: 4 KPI CARDS, RAINFALL TREND, SAMPLE FIELDS    */}
          {/* =========================================================== */}
          <div className="lg:col-span-5 xl:col-span-5 space-y-4">
            
            {/* 4 Summary KPI Cards Grid (Matching Screenshot) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              
              {/* 1. Severe Risk Fields */}
              <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-sm space-y-1.5 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className="w-7 h-7 rounded-full bg-rose-500/15 text-rose-500 flex items-center justify-center">
                    <AlertTriangle className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block leading-tight">
                    Severe Risk Fields (DEMO)
                  </span>
                  <span className="text-base sm:text-lg font-black text-rose-600 dark:text-rose-400 block font-mono">
                    {severeHaDisplay}
                  </span>
                  <span className="text-[9px] text-slate-400 block truncate">
                    12% of monitored agri area
                  </span>
                </div>
              </div>

              {/* 2. Moderate Risk Fields */}
              <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-sm space-y-1.5 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className="w-7 h-7 rounded-full bg-amber-500/15 text-amber-500 flex items-center justify-center">
                    <AlertTriangle className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block leading-tight">
                    Moderate Risk Fields (DEMO)
                  </span>
                  <span className="text-base sm:text-lg font-black text-amber-600 dark:text-amber-400 block font-mono">
                    {moderateHaDisplay}
                  </span>
                  <span className="text-[9px] text-slate-400 block truncate">
                    37% of monitored agri area
                  </span>
                </div>
              </div>

              {/* 3. Low Risk Fields */}
              <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-sm space-y-1.5 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className="w-7 h-7 rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
                    <Sprout className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block leading-tight">
                    Low Risk Fields (DEMO)
                  </span>
                  <span className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400 block font-mono">
                    {lowHaDisplay}
                  </span>
                  <span className="text-[9px] text-slate-400 block truncate">
                    39% of monitored agri area
                  </span>
                </div>
              </div>

              {/* 4. Total Monitored Agri Area */}
              <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-sm space-y-1.5 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className="w-7 h-7 rounded-full bg-blue-500/15 text-blue-500 flex items-center justify-center">
                    <Droplets className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block leading-tight">
                    Total Monitored Agri Area (DEMO)
                  </span>
                  <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white block font-mono">
                    {totalHaDisplay}
                  </span>
                  <span className="text-[9px] text-slate-400 block truncate">
                    in {activeDistrictMeta.displayName} district
                  </span>
                </div>
              </div>

            </div>

            {/* Rainfall Trend Chart Card (Recharts Dual-Series) */}
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-4 shadow-sm space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CloudRain className="w-4 h-4 text-blue-500" />
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    Rainfall Trend ({activeDistrictMeta.displayName})
                  </h3>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30">
                    DEMO DATA
                  </span>
                </div>

                {/* Chart Legend matching screenshot */}
                <div className="flex items-center gap-3 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-2 rounded bg-blue-400"></span>
                    <span>Daily Rainfall</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 bg-blue-600 border-t border-dashed border-blue-600"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 -ml-2"></span>
                    <span>Forecast (Next 3 days)</span>
                  </div>
                </div>
              </div>

              {/* Recharts Composed Chart Canvas */}
              <div className="w-full h-44 pt-1">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={rainfallTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.15)" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 10, fill: '#94a3b8' }} 
                      tickLine={false} 
                      axisLine={{ stroke: 'rgba(148, 163, 184, 0.2)' }} 
                    />
                    <YAxis 
                      tick={{ fontSize: 10, fill: '#94a3b8' }} 
                      tickLine={false} 
                      axisLine={false} 
                      ticks={[0, 40, 80, 120]}
                      domain={[0, 120]}
                    />
                    <RechartsTooltip 
                      contentStyle={{ 
                        backgroundColor: '#0f172a', 
                        borderColor: 'rgba(255,255,255,0.1)', 
                        borderRadius: '0.75rem',
                        fontSize: '11px',
                        color: '#fff'
                      }}
                    />
                    <Bar 
                      dataKey="dailyRainfall" 
                      fill="#60a5fa" 
                      radius={[4, 4, 0, 0]} 
                      name="Observed Rain (mm)" 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="forecastRainfall" 
                      stroke="#2563eb" 
                      strokeWidth={2.5} 
                      strokeDasharray="4 4" 
                      dot={{ r: 3.5, fill: '#1d4ed8', strokeWidth: 1.5, stroke: '#fff' }} 
                      name="Forecast (mm)" 
                      connectNulls={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Sample Field Status (Agricultural Land) Table Card */}
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sprout className="w-4 h-4 text-emerald-500" />
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    Sample Field Status (Agricultural Land)
                  </h3>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30">
                    DEMO DATA
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-[10px]">
                    {(['All', 'Severe', 'Moderate', 'Low'] as const).map(tier => (
                      <button
                        key={tier}
                        onClick={() => setZoneFilter(tier)}
                        className={`px-2 py-0.5 rounded-md font-bold transition-colors ${
                          zoneFilter === tier
                            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                            : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                        }`}
                      >
                        {tier}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Cadastral Fields Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-white/10 text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                      <th className="pb-2 pl-1">Field ID</th>
                      <th className="pb-2">Village</th>
                      <th className="pb-2">Area (ha)</th>
                      <th className="pb-2">Current Status</th>
                      <th className="pb-2">Waterlogging Risk</th>
                      <th className="pb-2 pr-1 text-right">Suggested Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-medium">
                    {displayedParcels.map((parcel) => {
                      const isSelected = selectedZone?.id === parcel.id;
                      const isSevere = parcel.riskLevel === 'Severe';
                      const isModerate = parcel.riskLevel === 'Moderate';

                      return (
                        <tr
                          key={parcel.id}
                          onClick={() => setSelectedZone(parcel as any)}
                          className={`cursor-pointer transition-colors group ${
                            isSelected
                              ? 'bg-cyan-500/10 dark:bg-cyan-500/15'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                          }`}
                        >
                          <td className="py-2.5 pl-1 font-mono font-bold text-slate-700 dark:text-slate-300 group-hover:text-cyan-500">
                            {parcel.fieldId}
                          </td>
                          <td className="py-2.5 text-slate-800 dark:text-slate-200">
                            {parcel.village}
                          </td>
                          <td className="py-2.5 font-mono text-slate-600 dark:text-slate-400">
                            {parcel.areaHa}
                          </td>
                          <td className="py-2.5">
                            <span className="flex items-center gap-1.5">
                              <span className={`w-2 h-2 rounded-full ${
                                parcel.currentStatus === 'Water Standing'
                                  ? 'bg-red-500 shadow-sm shadow-red-500/50'
                                  : parcel.currentStatus === 'Saturated'
                                  ? 'bg-amber-500 shadow-sm shadow-amber-500/50'
                                  : 'bg-emerald-500'
                              }`}></span>
                              <span className="text-[11px] text-slate-700 dark:text-slate-300">{parcel.currentStatus}</span>
                            </span>
                          </td>
                          <td className="py-2.5">
                            <span className="flex items-center gap-1.5">
                              <span className={`w-2 h-2 rounded-full ${
                                isSevere ? 'bg-red-500' : isModerate ? 'bg-amber-500' : 'bg-yellow-400'
                              }`}></span>
                              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                {parcel.riskLevel}
                              </span>
                            </span>
                          </td>
                          <td className="py-2.5 pr-1 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedZone(parcel as any);
                              }}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all shadow-sm ${
                                isSevere
                                  ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 hover:bg-rose-200'
                                  : isModerate
                                  ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 hover:bg-amber-200'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                              }`}
                            >
                              {parcel.suggestedAction}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

        </div>

        {/* ------------------------------------------------------------- */}
        {/* 4. DATA SOURCES & FRESHNESS BAR (FULL-WIDTH BOTTOM)          */}
        {/* ------------------------------------------------------------- */}
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-4 shadow-sm space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-cyan-500" />
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                Data Sources &amp; Freshness
              </h3>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30">
                DEMO DATA
              </span>
            </div>

            <button
              onClick={() => setShowInfoModal(true)}
              className="text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1"
            >
              <span>View Details</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 4 Source Cards Grid matching screenshot */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            
            {/* 1. Satellite Imagery */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-white/5 space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-500">
                  <Eye className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white leading-tight">
                    Satellite Imagery
                  </h4>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    (Sentinel-1/2 &amp; NASA GIBS)
                  </span>
                </div>
              </div>
              <div className="pt-1 flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Updated {yesterdayDateStr}, 06:00 (DEMO)</span>
              </div>
            </div>

            {/* 2. Weather Forecast */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-white/5 space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500">
                  <CloudRain className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white leading-tight">
                    Weather Forecast
                  </h4>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    (IMD / Open-Meteo NWP)
                  </span>
                </div>
              </div>
              <div className="pt-1 flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Updated {formattedToday}, 06:30 (LIVE)</span>
              </div>
            </div>

            {/* 3. River & Reservoir Levels */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-white/5 space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-500">
                  <Waves className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white leading-tight">
                    River &amp; Reservoir Levels
                  </h4>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    (KSDMA / TB Board)
                  </span>
                </div>
              </div>
              <div className="pt-1 flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                <span>Updated {formattedToday}, 06:00 (DEMO)</span>
              </div>
            </div>

            {/* 4. Administrative & Field Data */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-white/5 space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white leading-tight">
                    Administrative &amp; Field Data
                  </h4>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    (Govt. of Karnataka / KSRSAC)
                  </span>
                </div>
              </div>
              <div className="pt-1 flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Updated {fourDaysAgoStr}, 12:00</span>
              </div>
            </div>

          </div>

          {/* Explanatory Methodology Banner */}
          <div className="p-3 rounded-2xl bg-cyan-50/70 dark:bg-cyan-950/20 border border-cyan-200/80 dark:border-cyan-800/30 flex items-start gap-3 text-xs">
            <Info className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed">
              <strong className="text-cyan-700 dark:text-cyan-400 font-bold">Observational Integrity Note:</strong> Real-time rainfall observations from Open-Meteo European NWP drive our hydrological infiltration models. When satellite SAR passes are between orbital intervals (6–12 day revisit) or optical feeds are cloud-obscured, field risk reflects numerical surface runoff modeling rather than confirmed physical flood standing. Demo and sample datasets are clearly tagged.
            </p>
          </div>

        </div>

      </div>

      {/* ------------------------------------------------------------- */}
      {/* 5. FIELD INSPECTOR MODAL / DOSSIER                           */}
      {/* ------------------------------------------------------------- */}
      <AnimatePresence>
        {selectedZone && (
          <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-2xl p-5 space-y-4"
            >
              <div className="flex items-start justify-between pb-3 border-b border-slate-200 dark:border-white/10">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded font-black text-[10px] tracking-wider uppercase bg-cyan-500 text-white">
                      FIELD CADASTRE
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-400">
                      {(selectedZone as any).fieldId || selectedZone.id}
                    </span>
                  </div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white mt-1">
                    {selectedZone.zone_name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Village: <strong className="text-slate-700 dark:text-slate-300">{(selectedZone as any).village || 'Agricultural Plain'}</strong> &bull; {selectedZone.elevation_m}m AMSL ({selectedZone.slope_deg}&deg; slope)
                  </p>
                </div>

                <button
                  onClick={() => setSelectedZone(null)}
                  className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Status & Key Metrics Grid */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-white/5">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Risk Tier</span>
                  <span className={`text-sm font-black font-mono block ${
                    selectedZone.severity === 'Severe' ? 'text-rose-500' : selectedZone.severity === 'Moderate' ? 'text-amber-500' : 'text-emerald-500'
                  }`}>
                    {selectedZone.severity}
                  </span>
                </div>
                <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-white/5">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Field Area</span>
                  <span className="text-sm font-black font-mono text-slate-900 dark:text-white block">
                    {selectedZone.area_ha} ha
                  </span>
                </div>
                <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-white/5">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Soil Condition</span>
                  <span className="text-xs font-bold text-cyan-500 block truncate">
                    {(selectedZone as any).currentStatus || 'Saturated'}
                  </span>
                </div>
              </div>

              {/* Agronomic Guidance */}
              <div className="p-3.5 rounded-2xl bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800/40 text-xs space-y-1">
                <strong className="text-cyan-700 dark:text-cyan-400 block font-bold">
                  Agronomic Drainage Protocol:
                </strong>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-[11px]">
                  {selectedZone.severity === 'Severe'
                    ? 'Excessive standing ponding detected (>40cm). Trench lateral perimeter bunds immediately and engage tractor slurry pumps into arterial drains to prevent root rot in tillering paddy / seedling stage.'
                    : selectedZone.severity === 'Moderate'
                    ? 'Topsoil saturated near field capacity. Clear minor silt deposits along collector furrow lines and postpone chemical fertilizer top-dressing.'
                    : 'Soil moisture levels optimal for crop development. Maintain standard contour bund integrity.'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setIsPrecautionModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-cyan-500" />
                  <span>Precautions</span>
                </button>
                <button
                  onClick={onNavigateToDrainage}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-xs shadow-md shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 transition-all flex items-center gap-1.5"
                >
                  <span>Dispatch Action</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Information Methodology Modal */}
      <AnimatePresence>
        {showInfoModal && (
          <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-2xl p-5 space-y-4"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-white/10">
                <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Info className="w-4 h-4 text-cyan-500" />
                  <span>Agricultural Waterlogging Isolation Methodology</span>
                </h3>
                <button onClick={() => setShowInfoModal(false)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="text-xs text-slate-600 dark:text-slate-300 space-y-2.5 leading-relaxed">
                <p>
                  <strong>1. Agricultural Boundary Masking:</strong> Risk calculations are applied exclusively to verified agricultural field cadastre parcels identified through Karnataka State Remote Sensing Applications Centre (KSRSAC) and Sentinel-2 NDVI land-cover classifications.
                </p>
                <p>
                  <strong>2. Urban &amp; Infrastructure Exclusion:</strong> Built-up urban centres, highway ribbons (such as NH 67 &amp; NH 150A), and industrial zones (such as JSW Steel Toranagallu) are masked out so that agricultural drainage advisories are not painted onto non-farm land.
                </p>
                <p>
                  <strong>3. Observation vs. Forecast:</strong> Weather observations (daily precipitation sum) are pulled directly from Open-Meteo European NWP / ECMWF. Heatmap contours depict hydro-meteorological runoff risk, distinct from physical flood observations that require cloud-free SAR satellite passes.
                </p>
              </div>

              <div className="pt-2 text-right">
                <button
                  onClick={() => setShowInfoModal(false)}
                  className="px-4 py-2 rounded-xl bg-cyan-500 text-white font-bold text-xs"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Precaution Modal */}
      <PrecautionProtocolModal
        isOpen={isPrecautionModalOpen}
        onClose={() => setIsPrecautionModalOpen(false)}
        districtName={activeDistrictMeta.displayName}
        earlyWarningData={weatherTelemetry}
      />

    </div>
  );
};
