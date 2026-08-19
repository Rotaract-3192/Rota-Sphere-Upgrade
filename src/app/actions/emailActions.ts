"use server";

/**
 * Advanced Email Broadcast Studio Server Actions
 * Features:
 * 1. Chunked Batch Dispatch (5 emails/batch to protect SMTP connections)
 * 2. Real-time test email previews
 * 3. Personalized placeholders: {{name}}, {{ticket_code}}, {{category}}
 * 4. Custom CTA button & QR code toggle support
 * Enforces strict role checks and event ownership authorization.
 */

import { getCurrentUser, hasMinimumRole } from "@/lib/auth/getUser";
import QRCode from "qrcode";
import { executeSql, escapeSql } from "@/lib/db/directDb";
import { sendEmail, buildStudioBroadcastEmailHtml, EmailAttachment } from "@/lib/notifications/notificationService";
import { logAuditAction } from "@/lib/services/auditService";

export interface RecipientAttendee {
  name: string;
  email: string;
  ticketCode: string;
  category: string;
  qrToken?: string;
}

export async function getBroadcastRecipientsAction(params: {
  eventId?: string;
  scope: "ALL_APPROVED" | "SELECTED_ROWS" | "CUSTOM_EMAILS" | "TEST_MODE";
  selectedTicketIds?: string[];
  customEmailString?: string;
}) {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Unauthorized", recipients: [] };

  if (!hasMinimumRole(user.profile.role, "organizer")) {
    return { success: false, error: "Unauthorized: Organizer access required to manage broadcasts.", recipients: [] };
  }

  // If scoping to an event, check ownership or admin role
  if (params.eventId) {
    const { data: evts } = await executeSql(`
      SELECT organizer_id, created_by_user_id FROM saas_events WHERE id = ${escapeSql(params.eventId)} LIMIT 1;
    `);
    const evt = evts?.[0];
    const isOwner = evt && (evt.organizer_id === user.clerkId || evt.created_by_user_id === user.clerkId);
    if (!isOwner && !hasMinimumRole(user.profile.role, "admin")) {
      return { success: false, error: "Unauthorized: You do not have permission to view recipients for this event.", recipients: [] };
    }
  }

  try {
    let recipients: RecipientAttendee[] = [];

    if (params.scope === "TEST_MODE") {
      const userEmail = user.email || "test@rotasphere.in";
      const userName = user.profile.full_name || "Delegate";
      recipients = [
        {
          name: userName,
          email: userEmail,
          ticketCode: "TKT-SAMPLE-8821",
          category: "VIP Pass",
          qrToken: "SAMPLE_QR_TOKEN_8821",
        },
      ];
    } else if (params.scope === "CUSTOM_EMAILS" && params.customEmailString) {
      const emails = params.customEmailString
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter((e) => e.includes("@") && e.length > 5);

      recipients = emails.map((e, idx) => ({
        name: e.split("@")[0],
        email: e,
        ticketCode: `TKT-CUSTOM-${idx + 1}`,
        category: "General Delegate",
        qrToken: `CUSTOM_TOKEN_${idx + 1}`,
      }));
    } else if (params.scope === "SELECTED_ROWS" && params.selectedTicketIds && params.selectedTicketIds.length > 0) {
      const idsList = params.selectedTicketIds.map((id) => escapeSql(id)).join(",");
      const { data } = await executeSql(`
        SELECT t.attendee_name, t.attendee_email, t.ticket_code, t.qr_token, tr.name as tier_name
        FROM saas_tickets t
        LEFT JOIN saas_ticket_tiers tr ON tr.id = t.ticket_tier_id
        WHERE t.id IN (${idsList});
      `);

      if (data && data.length > 0) {
        recipients = data.map((r: any) => ({
          name: r.attendee_name || r.attendee_email?.split("@")[0] || "Delegate",
          email: r.attendee_email,
          ticketCode: r.ticket_code || "TKT-GENERIC",
          category: r.tier_name || "General Pass",
          qrToken: r.qr_token || r.ticket_code,
        }));
      }
    } else if (params.eventId) {
      // ALL_APPROVED for selected event
      const { data } = await executeSql(`
        SELECT t.attendee_name, t.attendee_email, t.ticket_code, t.qr_token, tr.name as tier_name
        FROM saas_tickets t
        LEFT JOIN saas_ticket_tiers tr ON tr.id = t.ticket_tier_id
        WHERE t.event_id = ${escapeSql(params.eventId)}
          AND t.status = 'CONFIRMED'
          AND t.attendee_email IS NOT NULL 
          AND t.attendee_email != '';
      `);

      if (data && data.length > 0) {
        recipients = data.map((r: any) => ({
          name: r.attendee_name || r.attendee_email?.split("@")[0] || "Delegate",
          email: r.attendee_email,
          ticketCode: r.ticket_code || "TKT-GENERIC",
          category: r.tier_name || "General Pass",
          qrToken: r.qr_token || r.ticket_code,
        }));
      }
    }

    // Deduplicate by email
    const uniqueMap = new Map<string, RecipientAttendee>();
    for (const r of recipients) {
      if (r.email && !uniqueMap.has(r.email.toLowerCase())) {
        uniqueMap.set(r.email.toLowerCase(), r);
      }
    }

    const finalRecipients = Array.from(uniqueMap.values());

    return {
      success: true,
      recipients: finalRecipients,
      total: finalRecipients.length,
    };
  } catch (err) {
    return { success: false, error: String(err), recipients: [] };
  }
}

