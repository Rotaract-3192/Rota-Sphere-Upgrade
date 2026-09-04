"use server";

/**
 * District 3192 Club Server Actions
 * Handles official Rotaract clubs directory, database synchronization, Super Admin CRUD, and organizer linking.
 */

import { requireRole } from "@/lib/auth/getUser";
import { executeSql, escapeSql } from "@/lib/db/directDb";
import { logAuditAction } from "@/lib/services/auditService";
import { DISTRICT_3192_CLUBS, DistrictClub } from "@/lib/data/districtClubsData";
import { revalidatePath } from "next/cache";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/rotaract club of /i, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "club-" + Math.random().toString(36).substring(2, 7);
}

/**
 * Ensure columns exist on organizations table
 */
export async function ensureClubColumns() {
  try {
    await executeSql(`
      ALTER TABLE organizations ADD COLUMN IF NOT EXISTS zone text;
      ALTER TABLE organizations ADD COLUMN IF NOT EXISTS club_type text;
      ALTER TABLE organizations ADD COLUMN IF NOT EXISTS partner_club text;
      ALTER TABLE organizations ADD COLUMN IF NOT EXISTS contact_email text;
      ALTER TABLE organizations ADD COLUMN IF NOT EXISTS president_name text;
      ALTER TABLE organizations ADD COLUMN IF NOT EXISTS president_phone text;
      ALTER TABLE organizations ADD COLUMN IF NOT EXISTS president_email text;
      ALTER TABLE organizations ADD COLUMN IF NOT EXISTS status text DEFAULT 'ACTIVE';
      ALTER TABLE organizations ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT true;
      ALTER TABLE organizations ALTER COLUMN support_email DROP NOT NULL;
      ALTER TABLE organizations ALTER COLUMN city DROP NOT NULL;
    `);
  } catch (e) {
    console.error("Error ensuring club columns:", e);
  }
}

/**
 * Internal helper to seed all 85 authentic District 3192 clubs
 */
export async function seedDistrictClubsInternal(shouldRevalidate = false): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    await ensureClubColumns();

    // Fast Batch Seeding in chunks of 30
    const chunkSize = 30;
    let count = 0;

    for (let i = 0; i < DISTRICT_3192_CLUBS.length; i += chunkSize) {
      const chunk = DISTRICT_3192_CLUBS.slice(i, i + chunkSize);
      
      const valuesSql = chunk.map((club) => {
        const slug = generateSlug(club.name);
        const email = (club.clubEmail && club.clubEmail.split(",")[0].trim()) || club.presidentEmail || "info@rotaract3192.org";
        return `(
          ${escapeSql(club.name)},
          ${escapeSql(slug)},
          ${escapeSql(club.zone)},
          ${escapeSql(club.clubType)},
          ${escapeSql(club.partnerClub)},
          ${escapeSql(club.clubEmail)},
          ${escapeSql(email)},
          'Bengaluru',
          'India',
          ${escapeSql(club.presidentName || "")},
          ${escapeSql(club.presidentPhone || "")},
          ${escapeSql(club.presidentEmail || "")},
          'ACTIVE',
          true,
          NOW(),
          NOW()
        )`;
      }).join(",\n");

      const sql = `
        INSERT INTO organizations (
          name, slug, zone, club_type, partner_club, contact_email, support_email, city, country,
          president_name, president_phone, president_email,
          status, is_verified, created_at, updated_at
        ) VALUES ${valuesSql}
        ON CONFLICT DO NOTHING;
      `;

      await executeSql(sql);
      count += chunk.length;
    }

    if (shouldRevalidate) {
      try {
        revalidatePath("/clubs");
        revalidatePath("/admin");
        revalidatePath("/dashboard");
      } catch {}
    }

    return { success: true, count };
  } catch (err: any) {
    console.error("Failed to seed clubs:", err);
    return { success: false, count: 0, error: err?.message || String(err) };
  }
}

/**
 * Server Action: Seed all 85 authentic District 3192 clubs into the organizations table
 * Strictly restricted to Platform Administrators.
 */
export async function seedDistrictClubsAction(): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    await requireRole("admin");
    return await seedDistrictClubsInternal(true);
  } catch (err: any) {
    return { success: false, count: 0, error: err?.message || "Unauthorized" };
  }
}

export interface ClubRecord {
  id: string;
  name: string;
  slug: string;
  zone: string;
  club_type: string;
  partner_club: string;
  contact_email: string;
  president_name: string;
  president_phone: string;
  president_email: string;
  status: string;
  is_verified: boolean;
  member_count?: number;
  event_count?: number;
}

