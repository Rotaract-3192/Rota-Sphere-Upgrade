/**
 * Tour step definitions for the RotaSphere onboarding system.
 * Steps use CSS selectors (data-tour attributes) to highlight real DOM elements.
 * Rich navigation guidance explaining what to click and how to move through the app.
 */

export interface TourStep {
  id: string;
  title: string;
  badge?: string;
  description: string;
  /** Actionable guidance on how to navigate this element */
  navigationGuide?: string;
  /** Pro tip or shortcut */
  tip?: string;
  /** CSS selector for element to spotlight. Comma-separated fallbacks allowed. null = center */
  target: string | null;
  /** Preferred tooltip position relative to spotlight */
  placement?: "top" | "bottom" | "left" | "right" | "center";
  /** Optional icon emoji */
  icon?: string;
}

export const attendeeTourSteps: TourStep[] = [
  {
    id: "welcome",
    target: null,
    placement: "center",
    icon: "🌐",
    badge: "DISTRICT 3192",
    title: "Welcome to RotaSphere",
    description:
      "Your unified portal for discovering, booking, and managing flagship Rotaract events across all 85 chartered clubs in District 3192.",
    navigationGuide:
      "This quick guided tour will highlight the core features on this screen and explain how to navigate the platform in under a minute.",
    tip: "Use the Arrow keys (← / →) on your keyboard to navigate between steps, or press Esc anytime to exit.",
  },
  {
    id: "nav-menu",
    target: "[data-tour='nav-menu'], [data-tour='nav-events']",
    placement: "bottom",
    icon: "🧭",
    badge: "NAVIGATION",
    title: "Main Navigation Bar",
    description:
      "Switch effortlessly between the Events directory, 85 Clubs roster, your personal Tickets, and the District Gallery.",
    navigationGuide:
      'Click "Events" to view all live registrations, "Clubs" to explore club histories and executive boards, or "Tickets" to view your active passes.',
    tip: 'Bookmark your favourite pages or use the "Tickets" tab on event day for quick gate check-in.',
  },
  {
    id: "search",
    target: "[data-tour='search-bar']",
    placement: "bottom",
    icon: "🔍",
    badge: "SEARCH",
    title: "Instant Event & Club Search",
    description:
      "Find any conference, cultural fest, sports tournament, or host club in seconds.",
    navigationGuide:
      'Type keywords like "Freshers", "Jatayu", "Trek", or your club name and press Enter or click "Find Passes" to see matching events.',
    tip: "Try typing the city name (e.g. Bengaluru, Tumakuru, Kolar) to find events happening in your zone.",
  },
  {
    id: "category-strip",
    target: "[data-tour='category-strip']",
    placement: "bottom",
    icon: "🏷️",
    badge: "FILTERS",
    title: "Category & Format Filters",
    description:
      "Filter across distinct event formats tailored for District 3192 youth leaders.",
    navigationGuide:
      "Click any category chip — Conferences, Workshops, Youth Festivals, Keynote Talks, Sports Leagues, or Fellowships — to filter the event grid instantly without reloading.",
    tip: "Select 'All Events' at any time to clear active category filters.",
  },
  {
    id: "event-card",
    target: "[data-tour='hero-event-card'], [data-tour='event-card']:first-of-type",
    placement: "bottom",
    icon: "🎟️",
    badge: "EVENT PASSES",
    title: "Event Cards & Fast Booking",
    description:
      "Each card shows confirmed dates, venue locations, host club affiliations, starting ticket prices, and group bulk discount deals.",
    navigationGuide:
      'Click "Book Delegate Pass" or tap the event title to open the full event booking page with itinerary details, venue maps, and UPI checkout.',
    tip: 'Look for the purple "Bulk Deals" badge on events that offer special group discounts for club delegations!',
  },
  {
    id: "map-explorer",
    target: "[data-tour='map-explorer']",
    placement: "top",
    icon: "🗺️",
    badge: "VENUE MAP",
    title: "Interactive Venue Explorer",
    description:
      "Pinpoint Rotaract conferences, conventions, and youth festivals geographically across Bengaluru and District 3192.",
    navigationGuide:
      "Click on any interactive pin on the map to view venue details, event timings, and direct navigation links.",
    tip: "Use the map to plan your travel and find which club events are happening close to your college or workplace.",
  },
  {
    id: "my-tickets",
    target: "[data-tour='nav-tickets']",
    placement: "bottom",
    icon: "📱",
    badge: "MY PASSES",
    title: "Your Digital Passes & Gate Entry",
    description:
      "Never print tickets again. All your booked passes are stored securely with offline-compatible QR codes.",
    navigationGuide:
      'Click "Tickets" in the top bar to pull up your passes. On event day, show your screen at the registration desk for instant gate verification.',
    tip: "You can download official PDF receipts or transfer extra passes to friends directly from your Tickets page.",
  },
  {
    id: "nav-host",
    target: "[data-tour='nav-host']",
    placement: "bottom",
    icon: "🚀",
    badge: "FOR ORGANIZERS",
    title: "Host Events for Your Club",
    description:
      "Are you a Club President, Secretary, or Event Chair? RotaSphere gives your club professional SaaS ticketing with 0% platform fee.",
    navigationGuide:
      'Click "Host Event" to open the Organizer Command Center. Create ticket tiers, verify UPI payments, and use the camera QR scanner on event day.',
    tip: "Need organizer permissions? Submit a 1-click organizer access request from the dashboard.",
  },
];

