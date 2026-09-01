import nodemailer from "nodemailer";
import QRCode from "qrcode";
import { supabaseAdmin } from "@/lib/db/supabaseAdmin";
import { logger } from "@/lib/logger/logger";

function createTransport() {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = parseInt(process.env.SMTP_PORT ?? "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    logger.warn("SMTP credentials not configured. Email will be logged to console in dev mode.");
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: user && pass ? { user, pass } : undefined,
  });
}

export interface EmailAttachment {
  filename: string;
  content: Buffer;
  cid?: string;
  contentType?: string;
}

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: EmailAttachment[];
}

export async function sendEmail(params: SendEmailParams): Promise<boolean> {
  try {
    const transport = createTransport();
    const fromAddress = process.env.SMTP_FROM_EMAIL || "no-reply@rotasphere.in";

    // If SMTP is not set up in local dev, log gracefully instead of crashing
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      logger.info(`[DEV MODE - EMAIL SIMULATION] To: ${params.to} | Subject: ${params.subject}`);
      return true;
    }

    await transport.sendMail({
      from: `RotaSphere <${fromAddress}>`,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text ?? params.html.replace(/<[^>]*>/g, ""),
      attachments: params.attachments,
    });
    return true;
  } catch (err) {
    logger.error("Email send failed", { to: params.to, error: String(err) });
    return false;
  }
}

export async function sendNotification({
  userId,
  title,
  body,
  data,
  email,
  emailSubject,
  emailHtml,
}: {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  email?: string;
  emailSubject?: string;
  emailHtml?: string;
}): Promise<void> {
  await supabaseAdmin.from("notifications").insert({
    user_id: userId,
    channel: "IN_APP",
    title,
    body,
    data: data ?? null,
    sent_at: new Date().toISOString(),
  });

  if (email && emailSubject && emailHtml) {
    await sendEmail({ to: email, subject: emailSubject, html: emailHtml });
  }
}

/**
 * Send Ticket Confirmation Email with QR Attachment and Inline Scannable QR Code
 */
