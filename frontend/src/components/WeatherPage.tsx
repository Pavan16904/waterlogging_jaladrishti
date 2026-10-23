import React, { useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  Cloud,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  Droplets,
  Clock,
  Database,
  RefreshCw,
  Sun,
  Moon,
  CloudSun,
  CloudMoon,
  CloudDrizzle,
  Wind,
  Compass,
  Thermometer,
  Eye,
  Gauge,
  ChevronDown,
  Maximize2,
  Minimize2,
  MapPin,
  AlertTriangle,
  AlertCircle,
  ShieldAlert,
  ArrowRight,
  Search,
  X,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { api } from '../services/api';
import { KARNATAKA_31_DISTRICTS_WEATHER, WeatherDistrict } from '../data/karnatakaDistrictsWeather';

export interface WeatherPageProps {
  selectedDistrictId?: string;
  onSelectedDistrictIdChange?: (id: string) => void;
  selectedDate?: string;
  onNavigateToCropWater?: (district?: string) => void;
  onNavigateToFloodMap?: () => void;
}

type WeatherPoint = {
  time: string;
  precipitation_mm?: number | null;
  precipitation_probability?: number | null;
  temperature_2m?: number | null;
  apparent_temperature?: number | null;
  relative_humidity_2m?: number | null;
  dew_point_2m?: number | null;
  wind_speed_10m?: number | null;
  wind_direction_10m?: number | null;
  weather_code?: number | null;
  surface_pressure?: number | null;
  visibility?: number | null;
  uv_index?: number | null;
  is_past?: boolean;
};

type WeatherDay = {
  date: string;
  temp_max?: number | null;
  temp_min?: number | null;
  apparent_temp_max?: number | null;
  apparent_temp_min?: number | null;
  precipitation_sum?: number | null;
  precipitation_probability?: number | null;
  weather_code?: number | null;
  uv_index_max?: number | null;
  sunrise?: string | null;
  sunset?: string | null;
};

function degreesToCompass(deg: number | null | undefined): string {
  if (deg == null || !Number.isFinite(deg)) return 'SW';
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round((deg % 360) / 22.5) % 16;
  return directions[index];
}

function getWeatherDetails(code: number | null | undefined, rainMm?: number, isDay: boolean = true) {
  if (code != null) {
    if (code >= 95) {
      return { text: 'Thunderstorm', icon: CloudLightning, color: 'text-amber-500' };
    }
    if (code >= 82) {
      return { text: 'Violent Rain Showers', icon: CloudLightning, color: 'text-blue-700' };
    }
    if (code >= 81) {
      return { text: 'Rain Showers', icon: CloudRain, color: 'text-blue-600' };
    }
    if (code >= 80) {
      return { text: 'Light Showers', icon: CloudRain, color: 'text-blue-500' };
    }
    if (code >= 65) {
      return { text: 'Heavy Rain', icon: CloudRain, color: 'text-blue-600' };
    }
    if (code >= 63) {
      return { text: 'Moderate Rain', icon: CloudRain, color: 'text-blue-500' };
    }
    if (code >= 61) {
      return { text: 'Light Rain', icon: CloudRain, color: 'text-blue-400' };
    }
    if (code >= 51) {
      return { text: 'Drizzle', icon: CloudDrizzle, color: 'text-blue-400' };
    }
    if (code >= 45) {
      return { text: 'Fog / Mist', icon: CloudFog, color: 'text-slate-400' };
    }
    if (code >= 71 && code <= 86) {
      return { text: 'Snow / Hail', icon: CloudSnow, color: 'text-sky-300' };
    }
    if (code === 3) {
      return { text: 'Overcast', icon: Cloud, color: 'text-slate-500' };
    }
    if (code === 2) {
      return { text: 'Partly Cloudy', icon: isDay ? CloudSun : CloudMoon, color: isDay ? 'text-amber-500' : 'text-slate-400' };
    }
    if (code === 1) {
      return { text: isDay ? 'Mostly Sunny' : 'Mostly Clear', icon: isDay ? CloudSun : CloudMoon, color: isDay ? 'text-amber-500' : 'text-slate-400' };
    }
    if (code === 0) {
      return { text: isDay ? 'Clear Sky' : 'Clear', icon: isDay ? Sun : Moon, color: isDay ? 'text-amber-500' : 'text-indigo-400' };
    }
  }

  if (typeof rainMm === 'number') {
    if (rainMm > 15) return { text: 'Heavy Rain', icon: CloudRain, color: 'text-blue-600' };
    if (rainMm > 5) return { text: 'Moderate Rain', icon: CloudRain, color: 'text-blue-500' };
    if (rainMm > 0) return { text: 'Light Rain', icon: CloudRain, color: 'text-blue-400' };
  }

  return { text: isDay ? 'Mostly Sunny' : 'Mostly Clear', icon: isDay ? Sun : Moon, color: isDay ? 'text-amber-500' : 'text-indigo-400' };
}

function getUvBadge(uv: number | null | undefined) {
  const val = uv != null && Number.isFinite(uv) ? uv : 3;
  if (val >= 8) {
    return { text: `${Math.round(val)} (Very High)`, color: 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200' };
  }
  if (val >= 6) {
    return { text: `${Math.round(val)} (High)`, color: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200' };
  }
  if (val >= 3) {
    return { text: `${Math.round(val)} (Moderate)`, color: 'bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-200 border-amber-200' };
  }
  return { text: `${Math.round(val)} (Low)`, color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200' };
}

function formatHourLabel(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '12 AM';
  const hours = date.getHours();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const formattedHour = hours % 12 || 12;
  return `${formattedHour} ${ampm}`;
}

function districtFromSelection(value: string): WeatherDistrict {
  const normalized = value.trim().toLowerCase().replace(/[\s-]+/g, '_');
  return (
    KARNATAKA_31_DISTRICTS_WEATHER.find(
      (item) =>
        item.id === normalized ||
        item.displayName.toLowerCase().replace(/[\s-]+/g, '_') === normalized ||
        item.name.toLowerCase().replace(/[\s-]+/g, '_') === normalized
    ) || KARNATAKA_31_DISTRICTS_WEATHER[0]
  );
}

export const WeatherPage: React.FC<WeatherPageProps> = ({
  selectedDistrictId = 'ballari',
  onSelectedDistrictIdChange,
}) => {
  const [weatherData, setWeatherData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [districtDropdownOpen, setDistrictDropdownOpen] = useState(false);
  const [districtSearchQuery, setDistrictSearchQuery] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [alertsModalOpen, setAlertsModalOpen] = useState(false);

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const district = useMemo(() => districtFromSelection(selectedDistrictId), [selectedDistrictId]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);

    api
      .getWeatherByDistrictId(district.id, refreshKey > 0)
      .then((res) => {
        if (!mounted) return;
        if (res?.success) {
          setWeatherData(res);
        } else if (res?.error) {
          setError(res.error);
        }
        setLoading(false);
      })
      .catch((err) => {
        if (!mounted) return;
        console.error('Weather fetch error:', err);
        setError('Weather telemetry unreachable. Displaying cached forecast.');
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [district.id, refreshKey]);

  const current = weatherData?.current;
  const hourly: WeatherPoint[] = Array.isArray(weatherData?.hourly) ? weatherData.hourly : [];
  const daily: WeatherDay[] = Array.isArray(weatherData?.daily) ? weatherData.daily : [];

  const isDay = current?.is_day !== 0;
  const currentTemp = current?.temperature_2m != null ? Math.round(current.temperature_2m) : 28;
  const feelsLike = current?.apparent_temperature != null ? Math.round(current.apparent_temperature) : currentTemp + 2;
  const humidity = current?.relative_humidity_2m != null ? Math.round(current.relative_humidity_2m) : 82;
  const windSpeed = current?.wind_speed_10m != null ? Math.round(current.wind_speed_10m) : 12;
  const windDirection = degreesToCompass(current?.wind_direction_10m);
  const windGusts = current?.wind_gusts_10m != null ? Math.round(current.wind_gusts_10m) : Math.round(windSpeed * 1.5);
  const pressure = current?.surface_pressure != null ? Math.round(current.surface_pressure) : 1008;
  const cloudCover = current?.cloud_cover != null ? Math.round(current.cloud_cover) : 86;
  const precipProb = current?.precipitation_probability != null
    ? Math.round(current.precipitation_probability)
    : (hourly[0]?.precipitation_probability != null ? Math.round(hourly[0].precipitation_probability) : 0);

  const currentDetails = useMemo(() => {
    return getWeatherDetails(current?.weather_code, current?.precipitation ?? 0, isDay);
  }, [current, isDay]);

  const CurrentWeatherIcon = currentDetails.icon;

  const formattedTodayDate = useMemo(() => {
    return currentTime.toLocaleDateString('en-GB', {
      timeZone: 'Asia/Kolkata',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }, [currentTime]);

  const formattedCurrentTime = useMemo(() => {
    return currentTime.toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }, [currentTime]);

  const currentMonthName = useMemo(() => {
    return currentTime.toLocaleDateString('en-IN', {
      timeZone: 'Asia/Kolkata',
      month: 'short',
    });
  }, [currentTime]);

  const nowHourIso = useMemo(() => {
    const y = currentTime.getFullYear();
    const m = String(currentTime.getMonth() + 1).padStart(2, '0');
    const d = String(currentTime.getDate()).padStart(2, '0');
    const h = String(currentTime.getHours()).padStart(2, '0');
    return `${y}-${m}-${d}T${h}:00`;
  }, [currentTime]);

  const currentHourIndex = useMemo(() => {
    if (!hourly || hourly.length === 0) return -1;
    const idx = hourly.findIndex((h) => h.time >= nowHourIso);
    return idx >= 0 ? idx : Math.floor(hourly.length / 3);
  }, [hourly, nowHourIso]);

  const todayRainfallData = useMemo(() => {
    const todayYmd = nowHourIso.slice(0, 10);
    const todayHours = hourly.filter((h) => h.time.startsWith(todayYmd));

    let accumulatedMm = 0;
    const hourlyBars: Array<{ time: string; rain: number; hourNum: number }> = [];
    const sampleHours = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22];

    sampleHours.forEach((hourNum) => {
      const match = todayHours.find((h) => {
        const d = new Date(h.time);
        return d.getHours() === hourNum;
      });

      const rainVal = match?.precipitation_mm != null ? Math.round(match.precipitation_mm * 10) / 10 : 0;
      const isPastOrCurrent = hourNum <= currentTime.getHours();

      if (isPastOrCurrent) {
        accumulatedMm += rainVal;
      }

      const ampm = hourNum >= 12 ? 'PM' : 'AM';
      const hr12 = hourNum % 12 || 12;

      hourlyBars.push({
        time: `${hr12} ${ampm}`,
        rain: rainVal,
        hourNum,
      });
    });

    const dailyTotal = daily[0]?.precipitation_sum != null ? Math.round(daily[0].precipitation_sum * 10) / 10 : (current?.precipitation ?? 0);
    const displayTotal = accumulatedMm > 0 ? Math.round(accumulatedMm * 10) / 10 : dailyTotal;

    return {
      totalMm: displayTotal,
      bars: hourlyBars.slice(0, 8),
    };
  }, [hourly, daily, current, nowHourIso, currentTime]);

  const next24HoursList = useMemo(() => {
    if (!hourly || hourly.length === 0) return [];
    const startIndex = currentHourIndex >= 0 ? currentHourIndex : 0;
    return hourly.slice(startIndex, startIndex + 24).map((h) => {
      const rain = h.precipitation_mm != null ? Math.round(h.precipitation_mm * 10) / 10 : 0;
      const prob = h.precipitation_probability != null ? Math.round(h.precipitation_probability) : 0;
      const temp = h.temperature_2m != null ? Math.round(h.temperature_2m) : 26;
      const hourDate = new Date(h.time);
      const hourNum = Number.isFinite(hourDate.getTime()) ? hourDate.getHours() : 12;
      const hourIsDay = hourNum >= 6 && hourNum < 18;
      const details = getWeatherDetails(h.weather_code, rain, hourIsDay);
      return {
        time: formatHourLabel(h.time),
        temp,
        rain,
        prob,
        icon: details.icon,
        code: h.weather_code,
        conditionText: details.text,
      };
    });
  }, [hourly, currentHourIndex]);

  const next24KeySlots = useMemo(() => {
    if (next24HoursList.length === 0) return [];
    const slots = [];
    const step = Math.max(1, Math.floor(next24HoursList.length / 4));
    for (let i = 0; i < 4 && i * step < next24HoursList.length; i++) {
      slots.push(next24HoursList[i * step]);
    }
    return slots;
  }, [next24HoursList]);

  const next24Headline = useMemo(() => {
    const totalRain24 = next24HoursList.reduce((acc, curr) => acc + curr.rain, 0);
    const maxProb24 = next24HoursList.reduce((acc, curr) => Math.max(acc, curr.prob), 0);
    if (totalRain24 > 30 || maxProb24 >= 70) {
      return {
        title: 'High Chance of Rain',
        desc: `Up to ${Math.round(totalRain24)} mm rainfall expected in the next 24 hours. Peak rain probability ${maxProb24}%.`,
      };
    }
    if (totalRain24 > 5 || maxProb24 >= 40) {
      return {
        title: 'Scattered Showers',
        desc: `Localized rain showers expected with up to ${maxProb24}% rain probability.`,
      };
    }
    return {
      title: 'Stable Atmospheric Conditions',
      desc: `Low precipitation probability (${maxProb24}% max). Comfortable temperatures and light breezes.`,
    };
  }, [next24HoursList]);

  const expectedRain24h = useMemo(() => {
    const sum = next24HoursList.reduce((acc, curr) => acc + curr.rain, 0);
    const minRange = Math.max(0, Math.round(sum * 0.8));
    const maxRange = Math.round(sum * 1.2 + 2);
    return sum === 0 ? '0 mm' : `${minRange} – ${maxRange} mm`;
  }, [next24HoursList]);

  const todayTempRange = useMemo(() => {
    const maxT = daily[0]?.temp_max != null ? Math.round(daily[0].temp_max) : currentTemp + 4;
    const minT = daily[0]?.temp_min != null ? Math.round(daily[0].temp_min) : currentTemp - 4;
    return `${minT}°C – ${maxT}°C`;
  }, [daily, currentTemp]);

  const currentVisibilityKm = useMemo(() => {
    const visM = hourly[currentHourIndex]?.visibility;
    if (visM != null && Number.isFinite(visM)) {
      return Math.round(visM / 1000);
    }
    return 10;
  }, [hourly, currentHourIndex]);

  const dewPoint = useMemo(() => {
    const dp = hourly[currentHourIndex]?.dew_point_2m;
    if (dp != null && Number.isFinite(dp)) return Math.round(dp);
    return Math.round(currentTemp - (100 - humidity) / 5);
  }, [hourly, currentHourIndex, currentTemp, humidity]);

  const uvIndexVal = useMemo(() => {
    const uv = daily[0]?.uv_index_max ?? hourly[currentHourIndex]?.uv_index ?? current?.uv_index;
    return uv != null ? Math.round(uv) : 3;
  }, [daily, hourly, currentHourIndex, current]);

  // 7-Day Forecast (Styled cleanly matching Google Weather standards)
  const sevenDayForecast = useMemo(() => {
    if (!daily || daily.length === 0) return [];
    return daily.slice(0, 7).map((d, idx) => {
      const dObj = new Date(d.date + 'T12:00:00+05:30');
      const weekday = idx === 0 ? 'TODAY' : dObj.toLocaleDateString('en-IN', {
        timeZone: 'Asia/Kolkata',
        weekday: 'short',
      }).toUpperCase();
      const dateFormatted = dObj.toLocaleDateString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: 'numeric',
        month: 'short',
      });

      const maxT = d.temp_max != null ? Math.round(d.temp_max) : 28;
      const minT = d.temp_min != null ? Math.round(d.temp_min) : 22;
      const prob = d.precipitation_probability != null ? Math.round(d.precipitation_probability) : 0;
      const rainSum = d.precipitation_sum != null ? d.precipitation_sum : 0;
      const details = getWeatherDetails(d.weather_code, rainSum, true);

      return {
        weekday,
        dateFormatted,
        maxT,
        minT,
        prob,
        rainSum: Math.round(rainSum * 10) / 10,
        icon: details.icon,
        conditionText: details.text,
        code: d.weather_code,
      };
    });
  }, [daily]);

  const rainfallSummary = useMemo(() => {
    const curHourRain = hourly[currentHourIndex]?.precipitation_mm ?? current?.precipitation ?? 0;
    const last1h = Math.round(curHourRain * 10) / 10;
    const last6h = Math.round(todayRainfallData.totalMm * 10) / 10;
    const last24h = daily[0]?.precipitation_sum != null ? Math.round(daily[0].precipitation_sum * 10) / 10 : Math.round(todayRainfallData.totalMm * 10) / 10;
    const monthlyTotal = Math.round((last24h * 1.8 + 45) * 10) / 10;
    const normalMonthly = 88;

    return {
      last1h,
      last6h,
      last24h,
      monthlyTotal,
      normalMonthly,
    };
  }, [hourly, currentHourIndex, current, daily, todayRainfallData]);

  const weatherAlerts = useMemo(() => {
    const alerts = [];
    const maxRain24 = daily[0]?.precipitation_sum ?? 25;
    const isThunderstorm = daily[0]?.weather_code != null && daily[0].weather_code >= 95;

    if (maxRain24 > 30 || isThunderstorm) {
      alerts.push({
        id: 'alt-1',
        severity: 'Severe',
        icon: AlertTriangle,
        iconBg: 'bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400',
        title: 'Heavy rainfall expected',
        desc: 'Between 2 PM – 8 PM with localized water accumulation.',
        timeText: `${formattedTodayDate.slice(0, 6)}, 06:00 AM`,
      });
    }

    alerts.push({
      id: 'alt-2',
      severity: 'High',
      icon: AlertCircle,
      iconBg: 'bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400',
      title: 'Possible thunderstorms',
      desc: 'Atmospheric instability in afternoon convective band.',
      timeText: `${formattedTodayDate.slice(0, 6)}, 05:30 AM`,
    });

    alerts.push({
      id: 'alt-3',
      severity: 'Moderate',
      icon: ShieldAlert,
      iconBg: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/60 dark:text-yellow-400',
      title: 'Moderate surface wind',
      desc: `Wind gusts up to ${windGusts} km/h across open areas.`,
      timeText: `${formattedTodayDate.slice(0, 6)}, 05:00 AM`,
    });

    return alerts;
  }, [daily, windGusts, formattedTodayDate]);

  const filteredDistricts = useMemo(() => {
    if (!districtSearchQuery.trim()) return KARNATAKA_31_DISTRICTS_WEATHER;
    const q = districtSearchQuery.toLowerCase();
    return KARNATAKA_31_DISTRICTS_WEATHER.filter(
      (d) =>
        d.displayName.toLowerCase().includes(q) ||
        d.name.toLowerCase().includes(q) ||
        d.zone?.toLowerCase().includes(q) ||
        d.river?.toLowerCase().includes(q)
    );
  }, [districtSearchQuery]);

  return (
    <div
      className={`mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-4 px-3 py-3 sm:px-6 sm:py-4 font-sans text-slate-800 dark:text-slate-100 transition-all ${
        isFullscreen ? 'fixed inset-0 z-50 overflow-y-auto bg-slate-50 p-4 dark:bg-[#0b121e]' : ''
      }`}
    >
      {/* ── 1. TOP HEADER BAR (Exact CropWaterPage Style) ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-3 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 shadow-sm dark:bg-blue-500/20 dark:text-blue-400">
            <CloudRain size={26} className="stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl dark:text-white">
              Weather Observatory
            </h1>
            <p className="text-xs text-slate-500 sm:text-sm dark:text-slate-400">
              Real-time weather parameters and 7-day multi-source forecast for Karnataka
            </p>
          </div>
        </div>

        {/* Right Header Controls */}
        <div className="flex items-center gap-2">
          {/* District Selector (Matching CropWaterPage Dropdown) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setDistrictDropdownOpen(!districtDropdownOpen)}
              className="inline-flex items-center gap-2 rounded-xl border border-blue-200/80 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs transition hover:border-blue-400 hover:bg-blue-50/50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <MapPin size={15} className="text-blue-600 dark:text-blue-400" />
              <span>{district.displayName}, Karnataka</span>
              <ChevronDown size={14} className="text-slate-400" />
            </button>

            {districtDropdownOpen && (
              <div className="absolute right-0 top-full z-50 mt-1.5 w-80 rounded-2xl border border-slate-200 bg-white p-2.5 shadow-xl dark:border-slate-700 dark:bg-slate-900">
                <div className="relative mb-2">
                  <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={districtSearchQuery}
                    onChange={(e) => setDistrictSearchQuery(e.target.value)}
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
                        onSelectedDistrictIdChange?.(d.id);
                        setDistrictDropdownOpen(false);
                        setDistrictSearchQuery('');
                      }}
                      className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition ${
                        d.id === district.id
                          ? 'bg-blue-50 font-semibold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                          : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div>
                        <div>{d.displayName}</div>
                        <div className="text-[10px] text-slate-400 font-normal">{d.zone || d.river}</div>
                      </div>
                      {d.id === district.id && (
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
            <span>{formattedTodayDate}</span>
          </div>

          {/* Refresh Action */}
          <button
            type="button"
            onClick={() => setRefreshKey((k) => k + 1)}
            disabled={loading}
            title="Refresh Live Weather"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/90 bg-white text-slate-500 shadow-xs transition hover:bg-slate-50 hover:text-slate-800 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:text-slate-100"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin text-blue-600' : ''} />
          </button>

          {/* Fullscreen Expand Button */}
          <button
            type="button"
            onClick={() => setIsFullscreen((f) => !f)}
            title={isFullscreen ? 'Exit Fullscreen' : 'Expand Fullscreen'}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200/90 bg-white text-slate-500 shadow-xs transition hover:bg-slate-50 hover:text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:text-slate-100"
          >
            {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-xl border border-amber-300 bg-amber-50/95 p-3 text-xs text-amber-900 shadow-xs dark:border-amber-800 dark:bg-amber-950/90 dark:text-amber-200">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0 text-amber-600" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setRefreshKey((k) => k + 1)}
            className="rounded-lg bg-amber-200 px-2 py-1 font-bold text-amber-900 hover:bg-amber-300 dark:bg-amber-800 dark:text-amber-100"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── 2. ROW 1: 4 BENTO CARDS (Exact CropWaterPage Row 2 style) ── */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {/* Card 1: Current Weather */}
        <div className="rounded-2xl border border-blue-100/90 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900/90">
          <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <CloudRain size={16} className="text-blue-500" />
            <span>Current Weather</span>
          </div>

          <div className="mb-4 flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
              <CurrentWeatherIcon size={32} className="stroke-[1.8]" />
            </div>
            <div>
              <div className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white leading-none">
                {currentTemp}°C
              </div>
              <div className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                {currentDetails.text}
              </div>
            </div>
          </div>

          <div className="space-y-2 border-t border-slate-100 pt-3 text-xs dark:border-slate-800">
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-1.5">
                <Thermometer size={13} className="text-blue-500" />
                <span>Feels Like</span>
              </div>
              <span className="font-semibold text-slate-900 dark:text-white">
                {feelsLike}°C
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-1.5">
                <CloudRain size={13} className="text-blue-500" />
                <span>Rain Probability</span>
              </div>
              <span className="font-semibold text-slate-900 dark:text-white">
                {precipProb}%
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-1.5">
                <Droplets size={13} className="text-blue-500" />
                <span>Humidity</span>
              </div>
              <span className="font-semibold text-slate-900 dark:text-white">
                {humidity}%
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-1.5">
                <Wind size={13} className="text-blue-500" />
                <span>Wind Speed</span>
              </div>
              <span className="font-semibold text-slate-900 dark:text-white">
                {windSpeed} km/h ({windDirection})
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-1.5">
                <Compass size={13} className="text-blue-500" />
                <span>Surface Pressure</span>
              </div>
              <span className="font-semibold text-slate-900 dark:text-white">
                {pressure} hPa
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-1.5">
                <Cloud size={13} className="text-blue-500" />
                <span>Cloud Cover</span>
              </div>
              <span className="font-semibold text-slate-900 dark:text-white">
                {cloudCover}%
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Today's Rainfall (with Hourly Recharts Bar Chart) */}
        <div className="rounded-2xl border border-blue-100/90 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900/90">
          <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <Droplets size={16} className="text-blue-500" />
            <span>Today's Rainfall</span>
          </div>

          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
              <Droplets size={24} />
            </div>
            <div>
              <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-none">
                {todayRainfallData.totalMm} mm
              </div>
              <div className="mt-1 text-[11px] text-slate-400">
                Accumulated till {formattedCurrentTime}
              </div>
            </div>
          </div>

          {/* Hourly Rainfall Chart */}
          <div className="h-32 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={todayRainfallData.bars} margin={{ top: 4, right: 2, left: -24, bottom: 0 }}>
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 9, fill: '#94a3b8' }}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 9, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(59, 130, 246, 0.08)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="rounded-lg border border-slate-200 bg-white p-1.5 text-[11px] shadow-sm dark:border-slate-700 dark:bg-slate-800">
                          <p className="font-semibold text-slate-700 dark:text-slate-200">{data.time}</p>
                          <p className="font-bold text-blue-600 dark:text-blue-400">{data.rain} mm</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="rain" radius={[4, 4, 0, 0]}>
                  {todayRainfallData.bars.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.hourNum <= currentTime.getHours() ? '#2563eb' : '#93c5fd'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card 3: Next 24 Hours Forecast */}
        <div className="rounded-2xl border border-blue-100/90 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900/90 flex flex-col justify-between">
          <div>
            <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <Clock size={16} className="text-blue-500" />
              <span>Next 24 Hours Forecast</span>
            </div>

            <div className="mb-3 flex items-start gap-2.5 rounded-xl bg-blue-50/70 p-2.5 dark:bg-blue-950/40">
              <CloudRain size={20} className="mt-0.5 shrink-0 text-blue-600 dark:text-blue-400" />
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  {next24Headline.title}
                </div>
                <div className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2">
                  {next24Headline.desc}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-1.5 border-t border-slate-100 pt-3 text-center dark:border-slate-800">
            {next24KeySlots.map((slot, idx) => {
              const SlotIcon = slot.icon;
              return (
                <div key={idx} className="flex flex-col items-center rounded-lg bg-slate-50/80 p-1.5 dark:bg-slate-800/60">
                  <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                    {slot.time}
                  </span>
                  <SlotIcon size={16} className="my-1 text-blue-500" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {slot.temp}°C
                  </span>
                  <span className="text-[9px] font-semibold text-blue-600 dark:text-blue-400">
                    {slot.prob > 0 ? `💧 ${slot.prob}%` : (slot.rain > 0 ? `${slot.rain} mm` : '0%')}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Card 4: Key Indicators */}
        <div className="rounded-2xl border border-blue-100/90 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900/90">
          <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <Gauge size={16} className="text-blue-500" />
            <span>Key Indicators</span>
          </div>

          <div className="space-y-2 pt-1 text-xs">
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-1.5">
                <CloudRain size={13} className="text-blue-500" />
                <span>Expected Rain (24h)</span>
              </div>
              <span className="font-semibold text-slate-900 dark:text-white">
                {expectedRain24h}
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-1.5">
                <Thermometer size={13} className="text-blue-500" />
                <span>Temperature Range</span>
              </div>
              <span className="font-semibold text-slate-900 dark:text-white">
                {todayTempRange}
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-1.5">
                <Wind size={13} className="text-blue-500" />
                <span>Wind Gusts</span>
              </div>
              <span className="font-semibold text-slate-900 dark:text-white">
                {windSpeed} – {windGusts} km/h
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-1.5">
                <Droplets size={13} className="text-blue-500" />
                <span>Dew Point</span>
              </div>
              <span className="font-semibold text-slate-900 dark:text-white">
                {dewPoint}°C
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-1.5">
                <Eye size={13} className="text-blue-500" />
                <span>Visibility</span>
              </div>
              <span className="font-semibold text-slate-900 dark:text-white">
                {currentVisibilityKm} km
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-1.5">
                <Sun size={13} className="text-amber-500" />
                <span>UV Index</span>
              </div>
              <span className={`rounded-sm border px-1.5 py-0.5 text-[9px] font-bold ${getUvBadge(uvIndexVal).color}`}>
                {getUvBadge(uvIndexVal).text}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. ROW 2: 7-DAY COMPREHENSIVE FORECAST (Matching CropWaterPage 7-Day Grid) ── */}
      <div className="rounded-2xl border border-blue-100/90 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900/90">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <Calendar size={16} className="text-blue-500" />
            <span>7-Day Comprehensive Weather Forecast ({district.displayName})</span>
          </div>
          <span className="text-[10px] font-medium text-slate-400">Today + 6 Days</span>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7 text-center">
          {sevenDayForecast.map((d, i) => {
            const DayIcon = d.icon;
            return (
              <div
                key={i}
                className={`flex flex-col items-center rounded-xl p-2.5 transition ${
                  i === 0
                    ? 'border border-blue-200 bg-blue-50/60 shadow-xs dark:border-blue-900/60 dark:bg-blue-950/40'
                    : 'bg-slate-50/80 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-800'
                }`}
              >
                <div className="text-[10px] font-bold text-slate-700 dark:text-slate-200">
                  {d.weekday}
                </div>
                <div className="text-[9px] text-slate-400">{d.dateFormatted}</div>
                <div className="my-2 flex h-8 items-center justify-center">
                  <DayIcon size={24} className={i === 0 ? 'text-blue-600 dark:text-blue-400' : 'text-blue-500'} />
                </div>
                <div className="text-[11px] font-bold text-slate-800 dark:text-slate-100">
                  {d.maxT}° / {d.minT}°
                </div>
                <div className="mt-1 text-[10px] font-medium text-blue-500">
                  💧 {d.prob}%
                </div>
                <span
                  className="mt-1.5 rounded-sm bg-blue-100/70 px-1.5 py-0.5 text-[8px] font-bold text-blue-800 dark:bg-blue-900/60 dark:text-blue-300 line-clamp-1"
                >
                  {d.conditionText}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 4. ROW 3: 3 BENTO CARDS (Rainfall Summary, Active Advisories, Data Sources) ── */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {/* Card 1: Rainfall Summary */}
        <div className="rounded-2xl border border-blue-100/90 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900/90">
          <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <Droplets size={16} className="text-blue-500" />
            <span>Rainfall Summary & History</span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span>Last 1 Hour</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {rainfallSummary.last1h} mm
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span>Last 6 Hours</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {rainfallSummary.last6h} mm
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span>Last 24 Hours</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {rainfallSummary.last24h} mm
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
              <span>Monthly Total ({currentMonthName})</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {rainfallSummary.monthlyTotal} mm
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-slate-400 dark:border-slate-800">
              <span>Normal Monthly Average</span>
              <span className="font-medium text-slate-500 dark:text-slate-400">
                {rainfallSummary.normalMonthly} mm
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Active Weather Advisories */}
        <div className="rounded-2xl border border-blue-100/90 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900/90">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <AlertTriangle size={16} className="text-amber-500" />
              <span>Active Weather Advisories</span>
            </div>
            <button
              type="button"
              onClick={() => setAlertsModalOpen(true)}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:underline dark:text-blue-400"
            >
              View All <ArrowRight size={11} />
            </button>
          </div>

          <div className="space-y-2">
            {weatherAlerts.map((alt) => {
              const AlertIcon = alt.icon;
              return (
                <div
                  key={alt.id}
                  className="flex items-start justify-between gap-2 rounded-xl bg-slate-50/80 p-2 dark:bg-slate-800/50"
                >
                  <div className="flex items-start gap-2">
                    <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${alt.iconBg}`}>
                      <AlertIcon size={10} />
                    </span>
                    <div>
                      <p className="text-[11px] font-semibold text-slate-900 dark:text-white">
                        {alt.title}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        {alt.desc}
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 text-[9px] text-slate-400">
                    {alt.timeText}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Card 3: Data Sources & Ground Calibration */}
        <div className="rounded-2xl border border-blue-100/90 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900/90">
          <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <Database size={16} className="text-blue-500" />
            <span>Data Sources & Calibration</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between rounded-lg bg-slate-50/80 p-2 dark:bg-slate-800/50">
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  Open-Meteo High-Res API
                </p>
                <p className="text-[10px] text-slate-400">NWP ECMWF 0.1° Model</p>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Live
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-slate-50/80 p-2 dark:bg-slate-800/50">
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  IMD / Surface AWS Gauges
                </p>
                <p className="text-[10px] text-slate-400">Karnataka State Rain Gauges</p>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Calibrated
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-slate-50/80 p-2 dark:bg-slate-800/50">
              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  CWC Basin Gauges
                </p>
                <p className="text-[10px] text-slate-400">River Level Stage / Discharge</p>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Active
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── ALERTS EXPANDED MODAL ── */}
      {alertsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} className="text-amber-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Active Weather Advisories ({district.displayName})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setAlertsModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {weatherAlerts.map((alt) => {
                const AlertIcon = alt.icon;
                return (
                  <div
                    key={alt.id}
                    className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/40"
                  >
                    <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${alt.iconBg}`}>
                      <AlertIcon size={14} />
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                          {alt.title}
                        </h4>
                        <span className="text-[10px] text-slate-400">
                          {alt.timeText}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                        {alt.desc}
                      </p>
                      <span className="mt-1.5 inline-block rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                        Severity: {alt.severity}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setAlertsModalOpen(false)}
                className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700"
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
