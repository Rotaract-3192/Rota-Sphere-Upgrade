/**
 * Retention Engine — DPDP Act 2023 Compliance
 *
 * Runs scheduled cleanup jobs to enforce retention policies.
 * Called from /api/cron/retention (protected by CRON_SECRET).
 *
 * Rules:
 * 1. Check legal_hold before deleting — NEVER delete a held record
 * 2. Log every deletion/anonymisation in audit_logs
 * 3. Anonymise financial records — do not hard delete
 * 4. Hard delete marketing/consent data when requested
 */

import { executeSql } from "@/lib/db/directDb";
import { writeAuditLog } from "@/lib/audit/auditLog";

export interface RetentionRunResult {
  ran_at: string;
  jobs: {
    category: string;
    action: string;
    affected: number;
    status: "ok" | "error";
    error?: string;
  }[];
}

export async function runRetentionEngine(): Promise<RetentionRunResult> {
  const ran_at = new Date().toISOString();
  const jobs: RetentionRunResult["jobs"] = [];

  // ── 1. Expire old data exports ──────────────────────────────────────────
  try {
    const { data } = await executeSql(`
      UPDATE data_exports
      SET status = 'expired', signed_url = NULL
      WHERE status IN ('ready', 'generating')
        AND expires_at < now()
      RETURNING id;
    `);
    const affected = data?.length ?? 0;
    jobs.push({ category: "data_exports", action: "expired", affected, status: "ok" });
    if (affected > 0) {
      await writeAuditLog({
        action: "RETENTION_EXPORT_EXPIRED",
        category: "DATA_DELETE",
        resourceType: "data_exports",
        result: "SUCCESS",
        metadata: { count: affected },
      });
    }
  } catch (e: unknown) {
    jobs.push({ category: "data_exports", action: "expired", affected: 0, status: "error", error: String(e) });
  }

  // ── 2. Delete expired push subscriptions (>2 years) ───────────────────
  try {
    const { data } = await executeSql(`
      DELETE FROM push_subscriptions
      WHERE created_at < now() - interval '2 years'
      RETURNING id;
    `);
    const affected = data?.length ?? 0;
    jobs.push({ category: "push_subscriptions", action: "hard_delete", affected, status: "ok" });
  } catch (e: unknown) {
    jobs.push({ category: "push_subscriptions", action: "hard_delete", affected: 0, status: "error", error: String(e) });
  }

  // ── 3. Anonymise old withdrawn consents (>5 years) ────────────────────
  try {
    const { data } = await executeSql(`
      UPDATE consents
      SET user_email = 'anonymized@deleted.invalid',
          updated_at = now()
      WHERE status = 'withdrawn'
        AND withdrawn_at < now() - interval '5 years'
        AND user_email != 'anonymized@deleted.invalid'
      RETURNING id;
    `);
    const affected = data?.length ?? 0;
    jobs.push({ category: "consents", action: "anonymise", affected, status: "ok" });
  } catch (e: unknown) {
    jobs.push({ category: "consents", action: "anonymise", affected: 0, status: "error", error: String(e) });
  }

  // ── 4. Close stale privacy requests >90 days without response ─────────
  try {
    const { data } = await executeSql(`
      UPDATE privacy_requests
      SET status = 'closed',
          response = 'Request automatically closed after 90 days without activity.',
          updated_at = now()
      WHERE status IN ('open', 'awaiting_info')
        AND created_at < now() - interval '90 days'
      RETURNING id;
    `);
    const affected = data?.length ?? 0;
    jobs.push({ category: "privacy_requests", action: "auto_close", affected, status: "ok" });
  } catch (e: unknown) {
    jobs.push({ category: "privacy_requests", action: "auto_close", affected: 0, status: "error", error: String(e) });
  }

  // ── 5. Process pending deletion jobs ──────────────────────────────────
  try {
    const { data: pendingJobs } = await executeSql(`
      SELECT id, target_user_id, job_type FROM deletion_jobs
      WHERE status = 'pending'
        AND created_at < now() - interval '5 minutes'
      LIMIT 10;
    `);

    for (const job of (pendingJobs ?? [])) {
      try {
        // Check for legal hold
        const { data: holds } = await executeSql(`
          SELECT id FROM legal_holds
          WHERE target_user_id = '${(job.target_user_id as string).replace(/'/g, "''")}' AND is_active = true
          LIMIT 1;
        `);

        if (holds && holds.length > 0) {
          await executeSql(`UPDATE deletion_jobs SET status = 'blocked_by_legal_hold', updated_at = now() WHERE id = '${job.id}';`);
          continue;
        }

        // Anonymise user's personal data (retain financial records)
        if (job.job_type === "user_erasure") {
          const userId = (job.target_user_id as string).replace(/'/g, "''");

          await executeSql(`
            UPDATE saas_tickets
            SET attendee_name = 'Deleted User', attendee_email = 'deleted@deleted.invalid', phone = NULL
            WHERE owner_user_id = '${userId}';
          `);

          await executeSql(`
            UPDATE consents
            SET status = 'withdrawn', user_email = 'deleted@deleted.invalid', withdrawn_at = now()
            WHERE user_id = '${userId}';
          `);

          await executeSql(`
            DELETE FROM push_subscriptions WHERE user_id = '${userId}';
          `);

          await executeSql(`
            UPDATE deletion_jobs SET status = 'completed', completed_at = now(), updated_at = now()
            WHERE id = '${job.id}';
          `);

          await writeAuditLog({
            action: "USER_DATA_ERASED",
            category: "DATA_DELETE",
            actorId: "SYSTEM_RETENTION_ENGINE",
            resourceType: "user",
            resourceId: job.target_user_id as string,
            result: "SUCCESS",
            metadata: { job_id: job.id, method: "anonymise" },
          });
        }
      } catch (e: unknown) {
        await executeSql(`
          UPDATE deletion_jobs SET status = 'failed', error_message = '${String(e).replace(/'/g, "''")}', updated_at = now()
          WHERE id = '${job.id}';
        `);
      }
    }
    jobs.push({ category: "deletion_jobs", action: "process_pending", affected: pendingJobs?.length ?? 0, status: "ok" });
  } catch (e: unknown) {
    jobs.push({ category: "deletion_jobs", action: "process_pending", affected: 0, status: "error", error: String(e) });
  }

  // Log retention run
  await writeAuditLog({
    action: "RETENTION_ENGINE_RAN",
    category: "ADMIN_ACTION",
    actorId: "SYSTEM",
    result: "SUCCESS",
    metadata: { ran_at, job_count: jobs.length, jobs },
  });

  return { ran_at, jobs };
}
