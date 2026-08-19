# RotaSphere — Agent Memory Log

> This file is the **persistent memory** for the Antigravity coding agent.
> Update this file every time a meaningful change is made to the codebase.
> Read this file FIRST before starting any session to understand current project state.
> Do NOT re-read the entire codebase — use this file + architecture.md together.

---

## How to Use This File

1. **Before starting a session:** Read the "Current State" section.
2. **After completing any task:** Append a new entry to the "Change Log".
3. **If a decision was made:** Record it in the "Design Decisions" section.
4. **If a bug was found and fixed:** Record it in "Known Issues / Fixes".

---

## Current State

**Phase:** Production-Ready Build Complete (Phases 1-5 Core Platform)
**Last Session:** 2026-08-12
**Next Action:** Add real API credentials to `.env.local` and launch via `npm run dev` or deploy to production.

### What Exists

| Item | Status | Notes |
|---|---|---|
| `architecture.md` | ✅ Complete | Source of truth — do not modify |
| `implementation_plan.md` | ✅ Complete | Phased plan, file structure |
| `memory.md` (this file) | ✅ Updated | Agent memory log |
| `documentation.md` | ✅ Complete | Library/decision rationale |
| `DESIGN-airbnb.md` | ✅ Integrated | Full Airbnb-inspired design tokens mapped into Tailwind & components |
| Next.js project | ✅ Built & Verified | Next.js 16 + React 19 + TypeScript + Tailwind v4 + Inter font |
| Supabase migrations | ✅ 7 Files | `0001_profiles.sql` to `0007_operations_finance.sql` (All 30+ tables & RLS) |
| Auth & Permissions | ✅ Implemented | Clerk middleware, Clerk webhook (`/api/webhooks/clerk`), RBAC hierarchy |
| Design System & UI | ✅ Implemented | TopNav (80px, animated underline, user avatar), Footer (with SVG icons), HeroSearch (3 segments, Rausch orb), CategoryStrip (12 categories), EventCard (1:1 aspect, 14px radius, heart save), EventGrid |
| Application Pages | ✅ Implemented | Landing Page (`/`), `/events` (discovery), `/events/[slug]` (detail page), `ReservationCard` (sticky right-rail), `EventSessions` (schedule), `/checkout` (Razorpay SDK + Suspense), `/tickets` (My Tickets), `/dashboard` (role-based router), `/check-in` (staff QR scanner + Suspense) |
| Core Services | ✅ Implemented | `inventoryService.ts` (DB row lock `SELECT FOR UPDATE`), `razorpay.ts` (HMAC-SHA256), `/api/webhooks/razorpay`, `ticketService.ts` (TKT-code, SHA-256 QR tokens, check-in validation), `notificationService.ts` (Nodemailer SMTP), `orderActions.ts` (Server Action) |
| Error Handling | ✅ Implemented | Global `error.tsx` boundary with logger & retry, `not-found.tsx` (404 page) |

---

## Change Log

### 2026-08-19 — Codebase Security Hardening, Vulnerability Patching & Grievance Desk Redesignation
**Session goal:** Conduct a complete security audit across the codebase, patch all identified vulnerabilities (Broken Access Control, Privilege Escalation, SSRF, IDOR, race conditions, fail-open cron endpoints, XSS), and replace personal Grievance Officer name with "Rotaract District 3192 Tech Team".
- **Grievance Officer Redesignation**: Replaced all personal name references (`Thejaswin P. S.`) with `Rotaract District 3192 Tech Team` across `/privacy`, `/help`, and `/contact`.
- **Server Action Authorization Hardening**: Enforced `requireRole("super_admin")` / `requireRole("admin")` in `adminActions.ts` and `clubActions.ts`.
- **Event Ownership & SSRF Defense**: Enforced organizer/admin ownership checks on event updates, cancellations, and registration exports in `eventActions.ts`. Added SSRF protection `isSafePublicUrl` to block loopback/metadata IPs in `parseGoogleMapsUrlAction`.
- **Order & Ticket Checkout Hardening**: Enforced capacity checks to prevent overselling passes and secured payment verification in `orderActions.ts`.
- **IDOR Protection**: Verified ticket ownership (`owner_user_id === user.clerkId`) on transfers, refunds, and UTR resubmissions in `attendeeActions.ts`.
- **Gate Check-In Concurrency**: Blocked pending verification passes and used atomic conditional SQL updates in `checkInActions.ts` to prevent race conditions.
- **Fail-Closed API Security**: Fixed fail-open cron auth in `/api/push/send` and `/api/cron/retention`.
- **Clerk Webhook Synchronization**: Fixed table name from `profiles` to `rotasphere_profiles` in `/api/webhooks/clerk`.
- **JSON-LD XSS Sanitization**: Escaped `<` characters as `\u003c` in `JsonLd.tsx`.
- **Build Verification**: Ran `npm run build` — 100% passed (0 TypeScript errors, 37/37 routes generated).

