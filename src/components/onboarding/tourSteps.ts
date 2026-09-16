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
  /** Size mode: compact (default for focused element tooltips), medium, or expanded (welcome dialogs) */
  size?: "compact" | "medium" | "expanded";
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
    size: "expanded",
    icon: "🌐",
    badge: "DISTRICT 3192",
    title: "Welcome to RotaSphere",
    description:
      "Your unified portal for discovering, booking, and managing flagship Rotaract events across all 85 chartered clubs in District 3192.",
    navigationGuide:
      "This quick guided tour will highlight the core features and explain how to navigate the platform in under a minute.",
    tip: "On PC: Use Arrow keys (← / →) or Esc. On Mobile: Tap 'Next' below to proceed, or '✕' to exit anytime.",
  },
  {
    id: "nav-menu",
    target: "[data-tour='nav-menu'], [data-tour='bottom-nav']",
    placement: "bottom",
    size: "compact",
    icon: "🧭",
    badge: "NAVIGATION",
    title: "Navigation & Quick Access",
    description:
      "Tap bottom dock tabs on mobile (or top bar on PC) to switch between Events, Clubs, Passes, and Home anytime.",
  },
  {
    id: "search",
    target: "[data-tour='search-bar']",
    placement: "bottom",
    size: "compact",
    icon: "🔍",
    badge: "SEARCH",
    title: "Instant Event Search",
    description:
      "Type keywords like 'Freshers', 'Jatayu', or your club name and press Enter to find passes instantly.",
  },
  {
    id: "category-strip",
    target: "[data-tour='category-strip']",
    placement: "bottom",
    size: "compact",
    icon: "🏷️",
    badge: "FILTERS",
    title: "Format Filters",
    description:
      "Tap any chip (Conferences, Workshops, Sports) to filter the event grid instantly without reloading.",
  },
  {
    id: "event-card",
    target: "[data-tour='hero-event-action'], [data-tour='event-card-action'], [data-tour='hero-event-card'], [data-tour='event-card']",
    placement: "bottom",
    size: "compact",
    icon: "🎟️",
    badge: "EVENT PASSES",
    title: "Event Passes & Booking",
    description:
      "Tap 'Book Delegate Pass' to view the full itinerary, venue maps, group bulk discounts, and instant UPI checkout.",
  },
  {
    id: "map-explorer",
    target: "[data-tour='map-header'], [data-tour='map-explorer']",
    placement: "bottom",
    size: "compact",
    icon: "🗺️",
    badge: "VENUE MAP",
    title: "Venue Explorer",
    description:
      "Pinpoint Rotaract conferences and youth festivals geographically across Bengaluru and District 3192.",
  },
  {
    id: "my-tickets",
    target: "[data-tour='bottom-nav-tickets'], [data-tour='nav-tickets']",
    placement: "top",
    size: "compact",
    icon: "📱",
    badge: "MY PASSES",
    title: "Digital Passes & QR Entry",
    description:
      "Tap the center Tickets button in the mobile dock (or top bar on PC) for offline-compatible gate entry QR passes.",
  },
  {
    id: "nav-host",
    target: "[data-tour='nav-host'], [data-tour='bottom-nav'], [data-tour='nav-logo']",
    placement: "bottom",
    size: "compact",
    icon: "🚀",
    badge: "ORGANIZERS",
    title: "Host Events for Your Club",
    description:
      "Club leaders can launch events, configure multi-tier tickets, verify UPI payments, and scan passes on event day.",
  },
];

export const organizerDashboardTourSteps: TourStep[] = [
  {
    id: "welcome-org",
    target: null,
    placement: "center",
    size: "expanded",
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
    size: "compact",
    icon: "✨",
    badge: "EVENT WIZARD",
    title: "Create a New Event",
    description:
      "Launch a professional event listing in 5 minutes: set up venues, tiered pricing, bulk group discounts, and club UPI QR details.",
  },
  {
    id: "stats",
    target: "[data-tour='organizer-stats']",
    placement: "bottom",
    size: "compact",
    icon: "📊",
    badge: "METRICS",
    title: "Real-Time Sales & Check-in",
    description:
      "Real-time velocity tracking: total gross sales collected, number of passes issued, and live gate arrival rates.",
  },
  {
    id: "tab-events",
    target: "[data-tour='tab-events'], [data-tour='organizer-event-list'], [data-tour='mobile-menu-btn']",
    placement: "bottom",
    size: "compact",
    icon: "📅",
    badge: "EVENTS",
    title: "Active Events & Listings",
    description:
      "Manage club events, edit details, configure passes, and drill into dedicated event dashboards.",
  },
  {
    id: "pending-payments",
    target: "[data-tour='tab-orders'], [data-tour='pending-payments'], [data-tour='mobile-menu-btn']",
    placement: "bottom",
    size: "compact",
    icon: "💳",
    badge: "UPI APPROVALS",
    title: "Orders & UPI Approvals",
    description:
      "Review UTR transaction numbers and payment screenshot proofs. Approving an order immediately sends the QR pass to the delegate.",
  },
  {
    id: "tab-attendees",
    target: "[data-tour='tab-attendees'], [data-tour='mobile-menu-btn']",
    placement: "bottom",
    size: "compact",
    icon: "👥",
    badge: "ATTENDEES",
    title: "Attendee Guest List & Exports",
    description:
      "Search delegates by name, view check-in status, and export formatted Excel (.xlsx) spreadsheets with 1 click.",
  },
  {
    id: "tab-broadcast",
    target: "[data-tour='tab-broadcast'], [data-tour='mobile-menu-btn']",
    placement: "bottom",
    size: "compact",
    icon: "📢",
    badge: "BROADCASTS",
    title: "Official Email Broadcasts",
    description:
      "Send emergency schedule updates, delegate guidelines, and parking info directly to all registered attendees.",
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