/**
 * Fetch all active District 3192 clubs from database
 */
export async function getDistrictClubsAction(): Promise<{ success: boolean; data: ClubRecord[]; error?: string }> {
  try {
    await ensureClubColumns();

    // Query active clubs with count of events
    const res = await executeSql<ClubRecord>(`
      SELECT 
        o.id,
        o.name,
        o.slug,
        COALESCE(o.zone, 'District 3192') as zone,
        COALESCE(o.club_type, 'Community Based') as club_type,
        COALESCE(o.partner_club, '') as partner_club,
        COALESCE(o.contact_email, '') as contact_email,
        COALESCE(o.president_name, '') as president_name,
        COALESCE(o.president_phone, '') as president_phone,
        COALESCE(o.president_email, '') as president_email,
        COALESCE(o.status, 'ACTIVE') as status,
        COALESCE(o.is_verified, true) as is_verified,
        COUNT(DISTINCT e.id)::int as event_count,
        COUNT(DISTINCT om.user_id)::int as member_count
      FROM organizations o
      LEFT JOIN saas_events e ON e.organization_id = o.id AND e.status = 'PUBLISHED'
      LEFT JOIN organization_members om ON om.organization_id = o.id
      WHERE (o.status != 'DELETED' OR o.status IS NULL)
        AND o.id != '328ed943-f625-4fec-82a0-0c92dd7ec592'
      GROUP BY o.id, o.name, o.slug, o.zone, o.club_type, o.partner_club, o.contact_email, o.president_name, o.president_phone, o.president_email, o.status, o.is_verified
      ORDER BY o.name ASC;
    `);

    // If database is empty or has fewer than 20 clubs, trigger internal seeding without revalidatePath
    if (!res.data || res.data.length < 20) {
      seedDistrictClubsInternal(false).catch(() => {});

      // Build complete roster by blending any existing DB clubs with DISTRICT_3192_CLUBS
      const existingNames = new Set((res.data || []).map((o) => o.name.toLowerCase()));
      const merged: ClubRecord[] = [...(res.data || [])];

      for (let i = 0; i < DISTRICT_3192_CLUBS.length; i++) {
        const c = DISTRICT_3192_CLUBS[i];
        if (!existingNames.has(c.name.toLowerCase())) {
          merged.push({
            id: `club-${generateSlug(c.name)}`,
            name: c.name,
            slug: generateSlug(c.name),
            zone: c.zone,
            club_type: c.clubType,
            partner_club: c.partnerClub,
            contact_email: c.clubEmail,
            president_name: c.presidentName || "",
            president_phone: c.presidentPhone || "",
            president_email: c.presidentEmail || "",
            status: "ACTIVE",
            is_verified: true,
            event_count: 0,
            member_count: 0,
          });
        }
      }

      merged.sort((a, b) => a.name.localeCompare(b.name));
      return { success: true, data: merged };
    }

    return { success: true, data: res.data || [] };
  } catch (err: any) {
    console.error("Error fetching clubs:", err);
    // Fallback to static district dataset if db fetch fails
    const fallback: ClubRecord[] = DISTRICT_3192_CLUBS.map((c) => ({
      id: `club-${generateSlug(c.name)}`,
      name: c.name,
      slug: generateSlug(c.name),
      zone: c.zone,
      club_type: c.clubType,
      partner_club: c.partnerClub,
      contact_email: c.clubEmail,
      president_name: c.presidentName || "",
      president_phone: c.presidentPhone || "",
      president_email: c.presidentEmail || "",
      status: "ACTIVE",
      is_verified: true,
      event_count: 0,
      member_count: 0,
    }));
    return { success: true, data: fallback };
  }
}

/**
 * Super Admin Action: Create a new Rotaract Club
 */
