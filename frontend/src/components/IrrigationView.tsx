import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { FAO56IrrigationResult } from '../types';
import { 
  Sprout, 
  Droplet, 
  Thermometer, 
  Calendar, 
  Layers, 
  CheckCircle2, 
  AlertCircle, 
  Info,
  TrendingDown,
  MapPin,
  Sparkles,
  CloudRain,
  Sliders,
  ChevronRight
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceLine 
} from 'recharts';

interface IrrigationViewProps {
  districts: Record<string, any>;
  initialDistrict?: string;
}

export const IrrigationView: React.FC<IrrigationViewProps> = ({
  districts,
  initialDistrict = 'Bengaluru Urban'
}) => {
  const [crops, setCrops] = useState<string[]>([]);
  const [categories, setCategories] = useState<Record<string, string[]>>({});
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [soils, setSoils] = useState<string[]>([]);
  
  const [selectedDistrict, setSelectedDistrict] = useState<string>(initialDistrict);
  const [selectedCrop, setSelectedCrop] = useState<string>('Finger Millet (Ragi - Karnataka Staple)');
  const [daysSincePlanting, setDaysSincePlanting] = useState<number>(45);
  const [selectedSoil, setSelectedSoil] = useState<string>('Red Sandy Loam (Karnataka Plains)');
  const [tempMin, setTempMin] = useState<number>(19.5);
  const [tempMax, setTempMax] = useState<number>(31.0);
  const [recentRain, setRecentRain] = useState<number>(0.0);
  const [depletionMm, setDepletionMm] = useState<number>(18.0);
  const [fieldAreaHa, setFieldAreaHa] = useState<number>(2.5);

  const [result, setResult] = useState<FAO56IrrigationResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    loadCatalogs();
  }, []);

  useEffect(() => {
    if (initialDistrict && districts[initialDistrict]) {
      handleDistrictChange(initialDistrict);
    }
  }, [initialDistrict, districts]);

  const loadCatalogs = async () => {
    try {
      const catalog = await api.getCropCatalog();
      setCrops(catalog.crops || []);
      setCategories(catalog.categories || {});
      setSoils(catalog.soils || []);
      if (catalog.crops && catalog.crops.length > 0 && !selectedCrop) {
        setSelectedCrop(catalog.crops[0]);
      }
    } catch (err) {
      console.error('Failed to load crop catalog:', err);
    }
  };

  const handleDistrictChange = (distName: string) => {
    setSelectedDistrict(distName);
    const dist = districts[distName];
    if (dist) {
      setTempMin(dist.temp_min_c);
      setTempMax(dist.temp_max_c);
      setSelectedSoil(dist.default_soil);
      if (dist.primary_crops && dist.primary_crops.length > 0) {
        setSelectedCrop(dist.primary_crops[0]);
      }
    }
  };

  useEffect(() => {
    if (selectedCrop) {
      handleCalculate();
    }
  }, [selectedDistrict, selectedCrop, daysSincePlanting, selectedSoil, tempMin, tempMax, recentRain, depletionMm, fieldAreaHa]);

  const handleCalculate = async () => {
    setIsLoading(true);
    try {
      const data = await api.calculateIrrigation({
        cropName: selectedCrop,
        daysSincePlanting,
        soilType: selectedSoil,
        districtName: selectedDistrict,
        tempMinC: tempMin,
        tempMaxC: tempMax,
        recentRainfallMm: recentRain,
        currentDepletionMm: depletionMm,
        latitudeDeg: districts[selectedDistrict]?.latitude || 12.97,
        fieldAreaHa
      });
      setResult(data);
    } catch (err) {
      console.error('Failed to compute irrigation advisory:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCrops = selectedCategory === 'All'
    ? crops
    : categories[selectedCategory] || crops;

  const currentDistrictData = districts[selectedDistrict];

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold text-xs border border-emerald-500/20">
              FAO-56 Standard Evapotranspiration
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-1 text-slate-900 dark:text-white">
            Karnataka Crop Water Requirement & Precision Irrigation Engine
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Dynamic soil water balance modeling preventing waterlogging hypoxia & crop drought stress across Karnataka.
          </p>
        </div>

        {/* Action Status Badge */}
        {result && (
          <div className="flex items-center gap-3">
            <div className="px-4 py-2.5 rounded-2xl glass-card text-center border-l-4" style={{ borderColor: result.urgency_color }}>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">Advisory Status</span>
              <span className="text-base font-extrabold tracking-wide uppercase font-mono" style={{ color: result.urgency_color }}>
                {result.irrigation_status}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Main Grid: Left Controls & Right Real-Time Water Budget Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Input Form (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* 1. District Selection Card */}
          <div className="glass-card rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-cyan-500" />
                <span>1. Select Karnataka District</span>
              </span>
              {currentDistrictData && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-medium">
                  {currentDistrictData.elevation_m}m elev
                </span>
              )}
            </div>

            <select
              value={selectedDistrict}
              onChange={(e) => handleDistrictChange(e.target.value)}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              {Object.keys(districts).map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>

            {currentDistrictData && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                <span className="font-medium text-slate-700 dark:text-slate-300">Zone:</span> {currentDistrictData.zone} • Normal Rain: {currentDistrictData.annual_rainfall_mm}mm
              </p>
            )}
          </div>

          {/* 2. Crop Selection & Category Tabs */}
          <div className="glass-card rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Sprout className="w-4 h-4 text-emerald-500" />
                <span>2. Select Crop Variety ({crops.length}+ Crops)</span>
              </span>
            </div>

            {/* Category Pills */}
            <div className="flex flex-wrap gap-1.5 pb-1">
              {['All', ...Object.keys(categories)].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                    selectedCategory === cat
                      ? 'bg-emerald-500 text-white font-semibold shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <select
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-bold text-emerald-600 dark:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {filteredCrops.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            {/* Days Slider */}
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-sky-500" />
                  <span>Days Since Planting:</span>
                </span>
                <span className="font-mono text-emerald-500 font-bold text-sm">{daysSincePlanting} days</span>
              </div>
              <input
                type="range"
                min={5}
                max={140}
                value={daysSincePlanting}
                onChange={(e) => setDaysSincePlanting(parseInt(e.target.value, 10))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>Transplant (0d)</span>
                <span>Mid-Season (60d)</span>
                <span>Harvest (120d+)</span>
              </div>
            </div>
          </div>

          {/* 3. Soil & Field Parameters */}
          <div className="glass-card rounded-2xl p-5 space-y-4">
            <span className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-500" />
              <span>3. Soil Texture & Field Area</span>
            </span>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Soil Taxonomy:</label>
                <select
                  value={selectedSoil}
                  onChange={(e) => setSelectedSoil(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200"
                >
                  {soils.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Field Area (Hectares):</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="50"
                    value={fieldAreaHa}
                    onChange={(e) => setFieldAreaHa(parseFloat(e.target.value) || 1.0)}
                    className="w-full py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-slate-800 dark:text-slate-200"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Current Depletion (mm):</label>
                  <input
                    type="number"
                    value={depletionMm}
                    onChange={(e) => setDepletionMm(parseFloat(e.target.value) || 0)}
                    className="w-full py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-amber-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Calculations & Hydro-Agro Charts (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Key Water Budget Metrics */}
          {result && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              <div className="glass-card rounded-2xl p-4 space-y-1">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">Daily Need (ET_c)</span>
                <p className="text-xl font-extrabold text-cyan-600 dark:text-cyan-400 font-mono">
                  {result.etc_crop_water_need_mm_day} <span className="text-xs font-sans text-slate-400">mm/d</span>
                </p>
                <p className="text-[10px] text-slate-400">ET₀ ({result.et0_reference_mm_day}) × K_c ({result.crop_coefficient_kc})</p>
              </div>

              <div className="glass-card rounded-2xl p-4 space-y-1">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">Stress Limit (RAW)</span>
                <p className="text-xl font-extrabold text-amber-500 font-mono">
                  {result.raw_readily_available_water_mm} <span className="text-xs font-sans text-slate-400">mm</span>
                </p>
                <p className="text-[10px] text-slate-400">TAW: {result.taw_total_available_water_mm} mm</p>
              </div>

              <div className="glass-card rounded-2xl p-4 space-y-1">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">Depletion Level</span>
                <p className="text-xl font-extrabold text-rose-500 font-mono">
                  {result.depletion_percentage_raw.toFixed(0)}% <span className="text-xs font-sans text-slate-400">RAW</span>
                </p>
                <p className="text-[10px] text-slate-400">{result.current_depletion_mm} mm extracted</p>
              </div>

              <div className="glass-card rounded-2xl p-4 space-y-1">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">Water Needed</span>
                <p className="text-xl font-extrabold text-purple-500 font-mono">
                  {result.required_water_volume_m3} <span className="text-xs font-sans text-slate-400">m³</span>
                </p>
                <p className="text-[10px] text-slate-400">Gross: {result.recommended_gross_mm} mm</p>
              </div>
            </div>
          )}

          {/* 7-Day Soil Moisture Forecast Chart */}
          {result?.forecast_7day && (
            <div className="glass-card rounded-2xl p-5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <span className="font-bold text-sm text-slate-900 dark:text-white">
                  7-Day Soil Moisture Depletion vs RAW Stress Limit
                </span>
                <span className="text-[11px] text-rose-500 font-medium">
                  Threshold Line = {result.raw_readily_available_water_mm} mm
                </span>
              </div>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={result.forecast_7day} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="depletionGradView" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.6}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="day" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '12px',
                        fontSize: '12px',
                        color: '#ffffff'
                      }}
                    />
                    <ReferenceLine y={result.raw_readily_available_water_mm} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'RAW Stress Trigger', fill: '#ef4444', fontSize: 11 }} />
                    <Area type="monotone" dataKey="projected_depletion_mm" name="Depletion (mm)" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#depletionGradView)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Action Recommendation Card */}
          {result && (
            <div className="glass-card rounded-2xl p-5 border-l-4 border-emerald-500 space-y-2">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                <Info className="w-4 h-4 flex-shrink-0" />
                <span>Agronomic Advisory & Water Application Guidance</span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
                {result.advisory_summary}
              </p>
              <div className="pt-2 flex flex-wrap items-center gap-4 text-[11px] text-slate-500 dark:text-slate-400">
                <span>Growth Phase: <strong className="text-slate-800 dark:text-slate-200">{result.growth_stage}</strong></span>
                <span>•</span>
                <span>Crop Category: <strong className="text-slate-800 dark:text-slate-200">{result.crop_category}</strong></span>
                <span>•</span>
                <span>Soil Reserve Duration: <strong className="text-slate-800 dark:text-slate-200">~{Math.max(0, Math.round((result.raw_readily_available_water_mm - result.current_depletion_mm) / Math.max(0.5, result.etc_crop_water_need_mm_day)))} days</strong></span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
