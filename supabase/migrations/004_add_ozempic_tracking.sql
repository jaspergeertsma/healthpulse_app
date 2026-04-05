-- ============================================
-- Ozempic / GLP-1 Medication Tracking
-- ============================================

-- Medication log table for injection tracking
CREATE TABLE medication_log (
  id             BIGSERIAL PRIMARY KEY,
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date           DATE NOT NULL,
  medication     TEXT NOT NULL DEFAULT 'ozempic',
  dose_mg        NUMERIC(4,2) NOT NULL,
  injection_site TEXT,
  notes          TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date, medication)
);

CREATE INDEX idx_medication_log_user_date ON medication_log (user_id, date DESC);

-- Extend user_profile with Ozempic settings
ALTER TABLE user_profile ADD COLUMN IF NOT EXISTS ozempic_start_date DATE;
ALTER TABLE user_profile ADD COLUMN IF NOT EXISTS current_dose_mg NUMERIC(4,2);
ALTER TABLE user_profile ADD COLUMN IF NOT EXISTS injection_day SMALLINT;

-- ============================================
-- Row Level Security
-- ============================================
ALTER TABLE medication_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own medication log"
  ON medication_log FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own medication log"
  ON medication_log FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own medication log"
  ON medication_log FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own medication log"
  ON medication_log FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Updated_at trigger
CREATE TRIGGER trg_medication_log_updated_at
  BEFORE UPDATE ON medication_log
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