export async function sendTicketEmailWithQR({
  to,
  fullName,
  eventTitle,
  eventDate,
  eventCity,
  orderNumber,
  orderTotal,
  tickets,
}: {
  to: string;
  fullName: string;
  eventTitle: string;
  eventDate: string;
  eventCity: string;
  orderNumber: string;
  orderTotal: string;
  tickets: Array<{ code: string; qrToken: string; tierName: string }>;
}): Promise<boolean> {
  const attachments: EmailAttachment[] = [];

  // Generate QR Code PNG Buffers for each ticket
  for (const t of tickets) {
    try {
      const qrBuffer = await QRCode.toBuffer(t.qrToken, {
        width: 300,
        margin: 2,
        color: {
          dark: "#0f172a",
          light: "#ffffff",
        },
      });

      attachments.push({
        filename: `Ticket-${t.code}.png`,
        content: qrBuffer,
        cid: `qr-${t.code}`, // Content ID for inline HTML email rendering
        contentType: "image/png",
      });
    } catch (err) {
      logger.error("QR Code generation for email failed", { ticketCode: t.code, error: String(err) });
    }
  }

  const ticketCardsHtml = tickets
    .map(
      (t) => `
      <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;padding:20px;margin-bottom:16px;box-shadow:0 2px 4px rgba(0,0,0,0.02);">
        <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:1px border-gray-100;padding-bottom:12px;margin-bottom:12px;">
          <div>
            <span style="font-size:11px;font-weight:700;color:#0758fc;text-transform:uppercase;letter-spacing:0.5px;display:block;margin-bottom:2px;">OFFICIAL DELEGATE PASS</span>
            <h3 style="font-size:16px;font-weight:700;color:#0f172a;margin:0;">${t.tierName}</h3>
          </div>
          <span style="font-family:monospace;font-size:12px;font-weight:700;background:#f1f5f9;color:#334155;padding:4px 8px;border-radius:6px;">${t.code}</span>
        </div>
        <div style="text-align:center;padding:12px 0;">
          <img src="cid:qr-${t.code}" alt="Ticket QR Code" style="width:180px;height:180px;border-radius:12px;border:1px solid #e2e8f0;display:inline-block;" />
          <p style="font-size:11px;color:#64748b;margin:8px 0 0;">Scan at entry gate for instant check-in</p>
        </div>
      </div>`
    )
    .join("");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://events.rotaract3192.org";

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width,initial-scale=1">
      <title>Your RotaSphere Ticket Confirmation</title>
    </head>
    <body style="font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background:#f8fafc;margin:0;padding:32px 16px;color:#0f172a;">
      <div style="max-width:580px;margin:0 auto;background:#ffffff;border-radius:24px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 10px 25px -5px rgba(0,0,0,0.05);">
        
        <!-- Header Banner -->
        <div style="background:#0758fc;padding:28px 32px;text-align:left;">
          <h1 style="color:#ffffff;font-size:24px;font-weight:900;margin:0;letter-spacing:-0.5px;">RotaSphere</h1>
          <p style="color:rgba(255,255,255,0.9);font-size:13px;font-weight:700;margin:6px 0 0;text-transform:uppercase;letter-spacing:1px;">Registration Confirmed ✓</p>
        </div>

        <!-- Body Content -->
        <div style="padding:32px;">
          <h2 style="font-size:20px;font-weight:800;color:#0f172a;margin:0 0 6px;">${eventTitle}</h2>
          <p style="font-size:14px;color:#64748b;margin:0 0 24px;font-weight:500;">📅 ${eventDate} &nbsp;·&nbsp; 📍 ${eventCity}</p>
          
          <p style="font-size:15px;color:#334155;margin:0 0 20px;line-height:1.6;">
            Hi <strong>${fullName}</strong>,<br/>
            Your digital ticket pass has been issued! Below is your entry QR code, which is also attached to this email as a PNG for offline saving.
          </p>

          ${ticketCardsHtml}

          <!-- Order Summary Box -->
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:16px;padding:20px;margin-top:24px;">
            <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
              <span style="font-size:12px;color:#64748b;font-weight:600;">Order Reference:</span>
              <span style="font-size:12px;font-family:monospace;font-weight:700;color:#0f172a;">${orderNumber}</span>
            </div>
            <div style="display:flex;justify-content:space-between;">
              <span style="font-size:12px;color:#64748b;font-weight:600;">Total Amount:</span>
              <span style="font-size:15px;font-weight:800;color:#10b981;">${orderTotal}</span>
            </div>
          </div>

          <!-- Buttons -->
          <div style="margin-top:28px;text-align:center;">
            <a href="${appUrl}/tickets" 
               style="display:inline-block;background:#0758fc;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:14px;font-size:14px;font-weight:800;box-shadow:0 4px 12px rgba(30,157,241,0.3);">
              View My Passes Dashboard →
            </a>
          </div>
        </div>

        <!-- Footer -->
        <div style="padding:20px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
          <p style="font-size:12px;color:#94a3b8;margin:0;">
            © ${new Date().getFullYear()} RotaSphere Platform · District 3192 Rotaract<br/>
            <a href="${appUrl}" style="color:#0758fc;text-decoration:none;">Visit RotaSphere</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: `🎟️ Your Entry Passes: ${eventTitle} (${orderNumber})`,
    html,
    attachments,
  });
}

/**
 * Send Booking Received & Verification Pending Email to Attendee
 * Triggered immediately upon order placement before the host organizer approves the payment.
 */
