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
