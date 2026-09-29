export interface StudyArea {
  id: string;
  name: string;
  state_region: string;
  country: string;
  description: string;
  center_lat: number;
  center_lng: number;
  zoom_level: number;
  bounds_geojson?: any;
}

export interface SeverityZone {
  id: string;
  zone_name: string;
  severity: 'Low' | 'Moderate' | 'Severe';
  probability: number;
  elevation_m: number;
  slope_deg: number;
  land_use: string;
  area_ha: number;
  is_persistent: boolean;
  ndwi?: number;
  mndwi?: number;
  ndvi?: number;
  vv_db?: number;
  vh_db?: number;
  geojson_feature: {
    type: string;
    geometry: {
      type: string;
      coordinates: number[][][];
    };
    properties?: any;
  };
}

export interface DrainageAdvisory {
  id: string;
  analysis_run_id?: string;
  zone_id?: string;
  zone_name: string;
  priority: string;
  urgency_score: number;
  title?: string;
  action_headline?: string;
  diagnosis?: string;
  action_recommendation?: string;
  primary_intervention?: string;
  estimated_volume_m3?: number;
  mitigation_actions?: any;
  equipment_required?: string[];
  timeline?: string;
  agency?: string;
  estimated_cost_inr?: string;
  status?: string;
  severity?: string;
  elevation_m?: number;
  slope_deg?: number;
  land_use?: string;
  area_ha?: number;
  probability?: number;
}

export interface AnalysisRun {
  id: string;
  study_area_id: string;
  model_type: string;
  pre_event_date: string;
  post_event_date: string;
  rainfall_mm: number;
  total_area_km2: number;
  waterlogged_area_km2: number;
  waterlogged_percentage: number;
  severe_count: number;
  moderate_count: number;
  low_count: number;
  created_at: string;
}

export interface FAO56IrrigationResult {
  crop: string;
  crop_category?: string;
  district_name?: string;
  growth_stage: string;
  days_since_planting: number;
  soil_type: string;
  soil_description: string;
  et0_reference_mm_day: number;
  crop_coefficient_kc: number;
  etc_crop_water_need_mm_day: number;
  effective_rainfall_mm: number;
  taw_total_available_water_mm: number;
  raw_readily_available_water_mm: number;
  current_depletion_mm: number;
  depletion_percentage_raw: number;
  depletion_percentage_taw: number;
  needs_irrigation: boolean;
  irrigation_status: string;
  urgency_color: string;
  recommended_net_mm: number;
  recommended_gross_mm: number;
  required_water_volume_m3: number;
  field_area_ha: number;
  advisory_summary: string;
  forecast_7day: Array<{
    day: string;
    forecast_etc_mm: number;
    projected_depletion_mm: number;
    threshold_raw_mm: number;
    irrigate_flag: boolean;
  }>;
}

export interface ModelMetrics {
  timestamp: string;
  dataset: string;
  total_samples: number;
  train_samples: number;
  test_samples: number;
  primary_model_rf: {
    model_name: string;
    accuracy: number;
    precision: number;
    recall: number;
    f1_score: number;
    roc_auc: number;
    confusion_matrix: {
      true_positive: number;
      false_positive: number;
      true_negative: number;
      false_negative: number;
    };
    feature_importances: Array<{ feature: string; importance: number }>;
    roc_curve: Array<{ fpr: number; tpr: number }>;
  };
  comparison_model_xgb: {
    model_name: string;
    accuracy: number;
    precision: number;
    recall: number;
    f1_score: number;
    roc_auc: number;
    confusion_matrix: {
      true_positive: number;
      false_positive: number;
      true_negative: number;
      false_negative: number;
    };
    roc_curve: Array<{ fpr: number; tpr: number }>;
  };
  ablation_study: Array<{
    configuration: string;
    features_used: string[];
    feature_count: number;
    accuracy: number;
    precision: number;
    recall: number;
    f1_score: number;
    roc_auc: number;
  }>;
}

export interface IoTSensor {
  id: string;
  name: string;
  districtId: string;
  districtName: string;
  lat: number;
  lng: number;
  sensorType: 'ultrasonic_level' | 'hydrostatic_pressure' | 'radar_velocity' | 'swale_optical';
  currentDepthM: number;
  warningThresholdM: number;
  dangerThresholdM: number;
  maxDepthM: number;
  flowRateLps: number;
  siltationPct: number;
  pumpStatus: 'AUTO_IDLE' | 'AUTO_RUNNING' | 'MANUAL_ON' | 'MANUAL_OFF' | 'EMERGENCY_BOOST';
  pumpCapacityHp: number;
  pumpDischargeLps: number;
  batteryPct: number;
  solarWatts: number;
  signalDbm: number;
  trend: 'rising' | 'falling' | 'stable';
  history: Array<{ time: string; depthM: number; flowLps: number }>;
  lastUpdated: string;
}

export interface RadarMeta {
  provider: string;
  host: string;
  pastFrames: Array<{ time: number; path: string }>;
  nowcastFrames: Array<{ time: number; path: string }>;
  satelliteFrames: Array<{ time: number; path: string }>;
  colorScheme: number;
  smooth: number;
  snow: number;
  lastUpdated: string;
}

export interface LiveAlert {
  id: string;
  level: 'CRITICAL' | 'WARNING' | 'ADVISORY' | 'INFO';
  district: string;
  title: string;
  message: string;
  action: string;
  agency: string;
  timestamp: string;
}

export interface RealtimeNowcast {
  district: string;
  coordinates: { lat: number; lng: number };
  zone: string;
  telemetry: {
    currentRainRateMmH: number;
    currentTempC: number;
    currentHumidityPct: number;
    currentWindSpeedKmh: number;
    simulatedInflowM3H: number;
    riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
    radarReflectivityDbz: number;
    evapotranspirationEt0MmDay: number;
  };
  nowcastAdvice: string;
  timestamp: string;
}