export async function sendBatchEmailChunkAction(params: {
  recipientsBatch: RecipientAttendee[];
  subject: string;
  bannerTitle?: string;
  messageContent: string;
  buttonText?: string;
  buttonUrl?: string;
  includeQrCode?: boolean;
  eventId?: string;
  eventName?: string;
}) {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Unauthorized", sentCount: 0, failedCount: 0 };

  if (!hasMinimumRole(user.profile.role, "organizer")) {
    return { success: false, error: "Unauthorized: Organizer access required.", sentCount: 0, failedCount: 0 };
  }

  // If scoping to an event, check ownership or admin role
  if (params.eventId) {
    const { data: evts } = await executeSql(`
      SELECT organizer_id, created_by_user_id FROM saas_events WHERE id = ${escapeSql(params.eventId)} LIMIT 1;
    `);
    const evt = evts?.[0];
    const isOwner = evt && (evt.organizer_id === user.clerkId || evt.created_by_user_id === user.clerkId);
    if (!isOwner && !hasMinimumRole(user.profile.role, "admin")) {
      return { success: false, error: "Unauthorized: You do not have permission to send broadcasts for this event.", sentCount: 0, failedCount: 0 };
    }
  }

  const senderName = `${user.profile.full_name || "RotaSphere Team"}`.trim();
  let sentCount = 0;
  let failedCount = 0;

  for (const item of params.recipientsBatch) {
    try {
      // 1. Personalization Replacements
      const personalizedMessage = params.messageContent
        .replace(/\{\{name\}\}/gi, item.name)
        .replace(/\{\{ticket_code\}\}/gi, item.ticketCode)
        .replace(/\{\{category\}\}/gi, item.category);

      const personalizedSubject = params.subject
        .replace(/\{\{name\}\}/gi, item.name)
        .replace(/\{\{ticket_code\}\}/gi, item.ticketCode)
        .replace(/\{\{category\}\}/gi, item.category);

      const personalizedBanner = params.bannerTitle
        ? params.bannerTitle
            .replace(/\{\{name\}\}/gi, item.name)
            .replace(/\{\{ticket_code\}\}/gi, item.ticketCode)
            .replace(/\{\{category\}\}/gi, item.category)
        : undefined;

      // 2. Attachments & Inline QR Code
      const attachments: EmailAttachment[] = [];
      if (params.includeQrCode && item.qrToken) {
        try {
          const qrBuffer = await QRCode.toBuffer(item.qrToken, {
            width: 300,
            margin: 2,
            color: { dark: "#0f172a", light: "#ffffff" },
          });

          attachments.push({
            filename: `EntryBadge-${item.ticketCode}.png`,
            content: qrBuffer,
            cid: `qr-${item.ticketCode}`,
            contentType: "image/png",
          });
        } catch {}
      }

      // 3. Render HTML Body
      const html = buildStudioBroadcastEmailHtml({
        bannerTitle: personalizedBanner,
        recipientName: item.name,
        messageContent: personalizedMessage,
        categoryName: item.category,
        ticketCode: item.ticketCode,
        buttonText: params.buttonText,
        buttonUrl: params.buttonUrl,
        includeQrCode: params.includeQrCode,
        senderName,
        eventName: params.eventName || "RotaSphere",
      });

      const ok = await sendEmail({
        to: item.email,
        subject: personalizedSubject,
        html,
        attachments,
      });

      if (ok) sentCount++;
      else failedCount++;
    } catch {
      failedCount++;
    }
  }

  // Audit log broadcast dispatch
  if (sentCount > 0) {
    await logAuditAction({
      actorId: user.clerkId,
      actorRole: user.profile.role,
      actorEmail: user.email,
      action: "BULK_EMAIL_BROADCAST_SENT",
      entityType: "EVENT",
      entityId: params.eventId || "broadcast",
      newState: {
        sentCount,
        failedCount,
        subject: params.subject,
      },
    });
  }

  return { success: true, sentCount, failedCount };
}

export async function sendTestEmailAction(params: {
  subject: string;
  bannerTitle?: string;
  messageContent: string;
  buttonText?: string;
  buttonUrl?: string;
  includeQrCode?: boolean;
  eventName?: string;
}) {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Unauthorized" };

  if (!hasMinimumRole(user.profile.role, "organizer")) {
    return { success: false, error: "Unauthorized: Organizer access required." };
  }

  const testEmail = user.email;
  if (!testEmail) return { success: false, error: "No user email address found." };

  const sampleAttendee: RecipientAttendee = {
    name: `${user.profile.full_name || "Alex (Sample)"}`.trim(),
    email: testEmail,
    ticketCode: "TKT-SAMPLE-8821",
    category: "VIP Pass",
    qrToken: "SAMPLE_QR_TOKEN_8821",
  };

  const res = await sendBatchEmailChunkAction({
    recipientsBatch: [sampleAttendee],
    subject: `[TEST PREVIEW] ${params.subject}`,
    bannerTitle: params.bannerTitle,
    messageContent: params.messageContent,
    buttonText: params.buttonText,
    buttonUrl: params.buttonUrl,
    includeQrCode: params.includeQrCode,
    eventName: params.eventName,
  });

  if (res.sentCount > 0) {
    return { success: true, testEmail };
  } else {
    return { success: false, error: "Failed to dispatch test email." };
  }
}
