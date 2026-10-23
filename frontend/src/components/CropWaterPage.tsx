import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Sprout,
  Droplets,
  CloudRain,
  Wind,
  CheckCircle2,
  AlertTriangle,
  Info,
  Calendar,
  MapPin,
  ChevronDown,
  Search,
  RefreshCw,
  Waves,
  Maximize2,
  Minimize2,
  SlidersHorizontal,
  Layers,
  FlaskConical,
  X,
  Sparkles,
  Sun,
  Cloud,
  CloudLightning,
  CloudFog,
  CloudSnow,
} from 'lucide-react';
import { api } from '../services/api';
import { KARNATAKA_108_PLANTS, PlantType } from '../data/karnataka108Plants';
import { KARNATAKA_SOILS, SoilTypeInfo } from '../data/karnatakaSoils';
import {
  KARNATAKA_31_DISTRICTS_WEATHER,
  WeatherDistrict,
} from '../data/karnatakaDistrictsWeather';
import {
  evaluateCropRecommendation,
  CropAdvisorInput,
  RecommendationResult,
} from '../services/cropRecommendationEngine';

function getWeatherDetails(code: number | null | undefined, rainMm?: number) {
  if (code != null) {
    if (code >= 95) return { text: 'Thunderstorm', icon: CloudLightning, color: 'text-amber-500' };
    if (code >= 80) return { text: 'Heavy Rain Showers', icon: CloudRain, color: 'text-blue-600' };
    if (code >= 61) return { text: 'Moderate Rain', icon: CloudRain, color: 'text-blue-500' };
    if (code >= 51) return { text: 'Light Rain', icon: CloudRain, color: 'text-blue-400' };
    if (code >= 45) return { text: 'Fog / Mist', icon: CloudFog, color: 'text-slate-400' };
    if (code >= 71 && code <= 86) return { text: 'Snow / Hail', icon: CloudSnow, color: 'text-sky-300' };
    if (code >= 1 && code <= 3) return { text: 'Partly Cloudy', icon: Cloud, color: 'text-slate-500' };
    if (code === 0) return { text: 'Clear Sky', icon: Sun, color: 'text-amber-500' };
  }
  if (typeof rainMm === 'number') {
    if (rainMm > 15) return { text: 'Heavy Rain', icon: CloudRain, color: 'text-blue-600' };
    if (rainMm > 5) return { text: 'Moderate Rain', icon: CloudRain, color: 'text-blue-500' };
    if (rainMm > 0) return { text: 'Light Rain', icon: CloudRain, color: 'text-blue-400' };
  }
  return { text: 'Mainly Clear', icon: Sun, color: 'text-amber-500' };
}

export interface CropWaterPageProps {
  selectedDistrictId?: string;
  onSelectedDistrictIdChange?: (districtId: string) => void;
  selectedDate?: string;
  onDateChange?: (date: string) => void;
}

