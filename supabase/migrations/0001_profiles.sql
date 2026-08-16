-- Migration: 0001_profiles
-- Architecture §50: rotasphere_profiles table
-- Maps Clerk auth user_id to RotaSphere database profile and role.

CREATE TABLE IF NOT EXISTS rotasphere_profiles (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_id     TEXT UNIQUE NOT NULL,
  email        TEXT NOT NULL,
  full_name    TEXT NOT NULL,
  avatar_url   TEXT,
  role         TEXT NOT NULL DEFAULT 'attendee' CHECK (role IN ('attendee', 'organizer', 'admin', 'super_admin')),
  club_id      UUID,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rotasphere_profiles_clerk_id ON rotasphere_profiles (clerk_id);
CREATE INDEX IF NOT EXISTS idx_rotasphere_profiles_role ON rotasphere_profiles (role);

-- RLS
ALTER TABLE rotasphere_profiles ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read profiles') THEN
    CREATE POLICY "Allow public read profiles" ON rotasphere_profiles FOR SELECT USING (true);
  END IF;
END $$;
