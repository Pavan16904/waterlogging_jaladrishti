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
  Gauge
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
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

  // Load statewide district summary and initial 10-day forecast
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

  // Weather icon renderer
  const renderWeatherIcon = (iconName: string, sizeClass = 'w-8 h-8') => {
    switch (iconName) {
      case 'sun':
        return <Sun className={`${sizeClass} text-amber-500`} />;
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
    { label: '🌾 NE Dry', value: 'North Eastern' },
    { label: '🌿 Transition', value: 'Transition' }
  ];

  // Filter districts list
  const filteredDistricts = allDistrictsSummary.filter((d) => {
    const matchesQuery = d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.primaryCrops?.some((c: string) => c.toLowerCase().includes(searchQuery.toLowerCase())) ||
      d.zone?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesZone = selectedZone === 'All' || d.zone?.includes(selectedZone);
    return matchesQuery && matchesZone;
  });

  // Chart data for 10-day rainfall and ET0
  const chartData = districtData?.forecast?.map((day: any) => ({
    day: day.dayOfWeek,
    rain: day.precipitationMm,
    maxTemp: day.tempMaxC,
    minTemp: day.tempMinC,
    et0: day.et0MmDay
  })) || [];

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 max-w-7xl mx-auto w-full pb-20">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold text-xs border border-sky-500/20 shadow-sm flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sky-500 animate-ping"></span>
              Live Open-Meteo High-Resolution Stream
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white mt-2">
            Karnataka Agro-Weather Observatory
          </h2>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time 10-day precipitation forecasts, temperature regimes, and atmospheric water demand (ET₀) across all 31 districts.
          </p>
        </div>

        {/* Quick District Selector & Refresh */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl glass-card border border-slate-200 dark:border-slate-700/60 shadow-sm text-xs">
            <MapPin className="w-4 h-4 text-cyan-500" />
            <span className="text-slate-500 dark:text-slate-400 font-medium">District:</span>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="bg-transparent text-sm font-bold text-slate-900 dark:text-white focus:outline-none cursor-pointer"
            >
              {allDistrictsSummary.map((d) => (
                <option key={d.name} value={d.name} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                  {d.name} ({d.zone?.split('(')[0] || 'Karnataka'})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => loadDistrictForecast(selectedDistrict)}
            disabled={isRefreshing}
            className="p-3 rounded-2xl glass-card text-slate-600 dark:text-slate-300 hover:text-cyan-500 transition-colors shadow-sm"
            title="Refresh Live Data"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-cyan-500' : ''}`} />
          </button>
        </div>
      </div>

      {/* Selected District Deep-Dive Hero Card */}
      {districtData && (
        <div className="rounded-3xl glass-card p-6 md:p-8 border border-slate-200 dark:border-slate-700/80 shadow-2xl relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            {/* Left: Current Weather Condition */}
            <div className="space-y-4 lg:border-r border-slate-200 dark:border-slate-800 lg:pr-6">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/20">
                  {districtData.zone}
                </span>
                <span className="text-xs text-slate-400 font-mono">Elev: {districtData.elevation_m}m</span>
              </div>

              <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {districtData.district}
              </h3>

              <div className="flex items-center gap-5">
                <div className="p-3.5 rounded-2xl bg-cyan-500/15 border border-cyan-500/20 shadow-inner">
                  {renderWeatherIcon(districtData.forecast?.[0]?.icon || 'cloud-sun', 'w-12 h-12')}
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black text-slate-900 dark:text-white font-mono">
                      {Math.round(districtData.forecast?.[0]?.tempMaxC || 30)}°
                    </span>
                    <span className="text-slate-400 text-lg font-medium">/ {Math.round(districtData.forecast?.[0]?.tempMinC || 20)}°C</span>
                  </div>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300 block mt-0.5">
                    {districtData.forecast?.[0]?.condition || 'Partly Cloudy'}
                  </span>
                </div>
              </div>

              {/* Crops grown */}
              <div className="pt-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Prevalent Regional Crops:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {districtData.primaryCrops?.map((crop: string) => (
                    <span
                      key={crop}
                      onClick={() => onNavigateToCropWater(districtData.district)}
                      className="px-3 py-1 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold cursor-pointer transition-colors border border-emerald-500/20"
                      title="Calculate water requirements for this crop"
                    >
                      {crop}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Middle: Key Meteorological Gauges */}
            <div className="space-y-3 lg:px-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/50 card-hover">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-semibold">10-Day Total Rain</span>
                  <span className="text-2xl font-black text-cyan-600 dark:text-cyan-400 font-mono">
                    {districtData.tenDaySummary?.totalRainMm} mm
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Mean ~{districtData.tenDaySummary?.avgDailyRainMm} mm/day
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/50 card-hover">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-semibold">Today's ET₀ Evap</span>
                  <span className="text-2xl font-black text-amber-500 font-mono">
                    {districtData.forecast?.[0]?.et0MmDay || 4.2} mm
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Hargreaves reference need
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/50 card-hover">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-semibold">Precip Probability</span>
                  <span className="text-xl font-black text-blue-500 font-mono">
                    {districtData.forecast?.[0]?.precipitationProbabilityPct || 10}%
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Likelihood of rainfall</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/50 card-hover">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-semibold">Wind Speed</span>
                  <span className="text-xl font-black text-slate-700 dark:text-slate-200 font-mono">
                    {districtData.forecast?.[0]?.windSpeedKmH || 12} km/h
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Foliar spraying safe</span>
                </div>
              </div>
            </div>

            {/* Right: Farmer Plain-Language Advisory & Actions */}
            <div className="space-y-4 lg:pl-2">
              <div className="p-4 rounded-2xl border shadow-sm" style={{
                backgroundColor: districtData.tenDaySummary?.floodRisk === 'Critical' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16, 185, 129, 0.08)',
                borderColor: districtData.tenDaySummary?.floodColor || '#10b981'
              }}>
                <div className="flex items-center gap-2 font-bold text-xs" style={{ color: districtData.tenDaySummary?.floodColor }}>
                  {districtData.tenDaySummary?.floodRisk === 'Critical' ? <AlertTriangle className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                  <span>{districtData.tenDaySummary?.floodRisk} Waterlogging & Inundation Threat</span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 mt-1.5 leading-relaxed font-medium">
                  {districtData.tenDaySummary?.floodAdvice}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400 block mb-1">
                  Today's Farmer Field Guidance:
                </span>
                <p className="text-xs text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                  {districtData.forecast?.[0]?.farmerAdvice || 'Favorable conditions for field operations.'}
                </p>
              </div>

              <button
                onClick={() => onNavigateToCropWater(districtData.district)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs transition-all shadow-md"
              >
                <Sprout className="w-4 h-4" />
                <span>Calculate Crop Water Need for {districtData.district}</span>
              </button>
            </div>
          </div>

          {/* 10-Day Horizontal Daily Forecast Cards with Temperature Bars */}
          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-cyan-500" />
              <span>10-Day Meteorological Progression (Daily Rainfall & Evapotranspiration)</span>
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2.5">
              {districtData.forecast?.map((day: any, idx: number) => (
                <div
                  key={day.date}
                  className={`p-3 rounded-2xl border text-center transition-all card-hover ${
                    idx === 0
                      ? 'bg-cyan-500/10 dark:bg-cyan-500/15 border-cyan-500/30'
                      : 'bg-white/60 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50'
                  }`}
                >
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                    {idx === 0 ? 'Today' : day.dayOfWeek}
                  </span>
                  <span className="text-[10px] text-slate-400 block mb-2">{day.formattedDate}</span>

                  <div className="my-2 flex justify-center">
                    {renderWeatherIcon(day.icon, 'w-7 h-7')}
                  </div>

                  <span className="text-xs font-extrabold text-slate-900 dark:text-white font-mono block">
                    {Math.round(day.tempMaxC)}° <span className="text-slate-400 text-[10px]">/ {Math.round(day.tempMinC)}°</span>
                  </span>

                  <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/40 text-[10px] space-y-0.5">
                    <span className="text-cyan-600 dark:text-cyan-400 font-bold block">
                      {day.precipitationMm > 0 ? `${day.precipitationMm} mm` : '0 mm'}
                    </span>
                    <span className="text-slate-400 text-[9px] block">
                      ET₀: {day.et0MmDay} mm
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 10-Day Rainfall & Evaporation Graph */}
          <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-cyan-500" />
              <span>10-Day Precipitation Loading vs Reference Evaporation Curve</span>
            </h4>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="day" stroke="#94a3b8" fontSize={10} />
                  <YAxis stroke="#94a3b8" fontSize={10} unit="mm" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#fff', fontSize: '11px' }}
                  />
                  <Bar dataKey="rain" name="Rainfall (mm)" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="et0" name="ET₀ Water Need (mm)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Statewide All 31 Karnataka Districts Table / Directory */}
      <div className="space-y-4 pt-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">
              Statewide 31-District Meteorological Observatory
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select any district to inspect 10-day rainfall projections and flood safety status.
            </p>
          </div>

          {/* Search */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search district or crop..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-2xl glass-card text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
        </div>

        {/* Zone Filter Chips */}
        <div className="flex flex-wrap gap-1.5">
          {zones.map(z => (
            <button
              key={z.value}
              onClick={() => setSelectedZone(z.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                selectedZone === z.value
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {z.label}
            </button>
          ))}
        </div>

        {/* Directory Grid of Districts */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredDistricts.map((d) => (
            <div
              key={d.name}
              onClick={() => {
                setSelectedDistrict(d.name);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`p-4 rounded-2xl glass-card border transition-all cursor-pointer card-hover ${
                selectedDistrict === d.name
                  ? 'border-cyan-500 ring-2 ring-cyan-500/20 shadow-md'
                  : 'border-slate-200 dark:border-slate-700/60'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>{d.name}</span>
                    {selectedDistrict === d.name && (
                      <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
                    )}
                  </h4>
                  <span className="text-[10px] text-slate-400 block">{d.zone}</span>
                </div>
                
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  d.floodRisk === 'Critical'
                    ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                    : d.floodRisk === 'Moderate'
                    ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                    : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                }`}>
                  {d.floodRisk} Threat
                </span>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[11px] bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl">
                <div>
                  <span className="text-[9px] text-slate-400 block">7-Day Rain</span>
                  <span className="font-bold text-cyan-600 dark:text-cyan-400 font-mono">{d.sevenDayRainMm} mm</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 block">Temp Max</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">{d.todayTempMax}°C</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 block">ET₀ (Evap)</span>
                  <span className="font-bold text-amber-500 font-mono">{d.todayEt0} mm</span>
                </div>
              </div>

              <div className="mt-2.5 flex items-center justify-between text-[10px] text-slate-400">
                <span className="truncate max-w-[200px]">Crops: {d.primaryCrops?.slice(0, 2).join(', ')}...</span>
                <span className="text-cyan-600 dark:text-cyan-400 font-semibold flex items-center gap-0.5">
                  Inspect <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
