# RotaSphere — Technical Documentation

> **Purpose:** Explains *why* each library, pattern, or technical decision was chosen.
> This document is for developers and the AI agent to understand the reasoning behind every choice.
> Update this file whenever a new library is added or a significant pattern is adopted.

---

## 1. Frontend Framework — Next.js 16 (App Router)

### What it does
Next.js is a React-based full-stack framework. The App Router (introduced in Next.js 13) uses React Server Components by default and co-locates routes with their layouts.

### Why we use it
- **Architecture mandates it** (`architecture.md` §3).
- **Server Components** reduce client bundle size by keeping data-fetching logic on the server.
- **Server Actions** allow form submissions and mutations to run server-side without a separate REST endpoint, enabling secure, direct database calls from the UI layer.
- **Middleware** allows us to enforce auth/RBAC at the edge before any page renders.
- **Built-in image optimization** (`next/image`) for event banners and thumbnails.
- **SEO support** via `generateMetadata()` and `generateStaticParams()` for public event pages.

### Alternatives considered
| Alternative | Why rejected |
|---|---|
| Remix | Architecture specifies Next.js |
| Vite + React (SPA) | Server-side rendering critical for SEO on public event pages |
| Pages Router | App Router is the modern standard; architecture specifies "Next.js 16+" |

---

## 2. Language — TypeScript (Strict Mode)

### What it does
TypeScript adds static type checking to JavaScript.

### Why we use it
- **Prevents entire classes of bugs** at compile time: wrong ID types passed to DB queries, missing required fields in forms, incorrect state machine transitions.
- **Supabase generates TypeScript types** from the database schema, giving end-to-end type safety from DB → service → UI.
- **Zod integration**: Zod schemas can be inferred into TypeScript types using `z.infer<>`, ensuring validation schemas and runtime types stay in sync.
- All modern Next.js projects default to TypeScript.

### Why strict mode
- Catches `null`/`undefined` bugs that frequently cause runtime errors in payment and inventory code.
- Required for a production financial platform.

---

## 3. UI Components — shadcn/ui

### What it does
shadcn/ui is a collection of accessible, unstyled components built on Radix UI primitives, styled with Tailwind CSS. Unlike a traditional component library, you copy the source code into your project.

### Why we use it
- **Architecture mandates it** (`architecture.md` §3).
- **Full control**: components live in `src/components/ui/` — you can modify them freely without fighting a library's CSS specificity.
- **Accessibility by default**: built on Radix UI, which handles keyboard navigation, ARIA attributes, and focus management — required by architecture §67.
- **Tailwind-native**: no CSS-in-JS runtime overhead.
- **shadcn components used**: `Button`, `Dialog`, `Select`, `Table`, `Tabs`, `Form`, `Input`, `Badge`, `Card`, `Sheet`, `Toast`, `DropdownMenu`, `Calendar`, `DataTable`, `Command` (for search).

### Alternatives considered
| Alternative | Why rejected |
|---|---|
| MUI (Material UI) | Heavy CSS-in-JS runtime; opinionated design system hard to match custom branding |
| Chakra UI | Similar issues; less Tailwind-native |
| Headless UI | Less comprehensive than Radix-based shadcn |

---

## 4. Styling — Tailwind CSS

### What it does
Tailwind is a utility-first CSS framework. Instead of writing CSS files, you apply utility classes directly in JSX.

### Why we use it
- **Architecture mandates it**.
- **Zero runtime CSS**: all styles are compiled at build time with PurgeCSS — no runtime style injection.
- **Design token system**: Tailwind's config (`tailwind.config.ts`) becomes the single source of truth for colors, spacing, fonts, and breakpoints.
- **Responsive design**: mobile-first breakpoints (`sm:`, `md:`, `lg:`) — critical for mobile check-in UI (architecture §66).
- **Dark mode**: built-in `dark:` variant support.

---

## 5. Animation — Framer Motion

### What it does
Framer Motion is a React animation library that provides declarative animations, gestures, layout animations, and exit animations.

### Why we use it
- **Architecture mandates it**.
- **Accessible**: respects `prefers-reduced-motion` natively, satisfying architecture §67 and §3 (3D effects must not block core functionality).
- **Layout animations**: smooth transitions between states (e.g., ticket tiers appearing/disappearing based on availability).
- **Exit animations**: for modals, toasts, and check-in scan results.
- Used for micro-interactions in: event cards, ticket selection, check-in success/error feedback, dashboard widgets.

### Reduced Motion Compliance
```tsx
// Always use this pattern for animated components
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
```

---

## 6. 3D / Globe Effects — Three.js + React Three Fiber

