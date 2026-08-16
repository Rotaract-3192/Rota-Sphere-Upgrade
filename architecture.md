# RotaSphere --- Complete Event Booking & Event Management Platform Architecture

**Version:** 2.0.0\
**Document Type:** Full Product, System Architecture & Technical
Specification\
**Platform:** RotaSphere\
**Primary Use Case:** KonfHub-style event discovery, registration,
ticketing, payments, event operations, analytics and district/event
management\
**Target Organization:** Rotaract District 3192, with architecture
designed to support expansion to other organizations and independent
event organizers.

------------------------------------------------------------------------

## 0. Purpose of This Document

This document is the authoritative implementation blueprint for
RotaSphere.

The Antigravity coding agent MUST treat this file as the source of truth
for:

-   application architecture
-   database design
-   authentication
-   authorization
-   event creation
-   ticketing
-   inventory management
-   orders
-   payments
-   refunds
-   coupons
-   waitlists
-   attendee registration
-   QR tickets
-   check-in
-   offline check-in
-   organizer management
-   admin governance
-   notifications
-   analytics
-   invoices
-   settlements
-   certificates
-   feedback
-   referrals
-   sponsor/exhibitor functionality
-   security
-   deployment
-   observability
-   API/server actions
-   validation
-   error handling
-   testing

Do not implement only the visible UI. The system must be designed around
transactional correctness, security, concurrency, recoverability and
maintainability.

The platform must be production-oriented even when an external
integration is temporarily unavailable.

------------------------------------------------------------------------

# 1. Product Vision

RotaSphere is a complete event-management and event-commerce platform.

It should allow:

1.  Guests to discover events.
2.  Users to register and maintain profiles.
3.  Organizers to create and manage events.
4.  Organizers to configure ticket tiers.
5.  Attendees to purchase tickets.
6.  The platform to process online payments.
7.  Attendees to submit manual UPI payments where enabled.
8.  Organizers to approve manual payments.
9.  The platform to generate digital tickets and QR codes.
10. Registration teams to scan tickets at the venue.
11. Events to support capacity limits and ticket inventory.
12. Organizers to create custom registration forms.
13. Organizers to use coupons and access codes.
14. Full/partial refunds to be processed.
15. Tickets to be cancelled or transferred.
16. Users to join waitlists for sold-out events.
17. Organizers to communicate with attendees.
18. Admins to approve events and govern users.
19. Platform administrators to view financial and operational analytics.
20. Organizers to download/export attendee data.
21. Events to issue certificates.
22. Attendees to submit post-event feedback.
23. Organizers to manage teams and event-specific permissions.
24. Sponsors/exhibitors to be supported as an extensible module.
25. The system to maintain a complete audit trail.

------------------------------------------------------------------------

# 2. Core Architectural Principles

## 2.1 Server Is the Source of Truth

Never trust:

-   frontend price calculations
-   frontend ticket availability
-   frontend roles
-   frontend payment status
-   frontend attendee counts
-   frontend coupon validity
-   frontend event status
-   frontend check-in status

Every important operation MUST be validated server-side.

------------------------------------------------------------------------

## 2.2 Database Transactions Are Required for Financial Operations

The following operations MUST be transactional:

-   order creation
-   inventory reservation
-   payment confirmation
-   ticket issuance
-   refund creation
-   ticket cancellation
-   ticket transfer
-   coupon redemption
-   waitlist promotion
-   settlement calculations

Never implement:

``` text
SELECT available capacity
IF capacity > 0
INSERT ticket
UPDATE sold_count
```

as separate unprotected operations.

Use database transactions, row locks, atomic updates or PostgreSQL
functions.

------------------------------------------------------------------------

## 2.3 Idempotency

Every payment/order operation must be idempotent.

If the same request is submitted twice, the platform must not:

-   create duplicate orders
-   create duplicate tickets
-   charge twice
-   increment inventory twice
-   issue duplicate refunds
-   check in the same attendee twice

Use:

-   idempotency keys
-   unique database constraints
-   gateway transaction IDs
-   webhook event IDs

------------------------------------------------------------------------

## 2.4 Money Must Never Be Stored as Floating Point

Use:

``` text
NUMERIC(12,2)
```

for monetary amounts.

Store:

-   subtotal
-   discount
-   tax
-   gateway fee
-   platform fee
-   refund amount
-   net amount

Never calculate financial values using JavaScript floating-point
arithmetic without decimal-safe handling.

------------------------------------------------------------------------

## 2.5 Timezone

All timestamps MUST be stored as:

``` text
TIMESTAMPTZ
```

The event has an explicit timezone.

Default:

``` text
Asia/Kolkata
```

The UI may display localized times, but the database stores
timezone-aware timestamps.

------------------------------------------------------------------------

# 3. Technology Stack

## Frontend

-   Next.js 16+
-   App Router
-   React 19+
-   TypeScript
-   Tailwind CSS
-   Framer Motion
-   shadcn/ui
-   Lucide React

## Visual / Maps

-   Three.js
-   React Three Fiber
-   MapLibre GL
-   Ola Maps API

3D effects must never block core functionality or make the platform
unusable on low-end devices.

Provide reduced-motion and performance-friendly fallbacks.

## Authentication

-   Clerk
-   Clerk sessions/JWT
-   OAuth where enabled
-   Email/password where enabled
-   Clerk webhooks for lifecycle synchronization

## Database

-   Supabase PostgreSQL

## Storage

-   Supabase Storage

Buckets should be separated by purpose where appropriate:

``` text
event-media
payment-receipts
ticket-assets
certificates
invoices
sponsor-assets
```

Private files must use signed URLs.

## Payments

Primary:

-   Razorpay

Alternative/manual:

-   UPI QR/VPA manual payment

Payment gateway code must be isolated behind a payment service interface
so another gateway can be added later.

## Email

-   Nodemailer / SMTP

The notification layer must be provider-agnostic.

## Deployment

-   Docker
-   DigitalOcean App Platform or equivalent container platform
-   Git-based CI/CD

## Validation

Use Zod or an equivalent strict schema-validation library for all
externally supplied input.

------------------------------------------------------------------------

# 4. High-Level Architecture

``` text
                           ┌─────────────────────────┐
                           │       USER BROWSER      │
                           │ Next.js + React + TS    │
                           └────────────┬────────────┘
                                        │ HTTPS
                                        ▼
                           ┌─────────────────────────┐
                           │      NEXT.JS APP        │
                           │ Server Actions / API    │
                           │ Middleware / Services   │
                           └───────┬─────────┬───────┘
                                   │         │
                     ┌─────────────┘         └──────────────┐
                     ▼                                      ▼
             ┌───────────────┐                     ┌────────────────┐
             │ Clerk         │                     │ External APIs  │
             │ Authentication│                     │ Razorpay       │
             └───────────────┘                     │ Ola Maps       │
                                                   │ SMTP           │
                                                   └────────────────┘
                                   │
                                   ▼
                         ┌─────────────────────┐
                         │ Supabase PostgreSQL │
                         │ Transactional Data  │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │ Supabase Storage    │
                         │ Private Assets      │
                         └─────────────────────┘
```

------------------------------------------------------------------------

# 5. Domain Architecture

The platform should be divided into these domains:

``` text
Identity
 ├── users
 ├── profiles
 ├── roles
 └── permissions

Events
 ├── events
 ├── event_categories
 ├── event_team_members
 ├── event_sessions
 └── event_media

Ticketing
 ├── ticket_tiers
 ├── inventory
 ├── tickets
 ├── ticket_transfers
 └── ticket_access_codes

Commerce
 ├── orders
 ├── order_items
 ├── payments
 ├── refunds
 ├── invoices
 ├── coupons
 └── coupon_redemptions

Registration
 ├── attendees
 ├── registration_fields
 ├── registration_answers
 └── waitlist_entries

Operations
 ├── check_ins
 ├── check_in_devices
 └── event_staff

Communication
 ├── notifications
 ├── notification_templates
 ├── campaigns
 └── campaign_recipients

Finance
 ├── settlements
 ├── payouts
 └── financial_ledger

Engagement
 ├── feedback_forms
 ├── feedback_responses
 ├── certificates
 └── referrals

Partners
 ├── sponsors
 ├── sponsorship_packages
 ├── exhibitors
 └── sponsor_leads

Governance
 ├── audit_logs
 ├── webhook_events
 └── system_events
```

------------------------------------------------------------------------

# 6. User Roles

## 6.1 Super Admin

Full platform control.

Capabilities:

