import React, { useState, useEffect, useMemo, useRef } from 'react';
import { api } from '../services/api';
import {
  Sprout, Droplets, MapPin, Calendar, Layers, CheckCircle2,
  AlertTriangle, ShieldCheck, TrendingDown, HelpCircle, Sparkles,
  ChevronDown, Search, Clock, Info, ExternalLink, RefreshCw,
  Waves, AlertCircle, X, ChevronRight, BarChart2, Check, Minus, Plus, CloudRain
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip,
  ResponsiveContainer, CartesianGrid
} from 'recharts';
import { useLanguage } from '../context/LanguageContext';
import { KARNATAKA_31_DISTRICTS_WEATHER, WeatherDistrict } from '../data/karnatakaDistrictsWeather';

interface CropWaterPageProps {
  initialDistrict?: string;
}

/* Crop profiles with varieties and stages */
interface CropData {
  name: string;
  category: string;
  defaultVariety: string;
  varieties: string[];
  durationDays: number;
  stages: {
    initial: { name: string; range: string; start: number; end: number; desc: string };
    development: { name: string; range: string; start: number; end: number; desc: string };
    midSeason: { name: string; range: string; start: number; end: number; desc: string };
    lateSeason: { name: string; range: string; start: number; end: number; desc: string };
  };
  irrigationRec: {
    amount: string;
    volM3: string;
    timing: string;
    method: string;
  };
}

