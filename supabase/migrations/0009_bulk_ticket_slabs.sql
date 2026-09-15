-- ============================================================================
-- 0009_bulk_ticket_slabs.sql
-- Bulk Ticket Slab Feature: Allows admins to release fixed-size group passes
-- (e.g. "Group of 15") where one buyer registers all N attendees at once.
-- Each attendee still gets an individual QR-coded ticket.
-- ============================================================================

-- 1. Extend saas_ticket_tiers for bulk slab support
ALTER TABLE saas_ticket_tiers ADD COLUMN IF NOT EXISTS is_bulk_slab BOOLEAN NOT NULL DEFAULT FALSE;

-- bulk_slab_size: the exact number of tickets in this slab (e.g. 15 or 20)
-- NULL means it's a regular tier (not a bulk slab)
ALTER TABLE saas_ticket_tiers ADD COLUMN IF NOT EXISTS bulk_slab_size INT DEFAULT NULL;

-- 2. Add BULK to the tier_type check constraint
ALTER TABLE saas_ticket_tiers DROP CONSTRAINT IF EXISTS saas_ticket_tiers_tier_type_check;
ALTER TABLE saas_ticket_tiers ADD CONSTRAINT saas_ticket_tiers_tier_type_check CHECK (tier_type IN (
  'EARLY_BIRD', 'REGULAR', 'VIP', 'STUDENT', 'GROUP', 'FACULTY', 'WORKSHOP', 'COMPLIMENTARY', 'BULK'
));

-- 3. Add bulk_order_group_id to saas_tickets
-- All N tickets belonging to the same bulk purchase share this UUID
ALTER TABLE saas_tickets ADD COLUMN IF NOT EXISTS bulk_order_group_id UUID DEFAULT NULL;

-- Index for efficient grouping queries (buyer's ticket page + admin views)
CREATE INDEX IF NOT EXISTS idx_tickets_bulk_group ON saas_tickets(bulk_order_group_id);

-- 4. Feature flag for bulk ticketing
INSERT INTO platform_feature_flags (id, name, description, is_enabled, rollout_percentage)
VALUES (
  'feature_bulk_ticketing',
  'Bulk Ticket Slabs',
  'Allow admins to create fixed-size group ticket slabs (e.g. 15-person group pass)',
  TRUE,
  100
) ON CONFLICT (id) DO NOTHING;