-   manage all users
-   manage all organizers
-   promote/demote admins
-   approve/reject users
-   suspend users
-   approve/reject events
-   access all events
-   access all financial data
-   access settlements
-   access audit logs
-   configure platform settings
-   manage categories
-   manage clubs
-   manage coupons
-   manage platform-wide campaigns

------------------------------------------------------------------------

## 6.2 Admin

Platform administrator with restricted administrative permissions.

Capabilities:

-   review events
-   manage organizers
-   manage users
-   view analytics
-   access event operations
-   manage platform content
-   access permitted financial information

Admin MUST NOT be able to create or promote another Super Admin.

------------------------------------------------------------------------

## 6.3 Organizer

Can manage events they own or events for which they have explicit
event-team permissions.

Capabilities:

-   create events
-   edit events
-   configure tickets
-   manage attendees
-   verify manual payments
-   issue manual tickets
-   manage check-in
-   view event analytics
-   export attendee data
-   send event communications
-   manage permitted event team members

------------------------------------------------------------------------

## 6.4 Event Staff

Event-level role, not a platform role.

Examples:

-   Registration Lead
-   Check-in Staff
-   Finance Staff
-   Event Manager
-   Marketing Staff

Permissions are assigned per event.

------------------------------------------------------------------------

## 6.5 Attendee

Can:

-   browse events
-   manage profile
-   register
-   purchase tickets
-   view tickets
-   cancel where allowed
-   request transfers
-   join waitlists
-   view invoices
-   download certificates
-   submit feedback

------------------------------------------------------------------------

## 6.6 Guest

Unauthenticated user.

Can:

-   browse events
-   search
-   filter
-   view event details
-   view public organizer information

Cannot purchase tickets unless explicitly configured for guest checkout.

------------------------------------------------------------------------

# 7. RBAC and Event-Level Permissions

Platform role and event permission MUST be separate.

Example:

``` text
Platform Role: Organizer

Event A:
  MANAGE_EVENT
  MANAGE_TICKETS
  VIEW_ATTENDEES
  VERIFY_PAYMENTS
  CHECK_IN
  VIEW_ANALYTICS

Event B:
  CHECK_IN
```

Never grant platform-wide Organizer privileges simply because a user is
part of an event team.

Permissions:

``` text
MANAGE_EVENT
MANAGE_TICKETS
MANAGE_REGISTRATION_FORM
VIEW_ATTENDEES
EXPORT_ATTENDEES
VERIFY_PAYMENTS
ISSUE_MANUAL_TICKETS
MANAGE_COUPONS
MANAGE_WAITLIST
CHECK_IN
VIEW_ANALYTICS
SEND_COMMUNICATIONS
MANAGE_EVENT_TEAM
MANAGE_SPONSORS
VIEW_FINANCIALS
```

------------------------------------------------------------------------

# 8. Event Lifecycle

``` text
DRAFT
  ↓
PENDING_APPROVAL
  ↓
PUBLISHED
  ↓
REGISTRATION_OPEN
  ↓
REGISTRATION_CLOSED
  ↓
COMPLETED
```

Alternative terminal states:

``` text
REJECTED
CANCELLED
ARCHIVED
```

Event statuses must be explicit.

Do not infer status only from dates.

------------------------------------------------------------------------

# 9. Event Creation

Event creation should be a multi-step wizard.

## Step 1 --- Basic Information

Fields:

-   title
-   short description
-   full description
-   category
-   tags
-   host club
-   organizer
-   event visibility
-   event slug
-   banner
-   thumbnail

Slug requirements:

-   unique
-   URL-safe
-   immutable by default after publication
-   redirect support if changed

------------------------------------------------------------------------

## Step 2 --- Schedule

Fields:

-   start date/time
-   end date/time
-   timezone
-   registration open date
-   registration close date

Validation:

``` text
registration_open < registration_close
registration_close <= event_start
event_start < event_end
```

------------------------------------------------------------------------

## Step 3 --- Location

Supported:

``` text
IN_PERSON
ONLINE
HYBRID
```

In-person:

-   venue name
-   address
-   city
-   state
-   country
-   pincode
-   latitude
-   longitude
-   map URL

Online:

-   platform
-   meeting URL
-   meeting instructions

Hybrid:

-   both sets of information

Never expose private meeting URLs publicly unless event configuration
permits it.

------------------------------------------------------------------------

## Step 4 --- Capacity and Ticket Tiers

Configure:

-   total capacity
-   ticket tiers
-   tier capacity
-   price
-   sales start
-   sales end
-   minimum purchase
-   maximum purchase
-   visibility
-   access code
-   enabled/disabled

Example:

``` text
Early Bird
₹499
Capacity 100
Max per order 5
Sales: Aug 1–Aug 10

Regular
₹799
Capacity 300

VIP
₹1499
Capacity 50
```

------------------------------------------------------------------------

## Step 5 --- Registration Form

Organizer can create custom fields.

Supported:

-   text
-   textarea
-   number
-   email
-   phone
-   date
-   dropdown
-   radio
-   checkbox
-   multi-select
-   file upload

Each field supports:

-   label
-   help text
-   required
-   validation
-   options
-   display order
-   conditional visibility

------------------------------------------------------------------------

## Step 6 --- Contact and Guidelines

-   organizer name
-   email
-   phone
-   terms
-   event rules
-   cancellation policy
-   refund policy
-   attendee instructions

------------------------------------------------------------------------

## Step 7 --- Review

Show complete event preview before submission.

------------------------------------------------------------------------

# 10. Event Discovery

Public discovery must support:

-   keyword search
-   title search
-   city
-   category
-   tags
-   event type
-   date range
-   price range
-   free/paid
-   online/in-person/hybrid
-   organizer
-   club

Views:

-   grid
-   list
-   map
-   calendar

Map:

-   marker clustering
-   event pins
-   click-to-open event
-   location filtering

Calendar:

-   month
-   week
-   event cards
-   date filtering

------------------------------------------------------------------------

# 11. Event Page

Each event page must show:

-   event banner
-   title
-   organizer
-   category
-   date
-   timezone
-   location
-   map
-   event description
-   schedule
-   ticket tiers
-   availability
-   registration deadline
-   refund policy
-   organizer contact
-   social sharing metadata
-   FAQ
-   sponsors where enabled

CTA states:

``` text
Register Now
Sold Out
Join Waitlist
Registration Closed
Event Cancelled
Registration Paused
```

------------------------------------------------------------------------

# 12. Ticket Tier Architecture

Do NOT store ticket tiers only as JSONB inside `events`.

Use a dedicated table.

Each tier:

``` text
id
event_id
name
description
price
currency
capacity
sold_count
reserved_count
minimum_quantity
maximum_quantity
sales_start
sales_end
enabled
visibility
access_code
sort_order
created_at
updated_at
```

------------------------------------------------------------------------

# 13. Inventory Management

Inventory must be concurrency-safe.

Definitions:

``` text
capacity
sold_count
reserved_count
available = capacity - sold_count - reserved_count
```

When a user starts checkout:

``` text
available inventory
        ↓
temporary reservation
        ↓
payment window
        ↓
payment success → sold
payment failure/timeout → release
```

Reservations require:

``` text
inventory_reservations
```

Fields:

-   id
-   event_id
-   tier_id
-   order_id
-   quantity
-   expires_at
-   status

Statuses:

``` text
ACTIVE
CONVERTED
EXPIRED
CANCELLED
```

A background cleanup job must release expired reservations.

------------------------------------------------------------------------

# 14. Order Architecture

The order is the central commerce object.

Relationship:

``` text
USER
 ↓
ORDER
 ├── ORDER_ITEMS
 │     ├── TICKET_TIER
 │     └── quantity
 │
 ├── PAYMENT
 ├── REFUNDS
 └── TICKETS
```

Order fields:

``` text
id
order_number
user_id
event_id
currency
subtotal
discount_amount
tax_amount
platform_fee
gateway_fee
total_amount
payment_status
order_status
payment_method
gateway
gateway_order_id
coupon_id
billing_details
created_at
updated_at
```

Order statuses:

``` text
PENDING
PAYMENT_PENDING
PAID
PARTIALLY_REFUNDED
REFUNDED
CANCELLED
FAILED
EXPIRED
```

------------------------------------------------------------------------

# 15. Order Items

Each order item:

``` text
id
order_id
ticket_tier_id
quantity
unit_price
discount_amount
tax_amount
total_amount
```

Never rely on current ticket-tier price when displaying historical
orders.

Store the price snapshot at purchase time.

------------------------------------------------------------------------

# 16. Booking Flow

