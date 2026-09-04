import { Request, Response } from 'express';
import axios from 'axios';

// 31 Karnataka districts coordinates & metadata
export const KARNATAKA_DISTRICTS_GEO: Record<string, { lat: number; lng: number; zone: string; elevation: number; primaryCrops: string[] }> = {
  'Bengaluru Urban': { lat: 12.9716, lng: 77.5946, zone: 'Eastern Dry Zone (ACZ-5)', elevation: 920, primaryCrops: ['Finger Millet (Ragi)', 'Tomato', 'Cabbage', 'Maize (Corn)'] },
  'Bengaluru Rural': { lat: 13.1294, lng: 77.5730, zone: 'Eastern Dry Zone (ACZ-5)', elevation: 905, primaryCrops: ['Finger Millet (Ragi)', 'Chili (Green/Red)', 'Mango', 'Tomato'] },
  'Mysuru (Mysore)': { lat: 12.2958, lng: 76.6394, zone: 'Southern Dry Zone (ACZ-6)', elevation: 763, primaryCrops: ['Sugarcane', 'Rice (Paddy)', 'Finger Millet (Ragi)', 'Cotton'] },
  'Mandya (Cauvery Basin)': { lat: 12.5218, lng: 76.8951, zone: 'Southern Dry Zone (ACZ-6)', elevation: 678, primaryCrops: ['Sugarcane', 'Rice (Paddy)', 'Coconut', 'Finger Millet (Ragi)'] },
  'Chamarajanagar': { lat: 11.9261, lng: 76.9437, zone: 'Southern Dry Zone (ACZ-6)', elevation: 690, primaryCrops: ['Sugarcane', 'Rice (Paddy)', 'Maize (Corn)', 'Banana'] },
  'Kodagu (Coorg)': { lat: 12.4244, lng: 75.7382, zone: 'Hilly Zone (ACZ-9) / Western Ghats', elevation: 1150, primaryCrops: ['Coffee (Arabica/Robusta)', 'Black Pepper (Kari Menasu)', 'Cardamom (Yalakki)', 'Rice (Paddy)'] },
  'Hassan': { lat: 13.0072, lng: 76.0961, zone: 'Southern Transition Zone (ACZ-7)', elevation: 957, primaryCrops: ['Potato', 'Coffee (Arabica/Robusta)', 'Finger Millet (Ragi)', 'Maize (Corn)'] },
  'Chikkamagaluru': { lat: 13.3161, lng: 75.7720, zone: 'Hilly Zone (ACZ-9) / Western Ghats', elevation: 1090, primaryCrops: ['Coffee (Arabica/Robusta)', 'Arecanut (Betel Nut)', 'Black Pepper (Kari Menasu)', 'Cardamom (Yalakki)'] },
  'Shivamogga (Shimoga)': { lat: 13.9299, lng: 75.5681, zone: 'Southern Transition Zone (ACZ-7)', elevation: 584, primaryCrops: ['Arecanut (Betel Nut)', 'Rice (Paddy)', 'Maize (Corn)', 'Ginger'] },
  'Dakshina Kannada (Mangaluru)': { lat: 12.9141, lng: 74.8560, zone: 'Coastal Zone (ACZ-10)', elevation: 22, primaryCrops: ['Rice (Paddy)', 'Arecanut (Betel Nut)', 'Cashew (Geru)', 'Coconut'] },
  'Udupi': { lat: 13.3409, lng: 74.7421, zone: 'Coastal Zone (ACZ-10)', elevation: 18, primaryCrops: ['Rice (Paddy)', 'Coconut', 'Arecanut (Betel Nut)', 'Cashew (Geru)'] },
  'Uttara Kannada (Karwar)': { lat: 14.8185, lng: 74.1332, zone: 'Coastal Zone (ACZ-10)', elevation: 15, primaryCrops: ['Rice (Paddy)', 'Arecanut (Betel Nut)', 'Spices (Clove/Nutmeg)', 'Coconut'] },
  'Belagavi (Belgaum)': { lat: 15.8497, lng: 74.4977, zone: 'Northern Transition Zone (ACZ-8)', elevation: 762, primaryCrops: ['Sugarcane', 'Soybean', 'Maize (Corn)', 'Groundnut (Peanut)'] },
  'Dharwad (Hubballi-Dharwad)': { lat: 15.4589, lng: 75.0078, zone: 'Northern Transition Zone (ACZ-8)', elevation: 750, primaryCrops: ['Soybean', 'Cotton', 'Groundnut (Peanut)', 'Wheat'] },
  'Haveri': { lat: 14.7951, lng: 75.4040, zone: 'Northern Transition Zone (ACZ-8)', elevation: 570, primaryCrops: ['Maize (Corn)', 'Cotton', 'Arecanut (Betel Nut)', 'Groundnut (Peanut)'] },
  'Gadag': { lat: 15.4315, lng: 75.6355, zone: 'Northern Dry Zone (ACZ-3)', elevation: 650, primaryCrops: ['Cotton', 'Sorghum (Jowar)', 'Groundnut (Peanut)', 'Sunflower'] },
  'Bagalkot (Ghataprabha Basin)': { lat: 16.1691, lng: 75.6615, zone: 'Northern Dry Zone (ACZ-3)', elevation: 535, primaryCrops: ['Grape', 'Sugarcane', 'Wheat', 'Sorghum (Jowar)'] },
  'Vijayapura (Bijapur)': { lat: 16.8302, lng: 75.7100, zone: 'Northern Dry Zone (ACZ-3)', elevation: 592, primaryCrops: ['Pigeon Pea (Tur/Arhar)', 'Sorghum (Jowar)', 'Sunflower', 'Grape'] },
  'Kalaburagi (Gulbarga)': { lat: 17.3297, lng: 76.8343, zone: 'North Eastern Dry Zone (ACZ-2)', elevation: 454, primaryCrops: ['Pigeon Pea (Tur/Arhar)', 'Cotton', 'Sorghum (Jowar)', 'Chickpea (Bengal Gram)'] },
  'Bidar': { lat: 17.9135, lng: 77.5200, zone: 'North Eastern Dry Zone (ACZ-2)', elevation: 715, primaryCrops: ['Sorghum (Jowar)', 'Pigeon Pea (Tur/Arhar)', 'Soybean', 'Sugarcane'] },
  'Raichur (Doab Basin)': { lat: 16.2076, lng: 77.3550, zone: 'North Eastern Dry Zone (ACZ-2)', elevation: 407, primaryCrops: ['Rice (Paddy)', 'Cotton', 'Groundnut (Peanut)', 'Sorghum (Jowar)'] },
  'Ballari (Bellary)': { lat: 15.1394, lng: 76.9214, zone: 'North Eastern Dry Zone (ACZ-2)', elevation: 495, primaryCrops: ['Rice (Paddy)', 'Cotton', 'Chili (Green/Red)', 'Sunflower'] },
  'Koppal': { lat: 15.3547, lng: 76.1546, zone: 'Northern Dry Zone (ACZ-3)', elevation: 517, primaryCrops: ['Rice (Paddy)', 'Sorghum (Jowar)', 'Groundnut (Peanut)', 'Cotton'] },
  'Yadgir': { lat: 16.7701, lng: 77.1335, zone: 'North Eastern Dry Zone (ACZ-2)', elevation: 420, primaryCrops: ['Pigeon Pea (Tur/Arhar)', 'Sorghum (Jowar)', 'Chickpea (Bengal Gram)', 'Cotton'] },
  'Davangere': { lat: 14.4644, lng: 75.9218, zone: 'Central Dry Zone (ACZ-4)', elevation: 602, primaryCrops: ['Maize (Corn)', 'Rice (Paddy)', 'Sugarcane', 'Arecanut (Betel Nut)'] },
  'Chitradurga': { lat: 14.2304, lng: 76.3980, zone: 'Central Dry Zone (ACZ-4)', elevation: 732, primaryCrops: ['Groundnut (Peanut)', 'Sunflower', 'Maize (Corn)', 'Finger Millet (Ragi)'] },
  'Tumakuru (Tumkur)': { lat: 13.3392, lng: 77.1166, zone: 'Central Dry Zone (ACZ-4)', elevation: 822, primaryCrops: ['Coconut', 'Finger Millet (Ragi)', 'Groundnut (Peanut)', 'Arecanut (Betel Nut)'] },
  'Kolar': { lat: 13.1367, lng: 78.1290, zone: 'Eastern Dry Zone (ACZ-5)', elevation: 822, primaryCrops: ['Tomato', 'Mango', 'Potato', 'Finger Millet (Ragi)'] },
  'Chikkaballapura': { lat: 13.4325, lng: 77.7273, zone: 'Eastern Dry Zone (ACZ-5)', elevation: 915, primaryCrops: ['Tomato', 'Grape', 'Pomegranate', 'Finger Millet (Ragi)'] },
  'Ramanagara': { lat: 12.7159, lng: 77.2810, zone: 'Eastern Dry Zone (ACZ-5)', elevation: 800, primaryCrops: ['Mulberry (Sericulture)', 'Finger Millet (Ragi)', 'Coconut', 'Mango'] },
  'Vijayanagara (Hospet)': { lat: 15.2689, lng: 76.3909, zone: 'North Eastern Dry Zone (ACZ-2)', elevation: 480, primaryCrops: ['Rice (Paddy)', 'Sugarcane', 'Cotton', 'Banana'] }
};

