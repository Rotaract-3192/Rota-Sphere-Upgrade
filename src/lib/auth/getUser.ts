import { auth, currentUser } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/db/supabaseAdmin";
import { executeSql, escapeSql } from "@/lib/db/directDb";
import { logger } from "@/lib/logger/logger";
import type { Profile, UserRole } from "@/types/database";

export interface AuthUser {
  clerkId: string;
  email: string;
  profile: Profile;
}

const SUPER_ADMIN_EMAILS = [
  "tech.rotaract3192@gmail.com",
  ...(process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(",").map((e) => e.trim().toLowerCase()) : []),
  ...(process.env.ADMIN_EMAIL ? [process.env.ADMIN_EMAIL.trim().toLowerCase()] : []),
].map((e) => e.toLowerCase());

export function isConfiguredAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return SUPER_ADMIN_EMAILS.includes(email.toLowerCase().trim());
}

const VALID_ROLES: UserRole[] = ["super_admin", "admin", "organizer", "attendee"];

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const { userId } = await auth();
    if (!userId) return null;

    const clerkUser = await currentUser();
    if (!clerkUser) return null;

    const email = clerkUser.emailAddresses[0]?.emailAddress;
    if (!email) return null;

    const isDesignatedAdmin = isConfiguredAdminEmail(email);

    // 1. Fetch Profile via Direct SQL with fallback to Supabase Admin
    let profile: Profile | null = null;
    try {
      const { data: profileRows } = await executeSql(`
        SELECT id, clerk_id, email, full_name, role, status, image_url, bio, home_club_id, designation, created_at, updated_at
        FROM rotasphere_profiles
        WHERE clerk_id = ${escapeSql(userId)} OR id::text = ${escapeSql(userId)} OR email ILIKE ${escapeSql(email)}
        LIMIT 1;
      `);
      if (profileRows && profileRows.length > 0) {
        const row = profileRows[0];
        profile = {
          id: row.id || userId,
          email: row.email || email,
          full_name: row.full_name || `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim() || email.split("@")[0],
          role: (VALID_ROLES.includes(row.role as UserRole) ? row.role : "attendee") as UserRole,
          status: row.status || "ACTIVE",
          image_url: row.image_url || clerkUser.imageUrl || null,
          bio: row.bio || "",
          home_club_id: row.home_club_id || null,
          designation: row.designation || "Rotaract Member",
          created_at: row.created_at || new Date().toISOString(),
          updated_at: row.updated_at || new Date().toISOString(),
        };
      }
    } catch (sqlErr) {
      logger.warn("Direct SQL profile query failed, trying supabaseAdmin", { error: String(sqlErr) });
    }

    if (!profile) {
      try {
        const { data } = await supabaseAdmin
          .from("rotasphere_profiles")
          .select("*")
          .or(`clerk_id.eq.${userId},id.eq.${userId},email.eq.${email}`)
          .limit(1)
          .maybeSingle();
        if (data) {
          profile = data as Profile;
        }
      } catch (sbErr) {
        logger.warn("supabaseAdmin profile lookup fallback failed", { error: String(sbErr) });
      }
    }

    // 2. Check for Club Registration / Organization Membership / Approved Organizer Request
    let isOrgMember = false;
    let hasApprovedOrganizerRequest = false;
    let orgDesignation = "";

    try {
      const { data: memberRows } = await executeSql(`
        SELECT om.organization_id, om.role, o.name as org_name
        FROM organization_members om
        LEFT JOIN organizations o ON o.id = om.organization_id
        WHERE om.user_id = ${escapeSql(userId)}
        LIMIT 1;
      `);
      if (memberRows && memberRows.length > 0) {
        isOrgMember = true;
        if (memberRows[0].org_name) {
          orgDesignation = `Member (${memberRows[0].org_name})`;
        }
      }

      const { data: reqRows } = await executeSql(`
        SELECT id, club_name, position, status
        FROM organizer_access_requests
        WHERE (user_id = ${escapeSql(userId)} OR user_email ILIKE ${escapeSql(email)})
          AND status = 'APPROVED'
        ORDER BY created_at DESC
        LIMIT 1;
      `);
      if (reqRows && reqRows.length > 0) {
        hasApprovedOrganizerRequest = true;
        if (reqRows[0].position && reqRows[0].club_name) {
          orgDesignation = `${reqRows[0].position} (${reqRows[0].club_name})`;
        }
      }
    } catch (checkErr) {
      logger.warn("Club/Organizer membership check error", { error: String(checkErr) });
    }

    const rawRole = clerkUser.publicMetadata?.role as string;
    const metadataRole: UserRole = VALID_ROLES.includes(rawRole as UserRole) ? (rawRole as UserRole) : "attendee";

    // 3. Determine Highest Effective Role
    let targetRole: UserRole = "attendee";
    if (isDesignatedAdmin) {
      targetRole = "super_admin";
    } else if (profile?.role === "super_admin" || profile?.role === "admin") {
      targetRole = profile.role;
    } else if (metadataRole === "super_admin" || metadataRole === "admin") {
      targetRole = metadataRole;
    } else if (profile?.role === "organizer" || isOrgMember || hasApprovedOrganizerRequest || metadataRole === "organizer") {
      targetRole = "organizer";
    }

    if (!profile) {
      const fullName = `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim() || email.split("@")[0];
      const initialDesignation = isDesignatedAdmin
        ? "District Super Administrator"
        : (orgDesignation || (clerkUser.publicMetadata?.designation as string) || "Rotaract Member");

      profile = {
        id: userId,
        email,
        full_name: fullName,
        role: targetRole,
        status: "ACTIVE",
        image_url: clerkUser.imageUrl ?? null,
        bio: "",
        home_club_id: null,
        designation: initialDesignation,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      try {
        await executeSql(`
          INSERT INTO rotasphere_profiles (id, clerk_id, email, full_name, role, status, image_url, designation, created_at, updated_at)
          VALUES (
            gen_random_uuid(),
            ${escapeSql(userId)},
            ${escapeSql(email)},
            ${escapeSql(fullName)},
            ${escapeSql(targetRole)},
            'ACTIVE',
            ${escapeSql(clerkUser.imageUrl ?? null)},
            ${escapeSql(initialDesignation)},
            NOW(),
            NOW()
          )
          ON CONFLICT (clerk_id) DO UPDATE
          SET role = ${escapeSql(targetRole)},
              email = ${escapeSql(email)},
              full_name = ${escapeSql(fullName)},
              updated_at = NOW();
        `);
      } catch (insertErr) {
        logger.warn("Could not insert profile via executeSql", { error: String(insertErr) });
      }
    } else {
      // Self-heal profile if elevated role is detected
      if (ROLE_HIERARCHY[targetRole] > ROLE_HIERARCHY[profile.role]) {
        profile.role = targetRole;
        if (orgDesignation && (!profile.designation || profile.designation === "Rotaract Member")) {
          profile.designation = orgDesignation;
        }
        try {
          await executeSql(`
            UPDATE rotasphere_profiles
            SET role = ${escapeSql(targetRole)},
                designation = ${escapeSql(profile.designation || 'Organizer')},
                updated_at = NOW()
            WHERE clerk_id = ${escapeSql(userId)} OR id::text = ${escapeSql(userId)} OR email ILIKE ${escapeSql(email)};
          `);
        } catch (updateErr) {
          logger.warn("Could not update profile role in database", { error: String(updateErr) });
        }
      }
    }

    if (profile.status === "SUSPENDED") {
      logger.warn("Suspended user attempted access", { userId });
      return null;
    }

    return { clerkId: userId, email, profile };
  } catch (err) {
    logger.error("getCurrentUser failed", { error: String(err) });
    return null;
  }
}

export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHENTICATED");
  }
  return user;
}

export async function requireRole(role: UserRole): Promise<AuthUser> {
  const user = await requireAuth();
  if (!hasMinimumRole(user.profile.role, role)) {
    logger.warn("Insufficient role for action", {
      userId: user.clerkId,
      userRole: user.profile.role,
      requiredRole: role,
    });
    throw new Error("FORBIDDEN");
  }
  return user;
}

const ROLE_HIERARCHY: Record<UserRole, number> = {
  super_admin: 4,
  admin: 3,
  organizer: 2,
  attendee: 1,
};

export function hasMinimumRole(userRole: UserRole, minimumRole: UserRole): boolean {
  const userRank = ROLE_HIERARCHY[userRole] ?? 0;
  const minRank = ROLE_HIERARCHY[minimumRole] ?? 999;
  return userRank >= minRank;
}