## Paid Online Booking

``` text
User selects ticket tier
        ↓
Server validates event
        ↓
Server validates tier
        ↓
Server validates inventory
        ↓
Server validates coupon
        ↓
Server calculates price
        ↓
Create order
        ↓
Reserve inventory
        ↓
Create Razorpay order
        ↓
User pays
        ↓
Razorpay webhook
        ↓
Verify signature
        ↓
Mark payment captured
        ↓
Mark order paid
        ↓
Convert reservation
        ↓
Generate tickets
        ↓
Generate QR
        ↓
Send confirmation
```

The frontend payment success callback is NOT the final source of truth.

------------------------------------------------------------------------

# 17. Razorpay Webhooks

Implement:

``` text
POST /api/webhooks/razorpay
```

Required:

-   signature verification
-   event ID deduplication
-   transaction-safe processing
-   logging
-   retry-safe behavior

Store processed webhook IDs.

Possible events:

-   payment.authorized
-   payment.captured
-   payment.failed
-   refund.created
-   refund.processed
-   order.paid

------------------------------------------------------------------------

# 18. Manual UPI Payments

For events that enable manual UPI:

``` text
Select Manual UPI
        ↓
Display QR/VPA
        ↓
User completes payment externally
        ↓
User uploads receipt
        ↓
Create PENDING order
        ↓
Upload receipt privately
        ↓
Create pending ticket records
        ↓
Organizer reviews
```

Never trust screenshot content automatically.

Organizer actions:

``` text
APPROVE
REJECT
```

Approval:

``` text
payment status → VERIFIED
order → PAID
tickets → ACTIVE
```

Rejection:

``` text
payment status → FAILED/REJECTED
order → CANCELLED
tickets → REJECTED
inventory → RELEASED
```

------------------------------------------------------------------------

# 19. Payment Records

Create a dedicated `payments` table.

Fields:

``` text
id
order_id
provider
provider_payment_id
provider_order_id
amount
currency
status
method
raw_response
verified_at
created_at
updated_at
```

Payment statuses:

``` text
CREATED
AUTHORIZED
CAPTURED
FAILED
REFUNDED
PARTIALLY_REFUNDED
```

Raw provider responses must be protected and must not be exposed to
normal users.

------------------------------------------------------------------------

# 20. Refund System

Refunds must be first-class records.

Fields:

``` text
id
order_id
payment_id
amount
reason
status
provider_refund_id
requested_by
approved_by
created_at
processed_at
```

Statuses:

``` text
REQUESTED
APPROVED
PROCESSING
PROCESSED
FAILED
REJECTED
```

Support:

-   full refunds
-   partial refunds
-   cancellation refunds
-   admin refunds
-   organizer-approved refunds
-   gateway refunds
-   manual refunds

Refund eligibility is governed by event policy.

------------------------------------------------------------------------

# 21. Cancellation

Attendee cancellation flow:

``` text
Ticket
 ↓
Cancel
 ↓
Check policy
 ↓
Calculate refund
 ↓
Confirm
 ↓
Cancel ticket
 ↓
Refund
 ↓
Release inventory
 ↓
Promote waitlist if applicable
```

Cancelled tickets must never be accepted at check-in.

------------------------------------------------------------------------

# 22. Ticket Transfers

Support:

``` text
Current owner
      ↓
Enter recipient email
      ↓
Transfer request
      ↓
Recipient accepts
      ↓
Ownership changes
      ↓
Old QR invalidated
      ↓
New ticket QR generated
```

Maintain transfer history.

Never overwrite ownership without an audit record.

------------------------------------------------------------------------

# 23. Ticket Generation

Each active ticket receives:

``` text
ticket_code
qr_token
```

QR token must not contain sensitive attendee information.

Use a cryptographically random token.

Ticket page/PDF includes:

-   event name
-   attendee name
-   ticket tier
-   ticket code
-   QR
-   date
-   venue
-   organizer
-   relevant instructions

------------------------------------------------------------------------

# 24. QR Check-In

Check-in must be server validated.

Flow:

``` text
Scanner
 ↓
QR token
 ↓
Server validation
 ↓
Ticket exists?
 ↓
Correct event?
 ↓
Ticket active?
 ↓
Already checked in?
 ↓
YES → reject duplicate
NO → create check-in
```

Check-in record:

``` text
id
ticket_id
attendee_id
event_id
checked_in_by
device_id
gate
checked_in_at
```

Duplicate scan must return a useful message:

``` text
Already checked in
Time: 10:42 AM
Gate: Main Gate
```

------------------------------------------------------------------------

# 25. Offline Check-In

Check-in devices may download an encrypted event-specific attendee
manifest.

Offline mode:

``` text
Download event data
 ↓
Local IndexedDB
 ↓
Scan QR
 ↓
Validate locally
 ↓
Record local check-in
 ↓
Connectivity restored
 ↓
Sync with server
```

Conflict resolution:

-   first valid server-confirmed check-in wins
-   duplicate local scans become duplicates
-   synchronization must be idempotent

Do not expose unrelated event data on the device.

------------------------------------------------------------------------

# 26. Custom Registration Forms

Events may define arbitrary registration fields.

Tables:

``` text
registration_fields
registration_answers
```

Example:

``` text
Question:
What is your T-shirt size?

Type:
dropdown

Options:
S, M, L, XL, XXL

Required:
true
```

Conditional fields:

``` text
Do you require accommodation?
YES

→ Show:
Accommodation date
Room preference
Dietary preference
```

File uploads must be:

-   private
-   type-validated
-   size-limited
-   virus/malware scanning where available
-   accessible only to authorized event staff

------------------------------------------------------------------------

# 27. Attendee Model

Attendee is separate from purchaser.

One purchaser can register:

``` text
Order
 ├── Aarcha
 ├── Bhavani
 └── Sanjay
```

Attendee fields:

``` text
id
event_id
ticket_id
purchaser_user_id
full_name
email
phone
club
designation
status
registered_at
```

Additional answers live in `registration_answers`.

------------------------------------------------------------------------

# 28. Coupons and Discounts

Coupon types:

-   percentage
-   fixed amount
-   early-bird
-   club-specific
-   user-specific
-   first-N
-   group
-   referral
-   hidden-access

Coupon fields:

``` text
id
code
event_id
discount_type
discount_value
max_discount
minimum_order_value
usage_limit
per_user_limit
valid_from
valid_until
enabled
```

Every redemption creates:

``` text
coupon_redemptions
```

Coupon validation must be server-side and transactional.

------------------------------------------------------------------------

# 29. Hidden Tickets and Access Codes

Ticket visibility:

``` text
PUBLIC
HIDDEN
INVITE_ONLY
CLUB_ONLY
```

Examples:

``` text
VIP2026
SPEAKERPASS
ROTARY3192
```

Access code validation must happen server-side.

------------------------------------------------------------------------

# 30. Waitlist

When a ticket tier is sold out:

``` text
Join Waitlist
```

Waitlist record:

``` text
id
event_id
ticket_tier_id
user_id
position
status
notified_at
expires_at
created_at
```

Statuses:

``` text
WAITING
NOTIFIED
CLAIMED
EXPIRED
CANCELLED
```

When inventory becomes available:

``` text
Next eligible user
 ↓
Notification
 ↓
Temporary reservation
 ↓
Payment
 ↓
Confirmed
```

The reservation must expire automatically.

------------------------------------------------------------------------

# 31. Organizer Team Management

Organizer can invite team members to an event.

Invitation:

``` text
email
event
permission set
expiry
status
```

Team member can only access permitted resources.

Example:

``` text
Registration Volunteer
→ VIEW_ATTENDEES
→ CHECK_IN

Finance Volunteer
→ VIEW_FINANCIALS
→ VERIFY_PAYMENTS

Marketing
→ SEND_COMMUNICATIONS
```

------------------------------------------------------------------------

# 32. Manual Ticket Issuance

Organizers can issue complimentary/manual tickets for:

-   speakers
-   VIPs
-   sponsors
-   district council
-   volunteers
-   special guests

Manual ticket must still create:

-   order-like financial record or zero-value order
-   ticket
-   attendee
-   QR
-   audit log

Never bypass the ticket system.

------------------------------------------------------------------------

# 33. Event Analytics

Organizer dashboard:

## Sales

-   gross revenue
-   net revenue
-   ticket sales
-   average order value
-   revenue by tier
-   revenue by day
-   revenue by source

## Registration

-   registrations
-   cancellations
-   refunds
-   waitlist
-   abandoned checkout
-   conversion rate

## Attendance