### 2026-08-18 — Full Legal, Privacy, DPDP Act 2023, Support, and Footer Architecture Implementation
**Session goal:** Implement the full Indian legal, privacy, refund, dispute resolution, support, and footer infrastructure per DPDP Act 2023 / Rules 2025 and Consumer Protection (E-Commerce) Rules 2020.
- **Footer Architecture**: Completely revamped `Footer.tsx` with dedicated Support, Legal & Privacy, and Platform columns, operating legal entity disclosure (NO "RotaSphere, Inc."), Grievance Officer details (`tech.rotaract3192@gmail.com`), and interactive `DirectoryVerificationModal`.
- **Primary Operational Email**: Configured `tech.rotaract3192@gmail.com` as the universal email address for Super Admin authorization, Clerk role mapping, Grievance Redressal, Privacy Desk, Security, and Customer Support across the entire platform.
- **Privacy Policy (`/privacy`)**: 14-section exhaustive DPDP Act 2023 & Rules 2025 policy including itemized data collection, payment separation (Razorpay non-storage of raw cards), gate check-in telemetry, purpose-based retention schedules, 72h breach SLA, and children's data rules.
- **Terms of Service (`/terms`)**: 12-section commercial terms clarifying technology intermediary role, organizer obligations, ticket anti-duplication, fee transparency, and governing law (Bengaluru, Karnataka).
- **Cookie Policy & Manager (`/cookies`, `/cookie-policy`)**: Comprehensive policy and interactive `CookiePreferencesClient` with zero third-party ads disclosure.
- **Accessibility Statement (`/accessibility`)**: WCAG 2.1 AA conformance, keyboard navigation, and reduced-motion standards.
- **Cancellation & Refund Policies (`/cancellation-policy`, `/refund-policy`)**: Realistic banking timelines (1-3d UPI, 3-7d cards), automatic triggers, partial refunds, failed transaction reconciliation helper, and free pass transfers.
- **Dispute Resolution & Ombudsman (`/dispute-resolution`, `/disputes`)**: 5-tier resolution hierarchy and interactive `DisputeDashboardClient` with reference tracking (`DIS-2026-XXXXXX`) and timeline audit trail.
- **Help Centre (`/help`)**: Searchable, real-time filtered knowledge base across Attendees, Organizers, Payments, Privacy, and Security with `HelpCenterClient`.
- **Contact Desk (`/contact`)**: Multi-channel support routing, Grievance Officer details, and interactive case generator (`CASE-2026-XXXXXX`).
- **HTML Sitemap (`/sitemap`)**: Full directory indexing all routes.
- **Platform Security & System Status (`/security`, `/status`)**: Cryptographic SHA-256 tokens, RLS multi-tenancy, and live 99.98% uptime monitoring.
- **Event Detail Transparency**: Enhanced `/events/[slug]` with transparent event-level policies, directory verification, and DPDP data collection disclosures.
- **Build verification:** Ran `npm run build`: **PASSED** (0 TypeScript errors, 36/36 routes generated).

### 2026-08-12 — Full Production Build Execution & Verification

**Session goal:** Build and verify a complete production-ready RotaSphere web application following `architecture.md` & `DESIGN-airbnb.md`.

**Build verification:**
- Ran `npm run build`: **PASSED** (0 TypeScript errors, 11/11 pages generated successfully).

---

## Design Decisions

| Decision | Rationale | Date |
|---|---|---|
| Use Next.js App Router | Architecture specifies Next.js 16+ with App Router; enables Server Components & Server Actions | 2026-08-12 |
| Use Clerk for auth | Architecture mandates Clerk; provides JWT, webhooks, OAuth | 2026-08-12 |
| Use Supabase PostgreSQL | Architecture mandates Supabase with RLS, service-role access, and migrations | 2026-08-12 |
| Use Zod for validation | Architecture mandates Zod for runtime input safety | 2026-08-12 |
| Use `NUMERIC(12,2)` for money | Architecture mandates non-float money storage | 2026-08-12 |
| Ticket QR token stored as SHA-256 hash | Security requirement: `qr_token_hash` in DB; raw token only returned once | 2026-08-12 |
| Inventory reservations with `SELECT FOR UPDATE` | DB level advisory lock prevents overselling under concurrent checkouts | 2026-08-12 |
| Airbnb Design Tokens in Tailwind | Full design system from `DESIGN-airbnb.md` (`brand`: `#ff385c`, `ink`: `#222222`, `rounded-card`: 14px) | 2026-08-12 |
| DPDP Act 2023 & Rules 2025 Architecture | Implement full statutory privacy, purpose-based retention, 72h breach protocol, and Grievance Officer structure upfront | 2026-08-18 |
| Operating Entity in Footer | Use exact operating entity "RotaSphere Platform Operations / Rotaract District 3192 Secretariat" instead of "Inc." | 2026-08-18 |
| 5-Tier Dispute & Grievance Hierarchy | Support -> Host Club -> Platform Audit -> Grievance Officer -> Statutory Authorities | 2026-08-18 |
