import { getCurrentUser } from "@/lib/auth/getUser";
import { executeSql, escapeSql } from "@/lib/db/directDb";
import { EventDashboardClient } from "./EventDashboardClient";
import { notFound, redirect } from "next/navigation";

export const revalidate = 0; // Real-time freshness

export async function generateMetadata(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const { data } = await executeSql(`
    SELECT title FROM saas_events WHERE id = ${escapeSql(id)} OR slug = ${escapeSql(id)} LIMIT 1;
  `);
  const event = data?.[0];
  return {
    title: event ? `${event.title} • Event Command Center | RotaSphere` : "Event Dashboard | RotaSphere",
    description: "Real-time event ticketing, attendee check-ins, UPI approvals, and revenue analytics.",
  };
}

export default async function DedicatedEventDashboardPage(props: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ tab?: string }>;
}) {
  const { id: eventParam } = await props.params;
  const searchParams = props.searchParams ? await props.searchParams : {};
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const isSuperAdmin =
    user.profile?.role === "super_admin" ||
    user.profile?.role === "admin" ||
    user.email === "tech.rotaract3192@gmail.com";

  // 1. Fetch Event with joined organization & category
  const { data: eventData } = await executeSql(`
    SELECT e.*,
      c.name as category_name,
      json_build_object(
        'id', o.id,
        'name', o.name,
        'slug', o.slug,
        'zone', o.zone
      ) as organization
    FROM saas_events e
    LEFT JOIN event_categories c ON e.category_id = c.id
    LEFT JOIN organizations o ON e.organization_id = o.id
    WHERE e.id = ${escapeSql(eventParam)} OR e.slug = ${escapeSql(eventParam)}
    LIMIT 1;
  `);

  const event = eventData?.[0];
  if (!event) {
    notFound();
  }

  const eventId = event.id;

  // 2. Authorization Check:
  // Must be super admin OR member/organizer of the organization that owns this event
  if (!isSuperAdmin) {
    const { data: membership } = await executeSql(`
      SELECT 1 FROM organization_members
      WHERE organization_id = ${escapeSql(event.organization_id)}
        AND user_id = ${escapeSql(user.clerkId)}
      LIMIT 1;
    `);

    if (!membership || membership.length === 0) {
      // Check if user has approved organizer status for this club
      const { data: reqData } = await executeSql(`
        SELECT 1 FROM organizer_access_requests
        WHERE user_id = ${escapeSql(user.clerkId)}
          AND status = 'APPROVED'
        LIMIT 1;
      `);
      if (!reqData || reqData.length === 0) {
        redirect("/dashboard");
      }
    }
  }

  // 3. Fetch Ticket Tiers with bulk slabs
  const { data: tiersData } = await executeSql(`
    SELECT t.*,
      COALESCE(
        (SELECT json_agg(s.*) FROM saas_ticket_slabs s WHERE s.tier_id = t.id),
        '[]'::json
      ) as slabs
    FROM saas_ticket_tiers t
    WHERE t.event_id = ${escapeSql(eventId)}
    ORDER BY t.created_at ASC;
  `);
  const ticketTiers = tiersData || [];

  // 4. Fetch Orders specifically for this event
  const { data: ordersData } = await executeSql(`
    SELECT o.*,
      ${escapeSql(event.title)} as event_title,
      ${escapeSql(event.slug)} as event_slug
    FROM saas_orders o
    WHERE o.event_id = ${escapeSql(eventId)}
    ORDER BY
      CASE WHEN o.status = 'PENDING_VERIFICATION' THEN 0 ELSE 1 END,
      o.created_at DESC
    LIMIT 300;
  `);
  const orders = ordersData || [];

  // 5. Fetch Tickets/Attendees specifically for this event
  const { data: ticketsData } = await executeSql(`
    SELECT t.*,
      o.status as order_status,
      o.order_number,
      o.total_amount as order_total_amount,
      o.upi_transaction_id as order_upi_transaction_id,
      json_build_object('title', ${escapeSql(event.title)}) as saas_events,
      json_build_object('name', tt.name, 'price', tt.price, 'tier_type', tt.tier_type) as saas_ticket_tiers
    FROM saas_tickets t
    LEFT JOIN saas_ticket_tiers tt ON t.ticket_tier_id = tt.id
    LEFT JOIN saas_orders o ON t.order_id = o.id
    WHERE t.event_id = ${escapeSql(eventId)}
    ORDER BY t.created_at DESC
    LIMIT 500;
  `);
  const tickets = ticketsData || [];

  // 6. Fetch Check-In Logs for this event
  const { data: checkInsData } = await executeSql(`
    SELECT *
    FROM check_in_logs
    WHERE event_id = ${escapeSql(eventId)}
    ORDER BY created_at DESC
    LIMIT 100;
  `);
  const checkInLogs = checkInsData || [];

  // 7. Fetch Categories for the Edit Event tab
  const { data: categoriesData } = await executeSql(`
    SELECT id, name FROM event_categories ORDER BY name ASC;
  `);
  const categories = categoriesData || [];

  return (
    <EventDashboardClient
      user={user}
      event={event}
      initialTiers={ticketTiers}
      initialOrders={orders}
      initialTickets={tickets}
      initialCheckIns={checkInLogs}
      categories={categories}
      initialTab={searchParams?.tab || "overview"}
    />
  );
}
