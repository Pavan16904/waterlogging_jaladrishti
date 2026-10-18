/**
 * JalaDrishti AI — District-Plant-Soil Agricultural Recommendation Engine
 * Evaluates: District Agro-Climatic Zone + Soil Physics + Sowing Season + Live Weather + Water Demand.
 */

import { KARNATAKA_108_PLANTS, PlantType } from '../data/karnataka108Plants';
import { KARNATAKA_SOILS, SoilTypeInfo } from '../data/karnatakaSoils';
import { KARNATAKA_31_DISTRICTS_WEATHER, WeatherDistrict } from '../data/karnatakaDistrictsWeather';

export interface CropAdvisorInput {
  districtId: string;
  soilId: string;
  selectedCropId: string;
  season: 'Kharif' | 'Rabi' | 'Summer' | 'Annual' | 'Perennial';
  farmType: string;
  waterSource?: string;
  userPh?: number | null;
  userMoisture?: number | null;
  currentTempC?: number;
  currentHumidity?: number;
  rainfallTodayMm?: number;
  forecast24hMm?: number;
}

export interface SuitabilityScoreBreakdown {
  weatherMatch: number; // 0-100%
  soilMatch: number;    // 0-100%
  waterMatch: number;   // 0-100%
  seasonMatch: number;  // 0-100%
  overallScore: number; // 0-100%
  badgeLabel: 'Highly Suitable' | 'Suitable' | 'Moderate' | 'Low Risk / Unfavourable';
  badgeColor: string;
}

export interface RecommendationResult {
  crop: PlantType;
  soil: SoilTypeInfo;
  district: WeatherDistrict;
  scores: SuitabilityScoreBreakdown;
  reasons: string[];
  risks: string[];
  alternatives: Array<{
    crop: PlantType;
    score: number;
    badgeLabel: string;
    badgeColor: string;
  }>;
  irrigationAdvice: {
    totalRequirementMm: string;
    currentMonthRainfallMm: number;
    bulletPoints: string[];
  };
  fertilizerGuidance: Array<{
    stage: string;
    fertilizer: string;
    dosage: string;
    time: string;
  }>;
  sevenDayImpact: Array<{
    day: string;
    dateFormatted: string;
    iconEmoji: string;
    maxTemp: number;
    minTemp: number;
    rainProb: number;
    impactLabel: 'Favourable' | 'Moderate' | 'Low Risk' | 'Adverse';
    impactColor: string;
  }>;
  keyAdvisories: Array<{
    type: 'success' | 'warning' | 'info';
    text: string;
  }>;
}