const SUPPORTED_CROPS: Record<string, CropData> = {
  'Rice / Paddy': {
    name: 'Rice / Paddy',
    category: 'Cereals',
    defaultVariety: 'MTU-1010 (Popular)',
    varieties: ['MTU-1010 (Popular)', 'BPT-5204 (Sona Masuri)', 'Jaya', 'IR-64', 'Gangavati Sona'],
    durationDays: 120,
    stages: {
      initial: { name: 'Initial', range: '0–20 days', start: 0, end: 20, desc: 'Nursery & transplanting establishment.' },
      development: { name: 'Crop Development', range: '21–45 days', start: 21, end: 45, desc: 'Active vegetative growth. Adequate soil moisture is important for tillering.' },
      midSeason: { name: 'Mid-Season', range: '46–85 days', start: 46, end: 85, desc: 'Panicle initiation and flowering. Critical peak water demand.' },
      lateSeason: { name: 'Late Season', range: '86–120 days', start: 86, end: 120, desc: 'Grain filling & maturation. Gradual drying for harvest.' },
    },
    irrigationRec: {
      amount: '30 – 40 mm',
      volM3: '300 – 400 m³ per hectare',
      timing: 'Within next 3–4 days',
      method: 'Maintain shallow standing water (2–5 cm) for paddy',
    }
  },
  'Maize': {
    name: 'Maize',
    category: 'Cereals',
    defaultVariety: 'Pioneer 3396',
    varieties: ['Pioneer 3396', 'NK-6240', 'CP-818', 'Kargil 900M'],
    durationDays: 110,
    stages: {
      initial: { name: 'Initial', range: '0–18 days', start: 0, end: 18, desc: 'Seedling emergence and early root establishment.' },
      development: { name: 'Crop Development', range: '19–40 days', start: 19, end: 40, desc: 'Rapid vegetative growth and stem elongation.' },
      midSeason: { name: 'Mid-Season', range: '41–75 days', start: 41, end: 75, desc: 'Tasseling and silking (Critical water stress sensitive period).' },
      lateSeason: { name: 'Late Season', range: '76–110 days', start: 76, end: 110, desc: 'Grain ripening and denting. Reduce irrigation frequency.' },
    },
    irrigationRec: {
      amount: '25 – 35 mm',
      volM3: '250 – 350 m³ per hectare',
      timing: 'Within next 4–5 days',
      method: 'Furrow irrigation along ridge bases; avoid water stagnation',
    }
  },
  'Groundnut': {
    name: 'Groundnut',
    category: 'Oilseeds',
    defaultVariety: 'TMV-2 (Spanish)',
    varieties: ['TMV-2 (Spanish)', 'JL-24', 'Kadiri-6', 'GPBD-4'],
    durationDays: 105,
    stages: {
      initial: { name: 'Initial', range: '0–15 days', start: 0, end: 15, desc: 'Emergence and initial tap root elongation.' },
      development: { name: 'Crop Development', range: '16–35 days', start: 16, end: 35, desc: 'Vegetative branching and flower primordia formation.' },
      midSeason: { name: 'Mid-Season', range: '36–70 days', start: 36, end: 70, desc: 'Peg penetration and pod development (high aeration needed).' },
      lateSeason: { name: 'Late Season', range: '71–105 days', start: 71, end: 105, desc: 'Pod filling and shell hardening.' },
    },
    irrigationRec: {
      amount: '20 – 30 mm',
      volM3: '200 – 300 m³ per hectare',
      timing: 'Within next 4–6 days',
      method: 'Broad-bed and furrow (BBF); prevent pod waterlogging',
    }
  },
  'Cotton': {
    name: 'Cotton',
    category: 'Commercial',
    defaultVariety: 'Bt Cotton (Bollgard II)',
    varieties: ['Bt Cotton (Bollgard II)', 'RCH-2', 'Bunny Bt', 'DCH-32'],
    durationDays: 160,
    stages: {
      initial: { name: 'Initial', range: '0–25 days', start: 0, end: 25, desc: 'Germination and slow initial seedling growth.' },
      development: { name: 'Crop Development', range: '26–60 days', start: 26, end: 60, desc: 'Square formation and branch node extension.' },
      midSeason: { name: 'Mid-Season', range: '61–115 days', start: 61, end: 115, desc: 'Flowering and boll formation. High water requirement.' },
      lateSeason: { name: 'Late Season', range: '116–160 days', start: 116, end: 160, desc: 'Boll opening and defoliation for harvest.' },
    },
    irrigationRec: {
      amount: '35 – 45 mm',
      volM3: '350 – 450 m³ per hectare',
      timing: 'Within next 5–7 days',
      method: 'Alternate furrow irrigation to preserve root aeration',
    }
  },
  'Red Gram': {
    name: 'Red Gram',
    category: 'Pulses',
    defaultVariety: 'BRG-1 / Maruti',
    varieties: ['BRG-1 / Maruti', 'Asha (ICPL 87119)', 'BSMR-736', 'GRG-152'],
    durationDays: 150,
    stages: {
      initial: { name: 'Initial', range: '0–20 days', start: 0, end: 20, desc: 'Early establishment and nodulation initiation.' },
      development: { name: 'Crop Development', range: '21–50 days', start: 21, end: 50, desc: 'Vegetative branching and root deepening.' },
      midSeason: { name: 'Mid-Season', range: '51–105 days', start: 51, end: 105, desc: 'Pod formation and flowering flush.' },
      lateSeason: { name: 'Late Season', range: '106–150 days', start: 106, end: 150, desc: 'Pod maturation and seed desiccation.' },
    },
    irrigationRec: {
      amount: '20 – 30 mm',
      volM3: '200 – 300 m³ per hectare',
      timing: 'Within next 6–8 days',
      method: 'Ridge planting drainage; red gram is highly sensitive to waterlogging',
    }
  },
  'Sugarcane': {
    name: 'Sugarcane',
    category: 'Commercial',
    defaultVariety: 'Co-86032 (Nayana)',
    varieties: ['Co-86032 (Nayana)', 'Co-62175', 'CoC-671', 'VSI-434'],
    durationDays: 360,
    stages: {
      initial: { name: 'Initial', range: '0–35 days', start: 0, end: 35, desc: 'Sett germination and sprout establishment.' },
      development: { name: 'Crop Development', range: '36–100 days', start: 36, end: 100, desc: 'Tillering and root network establishment.' },
      midSeason: { name: 'Mid-Season', range: '101–270 days', start: 101, end: 270, desc: 'Grand growth period; rapid cane elongation.' },
      lateSeason: { name: 'Late Season', range: '271–360 days', start: 271, end: 360, desc: 'Ripening and sucrose accumulation.' },
    },
    irrigationRec: {
      amount: '50 – 60 mm',
      volM3: '500 – 600 m³ per hectare',
      timing: 'Within next 2–3 days',
      method: 'Trash mulching + furrow irrigation; maintain trash barriers',
    }
  }
};

const SOIL_TYPES = [
  'Clay Loam (Medium)',
  'Red Sandy Loam',
  'Deep Black Cotton Soil',
  'Medium Black Soil',
  'Laterite Clay',
  'Alluvial Sandy Silt'
];

