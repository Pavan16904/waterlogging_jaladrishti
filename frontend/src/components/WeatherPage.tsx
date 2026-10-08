import React, { useState, useEffect, useMemo, useRef } from 'react';
import { api } from '../services/api';
import {
  CloudRain, Sun, Wind, Droplets, Calendar, ChevronRight, RefreshCw,
  Thermometer, Waves, Clock, Info, Database, ExternalLink, ChevronDown,
  CloudSun, AlertTriangle, Zap, CheckCircle2, X, Search
} from 'lucide-react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, Tooltip as RechartsTooltip,
  ResponsiveContainer, CartesianGrid, Legend
} from 'recharts';
import { useLanguage } from '../context/LanguageContext';
import { KARNATAKA_31_DISTRICTS_WEATHER, WeatherDistrict } from '../data/karnatakaDistrictsWeather';

/* ── Types ─────────────────────────────────────────────────── */
export interface WeatherTelemetry {
  success: boolean;
  provider: string;
  isCached: boolean;
  isStale: boolean;
  lastUpdated: string;
  timestamp: string;
  today: {
    observationTime: string | null;
    observedRainfallMm: number;
    currentRainRateMm: number;
    currentTempC: number;
    currentHumidityPct: number;
    currentWindKmh: number;
    currentWmoCode: number;
    currentCondition: string;
    currentIcon: string;
  };
  forecast: {
    forecast24hPrecipMm: number;
    forecast48hPrecipMm: number;
    hourlyData: Array<{ time: string; precip: number }>;
    hourlyObservationTime: string | null;
    hourlyForecastTime: string;
  };
  sevenDayOutlook: Array<{
    day: string;
    precip: number;
    maxTemp: number;
    minTemp: number;
    weatherCode: number;
    condition: string;
    hourlyPrecip: number[];
  }>;
  river: {
    name: string;
    levelM: string;
    status: string;
  };
  status: string;
}

/* ── Helpers ────────────────────────────────────────────────── */
function formatKolkataTime(isoOrDate?: string | null): string {
  if (!isoOrDate) return '–';
  try {
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date(isoOrDate));
  } catch { return isoOrDate; }
}

