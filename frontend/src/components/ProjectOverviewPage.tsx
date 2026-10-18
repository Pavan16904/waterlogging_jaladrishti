import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertOctagon,
  ArrowUpRight,
  CloudRain,
  Droplets,
  Layers,
  Map as MapIcon,
  RefreshCw,
  ShieldAlert,
  Clock3,
} from 'lucide-react';
import { cellToBoundary } from 'h3-js';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { api } from '../services/api';
import { KARNATAKA_31_DISTRICTS_WEATHER } from '../data/karnatakaDistrictsWeather';
import { SourceTag } from './common/SourceTag';
import { SkeletonLoader } from './common/SkeletonLoader';
import { ErrorBoundary } from './common/ErrorBoundary';

interface ProjectOverviewPageProps {
  onNavigateToFloodMap: () => void;
  onNavigateToWeather?: () => void;
  onNavigateToCropWater?: () => void;
  onNavigateToDrainage?: () => void;
  selectedDistrict?: string;
  scoresKey?: number;
  pollKey?: number;
}

type ApiSource = {
  source: string;
  name?: string;
  status: 'live' | 'stale' | 'not connected' | 'error' | string;
  fetched_at?: string | null;
  age_seconds?: number | null;
  reason?: string;
};

function getAge(source: ApiSource, now: number): number | null {
  if (typeof source.age_seconds === 'number' && Number.isFinite(source.age_seconds)) {
    return Math.max(0, source.age_seconds);
  }
  if (!source.fetched_at) return null;
  const time = new Date(source.fetched_at).getTime();
  return Number.isFinite(time) ? Math.max(0, Math.floor((now - time) / 1000)) : null;
}

function formatAge(seconds: number | null): string {
  if (seconds === null) return 'Age unavailable';
  if (seconds < 60) return `${seconds} sec`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min`;
  return `${Math.floor(seconds / 3600)} h ${Math.floor((seconds % 3600) / 60)} min`;
}

function statusStyle(status: string) {
  switch (status.toLowerCase()) {
    case 'live': return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300';
    case 'stale': return 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300';
    case 'not connected': return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300';
    default: return 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300';
  }
}

function riskColor(riskClass: string): string {
  switch (riskClass.toLowerCase()) {
    case 'severe': return '#e74c3c';
    case 'high': return '#f39c12';
    case 'moderate': return '#f4d03f';
    default: return '#2ecc71';
  }
}

function RiskMapPreview({ hexes, onOpen }: { hexes: any[]; onOpen: () => void }) {
  const polygons = useMemo(() => {
    const cells = hexes.flatMap((hex) => {
      try {
        return [{ hex, points: cellToBoundary(hex.h3_index) }];
      } catch {
        return [];
      }
    });
    if (!cells.length) return [];
    const allPoints = cells.flatMap(({ points }) => points);
    const lngs = allPoints.map((point) => point[1]);
    const lats = allPoints.map((point) => point[0]);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const lngPad = Math.max((maxLng - minLng) * 0.08, 0.03);
    const latPad = Math.max((maxLat - minLat) * 0.08, 0.03);
    const width = maxLng - minLng + lngPad * 2 || 1;
    const height = maxLat - minLat + latPad * 2 || 1;
    return cells.map(({ hex, points }) => ({
      id: hex.h3_index,
      color: riskColor(hex.risk_class || ''),
      risk: hex.risk_class,
      score: Number(hex.risk_score),
      points: points.map(([lat, lng]) => `${((lng - minLng + lngPad) / width) * 640},${((maxLat + latPad - lat) / height) * 320}`).join(' '),
    }));
  }, [hexes]);

  return (
    <button type="button" onClick={onOpen} aria-label="Open flood map preview of highest-risk cells" className="group relative block h-[300px] w-full overflow-hidden rounded-xl border border-[#e5ebf3] bg-[#edf3f8] text-left dark:border-slate-700 dark:bg-[#0b1220] md:h-[380px]">
      <svg viewBox="0 0 640 320" className="h-full w-full" role="img" aria-label="Map preview showing latest highest-risk H3 cells">
        <defs><pattern id="overview-grid" width="28" height="28" patternUnits="userSpaceOnUse"><path d="M 28 0 L 0 0 0 28" fill="none" stroke="#a9bacb" strokeOpacity=".24" strokeWidth="1" /></pattern></defs>
        <rect width="640" height="320" fill="url(#overview-grid)" />
        {polygons.map((polygon) => <polygon key={polygon.id} points={polygon.points} fill={polygon.color} fillOpacity=".7" stroke="#fff" strokeWidth="1.2"><title>{`${polygon.risk} · score ${Number.isFinite(polygon.score) ? polygon.score.toFixed(1) : '—'}`}</title></polygon>)}
        {!polygons.length && <text x="320" y="160" textAnchor="middle" className="fill-slate-500 text-sm">No scored H3 locations available</text>}
      </svg>
      <div className="absolute left-3 top-3 rounded-lg border border-white/80 bg-white/90 px-3 py-2 text-xs font-semibold text-slate-700 shadow dark:border-slate-700 dark:bg-[#111a2b]/90 dark:text-slate-200">
        Latest highest-risk H3 cells
      </div>
      <div className="absolute bottom-3 left-3 flex flex-wrap gap-2 rounded-lg border border-white/80 bg-white/90 px-3 py-2 text-[10px] text-slate-600 shadow dark:border-slate-700 dark:bg-[#111a2b]/90 dark:text-slate-300">
        {([['Severe', '#e74c3c'], ['High', '#f39c12'], ['Moderate', '#f4d03f'], ['Low', '#2ecc71']] as const).map(([label, color]) => <span key={label} className="inline-flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: color }} />{label}</span>)}
      </div>
      <span className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-lg bg-[#1d6fd8] px-3 py-2 text-xs font-semibold text-white opacity-90 group-hover:opacity-100">Open full map <ArrowUpRight className="h-3.5 w-3.5" /></span>
    </button>
  );
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-[14px] border border-[#e5ebf3] bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-[#111a2b] md:p-5 ${className}`}>{children}</section>;
}

