"use server";

/**
 * Order & Dynamic UPI QR Checkout Server Actions
 * Architecture: Dynamic UPI QR generation with UTR verification workflow.
 * Zero dependency on third-party payment gateways; uses instant Indian UPI payments.
 */

import { getCurrentUser, requireAuth } from "@/lib/auth/getUser";
import { executeSql } from "@/lib/db/directDb";
import { calculateOrderFees } from "@/lib/services/feeCalculator";
import { generateSecureTicketToken } from "@/lib/services/ticketService";
import { logAuditAction } from "@/lib/services/auditService";
import { logger } from "@/lib/logger/logger";
import { revalidatePath } from "next/cache";
import { sendTicketEmailWithQR } from "@/lib/notifications/notificationService";

export interface CheckoutAttendeeItem {
  ticketTierId: string;
  name: string;
  email: string;
  phone?: string;
}

export interface CreateCheckoutInput {
  eventId: string;
  attendees: CheckoutAttendeeItem[];
  couponCode?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  upiTransactionId?: string;
  idempotencyKey?: string;
  customAnswers?: Record<string, any>;
}

export interface SelectedTierInput {
  tierId: string;
  quantity: number;
}

export interface LegacyCreateOrderInput {
  eventId: string;
  selectedTiers: SelectedTierInput[];
  couponCode?: string;
  customAnswers?: Record<string, any>;
  paymentMethod?: "online" | "upi_qr" | "free";
  upiTransactionId?: string;
}

function escapeSql(str: any): string {
  if (str === null || str === undefined) return "NULL";
  if (typeof str === "number" || typeof str === "boolean") return String(str);
  return `'${String(str).replace(/'/g, "''")}'`;
}

// Ensure database schema columns exist for UPI payments
async function ensureUpiColumns() {
  try {
    // Add missing UPI columns to saas_events
    await executeSql(`
      ALTER TABLE saas_events ADD COLUMN IF NOT EXISTS upi_id VARCHAR(255);
      ALTER TABLE saas_events ADD COLUMN IF NOT EXISTS upi_payee_name VARCHAR(255);
    `);
  } catch (_) { /* ignore if already exists */ }

  try {
    // Add missing UPI columns to saas_orders
    await executeSql(`
      ALTER TABLE saas_orders ADD COLUMN IF NOT EXISTS upi_transaction_id VARCHAR(128);
      ALTER TABLE saas_orders ADD COLUMN IF NOT EXISTS upi_payee_id VARCHAR(255);
      ALTER TABLE saas_orders ADD COLUMN IF NOT EXISTS upi_receipt_url TEXT;
      ALTER TABLE saas_orders ADD COLUMN IF NOT EXISTS payment_rejection_reason TEXT;
      ALTER TABLE saas_orders ADD COLUMN IF NOT EXISTS verified_by_user_id VARCHAR(128);
      ALTER TABLE saas_orders ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
    `);
  } catch (_) { /* ignore if already exists */ }

  try {
    // Drop the old status CHECK constraint that blocks PENDING_VERIFICATION / PAYMENT_REJECTED
    await executeSql(`
      ALTER TABLE saas_orders
        DROP CONSTRAINT IF EXISTS saas_orders_status_check;
      ALTER TABLE saas_orders
        ADD CONSTRAINT saas_orders_status_check CHECK (status IN (
          'PENDING',
          'PENDING_VERIFICATION',
          'PAID',
          'FAILED',
          'CANCELLED',
          'PAYMENT_REJECTED',
          'PARTIALLY_REFUNDED',
          'REFUNDED'
        ));
    `);
  } catch (_) { /* ignore if constraint already updated */ }
}


