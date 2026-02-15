-- ============================================
-- Health Pulse — Database Schema
-- ============================================

-- Weight & Body Composition entries from Garmin Scale
CREATE TABLE IF NOT EXISTS weight_entries (
  id           BIGSERIAL PRIMARY KEY,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  measured_at  DATE NOT NULL,
  weight       NUMERIC(6,2) NOT NULL,        -- weight in kg
  bmi          NUMERIC(4,1),                 -- body mass index
  body_fat     NUMERIC(4,1),                 -- body fat percentage
  muscle_mass  NUMERIC(6,2),                 -- muscle mass in kg
  bone_mass    NUMERIC(5,2),                 -- bone mass in kg
  body_water   NUMERIC(4,1),                 -- body water percentage
  source       TEXT DEFAULT 'GARMIN_INDEX',   -- data source identifier
  raw_data     JSONB,                        -- full raw Garmin response for this entry
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, measured_at)
);

-- Index for fast date range queries
CREATE INDEX IF NOT EXISTS idx_weight_entries_user_date 
  ON weight_entries (user_id, measured_at DESC);

-- User profile / settings
CREATE TABLE IF NOT EXISTS user_profile (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  height_cm    NUMERIC(5,1),                 -- height in cm
  birth_date   DATE,
  gender       TEXT,
  target_weight NUMERIC(6,2),               -- goal weight in kg
  start_weight  NUMERIC(6,2),               -- starting weight in kg
  fasting_start_time TIME DEFAULT '20:00:00',
  fasting_end_time   TIME DEFAULT '12:00:00',
  sleep_target_time  TIME DEFAULT '22:15:00',
  raw_data     JSONB,
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Daily habits tracking (IF & Sleep)
CREATE TABLE IF NOT EXISTS daily_habits (
  id           BIGSERIAL PRIMARY KEY,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date         DATE NOT NULL,
  fasting_met  BOOLEAN DEFAULT false,
  sleep_met    BOOLEAN DEFAULT false,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Index for habit history
CREATE INDEX IF NOT EXISTS idx_daily_habits_user_date 
  ON daily_habits (user_id, date DESC);

-- Sync log to track Garmin sync history
CREATE TABLE IF NOT EXISTS sync_log (
  id           BIGSERIAL PRIMARY KEY,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  synced_at    TIMESTAMPTZ DEFAULT NOW(),
  status       TEXT NOT NULL,                -- 'success', 'error', 'partial'
  entries_synced INTEGER DEFAULT 0,
  error_message TEXT,
  duration_ms  INTEGER
);

CREATE INDEX IF NOT EXISTS idx_sync_log_user_date
  ON sync_log (user_id, synced_at DESC);

-- ============================================
-- Row Level Security (RLS)
-- ============================================
ALTER TABLE weight_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_habits ENABLE ROW LEVEL SECURITY;

-- Authenticated users can only read their own data
CREATE POLICY "Users can read own weight entries"
  ON weight_entries FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can read own profile"
  ON user_profile FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can read own sync log"
  ON sync_log FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can read own habits"
  ON daily_habits FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Service role (Edge Functions) can insert/update all rows
-- service_role bypasses RLS by default, so no explicit policies needed.
-- But we add these for the authenticated user to update their own profile:
CREATE POLICY "Users can update own profile"
  ON user_profile FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profile FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own habits"
  ON daily_habits FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own habits"
  ON daily_habits FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- Updated_at trigger
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_weight_entries_updated_at
  BEFORE UPDATE ON weight_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_user_profile_updated_at
  BEFORE UPDATE ON user_profile
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