-   total checked in
-   attendance percentage
-   no-show percentage
-   check-in by hour
-   check-in by gate

## Attendee segmentation

-   club
-   designation
-   city
-   custom registration fields

## Marketing

Support UTM parameters:

``` text
utm_source
utm_medium
utm_campaign
utm_content
utm_term
```

------------------------------------------------------------------------

# 34. Platform Analytics

Super Admin dashboard:

-   total events
-   published events
-   total registrations
-   total tickets
-   gross GMV
-   platform revenue
-   refunds
-   active organizers
-   conversion rate
-   top events
-   top organizers
-   ticket-tier performance
-   daily/weekly/monthly trends

------------------------------------------------------------------------

# 35. Financial Settlement

Create settlement calculations:

``` text
Gross sales
- refunds
- gateway fees
- platform commission
- applicable taxes
= organizer payable
```

Settlement table:

``` text
id
organizer_id
event_id
gross_amount
refund_amount
gateway_fee
platform_fee
tax
net_amount
status
payout_reference
settled_at
```

Statuses:

``` text
PENDING
PROCESSING
PAID
FAILED
ON_HOLD
```

Financial records must be immutable wherever possible.

Corrections should create adjustment records rather than silently
modifying historical amounts.

------------------------------------------------------------------------

# 36. Invoices and GST

Support billing information:

-   billing name
-   email
-   phone
-   address
-   GSTIN
-   company name

Invoice:

``` text
invoice_number
order_id
taxable_amount
CGST
SGST
IGST
total
pdf_url
issued_at
```

Invoice numbers must be unique.

------------------------------------------------------------------------

# 37. Notifications

Create a centralized notification service.

Channels:

``` text
EMAIL
WHATSAPP
PUSH
IN_APP
```

Start with email if other channels are not configured.

Events:

-   booking created
-   payment pending
-   payment success
-   payment failed
-   payment approved
-   payment rejected
-   ticket issued
-   event reminder
-   event changed
-   event cancelled
-   refund requested
-   refund completed
-   ticket transferred
-   waitlist available
-   certificate issued

------------------------------------------------------------------------

# 38. Notification Templates

Templates should support variables:

``` text
{{attendee_name}}
{{event_name}}
{{ticket_code}}
{{event_date}}
{{venue}}
{{order_number}}
{{amount}}
```

Never concatenate untrusted HTML directly into templates.

Escape variables.

------------------------------------------------------------------------

# 39. Email Campaigns

Organizers can send event communications to selected audiences.

Filters:

-   all attendees
-   ticket tier
-   club
-   checked-in
-   not checked-in
-   waitlisted
-   custom registration field

Campaign model:

``` text
campaigns
campaign_recipients
```

Support:

-   draft
-   scheduled
-   sending
-   sent
-   failed

Rate-limit outgoing messages.

------------------------------------------------------------------------

# 40. Bulk Import / Export

Support CSV/XLSX import for:

-   attendees
-   invited guests
-   manual registrations

Import process:

``` text
Upload
 ↓
Parse
 ↓
Validate
 ↓
Preview errors
 ↓
Confirm
 ↓
Transactional import
```

Export:

-   attendees
-   tickets
-   orders
-   payments
-   check-ins
-   registration answers

Exports must be permission-controlled.

------------------------------------------------------------------------

# 41. Event Cancellation and Rescheduling

Cancellation:

``` text
Organizer request
 ↓
Policy validation
 ↓
Admin review if configured
 ↓
Event CANCELLED
 ↓
Disable registration
 ↓
Invalidate future checkout
 ↓
Notify attendees
 ↓
Process refunds
 ↓
Release inventory
```

Rescheduling:

``` text
Old schedule
 ↓
New schedule
 ↓
Notify all attendees
 ↓
Tickets remain valid unless policy says otherwise
```

------------------------------------------------------------------------

# 42. Feedback System

After event completion:

``` text
Attendee
 ↓
Feedback form
 ↓
Responses
 ↓
Organizer analytics
```

Support:

-   rating
-   text feedback
-   NPS-style question
-   custom questions

Organizer can export responses.

------------------------------------------------------------------------

# 43. Certificates

Certificates can be issued only to attendees who satisfy event criteria.

Possible criteria:

-   checked in
-   minimum attendance
-   selected ticket tiers

Certificate record:

``` text
id
event_id
attendee_id
certificate_number
verification_token
pdf_url
issued_at
```

Public verification:

``` text
/verify/certificate/{token}
```

Do not expose unnecessary attendee information on verification pages.

------------------------------------------------------------------------

# 44. Referral System

Users may receive referral codes.

Track:

``` text
referrer
referred_user
order
conversion
reward
```

Support:

-   referral leaderboards
-   referral codes
-   campaign-specific rewards

Never credit referrals for refunded/cancelled orders.

------------------------------------------------------------------------

# 45. Sponsor Module

Extensible module.

Sponsor:

``` text
company
logo
description
website
contact
tier
```

Sponsorship packages:

``` text
name
price
benefits
availability
```

Sponsors can receive:

-   event branding
-   booth information
-   attendee lead capture where legally permitted

------------------------------------------------------------------------

# 46. Exhibitor Module

Optional future module.

Features:

-   exhibitor profile
-   booth assignment
-   exhibitor staff
-   QR lead capture
-   lead export
-   booth status

------------------------------------------------------------------------

# 47. Lead Capture

If enabled:

``` text
Attendee QR
 ↓
Sponsor scans
 ↓
Consent check
 ↓
Lead created
```

Consent must be explicit.

Do not share attendee data with sponsors without appropriate consent and
policy controls.

------------------------------------------------------------------------

# 48. Clubs and Organization Directory

Because RotaSphere targets Rotaract District 3192, maintain:

``` text
clubs
```

Fields:

``` text
id
name
city
district
status
contact_email
```

Do not hardcode club information throughout the application.

Use database-managed organization data.

------------------------------------------------------------------------

# 49. Public Profile / Organizer Page

Organizer/club page may show:

-   name
-   logo
-   description
-   upcoming events
-   past events
-   social links
-   contact

Only approved/public information is displayed.

------------------------------------------------------------------------

# 50. Database Schema

## profiles

``` sql
CREATE TABLE profiles (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'attendee',
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    image_url TEXT,
    bio TEXT DEFAULT '',
    home_club_id UUID,
    designation TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

Roles:

``` text
super_admin
admin
organizer
attendee
```

Statuses:

``` text
ACTIVE
PENDING
SUSPENDED
REJECTED
```

------------------------------------------------------------------------

## events

``` sql
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    full_description TEXT,
    banner_url TEXT,
    thumbnail_url TEXT,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    visibility TEXT NOT NULL DEFAULT 'public',
    location_type TEXT NOT NULL,
    venue_name TEXT,
    venue_description TEXT,
    country TEXT DEFAULT 'India',
    state TEXT,
    city TEXT,
    address TEXT,
    pincode TEXT,
    google_maps_url TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    category_id UUID,
    tags TEXT[] DEFAULT '{}',
    capacity INTEGER NOT NULL,
    organizer_id TEXT NOT NULL,
    host_club_id UUID,
    contact_email TEXT NOT NULL,
    contact_phone TEXT,
    status TEXT NOT NULL DEFAULT 'DRAFT',
    registrations_disabled BOOLEAN NOT NULL DEFAULT FALSE,
    registration_open_at TIMESTAMPTZ,
    registration_close_at TIMESTAMPTZ,
    cancellation_policy TEXT,
    refund_policy TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

------------------------------------------------------------------------

## ticket_tiers

``` sql
CREATE TABLE ticket_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(12,2) NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'INR',
    capacity INTEGER NOT NULL,
    sold_count INTEGER NOT NULL DEFAULT 0,
    reserved_count INTEGER NOT NULL DEFAULT 0,
    minimum_quantity INTEGER NOT NULL DEFAULT 1,
    maximum_quantity INTEGER NOT NULL DEFAULT 10,
    sales_start TIMESTAMPTZ,
    sales_end TIMESTAMPTZ,
    visibility TEXT NOT NULL DEFAULT 'public',
    access_code TEXT,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

------------------------------------------------------------------------

## orders

``` sql
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number TEXT UNIQUE NOT NULL,
    user_id TEXT NOT NULL,
    event_id UUID NOT NULL REFERENCES events(id),
    currency TEXT NOT NULL DEFAULT 'INR',
    subtotal NUMERIC(12,2) NOT NULL,
    discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    tax_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    platform_fee NUMERIC(12,2) NOT NULL DEFAULT 0,
    gateway_fee NUMERIC(12,2) NOT NULL DEFAULT 0,
    total_amount NUMERIC(12,2) NOT NULL,
    payment_status TEXT NOT NULL DEFAULT 'PENDING',
    order_status TEXT NOT NULL DEFAULT 'PENDING',
    payment_method TEXT,
    gateway TEXT,
    gateway_order_id TEXT,
    coupon_id UUID,
    billing_details JSONB,
    idempotency_key TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

