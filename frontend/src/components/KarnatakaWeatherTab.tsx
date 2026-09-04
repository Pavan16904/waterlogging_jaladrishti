import React, { useState } from 'react';
import { 
  CloudRain, 
  Thermometer, 
  Wind, 
  Droplets, 
  Mountain, 
  Search, 
  Filter, 
  ArrowUpRight, 
  Sprout, 
  MapPin, 
  ShieldAlert,
  SunMedium,
  CheckCircle2
} from 'lucide-react';

interface KarnatakaWeatherTabProps {
  districts: Record<string, any>;
  onSelectDistrictForIrrigation: (districtName: string) => void;
  onSelectDistrictForFloodMap: (districtName: string) => void;
}

export const KarnatakaWeatherTab: React.FC<KarnatakaWeatherTabProps> = ({
  districts,
  onSelectDistrictForIrrigation,
  onSelectDistrictForFloodMap
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedZone, setSelectedZone] = useState<string>('All');

  const districtNames = Object.keys(districts);

  // Extract unique agro-climatic zones
  const zones = ['All', 'Coastal Zone (ACZ-10)', 'Hilly Zone (ACZ-9) / Western Ghats', 'Northern Dry Zone (ACZ-3)', 'Southern Dry Zone (ACZ-6)', 'Eastern Dry Zone (ACZ-5)', 'Northern Transition Zone (ACZ-8)'];

  // Filter districts based on search and zone
  const filteredDistricts = districtNames.filter((name) => {
    const data = districts[name];
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          data.primary_crops?.some((c: string) => c.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          data.default_soil?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesZone = selectedZone === 'All' || data.zone?.includes(selectedZone.split(' ')[0]);
    return matchesSearch && matchesZone;
  });

  // Calculate State Averages
  const avgRainfall = Math.round(
    districtNames.reduce((sum, d) => sum + (districts[d]?.annual_rainfall_mm || 850), 0) / Math.max(1, districtNames.length)
  );
  const avgTemp = (
    districtNames.reduce((sum, d) => sum + ((districts[d]?.temp_min_c + districts[d]?.temp_max_c) / 2 || 26), 0) / Math.max(1, districtNames.length)
  ).toFixed(1);

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-semibold text-xs border border-cyan-500/20">
              Statewide Meteorological Intelligence
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-1 text-slate-900 dark:text-white">
            Karnataka Agro-Climatic & Weather Observatory
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time multi-district precipitation, temperature, elevation gradients, and crop water demand across all 31 districts.
          </p>
        </div>

        {/* State Summary Stats */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2.5 rounded-2xl glass-card text-center">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">State Avg Rain</span>
            <span className="text-lg font-extrabold text-cyan-600 dark:text-cyan-400 font-mono">{avgRainfall} mm</span>
          </div>
          <div className="px-4 py-2.5 rounded-2xl glass-card text-center">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">Mean Temp</span>
            <span className="text-lg font-extrabold text-amber-500 font-mono">{avgTemp} °C</span>
          </div>
          <div className="px-4 py-2.5 rounded-2xl glass-card text-center">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">Districts Tracked</span>
            <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">{districtNames.length}</span>
          </div>
        </div>
      </div>

      {/* Search Bar & Zone Filter Pills */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search district, crop (e.g. Ragi, Coffee, Tomato) or soil..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-card text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all"
          />
        </div>

        {/* Zone Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {zones.map((z) => (
            <button
              key={z}
              onClick={() => setSelectedZone(z)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                selectedZone === z
                  ? 'bg-cyan-500 text-white shadow-md font-semibold'
                  : 'glass-card text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {z.split('(')[0].trim()}
            </button>
          ))}
        </div>
      </div>

      {/* District Weather Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredDistricts.map((name) => {
          const dist = districts[name];
          const isHighRain = dist.annual_rainfall_mm >= 1500;
          const isDry = dist.annual_rainfall_mm <= 650;

          return (
            <div
              key={name}
              className="glass-card rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:border-cyan-500/50 hover:shadow-lg transition-all"
            >
              <div className="space-y-3">
                {/* District Title & Agro-Climatic Zone */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-cyan-500 flex-shrink-0" />
                      <span>{name}</span>
                    </h3>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block font-medium">
                      {dist.zone}
                    </span>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      isHighRain
                        ? 'bg-blue-500/15 text-blue-600 dark:text-blue-300 border border-blue-500/30'
                        : isDry
                        ? 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30'
                        : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {isHighRain ? 'Heavy Monsoon' : isDry ? 'Semi-Arid Dry' : 'Moderate Rainfall'}
                  </span>
                </div>

                {/* Weather & Terrain Stats Grid */}
                <div className="grid grid-cols-2 gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-xs">
                  <div className="space-y-0.5">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Thermometer className="w-3.5 h-3.5 text-rose-500" />
                      <span>Temperature</span>
                    </span>
                    <p className="font-bold font-mono text-slate-800 dark:text-slate-200">
                      {dist.temp_min_c}° - {dist.temp_max_c}°C
                    </p>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <CloudRain className="w-3.5 h-3.5 text-blue-500" />
                      <span>Annual Rain</span>
                    </span>
                    <p className="font-bold font-mono text-cyan-600 dark:text-cyan-300">
                      {dist.annual_rainfall_mm} mm
                    </p>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Mountain className="w-3.5 h-3.5 text-amber-500" />
                      <span>Elevation</span>
                    </span>
                    <p className="font-bold font-mono text-slate-800 dark:text-slate-200">
                      {dist.elevation_m} meters
                    </p>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Droplets className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Monsoon Daily</span>
                    </span>
                    <p className="font-bold font-mono text-indigo-600 dark:text-indigo-300">
                      ~{dist.monsoon_rain_daily_avg_mm} mm/d
                    </p>
                  </div>
                </div>

                {/* Dominant Crops & Soil */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-start gap-1">
                    <span className="text-slate-500 dark:text-slate-400 text-[11px] font-medium min-w-[3.5rem]">Soil:</span>
                    <span className="text-slate-700 dark:text-slate-300 font-medium text-[11px]">{dist.default_soil}</span>
                  </div>

                  <div className="flex items-start gap-1">
                    <span className="text-slate-500 dark:text-slate-400 text-[11px] font-medium min-w-[3.5rem]">Crops:</span>
                    <div className="flex flex-wrap gap-1">
                      {dist.primary_crops?.map((c: string) => (
                        <span key={c} className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[10px] font-medium border border-emerald-500/20">
                          {c.split('(')[0].trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => onSelectDistrictForIrrigation(name)}
                  className="flex-1 py-2 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors border border-emerald-500/30"
                >
                  <Sprout className="w-3.5 h-3.5" />
                  <span>Calculate Crop Irrigation</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