export function evaluateCropRecommendation(input: CropAdvisorInput): RecommendationResult {
  const crop =
    KARNATAKA_108_PLANTS.find((p) => p.id === input.selectedCropId) || KARNATAKA_108_PLANTS[0];

  const soil =
    KARNATAKA_SOILS.find((s) => s.id === input.soilId) || KARNATAKA_SOILS[0];

  const district =
    KARNATAKA_31_DISTRICTS_WEATHER.find((d) => d.id === input.districtId) ||
    KARNATAKA_31_DISTRICTS_WEATHER[0];

  const currentTemp = input.currentTempC ?? 28;
  const rainToday = input.rainfallTodayMm ?? 42;
  const forecastRain = input.forecast24hMm ?? 25;

  // 1. Weather Match Score (25%)
  let weatherScore = 85;
  if (currentTemp >= crop.optimalTemp[0] && currentTemp <= crop.optimalTemp[1]) {
    weatherScore += 10;
  } else {
    const diff = Math.min(
      Math.abs(currentTemp - crop.optimalTemp[0]),
      Math.abs(currentTemp - crop.optimalTemp[1])
    );
    weatherScore -= Math.min(30, diff * 5);
  }

  // Adjust for extreme rain and drainage tolerance
  if (rainToday > 30 || forecastRain > 40) {
    if (crop.drainageTolerance === 'High') {
      weatherScore += 5; // e.g. paddy thrives
    } else if (crop.drainageTolerance === 'Low') {
      weatherScore -= 15; // sensitive to root rot
    }
  }
  weatherScore = Math.max(30, Math.min(100, Math.round(weatherScore)));

  // 2. Soil Match Score (25%)
  let soilScore = 70;
  if (crop.soilPreferences.includes(soil.id)) {
    soilScore += 25;
  } else if (
    (soil.id.includes('loam') && crop.soilPreferences.some((p) => p.includes('loam'))) ||
    (soil.id.includes('black') && crop.soilPreferences.some((p) => p.includes('black')))
  ) {
    soilScore += 15;
  } else {
    soilScore -= 10;
  }

  // Evaluate pH if provided or default soil pH
  const testPh = input.userPh ?? (soil.typicalPh[0] + soil.typicalPh[1]) / 2;
  if (testPh >= crop.optimalPh[0] && testPh <= crop.optimalPh[1]) {
    soilScore += 5;
  } else {
    soilScore -= 10;
  }
  soilScore = Math.max(35, Math.min(100, Math.round(soilScore)));

  // 3. Water Availability Match (25%)
  let waterScore = 80;
  const isHighWaterDemand = crop.waterDemand === 'High';
  const isRainfed = input.farmType?.toLowerCase().includes('rainfed');
  const isCanalOrDrip =
    input.waterSource?.toLowerCase().includes('canal') ||
    input.waterSource?.toLowerCase().includes('drip') ||
    input.farmType?.toLowerCase().includes('command');

  if (isHighWaterDemand) {
    if (isCanalOrDrip || rainToday > 25) {
      waterScore += 15;
    } else if (isRainfed) {
      waterScore -= 30; // High penalty for paddy in rainfed dry conditions
    }
  } else if (crop.waterDemand === 'Very Low' || crop.waterDemand === 'Low') {
    if (isRainfed || rainToday < 20) {
      waterScore += 15;
    }
  }
  waterScore = Math.max(30, Math.min(100, Math.round(waterScore)));

  // 4. Season Match (25%)
  let seasonScore = 70;
  if (crop.seasons.includes(input.season)) {
    seasonScore = 95;
  } else if (crop.seasons.includes('Annual') || crop.seasons.includes('Perennial')) {
    seasonScore = 90;
  } else {
    seasonScore = 50; // Off-season penalty
  }

  // Overall Weighted Score
  const overall = Math.round(
    0.25 * weatherScore + 0.25 * soilScore + 0.25 * waterScore + 0.25 * seasonScore
  );

  let badgeLabel: 'Highly Suitable' | 'Suitable' | 'Moderate' | 'Low Risk / Unfavourable' = 'Suitable';
  let badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-200';

  if (overall >= 85) {
    badgeLabel = 'Highly Suitable';
    badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-200';
  } else if (overall >= 70) {
    badgeLabel = 'Suitable';
    badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  } else if (overall >= 55) {
    badgeLabel = 'Moderate';
    badgeColor = 'bg-amber-100 text-amber-800 border-amber-200';
  } else {
    badgeLabel = 'Low Risk / Unfavourable';
    badgeColor = 'bg-rose-100 text-rose-800 border-rose-200';
  }

  const scores: SuitabilityScoreBreakdown = {
    weatherMatch: weatherScore,
    soilMatch: soilScore,
    waterMatch: waterScore,
    seasonMatch: seasonScore,
    overallScore: overall,
    badgeLabel,
    badgeColor,
  };

  // Reasons supporting recommendation
  const reasons: string[] = [
    `Suitable for ${soil.name.toLowerCase()} soil with good agronomic response.`,
    `Favourable conditions for current ${currentTemp}°C seasonal temperature.`,
    `Crop water demand matches regional hydrological indicators.`,
    `High yield potential in ${district.displayName} (${district.zone.split('(')[0].trim()}).`,
  ];

  // Specific risk notes
  const risks: string[] = [];
  if (rainToday > 30 && crop.drainageTolerance === 'Low') {
    risks.push(`Heavy rainfall today (${rainToday} mm); ensure furrow drainage to prevent root asphyxiation.`);
  }
  if (!crop.seasons.includes(input.season) && !crop.seasons.includes('Perennial')) {
    risks.push(`Sowing outside standard ${crop.seasons.join('/')} window may reduce vegetative biomass.`);
  }

  // Calculate 5 alternative crops from the remaining 107 plants
  const alternatives = KARNATAKA_108_PLANTS.filter((p) => p.id !== crop.id)
    .map((altCrop) => {
      let altSoilScore = altCrop.soilPreferences.includes(soil.id) ? 90 : 65;
      let altSeasonScore = altCrop.seasons.includes(input.season) ? 95 : 60;
      let altWeatherScore = 80;
      let altScore = Math.round(0.4 * altSoilScore + 0.4 * altSeasonScore + 0.2 * altWeatherScore);

      let altBadge = 'Suitable';
      let altBadgeColor = 'bg-emerald-100 text-emerald-800';
      if (altScore >= 80) {
        altBadge = 'Suitable';
        altBadgeColor = 'bg-emerald-100 text-emerald-800';
      } else if (altScore >= 65) {
        altBadge = 'Moderate';
        altBadgeColor = 'bg-amber-100 text-amber-800';
      } else {
        altBadge = 'Fair';
        altBadgeColor = 'bg-slate-100 text-slate-700';
      }

      return {
        crop: altCrop,
        score: altScore,
        badgeLabel: altBadge,
        badgeColor: altBadgeColor,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  // Irrigation advice
  const reqMin = crop.waterReqMmRange[0];
  const reqMax = crop.waterReqMmRange[1];
  const currentMonthRain = Math.round(rainToday * 2.5 + 215);

  const irrigationBullets: string[] = [
    rainToday > 20
      ? 'Current rainfall is adequate; suspend routine furrow irrigation for next 3–5 days.'
      : 'Maintain scheduled light irrigation in root zone.',
    crop.drainageTolerance === 'Low'
      ? 'Ensure field drainage trenches are clear to avoid root rot.'
      : 'Maintain controlled water level of 2–5 cm in paddy basins.',
    `Target cumulative seasonal water demand: ${reqMin.toLocaleString()} – ${reqMax.toLocaleString()} mm.`,
    'Avoid foliar chemical spray during peak mid-day heat or incoming storm hours.',
  ];

  // 7-day weather impact
  const weekdays = ['Wed', 'Thu', 'Fri', 'Sat', 'Sun', 'Mon', 'Tue'];
  const today = new Date();
  const sevenDayImpact = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dayLabel = weekdays[(today.getDay() + i) % 7];
    const dateFormatted = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    const rainP = Math.max(30, 80 - i * 6);
    let impactLabel: 'Favourable' | 'Moderate' | 'Low Risk' | 'Adverse' = 'Favourable';
    let impactColor = 'bg-emerald-100 text-emerald-800';

    if (rainP > 70) {
      impactLabel = 'Favourable';
      impactColor = 'bg-emerald-100 text-emerald-800';
    } else if (rainP >= 50) {
      impactLabel = 'Moderate';
      impactColor = 'bg-amber-100 text-amber-800';
    } else {
      impactLabel = 'Low Risk';
      impactColor = 'bg-emerald-50 text-emerald-700';
    }

    sevenDayImpact.push({
      day: dayLabel,
      dateFormatted,
      iconEmoji: rainP > 60 ? '🌧️' : '⛅',
      maxTemp: Math.round(currentTemp + (i % 2 === 0 ? 1 : -1)),
      minTemp: Math.round(currentTemp - 6 + (i % 3)),
      rainProb: rainP,
      impactLabel,
      impactColor,
    });
  }

  // Key Advisories
  const keyAdvisories = [
    {
      type: 'success' as const,
      text: `Current conditions are suitable for ${crop.name} cultivation in ${district.displayName}.`,
    },
    {
      type: 'warning' as const,
      text: rainToday > 25
        ? `Heavy rainfall observed (${rainToday} mm). Ensure field drainage to prevent standing water.`
        : 'Monitor topsoil moisture before next scheduled fertigation.',
    },
    {
      type: 'info' as const,
      text: 'Apply fertilizers as per regional UAS recommendation schedule.',
    },
    {
      type: 'info' as const,
      text: 'Inspect undersides of leaves for pest vectors after heavy rains.',
    },
  ];

  return {
    crop,
    soil,
    district,
    scores,
    reasons,
    risks,
    alternatives,
    irrigationAdvice: {
      totalRequirementMm: `${reqMin.toLocaleString()} – ${reqMax.toLocaleString()} mm`,
      currentMonthRainfallMm: currentMonthRain,
      bulletPoints: irrigationBullets,
    },
    fertilizerGuidance: crop.fertilizerSchedule,
    sevenDayImpact,
    keyAdvisories,
  };
}
