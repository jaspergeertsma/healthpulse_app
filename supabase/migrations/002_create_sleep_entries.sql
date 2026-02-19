-- ============================================
-- Health Pulse — Sleep Data Schema
-- ============================================

-- Sleep entries from Garmin Connect
CREATE TABLE IF NOT EXISTS sleep_entries (
  id                    BIGSERIAL PRIMARY KEY,
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  calendar_date         DATE NOT NULL,

  -- Core sleep times (stored in seconds from midnight, or as timestamps)
  sleep_start           TIMESTAMPTZ,               -- when sleep started
  sleep_end             TIMESTAMPTZ,                -- when sleep ended
  duration_seconds      INTEGER,                    -- total sleep duration
  
  -- Sleep stages (in seconds)
  deep_sleep_seconds    INTEGER DEFAULT 0,
  light_sleep_seconds   INTEGER DEFAULT 0,
  rem_sleep_seconds     INTEGER DEFAULT 0,
  awake_seconds         INTEGER DEFAULT 0,

  -- Sleep scores (Garmin's scoring system)
  sleep_score           INTEGER,                    -- overall sleep score (0-100)
  quality_score         INTEGER,                    -- sleep quality score
  duration_score        INTEGER,                    -- duration score
  recovery_score        INTEGER,                    -- recovery score
  restfulness_score     INTEGER,                    -- restfulness score

  -- Sleep Coach data
  sleep_need_seconds    INTEGER,                    -- recommended sleep by sleep coach
  sleep_debt_seconds    INTEGER,                    -- accumulated sleep debt

  -- Garmin Body Battery
  body_battery_change   INTEGER,                    -- body battery gained during sleep
  
  -- Additional info
  avg_spo2              NUMERIC(4,1),               -- average SpO2 during sleep
  avg_respiration       NUMERIC(4,1),               -- average respiration rate
  avg_heart_rate        NUMERIC(5,1),               -- average HR during sleep
  lowest_heart_rate     NUMERIC(5,1),               -- lowest HR during sleep
  avg_stress            NUMERIC(4,1),               -- average stress during sleep

  -- Raw data backup
  raw_data              JSONB,                      -- full raw Garmin response
  source                TEXT DEFAULT 'GARMIN',

  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, calendar_date)
);

-- Index for fast date range queries
CREATE INDEX IF NOT EXISTS idx_sleep_entries_user_date
  ON sleep_entries (user_id, calendar_date DESC);

-- ============================================
-- Row Level Security (RLS)
-- ============================================
ALTER TABLE sleep_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own sleep entries"
  ON sleep_entries FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Service role can insert/update (Edge Functions)
-- service_role bypasses RLS by default.

-- Updated_at trigger
CREATE TRIGGER trg_sleep_entries_updated_at
  BEFORE UPDATE ON sleep_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
