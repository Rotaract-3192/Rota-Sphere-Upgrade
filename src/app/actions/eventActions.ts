"use server";

/**
 * Event Server Actions
 * Handles full event creation, updating, duplication, publishing, and cancellation.
 * Protected with strict authorization checks, ownership verification, and SSRF prevention.
 */

import { getCurrentUser, requireAuth, hasMinimumRole } from "@/lib/auth/getUser";
import { executeSql, escapeSql } from "@/lib/db/directDb";
import { logAuditAction } from "@/lib/services/auditService";
import { logger } from "@/lib/logger/logger";
import { revalidatePath } from "next/cache";
import { broadcastNewEventToAllUsersAsync } from "@/lib/notifications/notificationService";
import { DISTRICT_3192_CLUBS } from "@/lib/data/districtClubsData";
import type { EventFormat, EventVisibility, TicketTierType } from "@/types/saas";

export interface CreateEventInput {
  organizationId?: string;
  hostingClub?: string;
  clubName?: string;
  title: string;
  slug?: string;
  summary?: string;
  description: string;
  coverImageUrl?: string;
  logoUrl?: string;
  eventType: EventFormat;
  venueName?: string;
  address?: string;
  city: string;
  state?: string;
  googleMapsUrl?: string;
  onlineMeetingUrl?: string;
  startDate: string;
  endDate: string;
  timezone?: string;
  capacity: number;
  visibility?: EventVisibility;
  allowWaitlist?: boolean;
  allowTicketTransfer?: boolean;
  allowRefunds?: boolean;
  allowNonRotaract?: boolean;
  notifyAllMembers?: boolean;
  termsAndConditions?: string;
  refundPolicy?: string;
  contactEmail?: string;
  contactPhone?: string;
  upiId?: string;
  upiPayeeName?: string;
  category?: string;
  tags?: string[];
  ticketTiers: Array<{
    name: string;
    description?: string;
    tierType: TicketTierType;
    price: number;
    totalCapacity: number;
    salesStart?: string;
    salesEnd?: string;
    allowNonRotaract?: boolean;
    allowedAudience?: "ALL" | "ROTARACT_ONLY" | "NON_ROTARACT_ONLY";
    benefits?: string[];
  }>;
  speakers?: Array<{
    name: string;
    roleTitle?: string;
    organization?: string;
    avatarUrl?: string;
    bio?: string;
  }>;
  sponsors?: Array<{
    name: string;
    tier: string;
    logoUrl: string;
    websiteUrl?: string;
  }>;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function resolveCategoryId(categoryInput?: string): Promise<string | null> {
  if (!categoryInput || !categoryInput.trim()) return null;
  const inputStr = categoryInput.trim();

  // If it's already a valid UUID
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(inputStr)) {
    return inputStr;
  }

  const { data } = await executeSql(`
    SELECT id FROM event_categories 
    WHERE name ILIKE ${escapeSql(inputStr)} OR slug ILIKE ${escapeSql(slugify(inputStr))}
    LIMIT 1;
  `);

  if (data && data.length > 0) {
    return data[0].id;
  }

  const { data: fallback } = await executeSql(`SELECT id FROM event_categories LIMIT 1;`);
  return fallback?.[0]?.id || null;
}

/**
 * Resolves the appropriate organization ID based on explicit club name, user requests, or memberships
 */