------------------------------------------------------------------------

## order_items

``` sql
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    ticket_tier_id UUID NOT NULL REFERENCES ticket_tiers(id),
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(12,2) NOT NULL,
    discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    tax_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    total_amount NUMERIC(12,2) NOT NULL
);
```

------------------------------------------------------------------------

## inventory_reservations

``` sql
CREATE TABLE inventory_reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id),
    ticket_tier_id UUID NOT NULL REFERENCES ticket_tiers(id),
    order_id UUID NOT NULL REFERENCES orders(id),
    quantity INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

------------------------------------------------------------------------

## payments

``` sql
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id),
    provider TEXT NOT NULL,
    provider_payment_id TEXT,
    provider_order_id TEXT,
    amount NUMERIC(12,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'INR',
    status TEXT NOT NULL,
    method TEXT,
    raw_response JSONB,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

------------------------------------------------------------------------

## tickets

``` sql
CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id),
    event_id UUID NOT NULL REFERENCES events(id),
    tier_id UUID REFERENCES ticket_tiers(id),
    owner_user_id TEXT NOT NULL,
    attendee_id UUID,
    ticket_code TEXT UNIQUE NOT NULL,
    qr_token_hash TEXT UNIQUE NOT NULL,
    price_paid NUMERIC(12,2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    cancelled_at TIMESTAMPTZ,
    transferred_at TIMESTAMPTZ
);
```

Ticket statuses:

``` text
ACTIVE
PENDING
CANCELLED
REFUNDED
TRANSFERRED
VOID
```

------------------------------------------------------------------------

## attendees

``` sql
CREATE TABLE attendees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id),
    purchaser_user_id TEXT NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    club_id UUID,
    designation TEXT,
    status TEXT NOT NULL DEFAULT 'CONFIRMED',
    registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

------------------------------------------------------------------------

## registration_fields

``` sql
CREATE TABLE registration_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    field_key TEXT NOT NULL,
    label TEXT NOT NULL,
    field_type TEXT NOT NULL,
    required BOOLEAN NOT NULL DEFAULT FALSE,
    help_text TEXT,
    options JSONB,
    validation JSONB,
    conditional_logic JSONB,
    display_order INTEGER NOT NULL DEFAULT 0
);
```

------------------------------------------------------------------------

## registration_answers

``` sql
CREATE TABLE registration_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attendee_id UUID NOT NULL REFERENCES attendees(id) ON DELETE CASCADE,
    field_id UUID NOT NULL REFERENCES registration_fields(id),
    value JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

------------------------------------------------------------------------

## refunds

``` sql
CREATE TABLE refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id),
    payment_id UUID REFERENCES payments(id),
    amount NUMERIC(12,2) NOT NULL,
    reason TEXT,
    status TEXT NOT NULL DEFAULT 'REQUESTED',
    provider_refund_id TEXT,
    requested_by TEXT NOT NULL,
    approved_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);
```

------------------------------------------------------------------------

## coupons

``` sql
CREATE TABLE coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    discount_type TEXT NOT NULL,
    discount_value NUMERIC(12,2) NOT NULL,
    max_discount NUMERIC(12,2),
    minimum_order_value NUMERIC(12,2),
    usage_limit INTEGER,
    per_user_limit INTEGER DEFAULT 1,
    valid_from TIMESTAMPTZ,
    valid_until TIMESTAMPTZ,
    enabled BOOLEAN NOT NULL DEFAULT TRUE
);
```

------------------------------------------------------------------------

## coupon_redemptions

``` sql
CREATE TABLE coupon_redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coupon_id UUID NOT NULL REFERENCES coupons(id),
    order_id UUID NOT NULL REFERENCES orders(id),
    user_id TEXT NOT NULL,
    discount_amount NUMERIC(12,2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(coupon_id, order_id)
);
```

------------------------------------------------------------------------

## waitlist_entries

``` sql
CREATE TABLE waitlist_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id),
    ticket_tier_id UUID REFERENCES ticket_tiers(id),
    user_id TEXT NOT NULL,
    position INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'WAITING',
    notified_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

------------------------------------------------------------------------

## check_ins

``` sql
CREATE TABLE check_ins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id),
    ticket_id UUID NOT NULL REFERENCES tickets(id),
    attendee_id UUID REFERENCES attendees(id),
    checked_in_by TEXT NOT NULL,
    device_id TEXT,
    gate TEXT,
    checked_in_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(ticket_id)
);
```

------------------------------------------------------------------------

## event_team_members

``` sql
CREATE TABLE event_team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    permissions TEXT[] NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(event_id, user_id)
);
```

------------------------------------------------------------------------

## ticket_transfers

``` sql
CREATE TABLE ticket_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES tickets(id),
    from_user_id TEXT NOT NULL,
    to_user_id TEXT,
    recipient_email TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING',
    token_hash TEXT UNIQUE,
    expires_at TIMESTAMPTZ,
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

------------------------------------------------------------------------

## audit_logs

``` sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_user_id TEXT NOT NULL,
    actor_email TEXT,
    action TEXT NOT NULL,
    target_type TEXT,
    target_id TEXT,
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

------------------------------------------------------------------------

## webhook_events

``` sql
CREATE TABLE webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider TEXT NOT NULL,
    provider_event_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    payload JSONB,
    status TEXT NOT NULL DEFAULT 'RECEIVED',
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(provider, provider_event_id)
);
```

------------------------------------------------------------------------

# 51. Additional Database Tables

The implementation should also create tables for:

``` text
clubs
event_categories
event_sessions
event_media
notifications
notification_templates
campaigns
campaign_recipients
invoices
settlements
payouts
financial_ledger
feedback_forms
feedback_questions
feedback_responses
certificates
referral_codes
referral_conversions
sponsors
sponsorship_packages
event_sponsors
exhibitors
sponsor_leads
check_in_devices
system_settings
```

Each must have:

-   primary key
-   foreign keys
-   created_at
-   updated_at where mutable
-   appropriate unique constraints
-   indexes
-   RLS policies

------------------------------------------------------------------------

# 52. Database Indexes

Create indexes for frequent queries.

At minimum:

``` text
events(status)
events(start_date)
events(city)
events(category_id)
events(organizer_id)

ticket_tiers(event_id)
tickets(event_id)
tickets(owner_user_id)
tickets(ticket_code)
tickets(status)

orders(user_id)
orders(event_id)
orders(order_number)
orders(payment_status)

attendees(event_id)
attendees(email)

check_ins(event_id)
check_ins(ticket_id)

waitlist_entries(event_id, ticket_tier_id, status)

audit_logs(actor_user_id)
audit_logs(target_id)
audit_logs(created_at)
```

------------------------------------------------------------------------

# 53. Supabase RLS

RLS MUST be enabled.

Examples:

## Attendee

Can read:

`text own profile own orders own tickets own registrations own invoices`

## Organizer

Can read/write:

`text events they own events they are team members of tickets belonging to those events attendees belonging to those events`

Only explicit event permissions grant access.

## Admin

Can access according to admin permissions.

## Super Admin

Full access.

Never use:

`text user.role === 'admin'`

in frontend as the only authorization mechanism.

------------------------------------------------------------------------

# 54. Supabase Service Role

The service-role key must:

-   exist only server-side
-   never be exposed to browser code
-   never use `NEXT_PUBLIC_`
-   never be embedded in client bundles

Use service-role access only for controlled server operations.

------------------------------------------------------------------------

# 55. API / Server Action Structure

Suggested structure:

``` text
src/
 ├── app/
 │   ├── api/
 │   │   ├── webhooks/
 │   │   │   └── razorpay/
 │   │   ├── tickets/
 │   │   ├── check-in/
 │   │   └── certificates/
 │   │
 │   ├── actions/
 │   │   ├── authActions.ts
 │   │   ├── eventActions.ts
 │   │   ├── ticketActions.ts
 │   │   ├── orderActions.ts
 │   │   ├── paymentActions.ts
 │   │   ├── refundActions.ts
 │   │   ├── couponActions.ts
 │   │   ├── waitlistActions.ts
 │   │   ├── attendeeActions.ts
 │   │   ├── checkInActions.ts
 │   │   ├── notificationActions.ts
 │   │   ├── analyticsActions.ts
 │   │   ├── certificateActions.ts
 │   │   ├── sponsorActions.ts
 │   │   └── adminActions.ts
 │
 ├── services/
 │   ├── payment/
 │   ├── ticketing/
 │   ├── inventory/
 │   ├── notifications/
 │   ├── invoices/
 │   ├── refunds/
 │   ├── certificates/
 │   └── analytics/
 │
 ├── lib/
 │   ├── auth/
 │   ├── db/
 │   ├── validation/
 │   ├── security/
 │   ├── logger/
 │   └── storage/
 │
 ├── components/
 ├── models/
 └── types/
