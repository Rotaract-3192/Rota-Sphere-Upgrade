"use client";

import { useRouter } from "next/navigation";
import { BulkEmailModal } from "@/components/shared/BulkEmailModal";

interface BulkEmailBroadcastClientProps {
  user: any;
  events: Array<{ id: string; title: string }>;
  auditLogs: Array<any>;
}

export function BulkEmailBroadcastClient({
  user,
  events,
}: BulkEmailBroadcastClientProps) {
  const router = useRouter();

  return (
    <BulkEmailModal
      isOpen={true}
      onClose={() => router.push("/dashboard")}
      events={events}
      isSuperAdmin={user?.profile?.role === "super_admin"}
    />
  );
}
