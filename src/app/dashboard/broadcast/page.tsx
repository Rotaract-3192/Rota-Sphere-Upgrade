import { getCurrentUser, requireAuth } from "@/lib/auth/getUser";
import { executeSql } from "@/lib/db/directDb";
import { BulkEmailBroadcastClient } from "./BulkEmailBroadcastClient";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Bulk Email Broadcast & Announcements | RotaSphere Hub",
  description: "Send bulk emails, event rules, and official announcements to attendees via Nodemailer.",
};

export default async function BulkEmailBroadcastPage(props: {
  searchParams?: Promise<{ orgId?: string }>;
}) {
  const searchParams = props.searchParams ? await props.searchParams : {};
  const user = await getCurrentUser();
  if (!user) {
    redirect("/sign-in");
  }

  let orgId = searchParams?.orgId;
  if (!orgId) {
    const { data: memberData } = await executeSql(`
      SELECT organization_id FROM organization_members WHERE user_id = '${user.clerkId}' LIMIT 1;
    `);
    orgId = memberData?.[0]?.organization_id || "328ed943-f625-4fec-82a0-0c92dd7ec592";
  }

  // Fetch active events for selector (scoped to organization)
  const { data: eventsData } = await executeSql(`
    SELECT id, title, city, status, start_date 
    FROM saas_events 
    WHERE status != 'TRASHED' AND deleted_at IS NULL AND organization_id = '${orgId}'
    ORDER BY created_at DESC;
  `);

  // Fetch recent bulk broadcast audit logs
  const { data: logsData } = await executeSql(`
    SELECT id, actor_email, action, entity_type, new_state, created_at
    FROM saas_audit_logs
    WHERE action = 'BULK_EMAIL_BROADCAST_SENT'
    ORDER BY created_at DESC
    LIMIT 20;
  `);

  return (
    <BulkEmailBroadcastClient
      user={user}
      events={eventsData || []}
      auditLogs={logsData || []}
    />
  );
}