export const CropWaterPage: React.FC<CropWaterPageProps> = ({
  selectedDistrictId = 'ballari',
  onSelectedDistrictIdChange,
}) => {
  // ── State: Selected District & Date ──
  const [districtId, setDistrictId] = useState<string>(() => {
    const match = KARNATAKA_31_DISTRICTS_WEATHER.find(
      (d) =>
        d.id === selectedDistrictId ||
        d.name.toLowerCase().includes(selectedDistrictId.toLowerCase()) ||
        d.displayName.toLowerCase().includes(selectedDistrictId.toLowerCase())
    );
    return match ? match.id : 'ballari';
  });

  // Current formatted date in IST
  const todayFormatted = useMemo(() => {
    return new Date().toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'Asia/Kolkata',
    });
  }, []);

  // ── State: Crop, Soil, Season, Farm Type ──
  const [cropId, setCropId] = useState<string>('rice');
  const [soilId, setSoilId] = useState<string>('clay_loam');
  const [season, setSeason] = useState<'Kharif' | 'Rabi' | 'Summer' | 'Annual' | 'Perennial'>('Kharif');
  const [farmType, setFarmType] = useState<string>('Field / Open Land');
  const [waterSource, setWaterSource] = useState<string>('Canal & Borewell');

  // Optional Lab Soil Test Overrides
  const [showLabInputs, setShowLabInputs] = useState<boolean>(false);
  const [userPh, setUserPh] = useState<string>('6.5');
  const [userMoisture, setUserMoisture] = useState<string>('');
  const [userNitrogen, setUserNitrogen] = useState<string>('');
  const [userPhosphorus, setUserPhosphorus] = useState<string>('');
  const [userPotassium, setUserPotassium] = useState<string>('');

  // Dropdown Open States
  const [isDistrictDropdownOpen, setIsDistrictDropdownOpen] = useState(false);
  const [isCropDropdownOpen, setIsCropDropdownOpen] = useState(false);
  const [isSoilDropdownOpen, setIsSoilDropdownOpen] = useState(false);
  const [isSeasonDropdownOpen, setIsSeasonDropdownOpen] = useState(false);
  const [isFarmTypeDropdownOpen, setIsFarmTypeDropdownOpen] = useState(false);

  // Search Queries
  const [districtSearch, setDistrictSearch] = useState('');
  const [cropSearch, setCropSearch] = useState('');
  const [selectedCropCategory, setSelectedCropCategory] = useState<string>('All');

  // Fullscreen container ref
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Weather & recommendation state
  const [liveWeather, setLiveWeather] = useState<any>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [lastWeatherUpdate, setLastWeatherUpdate] = useState<Date | null>(null);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  // Sync external district changes
  useEffect(() => {
    if (selectedDistrictId) {
      const match = KARNATAKA_31_DISTRICTS_WEATHER.find(
        (d) =>
          d.id === selectedDistrictId ||
          d.name.toLowerCase().includes(selectedDistrictId.toLowerCase()) ||
          d.displayName.toLowerCase().includes(selectedDistrictId.toLowerCase())
      );
      if (match && match.id !== districtId) {
        setDistrictId(match.id);
      }
    }
  }, [selectedDistrictId]);

  // Current District Object
  const currentDistrict = useMemo(() => {
    return (
      KARNATAKA_31_DISTRICTS_WEATHER.find((d) => d.id === districtId) ||
      KARNATAKA_31_DISTRICTS_WEATHER[0]
    );
  }, [districtId]);

  // Current Crop Object
  const currentCrop = useMemo(() => {
    return (
      KARNATAKA_108_PLANTS.find((p) => p.id === cropId) ||
      KARNATAKA_108_PLANTS[0]
    );
  }, [cropId]);

  // Current Soil Object
  const currentSoil = useMemo(() => {
    return (
      KARNATAKA_SOILS.find((s) => s.id === soilId) ||
      KARNATAKA_SOILS[0]
    );
  }, [soilId]);

  // Normalized live weather values from Open-Meteo
  const weatherValues = useMemo(() => {
    if (!liveWeather) {
      return {
        tempC: 28,
        apparentTempC: 29,
        humidity: 82,
        rainToday: 42,
        forecastRain: 25,
        windKmh: 12,
        weatherCode: 61,
        condition: 'Light Rain',
        isLive: false,
        daily: [] as any[],
      };
    }

    // Format A: from api.getWeatherByDistrictId (/api/weather/district/:id)
    if (liveWeather.current) {
      const cur = liveWeather.current;
      const code = cur.weather_code ?? 0;
      const cond = getWeatherDetails(code, cur.precipitation).text;
      const rainToday = cur.precipitation != null && cur.precipitation > 0
        ? cur.precipitation
        : (liveWeather.daily?.[0]?.precipitation_sum ?? 0);
      const forecastRain = liveWeather.daily?.[0]?.precipitation_sum ?? (liveWeather.daily?.[1]?.precipitation_sum ?? 0);

      return {
        tempC: Math.round(cur.temperature_2m ?? 28),
        apparentTempC: Math.round(cur.apparent_temperature ?? cur.temperature_2m ?? 28),
        humidity: Math.round(cur.relative_humidity_2m ?? 82),
        rainToday: Math.round(rainToday * 10) / 10,
        forecastRain: Math.round(forecastRain * 10) / 10,
        windKmh: Math.round(cur.wind_speed_10m ?? 12),
        weatherCode: code,
        condition: cond,
        isLive: true,
        daily: Array.isArray(liveWeather.daily) ? liveWeather.daily : [],
      };
    }

    // Format B: from api.getDistrictWeather (/api/weather/forecast/:district)
    if (liveWeather.today) {
      const td = liveWeather.today;
      return {
        tempC: Math.round(td.currentTempC ?? 28),
        apparentTempC: Math.round(td.apparentTempC ?? td.currentTempC ?? 28),
        humidity: Math.round(td.currentHumidityPct ?? 82),
        rainToday: Math.round((td.currentPrecipitationMm ?? td.modeledPrecipitationTotalMm ?? 0) * 10) / 10,
        forecastRain: Math.round((liveWeather.forecast?.forecast24hPrecipMm ?? 0) * 10) / 10,
        windKmh: Math.round(td.currentWindKmh ?? 12),
        weatherCode: td.currentWmoCode ?? 0,
        condition: td.currentCondition ?? 'Mainly Clear',
        isLive: true,
        daily: Array.isArray(liveWeather.sevenDayOutlook) ? liveWeather.sevenDayOutlook : [],
      };
    }

    return {
      tempC: 28,
      apparentTempC: 29,
      humidity: 82,
      rainToday: 42,
      forecastRain: 25,
      windKmh: 12,
      weatherCode: 61,
      condition: 'Light Rain',
      isLive: false,
      daily: [],
    };
  }, [liveWeather]);

  // Live telemetry fetcher with fallback and auto-refresh
  const fetchWeather = useCallback(async () => {
    try {
      setWeatherLoading(true);
      setWeatherError(null);
      // Try live district endpoint first
      let data = await api.getWeatherByDistrictId(currentDistrict.id);
      if (!data || !data.success) {
        data = await api.getDistrictWeather(currentDistrict.displayName);
      }
      setLiveWeather(data);
      setLastWeatherUpdate(new Date());
    } catch (err) {
      console.warn('Primary weather fetch error, attempting fallback:', err);
      try {
        const fallbackData = await api.getDistrictWeather(currentDistrict.displayName);
        setLiveWeather(fallbackData);
        setLastWeatherUpdate(new Date());
      } catch (fallbackErr) {
        console.error('All weather fetches failed:', fallbackErr);
        setWeatherError('Weather offline');
      }
    } finally {
      setWeatherLoading(false);
    }
  }, [currentDistrict.id, currentDistrict.displayName]);

  // Periodic 60s live auto-refresh
  useEffect(() => {
    fetchWeather();
    const interval = setInterval(fetchWeather, 60000);
    return () => clearInterval(interval);
  }, [fetchWeather]);

  const [recommendation, setRecommendation] = useState<RecommendationResult>(() =>
    evaluateCropRecommendation({
      districtId: 'ballari',
      soilId: 'clay_loam',
      selectedCropId: 'rice',
      season: 'Kharif',
      farmType: 'Field / Open Land',
      waterSource: 'Canal & Borewell',
      userPh: 6.5,
      currentTempC: 28,
      currentHumidity: 82,
      rainfallTodayMm: 42,
      forecast24hMm: 25,
    })
  );

  // Recalculate recommendation engine
  const runRecommendation = useCallback(() => {
    const tempC = weatherValues.tempC;
    const humidity = weatherValues.humidity;
    const rainToday = weatherValues.rainToday;
    const forecastRain = weatherValues.forecastRain;

    const parsedPh = userPh ? parseFloat(userPh) : null;
    const parsedMoisture = userMoisture ? parseFloat(userMoisture) : null;

    // Map daily forecast if available
    const dailyForecast = weatherValues.daily.map((item: any) => ({
      date: item.date || item.day,
      tempMaxC: item.temp_max ?? item.maxTemp,
      tempMinC: item.temp_min ?? item.minTemp,
      precipitationMm: item.precipitation_sum ?? item.precip ?? 0,
      precipitationProb: item.precipitation_probability ?? item.rainProb,
      weatherCode: item.weather_code ?? item.weatherCode,
    }));

    const input: CropAdvisorInput = {
      districtId: currentDistrict.id,
      soilId: currentSoil.id,
      selectedCropId: currentCrop.id,
      season,
      farmType,
      waterSource,
      userPh: Number.isFinite(parsedPh) ? parsedPh : null,
      userMoisture: Number.isFinite(parsedMoisture) ? parsedMoisture : null,
      currentTempC: tempC,
      currentHumidity: humidity,
      rainfallTodayMm: rainToday,
      forecast24hMm: forecastRain,
      dailyForecast: dailyForecast.length > 0 ? dailyForecast : undefined,
    };

    const res = evaluateCropRecommendation(input);
    setRecommendation(res);
  }, [
    currentDistrict.id,
    currentSoil.id,
    currentCrop.id,
    season,
    farmType,
    waterSource,
    userPh,
    userMoisture,
    weatherValues,
  ]);

  // Re-run recommendation whenever inputs or live weather change
  useEffect(() => {
    runRecommendation();
  }, [runRecommendation]);

  // Reset to default baseline (Rice, Clay Loam, Kharif, Ballari)
  const handleReset = () => {
    setDistrictId('ballari');
    if (onSelectedDistrictIdChange) onSelectedDistrictIdChange('ballari');
    setCropId('rice');
    setSoilId('clay_loam');
    setSeason('Kharif');
    setFarmType('Field / Open Land');
    setWaterSource('Canal & Borewell');
    setUserPh('6.5');
    setUserMoisture('');
    setUserNitrogen('');
    setUserPhosphorus('');
    setUserPotassium('');
    setShowLabInputs(false);
    setCropSearch('');
    setSelectedCropCategory('All');
  };

  // Filter 108 crops
  const filteredCrops = useMemo(() => {
    let list = KARNATAKA_108_PLANTS;
    if (selectedCropCategory !== 'All') {
      list = list.filter((c) => c.category === selectedCropCategory);
    }
    if (cropSearch.trim()) {
      const q = cropSearch.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.kannadaName.toLowerCase().includes(q) ||
          c.scientificName.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q)
      );
    }
    return list;
  }, [cropSearch, selectedCropCategory]);

  // Filter 31 districts
  const filteredDistricts = useMemo(() => {
    if (!districtSearch.trim()) return KARNATAKA_31_DISTRICTS_WEATHER;
    const q = districtSearch.toLowerCase().trim();
    return KARNATAKA_31_DISTRICTS_WEATHER.filter(
      (d) =>
        d.displayName.toLowerCase().includes(q) ||
        d.name.toLowerCase().includes(q) ||
        d.zone.toLowerCase().includes(q)
    );
  }, [districtSearch]);

  // Toggle Fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  // Weather values from live API
  const currentTemp = weatherValues.tempC;
  const currentCondition = weatherValues.condition;
  const currentHumidity = weatherValues.humidity;
  const rainfallToday = weatherValues.rainToday;
  const currentWind = weatherValues.windKmh;

  // Circular score progress gauge math
  const score = recommendation.scores.overallScore;
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div
      ref={containerRef}
      className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-4 px-3 py-3 sm:px-6 sm:py-4 font-sans text-slate-800 dark:text-slate-100"
    >
      {/* ── 1. Top Header Bar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-3 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 shadow-sm dark:bg-emerald-500/20 dark:text-emerald-400">
            <Sprout size={26} className="stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl dark:text-white">
              Crop Advisor
            </h1>
            <p className="text-xs text-slate-500 sm:text-sm dark:text-slate-400">
              Personalized crop recommendations based on weather, soil and water conditions
            </p>
          </div>
        </div>

        {/* Right Header Badges: District Selector + Date + Expand */}
        <div className="flex items-center gap-2">
          {/* District Dropdown Selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsDistrictDropdownOpen(!isDistrictDropdownOpen)}
              className="inline-flex items-center gap-2 rounded-xl border border-blue-200/80 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs transition hover:border-blue-400 hover:bg-blue-50/50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <MapPin size={15} className="text-blue-600 dark:text-blue-400" />
              <span>{currentDistrict.displayName}, Karnataka</span>
              <ChevronDown size={14} className="text-slate-400" />
            </button>

            {isDistrictDropdownOpen && (
              <div className="absolute right-0 top-full z-50 mt-1.5 w-80 rounded-2xl border border-slate-200 bg-white p-2.5 shadow-xl dark:border-slate-700 dark:bg-slate-900">
                <div className="relative mb-2">
                  <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={districtSearch}
                    onChange={(e) => setDistrictSearch(e.target.value)}
                    placeholder="Search all 31 districts..."
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-2 text-xs text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    autoFocus
                  />
                </div>
                <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
                  {filteredDistricts.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => {
                        setDistrictId(d.id);
                        if (onSelectedDistrictIdChange) onSelectedDistrictIdChange(d.id);
                        setIsDistrictDropdownOpen(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition ${
                        d.id === districtId
                          ? 'bg-blue-50 font-semibold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                          : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div>
                        <div>{d.displayName}</div>
                        <div className="text-[10px] text-slate-400 font-normal">{d.zone}</div>
                      </div>
                      {d.id === districtId && (
                        <CheckCircle2 size={13} className="text-blue-600 dark:text-blue-400" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Date Indicator Pill */}
          <div className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white px-3 py-2 text-xs font-medium text-slate-600 shadow-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <Calendar size={14} className="text-blue-500" />
            <span>{todayFormatted}</span>
          </div>

          {/* Fullscreen Expand Button */}
          <button
            type="button"
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Expand Fullscreen'}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/90 bg-white text-slate-500 shadow-xs transition hover:bg-slate-50 hover:text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:text-slate-100"
          >
            {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
        </div>
      </div>

      {/* ── 2. Primary Control Bar: 3 Steps + Action Buttons ── */}
      <div className="rounded-2xl border border-blue-100/80 bg-white p-3.5 shadow-xs dark:border-slate-800 dark:bg-slate-900/90">
        <div className="grid grid-cols-1 items-end gap-3 lg:grid-cols-12">
          {/* Step 1: Select Crop (108 plants catalogue) */}
          <div className="lg:col-span-4 relative">
            <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
              <Sprout size={14} className="text-emerald-500" />
              <span>1. Select Crop</span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mb-1">
              Choose a crop (Current Season)
            </div>
            <button
              type="button"
              onClick={() => setIsCropDropdownOpen(!isCropDropdownOpen)}
              className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2.5 text-xs font-semibold text-slate-800 transition hover:border-blue-400 hover:bg-white dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-base shadow-xs dark:bg-amber-950/50">
                  {currentCrop.iconEmoji}
                </div>
                <div className="text-left">
                  <div className="font-semibold text-slate-900 dark:text-white leading-tight">
                    {currentCrop.name}
                  </div>
                  <div className="text-[10px] text-slate-500 font-normal">
                    {currentCrop.kannadaName}
                  </div>
                </div>
              </div>
              <ChevronDown size={14} className="text-slate-400" />
            </button>

            {/* 108-Crop Searchable Modal Dropdown */}
            {isCropDropdownOpen && (
              <div className="absolute left-0 top-full z-50 mt-1.5 w-full min-w-[340px] max-w-[420px] rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
                <div className="relative mb-2">
                  <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={cropSearch}
                    onChange={(e) => setCropSearch(e.target.value)}
                    placeholder="Search 108 crops by English, Kannada or Scientific name..."
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-2 text-xs text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    autoFocus
                  />
                </div>

                {/* Categories Tabs */}
                <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-none text-[10px]">
                  {[
                    'All',
                    'Cereals & Millets',
                    'Pulses',
                    'Oilseeds',
                    'Commercial & Fiber',
                    'Vegetables',
                    'Fruits',
                    'Plantation Crops',
                    'Spices & Condiments',
                    'Fodder Crops',
                    'Aromatic & Medicinal',
                  ].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCropCategory(cat)}
                      className={`whitespace-nowrap rounded-md px-2 py-0.5 font-medium transition ${
                        selectedCropCategory === cat
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="max-h-72 overflow-y-auto space-y-1 divide-y divide-slate-100 dark:divide-slate-800/60 pr-1">
                  {filteredCrops.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setCropId(c.id);
                        setIsCropDropdownOpen(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-xs transition ${
                        c.id === cropId
                          ? 'bg-emerald-50 text-emerald-900 font-semibold dark:bg-emerald-950/60 dark:text-emerald-200'
                          : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">{c.iconEmoji}</span>
                        <div>
                          <div className="font-medium text-slate-900 dark:text-white leading-tight">
                            {c.name}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {c.kannadaName} · <span className="italic">{c.scientificName}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="rounded-sm bg-slate-100 px-1.5 py-0.5 text-[9px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                          {c.waterDemand} Water
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Select Soil Type */}
          <div className="lg:col-span-3 relative">
            <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
              <Layers size={14} className="text-amber-600" />
              <span>2. Select Soil Type</span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mb-1">
              Choose your soil type
            </div>
            <button
              type="button"
              onClick={() => setIsSoilDropdownOpen(!isSoilDropdownOpen)}
              className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2.5 text-xs font-semibold text-slate-800 transition hover:border-blue-400 hover:bg-white dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100"
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="h-7 w-7 rounded-lg border shadow-xs"
                  style={{
                    backgroundColor: currentSoil.swatchBg,
                    borderColor: currentSoil.swatchBorder,
                  }}
                />
                <div className="text-left font-semibold text-slate-900 dark:text-white leading-tight">
                  {currentSoil.name}
                </div>
              </div>
              <ChevronDown size={14} className="text-slate-400" />
            </button>

            {/* Soils Dropdown */}
            {isSoilDropdownOpen && (
              <div className="absolute left-0 top-full z-50 mt-1.5 w-full min-w-[300px] rounded-2xl border border-slate-200 bg-white p-2.5 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
                <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
                  {KARNATAKA_SOILS.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setSoilId(s.id);
                        setIsSoilDropdownOpen(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs transition ${
                        s.id === soilId
                          ? 'bg-amber-50 font-semibold text-amber-900 dark:bg-amber-950/60 dark:text-amber-200'
                          : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className="h-6 w-6 rounded-md border shrink-0"
                          style={{
                            backgroundColor: s.swatchBg,
                            borderColor: s.swatchBorder,
                          }}
                        />
                        <div>
                          <div>{s.name}</div>
                          <div className="text-[10px] text-slate-400">{s.texture}</div>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {s.drainage} Drainage
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Step 3: Optional Details (Season & Farm Type) */}
          <div className="lg:col-span-3">
            <div className="mb-1.5 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-200">
              <div className="flex items-center gap-1.5">
                <SlidersHorizontal size={14} className="text-blue-500" />
                <span>3. Optional Details</span>
              </div>
              <button
                type="button"
                onClick={() => setShowLabInputs(!showLabInputs)}
                className="text-[10px] font-semibold text-blue-600 hover:underline dark:text-blue-400"
              >
                {showLabInputs ? 'Hide Soil Lab' : '+ Soil Lab Test'}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                  Season
                </label>
                <select
                  value={season}
                  onChange={(e) => setSeason(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-2.5 py-2 text-xs font-semibold text-slate-800 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  <option value="Kharif">Kharif (Jun – Oct)</option>
                  <option value="Rabi">Rabi (Oct – Feb)</option>
                  <option value="Summer">Summer (Feb – May)</option>
                  <option value="Annual">Annual (12 Months)</option>
                  <option value="Perennial">Perennial</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                  Farm Type
                </label>
                <select
                  value={farmType}
                  onChange={(e) => setFarmType(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-2.5 py-2 text-xs font-semibold text-slate-800 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  <option value="Field / Open Land">Field / Open Land</option>
                  <option value="Irrigated Command">Irrigated Command</option>
                  <option value="Rainfed Dryland">Rainfed Dryland</option>
                  <option value="Horticultural Garden">Horticultural Garden</option>
                </select>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="lg:col-span-2 flex items-center gap-2">
            <button
              type="button"
              onClick={runRecommendation}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.98]"
            >
              <Search size={14} />
              <span>Get Recommendation</span>
            </button>
            <button
              type="button"
              onClick={handleReset}
              title="Reset all inputs"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <RefreshCw size={13} />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Optional Lab Soil Test Overrides drawer */}
        {showLabInputs && (
          <div className="mt-3 border-t border-slate-100 pt-3 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <FlaskConical size={14} className="text-purple-600" />
                <span>Laboratory Soil Test Overrides (Optional Farm-Specific Data)</span>
              </div>
              <span className="text-[10px] text-slate-400">
                Overrides district-level soil averages when verified lab report is available
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 text-xs">
              <div>
                <label className="block text-[10px] text-slate-500 mb-0.5">Soil pH</label>
                <input
                  type="number"
                  step="0.1"
                  min="4.0"
                  max="9.5"
                  value={userPh}
                  onChange={(e) => setUserPh(e.target.value)}
                  placeholder="e.g. 6.5"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 mb-0.5">Moisture (%)</label>
                <input
                  type="number"
                  step="1"
                  min="5"
                  max="100"
                  value={userMoisture}
                  onChange={(e) => setUserMoisture(e.target.value)}
                  placeholder="e.g. 45"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 mb-0.5">Nitrogen (kg/ha)</label>
                <input
                  type="number"
                  value={userNitrogen}
                  onChange={(e) => setUserNitrogen(e.target.value)}
                  placeholder="e.g. 280"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 mb-0.5">Phosphorus (kg/ha)</label>
                <input
                  type="number"
                  value={userPhosphorus}
                  onChange={(e) => setUserPhosphorus(e.target.value)}
                  placeholder="e.g. 35"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 mb-0.5">Potassium (kg/ha)</label>
                <input
                  type="number"
                  value={userPotassium}
                  onChange={(e) => setUserPotassium(e.target.value)}
                  placeholder="e.g. 190"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── 3. Row 2: 4 Bento Cards (Weather, Soil Condition, Recommended Crop, Suitability Score) ── */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {/* Card 1: Current Weather */}
        <div className="rounded-2xl border border-blue-100/90 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900/90">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <CloudRain size={16} className="text-blue-500" />
              <span>Current Weather</span>
            </div>
            {/* LIVE Badge + Refresh Button */}
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                LIVE
              </span>
              <button
                type="button"
                onClick={fetchWeather}
                disabled={weatherLoading}
                title="Refresh live telemetry"
                className="flex h-6 w-6 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <RefreshCw size={12} className={weatherLoading ? 'animate-spin text-blue-500' : ''} />
              </button>
            </div>
          </div>

          {(() => {
            const details = getWeatherDetails(weatherValues.weatherCode, weatherValues.rainToday);
            const WeatherIcon = details.icon;
            return (
              <div className="mb-4 flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/50">
                  <WeatherIcon size={32} className={`stroke-[1.8] ${details.color}`} />
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white leading-none">
                      {currentTemp}°C
                    </span>
                    {weatherValues.apparentTempC !== currentTemp && (
                      <span className="text-[11px] font-medium text-slate-400">
                        Feels {weatherValues.apparentTempC}°C
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                    {currentCondition}
                  </div>
                </div>
              </div>
            );
          })()}

          <div className="space-y-2 border-t border-slate-100 pt-3 text-xs dark:border-slate-800">
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-1.5">
                <Droplets size={13} className="text-blue-500" />
                <span>Humidity</span>
              </div>
              <span className="font-semibold text-slate-900 dark:text-white">
                {currentHumidity}%
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-1.5">
                <CloudRain size={13} className="text-blue-500" />
                <span>Rainfall (Today)</span>
              </div>
              <span className="font-semibold text-slate-900 dark:text-white">
                {rainfallToday} mm
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-1.5">
                <Wind size={13} className="text-blue-500" />
                <span>Wind Speed</span>
              </div>
              <span className="font-semibold text-slate-900 dark:text-white">
                {currentWind} km/h
              </span>
            </div>
          </div>

          {/* Footer timestamp & source */}
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-[10px] text-slate-400 dark:border-slate-800">
            <span>Open-Meteo European NWP</span>
            <span>{lastWeatherUpdate ? `Sync ${lastWeatherUpdate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}` : 'Live Model'}</span>
          </div>
        </div>

        {/* Card 2: Soil Condition */}
        <div className="rounded-2xl border border-blue-100/90 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900/90">
          <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <Layers size={16} className="text-amber-700" />
            <span>Soil Condition ({currentSoil.name.split(' ')[0]} {currentSoil.name.split(' ')[1] || ''})</span>
          </div>

          <div className="space-y-3 pt-1 text-xs">
            {/* Soil Moisture */}
            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1">
                  <Droplets size={12} className="text-blue-500" />
                  Soil Moisture
                </span>
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                  {currentSoil.defaultMoistureText}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all duration-500"
                  style={{ width: `${currentSoil.defaultMoisturePct}%` }}
                />
              </div>
            </div>

            {/* Soil Temperature */}
            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1">
                  <Sprout size={12} className="text-emerald-500" />
                  Soil Temperature
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {currentSoil.defaultTempC}°C
                  </span>
                  <span className="rounded-sm bg-emerald-100 px-1 text-[10px] font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                    Optimal
                  </span>
                </div>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div className="h-full rounded-full bg-emerald-500 transition-all duration-500 w-[65%]" />
              </div>
            </div>

            {/* Soil pH */}
            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1">
                  <FlaskConical size={12} className="text-teal-500" />
                  Soil pH
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {userPh || '6.5'}
                  </span>
                  <span className="rounded-sm bg-emerald-100 px-1 text-[10px] font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                    Optimal
                  </span>
                </div>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div className="h-full rounded-full bg-teal-500 transition-all duration-500 w-[70%]" />
              </div>
            </div>

            {/* Drainage Capacity */}
            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1">
                  <Layers size={12} className="text-amber-500" />
                  Drainage Capacity
                </span>
                <span className="font-semibold text-amber-600 dark:text-amber-400">
                  {currentSoil.defaultDrainageText}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className="h-full rounded-full bg-amber-500 transition-all duration-500"
                  style={{ width: `${currentSoil.defaultDrainagePct}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Recommended Crop */}
        <div className="rounded-2xl border border-blue-100/90 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900/90">
          <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <Sprout size={16} className="text-emerald-600" />
            <span>Recommended Crop</span>
          </div>

          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 border-emerald-400 bg-gradient-to-br from-amber-100 to-amber-200 text-3xl shadow-xs dark:from-amber-950/40 dark:to-emerald-950/40">
              {currentCrop.iconEmoji}
            </div>
            <div>
              <div className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
                {currentCrop.name}
              </div>
              <span className="mt-1 inline-block rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                {recommendation.scores.badgeLabel}
              </span>
            </div>
          </div>

          <div className="space-y-1.5 border-t border-slate-100 pt-2.5 text-xs text-slate-600 dark:border-slate-800 dark:text-slate-300">
            {recommendation.reasons.slice(0, 4).map((r, i) => (
              <div key={i} className="flex items-start gap-1.5">
                <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-emerald-500" />
                <span className="leading-tight">{r}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Card 4: Suitability Score Circular Gauge */}
        <div className="rounded-2xl border border-blue-100/90 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900/90">
          <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span>Suitability Score</span>
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            {/* Circular Gauge */}
            <div className="relative flex shrink-0 items-center justify-center">
              <svg className="h-28 w-28 -rotate-90 transform">
                <circle
                  cx="56"
                  cy="56"
                  r={radius}
                  stroke="#e2e8f0"
                  strokeWidth="9"
                  fill="transparent"
                  className="dark:stroke-slate-800"
                />
                <circle
                  cx="56"
                  cy="56"
                  r={radius}
                  stroke={score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444'}
                  strokeWidth="9"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-700 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-none">
                  {score}%
                </span>
                <span className="mt-0.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  Suitable
                </span>
              </div>
            </div>

            {/* Breakdown Bars / Dots */}
            <div className="flex-1 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                  <span className="h-2 w-2 rounded-full bg-teal-500" />
                  <span>Weather Match</span>
                </div>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {recommendation.scores.weatherMatch}%
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                  <span className="h-2 w-2 rounded-full bg-teal-500" />
                  <span>Soil Match</span>
                </div>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {recommendation.scores.soilMatch}%
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                  <span className="h-2 w-2 rounded-full bg-teal-500" />
                  <span>Water Availability</span>
                </div>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {recommendation.scores.waterMatch}%
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span>Season Match</span>
                </div>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {recommendation.scores.seasonMatch}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. Row 3: Alternative Crops (5 items) & Water Requirement Advice ── */}
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-12">
        {/* Left Column: Alternative Crops (approx 55% width on desktop) */}
        <div className="rounded-2xl border border-blue-100/90 bg-white p-4 shadow-xs xl:col-span-6 dark:border-slate-800 dark:bg-slate-900/90">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <Sprout size={16} className="text-emerald-500" />
              <span>Alternative Crops (Based on Soil & Weather)</span>
            </div>
            <span className="text-[10px] text-slate-400">
              Click any card to switch
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {recommendation.alternatives.map((alt) => (
              <button
                key={alt.crop.id}
                type="button"
                onClick={() => setCropId(alt.crop.id)}
                className="group flex flex-col items-center rounded-xl border border-slate-150 bg-slate-50/70 p-2 text-center transition hover:border-emerald-300 hover:bg-white hover:shadow-sm dark:border-slate-800 dark:bg-slate-800/70 dark:hover:border-emerald-600"
              >
                <div className="mb-1.5 flex h-11 w-11 items-center justify-center rounded-full bg-white text-2xl shadow-xs transition group-hover:scale-105 dark:bg-slate-900">
                  {alt.crop.iconEmoji}
                </div>
                <div className="font-semibold text-slate-900 text-xs dark:text-white truncate w-full">
                  {alt.crop.name.split(' ')[0]}
                </div>
                <span
                  className={`mt-1 rounded-full px-2 py-0.5 text-[9px] font-semibold ${
                    alt.score >= 70
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                  }`}
                >
                  {alt.badgeLabel}
                </span>
                <span className="mt-1 text-[10px] font-medium text-slate-500 dark:text-slate-400">
                  Score: {alt.score}%
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Right Column: Water Requirement & Irrigation Advice */}
        <div className="rounded-2xl border border-blue-100/90 bg-white p-4 shadow-xs xl:col-span-6 dark:border-slate-800 dark:bg-slate-900/90">
          <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <Droplets size={16} className="text-blue-500" />
            <span>Water Requirement & Irrigation Advice ({currentCrop.name})</span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-12">
            {/* Left stats */}
            <div className="space-y-3 sm:col-span-5 sm:border-r sm:border-slate-100 sm:pr-3 dark:sm:border-slate-800">
              <div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Waves size={13} className="text-blue-500" />
                  Total Water Requirement
                </div>
                <div className="mt-0.5 text-base font-bold text-slate-900 dark:text-white">
                  {recommendation.irrigationAdvice.totalRequirementMm}
                </div>
              </div>

              <div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <CloudRain size={13} className="text-blue-500" />
                  Current Rainfall (This Month)
                </div>
                <div className="mt-0.5 text-base font-bold text-slate-900 dark:text-white">
                  {recommendation.irrigationAdvice.currentMonthRainfallMm} mm
                </div>
              </div>
            </div>

            {/* Right bullet list */}
            <div className="sm:col-span-7">
              <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 size={15} />
                <span>Irrigation Advisory</span>
              </div>
              <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                {recommendation.irrigationAdvice.bulletPoints.map((bp, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span className="leading-tight">{bp}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* ── 5. Row 4: 7-Day Weather Impact, Fertilizer Recommendation & Key Advisories ── */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
        {/* Card 1: 7-Day Weather Impact (approx 38% width) */}
        <div className="rounded-2xl border border-blue-100/90 bg-white p-4 shadow-xs lg:col-span-5 dark:border-slate-800 dark:bg-slate-900/90">
          <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <Calendar size={16} className="text-blue-500" />
            <span>7-Day Weather Impact on Selected Crop ({currentCrop.name})</span>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {recommendation.sevenDayImpact.map((d, i) => (
              <div
                key={i}
                className="flex flex-col items-center rounded-xl bg-slate-50/80 p-1.5 transition hover:bg-slate-100 dark:bg-slate-800/80"
              >
                <div className="text-[10px] font-bold text-slate-700 dark:text-slate-200">
                  {d.day}
                </div>
                <div className="text-[9px] text-slate-400">{d.dateFormatted}</div>
                <div className="my-1 text-lg">{d.iconEmoji}</div>
                <div className="text-[10px] font-bold text-slate-800 dark:text-slate-100">
                  {d.maxTemp}° / {d.minTemp}°
                </div>
                <div className="text-[9px] text-blue-500 font-medium">
                  💧 {d.rainProb}%
                </div>
                <span
                  className={`mt-1 rounded-sm px-1 py-0.5 text-[8px] font-bold ${
                    d.impactLabel === 'Favourable'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : d.impactLabel === 'Moderate'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                      : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                  }`}
                >
                  {d.impactLabel}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Card 2: Fertilizer Recommendation Table (approx 35% width) */}
        <div className="rounded-2xl border border-blue-100/90 bg-white p-4 shadow-xs lg:col-span-4 dark:border-slate-800 dark:bg-slate-900/90">
          <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <Sparkles size={16} className="text-blue-500" />
            <span>Fertilizer Recommendation ({currentCrop.name})</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-semibold text-slate-400 uppercase tracking-wider dark:border-slate-800">
                  <th className="pb-1.5">Stage</th>
                  <th className="pb-1.5">Fertilizer</th>
                  <th className="pb-1.5">Dosage (/ac)</th>
                  <th className="pb-1.5">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {recommendation.fertilizerGuidance.map((f, i) => (
                  <tr key={i} className="text-slate-700 dark:text-slate-300">
                    <td className="py-2 font-medium">{f.stage}</td>
                    <td className="py-2 text-slate-900 font-semibold dark:text-white">
                      {f.fertilizer}
                    </td>
                    <td className="py-2">{f.dosage}</td>
                    <td className="py-2 text-[11px] text-slate-500">{f.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Card 3: Key Advisories (approx 27% width) */}
        <div className="rounded-2xl border border-blue-100/90 bg-white p-4 shadow-xs lg:col-span-3 dark:border-slate-800 dark:bg-slate-900/90">
          <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <AlertTriangle size={16} className="text-amber-500" />
            <span>Key Advisories</span>
          </div>

          <div className="space-y-2 text-xs">
            {recommendation.keyAdvisories.map((adv, i) => (
              <div key={i} className="flex items-start gap-2">
                {adv.type === 'success' && (
                  <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-500" />
                )}
                {adv.type === 'warning' && (
                  <AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-500" />
                )}
                {adv.type === 'info' && (
                  <Info size={14} className="mt-0.5 shrink-0 text-blue-500" />
                )}
                <span className="leading-tight text-slate-700 dark:text-slate-200">
                  {adv.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
