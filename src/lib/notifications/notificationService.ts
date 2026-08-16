import nodemailer from "nodemailer";
import { supabaseAdmin } from "@/lib/db/supabaseAdmin";
import { logger } from "@/lib/logger/logger";

function createTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT ?? "587"),
    secure: process.env.SMTP_PORT === "465",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(params: SendEmailParams): Promise<boolean> {
  try {
    const transport = createTransport();
    await transport.sendMail({
      from: `RotaSphere <${process.env.SMTP_FROM_EMAIL}>`,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text ?? params.html.replace(/<[^>]*>/g, ""),
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

export function orderConfirmationEmail({
  fullName,
  eventTitle,
  eventDate,
  eventCity,
  tickets,
  orderId,
  orderTotal,
}: {
  fullName: string;
  eventTitle: string;
  eventDate: string;
  eventCity: string;
  tickets: Array<{ code: string; qrToken: string; tierName: string }>;
  orderId: string;
  orderTotal: string;
}): string {
  const ticketRows = tickets
    .map(
      (t) => `
      <div style="border:1px solid #dddddd;border-radius:8px;padding:16px;margin-bottom:12px;">
        <p style="font-size:14px;color:#222222;margin:0 0 4px;font-weight:600;">${t.tierName}</p>
        <p style="font-size:12px;color:#6a6a6a;margin:0 0 8px;">Ticket Code: <strong>${t.code}</strong></p>
        <p style="font-size:12px;color:#6a6a6a;margin:0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/tickets/${t.qrToken}" 
             style="color:#ff385c;text-decoration:none;font-weight:500;">
            View QR Code →
          </a>
        </p>
      </div>`
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
    <body style="font-family:system-ui,-apple-system,sans-serif;background:#f7f7f7;margin:0;padding:32px 0;">
      <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #ebebeb;">
        <div style="background:#ff385c;padding:24px 32px;">
          <h1 style="color:#ffffff;font-size:22px;font-weight:700;margin:0;">RotaSphere</h1>
          <p style="color:rgba(255,255,255,0.85);font-size:14px;margin:4px 0 0;">Booking Confirmed ✓</p>
        </div>
        <div style="padding:32px;">
          <h2 style="font-size:20px;color:#222222;margin:0 0 8px;">${eventTitle}</h2>
          <p style="font-size:14px;color:#6a6a6a;margin:0 0 24px;">${eventDate} · ${eventCity}</p>
          <p style="font-size:16px;color:#222222;margin:0 0 16px;">Hi ${fullName},</p>
          <p style="font-size:14px;color:#3f3f3f;margin:0 0 24px;line-height:1.6;">
            Your registration is confirmed. Here are your tickets:
          </p>
          ${ticketRows}
          <div style="background:#f7f7f7;border-radius:8px;padding:16px;margin-top:24px;">
            <p style="font-size:12px;color:#6a6a6a;margin:0 0 4px;">Order ID</p>
            <p style="font-size:14px;color:#222222;margin:0 0 12px;font-family:monospace;">${orderId}</p>
            <p style="font-size:12px;color:#6a6a6a;margin:0 0 4px;">Total Paid</p>
            <p style="font-size:18px;color:#222222;font-weight:700;margin:0;">${orderTotal}</p>
          </div>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/tickets" 
             style="display:inline-block;margin-top:24px;background:#ff385c;color:#ffffff;text-decoration:none;padding:14px 24px;border-radius:8px;font-size:16px;font-weight:500;">
            View My Tickets
          </a>
        </div>
        <div style="padding:16px 32px;border-top:1px solid #ebebeb;">
          <p style="font-size:12px;color:#929292;margin:0;">
            © ${new Date().getFullYear()} RotaSphere · 
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/privacy" style="color:#428bff;">Privacy</a> · 
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/terms" style="color:#428bff;">Terms</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}