export const organizerDashboardTourSteps: TourStep[] = [
  {
    id: "welcome-org",
    target: null,
    placement: "center",
    icon: "🎛️",
    badge: "COMMAND CENTER",
    title: "Organizer Command Center",
    description:
      "Welcome to your club's operations hub. Manage your entire event lifecycle from ticket creation to gate scanning and financial reporting.",
    navigationGuide:
      "This tour walks you through the core controls: creating events, reviewing payments, exporting attendees, and sending delegate broadcasts.",
    tip: "All operations are backed by District 3192 direct non-profit settlement — zero platform commissions.",
  },
  {
    id: "create-event",
    target: "[data-tour='create-event-btn']",
    placement: "bottom",
    icon: "✨",
    badge: "EVENT WIZARD",
    title: "Create a New Event in 5 Steps",
    description:
      "Launch a professional event listing in minutes with our step-by-step guided wizard.",
    navigationGuide:
      'Click "+ Create New Event" to open the modal: enter event details, choose offline/online venue, set up multi-tier ticket pricing, configure bulk slab discounts, and input club UPI payment details.',
    tip: "You can save as Draft to preview your event page privately before publishing.",
  },
  {
    id: "stats",
    target: "[data-tour='organizer-stats']",
    placement: "bottom",
    icon: "📊",
    badge: "REAL-TIME METRICS",
    title: "Revenue & Check-in Metrics",
    description:
      "Real-time velocity tracking: total gross sales collected, number of passes issued, and gate check-in percentage.",
    navigationGuide:
      "Metrics update in real time as delegates submit payments and your team approves transactions.",
    tip: "Use the Gate Check-in Rate during event day to monitor arrival flows at the gate.",
  },
  {
    id: "tab-events",
    target: "[data-tour='tab-events'], [data-tour='organizer-event-list']",
    placement: "bottom",
    icon: "📅",
    badge: "EVENT ROSTER",
    title: "Active Events & Listings",
    description:
      "Manage all upcoming and concluded events published by your chartered club.",
    navigationGuide:
      'Click "Events" in the sidebar to view your event cards. Each card gives direct access to edit details, clone events, manage ticket tiers, or export attendees.',
    tip: 'Click on any event card to drill into its dedicated event dashboard with live gate scanner controls.',
  },
  {
    id: "pending-payments",
    target: "[data-tour='tab-orders'], [data-tour='pending-payments']",
    placement: "bottom",
    icon: "💳",
    badge: "UPI APPROVALS",
    title: "Orders & Direct UPI Approvals",
    description:
      "Review incoming payments deposited directly into your club's bank account via UPI QR.",
    navigationGuide:
      'Navigate to the "Orders" tab to view UTR transaction numbers and payment screenshots. Click "Approve" once verified in your bank app — the delegate is immediately sent their QR pass.',
    tip: "Delegates receive instant email confirmation as soon as you approve their payment.",
  },
  {
    id: "tab-attendees",
    target: "[data-tour='tab-attendees']",
    placement: "bottom",
    icon: "👥",
    badge: "ATTENDEE ROSTER",
    title: "Guest Roster & Excel Exports",
    description:
      "Complete register of all confirmed delegates, including club affiliations, phone numbers, and check-in statuses.",
    navigationGuide:
      'Click "Guests" to search delegates by name or filter by ticket tier. Click "Export Excel (.xlsx)" to download a formatted spreadsheet complete with Zonal Count Breakdowns.',
    tip: "Perfect for printing physical registration badges and generating official District reporting sheets.",
  },
  {
    id: "tab-broadcast",
    target: "[data-tour='tab-broadcast']",
    placement: "bottom",
    icon: "📢",
    badge: "BROADCASTS",
    title: "Official Email Broadcasts",
    description:
      "Send emergency schedule updates, delegate guidelines, and parking info directly to all registered attendees.",
    navigationGuide:
      'Click "Broadcast Announcements" in the sidebar or top bar to open the District Bulk Email Composer. Filter by event, attach PDFs or schedules, and send in one click.',
    tip: "Emails are delivered with official District 3192 branding via authenticated SMTP.",
  },
];

