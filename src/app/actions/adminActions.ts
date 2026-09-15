"use server";

/**
 * Super Admin Server Actions
 * Platform governance, KYC approvals, fee configurations, event moderation, and feature flags.
 * Enforces strict Role-Based Access Control (RBAC) to protect administrative functions.
 */

import { requireAuth, requireRole } from "@/lib/auth/getUser";
import { executeSql, escapeSql } from "@/lib/db/directDb";
import { logAuditAction } from "@/lib/services/auditService";
import { logger } from "@/lib/logger/logger";
import { clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function approveOrganizationKycAction(organizationId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireRole("admin");

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
    const user = await requireRole("admin");

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
    const user = await requireRole("admin");

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
    const user = await requireRole("admin");

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
    const user = await requireRole("super_admin");

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
    const user = await requireRole("admin");

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
    await requireRole("admin");
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
    const user = await requireRole("admin");

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

    const desig = `${req.position || 'Club Officer'} (${req.club_name || 'Rotaract Club'})`;

    // 1. Update existing profile or insert new if missing
    const updateRes = await executeSql(`
      UPDATE rotasphere_profiles
      SET role = 'organizer',
          designation = ${escapeSql(desig)},
          updated_at = NOW()
      WHERE clerk_id = ${escapeSql(req.user_id)} OR id::text = ${escapeSql(req.user_id)} OR email ILIKE ${escapeSql(req.user_email)};
    `);

    // If no row existed, insert profile record
    if (!updateRes.data || updateRes.data.length === 0) {
      try {
        await executeSql(`
          INSERT INTO rotasphere_profiles (id, clerk_id, email, full_name, role, status, designation, created_at, updated_at)
          VALUES (
            gen_random_uuid(),
            ${escapeSql(req.user_id)},
            ${escapeSql(req.user_email)},
            ${escapeSql(req.user_name || req.user_email)},
            'organizer',
            'ACTIVE',
            ${escapeSql(desig)},
            NOW(),
            NOW()
          )
          ON CONFLICT (clerk_id) DO UPDATE
          SET role = 'organizer',
              designation = ${escapeSql(desig)},
              updated_at = NOW();
        `);
      } catch (insertErr) {
        logger.warn("Could not insert organizer profile fallback", { error: String(insertErr) });
      }
    }

    // 2. Find and resolve the matching club organization
    const { resolveClubOrganizationId } = await import("@/app/actions/eventActions");
    let orgId = await resolveClubOrganizationId({
      clubName: req.club_name,
      explicitOrgId: req.organization_id,
      userClerkId: req.user_id,
      userEmail: req.user_email,
    });

    if (orgId) {
      await executeSql(`
        UPDATE organizer_access_requests
        SET organization_id = ${escapeSql(orgId)}, updated_at = NOW()
        WHERE id::text = ${escapeSql(requestId)};
      `);

      await executeSql(`
        INSERT INTO organization_members (organization_id, user_id, role, created_at, updated_at)
        VALUES (${escapeSql(orgId)}, ${escapeSql(req.user_id)}, 'organizer_admin', NOW(), NOW())
        ON CONFLICT (organization_id, user_id) DO UPDATE SET role = 'organizer_admin', updated_at = NOW();
      `);
    }

    // 3. Sync to Clerk public metadata
    try {
      const clerk = await clerkClient();
      await clerk.users.updateUserMetadata(req.user_id, {
        publicMetadata: {
          role: "organizer",
          designation: desig,
          club: req.club_name,
          organizationId: orgId,
        },
      });
    } catch (clerkErr) {
      logger.warn("Could not update Clerk metadata on organizer approval", { error: String(clerkErr) });
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
    const user = await requireRole("admin");

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
      WHERE user_id = ${escapeSql(user.clerkId)} OR user_email ILIKE ${escapeSql(user.email)}
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
    const user = await requireRole("admin");
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
    const user = await requireRole("admin");
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

/**
 * Grant Super Admin / Admin Executive Council Access to a User
 * Enables District Treasurer, District Secretary (Admin/Ops), DRR, and Webmasters
 * to manage the Super Admin command center.
 */
export async function grantSuperAdminAccessAction(params: {
  userId: string;
  role: "super_admin" | "admin";
  designation: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireRole("super_admin");

    const cleanDesignation = params.designation?.trim() || "District Council Executive";
    const targetRole = params.role === "admin" ? "admin" : "super_admin";

    // 1. Check if profile exists in database
    const { data: existing } = await executeSql(`
      SELECT id, email, full_name FROM rotasphere_profiles WHERE id = ${escapeSql(params.userId)} LIMIT 1;
    `);

    if (existing && existing.length > 0) {
      await executeSql(`
        UPDATE rotasphere_profiles
        SET role = ${escapeSql(targetRole)},
            designation = ${escapeSql(cleanDesignation)},
            status = 'ACTIVE',
            updated_at = NOW()
        WHERE id = ${escapeSql(params.userId)};
      `);
    } else {
      // Create profile row if user was only in Clerk
      try {
        const clerk = await clerkClient();
        const cu = await clerk.users.getUser(params.userId);
        const email = cu.emailAddresses[0]?.emailAddress || "user@rotasphere.org";
        const fullName = `${cu.firstName ?? ""} ${cu.lastName ?? ""}`.trim() || email.split("@")[0];

        await executeSql(`
          INSERT INTO rotasphere_profiles (id, email, full_name, role, status, designation, created_at, updated_at)
          VALUES (
            ${escapeSql(params.userId)},
            ${escapeSql(email)},
            ${escapeSql(fullName)},
            ${escapeSql(targetRole)},
            'ACTIVE',
            ${escapeSql(cleanDesignation)},
            NOW(),
            NOW()
          )
          ON CONFLICT (id) DO UPDATE SET
            role = ${escapeSql(targetRole)},
            designation = ${escapeSql(cleanDesignation)},
            status = 'ACTIVE',
            updated_at = NOW();
        `);
      } catch (insertErr) {
        logger.warn("Could not insert profile from Clerk fallback", { error: String(insertErr) });
      }
    }

    // 2. Also sync to Clerk public metadata
    try {
      const clerk = await clerkClient();
      await clerk.users.updateUserMetadata(params.userId, {
        publicMetadata: {
          role: targetRole,
          designation: cleanDesignation,
        },
      });
    } catch (clerkMetaErr) {
      logger.warn("Could not update Clerk metadata", { error: String(clerkMetaErr) });
    }

    await logAuditAction({
      actorId: user.clerkId,
      actorRole: user.profile.role,
      actorEmail: user.email,
      action: "SUPER_ADMIN_ROLE_GRANTED",
      entityType: "USER",
      entityId: params.userId,
      newState: { role: targetRole, designation: cleanDesignation },
    });

    revalidatePath("/admin");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err: any) {
    logger.error("grantSuperAdminAccessAction failed", { error: String(err) });
    return { success: false, error: err?.message || String(err) };
  }
}

/**
 * Revoke Super Admin / Admin Access from a User
 * Safely demotes user back to attendee or resets master root admin designation.
 */
export async function revokeSuperAdminAccessAction(params: {
  userId: string;
  newRole?: "organizer" | "attendee";
}): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireRole("super_admin");

    const { data: targetRows } = await executeSql(`
      SELECT id, email, role FROM rotasphere_profiles
      WHERE id = ${escapeSql(params.userId)}
      LIMIT 1;
    `);

    const targetUser = targetRows?.[0];
    if (targetUser?.email?.toLowerCase() === "tech.rotaract3192@gmail.com") {
      // For primary master account, reset designation back to District Super Administrator
      await executeSql(`
        UPDATE rotasphere_profiles
        SET designation = 'District Super Administrator',
            role = 'super_admin',
            updated_at = NOW()
        WHERE id = ${escapeSql(params.userId)};
      `);
      try {
        const clerk = await clerkClient();
        await clerk.users.updateUserMetadata(params.userId, {
          publicMetadata: {
            role: "super_admin",
            designation: "District Super Administrator",
          },
        });
      } catch (clerkErr) {
        logger.warn("Could not update Clerk metadata on master reset", { error: String(clerkErr) });
      }

      revalidatePath("/admin");
      revalidatePath("/dashboard");
      return { success: true };
    }

    const fallbackRole = params.newRole || "attendee";
    await executeSql(`
      UPDATE rotasphere_profiles
      SET role = ${escapeSql(fallbackRole)},
          designation = 'Rotaract Member',
          updated_at = NOW()
      WHERE id = ${escapeSql(params.userId)};
    `);

    try {
      const clerk = await clerkClient();
      await clerk.users.updateUserMetadata(params.userId, {
        publicMetadata: {
          role: fallbackRole,
          designation: "Rotaract Member",
        },
      });
    } catch (clerkErr) {
      logger.warn("Could not update Clerk metadata on revocation", { error: String(clerkErr) });
    }

    await logAuditAction({
      actorId: user.clerkId,
      actorRole: user.profile.role,
      actorEmail: user.email,
      action: "SUPER_ADMIN_ROLE_REVOKED",
      entityType: "USER",
      entityId: params.userId,
      newState: { role: fallbackRole },
    });

    revalidatePath("/admin");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err: any) {
    logger.error("revokeSuperAdminAccessAction failed", { error: String(err) });
    return { success: false, error: err?.message || String(err) };
  }
}

/**
 * Delete User Profile or Demote Admin Access Completely
 */
export async function deleteUserProfileAction(params: {
  userId: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireRole("super_admin");

    const { data: targetRows } = await executeSql(`
      SELECT id, email, role FROM rotasphere_profiles
      WHERE id = ${escapeSql(params.userId)}
      LIMIT 1;
    `);

    const targetUser = targetRows?.[0];
    if (targetUser?.email?.toLowerCase() === "tech.rotaract3192@gmail.com") {
      // For master root admin, reset designation to default
      await executeSql(`
        UPDATE rotasphere_profiles
        SET designation = 'District Super Administrator',
            role = 'super_admin',
            updated_at = NOW()
        WHERE id = ${escapeSql(params.userId)};
      `);
      try {
        const clerk = await clerkClient();
        await clerk.users.updateUserMetadata(params.userId, {
          publicMetadata: {
            role: "super_admin",
            designation: "District Super Administrator",
          },
        });
      } catch {}
      revalidatePath("/admin");
      return { success: true };
    }

    // Delete record from rotasphere_profiles
    await executeSql(`
      DELETE FROM rotasphere_profiles
      WHERE id = ${escapeSql(params.userId)};
    `);

    // Reset Clerk public metadata
    try {
      const clerk = await clerkClient();
      await clerk.users.updateUserMetadata(params.userId, {
        publicMetadata: {
          role: "attendee",
          designation: "Rotaract Member",
        },
      });
    } catch (clerkErr) {
      logger.warn("Could not reset Clerk user metadata", { error: String(clerkErr) });
    }

    await logAuditAction({
      actorId: user.clerkId,
      actorRole: user.profile.role,
      actorEmail: user.email,
      action: "USER_PROFILE_DELETED",
      entityType: "USER",
      entityId: params.userId,
      newState: { status: "DELETED" },
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (err: any) {
    logger.error("deleteUserProfileAction failed", { error: String(err) });
    return { success: false, error: err?.message || String(err) };
  }
}

/**
 * Fetch All Registered User Profiles for Admin Assignment
 * Combines rotasphere_profiles and Clerk registered users to guarantee no missing users.
 */
export async function getAllUserProfilesAction(): Promise<{ success: boolean; data?: any[]; error?: string }> {
  try {
    await requireRole("admin");

    const profileMap = new Map<string, any>();

    // 1. Fetch from rotasphere_profiles database
    try {
      const { data: dbProfiles } = await executeSql(`
        SELECT id, email, full_name, role, designation, status, created_at, updated_at
        FROM rotasphere_profiles
        ORDER BY created_at DESC;
      `);

      for (const p of dbProfiles || []) {
        if (p.id) profileMap.set(p.id, p);
        if (p.email) profileMap.set(p.email.toLowerCase(), p);
      }
    } catch (dbErr) {
      logger.warn("Could not query rotasphere_profiles directly", { error: String(dbErr) });
    }

    // 2. Fetch all registered users from Clerk authentication
    try {
      const clerk = await clerkClient();
      const clerkList = await clerk.users.getUserList({ limit: 200 });

      for (const cu of clerkList.data || []) {
        const primaryEmail = cu.emailAddresses[0]?.emailAddress?.toLowerCase() || "";
        const fullName = `${cu.firstName ?? ""} ${cu.lastName ?? ""}`.trim() || primaryEmail.split("@")[0] || "Member";

        const existing = profileMap.get(cu.id) || (primaryEmail ? profileMap.get(primaryEmail) : null);

        if (!existing) {
          profileMap.set(cu.id, {
            id: cu.id,
            email: primaryEmail,
            full_name: fullName,
            role: (cu.publicMetadata?.role as string) || "attendee",
            designation: (cu.publicMetadata?.designation as string) || "Rotaract Member",
            status: "ACTIVE",
            created_at: new Date(cu.createdAt).toISOString(),
            updated_at: new Date(cu.updatedAt).toISOString(),
          });
        }
      }
    } catch (clerkErr) {
      logger.warn("Clerk user list fetch fallback", { error: String(clerkErr) });
    }

    // Deduplicate by user ID
    const uniqueIds = Array.from(new Set(Array.from(profileMap.values()).map((p) => p.id)));
    const merged = uniqueIds
      .map((id) => Array.from(profileMap.values()).find((p) => p.id === id))
      .filter(Boolean)
      .sort((a, b) => {
        const roleRank: Record<string, number> = { super_admin: 1, admin: 2, organizer: 3, attendee: 4 };
        const rankA = roleRank[a.role] ?? 5;
        const rankB = roleRank[b.role] ?? 5;
        if (rankA !== rankB) return rankA - rankB;
        return (a.full_name || "").localeCompare(b.full_name || "");
      });

    return { success: true, data: merged };
  } catch (err: any) {
    logger.error("getAllUserProfilesAction failed", { error: String(err) });
    return { success: false, error: err?.message || String(err) };
  }
}

// ============================================================================
// BULK TICKET SLAB ADMIN ACTIONS
// ============================================================================

export interface CreateBulkSlabInput {
  name: string;
  description?: string;
  bulkSlabSize: number;        // exact number of attendees per purchase (e.g. 15)
  pricePerPerson: number;      // price per individual ticket in INR
  totalGroupSlots: number;     // total individual ticket capacity (groups × bulkSlabSize)
  salesStart: string;          // ISO timestamp
  salesEnd: string;            // ISO timestamp
}

/**
 * Admin creates a new bulk slab ticket tier for a given event.
 * min_per_order and max_per_order are both set to bulkSlabSize to enforce
 * exact quantity purchases at the server level.
 */
export async function createBulkSlabTierAction(
  eventId: string,
  input: CreateBulkSlabInput
): Promise<{ success: boolean; tierId?: string; error?: string }> {
  try {
    const user = await requireRole("admin");

    if (!input.name?.trim()) return { success: false, error: "Slab name is required." };
    if (!input.bulkSlabSize || input.bulkSlabSize < 2) return { success: false, error: "Group size must be at least 2." };
    if (input.bulkSlabSize > 200) return { success: false, error: "Group size cannot exceed 200." };
    if (input.pricePerPerson < 0) return { success: false, error: "Price per person cannot be negative." };
    if (!input.totalGroupSlots || input.totalGroupSlots < input.bulkSlabSize) {
      return { success: false, error: "Total capacity must be at least one group size." };
    }

    try {
      await executeSql(`
        ALTER TABLE saas_ticket_tiers ADD COLUMN IF NOT EXISTS is_bulk_slab BOOLEAN NOT NULL DEFAULT FALSE;
        ALTER TABLE saas_ticket_tiers ADD COLUMN IF NOT EXISTS bulk_slab_size INT DEFAULT NULL;
        ALTER TABLE saas_ticket_tiers DROP CONSTRAINT IF EXISTS saas_ticket_tiers_tier_type_check;
        ALTER TABLE saas_ticket_tiers ADD CONSTRAINT saas_ticket_tiers_tier_type_check CHECK (tier_type IN (
          'EARLY_BIRD', 'REGULAR', 'VIP', 'STUDENT', 'GROUP', 'FACULTY', 'WORKSHOP', 'COMPLIMENTARY', 'BULK'
        ));
      `);
    } catch (_) {}

    const { data, error } = await executeSql(`
      INSERT INTO saas_ticket_tiers (
        event_id, name, description, tier_type,
        price, total_capacity, sold_count, reserved_count,
        min_per_order, max_per_order,
        sales_start, sales_end,
        is_active, is_visible,
        is_bulk_slab, bulk_slab_size,
        benefits, created_at, updated_at
      ) VALUES (
        ${escapeSql(eventId)},
        ${escapeSql(input.name.trim())},
        ${input.description ? escapeSql(input.description.trim()) : "NULL"},
        'BULK',
        ${escapeSql(String(input.pricePerPerson))},
        ${escapeSql(String(input.totalGroupSlots))},
        0, 0,
        ${escapeSql(String(input.bulkSlabSize))},
        ${escapeSql(String(input.bulkSlabSize))},
        ${escapeSql(input.salesStart)},
        ${escapeSql(input.salesEnd)},
        true, true,
        true,
        ${escapeSql(String(input.bulkSlabSize))},
        '[]'::jsonb,
        NOW(), NOW()
      )
      RETURNING id;
    `);

    if (error || !data?.[0]?.id) {
      logger.error("createBulkSlabTierAction failed", { error });
      return { success: false, error: "Failed to create bulk slab. Check event ID and try again." };
    }

    await logAuditAction({
      actorId: user.clerkId,
      actorRole: user.profile.role,
      actorEmail: user.email,
      action: "BULK_SLAB_CREATED",
      entityType: "TICKET_TIER",
      entityId: data[0].id,
      newState: { ...input, tier_type: "BULK", is_bulk_slab: true },
    });

    revalidatePath("/admin");
    revalidatePath(`/events`);
    return { success: true, tierId: data[0].id };
  } catch (err: any) {
    logger.error("createBulkSlabTierAction error", { error: String(err) });
    return { success: false, error: err?.message || String(err) };
  }
}

/**
 * Toggle a bulk slab tier's active state (enable / disable sales).
 */
export async function toggleBulkSlabActiveAction(
  tierId: string,
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireRole("admin");

    await executeSql(`
      UPDATE saas_ticket_tiers
      SET is_active = ${isActive ? "true" : "false"}, updated_at = NOW()
      WHERE id = ${escapeSql(tierId)} AND is_bulk_slab = true;
    `);

    await logAuditAction({
      actorId: user.clerkId,
      actorRole: user.profile.role,
      actorEmail: user.email,
      action: isActive ? "BULK_SLAB_ENABLED" : "BULK_SLAB_DISABLED",
      entityType: "TICKET_TIER",
      entityId: tierId,
      newState: { is_active: isActive },
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

/**
 * Delete a bulk slab tier (only if no tickets have been sold for it).
 */
export async function deleteBulkSlabTierAction(
  tierId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireRole("admin");

    const { data: tier } = await executeSql(`
      SELECT id, name, sold_count FROM saas_ticket_tiers
      WHERE id = ${escapeSql(tierId)} AND is_bulk_slab = true;
    `);

    if (!tier?.[0]) return { success: false, error: "Bulk slab not found." };
    if (Number(tier[0].sold_count) > 0) {
      return { success: false, error: "Cannot delete a slab that already has sold tickets." };
    }

    await executeSql(`
      DELETE FROM saas_ticket_tiers WHERE id = ${escapeSql(tierId)} AND is_bulk_slab = true;
    `);

    await logAuditAction({
      actorId: user.clerkId,
      actorRole: user.profile.role,
      actorEmail: user.email,
      action: "BULK_SLAB_DELETED",
      entityType: "TICKET_TIER",
      entityId: tierId,
      previousState: { name: tier[0].name },
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

/**
 * Fetch all bulk orders for a given event — returns grouped attendee lists.
 */
export async function getBulkSlabOrdersAction(
  eventId: string
): Promise<{ success: boolean; orders?: any[]; error?: string }> {
  try {
    await requireRole("admin");

    const { data, error } = await executeSql(`
      SELECT
        o.id AS order_id,
        o.order_number,
        o.customer_name,
        o.customer_email,
        o.customer_phone,
        o.total_amount,
        o.status AS order_status,
        o.created_at AS ordered_at,
        t.name AS tier_name,
        t.bulk_slab_size,
        t.price AS price_per_person,
        (
          SELECT json_agg(
            json_build_object(
              'id', tk.id,
              'ticket_code', tk.ticket_code,
              'attendee_name', tk.attendee_name,
              'attendee_email', tk.attendee_email,
              'attendee_phone', tk.attendee_phone,
              'status', tk.status,
              'bulk_order_group_id', tk.bulk_order_group_id
            ) ORDER BY tk.created_at
          )
          FROM saas_tickets tk
          WHERE tk.order_id = o.id
        ) AS attendees
      FROM saas_orders o
      JOIN saas_ticket_tiers t ON t.id = (
        SELECT ticket_tier_id FROM saas_tickets WHERE order_id = o.id LIMIT 1
      )
      WHERE o.event_id = ${escapeSql(eventId)}
        AND t.is_bulk_slab = true
      ORDER BY o.created_at DESC;
    `);

    if (error) return { success: false, error: String(error) };
    return { success: true, orders: data || [] };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

/**
 * Fetch all bulk slabs for a given event.
 */
export async function getBulkSlabsForEventAction(
  eventId: string
): Promise<{ success: boolean; slabs?: any[]; error?: string }> {
  try {
    await requireRole("admin");
    const { data, error } = await executeSql(`
      SELECT *
      FROM saas_ticket_tiers
      WHERE event_id = ${escapeSql(eventId)}
        AND is_bulk_slab = true
      ORDER BY created_at ASC;
    `);
    if (error) return { success: false, error: String(error) };
    return { success: true, slabs: data || [] };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