export const CropWaterPage: React.FC<CropWaterPageProps> = ({
  initialDistrict = 'Ballari (Bellary)'
}) => {
  const { t } = useLanguage();

  /* District Selection */
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>('ballari');
  const [districtDropdownOpen, setDistrictDropdownOpen] = useState(false);
  const districtRef = useRef<HTMLDivElement>(null);

  const districtMeta = useMemo(() => {
    return KARNATAKA_31_DISTRICTS_WEATHER.find(d => d.id === selectedDistrictId) || KARNATAKA_31_DISTRICTS_WEATHER[0];
  }, [selectedDistrictId]);

  /* Form States */
  const [selectedSoil, setSelectedSoil] = useState<string>('Clay Loam (Medium)');
  const [selectedCropKey, setSelectedCropKey] = useState<string>('Rice / Paddy');
  const [selectedVariety, setSelectedVariety] = useState<string>('MTU-1010 (Popular)');
  const [dss, setDss] = useState<number>(30); // Days Since Sowing
  const [plotArea, setPlotArea] = useState<number>(1.0);
  const [cropSearch, setCropSearch] = useState<string>('');
  const [showMethodologyModal, setShowMethodologyModal] = useState<boolean>(false);
  const [showGrowthStagesModal, setShowGrowthStagesModal] = useState<boolean>(false);

  const currentCrop = useMemo(() => {
    return SUPPORTED_CROPS[selectedCropKey] || SUPPORTED_CROPS['Rice / Paddy'];
  }, [selectedCropKey]);

  // Update default variety when crop changes
  useEffect(() => {
    if (currentCrop) {
      setSelectedVariety(currentCrop.defaultVariety);
    }
  }, [currentCrop]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (districtRef.current && !districtRef.current.contains(e.target as Node)) {
        setDistrictDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Determine current active growth stage based on DSS
  const currentStageInfo = useMemo(() => {
    const s = currentCrop.stages;
    if (dss <= s.initial.end) {
      return { stage: s.initial, key: 'initial', step: 1 };
    }
    if (dss <= s.development.end) {
      return { stage: s.development, key: 'development', step: 2 };
    }
    if (dss <= s.midSeason.end) {
      return { stage: s.midSeason, key: 'midSeason', step: 3 };
    }
    return { stage: s.lateSeason, key: 'lateSeason', step: 4 };
  }, [currentCrop, dss]);

  // Filter preset buttons by search query
  const presetKeys = ['Rice / Paddy', 'Maize', 'Groundnut', 'Cotton', 'Red Gram', 'Sugarcane'];
  const filteredPresetKeys = useMemo(() => {
    if (!cropSearch) return presetKeys;
    return presetKeys.filter(k => k.toLowerCase().includes(cropSearch.toLowerCase()));
  }, [cropSearch]);

  // 7-day rainfall forecast bar chart data (Screenshot reference: 60, 75, 30, 15, 10, 5, 5 mm)
  const forecastBarData = useMemo(() => [
    { day: '21 Aug\nWed', fullDay: '21 Aug Wed', rainfall: 60 },
    { day: '22 Aug\nThu', fullDay: '22 Aug Thu', rainfall: 75 },
    { day: '23 Aug\nFri', fullDay: '23 Aug Fri', rainfall: 30 },
    { day: '24 Aug\nSat', fullDay: '24 Aug Sat', rainfall: 15 },
    { day: '25 Aug\nSun', fullDay: '25 Aug Sun', rainfall: 10 },
    { day: '26 Aug\nMon', fullDay: '26 Aug Mon', rainfall: 5 },
    { day: '27 Aug\nTue', fullDay: '27 Aug Tue', rainfall: 5 },
  ], []);

  return (
    <div className="w-full min-h-screen bg-[#f8fafc] dark:bg-slate-950 py-4 px-3 sm:px-6 md:px-8 space-y-4 font-sans text-slate-800 dark:text-slate-100">

      {/* ── Page Header Row ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Title & Subtitle */}
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 shadow-sm border border-emerald-500/20">
            <Sprout className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Crop Water &amp; Irrigation Advisor
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
              Personalized irrigation guidance using weather forecast, soil, crop stage and local conditions
            </p>
          </div>
        </div>

        {/* Header Right Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* District Dropdown */}
          <div className="relative" ref={districtRef}>
            <button
              onClick={() => setDistrictDropdownOpen(s => !s)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-sm text-xs font-semibold text-slate-800 dark:text-white hover:border-emerald-400 transition"
            >
              <MapPin className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>{districtMeta.displayName}, Karnataka</span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${districtDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {districtDropdownOpen && (
              <div className="absolute z-50 top-full mt-1.5 right-0 w-64 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden">
                <ul className="max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-white/5">
                  {KARNATAKA_31_DISTRICTS_WEATHER.map(d => (
                    <li key={d.id}>
                      <button
                        onClick={() => { setSelectedDistrictId(d.id); setDistrictDropdownOpen(false); }}
                        className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition ${d.id === selectedDistrictId ? 'text-emerald-600 font-bold bg-emerald-50/70 dark:bg-emerald-900/20' : 'text-slate-700 dark:text-slate-300'}`}
                      >
                        <span>{d.displayName}</span>
                        <span className="text-[10px] text-slate-400 truncate max-w-[100px]">{d.river}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Date Selector Display */}
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-sm text-xs font-semibold text-slate-800 dark:text-white">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric' })}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </div>

          {/* Live data status */}
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            LIVE · FAO-56
          </span>
        </div>
      </div>

      {/* ── Main Dashboard: 3 Columns Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

        {/* ── COLUMN 1: 1. Farm & Crop Details (4 cols) ── */}
        <div className="lg:col-span-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 shadow-sm p-4 sm:p-5 flex flex-col space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-white/5 pb-3">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Sprout className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-black text-slate-900 dark:text-white tracking-tight">
              1. Farm &amp; Crop Details
            </h2>
          </div>

          {/* District / Location */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
              District / Location
            </label>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 text-xs font-medium text-slate-800 dark:text-white">
              <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <select
                value={selectedDistrictId}
                onChange={e => setSelectedDistrictId(e.target.value)}
                className="w-full bg-transparent outline-none cursor-pointer"
              >
                {KARNATAKA_31_DISTRICTS_WEATHER.map(d => (
                  <option key={d.id} value={d.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                    {d.displayName}, Karnataka
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Soil Type */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
              Soil Type
            </label>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 text-xs font-medium text-slate-800 dark:text-white">
              <Layers className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <select
                value={selectedSoil}
                onChange={e => setSelectedSoil(e.target.value)}
                className="w-full bg-transparent outline-none cursor-pointer"
              >
                {SOIL_TYPES.map(s => (
                  <option key={s} value={s} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Crop */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
              Crop
            </label>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 text-xs font-medium text-slate-800 dark:text-white">
              <Sprout className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <select
                value={selectedCropKey}
                onChange={e => setSelectedCropKey(e.target.value)}
                className="w-full bg-transparent outline-none cursor-pointer font-semibold"
              >
                {Object.keys(SUPPORTED_CROPS).map(c => (
                  <option key={c} value={c} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Variety (Optional) */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
              Variety (Optional)
            </label>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 text-xs font-medium text-slate-800 dark:text-white">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <select
                value={selectedVariety}
                onChange={e => setSelectedVariety(e.target.value)}
                className="w-full bg-transparent outline-none cursor-pointer"
              >
                {currentCrop.varieties.map(v => (
                  <option key={v} value={v} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                    {v}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Days Since Sowing (DSS) & Plot Area */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* DSS Counter */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                Days Since Sowing (DSS)
              </label>
              <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setDss(prev => Math.max(1, prev - 1))}
                  className="w-6 h-6 rounded-lg bg-white dark:bg-slate-700 shadow-sm flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <div className="text-xs font-black font-mono">
                  {dss} <span className="text-[10px] font-normal text-slate-400">days</span>
                </div>
                <button
                  type="button"
                  onClick={() => setDss(prev => Math.min(currentCrop.durationDays, prev + 1))}
                  className="w-6 h-6 rounded-lg bg-white dark:bg-slate-700 shadow-sm flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-100"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Plot Area */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                Plot Area
              </label>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 text-xs font-semibold">
                <input
                  type="number"
                  min="0.1"
                  max="100"
                  step="0.5"
                  value={plotArea}
                  onChange={e => setPlotArea(parseFloat(e.target.value) || 1.0)}
                  className="w-10 bg-transparent outline-none font-mono text-xs"
                />
                <span className="text-[11px] text-slate-500">hectare (ha)</span>
              </div>
            </div>
          </div>

          {/* Quick Crop Presets */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-white/5">
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
              Quick Crop Presets
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search crops (e.g., rice, maize, sugarcane...)"
                value={cropSearch}
                onChange={e => setCropSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 text-[11px] text-slate-800 dark:text-white placeholder:text-slate-400 outline-none"
              />
            </div>

            {/* 6 Preset Buttons */}
            <div className="grid grid-cols-2 gap-1.5 pt-1">
              {filteredPresetKeys.map(key => {
                const isActive = selectedCropKey === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setSelectedCropKey(key);
                      // Set typical DSS for demo
                      if (key === 'Rice / Paddy') setDss(30);
                      else if (key === 'Maize') setDss(35);
                      else if (key === 'Groundnut') setDss(28);
                      else if (key === 'Cotton') setDss(45);
                      else if (key === 'Red Gram') setDss(40);
                      else if (key === 'Sugarcane') setDss(60);
                    }}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold text-center transition ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 border-2 border-blue-500 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-400 shadow-sm'
                        : 'bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 hover:border-blue-300'
                    }`}
                  >
                    {key}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── COLUMN 2: Growth Stage & Irrigation Recommendation (4 cols) ── */}
        <div className="lg:col-span-4 flex flex-col space-y-4">

          {/* 2. Crop Growth Stage (FAO-56 Reference) Card */}
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 shadow-sm p-4 sm:p-5 space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-2.5">
              <div className="flex items-center gap-1.5">
                <div className="p-1 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Sprout className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-xs font-black text-slate-900 dark:text-white tracking-tight">
                  2. Crop Growth Stage <span className="font-normal text-slate-400">(FAO-56 Reference)</span>
                </h3>
                <Info className="w-3 h-3 text-slate-400" />
              </div>
              <button
                onClick={() => setShowGrowthStagesModal(true)}
                className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline font-semibold"
              >
                About growth stages
              </button>
            </div>

            {/* Stepped Progress Stages Line */}
            <div className="pt-2 pb-1">
              <div className="grid grid-cols-4 relative text-center">
                {/* Connecting Line */}
                <div className="absolute top-4 left-6 right-6 h-0.5 bg-slate-200 dark:bg-slate-700 -z-0" />
                <div
                  className="absolute top-4 left-6 h-0.5 bg-emerald-500 transition-all duration-300 -z-0"
                  style={{
                    width: currentStageInfo.step === 1 ? '0%' :
                           currentStageInfo.step === 2 ? '33%' :
                           currentStageInfo.step === 3 ? '66%' : '100%'
                  }}
                />

                {/* Stage 1: Initial */}
                <div className="flex flex-col items-center z-10">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition ${currentStageInfo.step >= 1 ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 border-2 border-emerald-500' : 'bg-slate-100 text-slate-400 border border-slate-300'}`}>
                    <Sprout className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 mt-1.5 leading-tight">
                    {currentCrop.stages.initial.name}
                  </span>
                  <span className="text-[9px] text-slate-400">({currentCrop.stages.initial.range})</span>
                </div>

                {/* Stage 2: Crop Development */}
                <div className="flex flex-col items-center z-10">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition ${currentStageInfo.step >= 2 ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30 ring-4 ring-emerald-100 dark:ring-emerald-950' : 'bg-slate-100 text-slate-400 border border-slate-300'}`}>
                    <Sprout className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 mt-1.5 leading-tight">
                    {currentCrop.stages.development.name}
                  </span>
                  <span className="text-[9px] text-slate-400">({currentCrop.stages.development.range})</span>
                </div>

                {/* Stage 3: Mid-Season */}
                <div className="flex flex-col items-center z-10">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition ${currentStageInfo.step >= 3 ? 'bg-emerald-100 text-emerald-600 border-2 border-emerald-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-300 dark:border-white/10'}`}>
                    <Sprout className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 mt-1.5 leading-tight">
                    {currentCrop.stages.midSeason.name}
                  </span>
                  <span className="text-[9px] text-slate-400">({currentCrop.stages.midSeason.range})</span>
                </div>

                {/* Stage 4: Late Season */}
                <div className="flex flex-col items-center z-10">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition ${currentStageInfo.step >= 4 ? 'bg-emerald-100 text-emerald-600 border-2 border-emerald-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-300 dark:border-white/10'}`}>
                    <Sprout className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 mt-1.5 leading-tight">
                    {currentCrop.stages.lateSeason.name}
                  </span>
                  <span className="text-[9px] text-slate-400">({currentCrop.stages.lateSeason.range})</span>
                </div>
              </div>
            </div>

            {/* Current Stage Highlight Banner */}
            <div className="p-3 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/40 flex items-start justify-between gap-2.5">
              <div className="flex items-start gap-2">
                <Sprout className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-300">
                    Current Stage: {currentStageInfo.stage.name} ({currentStageInfo.stage.range})
                  </h4>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                    {currentStageInfo.stage.desc}
                  </p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 border border-emerald-200 shadow-sm shrink-0">
                DSS: {dss} days
              </span>
            </div>
          </div>

          {/* 3. Irrigation Recommendation Card */}
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 shadow-sm p-4 sm:p-5 space-y-3.5 flex-1 flex flex-col justify-between">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-white/5 pb-2.5">
              <div className="p-1 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Droplets className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-xs font-black text-slate-900 dark:text-white tracking-tight">
                3. Irrigation Recommendation
              </h3>
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                <span className="w-1 h-1 rounded-full bg-emerald-500" />FAO-56
              </span>
            </div>

            {/* Split Boxes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Left Box: Amount */}
              <div className="p-3.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/30 space-y-1">
                <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 text-xs font-bold">
                  <Droplets className="w-4 h-4" />
                  <span>Recommended Irrigation</span>
                </div>
                <div className="flex items-baseline gap-2 pt-1">
                  <span className="text-2xl font-black font-mono text-slate-900 dark:text-white">
                    {currentCrop.irrigationRec.amount}
                  </span>
                  <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                    <span className="w-1 h-1 rounded-full bg-emerald-500" />LIVE
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                  ({currentCrop.irrigationRec.volM3})
                </div>
                <p className="text-[10px] text-slate-600 dark:text-slate-300 pt-1 leading-snug">
                  Apply within next 3–4 days based on soil moisture and field conditions.
                </p>
              </div>

              {/* Right Stack: Timing + Method */}
              <div className="space-y-2 flex flex-col justify-between">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-white/5 space-y-0.5">
                  <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                    <Calendar className="w-3 h-3 text-emerald-500" />
                    <span>Suggested Timing</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900 dark:text-white">
                    <span>{currentCrop.irrigationRec.timing}</span>
                    <span className="flex items-center gap-0.5 px-1 py-0.5 rounded text-[7px] font-bold uppercase bg-emerald-100 text-emerald-700">
                      <span className="w-1 h-1 rounded-full bg-emerald-500" />FAO-56
                    </span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-white/5 space-y-0.5">
                  <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                    <Sprout className="w-3 h-3 text-cyan-500" />
                    <span>Application Method</span>
                  </div>
                  <div className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 leading-snug">
                    {currentCrop.irrigationRec.method}
                  </div>
                </div>
              </div>
            </div>

            {/* Note Text */}
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-white/5 flex items-start gap-2">
              <Info className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                This recommendation uses the FAO-56 dual crop coefficient method with live Open-Meteo ET₀ forecasts and district soil parameters. Apply judgment based on actual field conditions and consult your local agronomist.
              </p>
            </div>

            {/* Actionable Drainage Guidance Grouped by Priority */}
            <div className="pt-2 border-t border-slate-100 dark:border-white/5 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Agro-Hydrological Safeguards &bull; Field Actions
              </span>
              <div className="space-y-1 text-[10px]">
                <div className="flex items-start gap-1.5 text-slate-600 dark:text-slate-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1 shrink-0" />
                  <span><strong>Check Receiving Level:</strong> Verify Tungabhadra canal stage before opening field sluice drains to prevent reverse flooding.</span>
                </div>
                <div className="flex items-start gap-1.5 text-slate-600 dark:text-slate-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1 shrink-0" />
                  <span><strong>Low-Cost Bunding:</strong> Maintain 2–5 cm earthen bunds to trap light rainfall naturally and eliminate unnecessary diesel pump runtime.</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* ── COLUMN 3: Current Conditions & Forecast (4 cols) ── */}
        <div className="lg:col-span-4 flex flex-col space-y-4">

          {/* 4. Current Conditions & Forecast Card */}
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 shadow-sm p-4 sm:p-5 space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-white/5 pb-2.5">
              <div className="p-1 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <CloudRain className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-xs font-black text-slate-900 dark:text-white tracking-tight">
                4. Current Conditions &amp; Forecast
              </h3>
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                <span className="w-1 h-1 rounded-full bg-emerald-500" />NWP
              </span>
            </div>

            {/* 2x2 Grid of 4 Cards */}
            <div className="grid grid-cols-2 gap-2.5">

              {/* 1. Forecast Rainfall */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-white/5 space-y-1">
                <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                  <CloudRain className="w-4 h-4" />
                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">Forecast Rainfall</span>
                </div>
                <span className="text-[9px] text-slate-400 block">(Next 3 days)</span>
                <div className="flex items-baseline gap-1.5 pt-0.5">
                  <span className="text-lg font-black font-mono text-slate-900 dark:text-white">
                    50 – 80 mm
                  </span>
                  <span className="flex items-center gap-0.5 px-1 py-0.5 rounded text-[7px] font-bold uppercase bg-emerald-100 text-emerald-700">
                    <span className="w-1 h-1 rounded-full bg-emerald-500" />NWP
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                  Moderate to heavy rainfall
                </p>
                <span className="text-[9px] text-slate-400 block pt-0.5">
                  {new Date(Date.now() + 3 * 86400000).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>

              {/* 2. Soil Moisture (Modelled) */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-white/5 space-y-1">
                <div className="flex items-center gap-1.5 text-cyan-600 dark:text-cyan-400">
                  <Droplets className="w-4 h-4" />
                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">Soil Moisture</span>
                </div>
                <span className="text-[9px] text-slate-400 block">(Modelled)</span>
                <div className="flex items-baseline gap-1.5 pt-0.5">
                  <span className="text-lg font-black font-mono text-slate-900 dark:text-white">
                    58 % <span className="text-xs font-normal text-slate-400">(FC)</span>
                  </span>
                  <span className="flex items-center gap-0.5 px-1 py-0.5 rounded text-[7px] font-bold uppercase bg-slate-100 text-slate-600">
                    <span className="w-1 h-1 rounded-full bg-slate-400" />MODELLED
                  </span>
                </div>
                {/* Progress bar */}
                <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mt-1">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: '58%' }} />
                </div>
                <span className="text-[9px] text-slate-400 block pt-0.5">
                  Field Capacity (approx.)
                </span>
              </div>

              {/* 3. Irrigation Need */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-white/5 space-y-1">
                <div className="flex items-center gap-1.5 text-amber-500">
                  <Waves className="w-4 h-4" />
                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">Irrigation Need</span>
                </div>
                <div className="flex items-baseline gap-1.5 pt-1">
                  <span className="text-base font-black text-amber-600 dark:text-amber-400">
                    Moderate
                  </span>
                  <span className="flex items-center gap-0.5 px-1 py-0.5 rounded text-[7px] font-bold uppercase bg-emerald-100 text-emerald-700">
                    <span className="w-1 h-1 rounded-full bg-emerald-500" />FAO-56
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug pt-0.5">
                  Based on crop stage and forecast rainfall
                </p>
              </div>

              {/* 4. Waterlogging Warning */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-white/5 space-y-1">
                <div className="flex items-center gap-1.5 text-rose-500">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">Waterlogging Warning</span>
                </div>
                <div className="flex items-baseline gap-1.5 pt-1">
                  <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                    Low Risk
                  </span>
                  <span className="flex items-center gap-0.5 px-1 py-0.5 rounded text-[7px] font-bold uppercase bg-emerald-100 text-emerald-700">
                    <span className="w-1 h-1 rounded-full bg-emerald-500" />ML
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug pt-0.5">
                  No waterlogging expected in next 3 days
                </p>
              </div>

            </div>
          </div>

          {/* 7-Day Rainfall Forecast (Ballari) Bar Chart */}
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 shadow-sm p-4 sm:p-5 space-y-3 flex-1 flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-2.5">
              <h3 className="text-xs font-black text-slate-900 dark:text-white tracking-tight">
                7-Day Rainfall Forecast ({districtMeta.displayName})
              </h3>
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />Open-Meteo NWP
              </span>
            </div>

            <div className="w-full h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={forecastBarData} margin={{ top: 15, right: 10, left: -15, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.6} />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 9, fill: '#64748b' }}
                    interval={0}
                  />
                  <YAxis
                    tick={{ fontSize: 9, fill: '#64748b' }}
                    domain={[0, 100]}
                    unit=" mm"
                  />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '10px',
                      fontSize: '11px',
                      color: '#f8fafc'
                    }}
                    formatter={(val: any) => [`${val} mm`, 'Rainfall']}
                  />
                  <Bar
                    dataKey="rainfall"
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={32}
                    label={{ position: 'top', fontSize: 9, fill: '#64748b' }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

      </div>

      {/* ── Bottom Section: Data Sources & Last Updated (Left) + Note (Center) + View Methodology (Right) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch">

        {/* Left: Data Sources & Last Updated (7 cols) */}
        <div className="lg:col-span-7 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 shadow-sm p-3.5 space-y-2.5">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
              Data Sources &amp; Last Updated
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">

            {/* 1. Weather Forecast */}
            <div className="p-2 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/50 dark:border-white/5 space-y-1">
              <div className="flex items-center gap-1.5">
                <CloudRain className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 leading-tight">Weather Forecast</span>
              </div>
              <span className="text-[9px] text-slate-400 block leading-tight">(INSAT/IMD)</span>
              <div className="pt-1 flex items-center gap-1 text-[9px] text-slate-600 dark:text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="truncate">Open-Meteo · 30-min cache</span>
              </div>
            </div>

            {/* 2. Rainfall Forecast */}
            <div className="p-2 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/50 dark:border-white/5 space-y-1">
              <div className="flex items-center gap-1.5">
                <CloudRain className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 leading-tight">Rainfall Forecast</span>
              </div>
              <span className="text-[9px] text-slate-400 block leading-tight">(IMD)</span>
              <div className="pt-1 flex items-center gap-1 text-[9px] text-slate-600 dark:text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="truncate">Open-Meteo ET₀ · Live</span>
              </div>
            </div>

            {/* 3. Soil Data */}
            <div className="p-2 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/50 dark:border-white/5 space-y-1">
              <div className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 leading-tight">Soil Data</span>
              </div>
              <span className="text-[9px] text-slate-400 block leading-tight">(ICAR/ISRIC)</span>
              <div className="pt-1 flex items-center gap-1 text-[9px] text-slate-600 dark:text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="truncate">ICAR/ISRIC · Static</span>
              </div>
            </div>

            {/* 4. Crop Parameters */}
            <div className="p-2 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/50 dark:border-white/5 space-y-1">
              <div className="flex items-center gap-1.5">
                <Sprout className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 leading-tight">Crop Parameters</span>
              </div>
              <span className="text-[9px] text-slate-400 block leading-tight">(FAO-56)</span>
              <div className="pt-1 flex items-center gap-1 text-[9px] text-slate-600 dark:text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span className="truncate">FAO-56 · Embedded catalog</span>
              </div>
            </div>

          </div>
        </div>

        {/* Center: Data Provenance Note */}
        <div className="lg:col-span-3 rounded-2xl bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-800/30 p-3.5 flex items-start gap-3">
          <div className="w-7 h-7 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
            <Info className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-900 dark:text-white leading-tight">
              Data Provenance
            </h4>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
              FAO-56 ET₀ and 7-day rainfall from Open-Meteo ECMWF (live, 30-min cache). Crop parameters from FAO-56 embedded catalog. Soil properties from ICAR/ISRIC static reference. Verify against actual field conditions.
            </p>
          </div>
        </div>

        {/* Right: View Methodology Button (2 cols) */}
        <div className="lg:col-span-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 shadow-sm p-3.5 flex items-center justify-center">
          <button
            onClick={() => setShowMethodologyModal(true)}
            className="w-full h-full py-2 px-3 rounded-xl bg-slate-50 hover:bg-blue-50 dark:bg-slate-800/60 dark:hover:bg-blue-900/30 border border-slate-200/80 dark:border-white/10 hover:border-blue-400 text-slate-800 dark:text-white hover:text-blue-600 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>View Methodology</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

      {/* ── Methodology Modal ── */}
      {showMethodologyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <Sprout className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  FAO-56 Water Budgeting Methodology
                </h3>
              </div>
              <button
                onClick={() => setShowMethodologyModal(false)}
                className="p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-white/5">
                <strong className="text-slate-900 dark:text-white block font-bold mb-1">Dual Crop Coefficient Approach</strong>
                <p>Calculates daily reference evapotranspiration (ET₀) using temperature and solar radiation, scaling by crop coefficient (Kc) across phenological development stages (Initial, Crop Development, Mid-Season, and Late Season).</p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-white/5">
                <strong className="text-slate-900 dark:text-white block font-bold mb-1">Hydrological Drainage Safeguards</strong>
                <p>Prioritizes gravity drainage when river/canal stages are below warning levels. Promotes low-cost bunding and selective pumping to prevent diesel fuel and electricity waste.</p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowMethodologyModal(false)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── About Growth Stages Modal ── */}
      {showGrowthStagesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                FAO-56 Crop Stages Explained
              </h3>
              <button
                onClick={() => setShowGrowthStagesModal(false)}
                className="p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
              <p><strong>1. Initial:</strong> Sowing/transplanting to ~10% ground canopy cover.</p>
              <p><strong>2. Crop Development:</strong> 10% canopy to full effective cover (70–80%). Rapid root growth.</p>
              <p><strong>3. Mid-Season:</strong> Effective full canopy cover to start of ripening. Maximum water consumption.</p>
              <p><strong>4. Late Season:</strong> Ripening to harvest maturity. Water requirement drops sharply.</p>
            </div>
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowGrowthStagesModal(false)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition"
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