export const organizerEventTourSteps: TourStep[] = [
  {
    id: "event-overview",
    target: "[data-tour='event-dashboard-header']",
    placement: "bottom",
    icon: "🏟️",
    badge: "EVENT DASHBOARD",
    title: "Event Operations Command",
    description:
      "All metrics and controls dedicated to this specific event — sales velocity, delegate lists, ticket tiers, and announcements.",
    navigationGuide:
      "Use the tabs directly below this header to switch between the Overview, Orders, Attendees, Passes, and Broadcast Announcements.",
    tip: "The status badge in the top right shows whether your event is Published or in Draft mode.",
  },
  {
    id: "tab-overview",
    target: "[data-tour='tab-overview']",
    placement: "bottom",
    icon: "📊",
    badge: "METRICS",
    title: "Sales & Capacity Overview",
    description:
      "Real-time breakdown of revenue collected, passes sold per tier, remaining capacity, and check-in percentage.",
    navigationGuide:
      'Click "Overview" to see the live sales progression and quick action shortcuts for adding manual attendees.',
  },
  {
    id: "tab-orders",
    target: "[data-tour='tab-orders']",
    placement: "bottom",
    icon: "🧾",
    badge: "PAYMENTS",
    title: "Order Queue & UPI Verification",
    description:
      "Every order placed for this event with transaction details, UTR numbers, and payment screenshot previews.",
    navigationGuide:
      'Click "Orders" to verify pending registrations. Click "View Screenshot" to verify the payment receipt and click "Approve" to issue the pass.',
    tip: "Filter by 'Pending' to quickly process registrations needing verification.",
  },
  {
    id: "tab-attendees",
    target: "[data-tour='tab-attendees']",
    placement: "bottom",
    icon: "👥",
    badge: "DELEGATES",
    title: "Attendee Management & Check-in",
    description:
      "Full roster of confirmed delegates for this event with check-in timestamps and contact details.",
    navigationGuide:
      'Click "Attendees" to search registered guests. You can manually check in guests or click "Export Excel" to download the roster.',
  },
  {
    id: "tab-tickets",
    target: "[data-tour='tab-tickets']",
    placement: "bottom",
    icon: "🎫",
    badge: "PASS TIERS",
    title: "Passes & Group Bulk Slabs",
    description:
      "Configure your ticket pricing tiers, capacities, and group bulk slab discounts.",
    navigationGuide:
      'Click "Passes" to create new tiers (e.g. Early Bird, General, VIP) and set up bulk pricing (e.g. Buy 5+ get 15% off).',
  },
  {
    id: "tab-broadcast",
    target: "[data-tour='tab-broadcast']",
    placement: "bottom",
    icon: "📢",
    badge: "BROADCASTS",
    title: "Broadcast Announcements",
    description:
      "Send official District email updates, gate instructions, and schedule attachments directly to registered delegates.",
    navigationGuide:
      'Click "Broadcast" to launch the Bulk Email modal scoped specifically to this event\'s delegates.',
    tip: "Emails include your event name and reply-to email address automatically.",
  },
];
