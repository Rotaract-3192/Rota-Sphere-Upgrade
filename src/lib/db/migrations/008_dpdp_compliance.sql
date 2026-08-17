-- ============================================================
-- Migration 008: DPDP Act 2023 Compliance Schema
-- RotaSphere Indian Ticketing Platform
-- IMPORTANT: Review by Indian privacy/legal professional
-- required before commercial launch.
-- ============================================================

-- --- 1. POLICY VERSIONS -----------------------------------
CREATE TABLE IF NOT EXISTS policy_versions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  policy_type text NOT NULL CHECK (policy_type IN (
    'privacy_policy','terms_conditions','refund_policy',
    'cancellation_policy','cookie_policy','event_terms'
  )),
  version text NOT NULL,
  content text NOT NULL,
  summary_of_changes text,
  effective_date date NOT NULL,
  published_at timestamptz,
  created_by text,
  is_active boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_policy_versions_type ON policy_versions(policy_type, is_active);

-- --- 2. CONSENTS ------------------------------------------
CREATE TABLE IF NOT EXISTS consents (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text NOT NULL,
  user_email text,
  purpose text NOT NULL CHECK (purpose IN (
    'transactional_email','marketing_email',
    'transactional_whatsapp','marketing_whatsapp',
    'marketing_sms','analytics','personalisation'
  )),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN (
    'granted','denied','withdrawn','pending'
  )),
  policy_version_id uuid REFERENCES policy_versions(id),
  policy_version_tag text,
  source text NOT NULL DEFAULT 'web',
  consent_method text DEFAULT 'explicit_checkbox',
  ip_address text,
  user_agent text,
  granted_at timestamptz,
  withdrawn_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, purpose)
);
CREATE INDEX IF NOT EXISTS idx_consents_user ON consents(user_id);
CREATE INDEX IF NOT EXISTS idx_consents_purpose ON consents(purpose, status);

-- --- 3. AUDIT LOGS ----------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_id text,
  actor_email text,
  actor_role text,
  action text NOT NULL,
  category text NOT NULL CHECK (category IN (
    'AUTH','DATA_ACCESS','DATA_EXPORT','DATA_DELETE',
    'DATA_CORRECT','CONSENT','PAYMENT','ROLE_CHANGE',
    'ADMIN_ACTION','SECURITY','PRIVACY_REQUEST','CONFIG_CHANGE'
  )),
  resource_type text,
  resource_id text,
  result text NOT NULL DEFAULT 'SUCCESS' CHECK (result IN ('SUCCESS','FAILURE','BLOCKED')),
  ip_address text,
  user_agent text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_category ON audit_logs(category);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);

-- --- 4. PRIVACY REQUESTS ----------------------------------
CREATE TABLE IF NOT EXISTS privacy_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  request_number text UNIQUE DEFAULT 'PR-' || to_char(now(),'YYYYMMDD') || '-' || substr(gen_random_uuid()::text,1,6),
  user_id text NOT NULL,
  user_email text NOT NULL,
  user_name text,
  request_type text NOT NULL CHECK (request_type IN (
    'access','correction','erasure','portability',
    'consent_withdrawal','objection'
  )),
  description text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN (
    'open','under_review','awaiting_info',
    'in_progress','completed','rejected','closed'
  )),
  assigned_to text,
  identity_verified boolean DEFAULT false,
  verified_at timestamptz,
  response text,
  rejection_reason text,
  completed_at timestamptz,
  deadline_at timestamptz DEFAULT now() + interval '30 days',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_privacy_requests_user ON privacy_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_privacy_requests_status ON privacy_requests(status);
CREATE INDEX IF NOT EXISTS idx_privacy_requests_type ON privacy_requests(request_type);

-- --- 5. PRIVACY COMPLAINTS --------------------------------
CREATE TABLE IF NOT EXISTS privacy_complaints (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  complaint_number text UNIQUE DEFAULT 'PC-' || to_char(now(),'YYYYMMDD') || '-' || substr(gen_random_uuid()::text,1,6),
  user_id text,
  user_email text NOT NULL,
  user_name text NOT NULL,
  category text NOT NULL CHECK (category IN (
    'data_breach','unauthorised_sharing','consent_violation',
    'deletion_failure','access_denial','correction_failure',
    'excessive_collection','other'
  )),
  description text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN (
    'open','under_review','awaiting_information',
    'resolved','closed'
  )),
  assigned_to text,
  internal_notes text,
  resolution text,
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_privacy_complaints_status ON privacy_complaints(status);
CREATE INDEX IF NOT EXISTS idx_privacy_complaints_user ON privacy_complaints(user_email);

