-- Migration 001: Create waterlog_hex_scores table and performance indexes
CREATE TABLE IF NOT EXISTS waterlog_hex_scores (
  h3_index VARCHAR(20) NOT NULL,
  resolution INTEGER NOT NULL,
  district_id VARCHAR(50) NOT NULL,
  valid_time TIMESTAMPTZ NOT NULL,
  fetched_at TIMESTAMPTZ NOT NULL,
  risk_score REAL NOT NULL,
  risk_class VARCHAR(20) NOT NULL,
  confidence REAL NOT NULL,
  components JSONB NOT NULL,
  source VARCHAR(100) NOT NULL,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  PRIMARY KEY (h3_index, valid_time)
);

CREATE INDEX IF NOT EXISTS idx_waterlog_hex_res_valid ON waterlog_hex_scores (resolution, valid_time);
CREATE INDEX IF NOT EXISTS idx_waterlog_hex_district_valid ON waterlog_hex_scores (district_id, valid_time);
CREATE INDEX IF NOT EXISTS idx_waterlog_hex_lat_lng ON waterlog_hex_scores (lat, lng);
