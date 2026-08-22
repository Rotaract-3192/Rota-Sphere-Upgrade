import { getCurrentUser, isConfiguredAdminEmail } from "@/lib/auth/getUser";
import { executeSql } from "@/lib/db/directDb";
import { SuperAdminDashboardClient } from "./SuperAdminDashboardClient";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Super Admin Governance Panel | RotaSphere SaaS",
  description: "Platform-wide KYC moderation, event approvals, financial ledger, gate analytics, and fee rules.",
};

export default async function AdminPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const isSuperAdmin =
    user.profile?.role === "super_admin" ||
    user.profile?.role === "admin" ||
    user.email === "tech.rotaract3192@gmail.com" ||
    isConfiguredAdminEmail(user.email);
  if (!isSuperAdmin) {
    redirect("/dashboard");
  }

  const { getDistrictClubsAction } = await import("@/app/actions/clubActions");
  const clubsRes = await getDistrictClubsAction();
  const organizations = clubsRes.data || [];

  const { data: eventsData } = await executeSql(`
    SELECT e.*, 
      json_build_object('name', o.name) as organizations,
      COALESCE(
        (SELECT json_agg(tt.*) FROM saas_ticket_tiers tt WHERE tt.event_id = e.id),
        '[]'::json
      ) as saas_ticket_tiers
    FROM saas_events e
    LEFT JOIN organizations o ON e.organization_id = o.id
    ORDER BY e.created_at DESC;
  `);
  const events = eventsData || [];

  const { data: ordersData } = await executeSql(`
    SELECT o.*, e.title as event_title
    FROM saas_orders o
    LEFT JOIN saas_events e ON o.event_id = e.id
    ORDER BY o.created_at DESC LIMIT 200;
  `);
  const orders = ordersData || [];

  const { data: ticketsData } = await executeSql(`
    SELECT t.*, e.title as event_title, tt.name as tier_name
    FROM saas_tickets t
    LEFT JOIN saas_events e ON t.event_id = e.id
    LEFT JOIN saas_ticket_tiers tt ON t.ticket_tier_id = tt.id
    ORDER BY t.created_at DESC LIMIT 200;
  `);
  const tickets = ticketsData || [];

  const { data: checkInsData } = await executeSql(`
    SELECT c.*, e.title as event_title
    FROM check_in_logs c
    LEFT JOIN saas_events e ON c.event_id = e.id
    ORDER BY c.created_at DESC LIMIT 50;
  `);
  const checkInLogs = checkInsData || [];

  const { data: auditData } = await executeSql(`SELECT * FROM platform_audit_logs ORDER BY created_at DESC LIMIT 50;`);
  const auditLogs = auditData || [];

  const { data: flagsData } = await executeSql(`SELECT * FROM platform_feature_flags ORDER BY name;`);
  const featureFlags = flagsData || [];

  const { data: organizerReqsData } = await executeSql(`
    SELECT * FROM organizer_access_requests ORDER BY created_at DESC LIMIT 100;
  `).catch(() => ({ data: [] }));
  const organizerRequests = organizerReqsData || [];

  const { data: complaintsData } = await executeSql(`
    SELECT * FROM privacy_complaints ORDER BY created_at DESC LIMIT 100;
  `).catch(() => ({ data: [] }));
  const complaints = complaintsData || [];

  const { data: privacyReqsData } = await executeSql(`
    SELECT * FROM privacy_requests ORDER BY created_at DESC LIMIT 100;
  `).catch(() => ({ data: [] }));
  const privacyRequests = privacyReqsData || [];

  const { getAllUserProfilesAction } = await import("@/app/actions/adminActions");
  const profilesRes = await getAllUserProfilesAction().catch(() => ({ success: false, data: [] }));
  const initialProfiles = (profilesRes.data && profilesRes.data.length > 0)
    ? profilesRes.data
    : [user.profile];

  return (
    <SuperAdminDashboardClient
      user={user}
      initialOrganizations={organizations}
      initialEvents={events}
      initialOrders={orders}
      initialTickets={tickets}
      initialCheckInLogs={checkInLogs}
      initialAuditLogs={auditLogs}
      initialFeatureFlags={featureFlags}
      initialOrganizerRequests={organizerRequests}
      initialComplaints={complaints}
      initialPrivacyRequests={privacyRequests}
      initialProfiles={initialProfiles}
    />
  );
}
