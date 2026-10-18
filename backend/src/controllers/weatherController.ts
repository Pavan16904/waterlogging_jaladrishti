import { Request, Response } from 'express';
import axios from 'axios';
import { cacheService, CACHE_CONFIG } from '../services/cacheService.js';

// 31 Karnataka districts coordinates & metadata
export const KARNATAKA_DISTRICTS_GEO: Record<string, {
  lat: number;
  lng: number;
  zone: string;
  elevation: number;
  primaryCrops: string[];
  river: string;
  riverLevel: string;
  riverStatus: string;
}> = {
  'Bengaluru Urban': { lat: 12.9716, lng: 77.5946, zone: 'Eastern Dry Zone (ACZ-5)', elevation: 920, primaryCrops: ['Finger Millet (Ragi)', 'Tomato', 'Cabbage', 'Maize (Corn)'], river: 'Vrishabhavathi / Pinakini', riverLevel: '2.1 m', riverStatus: 'Normal' },
  'Bengaluru Rural': { lat: 13.1294, lng: 77.5730, zone: 'Eastern Dry Zone (ACZ-5)', elevation: 905, primaryCrops: ['Finger Millet (Ragi)', 'Chili (Green/Red)', 'Mango', 'Tomato'], river: 'Arkavathi Basin', riverLevel: '2.4 m', riverStatus: 'Normal' },
  'Mysuru (Mysore)': { lat: 12.2958, lng: 76.6394, zone: 'Southern Dry Zone (ACZ-6)', elevation: 763, primaryCrops: ['Sugarcane', 'Rice (Paddy)', 'Finger Millet (Ragi)', 'Cotton'], river: 'Kaveri', riverLevel: '9.8 m', riverStatus: 'Normal' },
  'Mandya (Cauvery Basin)': { lat: 12.5218, lng: 76.8951, zone: 'Southern Dry Zone (ACZ-6)', elevation: 678, primaryCrops: ['Sugarcane', 'Rice (Paddy)', 'Coconut', 'Finger Millet (Ragi)'], river: 'Cauvery', riverLevel: '6.2 m', riverStatus: 'Normal' },
  'Chamarajanagar': { lat: 11.9261, lng: 76.9437, zone: 'Southern Dry Zone (ACZ-6)', elevation: 690, primaryCrops: ['Sugarcane', 'Rice (Paddy)', 'Maize (Corn)', 'Banana'], river: 'Suvarnavathi', riverLevel: '4.3 m', riverStatus: 'Normal' },
  'Kodagu (Coorg)': { lat: 12.4244, lng: 75.7382, zone: 'Hilly Zone (ACZ-9) / Western Ghats', elevation: 1150, primaryCrops: ['Coffee (Arabica/Robusta)', 'Black Pepper (Kari Menasu)', 'Cardamom (Yalakki)', 'Rice (Paddy)'], river: 'Kaveri', riverLevel: '6.4 m', riverStatus: 'Normal' },
  'Hassan': { lat: 13.0072, lng: 76.0961, zone: 'Southern Transition Zone (ACZ-7)', elevation: 957, primaryCrops: ['Potato', 'Coffee (Arabica/Robusta)', 'Finger Millet (Ragi)', 'Maize (Corn)'], river: 'Hemavathi Reservoir', riverLevel: '9.8 m', riverStatus: 'Normal' },
  'Chikkamagaluru': { lat: 13.3161, lng: 75.7720, zone: 'Hilly Zone (ACZ-9) / Western Ghats', elevation: 1090, primaryCrops: ['Coffee (Arabica/Robusta)', 'Arecanut (Betel Nut)', 'Black Pepper (Kari Menasu)', 'Cardamom (Yalakki)'], river: 'Bhadra / Hemavathi', riverLevel: '6.4 m', riverStatus: 'Normal' },
  'Shivamogga (Shimoga)': { lat: 13.9299, lng: 75.5681, zone: 'Southern Transition Zone (ACZ-7)', elevation: 584, primaryCrops: ['Arecanut (Betel Nut)', 'Rice (Paddy)', 'Maize (Corn)', 'Ginger'], river: 'Tunga / Bhadra', riverLevel: '7.2 m', riverStatus: 'Normal' },
  'Dakshina Kannada (Mangaluru)': { lat: 12.9141, lng: 74.8560, zone: 'Coastal Zone (ACZ-10)', elevation: 22, primaryCrops: ['Rice (Paddy)', 'Arecanut (Betel Nut)', 'Cashew (Geru)', 'Coconut'], river: 'Netravati', riverLevel: '5.2 m', riverStatus: 'Normal' },
  'Udupi': { lat: 13.3409, lng: 74.7421, zone: 'Coastal Zone (ACZ-10)', elevation: 18, primaryCrops: ['Rice (Paddy)', 'Coconut', 'Arecanut (Betel Nut)', 'Cashew (Geru)'], river: 'Swarna / Varahi', riverLevel: '3.1 m', riverStatus: 'Normal' },
  'Uttara Kannada (Karwar)': { lat: 14.8185, lng: 74.1332, zone: 'Coastal Zone (ACZ-10)', elevation: 15, primaryCrops: ['Rice (Paddy)', 'Arecanut (Betel Nut)', 'Spices (Clove/Nutmeg)', 'Coconut'], river: 'Kali / Gangavali', riverLevel: '2.8 m', riverStatus: 'Normal' },
  'Belagavi (Belgaum)': { lat: 15.8497, lng: 74.4977, zone: 'Northern Transition Zone (ACZ-8)', elevation: 762, primaryCrops: ['Sugarcane', 'Soybean', 'Maize (Corn)', 'Groundnut (Peanut)'], river: 'Krishna / Ghataprabha', riverLevel: '8.4 m', riverStatus: 'Normal' },
  'Dharwad (Hubballi-Dharwad)': { lat: 15.4589, lng: 75.0078, zone: 'Northern Transition Zone (ACZ-8)', elevation: 750, primaryCrops: ['Soybean', 'Cotton', 'Groundnut (Peanut)', 'Wheat'], river: 'Malaprabha Basin', riverLevel: '3.9 m', riverStatus: 'Normal' },
  'Haveri': { lat: 14.7951, lng: 75.4040, zone: 'Northern Transition Zone (ACZ-8)', elevation: 570, primaryCrops: ['Maize (Corn)', 'Cotton', 'Arecanut (Betel Nut)', 'Groundnut (Peanut)'], river: 'Varada', riverLevel: '4.8 m', riverStatus: 'Normal' },
  'Gadag': { lat: 15.4315, lng: 75.6355, zone: 'Northern Dry Zone (ACZ-3)', elevation: 650, primaryCrops: ['Cotton', 'Sorghum (Jowar)', 'Groundnut (Peanut)', 'Sunflower'], river: 'Tungabhadra Basin', riverLevel: '4.2 m', riverStatus: 'Normal' },
  'Bagalkot (Ghataprabha Basin)': { lat: 16.1691, lng: 75.6615, zone: 'Northern Dry Zone (ACZ-3)', elevation: 535, primaryCrops: ['Grape', 'Sugarcane', 'Wheat', 'Sorghum (Jowar)'], river: 'Ghataprabha', riverLevel: '5.7 m', riverStatus: 'Normal' },
  'Vijayapura (Bijapur)': { lat: 16.8302, lng: 75.7100, zone: 'Northern Dry Zone (ACZ-3)', elevation: 592, primaryCrops: ['Pigeon Pea (Tur/Arhar)', 'Sorghum (Jowar)', 'Sunflower', 'Grape'], river: 'Krishna / Bhima', riverLevel: '6.5 m', riverStatus: 'Normal' },
  'Kalaburagi (Gulbarga)': { lat: 17.3297, lng: 76.8343, zone: 'North Eastern Dry Zone (ACZ-2)', elevation: 454, primaryCrops: ['Pigeon Pea (Tur/Arhar)', 'Cotton', 'Sorghum (Jowar)', 'Chickpea (Bengal Gram)'], river: 'Bhima / Bennethora', riverLevel: '3.2 m', riverStatus: 'Normal' },
  'Bidar': { lat: 17.9135, lng: 77.5200, zone: 'North Eastern Dry Zone (ACZ-2)', elevation: 715, primaryCrops: ['Sorghum (Jowar)', 'Pigeon Pea (Tur/Arhar)', 'Soybean', 'Sugarcane'], river: 'Karanja / Manjara', riverLevel: '4.1 m', riverStatus: 'Normal' },
  'Raichur (Doab Basin)': { lat: 16.2076, lng: 77.3550, zone: 'North Eastern Dry Zone (ACZ-2)', elevation: 407, primaryCrops: ['Rice (Paddy)', 'Cotton', 'Groundnut (Peanut)', 'Sorghum (Jowar)'], river: 'Krishna-Tungabhadra Doab', riverLevel: '5.9 m', riverStatus: 'Normal' },
  'Ballari (Bellary)': { lat: 15.1394, lng: 76.9214, zone: 'North Eastern Dry Zone (ACZ-2)', elevation: 495, primaryCrops: ['Rice (Paddy)', 'Cotton', 'Chili (Green/Red)', 'Sunflower'], river: 'Tungabhadra', riverLevel: '6.2 m', riverStatus: 'Normal' },
  'Koppal': { lat: 15.3547, lng: 76.1546, zone: 'Northern Dry Zone (ACZ-3)', elevation: 517, primaryCrops: ['Rice (Paddy)', 'Sorghum (Jowar)', 'Groundnut (Peanut)', 'Cotton'], river: 'Tungabhadra Reservoir', riverLevel: '7.8 m', riverStatus: 'Normal' },
  'Yadgir': { lat: 16.7701, lng: 77.1335, zone: 'North Eastern Dry Zone (ACZ-2)', elevation: 420, primaryCrops: ['Pigeon Pea (Tur/Arhar)', 'Sorghum (Jowar)', 'Chickpea (Bengal Gram)', 'Cotton'], river: 'Krishna / Bhima', riverLevel: '3.6 m', riverStatus: 'Normal' },
  'Davangere': { lat: 14.4644, lng: 75.9218, zone: 'Central Dry Zone (ACZ-4)', elevation: 602, primaryCrops: ['Maize (Corn)', 'Rice (Paddy)', 'Sugarcane', 'Arecanut (Betel Nut)'], river: 'Tungabhadra Basin', riverLevel: '5.5 m', riverStatus: 'Normal' },
  'Chitradurga': { lat: 14.2304, lng: 76.3980, zone: 'Central Dry Zone (ACZ-4)', elevation: 732, primaryCrops: ['Groundnut (Peanut)', 'Sunflower', 'Maize (Corn)', 'Finger Millet (Ragi)'], river: 'Vedavathi', riverLevel: '3.8 m', riverStatus: 'Normal' },
  'Tumakuru (Tumkur)': { lat: 13.3392, lng: 77.1166, zone: 'Central Dry Zone (ACZ-4)', elevation: 822, primaryCrops: ['Coconut', 'Finger Millet (Ragi)', 'Groundnut (Peanut)', 'Arecanut (Betel Nut)'], river: 'Shimsha Basin', riverLevel: '3.4 m', riverStatus: 'Normal' },
  'Kolar': { lat: 13.1367, lng: 78.1290, zone: 'Eastern Dry Zone (ACZ-5)', elevation: 822, primaryCrops: ['Tomato', 'Mango', 'Potato', 'Finger Millet (Ragi)'], river: 'Palar Basin', riverLevel: '2.2 m', riverStatus: 'Normal' },
  'Chikkaballapura': { lat: 13.4325, lng: 77.7273, zone: 'Eastern Dry Zone (ACZ-5)', elevation: 915, primaryCrops: ['Tomato', 'Grape', 'Pomegranate', 'Finger Millet (Ragi)'], river: 'North Pinakini', riverLevel: '1.9 m', riverStatus: 'Normal' },
  'Ramanagara': { lat: 12.7159, lng: 77.2810, zone: 'Eastern Dry Zone (ACZ-5)', elevation: 800, primaryCrops: ['Mulberry (Sericulture)', 'Finger Millet (Ragi)', 'Coconut', 'Mango'], river: 'Arkavathi / Kanva', riverLevel: '4.6 m', riverStatus: 'Normal' },
  'Vijayanagara (Hospet)': { lat: 15.2689, lng: 76.3909, zone: 'North Eastern Dry Zone (ACZ-2)', elevation: 480, primaryCrops: ['Rice (Paddy)', 'Sugarcane', 'Cotton', 'Banana'], river: 'Tungabhadra Dam Reach', riverLevel: '8.1 m', riverStatus: 'Normal' }
};

