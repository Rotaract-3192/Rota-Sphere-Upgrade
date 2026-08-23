/**
 * Multi-Tenant Production SaaS Ticketing Platform Types
 */

export type SaasUserRole =
  | "super_admin"
  | "platform_admin"
  | "support_agent"
  | "finance_admin"
  | "organizer_owner"
  | "organizer_admin"
  | "ticket_manager"
  | "marketing_manager"
  | "finance_manager"
  | "check_in_staff"
  | "viewer"
  | "customer";

export type KycStatus = "PENDING" | "UNDER_REVIEW" | "VERIFIED" | "REJECTED" | "SUSPENDED";
export type EventFormat = "OFFLINE" | "ONLINE" | "HYBRID";
export type EventStatus = "DRAFT" | "PENDING_APPROVAL" | "PUBLISHED" | "PAUSED" | "SOLD_OUT" | "COMPLETED" | "CANCELLED";
export type EventVisibility = "PUBLIC" | "PRIVATE" | "INVITE_ONLY" | "PASSWORD_PROTECTED" | "HIDDEN";

export type TicketTierType =
  | "EARLY_BIRD"
  | "REGULAR"
  | "VIP"
  | "STUDENT"
  | "GROUP"
  | "FACULTY"
  | "WORKSHOP"
  | "COMPLIMENTARY";

export type OrderStatus = "PENDING" | "PAID" | "FAILED" | "CANCELLED" | "PARTIALLY_REFUNDED" | "REFUNDED";
export type TicketStatus = "RESERVED" | "CONFIRMED" | "USED" | "CANCELLED" | "REFUNDED" | "TRANSFERRED" | "EXPIRED";
export type RefundStatus = "REQUESTED" | "APPROVED" | "REJECTED" | "PROCESSING" | "COMPLETED" | "FAILED";
export type CheckInResult = "SUCCESS" | "DUPLICATE_SCAN" | "INVALID" | "CANCELLED" | "REFUNDED";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  banner_url: string | null;
  website_url: string | null;
  support_email: string;
  support_phone: string | null;
  city: string;
  country: string;
  legal_business_name: string | null;
  pan_number: string | null;
  gst_number: string | null;
  bank_account_name: string | null;
  bank_account_number: string | null;
  bank_ifsc_code: string | null;
  kyc_status: KycStatus;
  kyc_rejection_reason: string | null;
  kyc_documents: Array<{ type: string; url: string; uploaded_at: string }>;
  is_verified: boolean;
  is_suspended: boolean;
  custom_platform_fee_percent: number | null;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: SaasUserRole;
  custom_permissions: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EventCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

export interface SaasEvent {
  id: string;
  organization_id: string;
  organizer_id: string;
  category_id: string | null;
  title: string;
  slug: string;
  summary: string | null;
  description: string;
  cover_image_url: string | null;
  logo_url: string | null;
  gallery_urls: string[];
  event_type: EventFormat;
  venue_name: string | null;
  address: string | null;
  city: string;
  state: string | null;
  country: string;
  latitude: number | null;
  longitude: number | null;
  online_meeting_url: string | null;
  start_date: string;
  end_date: string;
  timezone: string;
  registration_deadline: string | null;
  status: EventStatus;
  visibility: EventVisibility;
  access_password?: string | null;
  capacity: number;
  age_restriction: number;
  is_featured: boolean;
  is_verified: boolean;
  allow_waitlist: boolean;
  allow_ticket_transfer: boolean;
  allow_refunds: boolean;
  terms_and_conditions: string | null;
  refund_policy: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  social_links: Record<string, string>;
  created_at: string;
  updated_at: string;

  // Joined fields
  organizations?: Organization;
  event_categories?: EventCategory;
  saas_ticket_tiers?: SaasTicketTier[];
  event_speakers?: EventSpeaker[];
  event_schedules?: EventSchedule[];
  event_sponsors?: EventSponsor[];
}

export interface SaasTicketTier {
  id: string;
  event_id: string;
  name: string;
  description: string | null;
  tier_type: TicketTierType;
  price: number;
  total_capacity: number;
  sold_count: number;
  reserved_count: number;
  min_per_order: number;
  max_per_order: number;
  sales_start: string;
  sales_end: string;
  auto_activate_when_tier_sells_out: string | null;
  is_active: boolean;
  is_visible: boolean;
  benefits: string[];
  created_at: string;
  updated_at: string;
}

export interface EventSpeaker {
  id: string;
  event_id: string;
  name: string;
  role_title: string | null;
  organization: string | null;
  avatar_url: string | null;
  bio: string | null;
  social_links: Record<string, string>;
  display_order: number;
}

export interface EventSchedule {
  id: string;
  event_id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  stage_room: string | null;
  speaker_ids: string[];
  display_order: number;
}

export interface EventSponsor {
  id: string;
  event_id: string;
  name: string;
  tier: string;
  logo_url: string;
  website_url: string | null;
  display_order: number;
}

export interface EventCustomQuestion {
  id: string;
  event_id: string;
  question_text: string;
  question_type: "short_text" | "long_text" | "dropdown" | "radio" | "checkbox" | "file_upload";
  options: string[];
  is_required: boolean;
  ticket_tier_ids: string[];
  display_order: number;
}

export interface SaasCoupon {
  id: string;
  organization_id: string;
  event_id: string | null;
  code: string;
  discount_type: "PERCENTAGE" | "FLAT";
  discount_value: number;
  max_discount_amount: number | null;
  min_order_amount: number;
  usage_limit: number | null;
  usage_count: number;
  per_user_limit: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

export interface SaasOrder {
  id: string;
  order_number: string;
  event_id: string;
  organization_id: string;
  customer_user_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  subtotal_amount: number;
  discount_amount: number;
  platform_fee: number;
  convenience_fee: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  coupon_code: string | null;
  coupon_id: string | null;
  status: OrderStatus;
  payment_method: string | null;
  payment_gateway: string;
  gateway_order_id: string | null;
  gateway_payment_id: string | null;
  idempotency_key: string | null;
  custom_answers: Record<string, any>;
  invoice_url: string | null;
  created_at: string;
  updated_at: string;

  // Joined
  saas_events?: SaasEvent;
  saas_tickets?: SaasTicket[];
}

export interface SaasTicket {
  id: string;
  ticket_code: string;
  order_id: string;
  event_id: string;
  ticket_tier_id: string;
  owner_user_id: string;
  attendee_name: string;
  attendee_email: string;
  attendee_phone: string | null;
  member_type?: string | null;
  club_name?: string | null;
  designation?: string | null;
  zone?: string | null;
  custom_answers?: Record<string, any> | null;
  qr_token: string;
  status: TicketStatus;
  checked_in_at: string | null;
  checked_in_gate: string | null;
  checked_in_by_user_id: string | null;
  created_at: string;
  updated_at: string;

  // Joined
  saas_events?: SaasEvent;
  saas_ticket_tiers?: SaasTicketTier;
}

export interface CheckInLog {
  id: string;
  ticket_id: string;
  event_id: string;
  scanner_user_id: string;
  gate_name: string;
  result: CheckInResult;
  scanned_at: string;
  device_info: Record<string, any>;
}

export interface PlatformAuditLog {
  id: string;
  actor_id: string;
  actor_role: string;
  actor_email: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  organization_id: string | null;
  previous_state: Record<string, any> | null;
  new_state: Record<string, any> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface PlatformFeatureFlag {
  id: string;
  name: string;
  description: string;
  is_enabled: boolean;
  rollout_percentage: number;
  updated_at: string;
}