export async function createDistrictClubAction(formData: {
  name: string;
  zone: string;
  clubType: string;
  partnerClub?: string;
  contactEmail?: string;
  presidentName?: string;
  presidentPhone?: string;
  presidentEmail?: string;
}): Promise<{ success: boolean; clubId?: string; error?: string }> {
  try {
    const user = await requireRole("admin");

    await ensureClubColumns();
    const slug = generateSlug(formData.name);
    const supportEmail =
      (formData.contactEmail && formData.contactEmail.split(",")[0].trim()) ||
      formData.presidentEmail?.trim() ||
      `${slug}@rotaract3192.org`;

    const res = await executeSql(`
      INSERT INTO organizations (
        name, slug, zone, club_type, partner_club, contact_email, support_email, city, country,
        president_name, president_phone, president_email, 
        status, is_verified, kyc_status, created_at, updated_at
      )
      VALUES (
        ${escapeSql(formData.name.trim())},
        ${escapeSql(slug)},
        ${escapeSql(formData.zone || "District 3192")},
        ${escapeSql(formData.clubType || "Community Based")},
        ${escapeSql(formData.partnerClub || "")},
        ${escapeSql(formData.contactEmail || "")},
        ${escapeSql(supportEmail)},
        'Bengaluru',
        'India',
        ${escapeSql(formData.presidentName || "")},
        ${escapeSql(formData.presidentPhone || "")},
        ${escapeSql(formData.presidentEmail || "")},
        'ACTIVE',
        true,
        'VERIFIED',
        NOW(),
        NOW()
      )
      ON CONFLICT (slug) DO UPDATE SET
        name = EXCLUDED.name,
        zone = EXCLUDED.zone,
        club_type = EXCLUDED.club_type,
        partner_club = EXCLUDED.partner_club,
        contact_email = EXCLUDED.contact_email,
        support_email = EXCLUDED.support_email,
        president_name = EXCLUDED.president_name,
        president_phone = EXCLUDED.president_phone,
        president_email = EXCLUDED.president_email,
        status = 'ACTIVE',
        is_verified = true,
        kyc_status = 'VERIFIED',
        updated_at = NOW()
      RETURNING id;
    `);

    if (res.error) {
      const errorMsg =
        typeof res.error === "object"
          ? res.error.message || JSON.stringify(res.error)
          : String(res.error);
      return { success: false, error: errorMsg || "Failed to create club." };
    }

    const newClubId = res.data?.[0]?.id;

    await logAuditAction({
      actorId: user.clerkId,
      actorRole: user.profile.role,
      actorEmail: user.email,
      action: "CLUB_CREATED",
      entityType: "ORGANIZATION",
      entityId: newClubId,
      newState: formData,
    });

    revalidatePath("/clubs");
    revalidatePath("/admin");
    return { success: true, clubId: newClubId };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

/**
 * Super Admin Action: Update an existing Rotaract Club
 */
export async function updateDistrictClubAction(
  clubId: string,
  formData: {
    name: string;
    zone: string;
    clubType: string;
    partnerClub?: string;
    contactEmail?: string;
    presidentName?: string;
    presidentPhone?: string;
    presidentEmail?: string;
    status?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireRole("admin");

    const email =
      (formData.contactEmail && formData.contactEmail.split(",")[0].trim()) ||
      formData.presidentEmail?.trim();

    const res = await executeSql(`
      UPDATE organizations
      SET
        name = ${escapeSql(formData.name.trim())},
        zone = ${escapeSql(formData.zone)},
        club_type = ${escapeSql(formData.clubType)},
        partner_club = ${escapeSql(formData.partnerClub || "")},
        contact_email = ${escapeSql(formData.contactEmail || "")},
        ${email ? `support_email = ${escapeSql(email)},` : ""}
        president_name = ${escapeSql(formData.presidentName || "")},
        president_phone = ${escapeSql(formData.presidentPhone || "")},
        president_email = ${escapeSql(formData.presidentEmail || "")},
        status = ${escapeSql(formData.status || "ACTIVE")},
        updated_at = NOW()
      WHERE id = ${escapeSql(clubId)};
    `);

    if (res.error) {
      const errorMsg =
        typeof res.error === "object"
          ? res.error.message || JSON.stringify(res.error)
          : String(res.error);
      return { success: false, error: errorMsg || "Failed to update club." };
    }

    await logAuditAction({
      actorId: user.clerkId,
      actorRole: user.profile.role,
      actorEmail: user.email,
      action: "CLUB_UPDATED",
      entityType: "ORGANIZATION",
      entityId: clubId,
      newState: formData,
    });

    revalidatePath("/clubs");
    revalidatePath("/admin");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

/**
 * Super Admin Action: Delete/Archive a Rotaract Club
 */
export async function deleteDistrictClubAction(clubId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireRole("admin");

    // Soft delete club so event histories are preserved
    const res = await executeSql(`
      UPDATE organizations
      SET status = 'DELETED', updated_at = NOW()
      WHERE id = ${escapeSql(clubId)};
    `);

    if (res.error) {
      return { success: false, error: res.error?.message || "Failed to delete club." };
    }

    await logAuditAction({
      actorId: user.clerkId,
      actorRole: user.profile.role,
      actorEmail: user.email,
      action: "CLUB_DELETED",
      entityType: "ORGANIZATION",
      entityId: clubId,
    });

    revalidatePath("/clubs");
    revalidatePath("/admin");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}
