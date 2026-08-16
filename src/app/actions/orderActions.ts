"use server";

/**
 * Order & Checkout Server Actions
 * Idempotent order processing, coupon redemption, and ticket issuance.
 * Uses high-performance directDb client.
 */

import { getCurrentUser } from "@/lib/auth/getUser";
import { executeSql } from "@/lib/db/directDb";
import { calculateOrderFees } from "@/lib/services/feeCalculator";
import { generateSecureTicketToken } from "@/lib/services/ticketService";
import { logAuditAction } from "@/lib/services/auditService";
import { logger } from "@/lib/logger/logger";
import { revalidatePath } from "next/cache";

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
  customAnswers?: Record<string, any>;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  idempotencyKey?: string;
}

export interface SelectedTierInput {
  tierId: string;
  quantity: number;
}

export interface LegacyCreateOrderInput {
  eventId: string;
  selectedTiers: SelectedTierInput[];
  paymentMethod?: string;
  couponCode?: string;
  customAnswers?: Record<string, any>;
}

function escapeSql(str: string | null | undefined): string {
  if (str === null || str === undefined) return "NULL";
  return `'${String(str).replace(/'/g, "''")}'`;
}

export async function createCheckoutOrderAction(input: CreateCheckoutInput) {
  try {
    const user = await getCurrentUser();
    const customerUserId = user?.clerkId ?? `guest-${Date.now()}`;
    const customerEmail = user?.email ?? input.customerEmail;
    const customerName = user?.profile?.full_name ?? input.customerName ?? "Attendee";

    if (!customerEmail) {
      return { success: false, error: "Customer email is required for ticket delivery" };
    }

    if (!input.attendees || input.attendees.length === 0) {
      return { success: false, error: "At least one ticket must be selected" };
    }

    // 1. Fetch Event and Organization
    const { data: eventRows } = await executeSql(`
      SELECT e.id, e.title, e.organization_id, e.status, o.custom_platform_fee_percent
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

    const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

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
        'PAID',
        'RAZORPAY',
        ${escapeSql(input.idempotencyKey)}
      )
      RETURNING id, order_number, total_amount;
    `;

    const { data: orderCreated } = await executeSql(insertOrderSql);
    if (!orderCreated || orderCreated.length === 0) {
      return { success: false, error: "Failed to create order record" };
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
          'CONFIRMED'
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
      action: "ORDER_COMPLETED",
      entityType: "ORDER",
      entityId: orderId,
      organizationId: event.organization_id,
      newState: { orderNumber, total: feeCalculation.totalPayable, ticketsCount: generatedTickets.length },
    });

    revalidatePath("/tickets");
    revalidatePath("/dashboard");

    return {
      success: true,
      orderId,
      orderNumber,
      totalAmount: feeCalculation.totalPayable,
      isFree: feeCalculation.totalPayable === 0,
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
          email: "guest@example.com",
        });
      }
    }
    return createCheckoutOrderAction({
      eventId: arg1.eventId,
      attendees,
      couponCode: arg1.couponCode,
      customAnswers: arg1.customAnswers,
    });
  } else {
    const attendees: CheckoutAttendeeItem[] = [];
    for (const item of selectedTiers || []) {
      for (let i = 0; i < item.quantity; i++) {
        attendees.push({
          ticketTierId: item.tierId,
          name: "Attendee",
          email: "guest@example.com",
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

export async function confirmOrderPaymentAction(orderId: string, paymentId: string) {
  try {
    await executeSql(`
      UPDATE saas_orders
      SET status = 'PAID', gateway_payment_id = ${escapeSql(paymentId)}, updated_at = NOW()
      WHERE id = ${escapeSql(orderId)};
    `);
    revalidatePath("/tickets");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}