-- --- 6. DATA EXPORTS --------------------------------------
CREATE TABLE IF NOT EXISTS data_exports (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id text NOT NULL,
  user_email text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending','generating','ready','downloaded','expired','failed'
  )),
  file_path text,
  signed_url text,
  signed_url_expires_at timestamptz,
  requested_at timestamptz DEFAULT now(),
  generated_at timestamptz,
  downloaded_at timestamptz,
  expires_at timestamptz DEFAULT now() + interval '1 hour',
  error_message text
);
CREATE INDEX IF NOT EXISTS idx_data_exports_user ON data_exports(user_id);

-- --- 7. RETENTION POLICIES --------------------------------
CREATE TABLE IF NOT EXISTS retention_policies (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  data_category text UNIQUE NOT NULL,
  display_name text NOT NULL,
  retention_period_days integer,
  retention_reason text NOT NULL,
  legal_basis text,
  deletion_method text NOT NULL DEFAULT 'hard_delete' CHECK (deletion_method IN (
    'hard_delete','anonymise','archive'
  )),
  is_active boolean DEFAULT true,
  created_by text,
  updated_by text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Seed default retention policies
INSERT INTO retention_policies (data_category, display_name, retention_period_days, retention_reason, legal_basis, deletion_method)
VALUES
  ('temp_verification', 'Temporary Verification Codes', 1, 'OTPs/temp tokens expire after use', 'legitimate_interest', 'hard_delete'),
  ('session_data', 'Session Data', 30, 'Active session management', 'contract', 'hard_delete'),
  ('event_registration', 'Event Registration Data', 1095, 'Business records and dispute resolution', 'legitimate_interest', 'anonymise'),
  ('marketing_preferences', 'Marketing Preferences', 1825, 'Maintain opt-out records', 'consent', 'hard_delete'),
  ('financial_records', 'Financial/Payment Records', 2555, 'Indian accounting/tax compliance (7 years)', 'legal_obligation', 'archive'),
  ('security_logs', 'Security Logs', 365, 'Incident response and security monitoring', 'legitimate_interest', 'hard_delete'),
  ('audit_logs', 'Audit Logs', 1095, 'Compliance and auditability', 'legal_obligation', 'archive'),
  ('push_subscriptions', 'Push Notification Subscriptions', 730, 'Active notification delivery', 'consent', 'hard_delete'),
  ('unused_accounts', 'Inactive User Accounts', 1095, 'Account management', 'legitimate_interest', 'anonymise')
ON CONFLICT (data_category) DO NOTHING;

-- --- 8. DELETION JOBS -------------------------------------
CREATE TABLE IF NOT EXISTS deletion_jobs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  job_type text NOT NULL CHECK (job_type IN (
    'user_erasure','anonymise','retention_cleanup',
    'export_expiry','temp_data_cleanup'
  )),
  target_user_id text,
  target_resource_type text,
  target_resource_id text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending','in_progress','completed','failed','blocked_by_legal_hold'
  )),
  steps jsonb DEFAULT '[]',
  triggered_by text,
  trigger_reason text,
  completed_at timestamptz,
  error_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_deletion_jobs_user ON deletion_jobs(target_user_id);
CREATE INDEX IF NOT EXISTS idx_deletion_jobs_status ON deletion_jobs(status);

