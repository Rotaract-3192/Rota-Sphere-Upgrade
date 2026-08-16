import { getCurrentUser } from "@/lib/auth/getUser";
import { executeSql } from "@/lib/db/directDb";
import { OrganizerDashboardClient } from "./OrganizerDashboardClient";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Organizer SaaS Hub | RotaSphere",
  description: "Enterprise event ticketing, multi-tier pricing, inventory control, and gate operations.",
};

export const revalidate = 0; // Always fresh — orders change in real time

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const clerkUserId = user.clerkId;

  // 1. Fetch THIS user's organization via membership table
  const { data: memberData } = await executeSql(`
    SELECT o.*
    FROM organizations o
    INNER JOIN organization_members m ON o.id = m.organization_id
    WHERE m.user_id = '${clerkUserId}'
    LIMIT 1;
  `);
  const organization = memberData?.[0] || null;

  // Fallback: if user is super_admin or has no membership, fetch first org
  const { data: fallbackOrgData } = !organization
    ? await executeSql(`SELECT * FROM organizations ORDER BY created_at ASC LIMIT 1;`)
    : { data: null };
  const resolvedOrg = organization || fallbackOrgData?.[0] || null;
  const orgId = resolvedOrg?.id;

  // 2. Fetch THIS org's events with ticket tiers
  const { data: eventsData } = orgId
    ? await executeSql(`
        SELECT e.*,
          COALESCE(
            json_agg(
              json_build_object(
                'id', t.id,
                'name', t.name,
                'price', t.price,
                'total_capacity', t.total_capacity,
                'sold_count', t.sold_count,
                'reserved_count', t.reserved_count,
                'is_active', t.is_active
              )
            ) FILTER (WHERE t.id IS NOT NULL),
            '[]'
          ) as saas_ticket_tiers
        FROM saas_events e
        LEFT JOIN saas_ticket_tiers t ON e.id = t.event_id
        WHERE e.organization_id = '${orgId}'
        GROUP BY e.id
        ORDER BY e.created_at DESC;
      `)
    : { data: [] };
  const events = eventsData || [];

  // 3. Fetch ALL orders for THIS org's events (including PENDING_VERIFICATION)
  //    Join through saas_events to scope to org
  const { data: ordersData } = orgId
    ? await executeSql(`
        SELECT o.*
        FROM saas_orders o
        INNER JOIN saas_events e ON o.organization_id = e.organization_id
        WHERE o.organization_id = '${orgId}'
        GROUP BY o.id
        ORDER BY
          CASE WHEN o.status = 'PENDING_VERIFICATION' THEN 0 ELSE 1 END,
          o.created_at DESC
        LIMIT 200;
      `)
    : { data: [] };
  const orders = ordersData || [];

  // 4. Fetch tickets for THIS org's events
  const { data: ticketsData } = orgId
    ? await executeSql(`
        SELECT t.*,
          json_build_object('title', e.title) as saas_events,
          json_build_object('name', tt.name, 'price', tt.price) as saas_ticket_tiers
        FROM saas_tickets t
        LEFT JOIN saas_events e ON t.event_id = e.id
        LEFT JOIN saas_ticket_tiers tt ON t.ticket_tier_id = tt.id
        WHERE e.organization_id = '${orgId}'
        ORDER BY t.created_at DESC
        LIMIT 200;
      `)
    : { data: [] };
  const tickets = ticketsData || [];

  // 5. Fetch coupons for THIS org
  const { data: couponsData } = orgId
    ? await executeSql(`
        SELECT * FROM saas_coupons
        WHERE organization_id = '${orgId}'
        ORDER BY created_at DESC;
      `)
    : { data: [] };
  const coupons = couponsData || [];

  return (
    <OrganizerDashboardClient
      user={user}
      organization={resolvedOrg}
      initialEvents={events}
      initialOrders={orders}
      initialTickets={tickets}
      initialCoupons={coupons}
    />
  );
}
