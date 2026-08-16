-- Migration: 0002_clubs_categories
-- Architecture §50: rotasphere_clubs and rotasphere_categories tables
-- Dependencies: 0001_profiles.sql

CREATE TABLE IF NOT EXISTS rotasphere_clubs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  city         TEXT NOT NULL,
  district     TEXT NOT NULL DEFAULT 'D3192',
  status       TEXT NOT NULL DEFAULT 'ACTIVE',
  is_verified  BOOLEAN NOT NULL DEFAULT true,
  contact_email TEXT,
  logo_url     TEXT,
  description  TEXT,
  website_url  TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rotasphere_clubs_city ON rotasphere_clubs (city);
CREATE INDEX IF NOT EXISTS idx_rotasphere_clubs_status ON rotasphere_clubs (status);

CREATE TABLE IF NOT EXISTS rotasphere_categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  slug        TEXT NOT NULL UNIQUE,
  description TEXT,
  icon_name   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE rotasphere_clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE rotasphere_categories ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read clubs') THEN
    CREATE POLICY "Allow public read clubs" ON rotasphere_clubs FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read categories') THEN
    CREATE POLICY "Allow public read categories" ON rotasphere_categories FOR SELECT USING (true);
  END IF;
END $$;
