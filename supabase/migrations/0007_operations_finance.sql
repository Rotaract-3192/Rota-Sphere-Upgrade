-- Migration: 0007_operations_finance
-- Architecture §50: rotasphere_payouts, rotasphere_system_settings & rotasphere_broadcast_announcements

CREATE TABLE IF NOT EXISTS rotasphere_payouts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        UUID NOT NULL REFERENCES rotasphere_events(id),
  organizer_id    TEXT NOT NULL,
  amount          NUMERIC(10,2) NOT NULL,
  status          TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PAID', 'FAILED')),
  paid_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rotasphere_system_settings (
  key         TEXT PRIMARY KEY,
  value       JSONB NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rotasphere_broadcast_announcements (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  message     TEXT NOT NULL,
  created_by  TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE rotasphere_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE rotasphere_system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE rotasphere_broadcast_announcements ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read payouts') THEN
    CREATE POLICY "Allow public read payouts" ON rotasphere_payouts FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read settings') THEN
    CREATE POLICY "Allow public read settings" ON rotasphere_system_settings FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read broadcasts') THEN
    CREATE POLICY "Allow public read broadcasts" ON rotasphere_broadcast_announcements FOR SELECT USING (true);
  END IF;
END $$;