export async function sendBookingReceivedEmail({
  to,
  fullName,
  eventTitle,
  eventDate,
  eventCity,
  orderNumber,
  orderTotal,
  upiTransactionId,
  ticketCount,
  tierNames,
}: {
  to: string;
  fullName: string;
  eventTitle: string;
  eventDate: string;
  eventCity: string;
  orderNumber: string;
  orderTotal: string;
  upiTransactionId?: string;
  ticketCount: number;
  tierNames?: string[];
}): Promise<boolean> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://events.rotaract3192.org";

  const tierSummaryHtml =
    tierNames && tierNames.length > 0
      ? `<div style="margin-top:8px;font-size:12px;color:#64748b;text-align:right;">${tierNames.join(", ")}</div>`
      : "";

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width,initial-scale=1">
      <title>Booking Received — Payment Verification Pending</title>
    </head>
    <body style="font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background:#f8fafc;margin:0;padding:32px 16px;color:#0f172a;">
      <div style="max-width:580px;margin:0 auto;background:#ffffff;border-radius:24px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 10px 25px -5px rgba(0,0,0,0.05);">
        
        <!-- Header Banner -->
        <div style="background:#0758fc;padding:28px 32px;text-align:left;">
          <h1 style="color:#ffffff;font-size:24px;font-weight:900;margin:0;letter-spacing:-0.5px;">RotaSphere</h1>
          <p style="color:rgba(255,255,255,0.9);font-size:13px;font-weight:700;margin:6px 0 0;text-transform:uppercase;letter-spacing:1px;">Booking Received · Under Review ⏳</p>
        </div>

        <!-- Body Content -->
        <div style="padding:32px;">
          <h2 style="font-size:20px;font-weight:800;color:#0f172a;margin:0 0 6px;">${eventTitle}</h2>
          <p style="font-size:14px;color:#64748b;margin:0 0 24px;font-weight:500;">📅 ${eventDate} &nbsp;·&nbsp; 📍 ${eventCity}</p>
          
          <p style="font-size:15px;color:#334155;margin:0 0 20px;line-height:1.6;">
            Hi <strong>${fullName}</strong>,<br/>
            We have received your booking and payment details for <strong>${eventTitle}</strong>.
          </p>

          <!-- Review Notice Callout -->
          <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:16px;padding:18px 20px;margin-bottom:24px;">
            <div style="margin-bottom:6px;">
              <span style="display:inline-block;background:#3b82f6;color:#ffffff;font-size:11px;font-weight:800;padding:3px 8px;border-radius:6px;text-transform:uppercase;letter-spacing:0.5px;">Organizer Review</span>
            </div>
            <p style="font-size:13px;color:#1e40af;line-height:1.6;margin:0;">
              The event organizing committee is reviewing your payment screenshot and UTR transaction reference. Once verified and approved by the host, your official entry QR pass will be generated and emailed to you.
            </p>
          </div>

          <!-- Order Summary Box -->
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:16px;padding:20px;margin-top:20px;">
            <div style="display:flex;justify-content:space-between;margin-bottom:10px;">
              <span style="font-size:12px;color:#64748b;font-weight:600;">Order Reference:</span>
              <span style="font-size:12px;font-family:monospace;font-weight:700;color:#0f172a;">${orderNumber}</span>
            </div>
            ${
              upiTransactionId
                ? `<div style="display:flex;justify-content:space-between;margin-bottom:10px;">
                     <span style="font-size:12px;color:#64748b;font-weight:600;">Submitted UTR / Ref:</span>
                     <span style="font-size:12px;font-family:monospace;font-weight:700;color:#0758fc;">${upiTransactionId}</span>
                   </div>`
                : ""
            }
            <div style="display:flex;justify-content:space-between;margin-bottom:10px;">
              <span style="font-size:12px;color:#64748b;font-weight:600;">Reserved Passes:</span>
              <span style="font-size:12px;font-weight:700;color:#0f172a;">${ticketCount} Ticket${ticketCount > 1 ? "s" : ""}</span>
            </div>
            ${tierSummaryHtml}
            <div style="border-top:1px solid #e2e8f0;margin-top:12px;padding-top:12px;display:flex;justify-content:space-between;">
              <span style="font-size:12px;color:#64748b;font-weight:600;">Total Amount:</span>
              <span style="font-size:15px;font-weight:800;color:#0758fc;">${orderTotal}</span>
            </div>
          </div>

          <!-- Buttons -->
          <div style="margin-top:28px;text-align:center;">
            <a href="${appUrl}/tickets" 
               style="display:inline-block;background:#0758fc;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:14px;font-size:14px;font-weight:800;box-shadow:0 4px 12px rgba(7,88,252,0.3);">
              View My Passes Dashboard →
            </a>
          </div>
        </div>

        <!-- Footer -->
        <div style="padding:20px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
          <p style="font-size:12px;color:#94a3b8;margin:0;">
            © ${new Date().getFullYear()} RotaSphere Platform · District 3192 Rotaract<br/>
            <a href="${appUrl}" style="color:#0758fc;text-decoration:none;">Visit RotaSphere</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to,
    subject: `⏳ Booking Received: ${eventTitle} (${orderNumber}) - Verification Pending`,
    html,
  });
}

