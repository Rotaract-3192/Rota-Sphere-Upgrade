-- ============================================================================
-- 0006_saas_multi_tenant_schema.sql
-- Production-Ready Multi-Tenant SaaS Ticketing Platform Schema
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. ORGANIZATIONS (Tenant Boundary)
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  logo_url TEXT,
  banner_url TEXT,
  website_url TEXT,
  support_email VARCHAR(255) NOT NULL,
  support_phone VARCHAR(50),
  city VARCHAR(100) NOT NULL,
  country VARCHAR(100) NOT NULL DEFAULT 'India',
  
  -- KYC & Verification
  legal_business_name VARCHAR(255),
  pan_number VARCHAR(20),
  gst_number VARCHAR(30),
  bank_account_name VARCHAR(255),
  bank_account_number VARCHAR(100),
  bank_ifsc_code VARCHAR(30),
  kyc_status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (kyc_status IN ('PENDING', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED', 'SUSPENDED')),
  kyc_rejection_reason TEXT,
  kyc_documents JSONB DEFAULT '[]'::jsonb,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  is_suspended BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Fee configuration override for this tenant (NULL = uses platform default)
  custom_platform_fee_percent NUMERIC(5,2) DEFAULT NULL,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_org_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_org_kyc ON organizations(kyc_status);

-- 2. ORGANIZATION MEMBERS & RBAC
CREATE TABLE IF NOT EXISTS organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL, -- Clerk user ID
  role VARCHAR(50) NOT NULL CHECK (role IN (
    'organizer_owner',
    'organizer_admin',
    'ticket_manager',
    'marketing_manager',
    'finance_manager',
    'check_in_staff',
    'viewer'
  )),
  custom_permissions JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_org_members_user ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org ON organization_members(organization_id);

-- 3. EVENT CATEGORIES
CREATE TABLE IF NOT EXISTS event_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(50),
  display_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default categories
INSERT INTO event_categories (name, slug, icon, display_order) VALUES
  ('Conferences', 'conferences', 'users', 1),
  ('Workshops & Masterclasses', 'workshops', 'book-open', 2),
  ('College & Youth Festivals', 'festivals', 'sparkles', 3),
  ('TEDx & Keynote Talks', 'tedx', 'mic', 4),
  ('Concerts & Cultural Nights', 'concerts', 'music', 5),
  ('Community & Social Service', 'community', 'heart', 6),
  ('Sports & Tournaments', 'sports', 'trophy', 7),
  ('Networking & Meetups', 'networking', 'briefcase', 8)
ON CONFLICT (slug) DO NOTHING;

-- 4. SAAS EVENTS (Extended Event Table)
CREATE TABLE IF NOT EXISTS saas_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  organizer_id VARCHAR(255) NOT NULL, -- Creator's Clerk ID
  category_id UUID REFERENCES event_categories(id) ON DELETE SET NULL,
  
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  summary TEXT,
  description TEXT NOT NULL,
  cover_image_url TEXT,
  logo_url TEXT,
  gallery_urls JSONB DEFAULT '[]'::jsonb,
  
  -- Format & Venue
  event_type VARCHAR(50) NOT NULL DEFAULT 'OFFLINE' CHECK (event_type IN ('OFFLINE', 'ONLINE', 'HYBRID')),
  venue_name VARCHAR(255),
  address TEXT,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100),
  country VARCHAR(100) NOT NULL DEFAULT 'India',
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  online_meeting_url TEXT,
  
  -- Date & Schedule
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  timezone VARCHAR(50) NOT NULL DEFAULT 'Asia/Kolkata',
  registration_deadline TIMESTAMPTZ,
  
  -- Settings & Lifecycle
  status VARCHAR(50) NOT NULL DEFAULT 'DRAFT' CHECK (status IN (
    'DRAFT', 'PENDING_APPROVAL', 'PUBLISHED', 'PAUSED', 'SOLD_OUT', 'COMPLETED', 'CANCELLED'
  )),
  visibility VARCHAR(50) NOT NULL DEFAULT 'PUBLIC' CHECK (visibility IN ('PUBLIC', 'PRIVATE', 'INVITE_ONLY', 'PASSWORD_PROTECTED', 'HIDDEN')),
  access_password VARCHAR(255),
  capacity INT NOT NULL DEFAULT 100,
  age_restriction INT DEFAULT 0,
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  allow_waitlist BOOLEAN NOT NULL DEFAULT TRUE,
  allow_ticket_transfer BOOLEAN NOT NULL DEFAULT TRUE,
  allow_refunds BOOLEAN NOT NULL DEFAULT TRUE,
  
  -- Policies
  terms_and_conditions TEXT,
  refund_policy TEXT,
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  social_links JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saas_events_org ON saas_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_saas_events_slug ON saas_events(slug);
CREATE INDEX IF NOT EXISTS idx_saas_events_status ON saas_events(status);
CREATE INDEX IF NOT EXISTS idx_saas_events_date ON saas_events(start_date);
CREATE INDEX IF NOT EXISTS idx_saas_events_city ON saas_events(city);

-- 5. EVENT SPEAKERS, SCHEDULES, SPONSORS & CUSTOM QUESTIONS
CREATE TABLE IF NOT EXISTS event_speakers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES saas_events(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  role_title VARCHAR(255),
  organization VARCHAR(255),
  avatar_url TEXT,
  bio TEXT,
  social_links JSONB DEFAULT '{}'::jsonb,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS event_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES saas_events(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  stage_room VARCHAR(100),
  speaker_ids JSONB DEFAULT '[]'::jsonb,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS event_sponsors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES saas_events(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  tier VARCHAR(50) NOT NULL DEFAULT 'Gold',
  logo_url TEXT NOT NULL,
  website_url TEXT,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS event_custom_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES saas_events(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type VARCHAR(50) NOT NULL CHECK (question_type IN (
    'short_text', 'long_text', 'dropdown', 'radio', 'checkbox', 'file_upload'
  )),
  options JSONB DEFAULT '[]'::jsonb,
  is_required BOOLEAN NOT NULL DEFAULT FALSE,
  ticket_tier_ids JSONB DEFAULT '[]'::jsonb,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. TICKET TYPES & TIERS
CREATE TABLE IF NOT EXISTS saas_ticket_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES saas_events(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  tier_type VARCHAR(50) NOT NULL DEFAULT 'REGULAR' CHECK (tier_type IN (
    'EARLY_BIRD', 'REGULAR', 'VIP', 'STUDENT', 'GROUP', 'FACULTY', 'WORKSHOP', 'COMPLIMENTARY'
  )),
  price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  total_capacity INT NOT NULL,
  sold_count INT NOT NULL DEFAULT 0,
  reserved_count INT NOT NULL DEFAULT 0,
  
  min_per_order INT NOT NULL DEFAULT 1,
  max_per_order INT NOT NULL DEFAULT 10,
  sales_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sales_end TIMESTAMPTZ NOT NULL,
  
  auto_activate_when_tier_sells_out UUID REFERENCES saas_ticket_tiers(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  benefits JSONB DEFAULT '[]'::jsonb,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ticket_tiers_event ON saas_ticket_tiers(event_id);

-- 7. CONCURRENCY-SAFE INVENTORY HOLDS
CREATE TABLE IF NOT EXISTS ticket_inventory_holds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_tier_id UUID NOT NULL REFERENCES saas_ticket_tiers(id) ON DELETE CASCADE,
  session_id VARCHAR(255) NOT NULL,
  user_id VARCHAR(255),
  quantity INT NOT NULL CHECK (quantity > 0),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventory_holds_tier ON ticket_inventory_holds(ticket_tier_id);
CREATE INDEX IF NOT EXISTS idx_inventory_holds_expiry ON ticket_inventory_holds(expires_at);

-- 8. COUPONS & DISCOUNTS
CREATE TABLE IF NOT EXISTS saas_coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  event_id UUID REFERENCES saas_events(id) ON DELETE CASCADE,
  code VARCHAR(50) NOT NULL,
  discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('PERCENTAGE', 'FLAT')),
  discount_value NUMERIC(10, 2) NOT NULL,
  max_discount_amount NUMERIC(10, 2),
  min_order_amount NUMERIC(10, 2) DEFAULT 0.00,
  
  usage_limit INT DEFAULT NULL,
  usage_count INT NOT NULL DEFAULT 0,
  per_user_limit INT NOT NULL DEFAULT 1,
  start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_date TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, code)
);

-- 9. ORDERS & PAYMENTS
CREATE TABLE IF NOT EXISTS saas_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(100) NOT NULL UNIQUE,
  event_id UUID NOT NULL REFERENCES saas_events(id) ON DELETE RESTRICT,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  customer_user_id VARCHAR(255) NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50),
  
  subtotal_amount NUMERIC(10, 2) NOT NULL,
  discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  platform_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  convenience_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  tax_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  total_amount NUMERIC(10, 2) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'INR',
  
  coupon_code VARCHAR(50),
  coupon_id UUID REFERENCES saas_coupons(id),
  
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN (
    'PENDING', 'PAID', 'FAILED', 'CANCELLED', 'PARTIALLY_REFUNDED', 'REFUNDED'
  )),
  payment_method VARCHAR(50),
  payment_gateway VARCHAR(50) DEFAULT 'RAZORPAY',
  gateway_order_id VARCHAR(255),
  gateway_payment_id VARCHAR(255),
  idempotency_key VARCHAR(255) UNIQUE,
  
  custom_answers JSONB DEFAULT '{}'::jsonb,
  invoice_url TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_customer ON saas_orders(customer_user_id);
CREATE INDEX IF NOT EXISTS idx_orders_event ON saas_orders(event_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON saas_orders(status);

-- 10. TICKETS & ATTENDEES
CREATE TABLE IF NOT EXISTS saas_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_code VARCHAR(100) NOT NULL UNIQUE,
  order_id UUID NOT NULL REFERENCES saas_orders(id) ON DELETE RESTRICT,
  event_id UUID NOT NULL REFERENCES saas_events(id) ON DELETE RESTRICT,
  ticket_tier_id UUID NOT NULL REFERENCES saas_ticket_tiers(id) ON DELETE RESTRICT,
  
  owner_user_id VARCHAR(255) NOT NULL,
  attendee_name VARCHAR(255) NOT NULL,
  attendee_email VARCHAR(255) NOT NULL,
  attendee_phone VARCHAR(50),
  
  qr_token VARCHAR(255) NOT NULL UNIQUE,
  status VARCHAR(50) NOT NULL DEFAULT 'CONFIRMED' CHECK (status IN (
    'RESERVED', 'CONFIRMED', 'USED', 'CANCELLED', 'REFUNDED', 'TRANSFERRED', 'EXPIRED'
  )),
  
  checked_in_at TIMESTAMPTZ,
  checked_in_gate VARCHAR(100),
  checked_in_by_user_id VARCHAR(255),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tickets_owner ON saas_tickets(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_event ON saas_tickets(event_id);
CREATE INDEX IF NOT EXISTS idx_tickets_qr ON saas_tickets(qr_token);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON saas_tickets(status);

-- 11. CHECK-IN SCANNER AUDIT LOGS
CREATE TABLE IF NOT EXISTS check_in_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES saas_tickets(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES saas_events(id) ON DELETE CASCADE,
  scanner_user_id VARCHAR(255) NOT NULL,
  gate_name VARCHAR(100) NOT NULL DEFAULT 'Main Gate',
  result VARCHAR(50) NOT NULL CHECK (result IN ('SUCCESS', 'DUPLICATE_SCAN', 'INVALID', 'CANCELLED', 'REFUNDED')),
  scanned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  device_info JSONB DEFAULT '{}'::jsonb
);

-- 12. TICKET TRANSFERS HISTORY
CREATE TABLE IF NOT EXISTS ticket_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES saas_tickets(id) ON DELETE CASCADE,
  from_user_id VARCHAR(255) NOT NULL,
  from_email VARCHAR(255) NOT NULL,
  to_user_id VARCHAR(255),
  to_name VARCHAR(255) NOT NULL,
  to_email VARCHAR(255) NOT NULL,
  to_phone VARCHAR(50),
  old_qr_token VARCHAR(255) NOT NULL,
  new_qr_token VARCHAR(255) NOT NULL,
  transferred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. REFUNDS & DISPUTES
CREATE TABLE IF NOT EXISTS saas_refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES saas_orders(id) ON DELETE RESTRICT,
  event_id UUID NOT NULL REFERENCES saas_events(id) ON DELETE RESTRICT,
  ticket_id UUID REFERENCES saas_tickets(id) ON DELETE SET NULL,
  amount NUMERIC(10, 2) NOT NULL,
  reason TEXT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'REQUESTED' CHECK (status IN (
    'REQUESTED', 'APPROVED', 'REJECTED', 'PROCESSING', 'COMPLETED', 'FAILED'
  )),
  gateway_refund_id VARCHAR(255),
  requested_by_user_id VARCHAR(255) NOT NULL,
  approved_by_user_id VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. WAITLISTS
CREATE TABLE IF NOT EXISTS event_waitlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES saas_events(id) ON DELETE CASCADE,
  ticket_tier_id UUID NOT NULL REFERENCES saas_ticket_tiers(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  quantity INT NOT NULL DEFAULT 1,
  status VARCHAR(50) NOT NULL DEFAULT 'WAITING' CHECK (status IN ('WAITING', 'NOTIFIED', 'CONVERTED', 'EXPIRED')),
  notified_at TIMESTAMPTZ,
  reservation_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. IMMUTABLE PLATFORM AUDIT LOGS
CREATE TABLE IF NOT EXISTS platform_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id VARCHAR(255) NOT NULL,
  actor_role VARCHAR(50) NOT NULL,
  actor_email VARCHAR(255),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id VARCHAR(255) NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  previous_state JSONB,
  new_state JSONB,
  ip_address VARCHAR(100),
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_entity ON platform_audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON platform_audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_org ON platform_audit_logs(organization_id);

-- 16. PLATFORM SETTINGS & FEATURE FLAGS
CREATE TABLE IF NOT EXISTS platform_settings (
  key VARCHAR(100) PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS platform_feature_flags (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  rollout_percentage INT NOT NULL DEFAULT 100 CHECK (rollout_percentage BETWEEN 0 AND 100),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed feature flags
INSERT INTO platform_feature_flags (id, name, description, is_enabled, rollout_percentage) VALUES
  ('feature_waitlist', 'Event Waitlist', 'Allow customers to join waitlist when tickets sell out', TRUE, 100),
  ('feature_ticket_transfer', 'Ticket Transfer', 'Allow ticket holders to transfer passes to new attendees', TRUE, 100),
  ('feature_whatsapp_automation', 'WhatsApp Automation', 'Send tickets and reminders via WhatsApp Business API', TRUE, 100),
  ('feature_dynamic_pricing', 'Dynamic Pricing', 'Demand-based ticket pricing algorithm', FALSE, 0),
  ('feature_ai_insights', 'AI Sales Forecasting', 'Predict attendance, no-shows and velocity with AI', TRUE, 100)
ON CONFLICT (id) DO NOTHING;

-- Seed default platform settings
INSERT INTO platform_settings (key, value, description) VALUES
  ('platform_fee_percent', '3.5', 'Default platform commission fee percentage'),
  ('convenience_fee_fixed', '10.0', 'Standard convenience fee per order in INR'),
  ('gst_percent', '18.0', 'GST percentage on platform & convenience fees'),
  ('platform_name', '"RotaSphere Enterprise"', 'Platform public name')
ON CONFLICT (key) DO NOTHING;