function ageLabel(isoStr: string | null | undefined): string {
  if (!isoStr) return '';
  const diffMs = Date.now() - new Date(isoStr).getTime();
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 2) return 'just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  const h = Math.floor(diffMin / 60);
  return h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`;
}

function riskColor(rain: number): string {
  if (rain >= 65) return 'text-rose-600 dark:text-rose-400';
  if (rain >= 35) return 'text-amber-600 dark:text-amber-400';
  if (rain >= 10) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-emerald-600 dark:text-emerald-400';
}

function riskLabel(rain: number): string {
  if (rain >= 65) return 'Heavy';
  if (rain >= 35) return 'Moderate';
  if (rain >= 10) return 'Light';
  return 'Dry / Trace';
}

/* ── Component ──────────────────────────────────────────────── */
interface WeatherPageProps {
  onNavigateToCropWater?: (district?: any) => void;
  onNavigateToFloodMap?: () => void;
}

export function WeatherPage(_props: WeatherPageProps = {}) {
  const { t } = useLanguage();

  /* district selector */
  const [selectedId, setSelectedId]       = useState<string>('bengaluru_urban');
  const [districtSearch, setDistrictSearch] = useState('');
  const [showDropdown, setShowDropdown]   = useState(false);
  const dropdownRef                        = useRef<HTMLDivElement>(null);

  /* data */
  const [weather, setWeather]     = useState<WeatherTelemetry | null>(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  /* tab */
  const [hourlyTab, setHourlyTab] = useState<'today' | 'tomorrow'>('today');

  /* info modal */
  const [showInfo, setShowInfo] = useState(false);

  /* current time ticker */
  const [nowKolkata, setNowKolkata] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNowKolkata(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  const formattedNow = useMemo(() => new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(nowKolkata), [nowKolkata]);

  /* selected district meta */
  const districtMeta: WeatherDistrict = useMemo(
    () => KARNATAKA_31_DISTRICTS_WEATHER.find(d => d.id === selectedId) || KARNATAKA_31_DISTRICTS_WEATHER[1],
    [selectedId]
  );

  /* filtered list for search */
  const filteredDistricts = useMemo(() =>
    KARNATAKA_31_DISTRICTS_WEATHER.filter(d =>
      d.displayName.toLowerCase().includes(districtSearch.toLowerCase()) ||
      d.name.toLowerCase().includes(districtSearch.toLowerCase())
    ), [districtSearch]
  );

  /* close dropdown on outside click */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* fetch */
  const fetchWeather = async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getDistrictWeather(districtMeta.name, forceRefresh);
      const data = res?.data || res;
      if (data && data.success) {
        setWeather(data as WeatherTelemetry);
        setLastFetch(new Date());
      } else {
        setError(data?.message || 'Weather data unavailable for this district.');
        setWeather(null);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to reach weather service.');
      setWeather(null);
    } finally {
      setLoading(false);
    }
  };

  /* auto-fetch on district change */
  useEffect(() => {
    fetchWeather();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [districtMeta.name]);

  /* auto-refresh every 30 min */
  useEffect(() => {
    const id = setInterval(() => fetchWeather(false), 30 * 60 * 1000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [districtMeta.name]);

  /* hourly chart data */
  const hourlyChartData = useMemo(() => {
    if (!weather?.forecast?.hourlyData) return [];
    const raw = weather.forecast.hourlyData;
    if (hourlyTab === 'today') return raw.slice(0, 24).map(h => ({
      label: h.time.split('T')[1]?.slice(0, 5) || h.time.slice(0, 5),
      precip: h.precip,
    }));
    return raw.slice(24, 48).map(h => ({
      label: h.time.split('T')[1]?.slice(0, 5) || h.time.slice(0, 5),
      precip: h.precip,
    }));
  }, [weather, hourlyTab]);

  /* 7-day outlook */
  const outlook = weather?.sevenDayOutlook || [];

  /* ----- render ----- */
  return (
    <div className="w-full min-h-screen bg-slate-50 dark:bg-slate-950 py-4 px-3 sm:px-4 md:px-6 space-y-4">

      {/* ── Page Title ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <CloudRain className="w-5 h-5 text-blue-500" />
            Weather &amp; Radar
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Live agro-meteorological dashboard · Karnataka, India &nbsp;·&nbsp;
            <span className="font-mono">{formattedNow} IST</span>
          </p>
        </div>

        <button
          onClick={() => fetchWeather(true)}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition disabled:opacity-60"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      {/* ── District Selector ── */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setShowDropdown(s => !s)}
          className="w-full flex items-center justify-between gap-2 px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-sm text-sm font-semibold text-slate-800 dark:text-white hover:border-blue-500 transition"
        >
          <span className="flex items-center gap-2">
            <Sun className="w-4 h-4 text-amber-500 shrink-0" />
            {districtMeta.displayName}
            <span className="text-xs font-normal text-slate-400 truncate hidden sm:inline">
              · {districtMeta.zone}
            </span>
          </span>
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
        </button>

        {showDropdown && (
          <div className="absolute z-50 top-full mt-1 left-0 right-0 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-xl overflow-hidden">
            <div className="p-2 border-b border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-2 px-2 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800">
                <Search className="w-3.5 h-3.5 text-slate-400" />
                <input
                  autoFocus
                  value={districtSearch}
                  onChange={e => setDistrictSearch(e.target.value)}
                  placeholder="Search district…"
                  className="flex-1 bg-transparent text-xs text-slate-800 dark:text-white placeholder:text-slate-400 outline-none"
                />
                {districtSearch && (
                  <button onClick={() => setDistrictSearch('')}>
                    <X className="w-3 h-3 text-slate-400" />
                  </button>
                )}
              </div>
            </div>
            <ul className="max-h-56 overflow-y-auto">
              {filteredDistricts.map(d => (
                <li key={d.id}>
                  <button
                    onClick={() => { setSelectedId(d.id); setShowDropdown(false); setDistrictSearch(''); }}
                    className={`w-full text-left px-4 py-2 text-xs font-medium flex items-center justify-between hover:bg-blue-50 dark:hover:bg-blue-900/20 transition ${d.id === selectedId ? 'text-blue-600 dark:text-blue-400 font-bold bg-blue-50/60 dark:bg-blue-900/10' : 'text-slate-700 dark:text-slate-300'}`}
                  >
                    <span>{d.displayName}</span>
                    <span className="text-[10px] text-slate-400 hidden sm:inline truncate max-w-[160px]">{d.zone}</span>
                  </button>
                </li>
              ))}
              {filteredDistricts.length === 0 && (
                <li className="px-4 py-3 text-xs text-slate-400 text-center">No districts match "{districtSearch}"</li>
              )}
            </ul>
          </div>
        )}
      </div>

      {/* ── Error State ── */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-sm text-rose-700 dark:text-rose-300 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <div>
            <p className="font-bold">Weather data unavailable</p>
            <p className="text-xs mt-0.5">{error}</p>
            <p className="text-xs mt-1 text-rose-500">Source: Open-Meteo European NWP / ECMWF · No cached data to display.</p>
          </div>
        </div>
      )}

      {/* ── Loading skeleton ── */}
      {loading && !weather && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-slate-200 dark:bg-slate-800" />
          ))}
        </div>
      )}

      {weather && (
        <>
          {/* ── Source Banner ── */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-3 py-2 rounded-xl bg-sky-50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-800/40 text-[11px] text-sky-700 dark:text-sky-300">
            <span className="flex items-center gap-1 font-semibold">
              <Database className="w-3 h-3" />
              Source: {weather.provider}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Observation: {weather.today.observationTime || 'Not available'}
            </span>
            <span className="flex items-center gap-1">
              <RefreshCw className="w-3 h-3" />
              Last refreshed: {lastFetch ? formatKolkataTime(lastFetch.toISOString()) : '–'}
              {lastFetch && <span className="text-sky-500">({ageLabel(lastFetch.toISOString())})</span>}
            </span>
            {weather.isStale && (
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold">
                <AlertTriangle className="w-3 h-3" /> Stale data
              </span>
            )}
            {weather.isCached && (
              <span className="text-sky-500">(from cache)</span>
            )}
          </div>

          {/* ── 4 Current Condition KPI Cards ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">

            {/* Observed Rainfall */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-sm space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <CloudRain className="w-4 h-4 text-blue-500" />
                </div>
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 leading-tight">Today's Rainfall<br /><span className="text-[9px] font-normal">(observed)</span></span>
              </div>
              <div>
                <span className={`text-2xl font-black font-mono ${riskColor(weather.today.observedRainfallMm)}`}>
                  {weather.today.observedRainfallMm.toFixed(1)}
                </span>
                <span className="text-xs text-slate-500 ml-1">mm</span>
                <p className={`text-[10px] font-semibold mt-0.5 ${riskColor(weather.today.observedRainfallMm)}`}>
                  {riskLabel(weather.today.observedRainfallMm)}
                </p>
              </div>
            </div>

            {/* Temperature */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-sm space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center">
                  <Thermometer className="w-4 h-4 text-orange-500" />
                </div>
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 leading-tight">Temperature<br /><span className="text-[9px] font-normal">(current)</span></span>
              </div>
              <div>
                <span className="text-2xl font-black font-mono text-orange-600 dark:text-orange-400">
                  {weather.today.currentTempC.toFixed(1)}
                </span>
                <span className="text-xs text-slate-500 ml-1">°C</span>
                <p className="text-[10px] text-slate-400 mt-0.5">{weather.today.currentCondition}</p>
              </div>
            </div>

            {/* Humidity */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-sm space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                  <Droplets className="w-4 h-4 text-cyan-500" />
                </div>
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 leading-tight">Relative Humidity<br /><span className="text-[9px] font-normal">(current)</span></span>
              </div>
              <div>
                <span className="text-2xl font-black font-mono text-cyan-600 dark:text-cyan-400">
                  {weather.today.currentHumidityPct.toFixed(0)}
                </span>
                <span className="text-xs text-slate-500 ml-1">%</span>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {weather.today.currentHumidityPct > 80 ? 'High — waterlogging risk' : weather.today.currentHumidityPct > 60 ? 'Moderate' : 'Comfortable'}
                </p>
              </div>
            </div>

            {/* Wind */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-sm space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <Wind className="w-4 h-4 text-purple-500" />
                </div>
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 leading-tight">Wind Speed<br /><span className="text-[9px] font-normal">(current)</span></span>
              </div>
              <div>
                <span className="text-2xl font-black font-mono text-purple-600 dark:text-purple-400">
                  {weather.today.currentWindKmh.toFixed(1)}
                </span>
                <span className="text-xs text-slate-500 ml-1">km/h</span>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {weather.today.currentWindKmh > 40 ? 'Strong wind' : weather.today.currentWindKmh > 20 ? 'Moderate' : 'Light breeze'}
                </p>
              </div>
            </div>
          </div>

          {/* ── Forecast Highlights ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

            {/* 24h Forecast */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/20 border border-blue-200 dark:border-blue-800/40 shadow-sm space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                <Calendar className="w-3 h-3" />
                Next 24 h Forecast
              </div>
              <p className="text-[9px] text-blue-500/80 dark:text-blue-400/60 font-medium">
                ⚠ Forecast — not an observation
              </p>
              <div className="flex items-end gap-1.5 mt-1">
                <span className={`text-2xl font-black font-mono ${riskColor(weather.forecast.forecast24hPrecipMm)}`}>
                  {weather.forecast.forecast24hPrecipMm.toFixed(1)}
                </span>
                <span className="text-xs text-slate-500 mb-0.5">mm</span>
              </div>
              <p className={`text-[10px] font-semibold ${riskColor(weather.forecast.forecast24hPrecipMm)}`}>
                {riskLabel(weather.forecast.forecast24hPrecipMm)} expected
              </p>
            </div>

            {/* 48h Forecast */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/20 border border-indigo-200 dark:border-indigo-800/40 shadow-sm space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
                <Calendar className="w-3 h-3" />
                Next 48 h Forecast
              </div>
              <p className="text-[9px] text-indigo-500/80 dark:text-indigo-400/60 font-medium">
                ⚠ Forecast — not an observation
              </p>
              <div className="flex items-end gap-1.5 mt-1">
                <span className={`text-2xl font-black font-mono ${riskColor(weather.forecast.forecast48hPrecipMm)}`}>
                  {weather.forecast.forecast48hPrecipMm.toFixed(1)}
                </span>
                <span className="text-xs text-slate-500 mb-0.5">mm</span>
              </div>
              <p className={`text-[10px] font-semibold ${riskColor(weather.forecast.forecast48hPrecipMm)}`}>
                {riskLabel(weather.forecast.forecast48hPrecipMm)} expected
              </p>
            </div>

            {/* River Level */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-950/30 dark:to-emerald-950/20 border border-teal-200 dark:border-teal-800/40 shadow-sm space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wide">
                <Waves className="w-3 h-3" />
                River Level (Reference)
              </div>
              <p className="text-[9px] text-teal-500/80 dark:text-teal-400/60 font-medium">
                District reference — not live gauge data
              </p>
              <p className="text-sm font-bold text-slate-800 dark:text-white mt-1 truncate">
                {weather.river.name}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black font-mono text-teal-600 dark:text-teal-400">
                  {weather.river.levelM}
                </span>
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${weather.river.status === 'Normal' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400'}`}>
                  {weather.river.status}
                </span>
              </div>
            </div>
          </div>

          {/* ── Hourly Precipitation Chart ── */}
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-sm p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <CloudRain className="w-4 h-4 text-blue-500" />
                  Hourly Precipitation
                </h2>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Source: {weather.provider} · Forecast time: {weather.forecast.hourlyForecastTime}
                </p>
              </div>
              <div className="flex rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 text-xs font-bold">
                {(['today', 'tomorrow'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setHourlyTab(tab)}
                    className={`px-3 py-1.5 transition capitalize ${hourlyTab === tab ? 'bg-blue-600 text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {hourlyChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <ComposedChart data={hourlyChartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.3} />
                  <XAxis dataKey="label" tick={{ fontSize: 9 }} interval={3} />
                  <YAxis tick={{ fontSize: 9 }} unit=" mm" />
                  <RechartsTooltip
                    contentStyle={{ fontSize: 11, borderRadius: 10, border: 'none', background: '#1e293b', color: '#f1f5f9' }}
                    formatter={(v: number) => [`${v} mm`, 'Precipitation']}
                  />
                  <Bar dataKey="precip" fill="#3b82f6" fillOpacity={0.8} radius={[3, 3, 0, 0]} name="Precipitation (mm)" />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[180px] flex items-center justify-center text-sm text-slate-400">
                No hourly data available for this period.
              </div>
            )}

            <p className="text-[9px] text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Hourly values shown are forecast projections from {weather.provider}, not direct rain-gauge observations.
            </p>
          </div>

          {/* ── 7-Day Outlook ── */}
          {outlook.length > 0 && (
            <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-sm p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-500" />
                  7-Day Outlook
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30">
                    FORECAST
                  </span>
                </h2>
                <span className="text-[10px] text-slate-400">{districtMeta.displayName}</span>
              </div>

              <div className="grid grid-cols-7 gap-1.5">
                {outlook.slice(0, 7).map((day, i) => (
                  <div
                    key={i}
                    className={`flex flex-col items-center gap-1 p-2 rounded-2xl border transition ${i === 0 ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/40' : 'bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-white/5'}`}
                  >
                    <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 text-center leading-tight truncate w-full text-center">
                      {day.day.split(',')[0]}
                    </span>
                    <span className="text-base">{day.condition.toLowerCase().includes('rain') ? '🌧️' : day.condition.toLowerCase().includes('cloud') ? '⛅' : day.condition.toLowerCase().includes('storm') ? '⛈️' : '☀️'}</span>
                    <span className={`text-[10px] font-black font-mono ${riskColor(day.precip)}`}>
                      {day.precip.toFixed(0)}<span className="text-[8px] font-normal">mm</span>
                    </span>
                    <div className="text-[9px] text-slate-400 text-center">
                      <div>{day.maxTemp}°</div>
                      <div className="text-slate-300 dark:text-slate-600">{day.minTemp}°</div>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-[9px] text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                7-day values are NWP model forecasts from {weather.provider}. Forecasts beyond 3 days carry higher uncertainty.
              </p>
            </div>
          )}

          {/* ── Data Provenance Card ── */}
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-sm p-4 space-y-2">
            <h2 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Info className="w-4 h-4 text-slate-400" />
              Data Sources &amp; Provenance
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5 space-y-1">
                <p className="font-bold text-slate-700 dark:text-slate-200">Weather &amp; Precipitation</p>
                <p className="text-slate-500 dark:text-slate-400">
                  Open-Meteo European NWP / ECMWF<br />
                  Obs. time: {weather.today.observationTime || 'Not available'}<br />
                  Refresh cadence: every 30 minutes<br />
                  Data age: {lastFetch ? ageLabel(lastFetch.toISOString()) : '–'}
                </p>
                <a href="https://open-meteo.com" target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-blue-500 hover:text-blue-600 font-medium mt-1">
                  <ExternalLink className="w-3 h-3" />open-meteo.com
                </a>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5 space-y-1">
                <p className="font-bold text-slate-700 dark:text-slate-200">River Level</p>
                <p className="text-slate-500 dark:text-slate-400">
                  District reference values only — not live sensor data.<br />
                  No real-time river gauge connection available.
                </p>
                <p className="text-amber-600 dark:text-amber-400 font-semibold mt-1">
                  ⚠ Connect to CWC or KSNDMC API for live levels.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
TEST_LINE
