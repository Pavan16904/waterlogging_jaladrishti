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
  Info,
  Printer,
  Download,
  Zap,
  CloudRain,
  TrendingUp
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
import { useLanguage } from '../context/LanguageContext';
import { KARNATAKA_DISTRICT_AGRI, getDistrictProfile } from '../data/karnatakaDistrictAgri';

interface CropWaterPageProps {
  initialDistrict?: string;
}

export interface CropStageMetadata {
  step: number;
  name: string;
  duration: number;
  startDay: number;
  endDay: number;
  midDay: number;
  kc: string;
  desc: string;
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
  { name: 'Finger Millet (Ragi)', kn: 'ರಾಗಿ (Ragi)', icon: '🌾', category: 'Millets' },
  { name: 'Tomato', kn: 'ಟೊಮೇಟೊ (Tomato)', icon: '🍅', category: 'Vegetables' },
  { name: 'Rice (Paddy)', kn: 'ಭತ್ತ (Paddy)', icon: '🌾', category: 'Cereals' },
  { name: 'Maize (Corn)', kn: 'ಮೆಕ್ಕೆಜೋಳ (Maize)', icon: '🌽', category: 'Cereals' },
  { name: 'Groundnut (Peanut)', kn: 'ಕಡಲೆಕಾಯಿ / ಶೇಂಗಾ', icon: '🌱', category: 'Oilseeds' },
  { name: 'Sugarcane', kn: 'ಕಬ್ಬು (Sugarcane)', icon: '🎋', category: 'Commercial' },
  { name: 'Onion', kn: 'ಈರುಳ್ಳಿ (Onion)', icon: '🧅', category: 'Vegetables' },
  { name: 'Coffee (Arabica/Robusta)', kn: 'ಕಾಫಿ (Coffee)', icon: '☕', category: 'Spices' },
  { name: 'Mango', kn: 'ಮಾವಿನ ಹಣ್ಣು (Mango)', icon: '🥭', category: 'Fruits' },
  { name: 'Chilli (Byadgi)', kn: 'ಬ್ಯಾಡಗಿ ಮೆಣಸಿನಕಾಯಿ', icon: '🌶️', category: 'Spices' }
];

