import { auth, currentUser } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/db/supabaseAdmin";
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

    const { data } = await supabaseAdmin
      .from("rotasphere_profiles")
      .select("*")
      .eq("id", userId)
      .single();

    let profile = data as Profile | null;

    if (!profile) {
      const fullName = `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim() || email.split("@")[0];
      const rawRole = clerkUser.publicMetadata?.role as string;
      const metadataRole: UserRole = VALID_ROLES.includes(rawRole as UserRole) ? (rawRole as UserRole) : "attendee";
      const initialRole: UserRole = isDesignatedAdmin ? "super_admin" : metadataRole;

      const newProfile: Profile = {
        id: userId,
        email,
        full_name: fullName,
        role: initialRole,
        status: "ACTIVE",
        image_url: clerkUser.imageUrl ?? null,
        bio: "",
        home_club_id: null,
        designation: isDesignatedAdmin ? "District Super Administrator" : "Rotaract Member",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      try {
        await supabaseAdmin.from("rotasphere_profiles").upsert(newProfile);
      } catch (err) {
        logger.warn("Could not upsert profile on the fly", { error: String(err) });
      }

      profile = newProfile;
    } else if (isDesignatedAdmin && profile.role !== "super_admin") {
      profile.role = "super_admin";
      try {
        await supabaseAdmin
          .from("rotasphere_profiles")
          .update({ role: "super_admin" })
          .eq("id", userId);
      } catch (err) {
        logger.warn("Could not elevate profile to super_admin", { error: String(err) });
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