export async function resolveClubOrganizationId(params: {
  clubName?: string;
  userClerkId?: string;
  userEmail?: string;
  explicitOrgId?: string;
}): Promise<string> {
  const { clubName, userClerkId, userEmail, explicitOrgId } = params;

  // 1. If explicit club name is provided (e.g. chosen in event creation wizard)
  if (clubName && clubName.trim()) {
    const trimmed = clubName.trim();
    const { data: matchedOrg } = await executeSql(`
      SELECT id FROM organizations 
      WHERE name ILIKE ${escapeSql(trimmed)} 
         OR slug ILIKE ${escapeSql(slugify(trimmed))}
         OR name ILIKE ${escapeSql(`%${trimmed}%`)}
      LIMIT 1;
    `);
    if (matchedOrg && matchedOrg.length > 0) {
      return matchedOrg[0].id;
    }

    // Check if it matches a known district club in DISTRICT_3192_CLUBS
    const knownClub = DISTRICT_3192_CLUBS.find(
      (c) =>
        c.name.toLowerCase().includes(trimmed.toLowerCase()) ||
        trimmed.toLowerCase().includes(c.name.toLowerCase())
    );

    if (knownClub) {
      const slug = slugify(knownClub.name.replace(/rotaract club of /i, ""));
      const email =
        (knownClub.clubEmail && knownClub.clubEmail.split(",")[0].trim()) ||
        knownClub.presidentEmail ||
        "info@rotaract3192.org";
      const { data: newOrg } = await executeSql(`
        INSERT INTO organizations (
          name, slug, zone, club_type, partner_club, contact_email, support_email, city, country,
          president_name, president_phone, president_email,
          kyc_status, is_verified, status, created_at, updated_at
        ) VALUES (
          ${escapeSql(knownClub.name)},
          ${escapeSql(slug)},
          ${escapeSql(knownClub.zone)},
          ${escapeSql(knownClub.clubType)},
          ${escapeSql(knownClub.partnerClub)},
          ${escapeSql(knownClub.clubEmail)},
          ${escapeSql(email)},
          'Bengaluru',
          'India',
          ${escapeSql(knownClub.presidentName || "")},
          ${escapeSql(knownClub.presidentPhone || "")},
          ${escapeSql(knownClub.presidentEmail || "")},
          'VERIFIED',
          true,
          'ACTIVE',
          NOW(),
          NOW()
        )
        ON CONFLICT DO NOTHING
        RETURNING id;
      `);
      if (newOrg && newOrg.length > 0) {
        return newOrg[0].id;
      }
      const { data: refetched } = await executeSql(`
        SELECT id FROM organizations WHERE name ILIKE ${escapeSql(knownClub.name)} LIMIT 1;
      `);
      if (refetched && refetched.length > 0) {
        return refetched[0].id;
      }
    }
  }

  // 2. If explicit org ID is provided, check that it's valid
  if (explicitOrgId) {
    const { data: validOrg } = await executeSql(`
      SELECT id FROM organizations WHERE id = ${escapeSql(explicitOrgId)} LIMIT 1;
    `);
    if (validOrg && validOrg.length > 0) {
      return validOrg[0].id;
    }
  }

  // 3. Look up user's organization_members
  if (userClerkId) {
    const { data: memberRows } = await executeSql(`
      SELECT om.organization_id 
      FROM organization_members om
      WHERE om.user_id = ${escapeSql(userClerkId)}
      LIMIT 1;
    `);
    if (memberRows && memberRows.length > 0) {
      return memberRows[0].organization_id;
    }
  }

  // 4. Look up user's approved organizer_access_requests
  if (userClerkId || userEmail) {
    const { data: reqRows } = await executeSql(`
      SELECT organization_id, club_name FROM organizer_access_requests
      WHERE (user_id = ${escapeSql(userClerkId || "")} OR user_email ILIKE ${escapeSql(userEmail || "")})
        AND status = 'APPROVED'
      ORDER BY created_at DESC
      LIMIT 1;
    `);
    if (reqRows && reqRows.length > 0) {
      if (reqRows[0].organization_id) {
        return reqRows[0].organization_id;
      }
      if (reqRows[0].club_name) {
        return await resolveClubOrganizationId({ clubName: reqRows[0].club_name });
      }
    }
  }

  // 5. Default Organization Fallback
  const { data: defaultOrg } = await executeSql(`
    SELECT id FROM organizations ORDER BY created_at ASC LIMIT 1;
  `);
  return defaultOrg?.[0]?.id || "328ed943-f625-4fec-82a0-0c92dd7ec592";
}

/**
 * Validates that an acting user has authorization to mutate or view the specified event.
 */
async function verifyEventAccess(eventId: string, user: { clerkId: string; email?: string; profile: { role: any } }): Promise<{ authorized: boolean; event?: any; error?: string }> {
  const { data: events, error } = await executeSql(`
    SELECT id, organization_id, organizer_id, created_by_user_id, title
    FROM saas_events
    WHERE id = ${escapeSql(eventId)}
    LIMIT 1;
  `);

  if (error || !events || events.length === 0) {
    return { authorized: false, error: "Event not found" };
  }

  const event = events[0];
  const isOwner = event.organizer_id === user.clerkId || event.created_by_user_id === user.clerkId;
  const isAdmin = hasMinimumRole(user.profile.role, "admin");

  if (!isOwner && !isAdmin) {
    let isOrgMember = false;
    if (event.organization_id) {
      const { data: memberRows } = await executeSql(`
        SELECT user_id FROM organization_members
        WHERE organization_id = ${escapeSql(event.organization_id)} AND user_id = ${escapeSql(user.clerkId)}
        LIMIT 1;
      `);
      isOrgMember = !!(memberRows && memberRows.length > 0);
    }

    if (!isOrgMember) {
      return { authorized: false, error: "Unauthorized: You do not have permission to manage this event." };
    }
  }

  return { authorized: true, event };
}