export async function createCheckoutOrderAction(input: CreateCheckoutInput) {
  try {
    await ensureUpiColumns();

    const user = await getCurrentUser();
    
    // Strict requirement: users MUST be logged in to purchase tickets
    if (!user?.clerkId) {
      return {
        success: false,
        error: "Authentication required: Please sign in or create an account to purchase tickets.",
      };
    }

    const customerUserId = user.clerkId;
    const customerEmail = input.customerEmail?.trim() || user.email;
    const customerName = input.customerName?.trim() || user.profile?.full_name || "Attendee";

    if (!customerEmail) {
      return { success: false, error: "Customer email is required for ticket delivery" };
    }

    if (!input.attendees || input.attendees.length === 0) {
      return { success: false, error: "At least one ticket must be selected" };
    }

    // 1. Fetch Event and Organization
    const { data: eventRows } = await executeSql(`
      SELECT e.id, e.title, e.organization_id, e.status, e.upi_id, e.upi_payee_name, o.custom_platform_fee_percent
      FROM saas_events e
      LEFT JOIN organizations o ON e.organization_id = o.id
      WHERE e.id = ${escapeSql(input.eventId)}
      LIMIT 1;
    `);

    const event = eventRows?.[0];
    if (!event) {
      return { success: false, error: "Event not found" };
    }

    if (event.status !== "PUBLISHED") {
      return { success: false, error: `Event is currently in ${event.status} status` };
    }

    // 2. Fetch all requested ticket tiers
    const tierIds = Array.from(new Set(input.attendees.map((a) => a.ticketTierId)));
    const formattedTierIds = tierIds.map((id) => `'${id}'`).join(",");
    const { data: tiers } = await executeSql(`
      SELECT id, name, price, total_capacity, sold_count, reserved_count, is_active
      FROM saas_ticket_tiers
      WHERE id IN (${formattedTierIds});
    `);

    if (!tiers || tiers.length === 0) {
      return { success: false, error: "Failed to load ticket pricing" };
    }

    const tierMap = new Map(tiers.map((t: any) => [t.id, t]));

    const countPerTier: Record<string, number> = {};
    for (const att of input.attendees) {
      countPerTier[att.ticketTierId] = (countPerTier[att.ticketTierId] || 0) + 1;
    }

    let subtotal = 0;
    for (const [tId, requestedCount] of Object.entries(countPerTier)) {
      const tier = tierMap.get(tId);
      if (!tier || !tier.is_active) {
        return { success: false, error: "One or more selected ticket tiers are no longer active" };
      }
      subtotal += Number(tier.price) * requestedCount;
    }

    // 3. Apply Coupon if provided
    let discountAmount = 0;
    let validCouponId: string | null = null;

    if (input.couponCode) {
      const { data: couponRows } = await executeSql(`
        SELECT * FROM saas_coupons
        WHERE code = ${escapeSql(input.couponCode.toUpperCase().trim())}
          AND is_active = true
          AND (event_id = ${escapeSql(input.eventId)} OR event_id IS NULL)
          AND (start_date IS NULL OR start_date <= NOW())
          AND (end_date IS NULL OR end_date >= NOW())
        LIMIT 1;
      `);

      const coupon = couponRows?.[0];
      if (coupon) {
        validCouponId = coupon.id;
        if (coupon.discount_type === "PERCENTAGE") {
          discountAmount = (subtotal * Number(coupon.discount_value)) / 100;
          if (coupon.max_discount_amount) {
            discountAmount = Math.min(discountAmount, Number(coupon.max_discount_amount));
          }
        } else {
          discountAmount = Number(coupon.discount_value);
        }
      }
    }

    // 4. Calculate Fee Breakdown
    const feeCalculation = calculateOrderFees({
      subtotal,
      couponDiscountAmount: discountAmount,
      customPlatformFeePercent: event.custom_platform_fee_percent,
    });

    const isFree = feeCalculation.totalPayable === 0;

    // Validate UTR if paid
    if (!isFree && !input.upiTransactionId?.trim()) {
      return {
        success: false,
        error: "Please enter your 12-digit UPI Transaction / UTR Reference ID after payment.",
      };
    }

    const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const orderStatus = isFree ? "PAID" : "PENDING_VERIFICATION";
    const ticketStatus = isFree ? "CONFIRMED" : "PENDING_VERIFICATION";
    const paymentGateway = isFree ? "FREE" : "UPI_QR";
    const targetUpiId = event.upi_id || "rotaractdistrict3192@okaxis";

    // 5. Insert Order
    const insertOrderSql = `
      INSERT INTO saas_orders (
        order_number,
        event_id,
        organization_id,
        customer_user_id,
        customer_name,
        customer_email,
        customer_phone,
        subtotal_amount,
        discount_amount,
        platform_fee,
        convenience_fee,
        tax_amount,
        total_amount,
        currency,
        coupon_code,
        coupon_id,
        status,
        payment_gateway,
        upi_transaction_id,
        upi_payee_id,
        idempotency_key
      ) VALUES (
        ${escapeSql(orderNumber)},
        ${escapeSql(input.eventId)},
        ${escapeSql(event.organization_id)},
        ${escapeSql(customerUserId)},
        ${escapeSql(customerName)},
        ${escapeSql(customerEmail)},
        ${escapeSql(input.customerPhone)},
        ${feeCalculation.subtotal},
        ${feeCalculation.discount},
        ${feeCalculation.platformFee},
        ${feeCalculation.convenienceFee},
        ${feeCalculation.tax},
        ${feeCalculation.totalPayable},
        'INR',
        ${escapeSql(input.couponCode)},
        ${validCouponId ? escapeSql(validCouponId) : "NULL"},
        ${escapeSql(orderStatus)},
        ${escapeSql(paymentGateway)},
        ${escapeSql(input.upiTransactionId?.trim() || null)},
        ${escapeSql(targetUpiId)},
        ${escapeSql(input.idempotencyKey)}
      )
      RETURNING id, order_number, total_amount;
    `;

    const { data: orderCreated, error: orderError } = await executeSql(insertOrderSql);
    if (!orderCreated || orderCreated.length === 0) {
      logger.error("Order INSERT returned no rows", { sql: insertOrderSql, error: orderError });
      return { success: false, error: `Failed to create order record${orderError ? `: ${orderError}` : ""}` };
    }

    const orderId = orderCreated[0].id;

    // 6. Generate Tickets
    const generatedTickets = [];
    for (let i = 0; i < input.attendees.length; i++) {
      const attendee = input.attendees[i];
      const ticketCode = `TKT-${orderNumber.slice(-6)}-${i + 1}`;
      const qrToken = generateSecureTicketToken(ticketCode, input.eventId);

      const insertTicketSql = `
        INSERT INTO saas_tickets (
          ticket_code,
          order_id,
          event_id,
          ticket_tier_id,
          owner_user_id,
          attendee_name,
          attendee_email,
          attendee_phone,
          qr_token,
          status
        ) VALUES (
          ${escapeSql(ticketCode)},
          ${escapeSql(orderId)},
          ${escapeSql(input.eventId)},
          ${escapeSql(attendee.ticketTierId)},
          ${escapeSql(customerUserId)},
          ${escapeSql(attendee.name)},
          ${escapeSql(attendee.email)},
          ${escapeSql(attendee.phone)},
          ${escapeSql(qrToken)},
          ${escapeSql(ticketStatus)}
        )
        RETURNING id, ticket_code, qr_token;
      `;

      const { data: ticketRes } = await executeSql(insertTicketSql);
      if (ticketRes && ticketRes.length > 0) {
        generatedTickets.push(ticketRes[0]);
      }

      // Update sold count
      await executeSql(`
        UPDATE saas_ticket_tiers
        SET sold_count = sold_count + 1
        WHERE id = ${escapeSql(attendee.ticketTierId)};
      `);
    }

    // 7. Audit Log
    await logAuditAction({
      actorId: customerUserId,
      actorRole: user?.profile?.role || "attendee",
      actorEmail: customerEmail,
      action: isFree ? "ORDER_COMPLETED_FREE" : "ORDER_UPI_PAYMENT_SUBMITTED",
      entityType: "ORDER",
      entityId: orderId,
      organizationId: event.organization_id,
      newState: {
        orderNumber,
        total: feeCalculation.totalPayable,
        upiTransactionId: input.upiTransactionId,
        ticketsCount: generatedTickets.length,
        status: orderStatus,
      },
    });

    // 8. Send Ticket Email with QR attachment for confirmed free passes
    if (isFree && customerEmail) {
      sendTicketEmailWithQR({
        to: customerEmail,
        fullName: input.attendees[0]?.name || user?.profile?.full_name || "Delegate",
        eventTitle: event.title,
        eventDate: new Date().toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }),
        eventCity: event.city || "District 3192",
        orderNumber,
        orderTotal: "₹0.00 (Free Pass)",
        tickets: generatedTickets.map((t, idx) => ({
          code: t.ticket_code,
          qrToken: t.qr_token,
          tierName: tierMap.get(input.attendees[idx]?.ticketTierId)?.name || "Delegate Pass",
        })),
      }).catch((err) => logger.error("Async ticket email failed", { error: String(err) }));
    }

    revalidatePath("/tickets");
    revalidatePath("/admin");
    revalidatePath("/dashboard");

    return {
      success: true,
      orderId,
      orderNumber,
      totalAmount: feeCalculation.totalPayable,
      isFree,
      status: orderStatus,
      tickets: generatedTickets,
    };
  } catch (err: any) {
    logger.error("createCheckoutOrderAction failed", { error: String(err) });
    return { success: false, error: err?.message || "Checkout failed" };
  }
}