```

------------------------------------------------------------------------

# 56. Service Layer

Do not put all business logic directly inside UI components.

Example:

``` text
UI
 ↓
Server Action
 ↓
Authorization
 ↓
Validation
 ↓
Domain Service
 ↓
Database Transaction
 ↓
External Provider
 ↓
Result
```

Example booking:

``` text
bookTicketAction()
      ↓
authorizeBooking()
      ↓
validateBooking()
      ↓
calculateOrder()
      ↓
reserveInventory()
      ↓
createOrder()
      ↓
createPayment()
```

------------------------------------------------------------------------

# 57. Error Handling

All server operations should return structured errors.

Example:

``` text
{
  success: false,
  code: "TICKET_SOLD_OUT",
  message: "This ticket tier is sold out."
}
```

Never expose:

-   SQL errors
-   service-role details
-   API secrets
-   stack traces
-   raw gateway errors

to end users.

Log technical details server-side.

------------------------------------------------------------------------

# 58. Validation

Validate:

-   email
-   phone
-   ticket quantity
-   prices
-   event dates
-   coupon codes
-   access codes
-   upload file types
-   upload sizes
-   URLs
-   location coordinates
-   GSTIN if collected
-   registration form values

All validation must occur server-side.

------------------------------------------------------------------------

# 59. File Upload Security

For payment receipts, IDs, certificates and other uploads:

-   restrict MIME type
-   restrict extension
-   restrict file size
-   rename files using generated IDs
-   do not trust original filenames
-   store privately
-   use signed URLs
-   authorize every download

Never store multi-megabyte Base64 images directly in localStorage.

Upload directly to storage/server and store only the storage path in the
database.

------------------------------------------------------------------------

# 60. Security

Implement:

-   Clerk authentication
-   Supabase RLS
-   server-side RBAC
-   event-level permissions
-   CSRF protection where applicable
-   rate limiting
-   Zod validation
-   secure HTTP headers
-   signed URLs
-   webhook signature verification
-   idempotency
-   audit logs
-   secret management
-   secure cookies
-   input sanitization
-   XSS protection
-   SQL injection protection through parameterized queries
-   upload validation

------------------------------------------------------------------------

# 61. Rate Limiting

Rate-limit:

-   login-related application endpoints
-   booking attempts
-   coupon validation
-   QR scanning
-   manual payment uploads
-   OTP/email operations if implemented
-   public search
-   webhook endpoints as appropriate

Use IP + user-based limits where appropriate.

------------------------------------------------------------------------

# 62. Audit Logging

Audit:

-   role changes
-   user suspension
-   event approval
-   event rejection
-   event cancellation
-   price changes
-   ticket tier changes
-   manual ticket issuance
-   payment verification
-   refunds
-   settlements
-   check-in overrides
-   attendee data exports
-   sponsor lead exports

Audit logs should be append-only.

------------------------------------------------------------------------

# 63. Observability

Production system must have:

-   structured logs
-   error tracking
-   request IDs
-   payment operation IDs
-   webhook processing logs
-   database error logs
-   performance monitoring

Every critical operation should have a correlation/request ID.

------------------------------------------------------------------------

# 64. Background Jobs

The architecture should support scheduled/background work.

Required jobs:

``` text
release expired inventory reservations
send event reminders
process waitlist notifications
send scheduled campaigns
generate certificates
retry failed notifications
process webhook retries
generate reports
```

If DigitalOcean does not provide a native scheduler for the deployment
configuration, use a secure scheduled endpoint/worker/cron service.

Never rely on a user opening the application to perform required
cleanup.

------------------------------------------------------------------------

# 65. Event Reminder System

Automatically send reminders:

``` text
7 days before
24 hours before
1 hour before
```

Only if configured.

Avoid duplicate reminders using notification delivery records.

------------------------------------------------------------------------

# 66. Mobile Responsiveness

All critical flows must work on mobile:

-   discovery
-   registration
-   payment
-   ticket viewing
-   QR display
-   check-in scanning
-   organizer dashboard
-   attendee management

Check-in UI should be optimized for phones/tablets.

------------------------------------------------------------------------

# 67. Accessibility

Implement:

-   keyboard navigation
-   semantic HTML
-   accessible form labels
-   visible focus states
-   sufficient contrast
-   reduced-motion support
-   screen-reader labels
-   accessible modals
-   accessible error messages

3D animations must not be required for navigation.

------------------------------------------------------------------------

# 68. Performance

Optimize:

-   image loading
-   map loading
-   3D effects
-   dashboard queries
-   event search
-   attendee tables

Use:

-   pagination
-   cursor-based pagination where appropriate
-   lazy loading
-   server-side filtering
-   database indexes
-   caching for public event discovery
-   debounced search

Never load 10,000 attendees into a browser at once.

------------------------------------------------------------------------

# 69. Pagination

Required for:

-   events
-   attendees
-   tickets
-   orders
-   payments
-   audit logs
-   notifications
-   campaigns
-   sponsors

Use server-side pagination.

------------------------------------------------------------------------

# 70. Search

Search should support:

``` text
event title
description
city
category
tags
organizer
club
```

Search results must be indexed appropriately.

------------------------------------------------------------------------

# 71. Organizer Dashboard

Dashboard sections:

``` text
Overview
Events
Create Event
Tickets
Orders
Attendees
Payments
Check-In
Coupons
Waitlist
Communications
Analytics
Team
Sponsors
Settings
```

------------------------------------------------------------------------

# 72. Admin Dashboard

Sections:

``` text
Overview
Users
Organizers
Events
Approvals
Financials
Settlements
Coupons
Clubs
Categories
Audit Logs
System Settings
```

------------------------------------------------------------------------

# 73. Attendee Dashboard

Sections:

``` text
Overview
My Tickets
My Orders
Upcoming Events
Past Events
Waitlists
Transfers
Invoices
Certificates
Profile
```

------------------------------------------------------------------------

# 74. Check-In Dashboard

Show:

-   total attendees
-   checked in
-   remaining
-   check-in percentage
-   recent scans
-   gate distribution
-   invalid scans
-   duplicate scans

Search:

-   ticket code
-   name
-   email
-   phone

------------------------------------------------------------------------

# 75. Ticket Verification

Organizer can filter:

``` text
PENDING
ACTIVE
REJECTED
CANCELLED
REFUNDED
```

Manual UPI receipts use private signed URLs.

------------------------------------------------------------------------

# 76. Email Ticket

Ticket confirmation email must contain:

-   event name
-   attendee name
-   ticket tier
-   ticket code
-   QR
-   date
-   venue
-   order number
-   support contact

------------------------------------------------------------------------

# 77. Legal / Policy Pages

Required:

-   Terms of Service
-   Privacy Policy
-   Refund Policy
-   Cookie Policy if applicable
-   Event Organizer Terms
-   Payment Terms

Policies should be configurable and versioned.

------------------------------------------------------------------------

# 78. Consent and Privacy

If collecting:

-   phone
-   ID
-   emergency contacts
-   dietary preferences
-   sponsor lead data

collect only what is necessary.

Consent must be recorded where required.

Provide data deletion/account closure workflow where legally
appropriate.

------------------------------------------------------------------------

# 79. Data Retention

Define retention rules for:

-   payment records
-   invoices
-   audit logs
-   attendee information
-   uploaded receipts
-   certificates
-   sponsor leads

Financial records may need longer retention than marketing data.

------------------------------------------------------------------------

# 80. Deployment Architecture

``` text
Git Repository
      ↓
CI/CD
      ↓
Docker Build
      ↓
DigitalOcean App Platform
      ↓
Next.js Application
      ↓
Supabase
```

Production must use:

-   HTTPS
-   environment secrets
-   production Clerk instance
-   production payment credentials
-   production Supabase project
-   logging
-   backups

------------------------------------------------------------------------

# 81. Environment Variables

Example:

``` env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=

