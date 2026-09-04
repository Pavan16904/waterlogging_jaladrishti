-- JalaDrishti AI - Earth Observation Flood Intelligence Platform
-- PostgreSQL Database Schema

CREATE TABLE IF NOT EXISTS study_areas (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    state_region VARCHAR(128) NOT NULL,
    country VARCHAR(64) NOT NULL DEFAULT 'India',
    description TEXT,
    center_lat DOUBLE PRECISION NOT NULL,
    center_lng DOUBLE PRECISION NOT NULL,
    zoom_level INTEGER NOT NULL DEFAULT 13,
    bounds_geojson JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS satellite_scenes (
    id VARCHAR(64) PRIMARY KEY,
    study_area_id VARCHAR(64) REFERENCES study_areas(id) ON DELETE CASCADE,
    event_name VARCHAR(255) NOT NULL,
    acquisition_date VARCHAR(32) NOT NULL,
    sensor_type VARCHAR(64) NOT NULL, -- Sentinel-1 SAR, Sentinel-2 Optical
    cloud_cover_pct DOUBLE PRECISION DEFAULT 0.0,
    rainfall_mm DOUBLE PRECISION DEFAULT 0.0,
    is_post_event BOOLEAN DEFAULT false,
    raw_bands_meta JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS analysis_runs (
    id VARCHAR(64) PRIMARY KEY,
    study_area_id VARCHAR(64) REFERENCES study_areas(id) ON DELETE CASCADE,
    model_type VARCHAR(64) NOT NULL DEFAULT 'random_forest',
    pre_event_date VARCHAR(32) NOT NULL,
    post_event_date VARCHAR(32) NOT NULL,
    rainfall_mm DOUBLE PRECISION NOT NULL DEFAULT 45.0,
    total_area_km2 DOUBLE PRECISION NOT NULL,
    waterlogged_area_km2 DOUBLE PRECISION NOT NULL,
    waterlogged_percentage DOUBLE PRECISION NOT NULL,
    severe_count INTEGER NOT NULL DEFAULT 0,
    moderate_count INTEGER NOT NULL DEFAULT 0,
    low_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS severity_zones (
    id VARCHAR(64) PRIMARY KEY,
    analysis_run_id VARCHAR(64) REFERENCES analysis_runs(id) ON DELETE CASCADE,
    zone_name VARCHAR(255) NOT NULL,
    severity VARCHAR(32) NOT NULL, -- 'Low', 'Moderate', 'Severe'
    probability DOUBLE PRECISION NOT NULL,
    elevation_m DOUBLE PRECISION NOT NULL,
    slope_deg DOUBLE PRECISION NOT NULL,
    land_use VARCHAR(64) NOT NULL,
    area_ha DOUBLE PRECISION NOT NULL,
    is_persistent BOOLEAN DEFAULT false,
    ndwi DOUBLE PRECISION,
    mndwi DOUBLE PRECISION,
    ndvi DOUBLE PRECISION,
    vv_db DOUBLE PRECISION,
    vh_db DOUBLE PRECISION,
    geojson_feature JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS drainage_advisories (
    id VARCHAR(64) PRIMARY KEY,
    analysis_run_id VARCHAR(64) REFERENCES analysis_runs(id) ON DELETE CASCADE,
    zone_id VARCHAR(64) REFERENCES severity_zones(id) ON DELETE CASCADE,
    zone_name VARCHAR(255) NOT NULL,
    priority VARCHAR(64) NOT NULL,
    urgency_score INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    diagnosis TEXT NOT NULL,
    action_recommendation TEXT NOT NULL,
    estimated_volume_m3 DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    mitigation_actions JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS irrigation_advisories (
    id VARCHAR(64) PRIMARY KEY,
    crop_name VARCHAR(128) NOT NULL,
    growth_stage VARCHAR(128) NOT NULL,
    soil_type VARCHAR(64) NOT NULL,
    days_since_planting INTEGER NOT NULL,
    et0_mm_day DOUBLE PRECISION NOT NULL,
    crop_coefficient_kc DOUBLE PRECISION NOT NULL,
    etc_mm_day DOUBLE PRECISION NOT NULL,
    taw_mm DOUBLE PRECISION NOT NULL,
    raw_mm DOUBLE PRECISION NOT NULL,
    current_depletion_mm DOUBLE PRECISION NOT NULL,
    status VARCHAR(64) NOT NULL,
    recommended_gross_mm DOUBLE PRECISION NOT NULL,
    water_volume_m3 DOUBLE PRECISION NOT NULL,
    field_area_ha DOUBLE PRECISION NOT NULL,
    advisory_summary TEXT NOT NULL,
    forecast_payload JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS model_evaluations (
    id VARCHAR(64) PRIMARY KEY,
    model_name VARCHAR(128) NOT NULL,
    accuracy DOUBLE PRECISION NOT NULL,
    precision_val DOUBLE PRECISION NOT NULL,
    recall_val DOUBLE PRECISION NOT NULL,
    f1_score DOUBLE PRECISION NOT NULL,
    roc_auc DOUBLE PRECISION NOT NULL,
    metrics_payload JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
