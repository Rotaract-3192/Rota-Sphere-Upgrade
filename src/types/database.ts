/**
 * TypeScript types for the RotaSphere database schema.
 * Architecture §50, §51: Full schema definition.
 * These types mirror every table defined in architecture.md §50-51.
 * Replace with Supabase CLI generated types once project is connected:
 *   npx supabase gen types typescript --project-id <id> > src/types/database.ts
 */

// ─── ENUMS ────────────────────────────────────────────────────────────────────

export type UserRole = "super_admin" | "admin" | "organizer" | "attendee";
export type UserStatus = "ACTIVE" | "PENDING" | "SUSPENDED" | "REJECTED";

export type EventStatus =
  | "DRAFT"
  | "PENDING_APPROVAL"
  | "PUBLISHED"
  | "REGISTRATION_OPEN"
  | "REGISTRATION_CLOSED"
  | "COMPLETED"
  | "REJECTED"
  | "CANCELLED"
  | "ARCHIVED";

export type LocationType = "IN_PERSON" | "ONLINE" | "HYBRID";
export type EventVisibility = "public" | "private" | "unlisted";

export type TicketVisibility = "PUBLIC" | "HIDDEN" | "INVITE_ONLY" | "CLUB_ONLY";

export type TicketStatus = "ACTIVE" | "PENDING" | "CANCELLED" | "REFUNDED" | "TRANSFERRED" | "VOID";

export type OrderStatus =
  | "PENDING"
  | "PAYMENT_PENDING"
  | "PAID"
  | "PARTIALLY_REFUNDED"
  | "REFUNDED"
  | "CANCELLED"
  | "FAILED"
  | "EXPIRED";

export type PaymentStatus =
  | "CREATED"
  | "AUTHORIZED"
  | "CAPTURED"
  | "FAILED"
  | "REFUNDED"
  | "PARTIALLY_REFUNDED";

export type PaymentProvider = "manual_upi" | "upi";

export type RefundStatus =
  | "REQUESTED"
  | "APPROVED"
  | "PROCESSING"
  | "PROCESSED"
  | "FAILED"
  | "REJECTED";

export type ReservationStatus = "ACTIVE" | "CONVERTED" | "EXPIRED" | "CANCELLED";

export type WaitlistStatus = "WAITING" | "NOTIFIED" | "CLAIMED" | "EXPIRED" | "CANCELLED";

export type TransferStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "EXPIRED" | "CANCELLED";

export type AttendeeStatus = "CONFIRMED" | "CANCELLED" | "REJECTED" | "PENDING";

export type SettlementStatus = "PENDING" | "PROCESSING" | "PAID" | "FAILED" | "ON_HOLD";

export type CampaignStatus = "DRAFT" | "SCHEDULED" | "SENDING" | "SENT" | "FAILED";

export type NotificationChannel = "EMAIL" | "WHATSAPP" | "PUSH" | "IN_APP";

export type DiscountType = "percentage" | "fixed";

export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "email"
  | "phone"
  | "date"
  | "dropdown"
  | "radio"
  | "checkbox"
  | "multi_select"
  | "file_upload";

export type EventPermission =
  | "MANAGE_EVENT"
  | "MANAGE_TICKETS"
  | "MANAGE_REGISTRATION_FORM"
  | "VIEW_ATTENDEES"
  | "EXPORT_ATTENDEES"
  | "VERIFY_PAYMENTS"
  | "ISSUE_MANUAL_TICKETS"
  | "MANAGE_COUPONS"
  | "MANAGE_WAITLIST"
  | "CHECK_IN"
  | "VIEW_ANALYTICS"
  | "SEND_COMMUNICATIONS"
  | "MANAGE_EVENT_TEAM"
  | "MANAGE_SPONSORS"
  | "VIEW_FINANCIALS";

// ─── TABLE TYPES ──────────────────────────────────────────────────────────────

export interface Profile {
  id: string;                    // Clerk user ID
  email: string;
  full_name: string;
  role: UserRole;
  status: UserStatus;
  image_url: string | null;
  bio: string;
  home_club_id: string | null;
  designation: string;
  created_at: string;
  updated_at: string;
}

export interface Club {
  id: string;
  name: string;
  city: string;
  district: string;
  status: string;
  contact_email: string | null;
  logo_url: string | null;
  description: string | null;
  website_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface EventCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon_url: string | null;
  sort_order: number;
  created_at: string;
}

