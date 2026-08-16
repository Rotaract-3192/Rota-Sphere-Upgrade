import type { UserRole, EventPermission } from "@/types/database";
import { supabaseAdmin } from "@/lib/db/supabaseAdmin";
import { hasMinimumRole } from "./getUser";

export function canManageUsers(role: UserRole): boolean {
  return hasMinimumRole(role, "admin");
}

export function canApproveEvents(role: UserRole): boolean {
  return hasMinimumRole(role, "admin");
}

export function canAccessFinancials(role: UserRole): boolean {
  return hasMinimumRole(role, "admin");
}

export function canManagePlatformSettings(role: UserRole): boolean {
  return role === "super_admin";
}

export function canPromoteToAdmin(role: UserRole): boolean {
  return role === "super_admin";
}

export function canCreateEvent(role: UserRole): boolean {
  return hasMinimumRole(role, "organizer");
}

export function isAdmin(role: UserRole): boolean {
  return hasMinimumRole(role, "admin");
}

export function isSuperAdmin(role: UserRole): boolean {
  return role === "super_admin";
}

export async function hasEventPermission(
  userId: string,
  eventId: string,
  permission: EventPermission,
  eventOrganizerId?: string
): Promise<boolean> {
  if (eventOrganizerId && userId === eventOrganizerId) {
    return true;
  }

  const { data } = await supabaseAdmin
    .from("event_team_members")
    .select("permissions, status")
    .eq("event_id", eventId)
    .eq("user_id", userId)
    .eq("status", "ACTIVE")
    .single();

  const membership = data as { permissions: EventPermission[]; status: string } | null;
  if (!membership) return false;

  return membership.permissions.includes(permission);
}

export async function getEventPermissions(
  userId: string,
  eventId: string,
  eventOrganizerId?: string
): Promise<EventPermission[]> {
  if (eventOrganizerId && userId === eventOrganizerId) {
    return [
      "MANAGE_EVENT",
      "MANAGE_TICKETS",
      "MANAGE_REGISTRATION_FORM",
      "VIEW_ATTENDEES",
      "EXPORT_ATTENDEES",
      "VERIFY_PAYMENTS",
      "ISSUE_MANUAL_TICKETS",
      "MANAGE_COUPONS",
      "MANAGE_WAITLIST",
      "CHECK_IN",
      "VIEW_ANALYTICS",
      "SEND_COMMUNICATIONS",
      "MANAGE_EVENT_TEAM",
      "MANAGE_SPONSORS",
      "VIEW_FINANCIALS",
    ];
  }

  const { data } = await supabaseAdmin
    .from("event_team_members")
    .select("permissions, status")
    .eq("event_id", eventId)
    .eq("user_id", userId)
    .eq("status", "ACTIVE")
    .single();

  const membership = data as { permissions: EventPermission[]; status: string } | null;
  return membership?.permissions ?? [];
}

export async function requireEventPermission(
  userId: string,
  eventId: string,
  permission: EventPermission,
  eventOrganizerId?: string
): Promise<void> {
  const has = await hasEventPermission(userId, eventId, permission, eventOrganizerId);
  if (!has) {
    throw new Error("FORBIDDEN");
  }
}