NEXT_PUBLIC_OLA_MAPS_API_KEY=

SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
SMTP_FROM_EMAIL=

APP_URL=
NEXT_PUBLIC_APP_URL=

SENTRY_DSN=

ENCRYPTION_KEY=
```

Never expose:

``` text
SUPABASE_SERVICE_ROLE_KEY
CLERK_SECRET_KEY
RAZORPAY_KEY_SECRET
RAZORPAY_WEBHOOK_SECRET
SMTP_PASS
ENCRYPTION_KEY
```

to client-side code.

------------------------------------------------------------------------

# 82. Webhook Security

For every webhook:

``` text
Receive
 ↓
Validate signature
 ↓
Check provider event ID
 ↓
Check duplicate
 ↓
Store event
 ↓
Process transaction
 ↓
Mark processed
```

If processing fails, the event must be retryable.

------------------------------------------------------------------------

# 83. Testing Strategy

## Unit tests

Test:

-   price calculation
-   coupon calculation
-   refund calculation
-   inventory calculation
-   ticket validation
-   permission validation
-   registration field validation

## Integration tests

Test:

-   booking
-   payment
-   webhook
-   refund
-   cancellation
-   ticket transfer
-   waitlist
-   check-in

## End-to-end tests

At minimum:

``` text
Signup
 ↓
Browse event
 ↓
Select ticket
 ↓
Checkout
 ↓
Payment
 ↓
Ticket
 ↓
QR scan
 ↓
Check-in
```

------------------------------------------------------------------------

# 84. Critical Concurrency Tests

Test simultaneous:

-   final ticket purchase
-   coupon redemption
-   waitlist promotion
-   ticket transfer
-   check-in
-   refund

Example:

``` text
100 tickets
101 simultaneous requests
```

Expected:

``` text
100 successful
1 sold-out response
```

Never:

``` text
101 tickets issued
```

------------------------------------------------------------------------

# 85. Failure Recovery

Test:

-   payment succeeds but browser closes
-   webhook arrives twice
-   webhook arrives late
-   database temporarily unavailable
-   email fails
-   storage upload fails
-   payment gateway times out
-   user retries payment
-   reservation expires
-   user refreshes checkout
-   check-in device loses internet

The system must remain financially consistent.

------------------------------------------------------------------------

# 86. State Machine Rules

Do not allow arbitrary status transitions.

Example order:

``` text
PENDING → PAYMENT_PENDING
PAYMENT_PENDING → PAID
PAYMENT_PENDING → FAILED
PAID → PARTIALLY_REFUNDED
PAID → REFUNDED
```

Do not allow:

``` text
REFUNDED → PAID
```

unless an explicit administrative correction mechanism exists.

Ticket:

``` text
PENDING → ACTIVE
PENDING → CANCELLED
ACTIVE → CANCELLED
ACTIVE → REFUNDED
ACTIVE → TRANSFERRED
```

------------------------------------------------------------------------

# 87. Data Consistency Rules

The following must always be true:

``` text
order.total_amount
=
sum(order_items)
- discount
+ tax
+ platform_fee
+ gateway_fee
```

Inventory:

``` text
sold_count + reserved_count <= capacity
```

Attendance:

``` text
checked_in <= confirmed attendees
```

Refund:

``` text
total_refunded <= amount_paid
```

Coupon:

``` text
redemptions <= usage_limit
```

------------------------------------------------------------------------

# 88. No Duplicate Ticket Rule

A ticket must be uniquely identifiable using:

``` text
ticket_code
```

and cryptographic:

``` text
qr_token_hash
```

Never identify tickets solely by attendee email/name.

------------------------------------------------------------------------

# 89. No Duplicate Order Rule

Each checkout attempt must have an idempotency key.

If a request is retried:

``` text
same idempotency key
→ return existing order
```

------------------------------------------------------------------------

# 90. Admin Overrides

Administrative overrides may exist for:

-   manual check-in
-   refund
-   ticket activation
-   ticket cancellation
-   event cancellation
-   payment verification

Every override requires:

-   authenticated admin
-   reason
-   audit log

------------------------------------------------------------------------

# 91. Public URLs

Suggested:

``` text
/
 /events
 /events/[slug]
 /categories/[slug]
 /organizers/[slug]
 /clubs/[slug]

/dashboard
/dashboard/events
/dashboard/events/create
/dashboard/events/[id]
/dashboard/events/[id]/tickets
/dashboard/events/[id]/orders
/dashboard/events/[id]/attendees
/dashboard/events/[id]/check-in
/dashboard/events/[id]/analytics

/tickets/[ticketCode]
/orders/[orderNumber]
/verify/certificate/[token]

/admin
/admin/users
/admin/events
/admin/approvals
/admin/financials
/admin/audit-logs
```

------------------------------------------------------------------------

# 92. SEO

Public event pages must support:

-   metadata
-   Open Graph
-   Twitter/X cards
-   canonical URLs
-   structured event data
-   sitemap
-   robots.txt

Event structured data should be generated from approved public event
information.

------------------------------------------------------------------------

# 93. Social Sharing

Each event should have a shareable URL and preview.

Support:

-   WhatsApp
-   LinkedIn
-   Instagram-compatible link sharing
-   X
-   copy link

------------------------------------------------------------------------

# 94. Accessibility of QR Tickets

QR should be accompanied by:

-   ticket code
-   event name
-   attendee name

Users should not be forced to rely solely on QR scanning.

------------------------------------------------------------------------

# 95. Platform Settings

Create a system settings mechanism for:

-   platform fee
-   default currency
-   default timezone
-   ticket limits
-   maintenance mode
-   email settings
-   supported payment methods
-   default refund policy
-   notification settings

Do not hardcode business configuration into components.

------------------------------------------------------------------------

# 96. Feature Flags

Use feature flags for:

``` text
Razorpay
Manual UPI
WhatsApp
Certificates
Sponsors
Referrals
Offline check-in
Guest checkout
```

This allows gradual rollout.

------------------------------------------------------------------------

# 97. API Extensibility

Future public/private APIs may support:

``` text
GET /events
GET /events/:id
POST /events
GET /tickets/:id
POST /check-ins
GET /attendees
```

API authentication should use API keys/OAuth rather than Clerk browser
sessions where appropriate.

------------------------------------------------------------------------

# 98. Webhooks for RotaSphere

Eventually expose outbound webhooks:

``` text
event.created
event.published
order.created
order.paid
order.refunded
ticket.created
ticket.cancelled
ticket.transferred
attendee.checked_in
event.cancelled
```

Webhook delivery must support:

-   signing
-   retries
-   idempotency
-   delivery logs

------------------------------------------------------------------------

# 99. Architecture for External Payment Providers

Use an interface:

``` text
PaymentProvider

createOrder()
verifyPayment()
capturePayment()
refundPayment()
verifyWebhook()
```

Razorpay implements the interface.

This allows future providers without rewriting booking logic.

------------------------------------------------------------------------

# 100. Architecture for Notification Providers

Use:

``` text
NotificationProvider

send()
schedule()
cancel()
```

Implement:

``` text
EmailProvider
WhatsAppProvider
PushProvider
```

as separate adapters.

------------------------------------------------------------------------

# 101. Architecture for Storage Providers

Use:

``` text
StorageProvider

