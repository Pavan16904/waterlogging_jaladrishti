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

CREATE TABLE IF NOT EXISTS incidents (
    id VARCHAR(64) PRIMARY KEY,
    district_id VARCHAR(64) NOT NULL,
    district_name VARCHAR(128) NOT NULL,
    reporter_name VARCHAR(128) NOT NULL,
    reporter_phone VARCHAR(32) NOT NULL,
    landmark TEXT NOT NULL,
    water_depth VARCHAR(64) NOT NULL,
    urgency VARCHAR(32) NOT NULL,
    status VARCHAR(64) NOT NULL DEFAULT 'SUBMITTED_UNVERIFIED',
    assigned_agency VARCHAR(128) DEFAULT 'BBMP / KSDMA Monsoon Control',
    recommended_action TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS risk_model_runs (
    run_id VARCHAR(64) PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    weights_version VARCHAR(32) NOT NULL,
    config_hash VARCHAR(64) NOT NULL,
    input_status JSONB NOT NULL,
    row_count INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS waterlog_hex_scores (
    h3_index VARCHAR(20) NOT NULL,
    resolution INTEGER NOT NULL,
    district_id VARCHAR(50) NOT NULL,
    valid_time TIMESTAMP WITH TIME ZONE NOT NULL,
    fetched_at TIMESTAMP WITH TIME ZONE NOT NULL,
    risk_score REAL NOT NULL,
    risk_class VARCHAR(20) NOT NULL,
    confidence REAL NOT NULL,
    components JSONB NOT NULL,
    source VARCHAR(100) NOT NULL,
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    run_id VARCHAR(64),
    PRIMARY KEY (h3_index, valid_time)
);

CREATE INDEX IF NOT EXISTS idx_waterlog_hex_res_valid ON waterlog_hex_scores (resolution, valid_time);
CREATE INDEX IF NOT EXISTS idx_waterlog_hex_district_valid ON waterlog_hex_scores (district_id, valid_time);
CREATE INDEX IF NOT EXISTS idx_waterlog_hex_lat_lng ON waterlog_hex_scores (lat, lng);
CREATE INDEX IF NOT EXISTS idx_waterlog_hex_run_id ON waterlog_hex_scores (run_id);

-- Phase 1 Live Data Pipeline & Cache Tables
CREATE TABLE IF NOT EXISTS district_hexes (
    h3_index VARCHAR(20) PRIMARY KEY,
    district_id VARCHAR(64) NOT NULL,
    district_name VARCHAR(128) NOT NULL,
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    resolution INTEGER NOT NULL DEFAULT 7,
    slope_deg REAL,
    twi REAL,
    drainage_proxy REAL,
    water_holding_capacity REAL,
    land_cover VARCHAR(64),
    is_cropland BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_district_hexes_dist ON district_hexes (district_id);
CREATE INDEX IF NOT EXISTS idx_district_hexes_coords ON district_hexes (lat, lng);

CREATE TABLE IF NOT EXISTS weather_snapshots (
    id SERIAL PRIMARY KEY,
    district_id VARCHAR(64) NOT NULL,
    fetched_at TIMESTAMP WITH TIME ZONE NOT NULL,
    model_valid_time TIMESTAMP WITH TIME ZONE,
    source VARCHAR(100) NOT NULL DEFAULT 'open-meteo',
    payload JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_weather_snapshots_dist_time ON weather_snapshots (district_id, fetched_at DESC);

CREATE TABLE IF NOT EXISTS observed_rainfall (
    id SERIAL PRIMARY KEY,
    district_id VARCHAR(64) NOT NULL,
    fetched_at TIMESTAMP WITH TIME ZONE NOT NULL,
    observed_at TIMESTAMP WITH TIME ZONE NOT NULL,
    rainfall_mm REAL NOT NULL,
    source VARCHAR(100) NOT NULL,
    label VARCHAR(100) NOT NULL,
    metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_observed_rainfall_dist_time ON observed_rainfall (district_id, observed_at DESC);

CREATE TABLE IF NOT EXISTS river_levels (
    id SERIAL PRIMARY KEY,
    station_id VARCHAR(64) NOT NULL,
    station_name VARCHAR(128) NOT NULL,
    river_name VARCHAR(128) NOT NULL,
    basin VARCHAR(128) NOT NULL,
    district_id VARCHAR(64) NOT NULL,
    water_level_m REAL NOT NULL,
    danger_level_m REAL,
    warning_level_m REAL,
    observed_at TIMESTAMP WITH TIME ZONE NOT NULL,
    fetched_at TIMESTAMP WITH TIME ZONE NOT NULL,
    source VARCHAR(100) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_river_levels_station ON river_levels (station_id, observed_at DESC);
CREATE INDEX IF NOT EXISTS idx_river_levels_district ON river_levels (district_id);

CREATE TABLE IF NOT EXISTS flood_extent (
    id SERIAL PRIMARY KEY,
    district_id VARCHAR(64) NOT NULL,
    acquired_at TIMESTAMP WITH TIME ZONE NOT NULL,
    geom JSONB NOT NULL,
    source VARCHAR(100) NOT NULL DEFAULT 'Sentinel-1 SAR (Copernicus CDSE)',
    revisit_label VARCHAR(100) NOT NULL DEFAULT 'satellite revisit ~6-12 days (not live)',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_flood_extent_dist ON flood_extent (district_id, acquired_at DESC);

CREATE TABLE IF NOT EXISTS sensor_readings (
    id SERIAL PRIMARY KEY,
    device_id VARCHAR(64) NOT NULL,
    ts TIMESTAMP WITH TIME ZONE NOT NULL,
    value REAL NOT NULL,
    battery REAL,
    lat REAL NOT NULL,
    lon REAL NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sensor_readings_device_ts ON sensor_readings (device_id, ts DESC);