/**
 * Send Bulk Email Announcement / Event Rules Broadcast
 */
export async function sendBulkBroadcastEmail({
  recipients,
  subject,
  messageBody,
  eventTitle,
  senderName,
}: {
  recipients: string[];
  subject: string;
  messageBody: string;
  eventTitle?: string;
  senderName?: string;
}): Promise<{ sentCount: number; failedCount: number }> {
  let sentCount = 0;
  let failedCount = 0;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://events.rotaract3192.org";
  const formattedBody = messageBody.replace(/\n/g, "<br/>");

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
    <body style="font-family:system-ui,-apple-system,sans-serif;background:#f8fafc;margin:0;padding:32px 16px;color:#0f172a;">
      <div style="max-width:580px;margin:0 auto;background:#ffffff;border-radius:24px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 10px 25px -5px rgba(0,0,0,0.05);">
        
        <div style="background:#0f172a;padding:24px 32px;">
          <span style="font-size:11px;font-weight:700;color:#0758fc;text-transform:uppercase;letter-spacing:1px;">OFFICIAL ANNOUNCEMENT</span>
          <h1 style="color:#ffffff;font-size:20px;font-weight:800;margin:4px 0 0;">${eventTitle ? eventTitle : "RotaSphere Platform Notice"}</h1>
        </div>

        <div style="padding:32px;">
          <h2 style="font-size:18px;font-weight:800;color:#0f172a;margin:0 0 16px;">${subject}</h2>
          
          <div style="font-size:14px;color:#334155;line-height:1.7;background:#f8fafc;border:1px solid #e2e8f0;border-radius:16px;padding:20px;margin-bottom:24px;">
            ${formattedBody}
          </div>

          <p style="font-size:12px;color:#64748b;margin:0;">
            Sent by <strong>${senderName || "Organizing Committee"}</strong> via RotaSphere Platform.
          </p>
        </div>

        <div style="padding:20px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
          <p style="font-size:12px;color:#94a3b8;margin:0;">
            © ${new Date().getFullYear()} RotaSphere · <a href="${appUrl}" style="color:#0758fc;text-decoration:none;">events.rotaract3192.org</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  // Deduplicate emails
  const uniqueRecipients = Array.from(new Set(recipients.map((r) => r.trim().toLowerCase()))).filter(Boolean);

  for (const email of uniqueRecipients) {
    const success = await sendEmail({
      to: email,
      subject,
      html,
    });

    if (success) sentCount++;
    else failedCount++;
  }

  logger.info(`Bulk email broadcast completed`, { total: uniqueRecipients.length, sentCount, failedCount, subject });

  return { sentCount, failedCount };
}

/**
 * Build Dark-Themed Email Studio HTML Body with Placeholders & CTA Button
 */
