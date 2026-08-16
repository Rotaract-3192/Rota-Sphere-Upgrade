-- Migration: 0004_ticketing
-- Architecture §50: rotasphere_ticket_tiers & rotasphere_tickets

CREATE TABLE IF NOT EXISTS rotasphere_ticket_tiers (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id     UUID NOT NULL REFERENCES rotasphere_events(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  description  TEXT,
  price        NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  capacity     INTEGER NOT NULL,
  sold_count   INTEGER NOT NULL DEFAULT 0,
  enabled      BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rotasphere_tickets (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_code   TEXT UNIQUE NOT NULL,
  event_id      UUID NOT NULL REFERENCES rotasphere_events(id),
  tier_id       UUID NOT NULL REFERENCES rotasphere_ticket_tiers(id),
  owner_user_id TEXT NOT NULL, -- Clerk ID
  status        TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'CHECKED_IN', 'CANCELLED', 'EXPIRED')),
  qr_hash       TEXT UNIQUE NOT NULL,
  issued_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rotasphere_tickets_owner ON rotasphere_tickets (owner_user_id);
CREATE INDEX IF NOT EXISTS idx_rotasphere_tickets_event ON rotasphere_tickets (event_id);
CREATE INDEX IF NOT EXISTS idx_rotasphere_tickets_hash ON rotasphere_tickets (qr_hash);

ALTER TABLE rotasphere_ticket_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE rotasphere_tickets ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read ticket tiers') THEN
    CREATE POLICY "Allow public read ticket tiers" ON rotasphere_ticket_tiers FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read tickets') THEN
    CREATE POLICY "Allow public read tickets" ON rotasphere_tickets FOR SELECT USING (true);
  END IF;
END $$;