export async function createOrderAction(
  arg1: string | LegacyCreateOrderInput,
  selectedTiers?: SelectedTierInput[],
  couponCode?: string,
  customAnswers?: Record<string, any>
) {
  if (typeof arg1 === "object") {
    const attendees: CheckoutAttendeeItem[] = [];
    for (const item of arg1.selectedTiers || []) {
      for (let i = 0; i < item.quantity; i++) {
        attendees.push({
          ticketTierId: item.tierId,
          name: "Attendee",
          email: "attendee@rotaract.org",
        });
      }
    }
    return createCheckoutOrderAction({
      eventId: arg1.eventId,
      attendees,
      couponCode: arg1.couponCode,
      customAnswers: arg1.customAnswers,
      upiTransactionId: arg1.upiTransactionId,
    });
  } else {
    const attendees: CheckoutAttendeeItem[] = [];
    for (const item of selectedTiers || []) {
      for (let i = 0; i < item.quantity; i++) {
        attendees.push({
          ticketTierId: item.tierId,
          name: "Attendee",
          email: "attendee@rotaract.org",
        });
      }
    }
    return createCheckoutOrderAction({
      eventId: arg1,
      attendees,
      couponCode,
      customAnswers,
    });
  }
}

/**
 * Super Admin / Organizer Action to Approve or Reject a UPI Payment
 */