export function buildStudioBroadcastEmailHtml({
  bannerTitle,
  recipientName,
  messageContent,
  categoryName,
  ticketCode,
  buttonText,
  buttonUrl,
  includeQrCode,
  senderName,
  eventName,
}: {
  bannerTitle?: string;
  recipientName: string;
  messageContent: string;
  categoryName?: string;
  ticketCode?: string;
  buttonText?: string;
  buttonUrl?: string;
  includeQrCode?: boolean;
  senderName?: string;
  eventName?: string;
}): string {
  const formattedParagraphs = messageContent
    .split(/\n\s*\n/)
    .map((p) => `<p style="margin:0 0 16px;line-height:1.7;color:#e2e8f0;font-size:14px;">${p.replace(/\n/g, "<br/>")}</p>`)
    .join("");

  const ctaButtonHtml =
    buttonText && buttonUrl
      ? `
    <div style="margin:28px 0;text-align:center;">
      <a href="${buttonUrl}" target="_blank" 
         style="display:inline-block;background:#ff003c;background:linear-gradient(135deg, #ff003c 0%, #d90429 100%);color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:12px;font-size:13px;font-weight:800;letter-spacing:1px;text-transform:uppercase;box-shadow:0 4px 20px rgba(255,0,60,0.4);">
        ${buttonText}
      </a>
    </div>`
      : "";

  const attendeeBoxHtml =
    ticketCode || categoryName
      ? `
    <div style="background:#09090b;border:1px solid #27272a;border-radius:14px;padding:16px 20px;margin:24px 0;">
      <table style="width:100%;border-collapse:collapse;font-size:13px;color:#a1a1aa;">
        ${
          recipientName
            ? `<tr><td style="padding:4px 0;color:#71717a;">Attendee:</td><td style="padding:4px 0;text-align:right;font-weight:700;color:#ffffff;">${recipientName}</td></tr>`
            : ""
        }
        ${
          categoryName
            ? `<tr><td style="padding:4px 0;color:#71717a;">Category:</td><td style="padding:4px 0;text-align:right;font-weight:700;color:#ffffff;">${categoryName}</td></tr>`
            : ""
        }
        ${
          ticketCode
            ? `<tr><td style="padding:4px 0;color:#71717a;">Ticket Code:</td><td style="padding:4px 0;text-align:right;font-weight:700;font-family:monospace;color:#ff003c;">${ticketCode}</td></tr>`
            : ""
        }
      </table>
    </div>`
      : "";

  const qrSectionHtml =
    includeQrCode && ticketCode
      ? `
    <div style="text-align:center;padding:16px 0;background:#09090b;border:1px solid #27272a;border-radius:14px;margin:20px 0;">
      <img src="cid:qr-${ticketCode}" alt="Ticket QR Code" style="width:160px;height:160px;border-radius:10px;border:1px solid #3f3f46;display:inline-block;" />
      <p style="font-size:11px;color:#a1a1aa;margin:8px 0 0;">Scan at entry gate for fast-track clearance</p>
    </div>`
      : "";

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width,initial-scale=1">
      <title>${bannerTitle || "Official Broadcast"}</title>
    </head>
    <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background:#000000;margin:0;padding:24px 12px;color:#f4f4f5;">
      <div style="max-width:560px;margin:0 auto;background:#121215;border-radius:20px;overflow:hidden;border:1px solid #27272a;box-shadow:0 20px 40px rgba(0,0,0,0.8);">
        
        <!-- Header Brand Bar -->
        <div style="background:#09090b;padding:24px 28px;text-align:center;border-bottom:1px solid #ff003c;">
          <h1 style="color:#ffffff;font-size:22px;font-weight:900;margin:0;letter-spacing:1px;text-transform:uppercase;">${eventName || "RotaSphere"}</h1>
          <p style="color:#a1a1aa;font-size:11px;margin:4px 0 0;letter-spacing:1px;text-transform:uppercase;">OFFICIAL BROADCAST ANNOUNCEMENT</p>
        </div>

        ${
          bannerTitle
            ? `
        <div style="background:#18181b;padding:16px 28px;border-bottom:1px solid #27272a;text-align:center;">
          <h2 style="font-size:16px;font-weight:800;color:#ffffff;margin:0;">${bannerTitle}</h2>
        </div>`
            : ""
        }

        <!-- Main Body Content -->
        <div style="padding:28px;">
          <p style="font-size:15px;font-weight:700;color:#ffffff;margin:0 0 16px;">
            Hello ${recipientName || "Delegate"},
          </p>

          ${formattedParagraphs}

          ${attendeeBoxHtml}

          ${qrSectionHtml}

          ${ctaButtonHtml}

          <div style="margin-top:28px;padding-top:16px;border-top:1px solid #27272a;">
            <p style="font-size:12px;color:#71717a;margin:0;">
              With gratitude,<br/>
              <strong style="color:#ffffff;">${senderName || "The Organizing Team"}</strong>
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="padding:16px 28px;background:#09090b;border-top:1px solid #27272a;text-align:center;">
          <p style="font-size:11px;color:#71717a;margin:0;">
            Official announcement from ${eventName || "RotaSphere"} · © ${new Date().getFullYear()} All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export interface NewEventAnnouncementParams {
  eventId: string;
  title: string;
  slug: string;
  summary?: string;
  coverImageUrl?: string;
  startDate: string;
  endDate?: string;
  venueName?: string;
  address?: string;
  city?: string;
  googleMapsUrl?: string;
  minPrice?: number;
  hostingClub?: string;
  allowNonRotaract?: boolean;
}

/**
 * Dispatches New Event Announcement emails to all registered portal users.
 * Runs completely asynchronously in background (non-blocking).
 */
export async function broadcastNewEventToAllUsersAsync(event: NewEventAnnouncementParams): Promise<void> {
  // Use setImmediate / async tick so caller server action is never blocked
  setImmediate(async () => {
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://events.rotaract3192.org";
      const eventUrl = `${appUrl}/events/${event.slug}`;

      // 1. Fetch all registered user emails
      const { executeSql } = await import("@/lib/db/directDb");
      const { data: userRows, error: userErr } = await executeSql(`
        SELECT DISTINCT email, full_name 
        FROM rotasphere_profiles 
        WHERE email IS NOT NULL AND email != ''
        LIMIT 5000;
      `);

      let emails: Array<{ email: string; name?: string }> = [];

      if (!userErr && userRows && userRows.length > 0) {
        emails = userRows.map((r: any) => ({ email: r.email.trim(), name: r.full_name || "Delegate" }));
      } else {
        // Fallback to clerk / profiles query
        const { data: fallbackProfiles } = await supabaseAdmin
          .from("rotasphere_profiles")
          .select("email, full_name")
          .not("email", "is", null);
        if (fallbackProfiles && fallbackProfiles.length > 0) {
          emails = fallbackProfiles.map((r: any) => ({ email: r.email.trim(), name: r.full_name || "Delegate" }));
        }
      }

      // Deduplicate emails
      const uniqueMap = new Map<string, string>();
      for (const item of emails) {
        if (item.email && item.email.includes("@")) {
          uniqueMap.set(item.email.toLowerCase(), item.name || "Delegate");
        }
      }

      if (uniqueMap.size === 0) {
        logger.info("[New Event Broadcast] No registered user emails found to notify.");
        return;
      }

      const formattedDate = new Date(event.startDate).toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "Asia/Kolkata",
      });

      const formattedTime = new Date(event.startDate).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZone: "Asia/Kolkata",
      });

      const formattedEndTime = event.endDate && !isNaN(new Date(event.endDate).getTime())
        ? new Date(event.endDate).toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
            timeZone: "Asia/Kolkata",
          })
        : null;

      const locationStr = [event.venueName, event.city].filter(Boolean).join(", ") || "Bengaluru & District 3192";
      const mapsLink =
        event.googleMapsUrl ||
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.address || event.venueName || event.city || locationStr)}`;

      const priceBadge = event.minPrice === 0 || event.minPrice === undefined ? "FREE ENTRY" : `₹${event.minPrice} ONWARDS`;
      const eligibilityBadge = event.allowNonRotaract === false ? "🛡️ Rotaract & Rotary Members Only" : "🌐 Open to All (Guests & Non-Rotaractors Welcome)";

      const htmlTemplate = (recipientName: string) => `
        <!DOCTYPE html>
        <html lang="en">
        <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
        <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background:#0f172a;margin:0;padding:24px 12px;color:#f8fafc;">
          <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 20px 40px rgba(0,0,0,0.2);color:#0f172a;">
            
            <!-- Top Header Banner -->
            <div style="background:#0758fc;padding:20px 28px;text-align:left;">
              <span style="background:rgba(255,255,255,0.2);color:#ffffff;font-size:10px;font-weight:900;letter-spacing:1px;text-transform:uppercase;padding:4px 10px;border-radius:8px;">
                ✨ NEW EVENT ANNOUNCED
              </span>
              <h1 style="color:#ffffff;font-size:22px;font-weight:900;margin:10px 0 0;line-height:1.3;">
                ${event.title}
              </h1>
              ${event.hostingClub ? `<p style="color:rgba(255,255,255,0.85);font-size:12px;font-weight:600;margin:4px 0 0;">Hosted by ${event.hostingClub}</p>` : ""}
            </div>

            ${
              event.coverImageUrl
                ? `<div style="position:relative;width:100%;max-height:260px;overflow:hidden;background:#0f172a;">
                     <img src="${event.coverImageUrl}" alt="${event.title}" style="width:100%;height:auto;max-height:260px;object-fit:cover;display:block;" />
                   </div>`
                : ""
            }

            <!-- Body -->
            <div style="padding:28px 28px 20px;">
              <p style="font-size:15px;color:#334155;margin:0 0 16px;line-height:1.6;">
                Hello <strong>${recipientName}</strong>, a new event has just been published on RotaSphere!
              </p>

              ${
                event.summary
                  ? `<div style="background:#f8fafc;border-left:4px solid #0758fc;border-radius:0 12px 12px 0;padding:14px 18px;margin-bottom:20px;font-size:13px;color:#475569;line-height:1.6;">
                       ${event.summary}
                     </div>`
                  : ""
              }

              <!-- Event Details Table -->
              <table style="width:100%;border-collapse:collapse;margin:16px 0;background:#f8fafc;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
                <tr>
                  <td style="padding:12px 16px;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:12px;font-weight:700;width:35%;">📅 Date & Time:</td>
                  <td style="padding:12px 16px;border-bottom:1px solid #e2e8f0;color:#0f172a;font-size:13px;font-weight:700;">${formattedDate} at ${formattedTime}${formattedEndTime ? ` – ${formattedEndTime}` : ""} IST</td>
                </tr>
                <tr>
                  <td style="padding:12px 16px;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:12px;font-weight:700;">📍 Location:</td>
                  <td style="padding:12px 16px;border-bottom:1px solid #e2e8f0;color:#0f172a;font-size:13px;font-weight:600;">
                    ${locationStr}
                    <br/>
                    <a href="${mapsLink}" target="_blank" style="color:#0758fc;font-size:11px;font-weight:700;text-decoration:none;display:inline-block;margin-top:4px;">
                      Open in Google Maps ↗
                    </a>
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 16px;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:12px;font-weight:700;">🎟️ Pass Starting:</td>
                  <td style="padding:12px 16px;border-bottom:1px solid #e2e8f0;color:#0758fc;font-size:13px;font-weight:800;">${priceBadge}</td>
                </tr>
                <tr>
                  <td style="padding:12px 16px;color:#64748b;font-size:12px;font-weight:700;">👥 Eligibility:</td>
                  <td style="padding:12px 16px;color:#0f172a;font-size:12px;font-weight:700;">${eligibilityBadge}</td>
                </tr>
              </table>

              <!-- Big Action Button -->
              <div style="margin:28px 0;text-align:center;">
                <a href="${eventUrl}" target="_blank" 
                   style="display:inline-block;background:#0758fc;color:#ffffff;text-decoration:none;padding:16px 36px;border-radius:14px;font-size:15px;font-weight:800;letter-spacing:0.5px;box-shadow:0 6px 20px rgba(7,88,252,0.35);">
                  Book Your Passes Now →
                </a>
              </div>
            </div>

            <!-- Footer -->
            <div style="padding:20px 28px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
              <p style="font-size:11px;color:#94a3b8;margin:0;line-height:1.5;">
                You are receiving this update because you are a registered member of RotaSphere · District 3192.<br/>
                <a href="${appUrl}" style="color:#0758fc;text-decoration:none;">Visit RotaSphere Portal</a> · <a href="${eventUrl}" style="color:#0758fc;text-decoration:none;">View Event Details</a>
              </p>
            </div>
          </div>
        </body>
        </html>
      `;

      let sentCount = 0;
      let failedCount = 0;

      // Send in concurrent batches of 5
      const entries = Array.from(uniqueMap.entries());
      const batchSize = 5;

      for (let i = 0; i < entries.length; i += batchSize) {
        const chunk = entries.slice(i, i + batchSize);
        await Promise.all(
          chunk.map(async ([userEmail, userName]) => {
            const ok = await sendEmail({
              to: userEmail,
              subject: `✨ New Event: ${event.title} - Register on RotaSphere`,
              html: htmlTemplate(userName),
            });
            if (ok) sentCount++;
            else failedCount++;
          })
        );
      }

      logger.info("[New Event Announcement Broadcast Completed]", {
        eventId: event.eventId,
        title: event.title,
        recipientsCount: entries.length,
        sentCount,
        failedCount,
      });
    } catch (broadcastErr) {
      logger.error("[New Event Announcement Broadcast Failed]", { error: String(broadcastErr) });
    }
  });
}

