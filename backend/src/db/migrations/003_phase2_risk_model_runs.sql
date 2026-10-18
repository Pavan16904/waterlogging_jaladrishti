-- Migration 003: Phase 2 Risk Model Runs and waterlog_hex_scores run_id reference
CREATE TABLE IF NOT EXISTS risk_model_runs (
    run_id VARCHAR(64) PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    weights_version VARCHAR(32) NOT NULL,
    config_hash VARCHAR(64) NOT NULL,
    input_status JSONB NOT NULL,
    row_count INTEGER NOT NULL DEFAULT 0
);

-- Ensure run_id exists on waterlog_hex_scores
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='waterlog_hex_scores' AND column_name='run_id'
    ) THEN 
        ALTER TABLE waterlog_hex_scores ADD COLUMN run_id VARCHAR(64);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_waterlog_hex_run_id ON waterlog_hex_scores (run_id);