### What it does
Three.js is a 3D rendering library for WebGL. React Three Fiber (R3F) is a React renderer for Three.js.

### Why we use it
- **Architecture mandates it** (`architecture.md` §3).
- Used for: landing page globe/3D hero, event location visualizations.
- R3F makes Three.js composable within React's component model.

### Critical constraints (from architecture §3)
> "3D effects must never block core functionality or make the platform unusable on low-end devices."
> "Provide reduced-motion and performance-friendly fallbacks."

**Implementation rule:** All Three.js components must:
1. Lazy-load (`next/dynamic` with `ssr: false`)
2. Have a static/image fallback for low-end devices
3. Be skipped entirely when `prefers-reduced-motion` is active

---

## 7. Maps — MapLibre GL + Ola Maps API

### What it does
MapLibre GL is an open-source fork of Mapbox GL JS for rendering vector tile maps. Ola Maps provides the tile data and API for India-specific maps.

### Why we use it
- **Architecture mandates it**.
- MapLibre is used instead of Google Maps or Mapbox for licensing and cost reasons.
- Ola Maps provides better India-specific data (relevant since RotaSphere targets Rotaract District 3192 in India).
- Features used: event location pins, marker clustering for discovery map view, click-to-open event, location filtering.

---

## 8. Authentication — Clerk

### What it does
Clerk is a complete authentication and user management platform. It provides hosted sign-in/sign-up UI, session management, JWT tokens, webhooks, and an admin dashboard.

### Why we use it
- **Architecture mandates it** (`architecture.md` §3).
- **Profile sync via webhooks**: When a user signs up or updates their profile in Clerk, a webhook fires to `POST /api/webhooks/clerk`, which syncs data to the `profiles` table in Supabase.
- **JWT in server actions**: `auth()` from `@clerk/nextjs/server` provides the user's Clerk ID server-side — used as the `user_id` foreign key throughout the database.
- **Middleware**: `clerkMiddleware()` in `middleware.ts` protects dashboard and admin routes at the edge.
- **No passwords in our DB**: Clerk handles credential storage, reducing our attack surface.

### How Clerk user ID maps to Supabase
```sql
-- profiles.id = clerk user ID (TEXT, not UUID)
CREATE TABLE profiles (
    id TEXT PRIMARY KEY, -- clerk user ID e.g. "user_2abc..."
    email TEXT UNIQUE NOT NULL,
    ...
);
```

### Alternatives considered
| Alternative | Why rejected |
|---|---|
| NextAuth.js | More setup for same result; no built-in user management UI; Clerk is architecture mandate |
| Supabase Auth | Would conflict with Clerk requirement; also less feature-rich for our use case |
| Auth0 | Architecture specifies Clerk |

---

## 9. Database — Supabase PostgreSQL

### What it does
Supabase is a hosted PostgreSQL platform with a REST API (PostgREST), real-time subscriptions, authentication (not used — we use Clerk), and storage.

### Why we use it
- **Architecture mandates it**.
- **PostgreSQL**: gives us transactions (`BEGIN`/`COMMIT`), row-level locks (`SELECT FOR UPDATE`), stored procedures, and `NUMERIC(12,2)` — all required for financial correctness.
- **Row Level Security (RLS)**: Supabase RLS policies enforce data access rules at the database level, providing a defense-in-depth layer even if application code has bugs.
- **Storage**: Supabase Storage for event media, payment receipts, certificates, invoices — all with signed URL support for private files.
- **Service Role Key**: used server-side only for admin operations that bypass RLS. Never exposed to browser.

### Three Supabase clients we maintain
```
lib/db/supabase.ts        → Server component client (uses anon key + user JWT)
lib/db/supabaseBrowser.ts → Client component client (uses anon key)
lib/db/supabaseAdmin.ts   → Service-role client (bypasses RLS, server-only)
```

### Why NUMERIC(12,2) for money
- JavaScript `Number` (IEEE 754 float) cannot represent `0.1 + 0.2` exactly.
- PostgreSQL `NUMERIC` is arbitrary precision — exact arithmetic.
- All monetary values (subtotal, discount, tax, platform_fee, gateway_fee, total) stored as `NUMERIC(12,2)`.

---

## 10. Validation — Zod

### What it does
Zod is a TypeScript-first schema validation library. You define a schema once and use it for both runtime validation and TypeScript type inference.

### Why we use it
- **Architecture mandates it** (`architecture.md` §3, §58).
- **Runtime safety**: TypeScript types only exist at compile time. Zod validates data at runtime — critical for:
  - API request bodies
  - Webhook payloads
  - Form submissions (Server Actions receive raw FormData)
  - File uploads (MIME type, size)
  - Coupon/access codes