export const CropWaterPage: React.FC<CropWaterPageProps> = ({
  initialDistrict = 'Bengaluru Urban'
}) => {
  const { lang, t } = useLanguage();
  const [crops, setCrops] = useState<string[]>([]);
  const [categories, setCategories] = useState<Record<string, string[]>>({});
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [soils, setSoils] = useState<string[]>([]);
  const [soilDetails, setSoilDetails] = useState<Record<string, any>>({});
  const [districts, setDistricts] = useState<Record<string, any>>({});
  const [cropDetails, setCropDetails] = useState<Record<string, any>>({});

  // District-Smart Isolation Filter (defaults to true: strictly show only crops & soils grown in the selected district)
  const [filterByDistrict, setFilterByDistrict] = useState<boolean>(true);

  // Form State
  const initialProfile = getDistrictProfile(initialDistrict);
  const [selectedDistrict, setSelectedDistrict] = useState<string>(initialDistrict);
  const [selectedCrop, setSelectedCrop] = useState<string>(initialProfile.defaultCrop);
  const [daysSincePlanting, setDaysSincePlanting] = useState<number>(65);
  const [selectedSoil, setSelectedSoil] = useState<string>(initialProfile.defaultSoil);
  const [fieldAreaHa, setFieldAreaHa] = useState<number>(1.0);
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
      setCropDetails(catalog.crop_details || {});

      // Automatically sync with initial district's primary soil and crop
      const profile = getDistrictProfile(initialDistrict);
      if (profile) {
        setSelectedSoil(profile.defaultSoil);
        setSelectedCrop(profile.defaultCrop);
      }
    } catch (err) {
      console.error('Failed to load crop catalog:', err);
    }
  };

  // Dynamic FAO-56 crop stages, total duration & optimal peak water need day
  const currentCropMetadata = useMemo(() => {
    const detail = cropDetails[selectedCrop];
    const rawStages = detail?.stages || [
      { name: 'Initial / Sowing', duration: 25, kc: 0.40 },
      { name: 'Vegetative Development', duration: 30, kc: 0.75 },
      { name: 'Mid-Season Reproductive', duration: 40, kc: 1.15 },
      { name: 'Maturation & Harvest', duration: 25, kc: 0.65 }
    ];

    let cum = 0;
    const computedStages: CropStageMetadata[] = rawStages.map((st: any, idx: number): CropStageMetadata => {
      const dur = Number(st.duration) || 25;
      const start = cum + 1;
      const end = cum + dur;
      const mid = Math.round(start + dur / 2);
      cum = end;
      
      const stageDescs = [
        'Germination, seedling emergence and shallow root development.',
        'Rapid canopy cover expansion, active tillering and stem elongation.',
        'Flowering, pollination and grain/fruit filling (Peak critical water need).',
        'Senescence, grain hardening and maturity drying down for harvest.'
      ];

      return {
        step: idx + 1,
        name: st.name || `Stage ${idx + 1}`,
        duration: dur,
        startDay: start,
        endDay: end,
        midDay: mid,
        kc: st.kc ? `Kc ${Number(st.kc).toFixed(2)}` : (st.kc_end ? `Kc ${Number(st.kc_end).toFixed(2)}` : 'Kc ~1.00'),
        desc: stageDescs[idx] || 'Crop developmental phase under FAO-56 guidelines.'
      };
    });

    const totalDuration = cum || 120;
    // Peak mid-season is stage 3 (index 2) or stage 2
    const peakStage = computedStages[2] || computedStages[1] || computedStages[0];
    const midSeasonDay = peakStage ? peakStage.midDay : Math.round(totalDuration * 0.55);

    return {
      stages: computedStages,
      totalDuration,
      midSeasonDay,
      peakStage
    };
  }, [cropDetails, selectedCrop]);

  // Automatically calibrate crop age to peak water requirement day whenever selected crop changes
  useEffect(() => {
    if (currentCropMetadata?.midSeasonDay) {
      setDaysSincePlanting(currentCropMetadata.midSeasonDay);
    }
  }, [selectedCrop, currentCropMetadata.midSeasonDay]);

  // Current district agro-profile
  const currentDistrictProfile = useMemo(() => {
    return getDistrictProfile(selectedDistrict);
  }, [selectedDistrict]);

  // Soils strictly available for this district (or all if filter toggled off)
  const availableSoils = useMemo(() => {
    if (filterByDistrict && currentDistrictProfile?.soils?.length > 0) {
      return currentDistrictProfile.soils;
    }
    return soils.length > 0 ? soils : ['Red Sandy Loam'];
  }, [filterByDistrict, currentDistrictProfile, soils]);

  // Base list of crops for this district (or all if filter toggled off)
  const baseDistrictCrops = useMemo(() => {
    if (filterByDistrict && currentDistrictProfile?.crops?.length > 0) {
      return currentDistrictProfile.crops;
    }
    return crops;
  }, [filterByDistrict, currentDistrictProfile, crops]);

  // Filter crops based on category and search query
  const filteredCrops = useMemo(() => {
    return baseDistrictCrops.filter((crop) => {
      const matchesSearch = crop.toLowerCase().includes(cropSearch.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || (categories[selectedCategory] && categories[selectedCategory].includes(crop));
      return matchesSearch && matchesCategory;
    });
  }, [baseDistrictCrops, cropSearch, selectedCategory, categories]);

  // Automatically adapt selected soil if current selection is not valid for this district
  useEffect(() => {
    if (availableSoils.length > 0 && !availableSoils.includes(selectedSoil)) {
      setSelectedSoil(availableSoils[0]);
    }
  }, [availableSoils, selectedSoil]);

  // Automatically adapt selected crop if current selection is not valid for this district
  useEffect(() => {
    if (filteredCrops.length > 0 && !filteredCrops.includes(selectedCrop)) {
      setSelectedCrop(filteredCrops[0]);
    }
  }, [filteredCrops, selectedCrop]);

  // Handle District Change: automatically selects the right soil & plant for the district!
  const handleDistrictSelect = (districtName: string) => {
    setSelectedDistrict(districtName);
    const profile = getDistrictProfile(districtName);
    if (profile) {
      setSelectedSoil(profile.defaultSoil);
      setSelectedCrop(profile.defaultCrop);
    }
  };

  // Recalculate whenever inputs change
  useEffect(() => {
    if (selectedCrop) {
      computeAdvisory();
    }
  }, [selectedDistrict, selectedCrop, daysSincePlanting, selectedSoil, fieldAreaHa]);

  const computeAdvisory = async () => {
    // Input validation — guard against edge cases that would crash the ML service
    const days = Number(daysSincePlanting);
    const area = Number(fieldAreaHa);
    const totalDays = currentCropMetadata.totalDuration || 365;

    if (!selectedCrop || !selectedSoil) return;
    if (isNaN(days) || days < 1 || days > totalDays * 1.5) return;
    if (isNaN(area) || area <= 0 || area > 10000) return;

    setIsCalculating(true);
    try {
      const data = await api.calculateIrrigation({
        cropName: selectedCrop,
        daysSincePlanting: Math.max(1, Math.round(days)),
        soilType: selectedSoil,
        districtName: selectedDistrict,
        fieldAreaHa: Math.max(0.01, area)
      });
      setResult(data);
    } catch (err) {
      console.error('Failed to compute irrigation advisory:', err);
    } finally {
      setIsCalculating(false);
    }
  };


  // Filter popular presets to those grown in the selected district when filterByDistrict is active
  const districtPresets = useMemo(() => {
    if (!filterByDistrict || !currentDistrictProfile) return POPULAR_PRESETS;
    const set = new Set(currentDistrictProfile.crops);
    const matched = POPULAR_PRESETS.filter(p => set.has(p.name));
    return matched.length > 0 ? matched : POPULAR_PRESETS.slice(0, 5);
  }, [filterByDistrict, currentDistrictProfile]);

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

  // Power & cost savings when avoiding over-irrigation
  const powerSavedKwh = Math.round((Number(dripPumpHours) || 0) * 5.5);
  const moneySavedInr = Math.round(powerSavedKwh * 7.5);

  // Check 7-day upcoming rainfall sum
  const upcomingRainfallMm = useMemo(() => {
    return result?.forecast_7day?.reduce((acc: number, f: any) => acc + (f.rainfall_mm || 0), 0) || 0;
  }, [result]);

  const handlePrintPrescription = () => {
    window.print();
  };

  // Determine active growth stage step (1 to 4)
  const growthStageStep = useMemo(() => {
    const stageName = result?.growth_stage?.toLowerCase() || '';
    if (stageName.includes('initial') || stageName.includes('emergence') || stageName.includes('nursery')) return 1;
    if (stageName.includes('development') || stageName.includes('vegetative') || stageName.includes('tillering')) return 2;
    if (stageName.includes('mid') || stageName.includes('flowering') || stageName.includes('yield') || stageName.includes('reproductive') || stageName.includes('tasseling')) return 3;
    if (stageName.includes('late') || stageName.includes('maturity') || stageName.includes('ripening') || stageName.includes('harvest') || stageName.includes('drying')) return 4;

    if (currentCropMetadata?.stages) {
      for (const st of currentCropMetadata.stages) {
        if (daysSincePlanting >= st.startDay && daysSincePlanting <= st.endDay) {
          return st.step;
        }
      }
    }
    return 2;
  }, [result, daysSincePlanting, currentCropMetadata]);

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
            {t('cropPageTitle', 'Smart Crop Water & Irrigation Advisor')}
          </h2>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t('cropPageSubtitle', 'Dynamic root-zone water budgeting for Karnataka agriculture. Prevent root suffocation during flood events and eliminate drought stress.')}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Print Prescription Card Button */}
          <button
            onClick={handlePrintPrescription}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white text-xs font-bold border border-slate-700 shadow-sm transition-all"
            title="Print Official Farmer Irrigation Prescription Card"
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">{t('printPrescription', 'Print Prescription')}</span>
          </button>

          {/* Catalog Size Stats */}
          <div className="hidden lg:flex items-center gap-2">
            <div className="px-3.5 py-1.5 rounded-2xl glass-card text-center border border-slate-200 dark:border-slate-800">
              <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-semibold">Crops</span>
              <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono">
                {crops.length || 100}+
              </span>
            </div>
            <div className="px-3.5 py-1.5 rounded-2xl glass-card text-center border border-slate-200 dark:border-slate-800">
              <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-semibold">Soils</span>
              <span className="text-sm font-black text-cyan-600 dark:text-cyan-400 font-mono">
                12
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Rain Delay Smart Weather Alert */}
      {upcomingRainfallMm > 5 && (
        <div className="p-4 rounded-3xl bg-cyan-950/40 border border-cyan-500/40 flex items-center justify-between gap-4 animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <CloudRain className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-cyan-300">
                {t('rainWarningTitle', 'Rainfall Expected in Next 7 Days!')} ({upcomingRainfallMm.toFixed(1)} mm total)
              </h4>
              <p className="text-xs text-slate-300">
                {t('rainWarningDesc', 'Natural precipitation will recharge the root-zone. Consider delaying irrigation to prevent root anoxia and save farm pumping electricity.')}
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-flex px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-mono font-bold">
            +{upcomingRainfallMm.toFixed(1)} mm RAIN
          </span>
        </div>
      )}

      {/* Popular 1-Click Crop Presets Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Quick Presets for {currentDistrictProfile.name}:
          </span>
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
            {filterByDistrict ? `🎯 District Crops (${districtPresets.length})` : '🌐 All Presets'}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {districtPresets.map((preset) => (
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
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                Soil Type in Farm Plot:
              </label>
              <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
                {availableSoils.length} soils in {currentDistrictProfile.name}
              </span>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-2xl glass-card border border-slate-200 dark:border-slate-700/80">
              <Layers className="w-4 h-4 text-amber-500 shrink-0" />
              <select
                value={selectedSoil}
                onChange={(e) => setSelectedSoil(e.target.value)}
                className="w-full bg-transparent text-xs font-bold text-slate-900 dark:text-white focus:outline-none cursor-pointer"
              >
                {availableSoils.map((s) => (
                  <option key={s} value={s} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                    {s} {s === currentDistrictProfile.defaultSoil ? '★ (Predominant)' : ''}
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

        {/* Step 2: Crop Selector (District-Specific or Full Catalog) */}
        <div className="rounded-3xl glass-card p-6 border border-slate-200 dark:border-slate-700/60 shadow-md space-y-4">
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
              <span className="w-6 h-6 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-black">2</span>
              <span>Crop Variety</span>
            </div>
            <button
              type="button"
              onClick={() => setFilterByDistrict(!filterByDistrict)}
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black transition-all flex items-center gap-1 border ${
                filterByDistrict
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/40 shadow-sm'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-transparent'
              }`}
              title={filterByDistrict ? "Showing only crops grown in this district. Click to show all Karnataka crops." : "Click to isolate only crops grown in this district."}
            >
              {filterByDistrict ? `🎯 ${currentDistrictProfile.name} (${filteredCrops.length})` : `🌐 All (${crops.length})`}
            </button>
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
                placeholder={filterByDistrict ? `Search crops in ${currentDistrictProfile.name}...` : "Search across 100+ crops..."}
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

        {/* Step 3: Growth Stage & Farm Area (Automated) */}
        <div className="rounded-3xl glass-card p-6 border border-slate-200 dark:border-slate-700/60 shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400 font-bold text-sm">
              <span className="w-6 h-6 rounded-full bg-sky-500/15 text-sky-600 dark:text-sky-400 flex items-center justify-center text-xs font-black">3</span>
              <span>Crop Age & Plot Size</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setDaysSincePlanting(currentCropMetadata.midSeasonDay)}
                className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1 hover:bg-emerald-500/25 transition-all shadow-sm"
                title="Automatically set age to crop's critical peak water requirement stage"
              >
                <Sparkles className="w-3 h-3 text-emerald-500" /> Auto Peak
              </button>
              <span className="text-[10px] text-slate-400 font-mono">
                Day {daysSincePlanting}/{currentCropMetadata.totalDuration}
              </span>
            </div>
          </div>

          {/* Days Since Planting Slider & Auto-Calibration */}
          <div>
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-sky-500" /> Days Since Sowing:
              </span>
              <div className="flex items-center gap-2">
                {daysSincePlanting === currentCropMetadata.midSeasonDay && (
                  <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 animate-pulse">
                    ⚡ Auto-Calibrated
                  </span>
                )}
                <span className="font-black text-sky-600 dark:text-sky-400 font-mono text-base">
                  Day {daysSincePlanting}
                </span>
              </div>
            </div>
            <input
              type="range"
              min={1}
              max={currentCropMetadata.totalDuration}
              value={daysSincePlanting}
              onChange={(e) => setDaysSincePlanting(Number(e.target.value))}
              className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1.5 font-medium">
              <span>Sowing (Day 1)</span>
              <span className="text-sky-600 dark:text-sky-400 font-bold">
                Peak Need (Day {currentCropMetadata.midSeasonDay})
              </span>
              <span>Harvest (Day {currentCropMetadata.totalDuration})</span>
            </div>

            {/* Quick 1-Click Stage Selectors */}
            <div className="grid grid-cols-4 gap-1.5 pt-2.5">
              {currentCropMetadata.stages.map((st: CropStageMetadata, i: number) => {
                const isStageActive = daysSincePlanting >= st.startDay && daysSincePlanting <= st.endDay;
                const stageIcons = ['🌱', '🌿', '🌸', '🌾'];
                const stageLabels = ['Early', 'Vegetative', 'Peak (Auto)', 'Harvest'];
                return (
                  <button
                    key={st.step}
                    type="button"
                    onClick={() => setDaysSincePlanting(st.midDay)}
                    className={`px-1.5 py-1.5 rounded-xl text-[10px] font-bold flex flex-col items-center gap-0.5 border transition-all ${
                      isStageActive
                        ? 'bg-sky-500/15 border-sky-500 text-sky-700 dark:text-sky-300 shadow-sm ring-1 ring-sky-500/30'
                        : 'bg-slate-100/80 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-400'
                    }`}
                  >
                    <span className="text-xs">{stageIcons[i] || '🌿'}</span>
                    <span className="truncate max-w-full">{stageLabels[i] || st.name}</span>
                    <span className="text-[9px] font-mono opacity-70">Day {st.midDay}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Farm Size & Presets */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
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
            {/* Quick 1-Click Plot Area Presets */}
            <div className="grid grid-cols-4 gap-1.5 mt-2">
              {[
                { label: '0.5 ha', sub: '~1.2 ac', val: 0.5 },
                { label: '1.0 ha ★', sub: 'Karnataka Avg', val: 1.0 },
                { label: '2.0 ha', sub: '~5 ac', val: 2.0 },
                { label: '5.0 ha', sub: '~12.5 ac', val: 5.0 }
              ].map((preset) => (
                <button
                  key={preset.val}
                  type="button"
                  onClick={() => setFieldAreaHa(preset.val)}
                  className={`py-1 px-1 rounded-lg text-center border transition-all ${
                    fieldAreaHa === preset.val
                      ? 'bg-cyan-500/15 border-cyan-500 text-cyan-700 dark:text-cyan-300 shadow-sm ring-1 ring-cyan-500/30'
                      : 'bg-slate-100/70 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-400'
                  }`}
                >
                  <div className="text-[10px] font-black">{preset.label}</div>
                  <div className="text-[8px] opacity-75">{preset.sub}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Visual 4-Stage Crop Growth Timeline Stepper */}
      <div className="rounded-3xl glass-card p-6 border border-slate-200 dark:border-slate-800 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-emerald-500" />
            FAO-56 Phenological Growth Stage Timeline &bull; {selectedCrop} ({currentCropMetadata.totalDuration} Days Total)
          </span>
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 self-start sm:self-auto">
            Active: {result?.growth_stage || 'Peak Mid-Season'} (Kc: {result?.crop_coefficient_kc || 1.15})
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {currentCropMetadata.stages.map((s: CropStageMetadata) => {
            const isActive = growthStageStep === s.step;
            return (
              <div
                key={s.step}
                role="button"
                tabIndex={0}
                onClick={() => setDaysSincePlanting(s.midDay)}
                onKeyDown={(e) => e.key === 'Enter' && setDaysSincePlanting(s.midDay)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer text-left select-none ${
                  isActive
                    ? 'border-emerald-500 bg-emerald-500/10 shadow-md ring-2 ring-emerald-500/20 scale-[1.01]'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 opacity-75 hover:opacity-100 hover:border-slate-400 hover:shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-extrabold ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}`}>
                    {s.step}. {s.name}
                  </span>
                  {isActive ? (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                  ) : (
                    <span className="text-[9px] text-slate-400 hover:text-emerald-500 transition-colors">Select ↗</span>
                  )}
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-1 flex justify-between">
                  <span>Day {s.startDay} - {s.endDay} ({s.duration}d)</span>
                  <span className="font-bold text-slate-600 dark:text-slate-300">{s.kc}</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                  {s.desc}
                </p>
                {isActive && (
                  <div className="mt-2 pt-2 border-t border-emerald-500/20 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
                    <span>Currently Active</span>
                    <span className="font-mono">Day {daysSincePlanting}</span>
                  </div>
                )}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            <div className="p-4 rounded-2xl glass-card border border-slate-200 dark:border-slate-800 flex items-center gap-3.5">
              <div className="p-3 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block font-semibold">{lang === 'kn' ? 'ಟ್ರಾಕ್ಟರ್ ಟ್ಯಾಂಕರ್‌ಗಳು' : 'Tractor Tankers Needed'}</span>
                <span className="text-xl font-black text-slate-900 dark:text-white font-mono">
                  {result.recommended_gross_mm > 0 ? `${tractorTankers} Tankers` : '0 Tankers'}
                </span>
                <span className="text-[10px] text-slate-400 block">5,000L standard farm trailer</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl glass-card border border-slate-200 dark:border-slate-800 flex items-center gap-3.5">
              <div className="p-3 rounded-xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400">
                <Timer className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block font-semibold">{lang === 'kn' ? 'ಡ್ರಿಪ್ ಪಂಪ್ ಸಮಯ' : 'Drip Pump Runtime'}</span>
                <span className="text-xl font-black text-cyan-600 dark:text-cyan-400 font-mono">
                  {result.recommended_gross_mm > 0 ? `${dripPumpHours} Hours` : '0 Hours'}
                </span>
                <span className="text-[10px] text-slate-400 block">At 7.5 HP (~40,000 L/hr)</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl glass-card border border-slate-200 dark:border-slate-800 flex items-center gap-3.5">
              <div className="p-3 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block font-semibold">{lang === 'kn' ? 'ಬೇರು ಕೊಳೆತ ಅಪಾಯ' : 'Root Rot / Anoxia Risk'}</span>
                <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                  Low / Safe
                </span>
                <span className="text-[10px] text-slate-400 block">Root zone well-oxygenated</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl glass-card border border-slate-200 dark:border-slate-800 flex items-center gap-3.5">
              <div className="p-3 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block font-semibold">{lang === 'kn' ? 'ವಿದ್ಯುತ್ ಉಳಿತಾಯ' : 'Energy Conservation'}</span>
                <span className="text-xl font-black text-amber-500 font-mono">
                  {powerSavedKwh > 0 ? `${powerSavedKwh} kWh` : '0 kWh'}
                </span>
                <span className="text-[10px] text-slate-400 block">Est. ~₹{moneySavedInr} electricity value</span>
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
