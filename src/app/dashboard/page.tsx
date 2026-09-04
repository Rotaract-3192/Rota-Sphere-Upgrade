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

export default async function DashboardPage(props: {
  searchParams?: Promise<{ orgId?: string }>;
}) {
  const searchParams = props.searchParams ? await props.searchParams : {};
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Strict Role Gate: Allow organizers, admins, super_admins, OR users with APPROVED requests
  const reqRes = await getUserPendingOrganizerRequestAction();
  const hasApprovedRequest = reqRes.data?.status === "APPROVED";
  const userRole = user.profile?.role;
  const isSuperAdmin =
    userRole === "super_admin" ||
    userRole === "admin" ||
    user.email === "tech.rotaract3192@gmail.com";
  const isOrganizerOrAdmin =
    userRole === "organizer" ||
    isSuperAdmin ||
    hasApprovedRequest;

  if (!isOrganizerOrAdmin) {
    return <ApplyOrganizerClient user={user} existingRequest={reqRes.data} />;
  }

  const clerkUserId = user.clerkId;

  // 1. Resolve THIS user's active organization
  let organization: any = null;

  // A. If Super Admin specified an organization via query param, resolve it
  if (isSuperAdmin && searchParams?.orgId) {
    const { data: requestedOrgData } = await executeSql(`
      SELECT * FROM organizations WHERE id = '${searchParams.orgId}' LIMIT 1;
    `);
    organization = requestedOrgData?.[0] || null;
  }

  // B. Fetch THIS user's organization via membership table
  if (!organization) {
    const { data: memberData } = await executeSql(`
      SELECT o.*
      FROM organizations o
      INNER JOIN organization_members m ON o.id = m.organization_id
      WHERE m.user_id = '${clerkUserId}'
      LIMIT 1;
    `);
    organization = memberData?.[0] || null;
  }

  // C. If no membership row found, resolve from approved access request
  if (!organization) {
    const { resolveClubOrganizationId } = await import("@/app/actions/eventActions");
    const orgIdFromHelper = await resolveClubOrganizationId({
      userClerkId: clerkUserId,
      userEmail: user.email,
    });
    if (orgIdFromHelper) {
      const { data: directOrg } = await executeSql(`SELECT * FROM organizations WHERE id = '${orgIdFromHelper}' LIMIT 1;`);
      organization = directOrg?.[0] || null;
      if (organization) {
        // Auto-heal organization_members
        await executeSql(`
          INSERT INTO organization_members (organization_id, user_id, role, created_at, updated_at)
          VALUES ('${organization.id}', '${clerkUserId}', 'organizer_admin', NOW(), NOW())
          ON CONFLICT (organization_id, user_id) DO UPDATE SET role = 'organizer_admin', updated_at = NOW();
        `).catch(() => {});
      }
    }
  }

  // D. Fallback: Default to District 3192 Hub
  if (!organization) {
    const { data: districtOrgData } = await executeSql(`
      SELECT * FROM organizations 
      WHERE slug = 'district-3192-hub' OR id = '328ed943-f625-4fec-82a0-0c92dd7ec592'
      ORDER BY created_at ASC LIMIT 1;
    `);
    organization = districtOrgData?.[0] || null;
  }

  // Final fallback if organizations table is completely fresh
  const resolvedOrg = organization;
  const orgId = resolvedOrg?.id || "328ed943-f625-4fec-82a0-0c92dd7ec592";

  // Ensure max_per_order and tags columns exist
  try {
    await executeSql(`
      ALTER TABLE saas_ticket_tiers ADD COLUMN IF NOT EXISTS max_per_order INT DEFAULT 10;
      ALTER TABLE saas_events ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
    `);
  } catch (_) {}

  // 2. Fetch THIS organization's events strictly (district events in district hub, club events in club hub)
  const { data: eventsData } = await executeSql(`
    SELECT e.*,
      c.name as category_name,
      COALESCE(
        json_agg(
          json_build_object(
            'id', t.id,
            'name', t.name,
            'description', t.description,
            'tier_type', t.tier_type,
            'price', t.price,
            'total_capacity', t.total_capacity,
            'sold_count', t.sold_count,
            'reserved_count', t.reserved_count,
            'sales_start', t.sales_start,
            'sales_end', t.sales_end,
            'allow_non_rotaract', t.allow_non_rotaract,
            'allowed_audience', t.allowed_audience,
            'is_active', t.is_active,
            'is_visible', t.is_visible,
            'max_per_order', COALESCE(t.max_per_order, 10)
          )
        ) FILTER (WHERE t.id IS NOT NULL),
        '[]'
      ) as saas_ticket_tiers
    FROM saas_events e
    LEFT JOIN event_categories c ON e.category_id = c.id
    LEFT JOIN saas_ticket_tiers t ON e.id = t.event_id
    WHERE e.organization_id = '${orgId}'
    GROUP BY e.id, c.name
    ORDER BY e.created_at DESC;
  `);
  const events = eventsData || [];

  // 3. Fetch orders for THIS organization's events only (prevents cross-club UPI payment confusion)
  const { data: ordersData } = await executeSql(`
    SELECT o.*
    FROM saas_orders o
    INNER JOIN saas_events e ON o.event_id = e.id
    WHERE e.organization_id = '${orgId}'
    GROUP BY o.id
    ORDER BY
      CASE WHEN o.status = 'PENDING_VERIFICATION' THEN 0 ELSE 1 END,
      o.created_at DESC
    LIMIT 200;
  `);
  const orders = ordersData || [];

  // 4. Fetch tickets for THIS organization's events only
  const { data: ticketsData } = await executeSql(`
    SELECT t.*,
      o.status as order_status,
      json_build_object('title', e.title) as saas_events,
      json_build_object('name', tt.name, 'price', tt.price) as saas_ticket_tiers
    FROM saas_tickets t
    INNER JOIN saas_events e ON t.event_id = e.id
    LEFT JOIN saas_ticket_tiers tt ON t.ticket_tier_id = tt.id
    LEFT JOIN saas_orders o ON t.order_id = o.id
    WHERE e.organization_id = '${orgId}'
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

  // 6. If Super Admin, fetch clubs list to allow tenant switching if needed
  const { data: allOrgsData } = isSuperAdmin
    ? await executeSql(`SELECT id, name, slug, zone, club_type FROM organizations ORDER BY name ASC;`)
    : { data: [] };

  return (
    <OrganizerDashboardClient
      user={user}
      organization={resolvedOrg}
      initialEvents={events}
      initialOrders={orders}
      initialTickets={tickets}
      initialCoupons={coupons}
      allOrganizations={allOrgsData || []}
    />
  );
}