- **Structured error messages**: Zod errors map to field-level messages in forms.
- **Inferred types**: `z.infer<typeof MySchema>` keeps runtime schema and TypeScript type in sync — no duplication.

### Example pattern
```typescript
// Define once
export const CreateEventSchema = z.object({
  title: z.string().min(3).max(200),
  startDate: z.string().datetime(),
  capacity: z.number().int().positive(),
});

// Infer type
export type CreateEventInput = z.infer<typeof CreateEventSchema>;

// Validate in server action
const result = CreateEventSchema.safeParse(input);
if (!result.success) {
  return { success: false, errors: result.error.flatten() };
}
```

---

## 11. Payments — Razorpay

### What it does
Razorpay is an Indian payment gateway supporting UPI, cards, net banking, wallets, and more.

### Why we use it
- **Architecture mandates it** (`architecture.md` §3).
- Dominant Indian payment gateway with broad coverage of payment methods relevant to our users.
- Supports webhooks for reliable payment status updates.

### PaymentProvider interface (architecture §99)
We wrap Razorpay behind a `PaymentProvider` interface so a future gateway (e.g., Cashfree, Paytm) can be swapped in without rewriting booking logic:

```typescript
interface PaymentProvider {
  createOrder(params: CreateOrderParams): Promise<ProviderOrder>;
  verifyPayment(params: VerifyPaymentParams): Promise<VerificationResult>;
  capturePayment(params: CaptureParams): Promise<CaptureResult>;
  refundPayment(params: RefundParams): Promise<RefundResult>;
  verifyWebhook(payload: unknown, signature: string): boolean;
}
```

### Why webhook is the source of truth (not browser callback)
The browser's `payment.success` callback can be:
- Intercepted and forged
- Never delivered (tab closed, network drop)

The Razorpay webhook at `POST /api/webhooks/razorpay` is signed by Razorpay's secret and processed server-side. **Tickets are only issued after the webhook confirms `payment.captured`.**

---

## 12. Email — Nodemailer / SMTP

### What it does
Nodemailer is a Node.js module for sending emails via SMTP.

### Why we use it
- **Architecture mandates it**.
- **Provider-agnostic**: SMTP works with Resend, SendGrid, Gmail, AWS SES, or any SMTP server — no vendor lock-in.
- Wrapped behind a `NotificationProvider` interface (architecture §100) so the provider can be swapped.

### Notification event types handled
`booking_created`, `payment_success`, `payment_failed`, `payment_approved`, `payment_rejected`, `ticket_issued`, `event_reminder`, `event_changed`, `event_cancelled`, `refund_requested`, `refund_completed`, `ticket_transferred`, `waitlist_available`, `certificate_issued`

---

## 13. Storage — Supabase Storage

### What it does
Supabase Storage is an S3-compatible object storage service.

### Why we use it
- **Architecture mandates it**.
- **Signed URLs**: private files (payment receipts, uploaded ID documents, certificates) are accessed via time-limited signed URLs — never exposed publicly.
- **Bucket separation** (architecture §3):
  - `event-media` — banners, thumbnails (public)
  - `payment-receipts` — UPI screenshots (private)
  - `ticket-assets` — QR images (private)
  - `certificates` — issued PDFs (private, signed URL for download)
  - `invoices` — GST invoices (private)
  - `sponsor-assets` — logos (semi-public)

### Why never store Base64 in DB
- A Base64-encoded 1MB image = ~1.33MB of text in the database.
- Massively inflates row size, destroys query performance.
- Architecture §59 explicitly forbids this.

---

## 14. Inventory Concurrency — Row Locks / Postgres Functions

### The problem
Naive inventory check:
```sql
SELECT available FROM ticket_tiers WHERE id = $1;
-- (race condition here)
UPDATE ticket_tiers SET sold_count = sold_count + 1 WHERE id = $1;
```
Two simultaneous requests can both see `available = 1` and both sell the last ticket.

### Our solution (architecture §13)
```sql
-- Atomic reservation using row lock
BEGIN;
SELECT * FROM ticket_tiers WHERE id = $1 FOR UPDATE;
-- Now exclusive lock held
INSERT INTO inventory_reservations (...);
UPDATE ticket_tiers SET reserved_count = reserved_count + $qty WHERE id = $1;
COMMIT;
```

The `inventoryService.ts` wraps this in a transaction. The `supabaseAdmin.ts` client is used because RLS cannot be applied to `FOR UPDATE` in all configurations.