upload()
getSignedUrl()
delete()
```

Supabase Storage is the first implementation.

------------------------------------------------------------------------

# 102. Important Implementation Rules for Antigravity

The coding agent MUST:

1.  Read this entire architecture before modifying the application.
2.  Preserve existing working functionality unless explicitly replacing
    it.
3.  Never remove a security control to make a feature easier.
4.  Never trust client-side prices.
5.  Never trust client-side roles.
6.  Never trust client-side ticket availability.
7.  Never expose secret keys.
8.  Never store large Base64 images in localStorage.
9.  Never store ticket tiers only as JSONB.
10. Never treat `attendees_count` as the source of truth for inventory.
11. Never issue tickets before payment is authoritatively confirmed,
    except explicit zero-value/manual tickets.
12. Never mark a Razorpay payment successful solely because the browser
    says it succeeded.
13. Always process Razorpay webhooks.
14. Always use idempotency.
15. Always validate server-side.
16. Always use transactions for inventory and payment state changes.
17. Always enforce authorization on the server.
18. Always maintain audit logs for privileged actions.
19. Never silently swallow payment errors.
20. Never delete financial records to correct mistakes; use
    adjustment/refund records.
21. Never allow a cancelled/refunded ticket to check in.
22. Never allow duplicate check-in.
23. Never expose private storage files publicly.
24. Never expose sponsor attendee data without consent.
25. Never hardcode platform configuration that belongs in settings.
26. Keep domain logic separate from UI components.
27. Prefer reusable services over duplicated logic.
28. Add tests for every critical financial flow.
29. Make all payment and ticket state transitions explicit.
30. If implementation requirements conflict, prioritize security,
    financial correctness and this architecture over visual convenience.

------------------------------------------------------------------------

# 103. Recommended Implementation Order

Do NOT implement the entire platform randomly.

## Phase 1 --- Foundation

-   Next.js
-   TypeScript
-   Clerk
-   Supabase
-   database migrations
-   RLS
-   base layout
-   environment configuration
-   logging
-   error handling

## Phase 2 --- Identity and Governance

-   profiles
-   roles
-   permissions
-   event team permissions
-   admin dashboard
-   audit logs

## Phase 3 --- Events

-   event creation
-   event editing
-   event approval
-   event discovery
-   event details
-   map
-   calendar
-   categories

## Phase 4 --- Ticketing

-   ticket tiers
-   inventory
-   reservations
-   ticket limits
-   manual tickets
-   ticket generation
-   QR generation

## Phase 5 --- Commerce

-   orders
-   order items
-   payments
-   Razorpay
-   webhooks
-   manual UPI
-   coupons
-   invoices

## Phase 6 --- Registration

-   custom forms
-   attendees
-   multi-attendee bookings
-   waitlist
-   transfers

## Phase 7 --- Event Operations

-   QR scanner
-   check-in
-   offline check-in
-   attendee exports
-   event staff

## Phase 8 --- Post-Event

-   feedback
-   certificates
-   analytics
-   campaigns
-   reminders

## Phase 9 --- Finance

-   refunds
-   settlements
-   payouts
-   financial ledger

## Phase 10 --- Ecosystem

-   referrals
-   sponsors
-   exhibitors
-   lead capture
-   external APIs
-   outbound webhooks

------------------------------------------------------------------------

# 104. Definition of Done

The platform is NOT considered production-ready until:

### Authentication

-   [ ] Clerk authentication works.
-   [ ] Profiles synchronize correctly.
-   [ ] Suspended users cannot perform protected actions.

### Authorization

-   [ ] Platform RBAC works.
-   [ ] Event-level permissions work.
-   [ ] Supabase RLS is enabled.
-   [ ] Server actions enforce authorization.

### Events

-   [ ] Event CRUD works.
-   [ ] Approval workflow works.
-   [ ] Publication workflow works.
-   [ ] Cancellation works.
-   [ ] Rescheduling works.
-   [ ] Registration pause works.

### Ticketing

-   [ ] Ticket tiers work.
-   [ ] Inventory is concurrency-safe.
-   [ ] Reservations expire correctly.
-   [ ] QR tickets are generated.
-   [ ] Manual tickets work.
-   [ ] Ticket cancellation works.
-   [ ] Ticket transfers work.

### Commerce

-   [ ] Orders work.
-   [ ] Order items work.
-   [ ] Razorpay checkout works.
-   [ ] Razorpay webhooks work.
-   [ ] Duplicate webhooks are safe.
-   [ ] Manual UPI works.
-   [ ] Refunds work.
-   [ ] Coupons work.
-   [ ] Invoices work.

### Registration

-   [ ] Multi-attendee registration works.
-   [ ] Custom registration forms work.
-   [ ] Registration answers are stored securely.
-   [ ] Waitlist works.
-   [ ] Bulk import/export works.

### Check-In

-   [ ] QR scanning works.
-   [ ] Duplicate check-ins are rejected.
-   [ ] Offline check-in works.
-   [ ] Sync conflicts are handled.

### Communication

-   [ ] Booking email works.
-   [ ] Payment email works.
-   [ ] Refund email works.
-   [ ] Event reminders work.
-   [ ] Campaigns work.

### Analytics

-   [ ] Organizer analytics work.
-   [ ] Platform analytics work.
-   [ ] Attendance analytics work.
-   [ ] Financial analytics work.

### Security

-   [ ] No secret exposed client-side.
-   [ ] RLS policies tested.
-   [ ] Rate limiting implemented.
-   [ ] Upload validation implemented.
-   [ ] Audit logs implemented.
-   [ ] Webhook verification implemented.
-   [ ] Idempotency implemented.

### Reliability

-   [ ] Payment browser-close scenario tested.
-   [ ] Duplicate payment webhook tested.
-   [ ] Concurrent final-ticket purchase tested.
-   [ ] Refund failure tested.
-   [ ] Email failure tested.
-   [ ] Storage failure tested.
-   [ ] Database failure behavior tested.

------------------------------------------------------------------------

# 105. Final Reference Architecture

``` text
                         ROTASPHERE
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
   DISCOVERY              IDENTITY              ORGANIZATION
        │                     │                     │
 Events / Search          Clerk / Profiles       Clubs / Teams
 Calendar / Maps          RBAC / Permissions     Organizers
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              │
                         EVENT ENGINE
                              │
             ┌────────────────┼────────────────┐
             │                │                │
        Ticket Tiers      Registration      Sessions
             │                │                │
        Inventory          Forms            Schedule
             │                │                │
             └────────────────┼────────────────┘
                              │
                         COMMERCE ENGINE
                              │
                ┌─────────────┼─────────────┐
                │             │             │
              Orders       Payments       Coupons
                │             │             │
                │        Razorpay/UPI       │
                │             │             │
                └─────────────┼─────────────┘
                              │
                      TICKET ENGINE
                              │
                ┌─────────────┼─────────────┐
                │             │             │
             Tickets       Transfers      Waitlist
                │             │             │
                └─────────────┼─────────────┘
                              │
                        EVENT OPERATIONS
                              │
              ┌───────────────┼────────────────┐
              │               │                │
           QR Check-in    Offline Mode     Attendees
              │               │                │
              └───────────────┼────────────────┘
                              │
                         ENGAGEMENT
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
       Feedback          Certificates        Referrals
          │                   │                   │
          └───────────────────┼───────────────────┘
                              │
                       COMMUNICATION
                              │
              Email / WhatsApp / Push / Campaigns
                              │
                              ▼
                         ANALYTICS
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
      Sales               Attendance            Finance
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              │
                         GOVERNANCE
                              │
                 Audit / Security / Admin
                              │
                              ▼
                        SETTLEMENTS
                              │
                              ▼
                       ORGANIZER PAYOUT
```

------------------------------------------------------------------------

# 106. Non-Negotiable Architecture Summary

The following are the most important decisions in this specification:

1.  **Orders are separate from tickets.**
2.  **Payments are separate from orders.**
3.  **Refunds are separate records.**
4.  **Ticket tiers are separate database entities, not JSON-only data.**
5.  **Inventory is transactionally controlled.**
6.  **Temporary reservations prevent overselling.**
7.  **Razorpay webhooks are authoritative for payment confirmation.**
8.  **Idempotency is required for payment and booking operations.**
9.  **Attendees are separate from purchasers.**
10. **Registration forms are dynamic.**
11. **Waitlists are first-class entities.**
12. **Ticket transfers are first-class entities.**
13. **Check-ins are separate immutable operational records.**
14. **Offline check-in must synchronize safely.**
15. **Event-level permissions are separate from platform roles.**
16. **RLS and server-side authorization are mandatory.**
17. **Financial records must be auditable.**
18. **Manual UPI is supported without weakening security.**
19. **All critical state transitions must be explicit.**
20. **The system must be designed for concurrency and failure, not only
    the happy path.**

------------------------------------------------------------------------

# 107. Implementation Directive

Antigravity should implement this architecture incrementally while
keeping the database and domain model aligned with this document.

When a feature is implemented, verify:

``` text
UI
 ↓
Validation
 ↓
Authorization
 ↓
Domain Service
 ↓
Transaction
 ↓
Database
 ↓
External Provider
 ↓
Audit/Notification
```

For every critical operation, ask:

1.  What happens if the user refreshes?
2.  What happens if the request is sent twice?
3.  What happens if two users perform it simultaneously?
4.  What happens if the payment provider times out?
5.  What happens if the webhook arrives twice?
6.  What happens if the email fails?
7.  What happens if the database operation partially fails?
8.  What happens if the user loses internet?
9.  Can an unauthorized user perform this through a direct API call?
10. Is the action auditable?

If these questions cannot be answered, the feature is not complete.

**End of Architecture Specification --- RotaSphere v2.0.0**