export const ProjectOverviewPage: React.FC<ProjectOverviewPageProps> = ({
  onNavigateToFloodMap,
  onNavigateToWeather,
  onNavigateToDrainage,
  selectedDistrict = 'Ballari',
  scoresKey = 0,
  pollKey = 0,
}) => {
  const [summary, setSummary] = useState<any>(null);
  const [status, setStatus] = useState<any>(null);
  const [weather, setWeather] = useState<any>(null);
  const [advisory, setAdvisory] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [now, setNow] = useState(Date.now());
  const selectedDistrictData = useMemo(() => {
    const normalized = selectedDistrict.toLocaleLowerCase().trim();
    return KARNATAKA_31_DISTRICTS_WEATHER.find((district) =>
      district.id.toLocaleLowerCase() === normalized ||
      district.displayName.toLocaleLowerCase() === normalized ||
      district.name.toLocaleLowerCase() === normalized
    ) || KARNATAKA_31_DISTRICTS_WEATHER[0];
  }, [selectedDistrict]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 15_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    const reportError = (key: string, cause: unknown) => {
      const message = cause instanceof Error ? cause.message : String(cause);
      console.warn(`Overview ${key} refresh failed; retaining the last good response:`, message);
      if (mounted) setErrors((previous) => ({ ...previous, [key]: message }));
    };
    const fetchPart = async (key: string, request: Promise<any>, update: (value: any) => void) => {
      try {
        const response = await request;
        if (response?.success === false) throw new Error(response.message || response.reason || `${key} is unavailable.`);
        if (mounted) {
          update(response);
          setErrors((previous) => {
            const next = { ...previous };
            delete next[key];
            return next;
          });
        }
      } catch (cause) {
        reportError(key, cause);
      }
    };

    void Promise.all([
      fetchPart('scores', api.getWaterlogSummary(), setSummary),
      fetchPart('source status', api.getPipelineStatus(), setStatus),
      fetchPart('weather forecast', api.getWeatherByDistrictId(selectedDistrictData.id), setWeather),
      fetchPart('district advisory', api.getDrainageActions(selectedDistrictData.id), setAdvisory),
    ]).finally(() => {
      if (mounted) setLoading(false);
    });
    return () => { mounted = false; };
  }, [selectedDistrictData.id, scoresKey, pollKey]);

  const kpis = summary?.kpis;
  const sources: ApiSource[] = Array.isArray(status?.sources) ? status.sources : [];
  const weatherSource = sources.find((source) => source.source === 'open_meteo');
  const observedSource = sources.find((source) => source.source === 'nasa_gpm');
  const riverSource = sources.find((source) => source.source === 'cwc_india_wris');
  const activeAdvisory = advisory?.actions?.[0];
  const hourly = Array.isArray(weather?.hourly) ? weather.hourly : [];
  const rainfallTrend = hourly.slice(0, 24).map((point: any) => ({
    time: new Date(point.time).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit' }),
    rainfall: typeof point.precipitation_mm === 'number' ? point.precipitation_mm : null,
  }));
  const hasRainfall = rainfallTrend.some((point: any) => point.rainfall !== null);
  const fields = [
    { label: 'Observed rainfall', source: observedSource },
    { label: 'Forecast rainfall', source: weatherSource },
    { label: 'River level', source: riverSource },
  ];

  const kpiItems = [
    { label: 'Severe', value: kpis?.severe_hectares, color: 'text-red-600 dark:text-red-300', source: kpis?.area_source_tag },
    { label: 'Moderate', value: kpis?.moderate_hectares, color: 'text-amber-600 dark:text-amber-300', source: kpis?.area_source_tag },
    { label: 'Low', value: kpis?.low_hectares, color: 'text-emerald-600 dark:text-emerald-300', source: kpis?.area_source_tag },
    { label: 'Monitored area', value: kpis?.monitored_hectares, color: 'text-slate-800 dark:text-slate-100', source: kpis?.monitored_source_tag },
  ];

  return (
    <ErrorBoundary fallbackTitle="Overview Dashboard Interrupted">
      <div className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-4 p-4 md:gap-5 md:p-6">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div><h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 md:text-2xl">Karnataka Waterlogging Overview</h1><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Live decision support · {selectedDistrictData.displayName} selected · 31 districts monitored</p></div>
          <button type="button" onClick={() => window.dispatchEvent(new Event('jd-overview-refresh'))} className="inline-flex items-center gap-2 rounded-lg border border-[#e5ebf3] bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-[#111a2b] dark:text-slate-200 dark:hover:bg-slate-800"><RefreshCw className="h-4 w-4" />Refresh</button>
        </header>

        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-900 dark:bg-blue-950/40">
          <div className="flex items-start gap-2"><ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-[#1d6fd8]" /><div><p className="text-sm font-semibold text-blue-950 dark:text-blue-100">{activeAdvisory?.title || 'No active advisory from a verified source.'}</p><p className="mt-0.5 text-xs text-blue-800 dark:text-blue-300">{activeAdvisory?.reason || 'Source-driven advisories will appear here when available.'}</p></div></div>
          <div className="flex items-center gap-2">{activeAdvisory && <SourceTag source={activeAdvisory.source_tag?.source || 'JalaDrishti Rule-Based Action Matrix'} label="model" fetched_at={activeAdvisory.source_tag?.fetched_at} />}{onNavigateToDrainage && <button type="button" onClick={onNavigateToDrainage} className="text-xs font-semibold text-[#1d6fd8] hover:underline">Drainage actions <ArrowUpRight className="inline h-3.5 w-3.5" /></button>}</div>
        </div>

        {Object.keys(errors).length > 0 && <p role="status" className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">Some API refreshes failed; the last successfully fetched values remain visible. {Object.keys(errors).join(', ')}</p>}

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <Card>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div><h2 className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-slate-100"><MapIcon className="h-4 w-4 text-[#1d6fd8]" />Flood-risk map preview</h2><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Highest-risk H3 cells from the latest score summary.</p></div>
                <SourceTag source="waterlog_hex_scores" label="model" fetched_at={summary?.fetched_at} />
              </div>
              {loading && !summary ? <SkeletonLoader height="380px" width="100%" /> : <RiskMapPreview hexes={summary?.top_attention_hexes || []} onOpen={onNavigateToFloodMap} />}
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400"><span>Model valid time: {summary?.valid_time ? new Date(summary.valid_time).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST' : 'Unavailable'}</span><button type="button" onClick={onNavigateToFloodMap} className="font-semibold text-[#1d6fd8] hover:underline">Open interactive map <ArrowUpRight className="inline h-3.5 w-3.5" /></button></div>
            </Card>

            <Card>
              <div className="mb-3 flex items-center justify-between gap-2"><div><h2 className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-slate-100"><CloudRain className="h-4 w-4 text-sky-600" />Rainfall trend · model</h2><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Hourly Open-Meteo precipitation · {selectedDistrictData.displayName}</p></div>{onNavigateToWeather && <button type="button" onClick={onNavigateToWeather} className="text-xs font-semibold text-[#1d6fd8] hover:underline">Weather details <ArrowUpRight className="inline h-3.5 w-3.5" /></button>}</div>
              {hasRainfall ? <div className="h-48 w-full"><ResponsiveContainer width="100%" height="100%"><LineChart data={rainfallTrend} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke="#dbe4ee" /><XAxis dataKey="time" tick={{ fontSize: 10 }} minTickGap={26} /><YAxis tick={{ fontSize: 10 }} unit=" mm" /><Tooltip formatter={(value) => [`${value ?? '—'} mm`, 'Model rainfall']} /><Line type="monotone" dataKey="rainfall" stroke="#1d6fd8" strokeWidth={2} dot={false} connectNulls={false} /></LineChart></ResponsiveContainer></div> : <div className="flex h-48 items-center justify-center text-sm text-slate-500">Forecast rainfall trend unavailable.</div>}
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400"><span>Observed rainfall: {observedSource?.status === 'live' ? 'connected' : 'not connected'}</span><SourceTag source={weatherSource?.name || 'Open-Meteo Forecast'} label="model" fetched_at={weatherSource?.fetched_at || weather?.source_tag?.fetched_at} /></div>
            </Card>
          </div>

          <aside className="space-y-4">
            <Card>
              <h2 className="mb-3 text-sm font-bold text-slate-900 dark:text-slate-100">Waterlogging area</h2>
              <div className="space-y-3">
                {kpiItems.map((item) => <div key={item.label} className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3 last:border-0 last:pb-0 dark:border-slate-800"><div><p className="text-xs font-medium text-slate-500 dark:text-slate-400">{item.label}</p><p className={`mt-0.5 font-mono text-xl font-bold tabular-nums ${item.color}`}>{typeof item.value === 'number' ? `${item.value.toLocaleString('en-IN')} ha` : loading ? '—' : 'Unavailable'}</p></div><Layers className="h-4 w-4 shrink-0 text-slate-400" /></div>)}
              </div>
              <div className="mt-3 border-t border-slate-100 pt-3 dark:border-slate-800"><SourceTag source={kpis?.area_source_tag?.source || 'waterlog_hex_scores'} label="model" fetched_at={kpis?.area_source_tag?.fetched_at || summary?.fetched_at} /></div>
            </Card>

            <Card>
              <div className="mb-3 flex items-center gap-2"><Droplets className="h-4 w-4 text-sky-600" /><h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Field data status</h2></div>
              <div className="space-y-2">
                {fields.map(({ label, source }) => {
                  const sourceStatus = source?.status || 'error';
                  const age = source ? getAge(source, now) : null;
                  return <div key={label} className="rounded-lg border border-[#e5ebf3] p-3 dark:border-slate-700"><div className="flex items-center justify-between gap-2"><span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{label}</span><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ${statusStyle(sourceStatus)}`}>{sourceStatus}</span></div><p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">{source?.name || source?.reason || 'Status unavailable'}</p><p className="mt-1 font-mono text-[10px] text-slate-400">{source?.fetched_at ? `${formatAge(age)} · ${new Date(source.fetched_at).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' })} IST` : source?.reason || 'Not connected'}</p></div>;
                })}
              </div>
            </Card>

            <Card>
              <div className="mb-3 flex items-center gap-2"><Clock3 className="h-4 w-4 text-[#1d6fd8]" /><h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">Data freshness</h2></div>
              {sources.length ? <div className="space-y-2">{sources.map((source) => <div key={source.source} className="flex items-center justify-between gap-2 text-xs"><span className="min-w-0 truncate text-slate-600 dark:text-slate-300">{source.name || source.source}</span><span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ${statusStyle(source.status)}`}>{source.status} · {formatAge(getAge(source, now))}</span></div>)}</div> : <p className="text-xs text-slate-500">Source freshness unavailable.</p>}
              <div className="mt-3 border-t border-slate-100 pt-3 dark:border-slate-800"><SourceTag source="/api/status" label="model" fetched_at={status?.timestamp} /></div>
            </Card>
          </aside>
        </div>
        <footer className="mt-auto border-t border-[#e5ebf3] pt-4 text-center text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">Decision support, not an official alert.</footer>
      </div>
    </ErrorBoundary>
  );
};
