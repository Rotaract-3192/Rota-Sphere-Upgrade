/**
 * Clerk Webhook Handler
 * Architecture §3: Clerk webhooks for lifecycle synchronization.
 * Architecture §54: Profile sync uses service-role client.
 *
 * Handles:
 * - user.created  → INSERT profile
 * - user.updated  → UPDATE profile (name, email, image)
 * - user.deleted  → soft-delete (mark status as REJECTED or anonymize)
 *
 * Security: signature verified via svix before processing.
 */

import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import { supabaseAdmin } from "@/lib/db/supabaseAdmin";
import { logger } from "@/lib/logger/logger";
import type { UserRole } from "@/types/database";

interface ClerkUserEvent {
  type: string;
  data: {
    id: string;
    email_addresses: Array<{ email_address: string; id: string }>;
    first_name: string | null;
    last_name: string | null;
    image_url: string;
    primary_email_address_id: string;
  };
}

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  if (!webhookSecret) {
    logger.error("CLERK_WEBHOOK_SECRET not configured");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  // Get svix headers for signature verification
  const svix_id = req.headers.get("svix-id");
  const svix_timestamp = req.headers.get("svix-timestamp");
  const svix_signature = req.headers.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    logger.warn("Clerk webhook missing svix headers");
    return NextResponse.json({ error: "Missing svix headers" }, { status: 400 });
  }

  // Verify signature
  const body = await req.text();
  const wh = new Webhook(webhookSecret);
  let event: ClerkUserEvent;

  try {
    event = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as ClerkUserEvent;
  } catch (err) {
    logger.error("Clerk webhook signature verification failed", { error: String(err) });
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const { type, data } = event;

  // Get primary email
  const primaryEmail = data.email_addresses.find(
    (e) => e.id === data.primary_email_address_id
  )?.email_address;

  const fullName = [data.first_name, data.last_name].filter(Boolean).join(" ") || "User";

  logger.info("Clerk webhook received", { type, userId: data.id });

  if (type === "user.created") {
    const isSuperAdminEmail =
      primaryEmail?.toLowerCase() === "tech.rotaract3192@gmail.com" ||
      primaryEmail?.toLowerCase() === process.env.ADMIN_EMAIL?.toLowerCase();
    const initialRole: UserRole = isSuperAdminEmail ? "super_admin" : "attendee";

    const { error } = await supabaseAdmin.from("rotasphere_profiles").insert({
      id: data.id,
      email: primaryEmail ?? "",
      full_name: fullName,
      role: initialRole,
      status: "ACTIVE",
      image_url: data.image_url || null,
      bio: "",
      designation: isSuperAdminEmail ? "District Super Administrator" : "",
    });

    if (error) {
      // If already exists (duplicate webhook), ignore
      if (error.code === "23505") {
        logger.info("Profile already exists, skipping insert", { userId: data.id });
        return NextResponse.json({ received: true });
      }
      logger.error("Failed to create profile from Clerk webhook", {
        error: error.message,
        userId: data.id,
      });
      return NextResponse.json({ error: "Profile creation failed" }, { status: 500 });
    }

    logger.info("Profile created from Clerk webhook", { userId: data.id });
  }

  if (type === "user.updated") {
    const { error } = await supabaseAdmin
      .from("rotasphere_profiles")
      .update({
        email: primaryEmail ?? undefined,
        full_name: fullName,
        image_url: data.image_url || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.id);

    if (error) {
      logger.error("Failed to update profile from Clerk webhook", {
        error: error.message,
        userId: data.id,
      });
      return NextResponse.json({ error: "Profile update failed" }, { status: 500 });
    }

    logger.info("Profile updated from Clerk webhook", { userId: data.id });
  }

  if (type === "user.deleted") {
    // Soft delete — preserve financial records, audit trails
    const { error } = await supabaseAdmin
      .from("rotasphere_profiles")
      .update({
        status: "REJECTED",
        email: `deleted_${data.id}@deleted.rotasphere.in`,
        full_name: "Deleted User",
        image_url: null,
        bio: "",
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.id);

    if (error) {
      logger.error("Failed to soft-delete profile from Clerk webhook", {
        error: error.message,
        userId: data.id,
      });
    }

    logger.info("Profile soft-deleted from Clerk webhook", { userId: data.id });
  }

  return NextResponse.json({ received: true });
}