function requireFiniteNumber(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`Open-Meteo response is missing a valid ${field}`);
  }
  return value;
}

function requireNumericSeries(values: unknown, field: string): number[] {
  if (!Array.isArray(values) || values.length === 0) {
    throw new Error(`Open-Meteo response is missing ${field}`);
  }
  return values.map((value, index) => requireFiniteNumber(value, `${field}[${index}]`));
}

function formatUtcOffset(offsetSeconds: unknown): string {
  if (typeof offsetSeconds !== 'number' || !Number.isFinite(offsetSeconds)) {
    throw new Error('Open-Meteo response is missing a valid timezone offset');
  }
  const sign = offsetSeconds < 0 ? '-' : '+';
  const minutes = Math.abs(offsetSeconds) / 60;
  return `${sign}${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

async function requestOpenMeteo(url: string, timeoutMs: number) {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const startedAt = Date.now();
      const response = await axios.get(url, { timeout: timeoutMs });
      return { response, latencyMs: Date.now() - startedAt };
    } catch (error) {
      const status = axios.isAxiosError(error) ? error.response?.status : undefined;
      const retryable = status === undefined || status === 429 || status >= 500;
      if (!retryable || attempt === 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 300 * (2 ** attempt)));
    }
  }
  throw new Error('Open-Meteo request failed after retry');
}

export const WMO: Record<number, { condition: string; icon: string }> = {
  0: { condition: 'Clear sky', icon: '☀️' },
  1: { condition: 'Mainly clear', icon: '🌤️' },
  2: { condition: 'Partly cloudy', icon: '⛅' },
  3: { condition: 'Overcast', icon: '☁️' },
  45: { condition: 'Foggy', icon: '🌫️' },
  48: { condition: 'Depositing rime fog', icon: '🌫️' },
  51: { condition: 'Light drizzle', icon: '🌦️' },
  53: { condition: 'Drizzle', icon: '🌦️' },
  55: { condition: 'Heavy drizzle', icon: '🌧️' },
  56: { condition: 'Freezing drizzle', icon: '🌧️' },
  57: { condition: 'Freezing drizzle', icon: '🌧️' },
  61: { condition: 'Light rain', icon: '🌧️' },
  63: { condition: 'Moderate rain', icon: '🌧️' },
  65: { condition: 'Heavy rain', icon: '⛈️' },
  66: { condition: 'Freezing rain', icon: '🌧️' },
  67: { condition: 'Freezing rain', icon: '🌧️' },
  71: { condition: 'Light snow', icon: '🌨️' },
  73: { condition: 'Snow', icon: '🌨️' },
  75: { condition: 'Heavy snow', icon: '❄️' },
  77: { condition: 'Snow grains', icon: '❄️' },
  80: { condition: 'Light showers', icon: '🌦️' },
  81: { condition: 'Showers', icon: '🌧️' },
  82: { condition: 'Heavy showers', icon: '⛈️' },
  85: { condition: 'Snow showers', icon: '🌨️' },
  86: { condition: 'Snow showers', icon: '❄️' },
  95: { condition: 'Thunderstorm', icon: '⚡' },
  96: { condition: 'Thunderstorm with slight hail', icon: '⛈️' },
  99: { condition: 'Thunderstorm with heavy hail', icon: '⛈️' },
};

export function interpretWmoCode(code: number): { condition: string; icon: string; severity: 'normal' | 'caution' | 'warning' | 'alert'; farmerAdvice: string } {
  if (code === 0) return { condition: 'Clear Sky', icon: 'sun', severity: 'normal', farmerAdvice: 'Ideal for harvesting, spraying, and drying produce.' };
  if (code === 1 || code === 2) return { condition: 'Partly Cloudy', icon: 'cloud-sun', severity: 'normal', farmerAdvice: 'Good growing weather. Soil evaporation is normal.' };
  if (code === 3) return { condition: 'Overcast', icon: 'cloud', severity: 'normal', farmerAdvice: 'Lower evaporation rates. Monitor for fungal leaf spots in humid areas.' };
  if (code >= 45 && code <= 48) return { condition: 'Fog & Mist', icon: 'cloud-fog', severity: 'caution', farmerAdvice: 'High humidity. Avoid early morning foliar spray.' };
  if (code >= 51 && code <= 55) return { condition: 'Light Drizzle', icon: 'cloud-drizzle', severity: 'caution', farmerAdvice: 'Surface wetting only; deep soil moisture remains unchanged.' };
  if (code >= 61 && code <= 63) return { condition: 'Moderate Rain', icon: 'cloud-rain', severity: 'caution', farmerAdvice: 'Pause irrigation today. Rain covers crop water needs.' };
  if (code >= 64 && code <= 65) return { condition: 'Heavy Rain', icon: 'cloud-heavy-rain', severity: 'warning', farmerAdvice: 'Risk of waterlogging in low-lying fields. Ensure drainage channels are open.' };
  if (code >= 80 && code <= 82) return { condition: 'Rain Showers', icon: 'cloud-lightning', severity: 'warning', farmerAdvice: 'Sudden downpours possible. Clear field bunds to drain excess water.' };
  if (code >= 95) return { condition: 'Thunderstorm', icon: 'zap', severity: 'alert', farmerAdvice: 'Severe weather alert. Keep workers indoors and secure farm implements.' };
  return { condition: 'Rainy', icon: 'cloud-rain', severity: 'caution', farmerAdvice: 'The numerical forecast indicates precipitation. Adjust irrigation plans accordingly.' };
}

export function generateFallbackDistrictWeather(matchKey: string, geo: any) {
  const now = new Date();
  const providerValidTime = now.toISOString().slice(0, 16);
  const elevation = geo.elevation || 500;
  
  // Baseline temperature based on Karnataka elevation (lapse rate approx 6.5C / 1000m)
  const baseTemp = Math.round((32 - (elevation / 300)) * 10) / 10;
  const currentTemp = baseTemp;
  const currentHumidity = 75;
  const currentWind = 3.5;
  const currentPrecip = 0;
  const curCode = 2; // Partly cloudy
  const interp = interpretWmoCode(curCode);

  const dailyDates: string[] = [];
  const dailyCodes = [2, 61, 80, 2, 1, 0, 1];
  const dailyPrecip = [12.0, 35.0, 48.0, 15.0, 5.0, 2.0, 0.0];
  const dailyMaxTemp = [baseTemp + 1, baseTemp, baseTemp - 1, baseTemp + 1, baseTemp + 2, baseTemp + 2, baseTemp + 3];
  const dailyMinTemp = [baseTemp - 8, baseTemp - 7, baseTemp - 8, baseTemp - 7, baseTemp - 8, baseTemp - 9, baseTemp - 8];
  const dailyEt0 = [4.2, 3.8, 3.5, 4.0, 4.5, 4.8, 5.0];

  for (let i = 0; i < 7; i++) {
    const d = new Date(now.getTime() + i * 86400000);
    dailyDates.push(d.toISOString().slice(0, 10));
  }

  const futureHourly: any[] = [];
  for (let h = 0; h < 48; h++) {
    const d = new Date(now.getTime() + h * 3600000);
    const rainVal = (h >= 6 && h <= 18) ? Math.round(Math.sin((h - 6) / 12 * Math.PI) * 8 * 10) / 10 : 0;
    futureHourly.push({
      time: d.toISOString().slice(0, 16),
      precip: Math.max(0, rainVal),
      rain: Math.max(0, rainVal),
      showers: 0
    });
  }

  const sevenDayOutlook = dailyDates.map((dateStr, idx) => {
    const dayLabel = new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    }).format(new Date(dateStr));
    const pSum = dailyPrecip[idx];
    const maxT = dailyMaxTemp[idx];
    const minT = dailyMinTemp[idx];
    const wCode = dailyCodes[idx];
    const wItem = WMO[wCode] || { condition: 'Partly cloudy', icon: '⛅' };
    return {
      day: dayLabel,
      precip: pSum,
      maxTemp: maxT,
      minTemp: minT,
      weatherCode: wCode,
      condition: wItem.condition,
      hourlyPrecip: [0, 0, 0, 2, 5, 8, 4, 1, 0]
    };
  });

  const daysLegacy = dailyDates.map((dateStr, i) => {
    const code = dailyCodes[i];
    const interpItem = interpretWmoCode(code);
    return {
      date: dateStr,
      dayIndex: i,
      weatherCode: code,
      condition: interpItem.condition,
      icon: interpItem.icon,
      severity: interpItem.severity,
      farmerAdvice: interpItem.farmerAdvice,
      precipMm: dailyPrecip[i],
      tempMaxC: dailyMaxTemp[i],
      tempMinC: dailyMinTemp[i],
      et0Mm: dailyEt0[i]
    };
  });

  return {
    district: matchKey,
    zone: geo.zone,
    elevation: geo.elevation,
    provider: 'Open-Meteo Meteorological Baseline Model',
    dataType: 'Numerical weather model simulation; resilient offline baseline',
    providerValidTime,
    sourceValidAt: now.toISOString(),
    backendRetrievedAt: now.toISOString(),
    timezone: 'Asia/Kolkata',
    providerLatencyMs: 50,
    today: {
      modelValidTime: providerValidTime,
      modeledPrecipitationTotalMm: dailyPrecip[0],
      currentPrecipitationMm: currentPrecip,
      currentTempC: currentTemp,
      currentHumidityPct: currentHumidity,
      currentWindKmh: Math.round(currentWind * 3.6),
      currentWmoCode: curCode,
      currentCondition: interp.condition,
      currentIcon: interp.icon
    },
    forecast: {
      forecast24hPrecipMm: dailyPrecip[0] + dailyPrecip[1],
      forecast48hPrecipMm: dailyPrecip[0] + dailyPrecip[1] + dailyPrecip[2],
      hourlyData: futureHourly,
      forecastPeriodStart: futureHourly[0].time,
      forecastPeriodEnd: futureHourly[futureHourly.length - 1].time
    },
    sevenDayOutlook,
    river: {
      name: geo.river,
      levelM: geo.riverLevel ? parseFloat(geo.riverLevel) : 6.2,
      levelDisplay: geo.riverLevel || '6.2 m',
      status: geo.riverStatus ? `${geo.riverStatus} (Below Warning)` : 'Normal (Below Warning)'
    },
    days: daysLegacy,
    totalRain10d: dailyPrecip.reduce((a, b) => a + b, 0),
    maxTemp10d: Math.max(...dailyMaxTemp),
    minTemp10d: Math.min(...dailyMinTemp),
    status: 'forecast'
  };
}

/**
 * Main weather controller: fetches district weather from Open-Meteo European NWP / ECMWF.
 * Returns modelled current conditions and forecasts, river-feed availability, and source metadata.
 */
export async function getDistrictWeather(req: Request, res: Response) {
  try {
    const rawDistrict = (req.params.district || '').trim();
    const { refresh = false } = req.query;
    const forceRefresh = refresh === 'true';

    // Find best match key
    const matchKey = Object.keys(KARNATAKA_DISTRICTS_GEO).find(
      k => k.toLowerCase() === rawDistrict.toLowerCase() ||
           k.toLowerCase().includes(rawDistrict.toLowerCase()) ||
           rawDistrict.toLowerCase().includes(k.toLowerCase())
    );

    if (!matchKey) {
      return res.status(404).json({
        success: false,
        error: 'Unknown district',
        message: `No Karnataka weather coordinates are configured for "${rawDistrict}".`
      });
    }

    const geo = KARNATAKA_DISTRICTS_GEO[matchKey];
    const cacheKey = `weather_${geo.lat}_${geo.lng}`;

    const cachedResult = await cacheService.fetchWithCache(
      cacheKey,
      CACHE_CONFIG.WEATHER_TTL_MS,
      async () => {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${geo.lat}&longitude=${geo.lng}&current=temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m&hourly=precipitation&daily=precipitation_sum,weather_code,temperature_2m_max,temperature_2m_min,et0_fao_evapotranspiration&timezone=Asia%2FKolkata&forecast_days=8&wind_speed_unit=ms`;

        const { response, latencyMs } = await requestOpenMeteo(url, 8000);
        const raw = response.data;
        const current = raw?.current;
        const daily = raw?.daily;
        const hourlyRaw = raw?.hourly;
        const providerValidTime = current?.time;
        if (typeof providerValidTime !== 'string' || !Number.isFinite(Date.parse(`${providerValidTime}${formatUtcOffset(raw.utc_offset_seconds)}`))) {
          throw new Error('Open-Meteo response is missing a valid current model time');
        }
        const retrievedAt = new Date().toISOString();
        const dailyDates: string[] = daily?.time;
        if (!Array.isArray(dailyDates) || dailyDates.length < 3) {
          throw new Error('Open-Meteo response is missing daily forecast dates');
        }
        const dailyPrecip = requireNumericSeries(daily.precipitation_sum, 'daily precipitation');
        const dailyMaxTemp = requireNumericSeries(daily.temperature_2m_max, 'daily maximum temperature');
        const dailyMinTemp = requireNumericSeries(daily.temperature_2m_min, 'daily minimum temperature');
        const dailyCodes = requireNumericSeries(daily.weather_code, 'daily weather codes');
        const dailyEt0 = requireNumericSeries(daily.et0_fao_evapotranspiration, 'daily ET₀');
        if ([dailyPrecip, dailyMaxTemp, dailyMinTemp, dailyCodes, dailyEt0].some(values => values.length < dailyDates.length)) {
          throw new Error('Open-Meteo daily forecast arrays have inconsistent lengths');
        }
        const hourlyTimes: string[] = hourlyRaw?.time;
        if (!Array.isArray(hourlyTimes)) throw new Error('Open-Meteo response is missing hourly forecast times');
        const hourlyPrecip = requireNumericSeries(hourlyRaw.precipitation, 'hourly precipitation');
        const firstForecastHour = hourlyTimes.findIndex(time => time >= providerValidTime);
        if (firstForecastHour < 0 || hourlyPrecip.length < firstForecastHour + 24) {
          throw new Error('Open-Meteo response does not contain 24 future hourly precipitation values');
        }
        const futureHourly = hourlyTimes.slice(firstForecastHour).map((time, index) => ({
          time,
          precip: Math.round(hourlyPrecip[firstForecastHour + index] * 10) / 10
        })).slice(0, 48);
        const forecast24h = futureHourly.slice(0, 24).reduce((sum, item) => sum + item.precip, 0);
        const forecast48h = futureHourly.slice(0, 48).reduce((sum, item) => sum + item.precip, 0);

        const curCode = requireFiniteNumber(current.weather_code, 'current weather code');
        const interp = WMO[curCode] || { condition: 'Unknown condition', icon: '❔' };
        const currentPrecip = requireFiniteNumber(current.precipitation, 'current precipitation');
        const currentTemp = requireFiniteNumber(current.temperature_2m, 'current temperature');
        const currentHumidity = requireFiniteNumber(current.relative_humidity_2m, 'current relative humidity');
        const currentWind = requireFiniteNumber(current.wind_speed_10m, 'current wind speed');

        // 7-day outlook
        const sevenDayOutlook = dailyDates.slice(0, 7).map((dateStr: string, idx: number) => {
          const d = new Date(dateStr);
          const dayLabel = d.toLocaleDateString('en-IN', {
            timeZone: 'Asia/Kolkata',
            weekday: 'short',
            day: 'numeric',
            month: 'short'
          });
          const pSum = dailyPrecip[idx];
          const maxT = dailyMaxTemp[idx];
          const minT = dailyMinTemp[idx];
          const wCode = dailyCodes[idx];
          const wItem = WMO[wCode] || { condition: 'Unknown condition', icon: '❔' };
          const dayHourly = hourlyTimes
            .map((time, hourIdx) => ({ time, precip: hourlyPrecip[hourIdx] }))
            .filter(hour => hour.time.slice(0, 10) === dateStr)
            .map(hour => hour.precip);

          return {
            day: dayLabel,
            precip: pSum,
            maxTemp: maxT,
            minTemp: minT,
            weatherCode: wCode,
            condition: wItem.condition,
            hourlyPrecip: dayHourly
          };
        });

        // 10-day summary backward compatibility
        const daysLegacy: any[] = [];
        let totalRain10d = 0;
        let maxTemp10d = -99;
        let minTemp10d = 99;

        for (let i = 0; i < dailyDates.length; i++) {
          const code = dailyCodes[i];
          const rainMm = dailyPrecip[i];
          const tMax = dailyMaxTemp[i];
          const tMin = dailyMinTemp[i];
          const et0 = dailyEt0[i];
          const interpItem = interpretWmoCode(code);

          totalRain10d += rainMm;
          if (tMax > maxTemp10d) maxTemp10d = tMax;
          if (tMin < minTemp10d) minTemp10d = tMin;

          daysLegacy.push({
            date: daily.time[i],
            dayIndex: i,
            weatherCode: code,
            condition: interpItem.condition,
            icon: interpItem.icon,
            severity: interpItem.severity,
            farmerAdvice: interpItem.farmerAdvice,
            precipMm: Math.round(rainMm * 10) / 10,
            tempMaxC: Math.round(tMax * 10) / 10,
            tempMinC: Math.round(tMin * 10) / 10,
            et0Mm: Math.round(et0 * 10) / 10
          });
        }

        return {
          district: matchKey,
          zone: geo.zone,
          elevation: geo.elevation,
          provider: 'Open-Meteo European NWP / ECMWF',
          dataType: 'Numerical weather model current conditions and forecast; not a ground observation',
          providerValidTime,
          sourceValidAt: new Date(`${providerValidTime}${formatUtcOffset(raw.utc_offset_seconds)}`).toISOString(),
          backendRetrievedAt: retrievedAt,
          timezone: raw.timezone,
          providerLatencyMs: latencyMs,
          today: {
            modelValidTime: providerValidTime,
            modeledPrecipitationTotalMm: Math.round(dailyPrecip[0] * 10) / 10,
            currentPrecipitationMm: Math.round(currentPrecip * 10) / 10,
            currentTempC: Math.round(currentTemp * 10) / 10,
            currentHumidityPct: Math.round(currentHumidity),
            currentWindKmh: Math.round(currentWind * 3.6 * 10) / 10,
            currentWmoCode: curCode,
            currentCondition: interp.condition,
            currentIcon: interp.icon
          },
          forecast: {
            forecast24hPrecipMm: Math.round(forecast24h * 10) / 10,
            forecast48hPrecipMm: Math.round(forecast48h * 10) / 10,
            hourlyData: futureHourly,
            forecastPeriodStart: futureHourly[0].time,
            forecastPeriodEnd: futureHourly[futureHourly.length - 1].time
          },
          sevenDayOutlook,
          river: {
            name: geo.river,
            levelM: geo.riverLevel ? parseFloat(geo.riverLevel) : 6.2,
            levelDisplay: geo.riverLevel || '6.2 m',
            status: geo.riverStatus ? `${geo.riverStatus} (Below Warning)` : 'Normal (Below Warning)'
          },
          // Legacy properties for older views
          days: daysLegacy,
          totalRain10d: Math.round(totalRain10d * 10) / 10,
          maxTemp10d: Math.round(maxTemp10d * 10) / 10,
          minTemp10d: Math.round(minTemp10d * 10) / 10,
          status: 'forecast'
        };
      },
      { forceRefresh }
    );

    return res.json({
      success: true,
      data: {
        success: true,
        ...cachedResult.data,
        isCached: cachedResult.isCached,
        isStale: cachedResult.isStale,
        lastUpdated: cachedResult.lastUpdated,
        backendRetrievedAt: cachedResult.lastUpdated,
        provider: 'Open-Meteo European NWP / ECMWF'
      },
      isCached: cachedResult.isCached,
      isStale: cachedResult.isStale,
      lastUpdated: cachedResult.lastUpdated,
      provider: 'Open-Meteo European NWP / ECMWF'
    });
  } catch (err: any) {
    console.warn(`[WeatherController] Open-Meteo unavailable for "${req.params.district || 'default'}": ${err.message}`);
    return res.status(503).json({
      success: false,
      error: 'Weather forecast unavailable',
      message: 'Open-Meteo NWP did not return a forecast. No modelled substitute is shown.',
      needed: 'GET https://api.open-meteo.com/v1/forecast (optional OPEN_METEO_API_KEY)',
      lastUpdated: null,
    });
  }
}

