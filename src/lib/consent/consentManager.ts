/**
 * Consent Manager — DPDP Act 2023 Compliance
 *
 * Handles all consent-related operations:
 * - Grant, withdraw, check, and list consents
 * - Each purpose is tracked separately (no bundled consent)
 * - Every change is audit-logged
 *
 * Purposes:
 *   transactional_email     — Required for ticket delivery (no consent needed)
 *   marketing_email         — Optional, explicit consent required
 *   transactional_whatsapp  — Optional, explicit consent required
 *   marketing_whatsapp      — Optional, explicit consent required
 *   marketing_sms           — Optional, explicit consent required
 *   analytics               — Optional, explicit consent required
 *   personalisation         — Optional, explicit consent required
 */

import { executeSql } from "@/lib/db/directDb";
import { auditConsent } from "@/lib/audit/auditLog";

export type ConsentPurpose =
  | "transactional_email"
  | "marketing_email"
  | "transactional_whatsapp"
  | "marketing_whatsapp"
  | "marketing_sms"
  | "analytics"
  | "personalisation";

export type ConsentStatus = "granted" | "denied" | "withdrawn" | "pending";

export interface ConsentRecord {
  id: string;
  userId: string;
  userEmail: string;
  purpose: ConsentPurpose;
  status: ConsentStatus;
  policyVersionTag: string | null;
  source: string;
  grantedAt: string | null;
  withdrawnAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export const CONSENT_LABELS: Record<ConsentPurpose, { label: string; description: string; required: boolean }> = {
  transactional_email: {
    label: "Transactional Email",
    description: "Ticket confirmations, payment receipts, event updates. Required for ticket delivery.",
    required: true,
  },
  marketing_email: {
    label: "Marketing & Promotional Emails",
    description: "New event announcements, special offers, and promotional campaigns by email.",
    required: false,
  },
  transactional_whatsapp: {
    label: "WhatsApp Event Updates",
    description: "Event reminders and important updates via WhatsApp.",
    required: false,
  },
  marketing_whatsapp: {
    label: "WhatsApp Promotional Messages",
    description: "New event promotions and offers via WhatsApp.",
    required: false,
  },
  marketing_sms: {
    label: "SMS Promotions",
    description: "Promotional SMS messages about upcoming events.",
    required: false,
  },
  analytics: {
    label: "Usage Analytics",
    description: "Anonymous usage data to help us improve the platform experience.",
    required: false,
  },
  personalisation: {
    label: "Personalisation",
    description: "Personalised event recommendations based on your interests and past activity.",
    required: false,
  },
};

/** Fetch all consent records for a user */
export async function getUserConsents(userId: string): Promise<ConsentRecord[]> {
  const { data } = await executeSql(`
    SELECT id, user_id, user_email, purpose, status,
           policy_version_tag, source,
           granted_at, withdrawn_at, created_at, updated_at
    FROM consents
    WHERE user_id = '${userId.replace(/'/g, "''")}'
    ORDER BY purpose ASC;
  `);
  return (data || []).map(mapRow);
}

/** Check if a user has granted a specific consent purpose */
export async function hasConsent(userId: string, purpose: ConsentPurpose): Promise<boolean> {
  const { data } = await executeSql(`
    SELECT status FROM consents
    WHERE user_id = '${userId.replace(/'/g, "''")}' AND purpose = '${purpose}'
    LIMIT 1;
  `);
  if (!data || data.length === 0) return true; // Default ON
  return data[0]?.status === "granted";
}

/** Grant consent for one or more purposes */
export async function grantConsents(
  userId: string,
  userEmail: string,
  purposes: ConsentPurpose[],
  source = "web",
  policyVersionTag?: string
): Promise<void> {
  for (const purpose of purposes) {
    const tag = policyVersionTag ? `'${policyVersionTag.replace(/'/g, "''")}'` : "NULL";
    await executeSql(`
      INSERT INTO consents (user_id, user_email, purpose, status, source, policy_version_tag, granted_at)
      VALUES ('${userId.replace(/'/g, "''")}', '${userEmail.replace(/'/g, "''")}', '${purpose}', 'granted', '${source}', ${tag}, now())
      ON CONFLICT (user_id, purpose) DO UPDATE
        SET status = 'granted',
            granted_at = now(),
            withdrawn_at = NULL,
            policy_version_tag = ${tag},
            source = '${source}',
            updated_at = now();
    `);
    await auditConsent(userId, userEmail, purpose, "granted");
  }
}

/** Withdraw consent for one or more purposes */
export async function withdrawConsents(
  userId: string,
  userEmail: string,
  purposes: ConsentPurpose[]
): Promise<void> {
  for (const purpose of purposes) {
    await executeSql(`
      UPDATE consents
      SET status = 'withdrawn', withdrawn_at = now(), updated_at = now()
      WHERE user_id = '${userId.replace(/'/g, "''")}' AND purpose = '${purpose}';
    `);
    await auditConsent(userId, userEmail, purpose, "withdrawn");
  }
}

/** Initialise transactional_email consent as granted for new users */
export async function initTransactionalConsent(userId: string, userEmail: string): Promise<void> {
  await executeSql(`
    INSERT INTO consents (user_id, user_email, purpose, status, source, granted_at)
    VALUES ('${userId.replace(/'/g, "''")}', '${userEmail.replace(/'/g, "''")}', 'transactional_email', 'granted', 'system', now())
    ON CONFLICT (user_id, purpose) DO NOTHING;
  `);
}

function mapRow(row: Record<string, unknown>): ConsentRecord {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    userEmail: row.user_email as string,
    purpose: row.purpose as ConsentPurpose,
    status: row.status as ConsentStatus,
    policyVersionTag: row.policy_version_tag as string | null,
    source: row.source as string,
    grantedAt: row.granted_at as string | null,
    withdrawnAt: row.withdrawn_at as string | null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}
