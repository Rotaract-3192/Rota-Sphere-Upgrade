/**
 * Tour step definitions for the RotaSphere onboarding system.
 * Steps use CSS selectors (data-tour attributes) to highlight DOM elements.
 * Add data-tour="step-id" to any element you want highlighted.
 */

export interface TourStep {
  id: string;
  title: string;
  description: string;
  /** CSS selector for the element to spotlight. null = center-screen tooltip */
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
    icon: "🌟",
    title: "Welcome to RotaSphere!",
    description:
      "This is your hub for all Rotaract District 3192 events. Let's take a quick 30-second tour of what you can do here.",
  },
  {
    id: "nav-events",
    target: "[data-tour='nav-events']",
    placement: "bottom",
    icon: "🎪",
    title: "Browse Events",
    description:
      "Discover upcoming conferences, sports fests, cultural nights, and community initiatives from all 85+ clubs in District 3192.",
  },
  {
    id: "search",
    target: "[data-tour='search-bar']",
    placement: "bottom",
    icon: "🔍",
    title: "Search & Filter",
    description:
      "Find exactly what you're looking for. Filter events by date, club, category, or city. Search by name or keyword.",
  },
  {
    id: "event-card",
    target: "[data-tour='event-card']:first-of-type",
    placement: "bottom",
    icon: "🎟️",
    title: "Event Cards",
    description:
      "Click any event to see full details — venue, schedule, ticket tiers, and the people behind it. Book directly from the event page.",
  },
  {
    id: "my-tickets",
    target: "[data-tour='nav-tickets']",
    placement: "top",
    icon: "📱",
    title: "Your Tickets",
    description:
      "All your booked passes live here. Each ticket has a QR code for gate check-in. You can share or transfer tickets to friends.",
  },
  {
    id: "profile",
    target: "[data-tour='nav-profile']",
    placement: "top",
    icon: "👤",
    title: "Your Profile",
    description:
      "View your Rotaract profile, manage personal details, and track your event history across District 3192.",
  },
];

export const organizerDashboardTourSteps: TourStep[] = [
  {
    id: "welcome-org",
    target: null,
    placement: "center",
    icon: "🎛️",
    title: "Your Organizer Command Center",
    description:
      "Welcome to the RotaSphere Organizer Dashboard! This is where you manage all your club's events. Let's take a quick tour.",
  },
  {
    id: "create-event",
    target: "[data-tour='create-event-btn']",
    placement: "bottom",
    icon: "✨",
    title: "Create a New Event",
    description:
      "Launch a new event in minutes — set dates, venue, ticket tiers, UPI payment details, and publish. Our wizard walks you through each step.",
  },
  {
    id: "event-list",
    target: "[data-tour='organizer-event-list']",
    placement: "right",
    icon: "📋",
    title: "Your Events",
    description:
      "All your past and upcoming events appear here. Click any event to open its dedicated management dashboard with full controls.",
  },
  {
    id: "stats",
    target: "[data-tour='organizer-stats']",
    placement: "bottom",
    icon: "📊",
    title: "Revenue & Stats",
    description:
      "See total revenue, tickets sold, and pending payments at a glance. Updated in real-time as registrations come in.",
  },
  {
    id: "pending-payments",
    target: "[data-tour='pending-payments']",
    placement: "right",
    icon: "💳",
    title: "Pending UPI Approvals",
    description:
      "Attendees who pay via UPI appear here for manual verification. Review their transaction screenshots and approve or reject with one click.",
  },
];

export const organizerEventTourSteps: TourStep[] = [
  {
    id: "event-overview",
    target: "[data-tour='event-dashboard-header']",
    placement: "bottom",
    icon: "🏟️",
    title: "Event Command Center",
    description:
      "Everything for this specific event lives here. Revenue, attendees, payments, check-in scanner — all in one place.",
  },
  {
    id: "tab-overview",
    target: "[data-tour='tab-overview']",
    placement: "bottom",
    icon: "📊",
    title: "Overview Tab",
    description:
      "Your live revenue dashboard — total collected, tickets sold per tier, and a real-time revenue chart.",
  },
  {
    id: "tab-orders",
    target: "[data-tour='tab-orders']",
    placement: "bottom",
    icon: "🧾",
    title: "Orders & Payments",
    description:
      "Every order placed for this event. Approve pending UPI payments, view UTR numbers, and see receipt screenshots.",
  },
  {
    id: "tab-attendees",
    target: "[data-tour='tab-attendees']",
    placement: "bottom",
    icon: "👥",
    title: "Attendee List",
    description:
      "Full attendee roster with club, designation, contact info, and check-in status. Export to CSV for event coordination.",
  },
  {
    id: "tab-tickets",
    target: "[data-tour='tab-tickets']",
    placement: "bottom",
    icon: "🎫",
    title: "Passes & Tiers",
    description:
      "Configure pass prices, attendee capacity, audience restrictions, and group bulk slab discounts.",
  },
  {
    id: "tab-broadcast",
    target: "[data-tour='tab-broadcast']",
    placement: "bottom",
    icon: "📢",
    title: "Broadcast Announcements",
    description:
      "Send official District email updates, gate passes, and schedule attachments directly to all registered delegates.",
  },
];