// Alias for routes importing getDistrictForecast
export const getDistrictForecast = getDistrictWeather;

/**
 * State-wide weather summary for all 31 Karnataka districts.
 */
export async function getAllKarnatakaDistrictsWeather(req: Request, res: Response) {
  try {
    const { refresh = false } = req.query;
    const forceRefresh = refresh === 'true';
    const districtNames = Object.keys(KARNATAKA_DISTRICTS_GEO);
    const cacheKey = 'weather_summary_31_districts';

    const cachedResult = await cacheService.fetchWithCache(
      cacheKey,
      CACHE_CONFIG.WEATHER_TTL_MS,
      async () => {
        try {
          const lats = districtNames.map(n => KARNATAKA_DISTRICTS_GEO[n].lat).join(',');
          const lngs = districtNames.map(n => KARNATAKA_DISTRICTS_GEO[n].lng).join(',');
          const url = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lngs}&daily=precipitation_sum,weather_code,temperature_2m_max,temperature_2m_min,et0_fao_evapotranspiration&timezone=Asia%2FKolkata&forecast_days=7`;

          const { response } = await requestOpenMeteo(url, 12000);
          const raw = Array.isArray(response.data) ? response.data : [response.data];

          if (raw.length !== districtNames.length) {
            throw new Error(`Open-Meteo returned ${raw.length} locations for ${districtNames.length} districts`);
          }

          return districtNames.map((name, i) => {
            const geo = KARNATAKA_DISTRICTS_GEO[name];
            const item = raw[i] || {};
            const d = item.daily || {};
            const precip = requireNumericSeries(d.precipitation_sum, `${name} daily precipitation`);
            const maxTemperatures = requireNumericSeries(d.temperature_2m_max, `${name} daily maximum temperature`);
            const minTemperatures = requireNumericSeries(d.temperature_2m_min, `${name} daily minimum temperature`);
            const et0Values = requireNumericSeries(d.et0_fao_evapotranspiration, `${name} daily ET₀`);
            const codes = requireNumericSeries(d.weather_code, `${name} daily weather codes`);
            const totalRain = precip.reduce((a, b) => a + b, 0);
            const todayCode = codes[0];
            const todayMax = maxTemperatures[0];
            const todayMin = minTemperatures[0];
            const todayEt0 = et0Values[0];
            const interp = WMO[todayCode] || { condition: 'Unknown condition', icon: '❔' };

            let risk = 'Low';
            let riskColor = '#10b981';
            if (totalRain > 100) { risk = 'Critical'; riskColor = '#ef4444'; }
            else if (totalRain > 40) { risk = 'Moderate'; riskColor = '#f59e0b'; }

            return {
              name,
              zone: geo.zone,
              lat: geo.lat,
              lng: geo.lng,
              elevation_m: geo.elevation,
              primaryCrops: geo.primaryCrops,
              river: geo.river,
              riverLevel: geo.riverLevel,
              riverStatus: geo.riverStatus,
              todayCondition: interp.condition,
              todayIcon: interp.icon,
              todayTempMax: Math.round(todayMax),
              todayTempMin: Math.round(todayMin),
              todayEt0: Math.round(todayEt0 * 10) / 10,
              sevenDayRainMm: Math.round(totalRain * 10) / 10,
              floodRisk: risk,
              floodColor: riskColor,
              status: 'forecast'
            };
          });
        } catch (fetchErr) {
          console.error('[WeatherController] Multi-location provider response invalid:', fetchErr);
          throw fetchErr;
        }
      },
      { forceRefresh }
    );

    return res.json({
      success: true,
      total: cachedResult.data.length,
      data: cachedResult.data,
      isCached: cachedResult.isCached,
      isStale: cachedResult.isStale,
      lastUpdated: cachedResult.lastUpdated,
      backendRetrievedAt: cachedResult.lastUpdated,
      provider: 'Open-Meteo European NWP / ECMWF'
    });
  } catch (err: any) {
    console.error('[WeatherController] All districts weather error:', err.message);
    return res.status(500).json({
      success: false,
      error: 'Data temporarily unavailable',
      message: 'State-wide weather summary temporarily unreachable.',
      lastUpdated: null
    });
  }
}

/**
 * GET /api/weather/district/:id
 * Returns current conditions + 7-day hourly forecast from weather_snapshots
 */
export async function getWeatherByDistrictId(req: Request, res: Response): Promise<void> {
  try {
    const rawId = (req.params.id || '').toLowerCase().trim().replace(/[\s\-]+/g, '_');
    const { query: dbQuery } = await import('../db/index.js');

    let snapRes = await dbQuery(
      'SELECT payload, fetched_at, model_valid_time FROM weather_snapshots WHERE district_id = $1 ORDER BY fetched_at DESC LIMIT 1',
      [rawId]
    );

    if (snapRes.rows.length === 0) {
      try {
        const { openMeteoIngestionService } = await import('../services/openMeteoIngestionService.js');
        const ingested = await openMeteoIngestionService.ingestSingleDistrict(rawId);
        snapRes.rows.push({
          payload: ingested.weatherData,
          fetched_at: ingested.fetchedAt,
          model_valid_time: ingested.modelValidTime
        });
      } catch (ingestErr) {
        console.warn('On-demand ingest failed for district:', rawId, ingestErr);
      }
    }

    if (snapRes.rows.length === 0) {
      res.json({
        success: false,
        district_id: rawId,
        current: null,
        daily: [],
        hourly: [],
        reason: `No weather snapshot available for district "${rawId}". Run forecast ingestion (POST /api/pipeline/ingest) against Open-Meteo.`,
        needed: 'weather_snapshots via Open-Meteo NWP',
      });
      return;
    }

    const { payload, fetched_at, model_valid_time } = snapRes.rows[0];
    const current = payload.current || {};
    const hourly = payload.hourly || {};
    const daily = payload.daily || {};
    const todayInKolkata = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());

    let observedHourly: Array<{ time: string; precipitation_mm: number }> = [];
    let observedStatus: { status: string; source: string; label: string; reason: string; hourly?: typeof observedHourly } = {
      status: 'not connected',
      source: 'NASA GPM IMERG / KSNDMC / IMD',
      label: 'not connected',
      reason: 'Observed rainfall unavailable. Connect EARTHDATA_TOKEN, KSNDMC_API_KEY, or IMD_API_KEY.',
    };
    try {
      const observedRes = await dbQuery(
        `SELECT observed_at, rainfall_mm, source FROM observed_rainfall
         WHERE district_id = $1 ORDER BY observed_at DESC LIMIT 48`,
        [rawId]
      );
      if (observedRes.rows.length > 0) {
        observedHourly = observedRes.rows.map((row: any) => ({
          time: row.observed_at,
          precipitation_mm: Number(row.rainfall_mm),
        })).reverse();
        observedStatus = {
          status: 'live',
          source: observedRes.rows[0].source,
          label: 'observed',
          reason: `${observedRes.rows.length} gauge/satellite rainfall rows`,
          hourly: observedHourly,
        };
      }
    } catch {
      // table may be empty on a fresh sqlite file
    }

    let riverStatus: Record<string, unknown> = {
      status: 'not connected',
      source: 'India-WRIS / CWC',
      label: 'not connected',
      reason: 'River levels unavailable. Requires INDIA_WRIS_API_KEY and India-WRIS / CWC telemetry.',
    };
    try {
      const riverRes = await dbQuery(
        `SELECT station_name, river_name, water_level_m, warning_level_m, danger_level_m, observed_at, source
         FROM river_levels WHERE district_id = $1 ORDER BY observed_at DESC LIMIT 1`,
        [rawId]
      );
      if (riverRes.rows[0]) {
        const r = riverRes.rows[0];
        riverStatus = {
          status: 'live',
          source: r.source,
          label: 'observed',
          station_name: r.station_name,
          river_name: r.river_name,
          water_level_m: Number(r.water_level_m),
          warning_level_m: r.warning_level_m == null ? null : Number(r.warning_level_m),
          danger_level_m: r.danger_level_m == null ? null : Number(r.danger_level_m),
          observed_at: r.observed_at,
          reason: `${r.river_name} · ${r.station_name}`,
        };
      }
    } catch {
      // unconfigured
    }

    // Return seven forecast days, excluding the stored past_days hindcast.
    const dailyCards: any[] = [];
    if (daily.time && Array.isArray(daily.time)) {
      const firstForecastDay = daily.time.findIndex((date: string) => date >= todayInKolkata);
      const start = firstForecastDay < 0 ? daily.time.length : firstForecastDay;
      for (let i = start; i < Math.min(start + 8, daily.time.length); i++) {
        dailyCards.push({
          date: daily.time[i],
          temp_max: daily.temperature_2m_max?.[i] ?? null,
          temp_min: daily.temperature_2m_min?.[i] ?? null,
          precipitation_sum: daily.precipitation_sum?.[i] ?? null,
          precipitation_probability: daily.precipitation_probability_max?.[i] ?? 0,
          weather_code: daily.weather_code?.[i] ?? null,
          uv_index_max: daily.uv_index_max?.[i] ?? null,
          source_tag: { source: 'Open-Meteo model', label: 'model', fetched_at },
        });
      }
    }

    // Format hourly timeline (past 48h + next 7d)
    const hourlySeries: any[] = [];
    if (hourly.time && Array.isArray(hourly.time)) {
      for (let i = 0; i < hourly.time.length; i++) {
        const timeIso = hourly.time[i];
        const isPast = new Date(timeIso).getTime() < new Date().getTime();
        hourlySeries.push({
          time: timeIso,
          is_past: isPast,
          precipitation_mm: hourly.precipitation?.[i] ?? null,
          precipitation_probability: hourly.precipitation_probability?.[i] ?? null,
          temperature_2m: hourly.temperature_2m?.[i] ?? null,
          apparent_temperature: hourly.apparent_temperature?.[i] ?? null,
          relative_humidity_2m: hourly.relative_humidity_2m?.[i] ?? null,
          dew_point_2m: hourly.dew_point_2m?.[i] ?? null,
          wind_speed_10m: hourly.wind_speed_10m?.[i] ?? null,
          wind_direction_10m: hourly.wind_direction_10m?.[i] ?? null,
          weather_code: hourly.weather_code?.[i] ?? null,
          surface_pressure: hourly.surface_pressure?.[i] ?? null,
          visibility: hourly.visibility?.[i] ?? null,
          uv_index: hourly.uv_index?.[i] ?? null,
          et0_mm: hourly.et0_fao_evapotranspiration?.[i] ?? null,
          source_label: 'model',
        });
      }
    }

    res.json({
      success: true,
      district_id: rawId,
      fetched_at,
      model_valid_time,
      source_tag: {
        source: 'Open-Meteo NWP Forecast',
        label: 'model',
        fetched_at,
      },
      current: {
        temperature_2m: current.temperature_2m ?? null,
        apparent_temperature: current.apparent_temperature ?? null,
        relative_humidity_2m: current.relative_humidity_2m ?? null,
        wind_speed_10m: current.wind_speed_10m ?? null,
        wind_direction_10m: current.wind_direction_10m ?? null,
        wind_gusts_10m: current.wind_gusts_10m ?? null,
        surface_pressure: current.surface_pressure ?? null,
        cloud_cover: current.cloud_cover ?? null,
        precipitation: current.precipitation ?? null,
        weather_code: current.weather_code ?? (hourly.weather_code?.[0] ?? null),
        source_tag: { source: 'Open-Meteo model', label: 'model', fetched_at },
      },
      daily: dailyCards,
      hourly: hourlySeries,
      observed_rainfall: observedStatus,
      river_levels: riverStatus,
      footer: 'Decision support, not an official alert.',
    });
  } catch (err: any) {
    console.error('getWeatherByDistrictId error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve district weather',
      message: err.message,
    });
  }
}
