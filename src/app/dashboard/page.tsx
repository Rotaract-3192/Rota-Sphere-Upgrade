import { getCurrentUser } from "@/lib/auth/getUser";
import { executeSql } from "@/lib/db/directDb";
import { OrganizerDashboardClient } from "./OrganizerDashboardClient";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Organizer SaaS Hub | RotaSphere",
  description: "Enterprise event ticketing, multi-tier pricing, inventory control, and gate operations.",
};

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  // 1. Fetch organization
  const { data: orgData } = await executeSql(`
    SELECT * FROM organizations LIMIT 1;
  `);
  const organization = orgData?.[0] || null;

  // 2. Fetch events with ticket tiers
  const { data: eventsData } = await executeSql(`
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
    GROUP BY e.id
    ORDER BY e.created_at DESC;
  `);
  const events = eventsData || [];

  // 3. Fetch orders
  const { data: ordersData } = await executeSql(`
    SELECT * FROM saas_orders ORDER BY created_at DESC LIMIT 50;
  `);
  const orders = ordersData || [];

  // 4. Fetch tickets
  const { data: ticketsData } = await executeSql(`
    SELECT t.*, 
      json_build_object('title', e.title) as saas_events,
      json_build_object('name', tt.name, 'price', tt.price) as saas_ticket_tiers
    FROM saas_tickets t
    LEFT JOIN saas_events e ON t.event_id = e.id
    LEFT JOIN saas_ticket_tiers tt ON t.ticket_tier_id = tt.id
    ORDER BY t.created_at DESC
    LIMIT 100;
  `);
  const tickets = ticketsData || [];

  // 5. Fetch coupons
  const { data: couponsData } = await executeSql(`
    SELECT * FROM saas_coupons ORDER BY created_at DESC;
  `);
  const coupons = couponsData || [];

  return (
    <OrganizerDashboardClient
      user={user}
      organization={organization}
      initialEvents={events}
      initialOrders={orders}
      initialTickets={tickets}
      initialCoupons={coupons}
    />
  );
}