export interface Event {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  full_description: string | null;
  banner_url: string | null;
  thumbnail_url: string | null;
  start_date: string;
  end_date: string;
  timezone: string;
  visibility: EventVisibility;
  location_type: LocationType;
  venue_name: string | null;
  venue_description: string | null;
  country: string;
  state: string | null;
  city: string | null;
  address: string | null;
  pincode: string | null;
  google_maps_url: string | null;
  latitude: number | null;
  longitude: number | null;
  online_platform: string | null;
  online_url: string | null;
  online_instructions: string | null;
  category_id: string | null;
  tags: string[];
  capacity: number;
  organizer_id: string;
  host_club_id: string | null;
  contact_email: string;
  contact_phone: string | null;
  status: EventStatus;
  registrations_disabled: boolean;
  registration_open_at: string | null;
  registration_close_at: string | null;
  cancellation_policy: string | null;
  refund_policy: string | null;
  terms_and_conditions: string | null;
  event_rules: string | null;
  attendee_instructions: string | null;
  enable_manual_upi: boolean;
  upi_vpa: string | null;
  upi_qr_url: string | null;
  enable_waitlist: boolean;
  enable_certificates: boolean;
  enable_feedback: boolean;
  is_featured: boolean;
  rejection_reason: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface EventTeamMember {
  id: string;
  event_id: string;
  user_id: string;
  permissions: EventPermission[];
  status: "ACTIVE" | "INACTIVE";
  invited_by: string | null;
  created_at: string;
}

export interface EventSession {
  id: string;
  event_id: string;
  title: string;
  description: string | null;
  speaker: string | null;
  start_time: string;
  end_time: string;
  location: string | null;
  sort_order: number;
  created_at: string;
}

export interface TicketTier {
  id: string;
  event_id: string;
  name: string;
  description: string | null;
  price: string;                 // NUMERIC(12,2) stored as string
  currency: string;
  capacity: number;
  sold_count: number;
  reserved_count: number;
  minimum_quantity: number;
  maximum_quantity: number;
  max_per_order?: number;
  sales_start: string | null;
  sales_end: string | null;
  visibility: TicketVisibility;
  access_code: string | null;
  enabled: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface InventoryReservation {
  id: string;
  event_id: string;
  ticket_tier_id: string;
  order_id: string;
  quantity: number;
  status: ReservationStatus;
  expires_at: string;
  created_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string;
  event_id: string;
  currency: string;
  subtotal: string;              // NUMERIC(12,2) as string
  discount_amount: string;
  tax_amount: string;
  platform_fee: string;
  gateway_fee: string;
  total_amount: string;
  payment_status: PaymentStatus;
  order_status: OrderStatus;
  payment_method: string | null;
  gateway: string | null;
  gateway_order_id: string | null;
  coupon_id: string | null;
  billing_details: BillingDetails | null;
  idempotency_key: string | null;
  created_at: string;
  updated_at: string;
}

export interface BillingDetails {
  full_name: string;
  email: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  gstin: string | null;
  company_name: string | null;
}

export interface OrderItem {
  id: string;
  order_id: string;
  ticket_tier_id: string;
  quantity: number;
  unit_price: string;
  discount_amount: string;
  tax_amount: string;
  total_amount: string;
}

export interface Payment {
  id: string;
  order_id: string;
  provider: PaymentProvider;
  provider_payment_id: string | null;
  provider_order_id: string | null;
  amount: string;
  currency: string;
  status: PaymentStatus;
  method: string | null;
  raw_response: Record<string, unknown> | null;  // Never expose to frontend
  receipt_url: string | null;                     // Manual UPI receipt
  verified_at: string | null;
  verified_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Ticket {
  id: string;
  order_id: string | null;
  event_id: string;
  tier_id: string | null;
  owner_user_id: string;
  attendee_id: string | null;
  ticket_code: string;
  qr_token_hash: string;         // SHA-256 of the raw QR token — never expose hash
  price_paid: string;
  status: TicketStatus;
  issued_at: string;
  cancelled_at: string | null;
  transferred_at: string | null;
}

export interface Attendee {
  id: string;
  event_id: string;
  ticket_id: string | null;
  purchaser_user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  club_id: string | null;
  designation: string | null;
  status: AttendeeStatus;
  registered_at: string;
  updated_at: string;
}

export interface RegistrationField {
  id: string;
  event_id: string;
  field_key: string;
  label: string;
  field_type: FieldType;
  required: boolean;
  help_text: string | null;
  options: string[] | null;
  validation: Record<string, unknown> | null;
  conditional_logic: Record<string, unknown> | null;
  display_order: number;
}

export interface RegistrationAnswer {
  id: string;
  attendee_id: string;
  field_id: string;
  value: unknown;
  created_at: string;
}

export interface Refund {
  id: string;
  order_id: string;
  payment_id: string | null;
  amount: string;
  reason: string | null;
  status: RefundStatus;
  provider_refund_id: string | null;
  requested_by: string;
  approved_by: string | null;
  created_at: string;
  processed_at: string | null;
}

export interface Coupon {
  id: string;
  event_id: string | null;
  code: string;
  discount_type: DiscountType;
  discount_value: string;
  max_discount: string | null;
  minimum_order_value: string | null;
  usage_limit: number | null;
  per_user_limit: number;
  valid_from: string | null;
  valid_until: string | null;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface CouponRedemption {
  id: string;
  coupon_id: string;
  order_id: string;
  user_id: string;
  discount_amount: string;
  created_at: string;
}

export interface WaitlistEntry {
  id: string;
  event_id: string;
  ticket_tier_id: string | null;
  user_id: string;
  position: number;
  status: WaitlistStatus;
  notified_at: string | null;
  expires_at: string | null;
  created_at: string;
}

export interface CheckIn {
  id: string;
  event_id: string;
  ticket_id: string;
  attendee_id: string | null;
  checked_in_by: string;
  device_id: string | null;
  gate: string | null;
  checked_in_at: string;
}

export interface TicketTransfer {
  id: string;
  ticket_id: string;
  from_user_id: string;
  to_user_id: string | null;
  recipient_email: string;
  status: TransferStatus;
  token_hash: string | null;
  expires_at: string | null;
  accepted_at: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_user_id: string;
  actor_email: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  details: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface WebhookEvent {
  id: string;
  provider: string;
  provider_event_id: string;
  event_type: string;
  payload: Record<string, unknown> | null;
  status: "RECEIVED" | "PROCESSED" | "FAILED";
  processed_at: string | null;
  created_at: string;
}

export interface Settlement {
  id: string;
  organizer_id: string;
  event_id: string;
  gross_amount: string;
  refund_amount: string;
  gateway_fee: string;
  platform_fee: string;
  tax: string;
  net_amount: string;
  status: SettlementStatus;
  payout_reference: string | null;
  settled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Certificate {
  id: string;
  event_id: string;
  attendee_id: string;
  certificate_number: string;
  verification_token: string;    // public verification token (not hash)
  pdf_url: string | null;
  issued_at: string;
}

export interface FeedbackForm {
  id: string;
  event_id: string;
  title: string;
  is_active: boolean;
  created_at: string;
}

export interface FeedbackQuestion {
  id: string;
  form_id: string;
  question_text: string;
  question_type: "rating" | "text" | "nps" | "multiple_choice";
  options: string[] | null;
  required: boolean;
  sort_order: number;
}

export interface FeedbackResponse {
  id: string;
  form_id: string;
  attendee_id: string;
  answers: Record<string, unknown>;
  submitted_at: string;
}

export interface Sponsor {
  id: string;
  event_id: string;
  company_name: string;
  logo_url: string | null;
  description: string | null;
  website_url: string | null;
  contact_email: string | null;
  tier: "title" | "gold" | "silver" | "bronze" | "community";
  created_at: string;
}

export interface Campaign {
  id: string;
  event_id: string;
  organizer_id: string;
  subject: string;
  body: string;
  status: CampaignStatus;
  scheduled_at: string | null;
  sent_at: string | null;
  recipient_count: number;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  channel: NotificationChannel;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  read_at: string | null;
  sent_at: string | null;
  created_at: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  order_id: string;
  taxable_amount: string;
  cgst: string;
  sgst: string;
  igst: string;
  total: string;
  billing_name: string;
  billing_email: string;
  billing_address: string | null;
  gstin: string | null;
  pdf_url: string | null;
  issued_at: string;
}

export interface ReferralCode {
  id: string;
  user_id: string;
  event_id: string | null;
  code: string;
  uses: number;
  created_at: string;
}

export interface SystemSetting {
  key: string;
  value: string;
  updated_at: string;
}

// ─── DATABASE TYPE (for Supabase client) ─────────────────────────────────────

export type Database = {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Omit<Profile, "created_at" | "updated_at">; Update: Partial<Profile> };
      clubs: { Row: Club; Insert: Omit<Club, "id" | "created_at" | "updated_at">; Update: Partial<Club> };
      event_categories: { Row: EventCategory; Insert: Omit<EventCategory, "id" | "created_at">; Update: Partial<EventCategory> };
      events: { Row: Event; Insert: Omit<Event, "id" | "created_at" | "updated_at">; Update: Partial<Event> };
      event_team_members: { Row: EventTeamMember; Insert: Omit<EventTeamMember, "id" | "created_at">; Update: Partial<EventTeamMember> };
      event_sessions: { Row: EventSession; Insert: Omit<EventSession, "id" | "created_at">; Update: Partial<EventSession> };
      ticket_tiers: { Row: TicketTier; Insert: Omit<TicketTier, "id" | "sold_count" | "reserved_count" | "created_at" | "updated_at">; Update: Partial<TicketTier> };
      inventory_reservations: { Row: InventoryReservation; Insert: Omit<InventoryReservation, "id" | "created_at">; Update: Partial<InventoryReservation> };
      orders: { Row: Order; Insert: Omit<Order, "id" | "created_at" | "updated_at">; Update: Partial<Order> };
      order_items: { Row: OrderItem; Insert: Omit<OrderItem, "id">; Update: Partial<OrderItem> };
      payments: { Row: Payment; Insert: Omit<Payment, "id" | "created_at" | "updated_at">; Update: Partial<Payment> };
      tickets: { Row: Ticket; Insert: Omit<Ticket, "id" | "issued_at">; Update: Partial<Ticket> };
      attendees: { Row: Attendee; Insert: Omit<Attendee, "id" | "registered_at" | "updated_at">; Update: Partial<Attendee> };
      registration_fields: { Row: RegistrationField; Insert: Omit<RegistrationField, "id">; Update: Partial<RegistrationField> };
      registration_answers: { Row: RegistrationAnswer; Insert: Omit<RegistrationAnswer, "id" | "created_at">; Update: Partial<RegistrationAnswer> };
      refunds: { Row: Refund; Insert: Omit<Refund, "id" | "created_at">; Update: Partial<Refund> };
      coupons: { Row: Coupon; Insert: Omit<Coupon, "id" | "created_at" | "updated_at">; Update: Partial<Coupon> };
      coupon_redemptions: { Row: CouponRedemption; Insert: Omit<CouponRedemption, "id" | "created_at">; Update: Partial<CouponRedemption> };
      waitlist_entries: { Row: WaitlistEntry; Insert: Omit<WaitlistEntry, "id" | "created_at">; Update: Partial<WaitlistEntry> };
      check_ins: { Row: CheckIn; Insert: Omit<CheckIn, "id" | "checked_in_at">; Update: Partial<CheckIn> };
      ticket_transfers: { Row: TicketTransfer; Insert: Omit<TicketTransfer, "id" | "created_at">; Update: Partial<TicketTransfer> };
      audit_logs: { Row: AuditLog; Insert: Omit<AuditLog, "id" | "created_at">; Update: Partial<AuditLog> };
      webhook_events: { Row: WebhookEvent; Insert: Omit<WebhookEvent, "id" | "created_at">; Update: Partial<WebhookEvent> };
      settlements: { Row: Settlement; Insert: Omit<Settlement, "id" | "created_at" | "updated_at">; Update: Partial<Settlement> };
      certificates: { Row: Certificate; Insert: Omit<Certificate, "id" | "issued_at">; Update: Partial<Certificate> };
      feedback_forms: { Row: FeedbackForm; Insert: Omit<FeedbackForm, "id" | "created_at">; Update: Partial<FeedbackForm> };
      feedback_questions: { Row: FeedbackQuestion; Insert: Omit<FeedbackQuestion, "id">; Update: Partial<FeedbackQuestion> };
      feedback_responses: { Row: FeedbackResponse; Insert: Omit<FeedbackResponse, "id" | "submitted_at">; Update: Partial<FeedbackResponse> };
      sponsors: { Row: Sponsor; Insert: Omit<Sponsor, "id" | "created_at">; Update: Partial<Sponsor> };
      campaigns: { Row: Campaign; Insert: Omit<Campaign, "id" | "created_at" | "updated_at">; Update: Partial<Campaign> };
      notifications: { Row: Notification; Insert: Omit<Notification, "id" | "created_at">; Update: Partial<Notification> };
      invoices: { Row: Invoice; Insert: Omit<Invoice, "id" | "issued_at">; Update: Partial<Invoice> };
      referral_codes: { Row: ReferralCode; Insert: Omit<ReferralCode, "id" | "created_at">; Update: Partial<ReferralCode> };
      system_settings: { Row: SystemSetting; Insert: SystemSetting; Update: Partial<SystemSetting> };
    };
  };
};
