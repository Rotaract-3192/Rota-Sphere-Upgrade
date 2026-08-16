-- Migration: 0005_commerce
-- Architecture §50: rotasphere_orders & rotasphere_order_items

CREATE TABLE IF NOT EXISTS rotasphere_orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         TEXT NOT NULL,
  event_id        UUID NOT NULL REFERENCES rotasphere_events(id),
  status          TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PAID', 'FAILED', 'EXPIRED', 'REFUNDED')),
  total_amount    NUMERIC(10,2) NOT NULL,
  currency        TEXT NOT NULL DEFAULT 'INR',
  razorpay_order_id TEXT UNIQUE,
  razorpay_payment_id TEXT UNIQUE,
  expires_at      TIMESTAMPTZ NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rotasphere_order_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID NOT NULL REFERENCES rotasphere_orders(id) ON DELETE CASCADE,
  tier_id     UUID NOT NULL REFERENCES rotasphere_ticket_tiers(id),
  quantity    INTEGER NOT NULL,
  unit_price  NUMERIC(10,2) NOT NULL
);

ALTER TABLE rotasphere_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE rotasphere_order_items ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read orders') THEN
    CREATE POLICY "Allow public read orders" ON rotasphere_orders FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public read order items') THEN
    CREATE POLICY "Allow public read order items" ON rotasphere_order_items FOR SELECT USING (true);
  END IF;
END $$;