-- --- 9. LEGAL HOLDS ---------------------------------------
CREATE TABLE IF NOT EXISTS legal_holds (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  target_user_id text,
  target_resource_type text,
  target_resource_id text,
  reason text NOT NULL,
  created_by text NOT NULL,
  review_date date,
  released_at timestamptz,
  released_by text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_legal_holds_user ON legal_holds(target_user_id, is_active);

-- --- 10. DATA PROCESSORS ----------------------------------
CREATE TABLE IF NOT EXISTS data_processors (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  purpose text NOT NULL,
  data_categories text[] NOT NULL DEFAULT '{}',
  country text NOT NULL,
  processing_location text,
  security_measures text,
  contract_status text NOT NULL DEFAULT 'pending_review' CHECK (contract_status IN (
    'not_applicable','pending_review','approved','expired','requires_update'
  )),
  dpa_signed boolean DEFAULT false,
  retention_period text,
  deletion_process text,
  privacy_policy_url text,
  last_reviewed_at date,
  notes text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Seed known processors
INSERT INTO data_processors (name, purpose, data_categories, country, contract_status, is_active)
VALUES
  ('Supabase', 'Primary database and API', ARRAY['all_personal_data','authentication'], 'India/US', 'approved', true),
  ('Clerk', 'Authentication and identity', ARRAY['name','email','phone'], 'US', 'approved', true),
  ('Gmail SMTP (Nodemailer)', 'Transactional email delivery', ARRAY['email','name'], 'US', 'not_applicable', true),
  ('Cloudflare', 'CDN, WAF, DDoS protection', ARRAY['ip_address','request_metadata'], 'Global', 'approved', true),
  ('Browser Push API', 'Push notifications', ARRAY['push_endpoint','device_keys'], 'Browser-native', 'not_applicable', true)
ON CONFLICT DO NOTHING;

-- --- 11. DATA INVENTORY -----------------------------------
CREATE TABLE IF NOT EXISTS data_inventory (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  field_name text NOT NULL,
  display_name text NOT NULL,
  category text NOT NULL CHECK (category IN (
    'public','internal','personal','sensitive','highly_restricted'
  )),
  purpose text NOT NULL,
  source text,
  legal_basis text NOT NULL,
  is_required boolean DEFAULT false,
  storage_location text NOT NULL,
  processor_id uuid REFERENCES data_processors(id),
  retention_policy_id uuid REFERENCES retention_policies(id),
  access_roles text[] DEFAULT '{}',
  deletion_method text,
  is_encrypted boolean DEFAULT true,
  last_reviewed_at date DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- --- 12. SECURITY INCIDENTS -------------------------------
CREATE TABLE IF NOT EXISTS security_incidents (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  incident_number text UNIQUE DEFAULT 'INC-' || to_char(now(),'YYYYMMDD') || '-' || substr(gen_random_uuid()::text,1,6),
  title text NOT NULL,
  incident_type text NOT NULL CHECK (incident_type IN (
    'data_breach','unauthorised_access','system_compromise',
    'malware','phishing','ddos','insider_threat',
    'third_party_breach','other'
  )),
  severity text NOT NULL CHECK (severity IN ('critical','high','medium','low','informational')),
  status text NOT NULL DEFAULT 'open' CHECK (status IN (
    'open','investigating','contained','remediated',
    'closed','post_incident_review'
  )),
  detected_at timestamptz NOT NULL DEFAULT now(),
  occurred_at timestamptz,
  contained_at timestamptz,
  resolved_at timestamptz,
  affected_systems text[],
  affected_data_categories text[],
  estimated_affected_users integer,
  description text NOT NULL,
  containment_actions text,
  investigation_notes text,
  regulatory_notification_required boolean DEFAULT false,
  regulatory_notified_at timestamptz,
  regulatory_notification_deadline timestamptz,
  user_notification_required boolean DEFAULT false,
  user_notified_at timestamptz,
  lessons_learned text,
  reported_by text,
  assigned_to text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_security_incidents_status ON security_incidents(status);
CREATE INDEX IF NOT EXISTS idx_security_incidents_severity ON security_incidents(severity);

-- --- UPDATE TRIGGERS --------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_col()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER trg_consents_updated_at BEFORE UPDATE ON consents FOR EACH ROW EXECUTE FUNCTION update_updated_at_col();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_privacy_requests_updated_at BEFORE UPDATE ON privacy_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_col();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_privacy_complaints_updated_at BEFORE UPDATE ON privacy_complaints FOR EACH ROW EXECUTE FUNCTION update_updated_at_col();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_security_incidents_updated_at BEFORE UPDATE ON security_incidents FOR EACH ROW EXECUTE FUNCTION update_updated_at_col();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
