import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Shield,
  Layers,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Waves,
  MapPin,
  Calendar,
  RefreshCw,
  Search,
  Filter,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Info,
  Maximize2,
  Minimize2,
  ExternalLink,
  Plus,
  Check,
  X,
  FileText,
  Activity,
  Droplets,
  Wrench,
  AlertCircle,
  Eye,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { api } from '../services/api';
import {
  KARNATAKA_31_DISTRICTS_WEATHER,
  WeatherDistrict,
} from '../data/karnatakaDistrictsWeather';
import {
  DrainageAsset,
  DrainageSummary,
  DrainageAdvisoryAlert,
  BALLARI_DRAINAGE_ASSETS,
  getDrainageAssetsForDistrict,
  calculateDrainageSummary,
} from '../data/karnatakaDrainageAssets';

export interface DrainageActionsPageProps {
  selectedDistrictId?: string;
  onSelectedDistrictIdChange?: (districtId: string) => void;
  selectedDate?: string;
  onNavigateToMap?: () => void;
  advisories?: any[];
  zones?: any[];
  studyArea?: any;
  onOpenExportModal?: () => void;
  highlightActionId?: string | null;
  highlightLocation?: string | null;
}

export const DrainageActionsPage: React.FC<DrainageActionsPageProps> = ({
  selectedDistrictId = 'bengaluru_urban',
  onSelectedDistrictIdChange,
  onNavigateToMap,
  highlightActionId,
  highlightLocation,
}) => {
  // ── District State ──
  const [districtId, setDistrictId] = useState<string>(() => {
    const match = KARNATAKA_31_DISTRICTS_WEATHER.find(
      (d) =>
        d.id === selectedDistrictId ||
        d.name.toLowerCase().includes(selectedDistrictId.toLowerCase()) ||
        d.displayName.toLowerCase().includes(selectedDistrictId.toLowerCase())
    );
    return match ? match.id : 'ballari';
  });

  // Dynamic Date string (e.g. "21 Aug 2024" or dynamic IST date)
  const todayFormatted = useMemo(() => {
    return new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'Asia/Kolkata',
    });
  }, []);

  // Sync external district changes
  useEffect(() => {
    if (selectedDistrictId) {
      const match = KARNATAKA_31_DISTRICTS_WEATHER.find(
        (d) =>
          d.id === selectedDistrictId ||
          d.name.toLowerCase().includes(selectedDistrictId.toLowerCase()) ||
          d.displayName.toLowerCase().includes(selectedDistrictId.toLowerCase())
      );
      if (match && match.id !== districtId) {
        setDistrictId(match.id);
      }
    }
  }, [selectedDistrictId]);

  const currentDistrict = useMemo(() => {
    return (
      KARNATAKA_31_DISTRICTS_WEATHER.find((d) => d.id === districtId) ||
      KARNATAKA_31_DISTRICTS_WEATHER[0]
    );
  }, [districtId]);

  // ── Database Drainage Infrastructure State ──
  const [dbSummary, setDbSummary] = useState<any>(null);

  // ── Assets State ──
  const [assets, setAssets] = useState<DrainageAsset[]>(() =>
    currentDistrict.id === 'ballari' ? BALLARI_DRAINAGE_ASSETS : []
  );

  // Dynamic Summary Metrics computed from DB when available
  const summary: DrainageSummary = useMemo(() => {
    if (dbSummary && dbSummary.has_drainage_data) {
      return {
        totalAssets: dbSummary.totalAssets,
        reportedIssues: dbSummary.reportedIssues,
        awaitingVerification: dbSummary.awaitingVerification,
        underMaintenance: dbSummary.underMaintenance,
        functionalAssets: dbSummary.functionalAssets,
        totalLengthKm: dbSummary.totalLengthKm,
        networkBreakdown: dbSummary.networkBreakdown,
        averageUtilizationPct: dbSummary.averageUtilizationPct,
        utilizationBuckets: dbSummary.utilizationBuckets,
        conditionCounts: dbSummary.conditionCounts,
      };
    }
    if (currentDistrict.id === 'ballari' && assets.length > 0) {
      return calculateDrainageSummary(assets);
    }
    return {
      totalAssets: dbSummary?.totalAssets || 0,
      reportedIssues: dbSummary?.reportedIssues || 0,
      awaitingVerification: dbSummary?.awaitingVerification || 0,
      underMaintenance: dbSummary?.underMaintenance || 0,
      functionalAssets: dbSummary?.functionalAssets || 0,
      totalLengthKm: dbSummary?.totalLengthKm || 0,
      networkBreakdown: { majorDrains: 0, secondaryDrains: 0, stormWaterDrains: 0, culverts: 0, outfallPoints: 0 },
      averageUtilizationPct: null as any,
      utilizationBuckets: { greaterThan90: 0, between70And90: 0, between50And70: 0, lessThan50: 0, unmonitored: dbSummary?.totalAssets || 0 },
      conditionCounts: { good: 0, moderate: 0, blockedCritical: dbSummary?.reportedIssues || 0, underMaintenance: 0, unknown: dbSummary?.totalAssets || 0 },
    };
  }, [dbSummary, assets, currentDistrict]);

  const isInsufficientData = useMemo(() => {
    if (dbSummary) return Boolean(dbSummary.insufficient_data);
    return false;
  }, [dbSummary]);

  // Advisories List
  const [advisories, setAdvisories] = useState<DrainageAdvisoryAlert[]>([]);

  // Map Filter: 'All' | 'Functional' | 'Under Maintenance' | 'Reported Issue'
  const [mapFilter, setMapFilter] = useState<'All' | 'Functional' | 'Under Maintenance' | 'Reported Issue'>('All');

  // Selected Asset for Detailed Popup / Modal
  const [selectedAsset, setSelectedAsset] = useState<DrainageAsset | null>(null);

  // Auto-select asset when highlighted from Flood Map navigation
  useEffect(() => {
    if (!highlightActionId && !highlightLocation) return;
    const target = assets.find((a) =>
      (highlightActionId && (a.id === highlightActionId || a.id.toLowerCase().includes(highlightActionId.toLowerCase()))) ||
      (highlightLocation && a.name.toLowerCase().includes(highlightLocation.toLowerCase())) ||
      (highlightLocation && a.locality?.toLowerCase().includes(highlightLocation.toLowerCase()))
    );
    if (target) {
      setSelectedAsset(target);
      if (mapRef.current && target.lat && target.lng) {
        mapRef.current.flyTo({ center: [target.lng, target.lat], zoom: 13.5, duration: 800 });
      }
    }
  }, [highlightActionId, highlightLocation, assets]);

  // Modals for "View All"
  const [activeModal, setActiveModal] = useState<
    'keyDrains' | 'advisories' | 'inspections' | 'maintenance' | 'keyLocations' | 'reportIssue' | null
  >(null);

  // Dropdown States
  const [isDistrictDropdownOpen, setIsDistrictDropdownOpen] = useState(false);
  const [districtSearch, setDistrictSearch] = useState('');

  // Live Weather from Open-Meteo
  const [weatherData, setWeatherData] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importNotice, setImportNotice] = useState<string | null>(null);

  const handleImportOnDemand = async () => {
    try {
      setIsImporting(true);
      setImportNotice(null);
      const res = await api.importDrainageDistrict(currentDistrict.id);
      if (res?.success) {
        setImportNotice(`Successfully imported ${res.importedCount} features for ${currentDistrict.displayName}!`);
        fetchLiveData();
      } else {
        setImportNotice(res?.message || 'Import failed. Resource unavailable.');
      }
    } catch (err: any) {
      setImportNotice(`Import error: ${err.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  // Map Refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  // Fetch Live Weather & Drainage Advisory & Drainage Network Summary
  const fetchLiveData = () => {
    setIsRefreshing(true);
    Promise.allSettled([
      api.getDistrictWeather(currentDistrict.displayName, true),
      api.getLiveDrainageAdvisory(currentDistrict.id, true),
      api.getDistrictIncidents(currentDistrict.id).catch(() => null),
      api.getDrainageSummary(currentDistrict.id).catch(() => null),
      api.getDrainageAssets(currentDistrict.id, 25).catch(() => null),
    ]).then(([wRes, advRes, incRes, sumRes, assetsRes]) => {
      if (wRes.status === 'fulfilled' && wRes.value) {
        setWeatherData(wRes.value);
      }

      if (sumRes.status === 'fulfilled' && sumRes.value?.success) {
        setDbSummary(sumRes.value);
      }

      if (assetsRes.status === 'fulfilled' && assetsRes.value?.assets?.length > 0) {
        setAssets(assetsRes.value.assets);
      } else if (currentDistrict.id === 'ballari') {
        setAssets(BALLARI_DRAINAGE_ASSETS);
      } else {
        setAssets([]);
      }

      const newAdvisories: DrainageAdvisoryAlert[] = [];
      const now = new Date();
      const ts = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
      const dateStr = now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

      // 1. Live weather-based advisory from backend
      if (advRes.status === 'fulfilled' && advRes.value?.data) {
        const liveAdv = advRes.value.data;
        if (liveAdv.insufficient_data) {
          newAdvisories.push({
            id: `ADV-INSUFFICIENT-${currentDistrict.id}`,
            type: 'info',
            title: liveAdv.insufficientDataReason || `No government-verified stormwater drain network (KML) currently imported for ${currentDistrict.displayName}. OpenCity resource is available for on-demand import.`,
            timestamp: `${dateStr}, ${ts}`,
            timeAgo: 'Ground Survey Missing',
          });
        } else if (liveAdv.guidanceHeadline) {
          const isCritical = liveAdv.priority?.includes('Critical') || liveAdv.priority?.includes('1');
          const isWarning  = liveAdv.priority?.includes('2') || liveAdv.riskCategory?.includes('Moderate') || liveAdv.riskCategory?.includes('Severe');
          newAdvisories.push({
            id: `ADV-LIVE-${currentDistrict.id}`,
            type: isCritical ? 'critical' : isWarning ? 'warning' : 'info',
            title: `${liveAdv.guidanceHeadline} — ${currentDistrict.displayName}`,
            timestamp: `${dateStr}, ${ts}`,
            timeAgo: `${currentDistrict.displayName} · Open-Meteo NWP`,
          });
        }

        // Show forecast numbers as a second item if meaningful
        const rain24h = liveAdv.metrics?.forecastRainfall24hMm ?? liveAdv.inputValues?.forecast24hPrecipMm;
        if (typeof rain24h === 'number' && rain24h > 0) {
          newAdvisories.push({
            id: `ADV-RAIN-${currentDistrict.id}`,
            type: rain24h >= 60 ? 'critical' : rain24h >= 25 ? 'warning' : 'info',
            title: `Forecast: ${rain24h.toFixed(1)} mm / 24 h · Peak ${(liveAdv.metrics?.peakHourlyForecastMm ?? 0).toFixed(1)} mm/h — ${currentDistrict.displayName}`,
            timestamp: liveAdv.dataTimestamp ? new Date(liveAdv.dataTimestamp).toLocaleString('en-IN') : dateStr,
            timeAgo: 'NWP model output — not a ground observation',
          });
        }

        // Drainage network evidence
        if (liveAdv.drainageEvidence && typeof liveAdv.drainageEvidence.totalLines === 'number' && liveAdv.drainageEvidence.totalLines > 0) {
          const de = liveAdv.drainageEvidence;
          newAdvisories.push({
            id: `ADV-NET-${currentDistrict.id}`,
            type: 'info',
            title: `Drainage Network: ${de.totalLines.toLocaleString()} mapped channels (${de.totalLengthKm} km) · ${de.source}`,
            timestamp: dateStr,
            timeAgo: 'OpenCity.in / Government of Karnataka',
          });
        }
      }

      // 2. District incidents → real evidence items
      const incData = incRes.status === 'fulfilled' ? incRes.value : null;
      const incidents: any[] = incData?.incidents || [];
      const districtInc = incidents.filter((inc: any) =>
        (inc.district_id || '').toLowerCase() === currentDistrict.id.toLowerCase()
      );

      districtInc.slice(0, 3).forEach((inc: any) => {
        const isSevere = inc.severity === 'Severe';
        const isHigh   = inc.severity === 'High';
        newAdvisories.push({
          id: `ADV-INC-${inc.id || Math.random()}`,
          type: isSevere ? 'critical' : isHigh ? 'warning' : 'info',
          title: `${inc.severity || 'Unclassified'} waterlogging: ${inc.landmark || inc.location || 'Location unrecorded'} — ${inc.status || 'UNVERIFIED'}`,
          timestamp: inc.created_at ? new Date(inc.created_at).toLocaleString('en-IN') : dateStr,
          timeAgo: inc.source_type === 'FIELD_SURVEY' ? 'Field survey (verified)' : 'Citizen report (unverified)',
        });
      });

      // 3. If nothing found for this district, say so honestly
      if (newAdvisories.length === 0) {
        newAdvisories.push({
          id: `ADV-NODATA-${currentDistrict.id}`,
          type: 'info',
          title: `Insufficient district-specific data for ${currentDistrict.displayName}. No verified incidents or live weather data available.`,
          timestamp: dateStr,
          timeAgo: 'No connected source',
        });
      }

      setAdvisories(newAdvisories);
      setIsRefreshing(false);
    });
  };

  // Reset advisories to loading state on district change, then fetch fresh
  useEffect(() => {
    setAdvisories([{
      id: 'ADV-LOADING',
      type: 'info',
      title: `Loading advisory for ${currentDistrict.displayName}…`,
      timestamp: '',
      timeAgo: '',
    }]);
    fetchLiveData();
  }, [currentDistrict]);


  // Filtered Assets for Map
  const filteredMapAssets = useMemo(() => {
    if (mapFilter === 'All') return assets;
    return assets.filter((a) => a.status === mapFilter);
  }, [assets, mapFilter]);

  // Initialize MapLibre GL Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapRef.current) {
      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: {
          version: 8,
          sources: {
            'osm-tiles': {
              type: 'raster',
              tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
              tileSize: 256,
              attribution: '© OpenStreetMap contributors',
            },
          },
          layers: [
            {
              id: 'osm-layer',
              type: 'raster',
              source: 'osm-tiles',
              minzoom: 0,
              maxzoom: 19,
            },
          ],
        },
        center: [currentDistrict.lng, currentDistrict.lat],
        zoom: 11,
      });

      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-left');
      mapRef.current = map;
    } else {
      mapRef.current.flyTo({
        center: [currentDistrict.lng, currentDistrict.lat],
        zoom: 11,
        essential: true,
      });
    }

    // Clear old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Add new markers
    filteredMapAssets.forEach((asset) => {
      const el = document.createElement('div');
      el.className = 'cursor-pointer transition-transform hover:scale-125';

      if (asset.status === 'Functional') {
        el.innerHTML = `
          <div style="background-color: #10b981; width: 14px; height: 14px; border-radius: 2px; border: 2px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.3);"></div>
        `;
      } else if (asset.status === 'Under Maintenance') {
        el.innerHTML = `
          <div style="background-color: #f59e0b; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.3);"></div>
        `;
      } else {
        // Reported Issue (Red triangle)
        el.innerHTML = `
          <div style="width: 0; height: 0; border-left: 9px solid transparent; border-right: 9px solid transparent; border-bottom: 16px solid #ef4444; filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3));"></div>
        `;
      }

      el.addEventListener('click', () => {
        setSelectedAsset(asset);
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([asset.lng, asset.lat])
        .addTo(mapRef.current!);

      markersRef.current.push(marker);
    });

    return () => {
      // Keep map instance alive for smooth re-renders
    };
  }, [currentDistrict, filteredMapAssets]);

  // Clean up map on unmount
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Bar Chart Data for Drainage Condition Summary
  const conditionChartData = [
    { name: 'Good', count: summary.conditionCounts.good, fill: '#10b981' },
    { name: 'Moderate', count: summary.conditionCounts.moderate, fill: '#f59e0b' },
    { name: 'Blocked / Critical', count: summary.conditionCounts.blockedCritical, fill: '#ef4444' },
    { name: 'Under Maintenance', count: summary.conditionCounts.underMaintenance, fill: '#3b82f6' },
  ];

  // Doughnut Gauge Calculation
  const avgUtil = summary.averageUtilizationPct;
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (avgUtil / 100) * circumference;

  // Key Drains (top 5)
  const keyDrains = useMemo(() => assets.slice(0, 5), [assets]);

  // Toggle Maintenance Task Status
  const toggleMaintenanceStatus = (taskId?: string) => {
    if (!taskId) return;
    setAssets((prev) =>
      prev.map((a) => {
        if (a.maintenanceTask?.taskId === taskId) {
          const currentStatus = a.maintenanceTask.status;
          const nextStatus =
            currentStatus === 'Pending'
              ? 'Scheduled'
              : currentStatus === 'Scheduled'
              ? 'In Progress'
              : 'Completed';
          return {
            ...a,
            maintenanceTask: {
              ...a.maintenanceTask,
              status: nextStatus,
            },
          };
        }
        return a;
      })
    );
  };

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-4 px-3 py-3 sm:px-6 sm:py-4 font-sans text-slate-800 dark:text-slate-100">
      {/* ── 1. Top Header Bar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-3 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-500/10 text-red-600 shadow-sm dark:bg-red-500/20 dark:text-red-400">
            <Shield size={26} className="stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl dark:text-white">
              Drainage Actions
            </h1>
            <p className="text-xs text-slate-500 sm:text-sm dark:text-slate-400">
              Drainage network status, maintenance actions and water level monitoring
            </p>
          </div>
        </div>

        {/* Right Controls: District Selector + Date + Refresh */}
        <div className="flex items-center gap-2">
          {/* District Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsDistrictDropdownOpen(!isDistrictDropdownOpen)}
              className="inline-flex items-center gap-2 rounded-xl border border-blue-200/80 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs transition hover:border-blue-400 hover:bg-blue-50/50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <MapPin size={15} className="text-blue-600 dark:text-blue-400" />
              <span>{currentDistrict.displayName}, Karnataka</span>
              <ChevronDown size={14} className="text-slate-400" />
            </button>

            {isDistrictDropdownOpen && (
              <div className="absolute right-0 top-full z-50 mt-1.5 w-80 rounded-2xl border border-slate-200 bg-white p-2.5 shadow-xl dark:border-slate-700 dark:bg-slate-900">
                <div className="relative mb-2">
                  <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={districtSearch}
                    onChange={(e) => setDistrictSearch(e.target.value)}
                    placeholder="Search all 31 districts..."
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-2 text-xs text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    autoFocus
                  />
                </div>
                <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
                  {KARNATAKA_31_DISTRICTS_WEATHER.filter((d) =>
                    d.displayName.toLowerCase().includes(districtSearch.toLowerCase())
                  ).map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => {
                        setDistrictId(d.id);
                        if (onSelectedDistrictIdChange) onSelectedDistrictIdChange(d.id);
                        setIsDistrictDropdownOpen(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition ${
                        d.id === districtId
                          ? 'bg-blue-50 font-semibold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                          : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div>
                        <div>{d.displayName}</div>
                        <div className="text-[10px] text-slate-400 font-normal">{d.zone}</div>
                      </div>
                      {d.id === districtId && (
                        <CheckCircle2 size={13} className="text-blue-600 dark:text-blue-400" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Date Selector Pill */}
          <div className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white px-3 py-2 text-xs font-medium text-slate-600 shadow-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <Calendar size={14} className="text-blue-500" />
            <span>{todayFormatted}</span>
            <ChevronDown size={12} className="text-slate-400" />
          </div>

          {/* Return to Flood Map Link */}
          {onNavigateToMap && (
            <button
              type="button"
              onClick={onNavigateToMap}
              className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-[#1d6fd8] shadow-xs hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950/70 dark:text-blue-300"
              title="Return to Flood Map"
            >
              <ExternalLink size={13} />
              <span>Flood Map</span>
            </button>
          )}

          {/* Refresh Button */}
          <button
            type="button"
            onClick={fetchLiveData}
            disabled={isRefreshing}
            title="Refresh Live Data"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/90 bg-white text-slate-500 shadow-xs transition hover:bg-slate-50 hover:text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin text-blue-600' : ''} />
          </button>
        </div>
      </div>

      {/* ── Insufficient District Data Alert Banner ── */}
      {isInsufficientData && (
        <div className="flex flex-col gap-2.5 rounded-2xl border border-amber-200 bg-amber-50/90 p-4 text-amber-900 shadow-xs dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
            <div className="flex-1 text-xs">
              <div className="font-bold text-sm text-amber-950 dark:text-amber-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>Insufficient District-Specific Drainage Network</span>
                  <span className="rounded-full bg-amber-200/80 px-2 py-0.5 text-[10px] font-semibold text-amber-800 dark:bg-amber-900 dark:text-amber-300">
                    {currentDistrict.displayName}
                  </span>
                </div>
                {dbSummary?.can_import_on_demand && (
                  <button
                    type="button"
                    onClick={handleImportOnDemand}
                    disabled={isImporting}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1 text-xs font-semibold text-white shadow-xs transition hover:bg-amber-700 disabled:opacity-50"
                  >
                    {isImporting ? <RefreshCw size={12} className="animate-spin" /> : <Layers size={12} />}
                    {isImporting ? 'Importing from OpenCity...' : 'Import District Network'}
                  </button>
                )}
              </div>
              <p className="mt-1 leading-relaxed text-slate-700 dark:text-slate-300">
                {dbSummary?.notice || `Government-verified stormwater drain network not yet imported into local database for ${currentDistrict.displayName}. Absence of records reflects data availability, not zero physical drains on the ground.`}
              </p>
              {dbSummary?.can_import_on_demand && (
                <div className="mt-1.5 flex items-center gap-2 text-[11px] text-amber-800 dark:text-amber-300 font-medium">
                  <span>Resource available: {dbSummary?.resource_title || 'OpenCity Karnataka Drainage Map'}</span>
                </div>
              )}
              {importNotice && (
                <div className="mt-2 rounded-lg bg-white/80 p-2 text-xs font-medium text-slate-800 dark:bg-slate-900/80 dark:text-slate-100 border border-amber-300 dark:border-amber-700">
                  {importNotice}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── 2. Row 1: 5 Top Summary Stat Cards ── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {/* Card 1: Total Drainage Assets */}
        <div className="flex items-center gap-3.5 rounded-2xl border border-blue-100/90 bg-white p-3.5 shadow-xs dark:border-slate-800 dark:bg-slate-900/90">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
            <Layers size={24} className="stroke-[2.2]" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
              Total Drainage Assets
            </div>
            <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
              {summary.totalAssets}
            </div>
            <div className="text-[10px] text-slate-400">
              In {currentDistrict.displayName} district
            </div>
          </div>
        </div>

        {/* Card 2: Reported Issues */}
        <div className="flex items-center gap-3.5 rounded-2xl border border-red-100/90 bg-white p-3.5 shadow-xs dark:border-slate-800 dark:bg-slate-900/90">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-500 dark:bg-red-950/50 dark:text-red-400">
            <AlertTriangle size={24} className="stroke-[2.2]" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
              Reported Issues
            </div>
            <div className="text-2xl font-bold tracking-tight text-red-600 dark:text-red-400 leading-tight">
              {summary.reportedIssues}
            </div>
            <div className="text-[10px] text-slate-400">
              Awaiting verification: {summary.awaitingVerification}
            </div>
          </div>
        </div>

        {/* Card 3: Under Maintenance */}
        <div className="flex items-center gap-3.5 rounded-2xl border border-amber-100/90 bg-white p-3.5 shadow-xs dark:border-slate-800 dark:bg-slate-900/90">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-500 dark:bg-amber-950/50 dark:text-amber-400">
            <Wrench size={22} className="stroke-[2.2]" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
              Under Maintenance
            </div>
            <div className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400 leading-tight">
              {summary.underMaintenance}
            </div>
            <div className="text-[10px] text-slate-400">
              In progress
            </div>
          </div>
        </div>

        {/* Card 4: Functional Assets */}
        <div className="flex items-center gap-3.5 rounded-2xl border border-emerald-100/90 bg-white p-3.5 shadow-xs dark:border-slate-800 dark:bg-slate-900/90">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
            <CheckCircle2 size={24} className="stroke-[2.2]" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
              Functional Assets
            </div>
            <div className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 leading-tight">
              {summary.functionalAssets}
            </div>
            <div className="text-[10px] text-slate-400">
              Operating normally
            </div>
          </div>
        </div>

        {/* Card 5: Total Drainage Length */}
        <div className="flex items-center gap-3.5 rounded-2xl border border-blue-100/90 bg-white p-3.5 shadow-xs dark:border-slate-800 dark:bg-slate-900/90">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
            <Waves size={24} className="stroke-[2.2]" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
              Total Drainage Length
            </div>
            <div className="text-2xl font-bold tracking-tight text-blue-600 dark:text-blue-400 leading-tight">
              {summary.totalLengthKm} km
            </div>
            <div className="text-[10px] text-slate-400">
              Mapped in {currentDistrict.displayName} district
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Row 2: Drainage Network, Water Level at Key Drains, Capacity Gauge, Advisory ── */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-12">
        {/* Card 1: Drainage Network (col-span-3) */}
        <div className="rounded-2xl border border-blue-100/90 bg-white p-4 shadow-xs xl:col-span-3 dark:border-slate-800 dark:bg-slate-900/90">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <Layers size={15} className="text-blue-600" />
              <span>Drainage Network</span>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-slate-50 dark:border-slate-800/60">
              <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <span className="text-blue-500">▦</span> Major Drains
              </span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {summary.networkBreakdown.majorDrains}
              </span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-slate-50 dark:border-slate-800/60">
              <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <span className="text-blue-500">≋</span> Secondary Drains
              </span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {summary.networkBreakdown.secondaryDrains}
              </span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-slate-50 dark:border-slate-800/60">
              <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <span className="text-blue-500">💧</span> Storm Water Drains
              </span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {summary.networkBreakdown.stormWaterDrains}
              </span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-slate-50 dark:border-slate-800/60">
              <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <span className="text-blue-500">⌒</span> Culverts
              </span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {summary.networkBreakdown.culverts}
              </span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-slate-50 dark:border-slate-800/60">
              <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <span className="text-blue-500">◎</span> Outfall Points
              </span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {summary.networkBreakdown.outfallPoints}
              </span>
            </div>

            <div className="mt-2 flex items-center justify-between rounded-xl bg-blue-50/80 px-2.5 py-1.5 text-blue-700 font-semibold dark:bg-blue-950/60 dark:text-blue-300">
              <span className="flex items-center gap-2">
                <Activity size={14} /> All Drainage Assets
              </span>
              <span>{summary.totalAssets}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Water Level at Key Drains (col-span-4) */}
        <div className="rounded-2xl border border-blue-100/90 bg-white p-4 shadow-xs xl:col-span-4 dark:border-slate-800 dark:bg-slate-900/90">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <Droplets size={15} className="text-blue-500" />
              <span>Water Level at Key Drains</span>
            </div>
            <button
              type="button"
              onClick={() => setActiveModal('keyDrains')}
              className="text-[11px] font-semibold text-blue-600 hover:underline dark:text-blue-400"
            >
              View All →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-medium text-slate-400 dark:border-slate-800">
                  <th className="pb-1.5">#</th>
                  <th className="pb-1.5">Location / Drain Name</th>
                  <th className="pb-1.5">Current</th>
                  <th className="pb-1.5">Capacity</th>
                  <th className="pb-1.5">Status</th>
                  <th className="pb-1.5 text-center">Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {keyDrains.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400 text-xs">
                      No mapped drainage assets recorded for {currentDistrict.displayName}.
                    </td>
                  </tr>
                ) : (
                  keyDrains.map((d, i) => (
                    <tr
                      key={d.id}
                      onClick={() => setSelectedAsset(d)}
                      className="cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/50"
                    >
                    <td className="py-1.5 text-slate-400 text-[11px]">{i + 1}</td>
                    <td className="py-1.5 font-medium text-slate-900 dark:text-white truncate max-w-[130px]">
                      {d.name}
                    </td>
                    <td className="py-1.5 font-semibold text-slate-700 dark:text-slate-200">
                      {d.currentWaterLevelM} m
                    </td>
                    <td className="py-1.5 text-slate-500 text-[11px]">
                      {d.capacityM} m
                    </td>
                    <td className="py-1.5">
                      <span
                        className={`rounded-sm px-1.5 py-0.5 text-[10px] font-semibold ${
                          d.utilizationPct >= 85
                            ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300'
                            : d.utilizationPct >= 65
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                        }`}
                      >
                        {d.utilizationPct >= 85 ? 'High' : d.utilizationPct >= 65 ? 'Moderate' : 'Normal'}
                      </span>
                    </td>
                    <td className="py-1.5 text-center">
                      {d.trend === 'rising' ? (
                        <ArrowUp size={13} className="inline text-red-500" />
                      ) : d.trend === 'falling' ? (
                        <ArrowDown size={13} className="inline text-emerald-500" />
                      ) : (
                        <ArrowRight size={13} className="inline text-blue-500" />
                      )}
                    </td>
                  </tr>
                )))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Card 3: Drainage Capacity Utilization Doughnut (col-span-2) */}
        <div className="rounded-2xl border border-blue-100/90 bg-white p-4 shadow-xs xl:col-span-2 dark:border-slate-800 dark:bg-slate-900/90">
          <div className="mb-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
            Drainage Capacity Utilization
          </div>

          <div className="flex flex-col items-center justify-center pt-2">
            <div className="relative flex items-center justify-center">
              <svg className="h-24 w-24 -rotate-90 transform">
                <circle
                  cx="48"
                  cy="48"
                  r={radius}
                  stroke="#e2e8f0"
                  strokeWidth="8"
                  fill="transparent"
                  className="dark:stroke-slate-800"
                />
                <circle
                  cx="48"
                  cy="48"
                  r={radius}
                  stroke={avgUtil >= 80 ? '#ef4444' : avgUtil >= 60 ? '#f59e0b' : '#10b981'}
                  strokeWidth="8"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-700 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white leading-none">
                  {avgUtil}%
                </span>
                <span className="text-[9px] font-medium text-slate-400 mt-0.5">
                  Average<br />Utilization
                </span>
              </div>
            </div>

            {/* Legend */}
            <div className="mt-3 w-full space-y-1 text-[10px]">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-red-500" /> &gt; 90%
                </span>
                <span className="font-semibold">{summary.utilizationBuckets.greaterThan90} drains</span>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-orange-500" /> 70 - 90%
                </span>
                <span className="font-semibold">{summary.utilizationBuckets.between70And90} drains</span>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-400" /> 50 - 70%
                </span>
                <span className="font-semibold">{summary.utilizationBuckets.between50And70} drains</span>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" /> &lt; 50%
                </span>
                <span className="font-semibold">{summary.utilizationBuckets.lessThan50} drains</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 4: Drainage Advisory (col-span-3) */}
        <div className="rounded-2xl border border-blue-100/90 bg-white p-4 shadow-xs xl:col-span-3 dark:border-slate-800 dark:bg-slate-900/90">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <AlertCircle size={15} className="text-blue-600" />
              <span>Drainage Advisory</span>
            </div>
            <button
              type="button"
              onClick={() => setActiveModal('advisories')}
              className="text-[11px] font-semibold text-blue-600 hover:underline dark:text-blue-400"
            >
              View All →
            </button>
          </div>

          <div className="space-y-2 text-xs">
            {advisories.slice(0, 4).map((a) => (
              <div
                key={a.id}
                className="flex items-start gap-2 rounded-xl bg-slate-50/70 p-2 dark:bg-slate-800/60"
              >
                {a.type === 'critical' ? (
                  <AlertTriangle size={15} className="mt-0.5 shrink-0 text-red-500" />
                ) : a.type === 'warning' ? (
                  <AlertTriangle size={15} className="mt-0.5 shrink-0 text-amber-500" />
                ) : a.type === 'info' ? (
                  <Info size={15} className="mt-0.5 shrink-0 text-blue-500" />
                ) : (
                  <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-500" />
                )}
                <div className="flex-1">
                  <div className="text-[11px] font-medium leading-tight text-slate-800 dark:text-slate-200">
                    {a.title}
                  </div>
                  <div className="mt-1 text-[9px] text-slate-400">
                    {a.timestamp}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 4. Row 3: Drainage Condition Summary, Recent Inspections, Maintenance Actions ── */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-12">
        {/* Card 1: Drainage Condition Summary Bar Chart (col-span-4) */}
        <div className="rounded-2xl border border-blue-100/90 bg-white p-4 shadow-xs xl:col-span-4 dark:border-slate-800 dark:bg-slate-900/90">
          <div className="mb-2 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Activity size={15} className="text-blue-500" />
            <span>Drainage Condition Summary</span>
          </div>

          <div className="h-44 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={conditionChartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 9, fill: '#64748b' }}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis
                  tick={{ fontSize: 9, fill: '#64748b' }}
                  allowDecimals={false}
                  domain={[0, 20]}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    fontSize: '11px',
                    backgroundColor: '#1e293b',
                    color: '#fff',
                    border: 'none',
                  }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {conditionChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card 2: Recent Drainage Inspections Table (col-span-4) */}
        <div className="rounded-2xl border border-blue-100/90 bg-white p-4 shadow-xs xl:col-span-4 dark:border-slate-800 dark:bg-slate-900/90">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <FileText size={15} className="text-blue-500" />
              <span>Recent Drainage Inspections</span>
            </div>
            <button
              type="button"
              onClick={() => setActiveModal('inspections')}
              className="text-[11px] font-semibold text-blue-600 hover:underline dark:text-blue-400"
            >
              View All →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-medium text-slate-400 dark:border-slate-800">
                  <th className="pb-1.5">#</th>
                  <th className="pb-1.5">Location</th>
                  <th className="pb-1.5">Condition</th>
                  <th className="pb-1.5">Date</th>
                  <th className="pb-1.5">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {assets.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400 text-xs">
                      No inspection reports on record for {currentDistrict.displayName}.
                    </td>
                  </tr>
                ) : (
                  assets.slice(0, 5).map((a, i) => (
                    <tr
                      key={a.id}
                      onClick={() => setSelectedAsset(a)}
                      className="cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/50"
                    >
                      <td className="py-2 text-slate-400 text-[11px]">{i + 1}</td>
                      <td className="py-2 font-medium text-slate-900 dark:text-white truncate max-w-[120px]">
                        {a.name}
                      </td>
                      <td className="py-2">
                        <span
                          className={`rounded-sm px-1.5 py-0.5 text-[10px] font-semibold ${
                            a.condition === 'Good'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : a.condition === 'Moderate'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                              : 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                          }`}
                        >
                          {a.condition.split(' ')[0]}
                        </span>
                      </td>
                      <td className="py-2 text-slate-500 text-[11px] whitespace-nowrap">
                        {a.lastInspectionDate}
                      </td>
                      <td className="py-2">
                        <span
                          className={`rounded-sm px-1.5 py-0.5 text-[10px] font-medium ${
                            a.inspectionAction === 'No action'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                              : a.inspectionAction.includes('Scheduled') || a.inspectionAction.includes('Cleaning')
                              ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                              : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                          }`}
                        >
                          {a.inspectionAction}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Card 3: Maintenance Actions Table (col-span-4) */}
        <div className="rounded-2xl border border-blue-100/90 bg-white p-4 shadow-xs xl:col-span-4 dark:border-slate-800 dark:bg-slate-900/90">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <Wrench size={15} className="text-blue-500" />
              <span>Maintenance Actions</span>
            </div>
            <button
              type="button"
              onClick={() => setActiveModal('maintenance')}
              className="text-[11px] font-semibold text-blue-600 hover:underline dark:text-blue-400"
            >
              View All →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-medium text-slate-400 dark:border-slate-800">
                  <th className="pb-1.5">#</th>
                  <th className="pb-1.5">Task</th>
                  <th className="pb-1.5">Status</th>
                  <th className="pb-1.5">Priority</th>
                  <th className="pb-1.5">Due Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {assets.filter((a) => a.maintenanceTask).length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400 text-xs">
                      No scheduled maintenance actions on record for {currentDistrict.displayName}.
                    </td>
                  </tr>
                ) : (
                  assets
                    .filter((a) => a.maintenanceTask)
                    .slice(0, 5)
                    .map((a, i) => (
                      <tr
                        key={a.id}
                        onClick={() => toggleMaintenanceStatus(a.maintenanceTask?.taskId)}
                        className="cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/50"
                        title="Click to advance status"
                      >
                        <td className="py-2 text-slate-400 text-[11px]">{i + 1}</td>
                        <td className="py-2 font-medium text-slate-900 dark:text-white truncate max-w-[130px]">
                          {a.maintenanceTask?.taskTitle}
                        </td>
                        <td className="py-2">
                          <span
                            className={`rounded-sm px-1.5 py-0.5 text-[10px] font-semibold ${
                              a.maintenanceTask?.status === 'In Progress'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                : a.maintenanceTask?.status === 'Completed'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                            }`}
                          >
                            {a.maintenanceTask?.status}
                          </span>
                        </td>
                        <td className="py-2">
                          <span
                            className={`rounded-sm px-1.5 py-0.5 text-[10px] font-bold ${
                              a.maintenanceTask?.priority === 'High'
                                ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300'
                                : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                            }`}
                          >
                            {a.maintenanceTask?.priority}
                          </span>
                        </td>
                        <td className="py-2 text-slate-500 text-[11px] whitespace-nowrap">
                          {a.maintenanceTask?.dueDate}
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── 5. Row 4: Map (Assets & Issues), Key Drainage Locations, Data Sources & Status ── */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-12">
        {/* Card 1: Drainage Assets & Reported Issues Map (col-span-5) */}
        <div className="rounded-2xl border border-blue-100/90 bg-white p-4 shadow-xs xl:col-span-5 dark:border-slate-800 dark:bg-slate-900/90">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <MapPin size={15} className="text-blue-600" />
              <span>Drainage Assets and Reported Issues</span>
            </div>

            {/* Filter Dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400">Show:</span>
              <select
                value={mapFilter}
                onChange={(e) => setMapFilter(e.target.value as any)}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-semibold text-slate-700 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <option value="All">All Assets</option>
                <option value="Functional">Functional Assets</option>
                <option value="Under Maintenance">Under Maintenance</option>
                <option value="Reported Issue">Reported Issues</option>
              </select>
            </div>
          </div>

          {/* Interactive Map Container */}
          <div className="relative h-60 w-full overflow-hidden rounded-xl border border-slate-100 dark:border-slate-800">
            <div ref={mapContainerRef} className="h-full w-full" />

            {/* Floating Legend Overlay */}
            <div className="absolute bottom-2.5 right-2.5 z-10 rounded-xl border border-slate-200/90 bg-white/95 p-2 shadow-md backdrop-blur-xs text-[10px] space-y-1 dark:border-slate-700 dark:bg-slate-900/95">
              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200">
                <span className="inline-block h-2.5 w-2.5 rounded-xs bg-emerald-500" />
                <span>Functional Asset</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-500" />
                <span>Under Maintenance</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200">
                <span className="inline-block w-0 h-0 border-l-[4px] border-r-[4px] border-b-[8px] border-l-transparent border-r-transparent border-b-red-500" />
                <span>Reported Issue</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Key Drainage Locations (col-span-4) */}
        <div className="rounded-2xl border border-blue-100/90 bg-white p-4 shadow-xs xl:col-span-4 dark:border-slate-800 dark:bg-slate-900/90">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <MapPin size={15} className="text-blue-500" />
              <span>Key Drainage Locations</span>
            </div>
            <button
              type="button"
              onClick={() => setActiveModal('keyLocations')}
              className="text-[11px] font-semibold text-blue-600 hover:underline dark:text-blue-400"
            >
              View All →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-medium text-slate-400 dark:border-slate-800">
                  <th className="pb-1.5">#</th>
                  <th className="pb-1.5">Location</th>
                  <th className="pb-1.5">Asset Type</th>
                  <th className="pb-1.5">Status</th>
                  <th className="pb-1.5">Current Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {keyDrains.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400 text-xs">
                      No mapped drainage locations recorded for {currentDistrict.displayName}.
                    </td>
                  </tr>
                ) : (
                  keyDrains.map((d, i) => (
                    <tr
                      key={d.id}
                      onClick={() => setSelectedAsset(d)}
                      className="cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/50"
                    >
                      <td className="py-2 text-slate-400 text-[11px]">{i + 1}</td>
                      <td className="py-2 font-medium text-slate-900 dark:text-white truncate max-w-[130px]">
                        {d.name}
                      </td>
                      <td className="py-2 text-slate-500 text-[11px]">
                        {d.assetType}
                      </td>
                      <td className="py-2">
                        <span
                          className={`rounded-sm px-1.5 py-0.5 text-[10px] font-semibold ${
                            d.status === 'Functional'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : d.status === 'Under Maintenance'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                              : 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                          }`}
                        >
                          {d.status === 'Functional' ? 'Normal' : d.status === 'Under Maintenance' ? 'Moderate' : 'High'}
                        </span>
                      </td>
                      <td className="py-2 font-semibold text-slate-700 dark:text-slate-200">
                        {d.currentWaterLevelM} m
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Card 3: Data Sources & Status (col-span-3) */}
        <div className="rounded-2xl border border-blue-100/90 bg-white p-4 shadow-xs xl:col-span-3 dark:border-slate-800 dark:bg-slate-900/90">
          <div className="mb-3 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Activity size={15} className="text-blue-500" />
            <span>Data Sources &amp; Status</span>
          </div>

          <div className="space-y-3 text-xs">
            {/* Source 1 */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <Layers size={14} className="mt-0.5 shrink-0 text-blue-500" />
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white text-[11px]">
                    Drainage Asset Inventory
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Department records / Field survey
                  </div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="flex items-center justify-end gap-1 text-[10px] text-slate-500">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span>Last updated</span>
                </div>
                <div className="text-[10px] text-slate-400">18 Aug 2024</div>
              </div>
            </div>

            {/* Source 2 */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <Waves size={14} className="mt-0.5 shrink-0 text-blue-500" />
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white text-[11px]">
                    Water Level Monitoring
                  </div>
                  <div className="text-[10px] text-slate-400">
                    IoT sensors (where available)
                  </div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="flex items-center justify-end gap-1 text-[10px] text-emerald-600 font-semibold dark:text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Live</span>
                </div>
                <div className="text-[10px] text-slate-400">21 Aug 2024, 08:05 AM</div>
              </div>
            </div>

            {/* Source 3 */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <Shield size={14} className="mt-0.5 shrink-0 text-blue-500" />
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white text-[11px]">
                    Citizen Reports
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Mobile/Web application
                  </div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="flex items-center justify-end gap-1 text-[10px] text-emerald-600 font-semibold dark:text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Live</span>
                </div>
                <div className="text-[10px] text-slate-400">21 Aug 2024, 08:10 AM</div>
              </div>
            </div>

            {/* Source 4 */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <Droplets size={14} className="mt-0.5 shrink-0 text-blue-500" />
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white text-[11px]">
                    Weather Data
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Open-Meteo (for rainfall context)
                  </div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="flex items-center justify-end gap-1 text-[10px] text-emerald-600 font-semibold dark:text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Live</span>
                </div>
                <div className="text-[10px] text-slate-400">21 Aug 2024, 08:10 AM</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Asset Details Modal (when marker or table row is clicked) ── */}
      {selectedAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div>
                <div className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                  {selectedAsset.id} · {selectedAsset.assetType}
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {selectedAsset.name}
                </h3>
                <p className="text-xs text-slate-500">{selectedAsset.locality}, {currentDistrict.displayName}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAsset(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-slate-50 p-2.5 dark:bg-slate-800/60">
                  <span className="text-[10px] text-slate-400 block">Current Water Level</span>
                  <span className="text-base font-bold text-slate-900 dark:text-white">
                    {selectedAsset.currentWaterLevelM} m
                  </span>
                  <span className="text-[10px] text-slate-500 ml-1">/ {selectedAsset.capacityM} m max</span>
                </div>
                <div className="rounded-xl bg-slate-50 p-2.5 dark:bg-slate-800/60">
                  <span className="text-[10px] text-slate-400 block">Condition &amp; Status</span>
                  <span className="text-xs font-semibold text-slate-900 dark:text-white">
                    {selectedAsset.condition} ({selectedAsset.status})
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-slate-100 p-3 dark:border-slate-800">
                <div className="font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  Assigned Authority
                </div>
                <div className="text-slate-600 dark:text-slate-400">
                  {selectedAsset.assignedAgency}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Last inspected: {selectedAsset.lastInspectionDate} (Action: {selectedAsset.inspectionAction})
                </div>
              </div>

              {selectedAsset.reportedIssue && (
                <div className="rounded-xl border border-red-200 bg-red-50/60 p-3 text-red-900 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
                  <div className="flex items-center gap-1.5 font-bold mb-1">
                    <AlertTriangle size={14} className="text-red-500" />
                    <span>Reported Blockage / Incident</span>
                  </div>
                  <div>{selectedAsset.reportedIssue.description}</div>
                  <div className="text-[10px] mt-1 text-red-700 dark:text-red-400">
                    Status: {selectedAsset.reportedIssue.verificationStatus} · Reported by {selectedAsset.reportedIssue.reportedBy}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-3 dark:border-slate-800">
              {onNavigateToMap && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedAsset(null);
                    onNavigateToMap();
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-blue-700"
                >
                  <Eye size={14} />
                  <span>View on Flood Map</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedAsset(null)}
                className="ml-auto rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 shadow-xs transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── View All Modals ── */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-xs">
          <div className="flex max-h-[85vh] w-full max-w-3xl flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 p-4 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {activeModal === 'keyDrains' && `All Drains & Water Levels — ${currentDistrict.displayName}`}
                {activeModal === 'advisories' && `All Drainage Advisories — ${currentDistrict.displayName}`}
                {activeModal === 'inspections' && `Complete Inspection Log — ${currentDistrict.displayName}`}
                {activeModal === 'maintenance' && `All Maintenance Tasks — ${currentDistrict.displayName}`}
                {activeModal === 'keyLocations' && `Complete Drainage Asset Inventory — ${currentDistrict.displayName}`}
              </h3>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 text-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-semibold text-slate-400 uppercase tracking-wider dark:border-slate-800">
                      <th className="pb-2">Asset ID</th>
                      <th className="pb-2">Name</th>
                      <th className="pb-2">Type</th>
                      <th className="pb-2">Level / Cap</th>
                      <th className="pb-2">Condition</th>
                      <th className="pb-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {assets.map((a) => (
                      <tr
                        key={a.id}
                        onClick={() => {
                          setActiveModal(null);
                          setSelectedAsset(a);
                        }}
                        className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60"
                      >
                        <td className="py-2.5 font-mono text-[11px] text-blue-600 dark:text-blue-400">
                          {a.id}
                        </td>
                        <td className="py-2.5 font-medium text-slate-900 dark:text-white">
                          {a.name}
                        </td>
                        <td className="py-2.5 text-slate-500">{a.assetType}</td>
                        <td className="py-2.5">
                          {a.currentWaterLevelM} m / {a.capacityM} m
                        </td>
                        <td className="py-2.5">
                          <span
                            className={`rounded-sm px-1.5 py-0.5 text-[10px] font-semibold ${
                              a.condition === 'Good'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : a.condition === 'Moderate'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                : 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                            }`}
                          >
                            {a.condition}
                          </span>
                        </td>
                        <td className="py-2.5">
                          <span
                            className={`rounded-sm px-1.5 py-0.5 text-[10px] font-semibold ${
                              a.status === 'Functional'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : a.status === 'Under Maintenance'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                : 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                            }`}
                          >
                            {a.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="border-t border-slate-100 p-3 text-right dark:border-slate-800">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
