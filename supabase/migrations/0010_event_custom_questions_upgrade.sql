-- Migration: 0010_event_custom_questions_upgrade
-- Enhances event_custom_questions table with flexible question types, placeholders, and help text

CREATE TABLE IF NOT EXISTS event_custom_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES saas_events(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type VARCHAR(50) NOT NULL,
  options JSONB DEFAULT '[]'::jsonb,
  is_required BOOLEAN NOT NULL DEFAULT FALSE,
  ticket_tier_ids JSONB DEFAULT '[]'::jsonb,
  display_order INT NOT NULL DEFAULT 0,
  placeholder TEXT,
  help_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure columns exist if table was already created by migration 0006
ALTER TABLE event_custom_questions ADD COLUMN IF NOT EXISTS placeholder TEXT;
ALTER TABLE event_custom_questions ADD COLUMN IF NOT EXISTS help_text TEXT;
ALTER TABLE event_custom_questions ADD COLUMN IF NOT EXISTS ticket_tier_ids JSONB DEFAULT '[]'::jsonb;
ALTER TABLE event_custom_questions ADD COLUMN IF NOT EXISTS display_order INT DEFAULT 0;

-- Drop legacy restrictive check constraint if present and re-add flexible constraint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage 
    WHERE table_name = 'event_custom_questions' AND constraint_name = 'event_custom_questions_question_type_check'
  ) THEN
    ALTER TABLE event_custom_questions DROP CONSTRAINT event_custom_questions_question_type_check;
  END IF;
END $$;

ALTER TABLE event_custom_questions ADD CONSTRAINT event_custom_questions_question_type_check 
  CHECK (question_type IN (
    'short_text', 'long_text', 'number', 'phone', 'aadhaar', 'pan', 
    'dropdown', 'radio', 'checkbox', 'file_upload', 'date'
  ));

CREATE INDEX IF NOT EXISTS idx_custom_questions_event ON event_custom_questions(event_id);
