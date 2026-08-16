-- Migration: 0003_events
-- Architecture §50: rotasphere_events table

CREATE TABLE IF NOT EXISTS rotasphere_events (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug           TEXT UNIQUE NOT NULL,
  title          TEXT NOT NULL,
  description    TEXT,
  category_id    UUID REFERENCES rotasphere_categories(id),
  club_id        UUID REFERENCES rotasphere_clubs(id),
  organizer_id   TEXT NOT NULL, -- Clerk ID
  status         TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PENDING_APPROVAL', 'PUBLISHED', 'REJECTED', 'CANCELLED', 'COMPLETED')),
  visibility     TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'unlisted')),
  start_date     TIMESTAMPTZ NOT NULL,
  end_date       TIMESTAMPTZ NOT NULL,
  venue_name     TEXT,
  address        TEXT,
  city           TEXT,
  latitude       NUMERIC(10,8),
  longitude      NUMERIC(11,8),
  capacity       INTEGER NOT NULL DEFAULT 100,
  thumbnail_url  TEXT,
  banner_url     TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rotasphere_events_slug ON rotasphere_events (slug);
CREATE INDEX IF NOT EXISTS idx_rotasphere_events_status ON rotasphere_events (status);
CREATE INDEX IF NOT EXISTS idx_rotasphere_events_city ON rotasphere_events (city);
CREATE INDEX IF NOT EXISTS idx_rotasphere_events_start ON rotasphere_events (start_date);

ALTER TABLE rotasphere_events ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read published events') THEN
    CREATE POLICY "Allow public read published events" ON rotasphere_events FOR SELECT USING (true);
  END IF;
END $$;
