import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { FAO56IrrigationResult } from '../types';
import { 
  X, 
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
  CloudRain
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

interface IrrigationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const IrrigationModal: React.FC<IrrigationModalProps> = ({ isOpen, onClose }) => {
  const [crops, setCrops] = useState<string[]>([]);
  const [categories, setCategories] = useState<Record<string, string[]>>({});
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [soils, setSoils] = useState<string[]>([]);
  const [districts, setDistricts] = useState<Record<string, any>>({});
  
  const [selectedDistrict, setSelectedDistrict] = useState<string>('Bengaluru Urban');
  const [selectedCrop, setSelectedCrop] = useState<string>('Tomato');
  const [daysSincePlanting, setDaysSincePlanting] = useState<number>(45);
  const [selectedSoil, setSelectedSoil] = useState<string>('Red Sandy Loam (Karnataka Plains)');
  const [tempMin, setTempMin] = useState<number>(19.5);
  const [tempMax, setTempMax] = useState<number>(31.0);
  const [recentRain, setRecentRain] = useState<number>(0.0);
  const [depletionMm, setDepletionMm] = useState<number>(14.0);
  const [fieldAreaHa, setFieldAreaHa] = useState<number>(2.0);

  const [result, setResult] = useState<FAO56IrrigationResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Fetch Crop & Karnataka District Catalogs on mount
  useEffect(() => {
    if (isOpen) {
      loadCatalogs();
    }
  }, [isOpen]);

  const loadCatalogs = async () => {
    try {
      const catalog = await api.getCropCatalog();
      setCrops(catalog.crops || []);
      setCategories(catalog.categories || {});
      setSoils(catalog.soils || []);
      setDistricts(catalog.karnataka_districts || {});
      if (catalog.crops && catalog.crops.length > 0 && !selectedCrop) {
        setSelectedCrop(catalog.crops[0]);
      }
    } catch (err) {
      console.error('Failed to load crop/district catalogs:', err);
    }
  };

  // When District changes, auto-populate local agro-climatic defaults
  const handleDistrictChange = (distName: string) => {
    setSelectedDistrict(distName);
    const dist = districts[distName];
    if (dist) {
      setTempMin(dist.temp_min_c);
      setTempMax(dist.temp_max_c);
      setSelectedSoil(dist.default_soil);
    }
  };

  // Re-run calculation on parameter change
  useEffect(() => {
    if (isOpen && selectedCrop) {
      handleCalculate();
    }
  }, [isOpen, selectedDistrict, selectedCrop, daysSincePlanting, selectedSoil, tempMin, tempMax, recentRain, depletionMm, fieldAreaHa]);

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

  if (!isOpen) return null;

  // Filter crops by active category
  const filteredCrops = selectedCategory === 'All'
    ? crops
    : categories[selectedCategory] || crops;

  const currentDistrictData = districts[selectedDistrict];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="glass-panel-glow w-full max-w-5xl rounded-2xl border border-slate-700/80 shadow-2xl flex flex-col overflow-hidden max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-3.5 border-b border-slate-700/80 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Sprout className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>FAO-56 Crop Water Requirement & Irrigation Engine</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                  30+ Crops • All Karnataka Agro-Climatic Zones
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Precision soil-water balance modeling based on FAO Irrigation and Drainage Paper 56 standards
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          {/* Section 1: Karnataka District Weather & Agro-Climatic Profile */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-700/80 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-slate-200 text-xs">Karnataka District Agro-Climatic Zone & Weather</span>
              </div>
              {currentDistrictData && (
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 font-medium">
                    {currentDistrictData.zone}
                  </span>
                  <span className="text-slate-400 font-mono">
                    Elev: {currentDistrictData.elevation_m}m • Rain: {currentDistrictData.annual_rainfall_mm}mm/yr
                  </span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              {/* District Dropdown */}
              <div className="space-y-1">
                <label className="text-slate-400 font-semibold">Select Karnataka District (31 Covered):</label>
                <select
                  value={selectedDistrict}
                  onChange={(e) => handleDistrictChange(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 font-medium focus:ring-1 focus:ring-cyan-500"
                >
                  {Object.keys(districts).map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {/* Temperature Range */}
              <div className="space-y-1">
                <label className="text-slate-400 font-semibold flex items-center gap-1">
                  <Thermometer className="w-3.5 h-3.5 text-rose-400" />
                  <span>District Temperature (°C)</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={tempMin}
                    onChange={(e) => setTempMin(parseFloat(e.target.value))}
                    className="w-16 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-center font-mono font-bold text-cyan-300"
                  />
                  <span className="text-slate-500">to</span>
                  <input
                    type="number"
                    value={tempMax}
                    onChange={(e) => setTempMax(parseFloat(e.target.value))}
                    className="w-16 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-center font-mono font-bold text-rose-300"
                  />
                  <span className="text-slate-400">°C</span>
                </div>
              </div>

              {/* District Recommended Primary Crops */}
              <div className="space-y-1">
                <label className="text-slate-400 font-semibold">Dominant District Crops:</label>
                <div className="flex flex-wrap gap-1">
                  {currentDistrictData?.primary_crops?.slice(0, 3).map((c: string) => (
                    <button
                      key={c}
                      onClick={() => setSelectedCrop(c)}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[10px] border border-slate-700 transition-colors"
                    >
                      {c.split('(')[0].trim()}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Crop Category Filters & Crop Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-slate-300 font-bold flex items-center gap-1.5">
                <Sprout className="w-4 h-4 text-emerald-400" />
                <span>Select Crop ({crops.length} Agricultural & Horticultural Varieties)</span>
              </label>
              
              {/* Category Pills */}
              <div className="flex flex-wrap gap-1">
                {['All', ...Object.keys(categories)].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-all ${
                      selectedCategory === cat
                        ? 'bg-emerald-500 text-white font-semibold'
                        : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Crop Selector Dropdown & Field Parameters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
              <div className="space-y-1">
                <label className="text-slate-400 font-semibold">Active Crop Variety:</label>
                <select
                  value={selectedCrop}
                  onChange={(e) => setSelectedCrop(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-emerald-300 font-semibold focus:ring-1 focus:ring-emerald-500"
                >
                  {filteredCrops.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Days Since Planting Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-slate-400 font-semibold">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-sky-400" />
                    <span>Days Since Planting</span>
                  </span>
                  <span className="font-mono text-emerald-400 font-bold">{daysSincePlanting} days</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={140}
                  value={daysSincePlanting}
                  onChange={(e) => setDaysSincePlanting(parseInt(e.target.value, 10))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>

              {/* Soil Type Dropdown */}
              <div className="space-y-1">
                <label className="text-slate-400 font-semibold flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-amber-400" />
                  <span>Soil Taxonomy</span>
                </label>
                <select
                  value={selectedSoil}
                  onChange={(e) => setSelectedSoil(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 font-medium focus:ring-1 focus:ring-emerald-500 text-[11px]"
                >
                  {soils.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Field Area Ha */}
              <div className="space-y-1">
                <label className="text-slate-400 font-semibold flex items-center gap-1">
                  <Droplet className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Field Area (Hectares)</span>
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="50"
                  value={fieldAreaHa}
                  onChange={(e) => setFieldAreaHa(parseFloat(e.target.value) || 1.0)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 font-medium font-mono focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Moisture Conditions & Irrigation Action Badge */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1">
              <span className="text-slate-400 text-[11px] font-medium flex items-center gap-1">
                <CloudRain className="w-3.5 h-3.5 text-blue-400" />
                <span>Recent Rainfall (24h)</span>
              </span>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  value={recentRain}
                  onChange={(e) => setRecentRain(parseFloat(e.target.value) || 0)}
                  className="w-20 bg-slate-900 border border-slate-700 rounded px-2 py-1 font-mono font-bold text-blue-300"
                />
                <span className="text-slate-400">mm</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1">
              <span className="text-slate-400 text-[11px] font-medium flex items-center gap-1">
                <TrendingDown className="w-3.5 h-3.5 text-amber-400" />
                <span>Current Root Depletion</span>
              </span>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  value={depletionMm}
                  onChange={(e) => setDepletionMm(parseFloat(e.target.value) || 0)}
                  className="w-20 bg-slate-900 border border-slate-700 rounded px-2 py-1 font-mono font-bold text-amber-300"
                />
                <span className="text-slate-400">mm</span>
              </div>
            </div>

            {/* Growth Stage Summary */}
            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex flex-col justify-between">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Active Growth Stage</span>
              <p className="font-bold text-emerald-300 text-xs line-clamp-1">{result?.growth_stage || 'Calculating...'}</p>
              <p className="text-[10px] text-slate-400 font-mono">Crop K_c factor: {result?.crop_coefficient_kc}</p>
            </div>

            {/* Irrigation Decision Status */}
            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 flex flex-col justify-between">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Irrigation Action</span>
              <div className="flex items-center gap-2">
                <span
                  className="px-2.5 py-1 rounded-lg font-bold text-xs uppercase tracking-wider text-white shadow-md"
                  style={{ backgroundColor: result?.urgency_color || '#10b981' }}
                >
                  {result?.irrigation_status || 'ANALYZING'}
                </span>
              </div>
            </div>
          </div>

          {/* Section 4: Dynamic Agro-Hydrological Metrics */}
          {result && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                <span className="text-slate-400 text-[10px]">Reference ET₀</span>
                <p className="text-lg font-extrabold text-cyan-300 font-mono">{result.et0_reference_mm_day} mm/d</p>
                <p className="text-[9px] text-slate-500">Hargreaves atmospheric demand</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                <span className="text-slate-400 text-[10px]">Crop Water Need (ET_c)</span>
                <p className="text-lg font-extrabold text-sky-300 font-mono">{result.etc_crop_water_need_mm_day} mm/d</p>
                <p className="text-[9px] text-slate-500">ET₀ × K_c ({result.crop_coefficient_kc})</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                <span className="text-slate-400 text-[10px]">Stress Threshold (RAW)</span>
                <p className="text-lg font-extrabold text-amber-300 font-mono">{result.raw_readily_available_water_mm} mm</p>
                <p className="text-[9px] text-slate-500">Total Available TAW: {result.taw_total_available_water_mm} mm</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                <span className="text-slate-400 text-[10px]">Depletion Level</span>
                <p className="text-lg font-extrabold text-rose-300 font-mono">{result.depletion_percentage_raw.toFixed(0)}% RAW</p>
                <p className="text-[9px] text-slate-500">{result.current_depletion_mm} mm extracted</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                <span className="text-slate-400 text-[10px]">Application Volume</span>
                <p className="text-lg font-extrabold text-purple-300 font-mono">{result.required_water_volume_m3} m³</p>
                <p className="text-[9px] text-slate-500">Gross: {result.recommended_gross_mm} mm for {result.field_area_ha} ha</p>
              </div>
            </div>
          )}

          {/* Section 5: 7-Day Soil Moisture Forecast Chart */}
          {result?.forecast_7day && (
            <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200 text-xs">
                  7-Day Projected Soil Moisture Depletion vs RAW Stress Limit ({selectedDistrict} • {selectedCrop})
                </span>
                <span className="text-[10px] text-amber-400 font-medium">
                  Red Line = Crop Water Stress Threshold ({result.raw_readily_available_water_mm} mm)
                </span>
              </div>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={result.forecast_7day} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="depletionGrad2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.6}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="day" stroke="#64748b" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '8px',
                        fontSize: '11px'
                      }}
                    />
                    <ReferenceLine y={result.raw_readily_available_water_mm} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'RAW Limit', fill: '#f87171', fontSize: 10 }} />
                    <Area type="monotone" dataKey="projected_depletion_mm" name="Depletion (mm)" stroke="#f59e0b" fillOpacity={1} fill="url(#depletionGrad2)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Agronomic Summary Card */}
          {result && (
            <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/40 flex items-start gap-3">
              <Info className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <h5 className="font-bold text-emerald-300 text-xs">Agronomic Irrigation Recommendation</h5>
                <p className="text-slate-200 text-xs leading-relaxed">{result.advisory_summary}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
