import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { FAO56IrrigationResult } from '../types';
import { 
  Sprout, 
  Droplets, 
  MapPin, 
  Calendar, 
  Layers, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  TrendingDown, 
  HelpCircle, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  Search,
  Clock,
  Gauge,
  Truck,
  Timer,
  Activity,
  ArrowRight,
  Info
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
import { motion, AnimatePresence } from 'framer-motion';

interface CropWaterPageProps {
  initialDistrict?: string;
}

const CATEGORY_ICONS: Record<string, string> = {
  'All': '🌾',
  'Cereals': '🌾',
  'Millets': '🌽',
  'Pulses': '🫘',
  'Oilseeds': '🌻',
  'Vegetables': '🍅',
  'Fruits': '🥭',
  'Spices': '☕',
  'Commercial': '🎋'
};

const POPULAR_PRESETS = [
  { name: 'Finger Millet (Ragi)', icon: '🌾', category: 'Millets' },
  { name: 'Tomato', icon: '🍅', category: 'Vegetables' },
  { name: 'Paddy (Rice)', icon: '🌾', category: 'Cereals' },
  { name: 'Maize (Corn)', icon: '🌽', category: 'Cereals' },
  { name: 'Groundnut (Peanut)', icon: '🌱', category: 'Oilseeds' },
  { name: 'Sugarcane', icon: '🎋', category: 'Commercial' },
  { name: 'Onion', icon: '🧅', category: 'Vegetables' },
  { name: 'Coffee (Robusta)', icon: '☕', category: 'Spices' },
  { name: 'Mango', icon: '🥭', category: 'Fruits' },
  { name: 'Chilli (Byadgi)', icon: '🌶️', category: 'Spices' }
];

export const CropWaterPage: React.FC<CropWaterPageProps> = ({
  initialDistrict = 'Bengaluru Urban'
}) => {
  const [crops, setCrops] = useState<string[]>([]);
  const [categories, setCategories] = useState<Record<string, string[]>>({});
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [soils, setSoils] = useState<string[]>([]);
  const [soilDetails, setSoilDetails] = useState<Record<string, any>>({});
  const [districts, setDistricts] = useState<Record<string, any>>({});

  // Form State
  const [selectedDistrict, setSelectedDistrict] = useState<string>(initialDistrict);
  const [selectedCrop, setSelectedCrop] = useState<string>('Finger Millet (Ragi)');
  const [daysSincePlanting, setDaysSincePlanting] = useState<number>(45);
  const [selectedSoil, setSelectedSoil] = useState<string>('Red Sandy Loam');
  const [fieldAreaHa, setFieldAreaHa] = useState<number>(2.0);
  const [cropSearch, setCropSearch] = useState<string>('');

  // Results & Loading
  const [result, setResult] = useState<FAO56IrrigationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState<boolean>(false);

  useEffect(() => {
    loadCatalog();
  }, []);

  const loadCatalog = async () => {
    try {
      const catalog = await api.getCropCatalog();
      setCrops(catalog.crops || []);
      setCategories(catalog.categories || {});
      setSoils(catalog.soils || []);
      setSoilDetails(catalog.soil_details || {});
      setDistricts(catalog.karnataka_districts || {});

      // Pick default crop
      if (catalog.crops && catalog.crops.length > 0) {
        const defaultCrop = catalog.crops.find((c: string) => c.includes('Ragi') || c.includes('Paddy') || c.includes('Tomato')) || catalog.crops[0];
        setSelectedCrop(defaultCrop);
      }
    } catch (err) {
      console.error('Failed to load crop catalog:', err);
    }
  };

  // Recalculate whenever inputs change
  useEffect(() => {
    if (selectedCrop) {
      computeAdvisory();
    }
  }, [selectedDistrict, selectedCrop, daysSincePlanting, selectedSoil, fieldAreaHa]);

  const computeAdvisory = async () => {
    setIsCalculating(true);
    try {
      const data = await api.calculateIrrigation({
        cropName: selectedCrop,
        daysSincePlanting: Number(daysSincePlanting),
        soilType: selectedSoil,
        districtName: selectedDistrict,
        fieldAreaHa: Number(fieldAreaHa)
      });
      setResult(data);
    } catch (err) {
      console.error('Failed to compute irrigation advisory:', err);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleDistrictSelect = (districtName: string) => {
    setSelectedDistrict(districtName);
    const dist = districts[districtName];
    if (dist) {
      if (dist.default_soil) setSelectedSoil(dist.default_soil);
      if (dist.primary_crops && dist.primary_crops.length > 0) {
        setSelectedCrop(dist.primary_crops[0]);
      }
    }
  };

  // Filter crops based on category and search query
  const filteredCrops = useMemo(() => {
    return crops.filter((crop) => {
      const matchesSearch = crop.toLowerCase().includes(cropSearch.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || (categories[selectedCategory] && categories[selectedCategory].includes(crop));
      return matchesSearch && matchesCategory;
    });
  }, [crops, cropSearch, selectedCategory, categories]);

  // Chart data from 7-day forecast
  const chartData = useMemo(() => {
    return result?.forecast_7day?.map((f: any) => ({
      day: f.day,
      depletion: f.projected_depletion_mm,
      threshold: f.threshold_raw_mm,
      needWater: f.irrigate_flag
    })) || [];
  }, [result]);

  // Derived practical equipment measurements
  const totalWaterLitres = (result?.required_water_volume_m3 || 0) * 1000;
  const tractorTankers = Math.ceil(totalWaterLitres / 5000); // 5000-litre standard tractor tanker
  const dripPumpHours = (totalWaterLitres / 40000).toFixed(1); // 7.5HP ~ 40,000 L/hr
  const sprinklerHours = ((result?.recommended_gross_mm || 0) / 8).toFixed(1); // 8 mm/hr sprinkler precipitation rate

  // Determine active growth stage step (1 to 4)
  const growthStageStep = useMemo(() => {
    const stageName = result?.growth_stage?.toLowerCase() || '';
    if (stageName.includes('initial') || stageName.includes('emergence')) return 1;
    if (stageName.includes('development') || stageName.includes('vegetative')) return 2;
    if (stageName.includes('mid') || stageName.includes('flowering') || stageName.includes('yield')) return 3;
    if (stageName.includes('late') || stageName.includes('maturity') || stageName.includes('ripening')) return 4;
    return daysSincePlanting <= 25 ? 1 : daysSincePlanting <= 60 ? 2 : daysSincePlanting <= 100 ? 3 : 4;
  }, [result, daysSincePlanting]);

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 max-w-7xl mx-auto w-full pb-24">
      {/* Top Banner & Catalog Overview */}
      <div className="pb-4 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs border border-emerald-500/20 shadow-sm flex items-center gap-1.5">
              <Sprout className="w-3.5 h-3.5" />
              FAO-56 Dual Crop Coefficient Precision Irrigation
            </span>
            <span className="text-xs text-slate-400 font-semibold hidden sm:inline">&bull; 100+ Karnataka Crops</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white mt-2">
            Smart Crop Water & Irrigation Advisor
          </h2>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Dynamic root-zone water budgeting for Karnataka agriculture. Prevent root suffocation during flood events and eliminate drought stress.
          </p>
        </div>

        {/* Catalog Size Stats */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2.5 rounded-2xl glass-card text-center border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Catalog</span>
            <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">
              {crops.length || 100}+ Crops
            </span>
          </div>
          <div className="px-4 py-2.5 rounded-2xl glass-card text-center border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Soils</span>
            <span className="text-lg font-black text-cyan-600 dark:text-cyan-400 font-mono">
              12 Series
            </span>
          </div>
          <div className="px-4 py-2.5 rounded-2xl glass-card text-center border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Districts</span>
            <span className="text-lg font-black text-sky-600 dark:text-sky-400 font-mono">
              31 All
            </span>
          </div>
        </div>
      </div>

      {/* Popular 1-Click Crop Presets Bar */}
      <div className="space-y-2">
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          Quick Farmer Presets:
        </span>
        <div className="flex flex-wrap gap-2">
          {POPULAR_PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => setSelectedCrop(preset.name)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                selectedCrop === preset.name
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25 ring-2 ring-emerald-400'
                  : 'glass-card border border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 hover:border-emerald-400'
              }`}
            >
              <span>{preset.icon}</span>
              <span>{preset.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 3-Step Simple Setup Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Step 1: Location & Soil */}
        <div className="rounded-3xl glass-card p-6 border border-slate-200 dark:border-slate-700/60 shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 font-bold text-sm">
              <span className="w-6 h-6 rounded-full bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 flex items-center justify-center text-xs font-black">1</span>
              <span>Location & Soil Series</span>
            </div>
            <span className="text-[10px] text-slate-400">Geo-calibrated</span>
          </div>

          {/* District Dropdown */}
          <div>
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1.5">
              Target Karnataka District:
            </label>
            <div className="flex items-center gap-2 p-3 rounded-2xl glass-card border border-slate-200 dark:border-slate-700/80">
              <MapPin className="w-4 h-4 text-cyan-500 shrink-0" />
              <select
                value={selectedDistrict}
                onChange={(e) => handleDistrictSelect(e.target.value)}
                className="w-full bg-transparent text-sm font-bold text-slate-900 dark:text-white focus:outline-none cursor-pointer"
              >
                {Object.keys(districts).length > 0 ? (
                  Object.keys(districts).map((d) => (
                    <option key={d} value={d} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                      {d} ({districts[d]?.zone?.split('(')[0] || 'Zone'})
                    </option>
                  ))
                ) : (
                  <option value="Bengaluru Urban">Bengaluru Urban</option>
                )}
              </select>
            </div>
          </div>

          {/* Soil Type Dropdown */}
          <div>
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1.5">
              Soil Type in Farm Plot:
            </label>
            <div className="flex items-center gap-2 p-3 rounded-2xl glass-card border border-slate-200 dark:border-slate-700/80">
              <Layers className="w-4 h-4 text-amber-500 shrink-0" />
              <select
                value={selectedSoil}
                onChange={(e) => setSelectedSoil(e.target.value)}
                className="w-full bg-transparent text-xs font-bold text-slate-900 dark:text-white focus:outline-none cursor-pointer"
              >
                {soils.map((s) => (
                  <option key={s} value={s} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                    {s}
                  </option>
                ))}
              </select>
            </div>
            {soilDetails[selectedSoil] && (
              <div className="mt-2.5 p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/50 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                <p className="font-semibold text-slate-700 dark:text-slate-300">{soilDetails[selectedSoil].description}</p>
                <div className="flex justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-700">
                  <span>Infiltration: ~{soilDetails[selectedSoil].infiltration_mm_hr || 15} mm/hr</span>
                  <span>AWC: ~{(soilDetails[selectedSoil].awc_mm_m || 120)} mm/m</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Step 2: Crop Selector (100+ Crops) */}
        <div className="rounded-3xl glass-card p-6 border border-slate-200 dark:border-slate-700/60 shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
              <span className="w-6 h-6 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-black">2</span>
              <span>Crop Variety</span>
            </div>
            <span className="text-[10px] text-emerald-500 font-semibold">{filteredCrops.length} Available</span>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-1">
            {['All', ...Object.keys(categories)].slice(0, 7).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-all ${
                  selectedCategory === cat
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {CATEGORY_ICONS[cat] || '🌱'} {cat}
              </button>
            ))}
          </div>

          {/* Crop Search & Dropdown */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search across 100+ crops..."
                value={cropSearch}
                onChange={(e) => setCropSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-2xl glass-card text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="p-2.5 rounded-2xl glass-card border border-slate-200 dark:border-slate-700/80">
              <select
                value={selectedCrop}
                onChange={(e) => setSelectedCrop(e.target.value)}
                className="w-full bg-transparent text-sm font-black text-slate-900 dark:text-white focus:outline-none cursor-pointer"
              >
                {filteredCrops.map((c) => (
                  <option key={c} value={c} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Step 3: Growth Stage & Farm Area */}
        <div className="rounded-3xl glass-card p-6 border border-slate-200 dark:border-slate-700/60 shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400 font-bold text-sm">
              <span className="w-6 h-6 rounded-full bg-sky-500/15 text-sky-600 dark:text-sky-400 flex items-center justify-center text-xs font-black">3</span>
              <span>Crop Age & Plot Size</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Day {daysSincePlanting}</span>
          </div>

          {/* Days Since Planting Slider */}
          <div>
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-sky-500" /> Days Since Sowing:
              </span>
              <span className="font-black text-sky-600 dark:text-sky-400 font-mono text-base">
                Day {daysSincePlanting}
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={150}
              value={daysSincePlanting}
              onChange={(e) => setDaysSincePlanting(Number(e.target.value))}
              className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1.5 font-medium">
              <span>Sowing (Day 1)</span>
              <span>Mid-Season</span>
              <span>Harvest (Day 150)</span>
            </div>
          </div>

          {/* Farm Size */}
          <div>
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-bold text-slate-700 dark:text-slate-300">Plot Area:</span>
              <span className="font-black text-slate-900 dark:text-white font-mono text-sm">
                {fieldAreaHa} ha <span className="text-slate-400 font-normal">(~{(fieldAreaHa * 2.471).toFixed(1)} Acres)</span>
              </span>
            </div>
            <input
              type="range"
              min={0.5}
              max={15}
              step={0.5}
              value={fieldAreaHa}
              onChange={(e) => setFieldAreaHa(Number(e.target.value))}
              className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
          </div>
        </div>
      </div>

      {/* Visual 4-Stage Crop Growth Timeline Stepper */}
      <div className="rounded-3xl glass-card p-6 border border-slate-200 dark:border-slate-800 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-emerald-500" />
            FAO-56 Phenological Growth Stage Timeline
          </span>
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            Active: {result?.growth_stage || 'Vegetative'} (Kc: {result?.crop_coefficient_kc || 1.0})
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {[
            { step: 1, name: '1. Initial / Sowing', range: 'Day 1 - 25', desc: 'Germination & shallow root establishment. High soil surface evaporation.', kcEst: 'Kc ~0.40' },
            { step: 2, name: '2. Vegetative Development', range: 'Day 26 - 55', desc: 'Rapid canopy leaf expansion & root elongation. Transpiration rises steadily.', kcEst: 'Kc ~0.75' },
            { step: 3, name: '3. Mid-Season Reproductive', range: 'Day 56 - 95', desc: 'Flowering & grain/fruit fill. Peak critical water requirement window.', kcEst: 'Kc ~1.15' },
            { step: 4, name: '4. Maturation & Ripening', range: 'Day 96 - 150', desc: 'Canopy yellowing & senescence. Reduced irrigation to encourage dry-down.', kcEst: 'Kc ~0.65' }
          ].map((s) => {
            const isActive = growthStageStep === s.step;
            return (
              <div
                key={s.step}
                className={`p-4 rounded-2xl border transition-all ${
                  isActive
                    ? 'border-emerald-500 bg-emerald-500/10 shadow-md ring-2 ring-emerald-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 opacity-75'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-extrabold ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'}`}>
                    {s.name}
                  </span>
                  {isActive && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>}
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-1 flex justify-between">
                  <span>{s.range}</span>
                  <span className="font-bold text-slate-600 dark:text-slate-300">{s.kcEst}</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                  {s.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Plain-Language Farmer Advisory Card (Primary Result) */}
      {result && (
        <div className="rounded-3xl glass-card p-6 md:p-8 border border-slate-200 dark:border-slate-700/80 shadow-2xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold" style={{
                  backgroundColor: `${result.urgency_color}20`,
                  color: result.urgency_color,
                  border: `1px solid ${result.urgency_color}40`
                }}>
                  {result.irrigation_status}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {result.crop} &bull; Stage: <strong className="text-slate-800 dark:text-slate-200">{result.growth_stage}</strong>
                </span>
              </div>

              <h3 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">
                Farmer Advisory & Water Prescription
              </h3>
            </div>

            {/* Quick Water Quantity Badge */}
            {result.recommended_gross_mm > 0 ? (
              <div className="px-6 py-4 rounded-3xl bg-rose-500/10 border border-rose-500/30 text-right shadow-sm">
                <span className="text-xs text-rose-600 dark:text-rose-400 block font-semibold">Recommended Water Volume</span>
                <span className="text-3xl font-black text-rose-600 dark:text-rose-400 font-mono">
                  {result.required_water_volume_m3?.toLocaleString()} m³
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                  ({(result.required_water_volume_m3 * 1000).toLocaleString()} Litres &bull; {result.recommended_gross_mm} mm depth)
                </span>
              </div>
            ) : (
              <div className="px-6 py-4 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 text-right shadow-sm">
                <span className="text-xs text-emerald-600 dark:text-emerald-400 block font-semibold">Root Zone Soil Moisture</span>
                <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                  Adequate / Saturated
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">No irrigation needed today. Roots well aerated.</span>
              </div>
            )}
          </div>

          {/* Plain Farmer Advice Box */}
          <div className="p-5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 leading-relaxed text-sm text-slate-800 dark:text-slate-200 font-medium">
            {result.advisory_summary}
          </div>

          {/* Real Field Equipment & Actionable Farmer Units */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-2xl glass-card border border-slate-200 dark:border-slate-800 flex items-center gap-3.5">
              <div className="p-3 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block font-semibold">Tractor Tankers Needed</span>
                <span className="text-xl font-black text-slate-900 dark:text-white font-mono">
                  {result.recommended_gross_mm > 0 ? `${tractorTankers} Tankers` : '0 Tankers'}
                </span>
                <span className="text-[10px] text-slate-400 block">5,000-Litre standard farm trailer</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl glass-card border border-slate-200 dark:border-slate-800 flex items-center gap-3.5">
              <div className="p-3 rounded-xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400">
                <Timer className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block font-semibold">Drip Pump Runtime</span>
                <span className="text-xl font-black text-cyan-600 dark:text-cyan-400 font-mono">
                  {result.recommended_gross_mm > 0 ? `${dripPumpHours} Hours` : '0 Hours'}
                </span>
                <span className="text-[10px] text-slate-400 block">At 7.5 HP (~40,000 L/hr) discharge</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl glass-card border border-slate-200 dark:border-slate-800 flex items-center gap-3.5">
              <div className="p-3 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block font-semibold">Root Rot / Anoxia Risk</span>
                <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                  Low / Safe
                </span>
                <span className="text-[10px] text-slate-400 block">Root zone well-oxygenated</span>
              </div>
            </div>
          </div>

          {/* 4 Scientific Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 pt-2">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/40">
              <span className="text-[11px] text-slate-400 block font-semibold">Crop Water Demand (ETc)</span>
              <span className="text-2xl font-black text-cyan-600 dark:text-cyan-400 font-mono">
                {result.etc_crop_water_need_mm_day} mm/day
              </span>
              <span className="text-[10px] text-slate-400 block mt-1">
                Kc: {result.crop_coefficient_kc} &bull; ET₀: {result.et0_reference_mm_day} mm
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/40">
              <span className="text-[11px] text-slate-400 block font-semibold">Soil Safe Moisture (RAW)</span>
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                {result.raw_readily_available_water_mm} mm
              </span>
              <span className="text-[10px] text-slate-400 block mt-1">
                Total Available (TAW): {result.taw_total_available_water_mm} mm
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/40">
              <span className="text-[11px] text-slate-400 block font-semibold">Current Root Deficit</span>
              <span className="text-2xl font-black text-amber-500 font-mono">
                {result.current_depletion_mm} mm
              </span>
              <span className="text-[10px] text-slate-400 block mt-1">
                {result.depletion_percentage_raw}% of safe depletion
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/40">
              <span className="text-[11px] text-slate-400 block font-semibold">Effective Rain Buffer</span>
              <span className="text-2xl font-black text-blue-500 font-mono">
                {result.effective_rainfall_mm} mm
              </span>
              <span className="text-[10px] text-slate-400 block mt-1">
                Infiltrated precipitation
              </span>
            </div>
          </div>

          {/* 7-Day Projected Soil Water Balance Chart */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <TrendingDown className="w-3.5 h-3.5 text-cyan-500" />
                <span>7-Day Root-Zone Water Deficit vs Safe Irrigation Threshold (RAW)</span>
              </h4>
              <span className="text-xs text-rose-500 font-semibold hidden sm:inline">
                Red Line = Critical Refill Level ({result.raw_readily_available_water_mm} mm)
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="depletionGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} unit=" mm" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#fff' }}
                  />
                  <ReferenceLine
                    y={result.raw_readily_available_water_mm}
                    stroke="#ef4444"
                    strokeDasharray="4 4"
                    label={{ value: 'Irrigation Threshold (RAW)', fill: '#ef4444', fontSize: 11, position: 'top' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="depletion"
                    name="Projected Soil Water Deficit (mm)"
                    stroke="#0ea5e9"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#depletionGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Collapsible Scientific Details for Project Evaluators */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
              className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-cyan-500 transition-colors"
            >
              <span>{showTechnicalDetails ? 'Hide' : 'View'} Complete FAO-56 Agronomic & Mathematical Equations</span>
              {showTechnicalDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showTechnicalDetails && (
              <div className="mt-4 p-5 rounded-2xl bg-slate-900 text-slate-200 font-mono text-xs space-y-3 shadow-inner">
                <p><span className="text-cyan-400 font-bold">Reference Evapotranspiration (ET₀):</span> Hargreaves-Samani = 0.0023 &times; R<sub>a</sub> &times; (T<sub>mean</sub> + 17.8) &times; &radic;(T<sub>max</sub> - T<sub>min</sub>) = <strong>{result.et0_reference_mm_day} mm/day</strong></p>
                <p><span className="text-cyan-400 font-bold">Crop Water Need (ETc):</span> ETc = Kc &times; ET₀ = {result.crop_coefficient_kc} &times; {result.et0_reference_mm_day} = <strong>{result.etc_crop_water_need_mm_day} mm/day</strong></p>
                <p><span className="text-cyan-400 font-bold">Total Available Water (TAW):</span> 1000 &times; (FC - WP) &times; Z<sub>r</sub> = <strong>{result.taw_total_available_water_mm} mm</strong></p>
                <p><span className="text-cyan-400 font-bold">Readily Available Water (RAW):</span> p &times; TAW = <strong>{result.raw_readily_available_water_mm} mm</strong></p>
                <p><span className="text-cyan-400 font-bold">Root-Zone Water Balance:</span> D<sub>r,i</sub> = D<sub>r,i-1</sub> - P<sub>eff</sub> + ETc = <strong>{result.current_depletion_mm} mm</strong></p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