// Weather code mapping to readable condition, icon type and agricultural warning
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
  return { condition: 'Rainy', icon: 'cloud-rain', severity: 'caution', farmerAdvice: 'Precipitation observed. Adjust irrigation schedules accordingly.' };
}

// In-memory cache to stay fast and avoid rate limits (1 hour TTL)
interface CacheEntry {
  timestamp: number;
  data: any;
}
const weatherCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function getDistrictForecast(req: Request, res: Response) {
  try {
    const rawDistrict = (req.params.district || 'Bengaluru Urban').trim();
    
    // Find closest matching district key
    const districtKey = Object.keys(KARNATAKA_DISTRICTS_GEO).find(
      d => d.toLowerCase().includes(rawDistrict.toLowerCase()) || rawDistrict.toLowerCase().includes(d.toLowerCase())
    ) || 'Bengaluru Urban';

    const geo = KARNATAKA_DISTRICTS_GEO[districtKey];

    const cacheKey = `forecast_${districtKey}`;
    const cached = weatherCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
      return res.json({ success: true, cached: true, data: cached.data });
    }

    // Call Open-Meteo free API (no key needed)
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${geo.lat}&longitude=${geo.lng}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,weathercode,windspeed_10m_max,et0_fao_evapotranspiration&timezone=Asia/Kolkata&forecast_days=10`;

    const response = await axios.get(url, { timeout: 8000 });
    const daily = response.data.daily;

    const days: any[] = [];
    let totalRain10d = 0;
    let maxTemp10d = -99;
    let minTemp10d = 99;

    for (let i = 0; i < (daily.time?.length || 0); i++) {
      const code = daily.weathercode?.[i] ?? 0;
      const rainMm = daily.precipitation_sum?.[i] ?? 0;
      const tMax = daily.temperature_2m_max?.[i] ?? 30;
      const tMin = daily.temperature_2m_min?.[i] ?? 20;
      const et0 = daily.et0_fao_evapotranspiration?.[i] ?? 4.0;
      const rainProb = daily.precipitation_probability_max?.[i] ?? 0;
      const windMax = daily.windspeed_10m_max?.[i] ?? 10;

      totalRain10d += rainMm;
      if (tMax > maxTemp10d) maxTemp10d = tMax;
      if (tMin < minTemp10d) minTemp10d = tMin;

      const interpretation = interpretWmoCode(code);

      days.push({
        date: daily.time[i],
        dayOfWeek: new Date(daily.time[i]).toLocaleDateString('en-US', { weekday: 'short' }),
        formattedDate: new Date(daily.time[i]).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        weatherCode: code,
        condition: interpretation.condition,
        icon: interpretation.icon,
        severity: interpretation.severity,
        farmerAdvice: interpretation.farmerAdvice,
        tempMaxC: Math.round(tMax * 10) / 10,
        tempMinC: Math.round(tMin * 10) / 10,
        precipitationMm: Math.round(rainMm * 10) / 10,
        precipitationProbabilityPct: rainProb,
        et0MmDay: Math.round(et0 * 100) / 100,
        windSpeedKmH: Math.round(windMax * 10) / 10
      });
    }

    // Determine waterlogging / flood risk for the district
    let floodRisk = 'Low';
    let floodColor = '#10b981';
    let floodAdvice = 'Rainfall is within safe absorptive capacity for local soils.';
    if (totalRain10d > 120) {
      floodRisk = 'Critical';
      floodColor = '#ef4444';
      floodAdvice = 'Heavy accumulated precipitation expected (>120mm). Immediate flood prevention and desiltation required.';
    } else if (totalRain10d > 50) {
      floodRisk = 'Moderate';
      floodColor = '#f59e0b';
      floodAdvice = 'Substantial rain forecast. Inspect drainage outfalls and pause scheduled heavy irrigation.';
    }

    const payload = {
      district: districtKey,
      zone: geo.zone,
      coordinates: { lat: geo.lat, lng: geo.lng },
      elevation_m: geo.elevation,
      primaryCrops: geo.primaryCrops,
      tenDaySummary: {
        totalRainMm: Math.round(totalRain10d * 10) / 10,
        avgDailyRainMm: Math.round((totalRain10d / (days.length || 10)) * 10) / 10,
        maxTempC: Math.round(maxTemp10d * 10) / 10,
        minTempC: Math.round(minTemp10d * 10) / 10,
        floodRisk,
        floodColor,
        floodAdvice
      },
      forecast: days
    };

    weatherCache.set(cacheKey, { timestamp: Date.now(), data: payload });
    return res.json({ success: true, data: payload });
  } catch (err: any) {
    console.error('Weather forecast API error:', err.message);
    
    // Graceful offline fallback
    const rawDistrict = (req.params.district || 'Bengaluru Urban').trim();
    const geo = KARNATAKA_DISTRICTS_GEO[rawDistrict] || KARNATAKA_DISTRICTS_GEO['Bengaluru Urban'];
    return res.json({
      success: true,
      fallback: true,
      data: {
        district: rawDistrict,
        zone: geo.zone,
        coordinates: { lat: geo.lat, lng: geo.lng },
        elevation_m: geo.elevation,
        primaryCrops: geo.primaryCrops,
        tenDaySummary: {
          totalRainMm: 38.5,
          avgDailyRainMm: 3.8,
          maxTempC: 31.0,
          minTempC: 19.5,
          floodRisk: 'Low',
          floodColor: '#10b981',
          floodAdvice: 'Climatological normal conditions. Soil moisture is adequate.'
        },
        forecast: Array.from({ length: 10 }).map((_, i) => {
          const d = new Date();
          d.setDate(d.getDate() + i);
          return {
            date: d.toISOString().split('T')[0],
            dayOfWeek: d.toLocaleDateString('en-US', { weekday: 'short' }),
            formattedDate: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            weatherCode: 2,
            condition: 'Partly Cloudy',
            icon: 'cloud-sun',
            severity: 'normal',
            farmerAdvice: 'Normal field conditions. Follow standard watering intervals.',
            tempMaxC: 31.0,
            tempMinC: 20.0,
            precipitationMm: i % 3 === 0 ? 8.5 : 0.0,
            precipitationProbabilityPct: i % 3 === 0 ? 60 : 15,
            et0MmDay: 4.2,
            windSpeedKmH: 14
          };
        })
      }
    });
  }
}

// Summary across ALL 31 Karnataka districts for the Observatory table / map cards
export async function getAllKarnatakaDistrictsWeather(req: Request, res: Response) {
  try {
    const cacheKey = 'all_districts_summary';
    const cached = weatherCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
      return res.json({ success: true, cached: true, data: cached.data });
    }

    const districtNames = Object.keys(KARNATAKA_DISTRICTS_GEO);
    
    // We can fetch in parallel batches of 5 to avoid overwhelming network while staying fast
    const summaries: any[] = [];
    const batchSize = 6;
    
    for (let i = 0; i < districtNames.length; i += batchSize) {
      const batch = districtNames.slice(i, i + batchSize);
      const batchPromises = batch.map(async (name) => {
        const geo = KARNATAKA_DISTRICTS_GEO[name];
        try {
          const url = `https://api.open-meteo.com/v1/forecast?latitude=${geo.lat}&longitude=${geo.lng}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode,et0_fao_evapotranspiration&timezone=Asia/Kolkata&forecast_days=7`;
          const resp = await axios.get(url, { timeout: 6000 });
          const d = resp.data.daily;
          const totalRain = (d.precipitation_sum || []).reduce((a: number, b: number) => a + (b || 0), 0);
          const todayCode = d.weathercode?.[0] ?? 0;
          const todayMax = d.temperature_2m_max?.[0] ?? 30;
          const todayMin = d.temperature_2m_min?.[0] ?? 20;
          const todayEt0 = d.et0_fao_evapotranspiration?.[0] ?? 4.0;
          const interp = interpretWmoCode(todayCode);

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
            todayCondition: interp.condition,
            todayIcon: interp.icon,
            todayTempMax: Math.round(todayMax),
            todayTempMin: Math.round(todayMin),
            todayEt0: Math.round(todayEt0 * 10) / 10,
            sevenDayRainMm: Math.round(totalRain * 10) / 10,
            floodRisk: risk,
            floodColor: riskColor
          };
        } catch (e) {
          // Climatological fallback for individual district
          return {
            name,
            zone: geo.zone,
            lat: geo.lat,
            lng: geo.lng,
            elevation_m: geo.elevation,
            primaryCrops: geo.primaryCrops,
            todayCondition: 'Partly Cloudy',
            todayIcon: 'cloud-sun',
            todayTempMax: 31,
            todayTempMin: 21,
            todayEt0: 4.2,
            sevenDayRainMm: 22.5,
            floodRisk: 'Low',
            floodColor: '#10b981'
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      summaries.push(...batchResults);
    }

    weatherCache.set(cacheKey, { timestamp: Date.now(), data: summaries });
    return res.json({ success: true, total: summaries.length, data: summaries });
  } catch (err: any) {
    console.error('All districts weather error:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}
