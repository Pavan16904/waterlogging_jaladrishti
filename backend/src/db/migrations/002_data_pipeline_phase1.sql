-- Migration 002: Live Data Pipeline & Cache Schema for all 31 Karnataka Districts
-- Supporting PostgreSQL 18 with PostGIS & SQLite dual-mode execution

-- 1. District H3 Resolution 7 Hexagonal Spatial Partitioning
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

-- 2. NWP Numerical Weather Forecast Snapshots (Open-Meteo)
CREATE TABLE IF NOT EXISTS weather_snapshots (
    id SERIAL PRIMARY KEY,
    district_id VARCHAR(64) NOT NULL,
    fetched_at TIMESTAMP WITH TIME ZONE NOT NULL,
    model_valid_time TIMESTAMP WITH TIME ZONE,
    source VARCHAR(100) NOT NULL DEFAULT 'open-meteo',
    payload JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_weather_snapshots_dist_time ON weather_snapshots (district_id, fetched_at DESC);

-- 3. Telemetry and Satellite Observed Rainfall (NASA GPM IMERG, KSNDMC, IMD)
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

-- 4. River Stage & Inundation Gauges (India-WRIS / CWC Tungabhadra)
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

-- 5. Earth Observation Satellite Flood Extent (Copernicus CDSE Sentinel-1 SAR)
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

-- 6. In-Situ IoT Sensor Network Stream (MQTT Subscriber)
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
