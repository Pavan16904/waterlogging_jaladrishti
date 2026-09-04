import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  CloudSun, 
  CloudRain, 
  Sun, 
  Wind, 
  Droplets, 
  Search, 
  MapPin, 
  AlertTriangle, 
  ShieldCheck, 
  Calendar, 
  ChevronRight, 
  RefreshCw, 
  Sprout, 
  Zap, 
  Thermometer, 
  TrendingUp, 
  Info,
  Layers,
  Compass,
  Gauge,
  Sparkles
} from 'lucide-react';
import { 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar 
} from 'recharts';
import { motion } from 'framer-motion';

interface WeatherPageProps {
  onNavigateToCropWater: (district: string) => void;
  onNavigateToFloodMap: () => void;
}

export const WeatherPage: React.FC<WeatherPageProps> = ({
  onNavigateToCropWater,
  onNavigateToFloodMap
}) => {
  const [selectedDistrict, setSelectedDistrict] = useState<string>('Bengaluru Urban');
  const [districtData, setDistrictData] = useState<any>(null);
  const [allDistrictsSummary, setAllDistrictsSummary] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedZone, setSelectedZone] = useState<string>('All');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  useEffect(() => {
    loadAllDistrictsSummary();
  }, []);

  useEffect(() => {
    loadDistrictForecast(selectedDistrict);
  }, [selectedDistrict]);

  const loadDistrictForecast = async (district: string) => {
    setIsRefreshing(true);
    try {
      const data = await api.getDistrictWeather(district);
      setDistrictData(data);
    } catch (err) {
      console.error('Failed to load district weather forecast:', err);
    } finally {
      setIsRefreshing(false);
      setIsLoading(false);
    }
  };

  const loadAllDistrictsSummary = async () => {
    try {
      const list = await api.getAllDistrictsWeather();
      setAllDistrictsSummary(list || []);
    } catch (err) {
      console.error('Failed to load all districts weather summary:', err);
    }
  };

  const renderWeatherIcon = (iconName: string, sizeClass = 'w-10 h-10') => {
    switch (iconName) {
      case 'sun':
        return <Sun className={`${sizeClass} text-amber-500 animate-spin-slow`} />;
      case 'cloud-rain':
      case 'cloud-heavy-rain':
      case 'cloud-drizzle':
        return <CloudRain className={`${sizeClass} text-sky-500`} />;
      case 'cloud-lightning':
      case 'zap':
        return <Zap className={`${sizeClass} text-purple-500`} />;
      default:
        return <CloudSun className={`${sizeClass} text-amber-400`} />;
    }
  };

  const zones = [
    { label: 'All Districts', value: 'All' },
    { label: '🌊 Coastal', value: 'Coastal' },
    { label: '⛰️ Malnad / Ghats', value: 'Hilly' },
    { label: '🌾 Eastern Dry', value: 'Eastern Dry' },
    { label: '🌾 Southern Dry', value: 'Southern Dry' },
    { label: '🌾 Northern Dry', value: 'Northern Dry' },
    { label: '🌿 Transition', value: 'Transition' }
  ];

  const filteredDistricts = allDistrictsSummary.filter((d) => {
    const matchesQuery = d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.primaryCrops?.some((c: string) => c.toLowerCase().includes(searchQuery.toLowerCase())) ||
      d.zone?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesZone = selectedZone === 'All' || d.zone?.includes(selectedZone);
    return matchesQuery && matchesZone;
  });

  const chartData = districtData?.forecast?.map((day: any) => ({
    day: day.dayOfWeek,
    rain: day.precipitationMm,
    maxTemp: day.tempMaxC,
    minTemp: day.tempMinC,
    et0: day.et0MmDay
  })) || [];

  return (
    <div className="flex-1 w-full overflow-y-auto pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        
        {/* Spacious Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-2 border-b border-slate-200/80 dark:border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full badge-cyan text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-500 animate-ping"></span>
                Open-Meteo High-Resolution Live Stream
              </span>
              <span className="text-xs text-slate-400 font-semibold hidden sm:inline">&bull; 10-Day NWP Forecast & Atmospheric Water Demand</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white mt-2">
              Karnataka Agro-Weather Observatory
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
              Real-time numerical weather prediction, precipitation hazard alerts, and reference crop evapotranspiration (ET₀) across all 31 districts.
            </p>
          </div>

          {/* District Switcher & Live Refresh */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl surface-card text-xs">
              <MapPin className="w-4 h-4 text-cyan-500 shrink-0" />
              <span className="font-bold text-slate-400 uppercase tracking-wider hidden sm:inline">District:</span>
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="bg-transparent text-sm font-black text-slate-900 dark:text-white focus:outline-none cursor-pointer pr-2 max-w-[220px] truncate"
              >
                {allDistrictsSummary.map((d) => (
                  <option key={d.name} value={d.name} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => loadDistrictForecast(selectedDistrict)}
              disabled={isRefreshing}
              className="p-3 rounded-2xl surface-card text-slate-600 dark:text-slate-300 hover:text-cyan-500 transition-colors shadow-sm active:scale-95"
              title="Refresh Live Data"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-cyan-500' : ''}`} />
            </button>
          </div>
        </div>

        {/* Apple Weather-Grade Hero Card */}
        {districtData && (
          <div className="rounded-3xl surface-card p-6 sm:p-8 space-y-8 shadow-2xl relative overflow-hidden border border-slate-200/80 dark:border-white/10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
              
              {/* Left Column: Temperature & Condition */}
              <div className="space-y-4 lg:border-r border-slate-200 dark:border-white/10 lg:pr-8">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20 uppercase tracking-wider">
                    {districtData.zone}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">Elevation: {districtData.elevation_m}m</span>
                </div>

                <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                  {districtData.district}
                </h2>

                <div className="flex items-center gap-5">
                  <div className="p-4 rounded-3xl bg-cyan-500/10 border border-cyan-500/20 shadow-inner">
                    {renderWeatherIcon(districtData.forecast?.[0]?.icon || 'cloud-sun', 'w-14 h-14')}
                  </div>
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl sm:text-6xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
                        {Math.round(districtData.forecast?.[0]?.tempMaxC || 30)}°
                      </span>
                      <span className="text-slate-400 text-xl font-bold">/ {Math.round(districtData.forecast?.[0]?.tempMinC || 20)}°C</span>
                    </div>
                    <span className="text-sm font-extrabold text-slate-700 dark:text-slate-300 block mt-1">
                      {districtData.forecast?.[0]?.condition || 'Partly Cloudy'}
                    </span>
                  </div>
                </div>

                {/* Regional Primary Crops */}
                <div className="pt-2">
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block mb-2">
                    Prevalent Agro-Crops:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {districtData.primaryCrops?.map((crop: string) => (
                      <span
                        key={crop}
                        onClick={() => onNavigateToCropWater(districtData.district)}
                        className="px-3 py-1 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold cursor-pointer transition-colors border border-emerald-500/20 shadow-sm"
                        title="Calculate precision water requirements"
                      >
                        {crop}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Middle Column: 4 Clean Gauge Cards */}
              <div className="grid grid-cols-2 gap-3.5 lg:px-2">
                <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/5 space-y-1">
                  <span className="text-[11px] text-slate-400 uppercase tracking-wider font-bold block">10-Day Total Rain</span>
                  <span className="text-2xl sm:text-3xl font-black text-cyan-600 dark:text-cyan-400 font-mono">
                    {districtData.tenDaySummary?.totalRainMm} mm
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-1">
                    Mean: ~{districtData.tenDaySummary?.avgDailyRainMm} mm/day
                  </span>
                </div>

                <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/5 space-y-1">
                  <span className="text-[11px] text-slate-400 uppercase tracking-wider font-bold block">Today's ET₀ Evap</span>
                  <span className="text-2xl sm:text-3xl font-black text-amber-500 font-mono">
                    {districtData.forecast?.[0]?.et0MmDay || 4.2} mm
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-1">
                    Hargreaves reference
                  </span>
                </div>

                <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/5 space-y-1">
                  <span className="text-[11px] text-slate-400 uppercase tracking-wider font-bold block">Precip Probability</span>
                  <span className="text-2xl sm:text-3xl font-black text-blue-500 font-mono">
                    {districtData.forecast?.[0]?.precipitationProbabilityPct || 10}%
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-1">Rainfall likelihood</span>
                </div>

                <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/5 space-y-1">
                  <span className="text-[11px] text-slate-400 uppercase tracking-wider font-bold block">Wind Speed</span>
                  <span className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-slate-200 font-mono">
                    {districtData.forecast?.[0]?.windSpeedKmH || 12} km/h
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-1">Foliar spray safe</span>
                </div>
              </div>

              {/* Right Column: Farmer Field Advice & Actions */}
              <div className="space-y-4 lg:pl-2">
                <div className="p-5 rounded-3xl border shadow-md space-y-2" style={{
                  backgroundColor: districtData.tenDaySummary?.floodRisk === 'Critical' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16, 185, 129, 0.08)',
                  borderColor: districtData.tenDaySummary?.floodColor || '#10b981'
                }}>
                  <div className="flex items-center gap-2 font-black text-xs" style={{ color: districtData.tenDaySummary?.floodColor }}>
                    {districtData.tenDaySummary?.floodRisk === 'Critical' ? <AlertTriangle className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                    <span>{districtData.tenDaySummary?.floodRisk} Waterlogging Risk Alert</span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                    {districtData.tenDaySummary?.floodAdvice}
                  </p>
                </div>

                <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-white/5 space-y-1.5">
                  <span className="text-[11px] font-black uppercase tracking-wider text-sky-500 block">
                    Today's Farmer Field Guidance:
                  </span>
                  <p className="text-xs text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                    {districtData.forecast?.[0]?.farmerAdvice || 'Favorable conditions for routine weeding, foliar spraying, and field tilling.'}
                  </p>
                </div>

                <button
                  onClick={() => onNavigateToCropWater(districtData.district)}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-xs transition-all shadow-lg shadow-emerald-500/25 active:scale-95"
                >
                  <Sprout className="w-4 h-4" />
                  <span>Calculate Crop Water Need for {districtData.district}</span>
                </button>
              </div>
            </div>

            {/* 10-Day Horizontal Daily Forecast Carousel */}
            <div className="pt-6 border-t border-slate-200 dark:border-white/10 space-y-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-4 h-4 text-cyan-500" />
                <span>10-Day Meteorological Progression (Daily Precipitation & Reference Evaporation)</span>
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-3">
                {districtData.forecast?.map((day: any, idx: number) => (
                  <div
                    key={day.date}
                    className={`p-3.5 rounded-2xl border text-center transition-all card-interactive ${
                      idx === 0
                        ? 'bg-cyan-500/10 border-cyan-500/30 shadow-md ring-2 ring-cyan-500/20'
                        : 'bg-white/80 dark:bg-slate-900/70 border-slate-200 dark:border-white/5'
                    }`}
                  >
                    <span className="text-xs font-black text-slate-900 dark:text-slate-200 block">
                      {idx === 0 ? 'Today' : day.dayOfWeek}
                    </span>
                    <span className="text-[10px] text-slate-400 block mb-2">{day.formattedDate}</span>

                    <div className="my-2 flex justify-center">
                      {renderWeatherIcon(day.icon, 'w-8 h-8')}
                    </div>

                    <span className="text-xs font-black text-slate-900 dark:text-white font-mono block">
                      {Math.round(day.tempMaxC)}° <span className="text-slate-400 text-[10px] font-normal">/ {Math.round(day.tempMinC)}°</span>
                    </span>

                    <div className="mt-2.5 pt-2 border-t border-slate-200/80 dark:border-white/5 text-[11px] space-y-0.5">
                      <span className="text-cyan-600 dark:text-cyan-400 font-black font-mono block">
                        {day.precipitationMm > 0 ? `${day.precipitationMm} mm` : '0 mm'}
                      </span>
                      <span className="text-slate-400 text-[10px] block">
                        ET₀: {day.et0MmDay} mm
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 10-Day Rainfall & Evaporation Graph */}
            <div className="pt-6 border-t border-slate-200 dark:border-white/10 space-y-3">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-500" />
                <span>10-Day Precipitation Loading vs Reference Evapotranspiration Curve</span>
              </h3>
              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                    <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} fontStyle="bold" />
                    <YAxis stroke="#94a3b8" fontSize={11} unit="mm" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0e1322', borderColor: '#334155', borderRadius: '1rem', color: '#fff', fontSize: '11px' }}
                    />
                    <Bar dataKey="rain" name="Rainfall (mm)" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="et0" name="ET₀ Evaporation Need (mm)" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Statewide 31 Karnataka Districts Table / Directory */}
        <div className="space-y-5 pt-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                Statewide 31-District Meteorological Observatory
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Select any district to inspect 10-day rainfall projections, root-zone moisture threat, and crop advice.
              </p>
            </div>

            {/* Search Box */}
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search district or crop..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl surface-card text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </div>

          {/* Zone Filter Chips */}
          <div className="flex flex-wrap gap-2">
            {zones.map((z) => (
              <button
                key={z.value}
                onClick={() => setSelectedZone(z.value)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedZone === z.value
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md'
                    : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-white'
                }`}
              >
                {z.label}
              </button>
            ))}
          </div>

          {/* Directory Grid of Districts */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDistricts.map((d) => (
              <div
                key={d.name}
                onClick={() => {
                  setSelectedDistrict(d.name);
                  window.scrollTo({ top: 120, behavior: 'smooth' });
                }}
                className={`p-5 rounded-3xl surface-card card-interactive cursor-pointer space-y-3.5 border ${
                  selectedDistrict === d.name
                    ? 'border-cyan-500 ring-2 ring-cyan-500/30 shadow-xl'
                    : 'border-slate-200/80 dark:border-white/10'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
                      <span>{d.name}</span>
                      {selectedDistrict === d.name && (
                        <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(14,165,233,0.8)]"></span>
                      )}
                    </h3>
                    <span className="text-xs text-slate-400 block mt-0.5">{d.zone}</span>
                  </div>
                  
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                    d.floodRisk === 'Critical'
                      ? 'badge-rose'
                      : d.floodRisk === 'Moderate'
                      ? 'badge-amber'
                      : 'badge-emerald'
                  }`}>
                    {d.floodRisk} Threat
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-2xl border border-slate-200/60 dark:border-white/5">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block">7-Day Rain</span>
                    <span className="font-bold text-cyan-600 dark:text-cyan-400 font-mono text-sm">{d.sevenDayRainMm} mm</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block">Temp Max</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 font-mono text-sm">{d.todayTempMax}°C</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block">ET₀ (Evap)</span>
                    <span className="font-bold text-amber-500 font-mono text-sm">{d.todayEt0} mm</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-white/5 text-slate-400">
                  <span className="truncate max-w-[200px]">Crops: {d.primaryCrops?.slice(0, 2).join(', ')}...</span>
                  <span className="text-cyan-600 dark:text-cyan-400 font-extrabold flex items-center gap-0.5">
                    Inspect <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