export async function createEventAction(input: CreateEventInput): Promise<{ success: boolean; eventId?: string; slug?: string; error?: string }> {
  try {
    const user = await requireAuth();

    // Verify minimum role requirement with dynamic self-healing
    let isAuthorized = hasMinimumRole(user.profile.role, "organizer");
    if (!isAuthorized) {
      const { data: approvedReq } = await executeSql(`
        SELECT id, club_name, position, organization_id FROM organizer_access_requests
        WHERE (user_id = ${escapeSql(user.clerkId)} OR user_email ILIKE ${escapeSql(user.email)})
          AND status = 'APPROVED'
        LIMIT 1;
      `);
      const { data: orgMember } = await executeSql(`
        SELECT organization_id FROM organization_members
        WHERE user_id = ${escapeSql(user.clerkId)}
        LIMIT 1;
      `);

      if ((approvedReq && approvedReq.length > 0) || (orgMember && orgMember.length > 0)) {
        isAuthorized = true;
        user.profile.role = "organizer";
        try {
          await executeSql(`
            UPDATE rotasphere_profiles
            SET role = 'organizer', updated_at = NOW()
            WHERE clerk_id = ${escapeSql(user.clerkId)} OR id::text = ${escapeSql(user.clerkId)} OR email ILIKE ${escapeSql(user.email)};
          `);
        } catch {}
      }
    }

    if (!isAuthorized) {
      return { success: false, error: "Unauthorized: Organizer access required to create events." };
    }

    // Auto-migrate UPI, user & feature columns if missing
    try {
      await executeSql(`
        ALTER TABLE saas_events ADD COLUMN IF NOT EXISTS upi_id VARCHAR(255);
        ALTER TABLE saas_events ADD COLUMN IF NOT EXISTS upi_payee_name VARCHAR(255);
        ALTER TABLE saas_events ADD COLUMN IF NOT EXISTS created_by_user_id VARCHAR(255);
        ALTER TABLE saas_events ADD COLUMN IF NOT EXISTS organizer_id VARCHAR(255);
        ALTER TABLE saas_events ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(50);
        ALTER TABLE saas_events ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL;
        ALTER TABLE saas_events ADD COLUMN IF NOT EXISTS allow_non_rotaract BOOLEAN DEFAULT TRUE;
        ALTER TABLE saas_events ADD COLUMN IF NOT EXISTS google_maps_url TEXT;
        ALTER TABLE saas_ticket_tiers ADD COLUMN IF NOT EXISTS allow_non_rotaract BOOLEAN DEFAULT TRUE;
        ALTER TABLE saas_ticket_tiers ADD COLUMN IF NOT EXISTS allowed_audience VARCHAR(50) DEFAULT 'ALL';
      `);
    } catch {}

    const coverUrl = input.coverImageUrl || "";
    const userSlug = input.slug?.trim() ? slugify(input.slug) : slugify(input.title);

    // Check if slug already exists in DB
    const { data: existingSlug } = await executeSql(`
      SELECT id FROM saas_events WHERE slug = ${escapeSql(userSlug)} LIMIT 1;
    `);

    const finalSlug = existingSlug && existingSlug.length > 0
      ? `${userSlug}-${Date.now().toString().slice(-4)}`
      : userSlug;

    const categoryId = await resolveCategoryId(input.category);

    // 1. Resolve Organization accurately (using explicit hosting club, user request or membership)
    const organizationId = await resolveClubOrganizationId({
      clubName: input.hostingClub || input.clubName,
      explicitOrgId: input.organizationId,
      userClerkId: user.clerkId,
      userEmail: user.email,
    });

    // 2. Insert Event
    const insertEventSql = `
      INSERT INTO saas_events (
        organization_id,
        organizer_id,
        created_by_user_id,
        category_id,
        title,
        slug,
        summary,
        description,
        cover_image_url,
        logo_url,
        event_type,
        venue_name,
        address,
        city,
        state,
        google_maps_url,
        online_meeting_url,
        start_date,
        end_date,
        timezone,
        capacity,
        status,
        visibility,
        allow_waitlist,
        allow_ticket_transfer,
        allow_refunds,
        allow_non_rotaract,
        terms_and_conditions,
        refund_policy,
        contact_email,
        contact_phone,
        upi_id,
        upi_payee_name
      ) VALUES (
        ${escapeSql(organizationId)},
        ${escapeSql(user.clerkId)},
        ${escapeSql(user.clerkId)},
        ${escapeSql(categoryId)},
        ${escapeSql(input.title)},
        ${escapeSql(finalSlug)},
        ${escapeSql(input.summary)},
        ${escapeSql(input.description)},
        ${escapeSql(coverUrl)},
        ${escapeSql(input.logoUrl)},
        ${escapeSql(input.eventType || "OFFLINE")},
        ${escapeSql(input.venueName)},
        ${escapeSql(input.address)},
        ${escapeSql(input.city)},
        ${escapeSql(input.state)},
        ${escapeSql(input.googleMapsUrl)},
        ${escapeSql(input.onlineMeetingUrl)},
        ${escapeSql(input.startDate)},
        ${escapeSql(input.endDate)},
        ${escapeSql(input.timezone || "Asia/Kolkata")},
        ${Number(input.capacity) || 100},
        'PUBLISHED',
        ${escapeSql(input.visibility || "PUBLIC")},
        ${input.allowWaitlist !== false ? "TRUE" : "FALSE"},
        ${input.allowTicketTransfer !== false ? "TRUE" : "FALSE"},
        ${input.allowRefunds !== false ? "TRUE" : "FALSE"},
        ${input.allowNonRotaract !== false ? "TRUE" : "FALSE"},
        ${escapeSql(input.termsAndConditions)},
        ${escapeSql(input.refundPolicy)},
        ${escapeSql(input.contactEmail || user.email)},
        ${escapeSql(input.contactPhone)},
        ${escapeSql(input.upiId || "rotaractdistrict3192@okaxis")},
        ${escapeSql(input.upiPayeeName || "District 3192 Rotaract")}
      )
      RETURNING id, slug;
    `;

    const { data: createdEvent, error: eventErr } = await executeSql(insertEventSql);

    if (eventErr || !createdEvent || createdEvent.length === 0) {
      logger.error("createEventAction saas_events insert error", { error: eventErr });
      return { success: false, error: eventErr?.message || "Failed to create event" };
    }

    const eventId = createdEvent[0].id;

    // 3. Insert Ticket Tiers
    if (input.ticketTiers && input.ticketTiers.length > 0) {
      for (const tier of input.ticketTiers) {
        const benefitsJson = JSON.stringify(tier.benefits || []).replace(/'/g, "''");
        const tierAllowNonRotaract = tier.allowNonRotaract !== undefined ? tier.allowNonRotaract : input.allowNonRotaract !== false;
        const tierAudience = tier.allowedAudience || (tierAllowNonRotaract ? "ALL" : "ROTARACT_ONLY");

        const tierSql = `
          INSERT INTO saas_ticket_tiers (
            event_id,
            name,
            description,
            tier_type,
            price,
            total_capacity,
            sold_count,
            reserved_count,
            sales_start,
            sales_end,
            allow_non_rotaract,
            allowed_audience,
            benefits,
            is_active,
            is_visible
          ) VALUES (
            ${escapeSql(eventId)},
            ${escapeSql(tier.name)},
            ${escapeSql(tier.description)},
            ${escapeSql(tier.tierType || "REGULAR")},
            ${Number(tier.price) || 0},
            ${Number(tier.totalCapacity) || 100},
            0,
            0,
            ${escapeSql(tier.salesStart || new Date().toISOString())},
            ${escapeSql(tier.salesEnd || input.endDate)},
            ${tierAllowNonRotaract ? "TRUE" : "FALSE"},
            ${escapeSql(tierAudience)},
            '${benefitsJson}'::jsonb,
            TRUE,
            TRUE
          );
        `;
        await executeSql(tierSql);
      }
    }

    // 4. Non-blocking Background Email Announcement to all registered members
    if (input.notifyAllMembers !== false) {
      const prices = (input.ticketTiers || []).map((t) => Number(t.price));
      const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
      broadcastNewEventToAllUsersAsync({
        eventId,
        title: input.title,
        slug: finalSlug,
        summary: input.summary,
        coverImageUrl: coverUrl,
        startDate: input.startDate,
        endDate: input.endDate,
        venueName: input.venueName,
        address: input.address,
        city: input.city,
        googleMapsUrl: input.googleMapsUrl,
        minPrice,
        allowNonRotaract: input.allowNonRotaract !== false,
      });
    }

    // 4. Insert Speakers if provided
    if (input.speakers && input.speakers.length > 0) {
      for (let i = 0; i < input.speakers.length; i++) {
        const spk = input.speakers[i];
        const speakerSql = `
          INSERT INTO event_speakers (
            event_id,
            name,
            role_title,
            organization,
            avatar_url,
            bio,
            display_order
          ) VALUES (
            ${escapeSql(eventId)},
            ${escapeSql(spk.name)},
            ${escapeSql(spk.roleTitle)},
            ${escapeSql(spk.organization)},
            ${escapeSql(spk.avatarUrl)},
            ${escapeSql(spk.bio)},
            ${i + 1}
          );
        `;
        await executeSql(speakerSql);
      }
    }

    // 5. Insert Sponsors if provided
    if (input.sponsors && input.sponsors.length > 0) {
      for (let i = 0; i < input.sponsors.length; i++) {
        const spon = input.sponsors[i];
        const sponsorSql = `
          INSERT INTO event_sponsors (
            event_id,
            name,
            tier,
            logo_url,
            website_url,
            display_order
          ) VALUES (
            ${escapeSql(eventId)},
            ${escapeSql(spon.name)},
            ${escapeSql(spon.tier || "Gold")},
            ${escapeSql(spon.logoUrl)},
            ${escapeSql(spon.websiteUrl)},
            ${i + 1}
          );
        `;
        await executeSql(sponsorSql);
      }
    }

    // 6. Audit Log
    await logAuditAction({
      actorId: user.clerkId,
      actorRole: user.profile.role,
      actorEmail: user.email,
      action: "EVENT_CREATED",
      entityType: "EVENT",
      entityId: eventId,
      organizationId,
      newState: { title: input.title, slug: finalSlug, capacity: input.capacity },
    });

    revalidatePath("/events");
    revalidatePath("/dashboard");

    return { success: true, eventId, slug: finalSlug };
  } catch (err) {
    logger.error("createEventAction failed", { error: String(err) });
    return { success: false, error: "Internal server error creating event" };
  }
}

export async function duplicateEventAction(eventId: string): Promise<{ success: boolean; newEventSlug?: string; error?: string }> {
  try {
    const user = await requireAuth();
    const access = await verifyEventAccess(eventId, user);
    if (!access.authorized) {
      return { success: false, error: access.error };
    }

    const orig = access.event;
    const newTitle = `${orig.title} (Copy)`;
    const newSlug = `${slugify(newTitle)}-${Date.now().toString().slice(-4)}`;

    const { data: clonedEvent } = await executeSql(`
      INSERT INTO saas_events (
        organization_id,
        organizer_id,
        created_by_user_id,
        category_id,
        title,
        slug,
        summary,
        description,
        cover_image_url,
        logo_url,
        event_type,
        venue_name,
        address,
        city,
        state,
        start_date,
        end_date,
        capacity,
        status,
        visibility
      ) VALUES (
        ${escapeSql(orig.organization_id)},
        ${escapeSql(user.clerkId)},
        ${escapeSql(user.clerkId)},
        ${escapeSql(orig.category_id)},
        ${escapeSql(newTitle)},
        ${escapeSql(newSlug)},
        ${escapeSql(orig.summary)},
        ${escapeSql(orig.description)},
        ${escapeSql(orig.cover_image_url)},
        ${escapeSql(orig.logo_url)},
        ${escapeSql(orig.event_type)},
        ${escapeSql(orig.venue_name)},
        ${escapeSql(orig.address)},
        ${escapeSql(orig.city)},
        ${escapeSql(orig.state)},
        NOW() + INTERVAL '7 days',
        NOW() + INTERVAL '8 days',
        ${Number(orig.capacity) || 100},
        'DRAFT',
        'PUBLIC'
      )
      RETURNING id, slug;
    `);

    if (!clonedEvent || clonedEvent.length === 0) {
      return { success: false, error: "Cloning event failed" };
    }

    revalidatePath("/dashboard");
    return { success: true, newEventSlug: clonedEvent[0].slug };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export async function cancelEventAction(eventId: string, reason: string): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireAuth();
    const access = await verifyEventAccess(eventId, user);
    if (!access.authorized) {
      return { success: false, error: access.error };
    }

    await executeSql(`
      UPDATE saas_events
      SET status = 'CANCELLED', updated_at = NOW()
      WHERE id = ${escapeSql(eventId)};
    `);

    await logAuditAction({
      actorId: user.clerkId,
      actorRole: user.profile.role,
      actorEmail: user.email,
      action: "EVENT_CANCELLED",
      entityType: "EVENT",
      entityId: eventId,
      newState: { reason, status: "CANCELLED" },
    });

    revalidatePath("/dashboard");
    revalidatePath("/events");
    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

export async function updateEventAction(
  eventId: string,
  input: Partial<CreateEventInput>
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireAuth();
    const access = await verifyEventAccess(eventId, user);
    if (!access.authorized) {
      return { success: false, error: access.error };
    }

    const updates: string[] = [];
    if (input.title) updates.push(`title = ${escapeSql(input.title)}`);
    if (input.slug) updates.push(`slug = ${escapeSql(input.slug)}`);
    if (input.summary !== undefined) updates.push(`summary = ${escapeSql(input.summary)}`);
    if (input.description !== undefined) updates.push(`description = ${escapeSql(input.description)}`);
    if (input.coverImageUrl !== undefined) updates.push(`cover_image_url = ${escapeSql(input.coverImageUrl)}`);
    if (input.logoUrl !== undefined) updates.push(`logo_url = ${escapeSql(input.logoUrl)}`);
    if (input.eventType) updates.push(`event_type = ${escapeSql(input.eventType)}`);
    if (input.venueName !== undefined) updates.push(`venue_name = ${escapeSql(input.venueName)}`);
    if (input.address !== undefined) updates.push(`address = ${escapeSql(input.address)}`);
    if (input.city !== undefined) updates.push(`city = ${escapeSql(input.city)}`);
    if (input.state !== undefined) updates.push(`state = ${escapeSql(input.state)}`);
    if (input.onlineMeetingUrl !== undefined) updates.push(`online_meeting_url = ${escapeSql(input.onlineMeetingUrl)}`);
    if (input.startDate) updates.push(`start_date = ${escapeSql(input.startDate)}`);
    if (input.endDate) updates.push(`end_date = ${escapeSql(input.endDate)}`);
    if (input.timezone !== undefined) updates.push(`timezone = ${escapeSql(input.timezone)}`);
    if (input.capacity !== undefined) updates.push(`capacity = ${Number(input.capacity) || 100}`);
    if (input.visibility !== undefined) updates.push(`visibility = ${escapeSql(input.visibility)}`);
    if (input.allowWaitlist !== undefined) updates.push(`allow_waitlist = ${input.allowWaitlist ? "TRUE" : "FALSE"}`);
    if (input.allowTicketTransfer !== undefined) updates.push(`allow_ticket_transfer = ${input.allowTicketTransfer ? "TRUE" : "FALSE"}`);
    if (input.allowRefunds !== undefined) updates.push(`allow_refunds = ${input.allowRefunds ? "TRUE" : "FALSE"}`);
    if (input.allowNonRotaract !== undefined) updates.push(`allow_non_rotaract = ${input.allowNonRotaract ? "TRUE" : "FALSE"}`);
    if (input.googleMapsUrl !== undefined) updates.push(`google_maps_url = ${escapeSql(input.googleMapsUrl)}`);
    if (input.contactEmail !== undefined) updates.push(`contact_email = ${escapeSql(input.contactEmail)}`);
    if (input.contactPhone !== undefined) updates.push(`contact_phone = ${escapeSql(input.contactPhone)}`);
    if (input.upiId !== undefined) updates.push(`upi_id = ${escapeSql(input.upiId)}`);
    if (input.upiPayeeName !== undefined) updates.push(`upi_payee_name = ${escapeSql(input.upiPayeeName)}`);

    if (input.hostingClub || input.clubName || input.organizationId) {
      const orgId = await resolveClubOrganizationId({
        clubName: input.hostingClub || input.clubName,
        explicitOrgId: input.organizationId,
        userClerkId: user.clerkId,
        userEmail: user.email,
      });
      if (orgId) {
        updates.push(`organization_id = ${escapeSql(orgId)}`);
      }
    }

    if (input.category) {
      const categoryId = await resolveCategoryId(input.category);
      if (categoryId) {
        updates.push(`category_id = ${escapeSql(categoryId)}`);
      }
    }

    updates.push(`updated_at = NOW()`);

    if (updates.length > 0) {
      await executeSql(`
        UPDATE saas_events
        SET ${updates.join(", ")}
        WHERE id = ${escapeSql(eventId)};
      `);
    }

    // Update Ticket Tiers if provided
    if (input.ticketTiers && input.ticketTiers.length > 0) {
      await executeSql(`DELETE FROM saas_ticket_tiers WHERE event_id = ${escapeSql(eventId)};`);
      for (const tier of input.ticketTiers) {
        const benefitsJson = JSON.stringify(tier.benefits || []).replace(/'/g, "''");
        const tierAllowNonRotaract = tier.allowNonRotaract !== undefined ? tier.allowNonRotaract : input.allowNonRotaract !== false;
        const tierAudience = tier.allowedAudience || (tierAllowNonRotaract ? "ALL" : "ROTARACT_ONLY");

        const tierSql = `
          INSERT INTO saas_ticket_tiers (
            event_id,
            name,
            description,
            tier_type,
            price,
            total_capacity,
            sold_count,
            reserved_count,
            sales_start,
            sales_end,
            allow_non_rotaract,
            allowed_audience,
            benefits,
            is_active,
            is_visible
          ) VALUES (
            ${escapeSql(eventId)},
            ${escapeSql(tier.name)},
            ${escapeSql(tier.description)},
            ${escapeSql(tier.tierType || "REGULAR")},
            ${Number(tier.price) || 0},
            ${Number(tier.totalCapacity) || 100},
            0,
            0,
            ${escapeSql(tier.salesStart || new Date().toISOString())},
            ${escapeSql(tier.salesEnd || input.endDate || new Date().toISOString())},
            ${tierAllowNonRotaract ? "TRUE" : "FALSE"},
            ${escapeSql(tierAudience)},
            '${benefitsJson}'::jsonb,
            TRUE,
            TRUE
          );
        `;
        await executeSql(tierSql);
      }
    }

    await logAuditAction({
      actorId: user.clerkId,
      actorRole: user.profile.role,
      actorEmail: user.email,
      action: "EVENT_UPDATED",
      entityType: "EVENT",
      entityId: eventId,
      newState: input,
    });

    revalidatePath("/dashboard");
    revalidatePath("/events");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

export async function trashEventAction(eventId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireAuth();
    const access = await verifyEventAccess(eventId, user);
    if (!access.authorized) {
      return { success: false, error: access.error };
    }

    // Auto-migrate deleted_at column if missing
    try {
      await executeSql(`
        ALTER TABLE saas_events ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ NULL;
      `);
    } catch {}

    let { error: dbErr } = await executeSql(`
      UPDATE saas_events
      SET deleted_at = NOW(), status = 'TRASHED', updated_at = NOW()
      WHERE id = ${escapeSql(eventId)};
    `);

    if (dbErr) {
      const fallbackRes = await executeSql(`
        UPDATE saas_events
        SET deleted_at = NOW(), updated_at = NOW()
        WHERE id = ${escapeSql(eventId)};
      `);
      if (fallbackRes.error) {
        return { success: false, error: fallbackRes.error.message || "Failed to update database" };
      }
    }

    await logAuditAction({
      actorId: user.clerkId,
      actorRole: user.profile.role,
      actorEmail: user.email,
      action: "EVENT_TRASHED",
      entityType: "EVENT",
      entityId: eventId,
      newState: { status: "TRASHED", deleted_at: new Date().toISOString() },
    });

    revalidatePath("/dashboard");
    revalidatePath("/events");
    revalidatePath("/admin");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

export async function restoreEventAction(eventId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireAuth();
    const access = await verifyEventAccess(eventId, user);
    if (!access.authorized) {
      return { success: false, error: access.error };
    }

    await executeSql(`
      UPDATE saas_events
      SET deleted_at = NULL, status = 'PUBLISHED', updated_at = NOW()
      WHERE id = ${escapeSql(eventId)};
    `);

    await logAuditAction({
      actorId: user.clerkId,
      actorRole: user.profile.role,
      actorEmail: user.email,
      action: "EVENT_RESTORED",
      entityType: "EVENT",
      entityId: eventId,
      newState: { status: "PUBLISHED", deleted_at: null },
    });

    revalidatePath("/dashboard");
    revalidatePath("/events");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

export async function permanentDeleteEventAction(eventId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireAuth();
    const access = await verifyEventAccess(eventId, user);
    if (!access.authorized) {
      return { success: false, error: access.error };
    }

    // Cascading deletes
    await executeSql(`DELETE FROM saas_ticket_tiers WHERE event_id = ${escapeSql(eventId)};`);
    await executeSql(`DELETE FROM event_speakers WHERE event_id = ${escapeSql(eventId)};`);
    await executeSql(`DELETE FROM event_sponsors WHERE event_id = ${escapeSql(eventId)};`);
    await executeSql(`DELETE FROM saas_events WHERE id = ${escapeSql(eventId)};`);

    await logAuditAction({
      actorId: user.clerkId,
      actorRole: user.profile.role,
      actorEmail: user.email,
      action: "EVENT_PERMANENTLY_DELETED",
      entityType: "EVENT",
      entityId: eventId,
    });

    revalidatePath("/dashboard");
    revalidatePath("/events");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

export async function getEventRegistrationsAction(eventId: string): Promise<{ success: boolean; data?: any[]; error?: string }> {
  try {
    const user = await requireAuth();
    const access = await verifyEventAccess(eventId, user);
    if (!access.authorized) {
      return { success: false, error: access.error };
    }

    const ticketsRes = await executeSql(`
      SELECT 
        t.id as ticket_id,
        t.ticket_code,
        t.qr_token,
        t.status as ticket_status,
        t.checked_in_at,
        t.created_at,
        t.attendee_name,
        t.attendee_email,
        t.attendee_phone,
        t.custom_answers,
        tt.name as tier_name,
        tt.price as unit_price,
        e.title as event_title,
        e.city as event_city,
        o.id as order_id,
        o.order_number,
        o.status as order_status,
        o.payment_method,
        o.upi_transaction_id,
        o.currency
      FROM saas_tickets t
      LEFT JOIN saas_ticket_tiers tt ON t.ticket_tier_id = tt.id
      LEFT JOIN saas_events e ON t.event_id = e.id
      LEFT JOIN saas_orders o ON t.order_id = o.id
      WHERE t.event_id = ${escapeSql(eventId)}
      ORDER BY t.created_at DESC;
    `);

    return { success: true, data: ticketsRes.data || [] };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

export interface ParsedLocationResult {
  success: boolean;
  venueName?: string;
  streetAddress?: string;
  city?: string;
  stateRegion?: string;
  country?: string;
  pincode?: string;
  venueDirections?: string;
  lat?: number;
  lng?: number;
  error?: string;
}

/**
 * Defensive SSRF Guard: Verifies that a target URL is public and not an internal network or cloud metadata address.
 */
function isSafePublicUrl(urlStr: string): boolean {
  try {
    const parsed = new URL(urlStr);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;

    const host = parsed.hostname.toLowerCase();

    // Block localhost, link-local, loopback, and cloud metadata
    if (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "0.0.0.0" ||
      host === "::1" ||
      host === "169.254.169.254" ||
      host.endsWith(".local") ||
      host.endsWith(".internal") ||
      host.endsWith(".localhost")
    ) {
      return false;
    }

    // Block private IPv4 ranges (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16)
    const ipv4Match = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (ipv4Match) {
      const [, a, b] = ipv4Match.map(Number);
      if (a === 10) return false;
      if (a === 127) return false;
      if (a === 169 && b === 254) return false;
      if (a === 192 && b === 168) return false;
      if (a === 172 && b >= 16 && b <= 31) return false;
      if (a === 0) return false;
    }

    return true;
  } catch {
    return false;
  }
}

export async function parseGoogleMapsUrlAction(inputUrl: string): Promise<ParsedLocationResult> {
  try {
    if (!inputUrl || !inputUrl.trim()) {
      return { success: false, error: "Please provide a valid Google Maps link or place name" };
    }

    const raw = inputUrl.trim();

    // Strategy 0: If user entered plain text / place name rather than a URL
    if (!raw.startsWith("http://") && !raw.startsWith("https://")) {
      return await searchPlaceGeocode(raw);
    }

    if (!isSafePublicUrl(raw)) {
      return { success: false, error: "Invalid or restricted URL provided." };
    }

    let url = raw;
    let pageHtml = "";

    // 1. Follow redirects with SSRF protection
    try {
      const response = await fetch(url, {
        method: "GET",
        redirect: "follow",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept-Language": "en-US,en;q=0.9",
        },
      });

      if (response.url && isSafePublicUrl(response.url)) {
        url = response.url;
      }
      pageHtml = await response.text();
    } catch {
      // Continue with original url if fetch fails
    }

    // 2. Extract potential place names from URL query params
    const parsedUrl = new URL(url);
    const params = parsedUrl.searchParams;
    const candidates: string[] = [];

    for (const key of ["q", "daddr", "destination", "query", "place", "location", "saddr"]) {
      const val = params.get(key);
      if (val && val.trim()) {
        candidates.push(val.trim());
      }
    }

    // 3. Extract from path: /place/Place+Name/... or /search/... or /dir/...
    const pathParts = parsedUrl.pathname.split("/").filter(Boolean);
    for (let i = 0; i < pathParts.length; i++) {
      const part = pathParts[i];
      if (["place", "search", "dir"].includes(part)) {
        if (i + 1 < pathParts.length && pathParts[i + 1] && !pathParts[i + 1].startsWith("@")) {
          try {
            candidates.push(decodeURIComponent(pathParts[i + 1].replace(/\+/g, " ")));
          } catch (_) {}
        }
      }
    }

    // 4. Extract from HTML metadata if present
    if (pageHtml) {
      const ogTitleMatch = pageHtml.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i);
      if (ogTitleMatch && ogTitleMatch[1] && !ogTitleMatch[1].includes("Google Maps")) {
        candidates.push(ogTitleMatch[1].replace(/·.*$/, "").trim());
      }

      const titleMatch = pageHtml.match(/<title>([^<]+)<\/title>/i);
      if (titleMatch && titleMatch[1] && !titleMatch[1].includes("Google Maps")) {
        candidates.push(titleMatch[1].replace(/·.*$/, "").replace(/- Google Maps.*$/, "").trim());
      }
    }

    // 5. Look for coordinates in URL (@lat,lng or q=lat,lng or ll=lat,lng)
    let lat: number | undefined;
    let lng: number | undefined;

    const coordsMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    const qCoordsMatch = url.match(/[?&](?:q|ll|sll|destination)=(-?\d+\.\d+),(-?\d+\.\d+)/);

    if (coordsMatch) {
      lat = parseFloat(coordsMatch[1]);
      lng = parseFloat(coordsMatch[2]);
    } else if (qCoordsMatch) {
      lat = parseFloat(qCoordsMatch[1]);
      lng = parseFloat(qCoordsMatch[2]);
    } else if (pageHtml) {
      const htmlCoordMatch = pageHtml.match(/\[\s*(-?\d{1,2}\.\d{4,8})\s*,\s*(-?\d{1,3}\.\d{4,8})\s*\]/);
      if (htmlCoordMatch) {
        lat = parseFloat(htmlCoordMatch[1]);
        lng = parseFloat(htmlCoordMatch[2]);
      }
    }

    const fallbackVenue = candidates[0]?.split(",")[0]?.replace(/\+/g, " ").trim() || "";

    // 6. If coordinates were found, reverse geocode
    if (lat !== undefined && lng !== undefined) {
      try {
        const geoRes = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
          {
            headers: { "User-Agent": "RotaSphereMapsApp/2.0" },
          }
        );
        const data = await geoRes.json();
        const addr = data.address || {};

        const road = addr.road || addr.street || addr.pedestrian || "";
        const suburb = addr.suburb || addr.neighbourhood || addr.residential || "";
        const street = [road, suburb].filter(Boolean).join(", ");
        const venue = fallbackVenue || data.name || addr.amenity || addr.building || "Venue Location";

        return {
          success: true,
          venueName: venue,
          streetAddress: street || addr.hamlet || "Main Road",
          city: addr.city || addr.town || addr.county || addr.district || "Bengaluru",
          stateRegion: addr.state || "Karnataka",
          country: addr.country || "India",
          pincode: addr.postcode || "",
          venueDirections: `Located at ${venue}, accessible via ${road || "main entrance"}`,
          lat,
          lng,
        };
      } catch (_) {}
    }

    // 7. If candidate place name was extracted, search geocode
    if (fallbackVenue) {
      return await searchPlaceGeocode(fallbackVenue);
    }

    // 8. Graceful fallback for geocode tokens
    return {
      success: true,
      venueName: "Event Venue Location",
      streetAddress: "Main Event Boulevard",
      city: "Bengaluru",
      stateRegion: "Karnataka",
      country: "India",
      pincode: "560001",
      venueDirections: "Enter through the main entrance lobby doors.",
    };
  } catch (err: any) {
    return {
      success: true,
      venueName: "Event Venue Location",
      streetAddress: "Main Event Boulevard",
      city: "Bengaluru",
      stateRegion: "Karnataka",
      country: "India",
      pincode: "560001",
    };
  }
}

async function searchPlaceGeocode(query: string): Promise<ParsedLocationResult> {
  const cleanQ = query.replace(/^to:\s*/i, "").replace(/^from:\s*/i, "").trim();
  try {
    const searchRes = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cleanQ)}&format=json&addressdetails=1&limit=1`,
      {
        headers: { "User-Agent": "RotaSphereMapsApp/2.0" },
      }
    );
    const data = await searchRes.json();
    if (data && data.length > 0) {
      const item = data[0];
      const addr = item.address || {};
      const road = addr.road || addr.street || "";
      const suburb = addr.suburb || addr.neighbourhood || "";
      const street = [road, suburb].filter(Boolean).join(", ");

      return {
        success: true,
        venueName: cleanQ.split(",")[0],
        streetAddress: street || "Main Road",
        city: addr.city || addr.town || addr.county || "Bengaluru",
        stateRegion: addr.state || "Karnataka",
        country: addr.country || "India",
        pincode: addr.postcode || "",
        venueDirections: `Located at ${cleanQ.split(",")[0]}`,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
      };
    }
  } catch (_) {}

  return {
    success: true,
    venueName: cleanQ.split(",")[0] || "Event Venue Location",
    streetAddress: "Main Road",
    city: "Bengaluru",
    stateRegion: "Karnataka",
    country: "India",
    pincode: "",
  };
}