---

## 15. Idempotency — Unique Keys on Orders

### The problem
Users click "Pay" twice, network retries fire, or the browser re-submits a form — resulting in duplicate orders and double charges.

### Our solution (architecture §2.3, §89)
Every checkout attempt generates a client-side idempotency key (UUID v4). The `orders` table has:
```sql
idempotency_key TEXT UNIQUE
```
If the same key arrives twice, the second insert fails the unique constraint and we return the existing order — no duplicate created.

---

## 16. State Machines — Explicit Transitions

### Why
Without enforced state machines, bugs can set an order to `PAID` after it was `REFUNDED`, or activate a `CANCELLED` ticket.

### Our solution (architecture §86)
Each service method validates the current state before transitioning:
```typescript
function transitionOrder(current: OrderStatus, next: OrderStatus): void {
  const allowed: Record<OrderStatus, OrderStatus[]> = {
    PENDING: ['PAYMENT_PENDING'],
    PAYMENT_PENDING: ['PAID', 'FAILED'],
    PAID: ['PARTIALLY_REFUNDED', 'REFUNDED'],
    // ...
  };
  if (!allowed[current]?.includes(next)) {
    throw new Error(`Invalid transition: ${current} → ${next}`);
  }
}
```

---

## 17. Audit Logging

### What we log
Role changes, user suspension, event approval/rejection, event cancellation, price changes, manual ticket issuance, payment verification, refunds, settlements, check-in overrides, attendee data exports.

### Why
- Security compliance and investigation trail.
- Required by architecture §62.
- Logs are append-only — no updates/deletes to `audit_logs`.

### Format
```typescript
await writeAuditLog({
  actorUserId: user.id,
  actorEmail: user.emailAddresses[0].emailAddress,
  action: 'event.approved',
  targetType: 'event',
  targetId: eventId,
  details: { previousStatus: 'PENDING_APPROVAL', newStatus: 'PUBLISHED' },
  ipAddress: req.ip,
});
```

---

## 18. Rate Limiting

### Why
- Prevents brute-force coupon scanning.
- Prevents inventory abuse (bots holding reservations).
- Prevents DDoS on check-in endpoints during high-attendance events.

### Implementation
We use an IP + user-based sliding window rate limiter.

Endpoints rate-limited:
- `POST /api/webhooks/*` — per IP
- Booking attempts — per user + per IP
- Coupon validation — per user
- QR scan / check-in — per device
- Public search — per IP

---

## 19. QR Ticket Security

### Architecture requirement (§23)
> "QR token must not contain sensitive attendee information. Use a cryptographically random token."

### Implementation
1. Generate a cryptographically random 32-byte token using `crypto.randomBytes(32)`.
2. Store the SHA-256 hash of the token in `tickets.qr_token_hash`.
3. Send the raw token to the user (embedded in QR code).
4. At check-in, hash the scanned token and look up `qr_token_hash` — no attendee data in the QR payload.

After ticket transfer:
- Old QR token is invalidated (old hash deleted/voided).
- New token generated and issued to new owner.

---

## 20. Offline Check-In (IndexedDB)

### Architecture requirement (§25)
Check-in devices may lose internet connectivity during events.

### Implementation
1. Before the event, device downloads an **encrypted** attendee manifest (all QR token hashes for the event).
2. Stored in **IndexedDB** (browser persistent storage) — not localStorage (size limits).
3. On scan, validate locally against the manifest.
4. Record local check-in with timestamp.
5. On reconnect, sync all local check-ins to server.
6. Conflict resolution: first server-confirmed check-in wins.
7. **Encryption**: manifest is encrypted with a per-event key derived from `ENCRYPTION_KEY` env var — device cannot read other events' data.

---

## 21. Deployment — Docker + DigitalOcean

### Architecture requirement (§80)
```
Git → CI/CD → Docker Build → DigitalOcean App Platform → Next.js → Supabase
```

### Dockerfile strategy
- Multi-stage build: `builder` stage compiles TypeScript and builds Next.js; `runner` stage is a minimal Node.js image.
- `.env` variables injected at runtime via DigitalOcean App Platform environment config — never baked into the image.
- Health check endpoint: `GET /api/health` returns 200 if DB connection is alive.

### Background jobs
DigitalOcean App Platform supports scheduled workers (cron jobs). We expose secure cron endpoints:
- `POST /api/cron/release-reservations` — every 5 min
- `POST /api/cron/send-reminders` — every hour
- `POST /api/cron/process-waitlist` — every 10 min

Each endpoint is protected by a `CRON_SECRET` header to prevent unauthorized triggering.
