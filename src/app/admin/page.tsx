import { getCurrentUser } from "@/lib/auth/getUser";
import { executeSql } from "@/lib/db/directDb";
import { SuperAdminDashboardClient } from "./SuperAdminDashboardClient";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Super Admin Governance Panel | RotaSphere SaaS",
  description: "Platform-wide KYC moderation, event approvals, immutable audit logs, and fee rules.",
};

export default async function AdminPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const isSuperAdmin = user.profile?.role === "super_admin" || user.email === "thejaswinps@gmail.com";
  if (!isSuperAdmin) {
    redirect("/dashboard");
  }

  const { data: orgsData } = await executeSql(`SELECT * FROM organizations ORDER BY created_at DESC;`);
  const organizations = orgsData || [];

  const { data: eventsData } = await executeSql(`
    SELECT e.*, json_build_object('name', o.name) as organizations
    FROM saas_events e
    LEFT JOIN organizations o ON e.organization_id = o.id
    ORDER BY e.created_at DESC;
  `);
  const events = eventsData || [];

  const { data: ordersData } = await executeSql(`SELECT * FROM saas_orders ORDER BY created_at DESC LIMIT 100;`);
  const orders = ordersData || [];

  const { data: auditData } = await executeSql(`SELECT * FROM platform_audit_logs ORDER BY created_at DESC LIMIT 50;`);
  const auditLogs = auditData || [];

  const { data: flagsData } = await executeSql(`SELECT * FROM platform_feature_flags ORDER BY name;`);
  const featureFlags = flagsData || [];

  return (
    <SuperAdminDashboardClient
      user={user}
      initialOrganizations={organizations}
      initialEvents={events}
      initialOrders={orders}
      initialAuditLogs={auditLogs}
      initialFeatureFlags={featureFlags}
    />
  );
}