export async function verifyOrderPaymentAction(params: {
  orderId: string;
  action: "APPROVE" | "REJECT";
  rejectionReason?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireAuth();

    if (params.action === "APPROVE") {
      // 1. Mark order as PAID
      await executeSql(`
        UPDATE saas_orders
        SET
          status = 'PAID',
          verified_by_user_id = ${escapeSql(user.clerkId)},
          verified_at = NOW(),
          updated_at = NOW()
        WHERE id = ${escapeSql(params.orderId)};
      `);

      // 2. Mark tickets as CONFIRMED
      await executeSql(`
        UPDATE saas_tickets
        SET
          status = 'CONFIRMED',
          updated_at = NOW()
        WHERE order_id = ${escapeSql(params.orderId)};
      `);

      // 3. Dispatch email notification with QR attachment to attendee
      try {
        const { data: ordDetails } = await executeSql(`
          SELECT o.order_number, o.total_amount, e.title as event_title, e.city as event_city
          FROM saas_orders o
          JOIN saas_events e ON e.id = o.event_id
          WHERE o.id = ${escapeSql(params.orderId)};
        `);

        const { data: tktDetails } = await executeSql(`
          SELECT t.ticket_code, t.qr_token, t.attendee_email, t.attendee_name, tr.name as tier_name
          FROM saas_tickets t
          JOIN saas_ticket_tiers tr ON tr.id = t.ticket_tier_id
          WHERE t.order_id = ${escapeSql(params.orderId)};
        `);

        if (ordDetails && ordDetails.length > 0 && tktDetails && tktDetails.length > 0) {
          const ord = ordDetails[0];
          const primaryEmail = tktDetails[0].attendee_email;
          const primaryName = tktDetails[0].attendee_name || "Delegate";

          if (primaryEmail) {
            sendTicketEmailWithQR({
              to: primaryEmail,
              fullName: primaryName,
              eventTitle: ord.event_title || "Rotaract Event",
              eventDate: new Date().toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }),
              eventCity: ord.event_city || "District 3192",
              orderNumber: ord.order_number,
              orderTotal: `₹${Number(ord.total_amount || 0).toFixed(2)}`,
              tickets: tktDetails.map((t: { ticket_code: string; qr_token: string; tier_name: string }) => ({
                code: t.ticket_code,
                qrToken: t.qr_token,
                tierName: t.tier_name || "Pass",
              })),
            }).catch((err) => logger.error("Approval ticket email dispatch failed", { error: String(err) }));
          }
        }
      } catch (err) {
        logger.error("Error fetching details for approval email", { error: String(err) });
      }

      await logAuditAction({
        actorId: user.clerkId,
        actorRole: user.profile.role,
        actorEmail: user.email,
        action: "UPI_PAYMENT_APPROVED",
        entityType: "ORDER",
        entityId: params.orderId,
        newState: { status: "PAID" },
      });
    } else {
      // REJECT
      const reason = params.rejectionReason?.trim() || "Payment could not be verified";

      // 1. Mark order as REJECTED
      await executeSql(`
        UPDATE saas_orders
        SET
          status = 'PAYMENT_REJECTED',
          payment_rejection_reason = ${escapeSql(reason)},
          verified_by_user_id = ${escapeSql(user.clerkId)},
          verified_at = NOW(),
          updated_at = NOW()
        WHERE id = ${escapeSql(params.orderId)};
      `);

      // 2. Mark tickets as REJECTED
      await executeSql(`
        UPDATE saas_tickets
        SET
          status = 'PAYMENT_REJECTED',
          updated_at = NOW()
        WHERE order_id = ${escapeSql(params.orderId)};
      `);

      // 3. Rollback sold_count for the tiers
      const { data: tickets } = await executeSql(`
        SELECT ticket_tier_id FROM saas_tickets
        WHERE order_id = ${escapeSql(params.orderId)};
      `);

      if (tickets && tickets.length > 0) {
        for (const t of tickets) {
          await executeSql(`
            UPDATE saas_ticket_tiers
            SET sold_count = GREATEST(0, sold_count - 1)
            WHERE id = ${escapeSql(t.ticket_tier_id)};
          `);
        }
      }

      await logAuditAction({
        actorId: user.clerkId,
        actorRole: user.profile.role,
        actorEmail: user.email,
        action: "UPI_PAYMENT_REJECTED",
        entityType: "ORDER",
        entityId: params.orderId,
        newState: { status: "PAYMENT_REJECTED", reason },
      });
    }

    revalidatePath("/admin");
    revalidatePath("/dashboard");
    revalidatePath("/tickets");
    return { success: true };
  } catch (err: any) {
    logger.error("verifyOrderPaymentAction failed", { error: String(err) });
    return { success: false, error: err?.message || "Failed to verify payment" };
  }
}

export async function confirmOrderPaymentAction(params: {
  orderId: string;
  paymentId?: string;
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  razorpaySignature?: string;
}) {
  return verifyOrderPaymentAction({
    orderId: params.orderId,
    action: "APPROVE",
  });
}
