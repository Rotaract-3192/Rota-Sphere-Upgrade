"use server";

import { getCurrentUser } from "@/lib/auth/getUser";
import { executeSql, escapeSql } from "@/lib/db/directDb";
import { logAuditAction } from "@/lib/services/auditService";
import { revalidatePath } from "next/cache";

export interface SubmitGrievanceInput {
  name: string;
  email: string;
  phone?: string;
  category: string;
  title?: string;
  description: string;
  orderId?: string;
  ticketId?: string;
  source?: "dispute" | "contact" | "privacy" | "general";
}

/**
 * Ensures the privacy_complaints / grievance database table and all columns exist.
 */
async function ensureGrievanceTable(): Promise<void> {
  try {
    await executeSql(`
      CREATE TABLE IF NOT EXISTS privacy_complaints (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        complaint_number text UNIQUE,
        user_id text,
        user_email text NOT NULL,
        user_name text NOT NULL,
        category text NOT NULL,
        description text NOT NULL,
        status text NOT NULL DEFAULT 'open',
        phone text,
        title text,
        order_id text,
        ticket_id text,
        assigned_to text,
        internal_notes text,
        resolution text,
        resolved_at timestamptz,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      );
      ALTER TABLE privacy_complaints ADD COLUMN IF NOT EXISTS phone text;
      ALTER TABLE privacy_complaints ADD COLUMN IF NOT EXISTS title text;
      ALTER TABLE privacy_complaints ADD COLUMN IF NOT EXISTS order_id text;
      ALTER TABLE privacy_complaints ADD COLUMN IF NOT EXISTS ticket_id text;
      ALTER TABLE privacy_complaints ADD COLUMN IF NOT EXISTS complaint_number text;
      ALTER TABLE privacy_complaints ADD COLUMN IF NOT EXISTS user_id text;
      ALTER TABLE privacy_complaints ADD COLUMN IF NOT EXISTS user_email text;
      ALTER TABLE privacy_complaints ADD COLUMN IF NOT EXISTS user_name text;
      ALTER TABLE privacy_complaints ADD COLUMN IF NOT EXISTS category text;
      ALTER TABLE privacy_complaints ADD COLUMN IF NOT EXISTS description text;
      ALTER TABLE privacy_complaints ADD COLUMN IF NOT EXISTS status text DEFAULT 'open';
      ALTER TABLE privacy_complaints ADD COLUMN IF NOT EXISTS resolution text;
      ALTER TABLE privacy_complaints ADD COLUMN IF NOT EXISTS resolved_at timestamptz;
      ALTER TABLE privacy_complaints ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
      ALTER TABLE privacy_complaints ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
    `);
  } catch (e) {
    console.warn("Grievance table check note:", e);
  }
}

/**
 * Submits a new grievance or dispute ticket to the database.
 * Visible immediately in Super Admin Panel under Grievances & Complaints.
 */
export async function submitGrievanceAction(input: SubmitGrievanceInput): Promise<{
  success: boolean;
  complaintNumber?: string;
  id?: string;
  error?: string;
}> {
  try {
    await ensureGrievanceTable();

    const user = await getCurrentUser();

    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const complaintNumber = `DIS-2026-${randomSuffix}`;

    const resolvedUserId = user?.clerkId || null;
    const resolvedEmail = input.email?.trim() || user?.email || "anonymous@rotasphere.org";
    const resolvedName = input.name?.trim() || user?.profile?.full_name || "Valued User";
    const resolvedTitle = input.title?.trim() || `${input.category} Grievance`;
    const resolvedDescription = input.description?.trim();

    if (!resolvedDescription) {
      return { success: false, error: "Description is required" };
    }

    const { data: insertedRows, error: insertErr } = await executeSql(`
      INSERT INTO privacy_complaints (
        complaint_number,
        user_id,
        user_email,
        user_name,
        category,
        title,
        description,
        phone,
        order_id,
        ticket_id,
        status,
        created_at,
        updated_at
      ) VALUES (
        ${escapeSql(complaintNumber)},
        ${escapeSql(resolvedUserId)},
        ${escapeSql(resolvedEmail)},
        ${escapeSql(resolvedName)},
        ${escapeSql(input.category || "General Grievance")},
        ${escapeSql(resolvedTitle)},
        ${escapeSql(resolvedDescription)},
        ${escapeSql(input.phone || null)},
        ${escapeSql(input.orderId || null)},
        ${escapeSql(input.ticketId || null)},
        'open',
        NOW(),
        NOW()
      )
      RETURNING id, complaint_number;
    `);

    if (insertErr || !insertedRows || insertedRows.length === 0) {
      return { success: false, error: insertErr?.message || "Failed to submit grievance report" };
    }

    const createdId = insertedRows[0].id;
    const finalComplaintNumber = insertedRows[0].complaint_number || complaintNumber;

    try {
      await logAuditAction({
        actorId: resolvedUserId || "anonymous",
        actorRole: user?.profile?.role || "user",
        actorEmail: resolvedEmail,
        action: "GRIEVANCE_REPORT_SUBMITTED",
        entityType: "COMPLAINT",
        entityId: finalComplaintNumber,
        newState: {
          complaintNumber: finalComplaintNumber,
          category: input.category,
          title: resolvedTitle,
          orderId: input.orderId,
          ticketId: input.ticketId,
        },
      });
    } catch {}

    revalidatePath("/admin");
    revalidatePath("/disputes");
    revalidatePath("/dispute-resolution");
    revalidatePath("/privacy-center");
    revalidatePath("/contact");

    return {
      success: true,
      complaintNumber: finalComplaintNumber,
      id: createdId,
    };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

/**
 * Retrieves the user's grievance disputes or recent records.
 */
export async function getGrievanceDisputesAction(): Promise<{
  success: boolean;
  data: any[];
  error?: string;
}> {
  try {
    await ensureGrievanceTable();
    const user = await getCurrentUser();

    let query = `SELECT * FROM privacy_complaints ORDER BY created_at DESC LIMIT 50;`;
    if (user?.clerkId) {
      query = `
        SELECT * FROM privacy_complaints 
        WHERE user_id = ${escapeSql(user.clerkId)} OR user_email = ${escapeSql(user.email)}
        ORDER BY created_at DESC LIMIT 50;
      `;
    }

    const { data } = await executeSql(query);
    return { success: true, data: data || [] };
  } catch (err: any) {
    return { success: false, data: [], error: err?.message || String(err) };
  }
}
