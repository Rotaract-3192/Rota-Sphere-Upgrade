"use server";

/**
 * Super Admin Server Actions
 * Platform governance, KYC approvals, fee configurations, event moderation, and feature flags.
 */

import { requireAuth } from "@/lib/auth/getUser";
import { executeSql } from "@/lib/db/directDb";
import { logAuditAction } from "@/lib/services/auditService";
import { revalidatePath } from "next/cache";

function escapeSql(str: any): string {
  if (str === null || str === undefined) return "NULL";
  if (typeof str === "number" || typeof str === "boolean") return String(str);
  return `'${String(str).replace(/'/g, "''")}'`;
}

export async function approveOrganizationKycAction(organizationId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireAuth();

    await executeSql(`
      UPDATE organizations
      SET kyc_status = 'VERIFIED', is_verified = true, updated_at = NOW()
      WHERE id = ${escapeSql(organizationId)};
    `);

    await logAuditAction({
      actorId: user.clerkId,
      actorRole: user.profile.role,
      actorEmail: user.email,
      action: "KYC_APPROVED",
      entityType: "ORGANIZATION",
      entityId: organizationId,
      organizationId,
      newState: { kyc_status: "VERIFIED" },
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

export async function rejectOrganizationKycAction(organizationId: string, reason: string): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireAuth();

    await executeSql(`
      UPDATE organizations
      SET kyc_status = 'REJECTED', kyc_rejection_reason = ${escapeSql(reason)}, is_verified = false, updated_at = NOW()
      WHERE id = ${escapeSql(organizationId)};
    `);

    await logAuditAction({
      actorId: user.clerkId,
      actorRole: user.profile.role,
      actorEmail: user.email,
      action: "KYC_REJECTED",
      entityType: "ORGANIZATION",
      entityId: organizationId,
      organizationId,
      newState: { kyc_status: "REJECTED", reason },
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

export async function setEventStatusAction(
  eventId: string,
  status: "PUBLISHED" | "DRAFT" | "SUSPENDED" | "CANCELLED"
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireAuth();

    await executeSql(`
      UPDATE saas_events
      SET status = ${escapeSql(status)}, updated_at = NOW()
      WHERE id = ${escapeSql(eventId)};
    `);

    await logAuditAction({
      actorId: user.clerkId,
      actorRole: user.profile.role,
      actorEmail: user.email,
      action: `EVENT_STATUS_${status}`,
      entityType: "EVENT",
      entityId: eventId,
      newState: { status },
    });

    revalidatePath("/admin");
    revalidatePath("/events");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

export async function toggleEventFeatureAction(eventId: string, isFeatured: boolean): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireAuth();

    await executeSql(`
      UPDATE saas_events
      SET is_featured = ${isFeatured ? "TRUE" : "FALSE"}, updated_at = NOW()
      WHERE id = ${escapeSql(eventId)};
    `);

    await logAuditAction({
      actorId: user.clerkId,
      actorRole: user.profile.role,
      actorEmail: user.email,
      action: isFeatured ? "EVENT_FEATURED" : "EVENT_UNFEATURED",
      entityType: "EVENT",
      entityId: eventId,
      newState: { is_featured: isFeatured },
    });

    revalidatePath("/events");
    revalidatePath("/admin");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

export async function togglePlatformFeatureFlagAction(flagId: string, isEnabled: boolean): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireAuth();

    await executeSql(`
      UPDATE platform_feature_flags
      SET is_enabled = ${isEnabled ? "TRUE" : "FALSE"}, updated_at = NOW()
      WHERE id::text = ${escapeSql(flagId)} OR name = ${escapeSql(flagId)};
    `);

    await logAuditAction({
      actorId: user.clerkId,
      actorRole: user.profile.role,
      actorEmail: user.email,
      action: "FEATURE_FLAG_TOGGLED",
      entityType: "FEATURE_FLAG",
      entityId: flagId,
      newState: { is_enabled: isEnabled },
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

export async function createOrganizationAction(data: {
  name: string;
  slug: string;
  city: string;
  supportEmail: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireAuth();

    await executeSql(`
      INSERT INTO organizations (name, slug, city, support_email, kyc_status, is_verified, created_at, updated_at)
      VALUES (
        ${escapeSql(data.name)},
        ${escapeSql(data.slug)},
        ${escapeSql(data.city)},
        ${escapeSql(data.supportEmail)},
        'VERIFIED',
        TRUE,
        NOW(),
        NOW()
      );
    `);

    await logAuditAction({
      actorId: user.clerkId,
      actorRole: user.profile.role,
      actorEmail: user.email,
      action: "ORGANIZATION_CREATED",
      entityType: "ORGANIZATION",
      entityId: data.slug,
      newState: data,
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

// ── ORGANIZER ACCESS REQUESTS WORKFLOW ───────────────────────────────────────

async function ensureOrganizerRequestsTable() {
  await executeSql(`
    CREATE TABLE IF NOT EXISTS organizer_access_requests (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id VARCHAR(255) NOT NULL,
      user_name VARCHAR(255) NOT NULL,
      user_email VARCHAR(255) NOT NULL,
      club_name VARCHAR(255) NOT NULL,
      organization_id VARCHAR(255),
      position VARCHAR(255) NOT NULL,
      reason TEXT NOT NULL,
      status VARCHAR(50) DEFAULT 'PENDING',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    ALTER TABLE organizer_access_requests ADD COLUMN IF NOT EXISTS organization_id VARCHAR(255);
  `);
}

export async function submitOrganizerAccessRequestAction(data: {
  clubName: string;
  organizationId?: string;
  position: string;
  reason: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireAuth();
    await ensureOrganizerRequestsTable();

    const existingRes = await executeSql(`
      SELECT id FROM organizer_access_requests
      WHERE user_id = ${escapeSql(user.clerkId)} AND status = 'PENDING'
      LIMIT 1;
    `);

    if (existingRes.data && existingRes.data.length > 0) {
      return { success: false, error: "You already have a pending organizer access request under review by the District Admin." };
    }

    // Resolve organization ID if not explicitly passed
    let orgId = data.organizationId;
    if (!orgId && data.clubName) {
      const orgRes = await executeSql(`
        SELECT id FROM organizations WHERE name ILIKE ${escapeSql(data.clubName.trim())} LIMIT 1;
      `);
      orgId = orgRes.data?.[0]?.id;
    }

    await executeSql(`
      INSERT INTO organizer_access_requests (user_id, user_name, user_email, club_name, organization_id, position, reason, status)
      VALUES (
        ${escapeSql(user.clerkId)},
        ${escapeSql(user.profile.full_name || user.email)},
        ${escapeSql(user.email)},
        ${escapeSql(data.clubName)},
        ${escapeSql(orgId || null)},
        ${escapeSql(data.position)},
        ${escapeSql(data.reason)},
        'PENDING'
      );
    `);

    revalidatePath("/dashboard");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

export async function getOrganizerAccessRequestsAction(): Promise<{ success: boolean; data?: any[]; error?: string }> {
  try {
    const user = await requireAuth();
    await ensureOrganizerRequestsTable();

    const res = await executeSql(`
      SELECT * FROM organizer_access_requests
      ORDER BY created_at DESC;
    `);

    return { success: true, data: res.data || [] };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

export async function approveOrganizerAccessRequestAction(requestId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireAuth();

    const reqRes = await executeSql(`
      SELECT * FROM organizer_access_requests WHERE id::text = ${escapeSql(requestId)} LIMIT 1;
    `);
    const req = reqRes.data?.[0];
    if (!req) return { success: false, error: "Access request not found" };

    await executeSql(`
      UPDATE organizer_access_requests
      SET status = 'APPROVED', updated_at = NOW()
      WHERE id::text = ${escapeSql(requestId)};
    `);

    await executeSql(`
      UPDATE rotasphere_profiles
      SET role = 'organizer', designation = ${escapeSql(`${req.position} (${req.club_name})`)}, updated_at = NOW()
      WHERE id = ${escapeSql(req.user_id)};
    `);

    // Find the matching club organization
    let orgId = req.organization_id;
    if (!orgId && req.club_name) {
      const findOrg = await executeSql(`
        SELECT id FROM organizations WHERE name ILIKE ${escapeSql(req.club_name.trim())} LIMIT 1;
      `);
      orgId = findOrg.data?.[0]?.id;
    }

    if (!orgId) {
      const fallbackOrg = await executeSql(`SELECT id FROM organizations ORDER BY created_at ASC LIMIT 1;`);
      orgId = fallbackOrg.data?.[0]?.id;
    }

    if (orgId) {
      await executeSql(`
        INSERT INTO organization_members (organization_id, user_id, role, created_at)
        VALUES (${escapeSql(orgId)}, ${escapeSql(req.user_id)}, 'ORGANIZER', NOW())
        ON CONFLICT (organization_id, user_id) DO UPDATE SET role = 'ORGANIZER';
      `);
    }

    await logAuditAction({
      actorId: user.clerkId,
      actorRole: user.profile.role,
      actorEmail: user.email,
      action: "ORGANIZER_REQUEST_APPROVED",
      entityType: "USER",
      entityId: req.user_id,
      newState: { role: "organizer", club: req.club_name, organization_id: orgId },
    });

    revalidatePath("/admin");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

export async function rejectOrganizerAccessRequestAction(requestId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireAuth();

    await executeSql(`
      UPDATE organizer_access_requests
      SET status = 'REJECTED', updated_at = NOW()
      WHERE id::text = ${escapeSql(requestId)};
    `);

    revalidatePath("/admin");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

export async function getUserPendingOrganizerRequestAction(): Promise<{ success: boolean; data?: any }> {
  try {
    const user = await requireAuth();
    await ensureOrganizerRequestsTable();

    const res = await executeSql(`
      SELECT * FROM organizer_access_requests
      WHERE user_id = ${escapeSql(user.clerkId)}
      ORDER BY created_at DESC
      LIMIT 1;
    `);

    return { success: true, data: res.data?.[0] || null };
  } catch (err: any) {
    return { success: false, data: null };
  }
}

export async function updateComplaintStatusAction(
  complaintId: string,
  status: "open" | "under_review" | "awaiting_info" | "resolved" | "rejected",
  resolution?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireAuth();
    const resolutionClause = resolution ? `, resolution = ${escapeSql(resolution)}, resolved_at = NOW()` : "";
    await executeSql(`
      UPDATE privacy_complaints
      SET status = ${escapeSql(status)}${resolutionClause}, updated_at = NOW()
      WHERE id::text = ${escapeSql(complaintId)} OR complaint_number = ${escapeSql(complaintId)};
    `);

    await logAuditAction({
      actorId: user.clerkId,
      actorRole: user.profile.role,
      actorEmail: user.email,
      action: `COMPLAINT_STATUS_${status.toUpperCase()}`,
      entityType: "COMPLAINT",
      entityId: complaintId,
      newState: { status, resolution },
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

export async function updatePrivacyRequestStatusAction(
  requestId: string,
  status: "open" | "in_progress" | "completed" | "rejected",
  resolution?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireAuth();
    const completedClause = status === "completed" ? `, completed_at = NOW()` : "";
    await executeSql(`
      UPDATE privacy_requests
      SET status = ${escapeSql(status)}${completedClause}, updated_at = NOW()
      WHERE id::text = ${escapeSql(requestId)} OR request_number = ${escapeSql(requestId)};
    `);

    await logAuditAction({
      actorId: user.clerkId,
      actorRole: user.profile.role,
      actorEmail: user.email,
      action: `PRIVACY_REQUEST_${status.toUpperCase()}`,
      entityType: "PRIVACY_REQUEST",
      entityId: requestId,
      newState: { status, resolution },
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

