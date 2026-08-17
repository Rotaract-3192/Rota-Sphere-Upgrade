import { getCurrentUser } from "@/lib/auth/getUser";
import { executeSql } from "@/lib/db/directDb";
import { OrganizerDashboardClient } from "./OrganizerDashboardClient";
import { ApplyOrganizerClient } from "@/components/dashboard/ApplyOrganizerClient";
import { getUserPendingOrganizerRequestAction } from "@/app/actions/adminActions";
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

  // Strict Role Gate: Allow organizers, admins, super_admins, OR users with APPROVED requests
  const reqRes = await getUserPendingOrganizerRequestAction();
  const hasApprovedRequest = reqRes.data?.status === "APPROVED";
  const userRole = user.profile.role;
  const isOrganizerOrAdmin =
    userRole === "organizer" ||
    userRole === "admin" ||
    userRole === "super_admin" ||
    hasApprovedRequest ||
    user.email === "thejaswinps@gmail.com";

  if (!isOrganizerOrAdmin) {
    return <ApplyOrganizerClient user={user} existingRequest={reqRes.data} />;
  }

  const clerkUserId = user.clerkId;
  const isSuperAdmin = userRole === "super_admin" || user.email === "thejaswinps@gmail.com";
  const organizerCondition = isSuperAdmin
    ? ""
    : `AND (e.organizer_id = '${clerkUserId}' OR e.created_by_user_id = '${clerkUserId}')`;

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

  // 2. Fetch THIS organizer's events (strictly scoped to creator/organizer unless super_admin)
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
    WHERE (e.deleted_at IS NULL OR e.status != 'TRASHED') ${organizerCondition}
    GROUP BY e.id
    ORDER BY e.created_at DESC;
  `);
  const events = eventsData || [];

  // 3. Fetch orders for THIS organizer's events only
  const { data: ordersData } = await executeSql(`
    SELECT o.*
    FROM saas_orders o
    INNER JOIN saas_events e ON o.event_id = e.id
    WHERE 1=1 ${organizerCondition}
    GROUP BY o.id
    ORDER BY
      CASE WHEN o.status = 'PENDING_VERIFICATION' THEN 0 ELSE 1 END,
      o.created_at DESC
    LIMIT 200;
  `);
  const orders = ordersData || [];

  // 4. Fetch tickets for THIS organizer's events only
  const { data: ticketsData } = await executeSql(`
    SELECT t.*,
      json_build_object('title', e.title) as saas_events,
      json_build_object('name', tt.name, 'price', tt.price) as saas_ticket_tiers
    FROM saas_tickets t
    INNER JOIN saas_events e ON t.event_id = e.id
    LEFT JOIN saas_ticket_tiers tt ON t.ticket_tier_id = tt.id
    WHERE 1=1 ${organizerCondition}
    ORDER BY t.created_at DESC
    LIMIT 200;
  `);
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
