-- Migration 004: Real drainage network geometry + pipeline condition tracking
-- Source: OpenCity.in Karnataka Drainage Map (Public Domain) + BBMP Stormwater Drains (Public Domain)

CREATE TABLE IF NOT EXISTS drainage_lines (
    id                VARCHAR(80)  PRIMARY KEY,          -- deterministic: src_resource_id + feature index
    district_id       VARCHAR(64)  NOT NULL,
    drain_name        VARCHAR(255),
    drain_type        VARCHAR(64)  NOT NULL DEFAULT 'Unknown', -- Primary / Secondary / Tertiary / Other / Unknown
    geometry_geojson  TEXT         NOT NULL,             -- GeoJSON LineString or MultiLineString
    source_url        TEXT         NOT NULL,
    source_dataset    VARCHAR(255) NOT NULL,
    source_org        VARCHAR(255) NOT NULL DEFAULT 'OpenCity.in / Government of Karnataka',
    source_license    VARCHAR(64)  NOT NULL DEFAULT 'Public Domain',
    dataset_date      VARCHAR(32),
    kml_name          TEXT,                              -- original <name> from KML
    kml_description   TEXT,                              -- original <description> from KML
    length_km         REAL,
    import_batch      VARCHAR(64)  NOT NULL,             -- ISO timestamp of import run
    created_at        TEXT         NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_dl_district ON drainage_lines (district_id);

-- Pipeline condition reports — separate from verified incidents
-- A citizen report never auto-confirms a blockage.
CREATE TABLE IF NOT EXISTS drain_condition_reports (
    id              VARCHAR(64)  PRIMARY KEY,
    drain_id        VARCHAR(80)  REFERENCES drainage_lines(id) ON DELETE CASCADE,
    district_id     VARCHAR(64)  NOT NULL,
    -- Status vocabulary (see requirements):
    -- unknown_inspection_needed | reported_blockage | verified_blockage
    -- verified_functional | possible_overflow_risk | verified_overflow
    -- damaged | under_maintenance | resolved
    condition_status VARCHAR(64) NOT NULL DEFAULT 'unknown_inspection_needed',
    is_verified      INTEGER     NOT NULL DEFAULT 0,     -- 0=citizen report, 1=inspector verified
    reporter_name    VARCHAR(128),
    reporter_type    VARCHAR(32) NOT NULL DEFAULT 'citizen', -- citizen | inspector | system
    report_notes     TEXT,
    inspection_notes TEXT,
    inspector_name   VARCHAR(128),
    photo_url        TEXT,
    lat              REAL,
    lng              REAL,
    reported_at      TEXT NOT NULL DEFAULT (datetime('now')),
    verified_at      TEXT,
    resolved_at      TEXT,
    created_at       TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at       TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_dcr_drain ON drain_condition_reports (drain_id);
CREATE INDEX IF NOT EXISTS idx_dcr_district ON drain_condition_reports (district_id);
CREATE INDEX IF NOT EXISTS idx_dcr_status ON drain_condition_reports (condition_status);
