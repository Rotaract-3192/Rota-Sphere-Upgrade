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
  content: Buffer | string;
  cid?: string;
  contentType?: string;
  contentDisposition?: "inline" | "attachment";
}

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: EmailAttachment[];
  replyTo?: string;
  headers?: Record<string, string>;
  entityRefId?: string;
}

export function generatePlainTextFromHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<br\s*[\/]?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/h[1-6]>/gi, "\n\n")
    .replace(/<\/tr>/gi, "\n")
    .replace(/<\/td>/gi, "  ")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#8377;/gi, "₹")
    .replace(/\n\s*\n\s*\n/g, "\n\n")
    .trim();
}

export async function sendEmail(params: SendEmailParams): Promise<boolean> {
  try {
    const transport = createTransport();
    const fromAddress = process.env.SMTP_FROM_EMAIL || "no-reply@rotasphere.in";
    const fromDomain = fromAddress.includes("@") ? fromAddress.split("@")[1] : "rotasphere.in";
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://events.rotaract3192.org";

    // If SMTP is not set up in local dev, log gracefully instead of crashing
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      logger.info(`[DEV MODE - EMAIL SIMULATION] To: ${params.to} | Subject: ${params.subject}`);
      return true;
    }

    const uniqueMessageId = `<order-${Date.now()}-${Math.random().toString(36).substring(2, 9)}@${fromDomain}>`;

    const standardHeaders: Record<string, string> = {
      "X-Entity-Ref-ID": params.entityRefId || `order-${Date.now()}`,
      "X-Mailer": "RotaSphere-Notification-Engine/2.0",
      "Auto-Submitted": "auto-generated",
      "X-Auto-Response-Suppress": "OOF, AutoReply",
      "List-Unsubscribe": `<${appUrl}/settings/notifications>, <mailto:support@${fromDomain}?subject=Unsubscribe>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      ...(params.headers || {}),
    };

    await transport.sendMail({
      from: `"RotaSphere Tickets" <${fromAddress}>`,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text ?? generatePlainTextFromHtml(params.html),
      attachments: params.attachments,
      replyTo: params.replyTo || process.env.SMTP_REPLY_TO || `support@${fromDomain}`,
      messageId: uniqueMessageId,
      headers: standardHeaders,
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

export interface TicketEmailItem {
  code: string;
  qrToken: string;
  tierName: string;
  attendeeName?: string;
}

/**
 * Send Ticket Confirmation Email with high-resolution QR Attachment and Inline Scannable QR Pass.
 * Bulletproof cross-client table layout, Apple Wallet ticket card aesthetics, and anti-spam optimized.
 */
export async function sendTicketEmailWithQR({
  to,
  fullName,
  eventTitle,
  eventDate,
  eventCity,
  venueName,
  orderNumber,
  orderTotal,
  tickets,
}: {
  to: string;
  fullName: string;
  eventTitle: string;
  eventDate: string;
  eventCity: string;
  venueName?: string;
  orderNumber: string;
  orderTotal: string;
  tickets: TicketEmailItem[];
}): Promise<boolean> {
  const attachments: EmailAttachment[] = [];
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://events.rotaract3192.org";
  const passUrl = `${appUrl}/tickets`;
  const locationLabel = venueName ? `${venueName}, ${eventCity}` : eventCity;

  // Generate QR Code PNG Buffers for each ticket with high error-correction
  for (const t of tickets) {
    try {
      const qrBuffer = await QRCode.toBuffer(t.qrToken, {
        width: 360,
        margin: 2,
        color: {
          dark: "#0f172a",
          light: "#ffffff",
        },
        errorCorrectionLevel: "H",
      });

      attachments.push({
        filename: `Ticket-${t.code}.png`,
        content: qrBuffer,
        cid: `qr-${t.code}`, // RFC Content ID for local inline MIME rendering without external servers
        contentType: "image/png",
        contentDisposition: "inline",
      });
    } catch (err) {
      logger.error("QR Code generation for email failed", { ticketCode: t.code, error: String(err) });
    }
  }

  // Build bulletproof HTML cards for each ticket pass
  const ticketCardsHtml = tickets
    .map((t) => {
      const attendeeLabel = t.attendeeName || fullName;
      return `
      <!-- Ticket Pass Card Component: ${t.code} -->
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#ffffff;border:1px solid #cbd5e1;border-radius:16px;overflow:hidden;margin-bottom:24px;box-shadow:0 4px 16px rgba(15,23,42,0.06);table-layout:fixed;">
        <!-- Ticket Stub Header -->
        <tr>
          <td style="background-color:#f8fafc;padding:16px 20px;border-bottom:1px solid #e2e8f0;">
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td align="left" valign="middle">
                  <span style="display:inline-block;font-size:10px;font-weight:800;color:#2563eb;background-color:#eff6ff;border:1px solid #dbeafe;padding:3px 8px;border-radius:6px;letter-spacing:1px;text-transform:uppercase;">
                    Official Delegate Pass
                  </span>
                  <div style="font-size:18px;font-weight:800;color:#0f172a;margin-top:4px;">
                    ${t.tierName}
                  </div>
                </td>
                <td align="right" valign="middle">
                  <span style="font-family:'SFMono-Regular',Consolas,'Liberation Mono',Menlo,Courier,monospace;font-size:13px;font-weight:700;background-color:#ffffff;color:#1e293b;padding:6px 12px;border-radius:8px;border:1px solid #cbd5e1;display:inline-block;letter-spacing:1px;">
                    ${t.code}
                  </span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Perforated Ticket Divider -->
        <tr>
          <td style="padding:0;background-color:#ffffff;">
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td style="border-bottom:2px dashed #e2e8f0;font-size:1px;line-height:1px;">&nbsp;</td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- QR Code Centerpiece -->
        <tr>
          <td align="center" style="background-color:#ffffff;padding:24px 20px 20px 20px;">
            <!-- Framed QR code card -->
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border:1px solid #e2e8f0;border-radius:16px;box-shadow:0 4px 12px rgba(15,23,42,0.04);margin:0 auto;">
              <tr>
                <td align="center" style="padding:14px;">
                  <img src="cid:qr-${t.code}" alt="Pass QR Code ${t.code}" width="190" height="190" border="0" style="display:block;width:190px;height:190px;border-radius:8px;" />
                </td>
              </tr>
            </table>

            <!-- Ticket Code beneath QR -->
            <div style="font-family:'SFMono-Regular',Consolas,'Liberation Mono',Menlo,Courier,monospace;font-size:15px;font-weight:800;letter-spacing:2px;color:#0f172a;margin-top:14px;">
              ${t.code}
            </div>
            <div style="font-size:12px;color:#64748b;margin-top:4px;font-weight:500;">
              Fast-track gate check-in &middot; Scan at entrance
            </div>

            <!-- Action Button -->
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin-top:16px;">
              <tr>
                <td align="center" style="background-color:#2563eb;border-radius:8px;">
                  <a href="${passUrl}" target="_blank" style="display:inline-block;padding:9px 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:12px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.3px;">
                    Open Digital Pass in Browser &rarr;
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Ticket Stub Details Grid -->
        <tr>
          <td style="background-color:#f8fafc;padding:16px 20px;border-top:1px solid #e2e8f0;">
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td width="50%" align="left" valign="top">
                  <span style="display:block;font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Attendee</span>
                  <span style="display:block;font-size:13px;font-weight:700;color:#0f172a;margin-top:2px;">${attendeeLabel}</span>
                </td>
                <td width="50%" align="right" valign="top">
                  <span style="display:block;font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">Pass Category</span>
                  <span style="display:block;font-size:13px;font-weight:700;color:#0f172a;margin-top:2px;">${t.tierName}</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>`;
    })
    .join("");

  const html = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>Ticket Confirmation: ${eventTitle}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <style type="text/css">
    body, table, td, p, a { font-family: Arial, Helvetica, sans-serif !important; }
  </style>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <!-- Hidden Preheader Preview Text -->
  <div style="display:none;font-size:1px;color:#f8fafc;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;mso-hide:all;">
    Your official pass for ${eventTitle} is confirmed. Order #${orderNumber} &bull; Scannable QR code enclosed.
    &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>

  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f1f5f9;table-layout:fixed;">
    <tr>
      <td align="center" style="padding:28px 12px 40px 12px;">
        <!-- Email Container Card (600px) -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;background-color:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 10px 30px rgba(15,23,42,0.08);border:1px solid #e2e8f0;">
          
          <!-- Sleek Top Header Bar -->
          <tr>
            <td style="background-color:#0f172a;padding:24px 32px;border-bottom:3px solid #2563eb;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="left" valign="middle">
                    <span style="color:#ffffff;font-size:22px;font-weight:900;letter-spacing:-0.5px;display:block;">RotaSphere</span>
                    <span style="color:#94a3b8;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">District 3192 Ticketing</span>
                  </td>
                  <td align="right" valign="middle">
                    <span style="display:inline-block;background-color:rgba(16,185,129,0.15);border:1px solid #10b981;color:#10b981;font-size:11px;font-weight:700;letter-spacing:0.5px;padding:5px 12px;border-radius:100px;text-transform:uppercase;">
                      Confirmed Pass
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Body -->
          <tr>
            <td style="padding:32px 32px 24px 32px;">
              <!-- Event Headline -->
              <h1 style="margin:0 0 10px 0;font-size:24px;line-height:1.3;font-weight:800;color:#0f172a;letter-spacing:-0.5px;">
                ${eventTitle}
              </h1>

              <!-- Event Details Block -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:20px;">
                <tr>
                  <td style="padding:4px 0;font-size:14px;color:#475569;font-weight:500;">
                    <strong style="color:#0f172a;">Date:</strong> ${eventDate} &nbsp;&bull;&nbsp; <strong style="color:#0f172a;">Venue:</strong> ${locationLabel}
                  </td>
                </tr>
              </table>

              <!-- Salutation -->
              <p style="font-size:15px;line-height:1.6;color:#334155;margin:0 0 24px 0;">
                Hi <strong>${fullName}</strong>,<br/>
                Your registration has been confirmed! Your official entry pass and scannable QR code are ready below. Please keep this pass ready on your mobile device when checking in at the venue.
              </p>

              <!-- Ticket Cards -->
              ${ticketCardsHtml}

              <!-- Order Summary Receipt Box -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:16px 20px;margin-bottom:24px;">
                <tr>
                  <td colspan="2" style="padding-bottom:10px;border-bottom:1px solid #e2e8f0;">
                    <span style="font-size:11px;font-weight:800;color:#475569;text-transform:uppercase;letter-spacing:1px;">
                      Order Receipt Details
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0 6px 0;font-size:13px;color:#64748b;">Order Reference</td>
                  <td align="right" style="padding:10px 0 6px 0;font-size:13px;font-family:'SFMono-Regular',Consolas,'Liberation Mono',Menlo,Courier,monospace;font-weight:700;color:#0f172a;">
                    ${orderNumber}
                  </td>
                </tr>
                <tr>
                  <td style="padding:6px 0;font-size:13px;color:#64748b;">Payment Status</td>
                  <td align="right" style="padding:6px 0;font-size:13px;font-weight:700;color:#059669;">
                    Confirmed & Issued
                  </td>
                </tr>
                <tr>
                  <td style="padding:6px 0;font-size:13px;color:#64748b;">Total Amount Paid</td>
                  <td align="right" style="padding:6px 0;font-size:16px;font-weight:800;color:#0f172a;">
                    ${orderTotal}
                  </td>
                </tr>
              </table>

              <!-- Important Entry Instructions -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f0f9ff;border:1px solid #bae6fd;border-radius:14px;padding:16px 20px;margin-bottom:28px;">
                <tr>
                  <td>
                    <div style="font-size:13px;font-weight:700;color:#0369a1;margin-bottom:6px;">Important Entry Instructions</div>
                    <div style="font-size:12px;line-height:1.6;color:#0c4a6e;">
                      &bull; <strong>Offline Access:</strong> Your QR code is attached to this email as a PNG file. Save it to your phone photos for instant offline access at the gate.<br/>
                      &bull; <strong>Gate Check-in:</strong> Please turn up your screen brightness when presenting your QR code to volunteers.<br/>
                      &bull; <strong>Identification:</strong> Carry a valid official photo ID or Rotaract membership proof if required by event organizers.
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Primary Action CTA -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin:0 auto 12px auto;">
                <tr>
                  <td align="center" style="background-color:#0f172a;border-radius:12px;box-shadow:0 4px 14px rgba(15,23,42,0.2);">
                    <a href="${appUrl}/tickets" target="_blank" style="display:inline-block;padding:14px 32px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.3px;">
                      Go to My Passes Dashboard &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer / Compliance Notice -->
          <tr>
            <td style="padding:24px 32px;background-color:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
              <p style="font-size:12px;line-height:1.6;color:#64748b;margin:0 0 10px 0;">
                <strong>RotaSphere Platform</strong> &middot; Rotaract District 3192<br/>
                District Secretariat &middot; Bengaluru, Karnataka, India<br/>
                Support: <a href="mailto:support@rotasphere.in" style="color:#2563eb;text-decoration:none;">support@rotasphere.in</a>
              </p>
              <p style="font-size:11px;line-height:1.5;color:#94a3b8;margin:0;">
                You received this transactional receipt because your email was provided during event registration for order #${orderNumber}.<br/>
                <a href="${appUrl}/tickets" style="color:#64748b;text-decoration:underline;">View Passes</a> &nbsp;&middot;&nbsp; 
                <a href="${appUrl}/privacy" style="color:#64748b;text-decoration:underline;">Privacy Policy</a> &nbsp;&middot;&nbsp; 
                <a href="${appUrl}/terms" style="color:#64748b;text-decoration:underline;">Terms</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  // Dedicated human-readable plain text counterpart to satisfy SpamAssassin MIME standards
  const textContent = `ROTASPHERE — TICKET CONFIRMATION
============================================================
Order Reference: ${orderNumber}
Event: ${eventTitle}
Date: ${eventDate}
Location: ${locationLabel}

Hi ${fullName},

Your registration has been confirmed! Your official event pass has been issued.
Your scannable entry QR code is attached to this email as a PNG image for offline saving.

------------------------------------------------------------
TICKET PASS DETAILS
------------------------------------------------------------
${tickets
  .map(
    (t, idx) =>
      `[Pass #${idx + 1}]
• Ticket Code: ${t.code}
• Pass Category: ${t.tierName}
• Attendee: ${t.attendeeName || fullName}`
  )
  .join("\n\n")}

------------------------------------------------------------
ORDER RECEIPT
------------------------------------------------------------
• Order Reference: ${orderNumber}
• Total Amount Paid: ${orderTotal}
• Status: Confirmed & Issued

ACCESS YOUR PASSES ONLINE:
${passUrl}

ENTRY INSTRUCTIONS:
1. Have your scannable QR code ready on your mobile device upon arrival.
2. You can also save the attached Ticket-*.png file to your photo library for offline access.
3. Turn up your screen brightness at the gate for fast-track scanning.
4. Keep a valid photo ID ready if required by event organizers.

============================================================
RotaSphere Platform · Rotaract District 3192
District Secretariat · Bengaluru, Karnataka, India
Support & Inquiries: support@rotasphere.in
`;

  const passSubjectCount = tickets.length > 1 ? ` (${tickets.length} Passes)` : "";
  const subject = `Ticket Confirmation: ${eventTitle}${passSubjectCount} — Order #${orderNumber}`;

  return sendEmail({
    to,
    subject,
    html,
    text: textContent,
    attachments,
    entityRefId: orderNumber,
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

  const tierSummaryText = tierNames && tierNames.length > 0 ? tierNames.join(", ") : "Delegate Pass";

  const html = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Booking Received: ${eventTitle}</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <!-- Preheader -->
  <div style="display:none;font-size:1px;color:#f8fafc;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;mso-hide:all;">
    Your booking for ${eventTitle} has been received and is pending payment verification. Order #${orderNumber}.
  </div>

  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f1f5f9;table-layout:fixed;">
    <tr>
      <td align="center" style="padding:28px 12px 40px 12px;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;background-color:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 10px 30px rgba(15,23,42,0.08);border:1px solid #e2e8f0;">
          
          <!-- Header Bar -->
          <tr>
            <td style="background-color:#0f172a;padding:24px 32px;border-bottom:3px solid #f59e0b;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="left" valign="middle">
                    <span style="color:#ffffff;font-size:22px;font-weight:900;letter-spacing:-0.5px;display:block;">RotaSphere</span>
                    <span style="color:#94a3b8;font-size:11px;font-weight:600;letter-spacing:1px;text-transform:uppercase;">District 3192 Ticketing</span>
                  </td>
                  <td align="right" valign="middle">
                    <span style="display:inline-block;background-color:rgba(245,158,11,0.15);border:1px solid #f59e0b;color:#f59e0b;font-size:11px;font-weight:700;letter-spacing:0.5px;padding:5px 12px;border-radius:100px;text-transform:uppercase;">
                      Verification Pending
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px 32px 24px 32px;">
              <h1 style="margin:0 0 10px 0;font-size:24px;line-height:1.3;font-weight:800;color:#0f172a;letter-spacing:-0.5px;">
                ${eventTitle}
              </h1>

              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:20px;">
                <tr>
                  <td style="padding:4px 0;font-size:14px;color:#475569;font-weight:500;">
                    <strong style="color:#0f172a;">Date:</strong> ${eventDate} &nbsp;&bull;&nbsp; <strong style="color:#0f172a;">Location:</strong> ${eventCity}
                  </td>
                </tr>
              </table>

              <p style="font-size:15px;line-height:1.6;color:#334155;margin:0 0 20px 0;">
                Hi <strong>${fullName}</strong>,<br/>
                We have received your registration and payment submission for <strong>${eventTitle}</strong>.
              </p>

              <!-- Notice Callout -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#eff6ff;border:1px solid #bfdbfe;border-radius:14px;padding:18px 20px;margin-bottom:24px;">
                <tr>
                  <td>
                    <span style="display:inline-block;background-color:#3b82f6;color:#ffffff;font-size:11px;font-weight:800;padding:3px 8px;border-radius:6px;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">
                      Organizer Verification
                    </span>
                    <p style="font-size:13px;color:#1e40af;line-height:1.6;margin:6px 0 0 0;">
                      The event organizing committee is currently reviewing your payment reference and transaction receipt. Once verified by the host, your official entry QR pass will be issued and emailed to you immediately.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Order Summary Receipt Box -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:16px 20px;margin-bottom:24px;">
                <tr>
                  <td colspan="2" style="padding-bottom:10px;border-bottom:1px solid #e2e8f0;">
                    <span style="font-size:11px;font-weight:800;color:#475569;text-transform:uppercase;letter-spacing:1px;">
                      Registration Summary
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0 6px 0;font-size:13px;color:#64748b;">Order Reference</td>
                  <td align="right" style="padding:10px 0 6px 0;font-size:13px;font-family:'SFMono-Regular',Consolas,'Liberation Mono',Menlo,Courier,monospace;font-weight:700;color:#0f172a;">
                    ${orderNumber}
                  </td>
                </tr>
                ${
                  upiTransactionId
                    ? `<tr>
                        <td style="padding:6px 0;font-size:13px;color:#64748b;">Submitted UTR / Ref</td>
                        <td align="right" style="padding:6px 0;font-size:13px;font-family:'SFMono-Regular',Consolas,'Liberation Mono',Menlo,Courier,monospace;font-weight:700;color:#2563eb;">
                          ${upiTransactionId}
                        </td>
                      </tr>`
                    : ""
                }
                <tr>
                  <td style="padding:6px 0;font-size:13px;color:#64748b;">Reserved Passes</td>
                  <td align="right" style="padding:6px 0;font-size:13px;font-weight:700;color:#0f172a;">
                    ${ticketCount} Pass${ticketCount > 1 ? "es" : ""} (${tierSummaryText})
                  </td>
                </tr>
                <tr>
                  <td style="padding:6px 0;font-size:13px;color:#64748b;">Total Amount</td>
                  <td align="right" style="padding:6px 0;font-size:16px;font-weight:800;color:#0f172a;">
                    ${orderTotal}
                  </td>
                </tr>
              </table>

              <!-- Primary Action CTA -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin:0 auto 12px auto;">
                <tr>
                  <td align="center" style="background-color:#0f172a;border-radius:12px;box-shadow:0 4px 14px rgba(15,23,42,0.2);">
                    <a href="${appUrl}/tickets" target="_blank" style="display:inline-block;padding:14px 32px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.3px;">
                      View Passes Status &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 32px;background-color:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
              <p style="font-size:12px;line-height:1.6;color:#64748b;margin:0 0 10px 0;">
                <strong>RotaSphere Platform</strong> &middot; Rotaract District 3192<br/>
                District Secretariat &middot; Bengaluru, Karnataka, India<br/>
                Support: <a href="mailto:support@rotasphere.in" style="color:#2563eb;text-decoration:none;">support@rotasphere.in</a>
              </p>
              <p style="font-size:11px;line-height:1.5;color:#94a3b8;margin:0;">
                You received this notice because an order was submitted for ${eventTitle}.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `ROTASPHERE — BOOKING RECEIVED
============================================================
Event: ${eventTitle}
Order Reference: ${orderNumber}
Date: ${eventDate}
Location: ${eventCity}

Hi ${fullName},

We have received your registration for ${eventTitle}.
The organizing committee is reviewing your payment submission. Once approved, your official entry QR pass will be emailed to you.

SUMMARY:
• Order Reference: ${orderNumber}
• Reserved Passes: ${ticketCount} (${tierSummaryText})
• Total Amount: ${orderTotal}
${upiTransactionId ? `• Submitted UTR Reference: ${upiTransactionId}\n` : ""}
Track your passes: ${appUrl}/tickets

============================================================
RotaSphere Platform · Rotaract District 3192
Support: support@rotasphere.in
`;

  return sendEmail({
    to,
    subject: `Booking Received: ${eventTitle} — Order #${orderNumber}`,
    html,
    text,
    entityRefId: orderNumber,
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

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://events.rotaract3192.org";

  const qrSectionHtml =
    includeQrCode && ticketCode
      ? `
    <div style="text-align:center;padding:16px 0;background:#09090b;border:1px solid #27272a;border-radius:14px;margin:20px 0;">
      <a href="${appUrl}/tickets" target="_blank" style="text-decoration:none;display:inline-block;">
        <img src="cid:qr-${ticketCode}" alt="Ticket QR Code (${ticketCode})" width="160" height="160" style="width:160px;height:160px;border-radius:10px;border:1px solid #3f3f46;display:inline-block;" />
      </a>
      <p style="font-size:11px;color:#a1a1aa;margin:8px 0 0;">Scan at entry gate for fast-track clearance</p>
      <div style="margin-top:12px;">
        <a href="${appUrl}/tickets" target="_blank" style="display:inline-block;background:#ff003c;color:#ffffff;text-decoration:none;padding:7px 16px;border-radius:8px;font-size:11px;font-weight:800;letter-spacing:0.5px;">
          Open Digital QR Pass &rarr;
        </a>
      </div>
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
        emails = userRows.map((r: { email: string; full_name?: string | null }) => ({ email: r.email.trim(), name: r.full_name || "Delegate" }));
      } else {
        // Fallback to clerk / profiles query
        const { data: fallbackProfiles } = await supabaseAdmin
          .from("rotasphere_profiles")
          .select("email, full_name")
          .not("email", "is", null);
        if (fallbackProfiles && fallbackProfiles.length > 0) {
          emails = fallbackProfiles.map((r: { email: string; full_name?: string | null }) => ({ email: r.email.trim(), name: r.full_name || "Delegate" }));
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

