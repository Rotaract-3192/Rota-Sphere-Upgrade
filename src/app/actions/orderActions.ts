"use server";

/**
 * Order & Dynamic UPI QR Checkout Server Actions
 * Architecture: Dynamic UPI QR generation with UTR verification workflow.
 * Zero dependency on third-party payment gateways; uses instant Indian UPI payments.
 * Enforces strict authorization on payment verification and capacity validation on ticket tiers.
 */

import { getCurrentUser, requireAuth, hasMinimumRole } from "@/lib/auth/getUser";
import { executeSql, escapeSql } from "@/lib/db/directDb";
import { calculateOrderFees } from "@/lib/services/feeCalculator";
import { generateSecureTicketToken } from "@/lib/services/ticketService";
import { logAuditAction } from "@/lib/services/auditService";
import { logger } from "@/lib/logger/logger";
import { revalidatePath } from "next/cache";
import { sendTicketEmailWithQR, sendBookingReceivedEmail } from "@/lib/notifications/notificationService";
import { resolveClubAndZone } from "@/lib/utils/zoneResolver";

export interface CheckoutAttendeeItem {
  ticketTierId: string;
  name: string;
  email: string;
  phone?: string;
  memberType?: string;
  clubName?: string;
  designation?: string;
  zone?: string;
  customAnswers?: Record<string, any>;
}

export interface CreateCheckoutInput {
  eventId: string;
  attendees: CheckoutAttendeeItem[];
  couponCode?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  upiTransactionId?: string;
  paymentProofUrl?: string;
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

// Ensure database schema columns exist for UPI payments & Attendee details
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
    // Drop the old status CHECK constraint that blocks PENDING_VERIFICATION / PAYMENT_REJECTED on orders
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

  try {
    // Drop the old status CHECK constraint that blocks PENDING_VERIFICATION / PAYMENT_REJECTED on tickets
    await executeSql(`
      ALTER TABLE saas_tickets
        DROP CONSTRAINT IF EXISTS saas_tickets_status_check;
      ALTER TABLE saas_tickets
        ADD CONSTRAINT saas_tickets_status_check CHECK (status IN (
          'ISSUED',
          'CONFIRMED',
          'PENDING_VERIFICATION',
          'PAYMENT_REJECTED',
          'USED',
          'CANCELLED',
          'REFUNDED',
          'REFUND_REQUESTED'
        ));
      ALTER TABLE saas_tickets ADD COLUMN IF NOT EXISTS custom_answers JSONB DEFAULT '{}'::jsonb;
      ALTER TABLE saas_tickets ADD COLUMN IF NOT EXISTS member_type VARCHAR(64);
      ALTER TABLE saas_tickets ADD COLUMN IF NOT EXISTS club_name VARCHAR(255);
      ALTER TABLE saas_tickets ADD COLUMN IF NOT EXISTS designation VARCHAR(255);
      ALTER TABLE saas_tickets ADD COLUMN IF NOT EXISTS zone VARCHAR(100);
    `);
  } catch (_) { /* ignore if constraint already updated */ }

  try {
    // Add missing columns to saas_ticket_tiers
    await executeSql(`
      ALTER TABLE saas_ticket_tiers ADD COLUMN IF NOT EXISTS max_per_order INT DEFAULT 10;
    `);
  } catch (_) { /* ignore if already exists */ }
}

export async function getEventCustomQuestionsAction(eventId: string) {
  try {
    const { data: questions } = await executeSql(`
      SELECT id, question_text, question_type, options, is_required, display_order
      FROM event_custom_questions
      WHERE event_id = ${escapeSql(eventId)}
      ORDER BY display_order ASC, created_at ASC;
    `);
    return { success: true, questions: questions || [] };
  } catch (err: any) {
    return { success: false, questions: [], error: err?.message || String(err) };
  }
}

export async function getEventTiersAction(eventId: string) {
  try {
    const { data: tiers } = await executeSql(`
      SELECT id, name, price, total_capacity, sold_count, tier_type, description, max_per_order
      FROM saas_ticket_tiers
      WHERE event_id = ${escapeSql(eventId)}
      ORDER BY price ASC, name ASC;
    `);
    return { success: true, tiers: tiers || [] };
  } catch (err: any) {
    return { success: false, tiers: [], error: err?.message || String(err) };
  }
}

export interface ValidateTiersInput {
  eventId: string;
  selectedCounts: Record<string, number>;
}

/**
 * Backend atomic server-time confirmation.
 * Directly queries PostgreSQL with NOW() to prevent phone/client clock tampering.
 */
export async function validateTicketTiersAvailabilityAction(input: ValidateTiersInput): Promise<{
  valid: boolean;
  error?: string;
  serverTime: string;
}> {
  try {
    const tierEntries = Object.entries(input.selectedCounts).filter(([_, count]) => count > 0);
    if (tierEntries.length === 0) {
      return { valid: true, serverTime: new Date().toISOString() };
    }

    const tierIds = tierEntries.map(([id]) => id);
    const formattedTierIds = tierIds.map((id) => escapeSql(id)).join(",");
    const { data: tiers, error } = await executeSql(`
      SELECT 
        id, 
        name, 
        price, 
        total_capacity, 
        sold_count, 
        sales_start, 
        sales_end, 
        is_active,
        max_per_order,
        NOW() as server_now,
        (sales_start IS NOT NULL AND NOW() < sales_start) as is_too_early,
        (sales_end IS NOT NULL AND NOW() > sales_end) as is_too_late
      FROM saas_ticket_tiers
      WHERE id IN (${formattedTierIds}) AND event_id = ${escapeSql(input.eventId)};
    `);

    if (error || !tiers || tiers.length === 0) {
      return {
        valid: false,
        error: "Unable to verify ticket tier availability with server. Please refresh.",
        serverTime: new Date().toISOString(),
      };
    }

    const serverNowStr = tiers[0]?.server_now ? new Date(tiers[0].server_now).toISOString() : new Date().toISOString();

    for (const tier of tiers) {
      if (!tier.is_active) {
        return {
          valid: false,
          error: `Pass tier "${tier.name}" is currently inactive.`,
          serverTime: serverNowStr,
        };
      }

      if (tier.is_too_early) {
        const startDt = new Date(tier.sales_start);
        return {
          valid: false,
          error: `🔒 Security Verification Failed: Sales for "${tier.name}" have not started yet according to atomic server time. Opens on ${startDt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" })}. Device clock modifications are strictly rejected.`,
          serverTime: serverNowStr,
        };
      }

      if (tier.is_too_late) {
        const endDt = new Date(tier.sales_end);
        return {
          valid: false,
          error: `🔒 Security Verification Failed: The booking window for "${tier.name}" expired on ${endDt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" })} according to atomic server time.`,
          serverTime: serverNowStr,
        };
      }

      const count = input.selectedCounts[tier.id] || 0;
      const maxAllowed = tier.max_per_order ? Number(tier.max_per_order) : 10;
      if (count > maxAllowed) {
        return {
          valid: false,
          error: `"${tier.name}" is limited to ${maxAllowed} ticket(s) per booking.`,
          serverTime: serverNowStr,
        };
      }

      const sold = Number(tier.sold_count) || 0;
      const capacity = Number(tier.total_capacity) || 0;
      if (capacity > 0 && sold + count > capacity) {
        return {
          valid: false,
          error: `Pass tier "${tier.name}" has only ${Math.max(0, capacity - sold)} seats remaining.`,
          serverTime: serverNowStr,
        };
      }
    }

    return {
      valid: true,
      serverTime: serverNowStr,
    };
  } catch (err: any) {
    return {
      valid: false,
      error: err?.message || "Server verification error. Please try again.",
      serverTime: new Date().toISOString(),
    };
  }
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
      SELECT e.id, e.title, e.city, e.organization_id, e.status, e.allow_non_rotaract, e.upi_id, e.upi_payee_name, o.custom_platform_fee_percent
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
    const formattedTierIds = tierIds.map((id) => escapeSql(id)).join(",");
    const { data: tiers } = await executeSql(`
      SELECT 
        id, name, price, total_capacity, sold_count, reserved_count, is_active, allow_non_rotaract, allowed_audience, sales_start, sales_end, max_per_order,
        NOW() as server_now,
        (sales_start IS NOT NULL AND NOW() < sales_start) as is_too_early,
        (sales_end IS NOT NULL AND NOW() > sales_end) as is_too_late
      FROM saas_ticket_tiers
      WHERE id IN (${formattedTierIds});
    `);

    if (!tiers || tiers.length === 0) {
      return { success: false, error: "Failed to load ticket pricing" };
    }

    const tierMap = new Map(tiers.map((t: any) => [t.id, t]));

    // Validate Non-Rotaract attendee eligibility
    for (const att of input.attendees) {
      const tier = tierMap.get(att.ticketTierId);
      if (att.memberType === "Non-Rotaract") {
        if (event.allow_non_rotaract === false) {
          return {
            success: false,
            error: "This event is exclusive to Rotaract & Rotary members. Non-Rotaractor registrations are closed.",
          };
        }
        if (tier && (tier.allow_non_rotaract === false || tier.allowed_audience === "ROTARACT_ONLY")) {
          return {
            success: false,
            error: `Ticket tier "${tier.name}" is restricted to Rotaract & Rotary members only.`,
          };
        }
      }
    }

    const countPerTier: Record<string, number> = {};
    for (const att of input.attendees) {
      countPerTier[att.ticketTierId] = (countPerTier[att.ticketTierId] || 0) + 1;
    }

    const now = new Date();
    let subtotal = 0;
    for (const [tId, requestedCount] of Object.entries(countPerTier)) {
      const tier = tierMap.get(tId);
      if (!tier || !tier.is_active) {
        return { success: false, error: "One or more selected ticket tiers are no longer active" };
      }

      // Single-ticket / per-order quantity restriction check
      const maxAllowed = tier.max_per_order ? Number(tier.max_per_order) : 10;
      if (requestedCount > maxAllowed) {
        return {
          success: false,
          error:
            maxAllowed === 1
              ? `You can only purchase 1 ticket for "${tier.name}". Please select only 1 ticket.`
              : `You can only purchase a maximum of ${maxAllowed} tickets for "${tier.name}".`,
        };
      }

      // If tier is restricted to 1 ticket per attendee, prevent duplicate hoarding for the same attendee email
      if (maxAllowed === 1) {
        for (const att of input.attendees) {
          if (att.ticketTierId === tId && att.email?.trim()) {
            const { data: existingUserTickets } = await executeSql(`
              SELECT id FROM saas_tickets
              WHERE ticket_tier_id = ${escapeSql(tId)}
                AND attendee_email ILIKE ${escapeSql(att.email.trim())}
                AND status NOT IN ('CANCELLED', 'REFUNDED', 'PAYMENT_REJECTED')
              LIMIT 1;
            `);
            if (existingUserTickets && existingUserTickets.length > 0) {
              return {
                success: false,
                error: `Attendee with email "${att.email.trim()}" already holds an active ticket for "${tier.name}". This pass is limited to 1 ticket per attendee.`,
              };
            }
          }
        }
      }

      // Scheduled Time Slab Release Window Check with Atomic Database NOW()
      if (tier.is_too_early || (tier.sales_start && now < new Date(tier.sales_start))) {
        const startDt = new Date(tier.sales_start);
        return {
          success: false,
          error: `🔒 Security Check Failed: Booking for "${tier.name}" has not opened yet according to atomic server time. Opens on ${startDt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" })}. Device clock changes are strictly rejected.`,
        };
      }
      if (tier.is_too_late || (tier.sales_end && now > new Date(tier.sales_end))) {
        const endDt = new Date(tier.sales_end);
        return {
          success: false,
          error: `🔒 Security Check Failed: The booking window for "${tier.name}" officially expired on ${endDt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" })}.`,
        };
      }

      // Capacity check to prevent overselling
      const sold = Number(tier.sold_count) || 0;
      const capacity = Number(tier.total_capacity) || 0;
      if (capacity > 0 && sold + requestedCount > capacity) {
        return {
          success: false,
          error: `Pass tier "${tier.name}" is sold out or does not have ${requestedCount} seats remaining.`,
        };
      }
      subtotal += (Number(tier.price) || 0) * requestedCount;
    }

    // 2.5 Duplicate UTR Prevention Check
    const cleanUtr = input.upiTransactionId?.trim();
    if (cleanUtr && cleanUtr.length >= 6) {
      const { data: existingUtr } = await executeSql(`
        SELECT id, order_number FROM saas_orders
        WHERE LOWER(TRIM(upi_transaction_id)) = ${escapeSql(cleanUtr.toLowerCase())}
          AND status IN ('PENDING_VERIFICATION', 'PAID')
        LIMIT 1;
      `);

      if (existingUtr && existingUtr.length > 0) {
        return {
          success: false,
          error: `Duplicate UTR Detected: The UTR/UPI reference "${cleanUtr}" has already been submitted for order #${existingUtr[0].order_number}. Duplicate UTR numbers cannot be re-used. Please check your UPI receipt for your unique reference number.`,
        };
      }
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

    // Validate payment proof if paid (either screenshot OR UTR reference is required)
    const hasUtr = Boolean(input.upiTransactionId?.trim());
    const hasScreenshot = Boolean(input.paymentProofUrl);
    if (!isFree && !hasUtr && !hasScreenshot) {
      return {
        success: false,
        error: "Please provide either a payment receipt screenshot or your 12-digit UPI UTR reference to confirm your booking.",
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
        upi_receipt_url,
        payment_proof_url,
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
        ${escapeSql(input.paymentProofUrl || null)},
        ${escapeSql(input.paymentProofUrl || null)},
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

      const resolvedMemberType = attendee.memberType || "Rotaract";
      const resolvedClub = attendee.clubName?.trim() || "";
      const resolvedDesignation = attendee.designation?.trim() || "";
      const resolvedZone = attendee.zone?.trim() || "";

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
          member_type,
          club_name,
          designation,
          zone,
          qr_token,
          status,
          payment_proof_url,
          custom_answers
        ) VALUES (
          ${escapeSql(ticketCode)},
          ${escapeSql(orderId)},
          ${escapeSql(input.eventId)},
          ${escapeSql(attendee.ticketTierId)},
          ${escapeSql(customerUserId)},
          ${escapeSql(attendee.name)},
          ${escapeSql(attendee.email)},
          ${escapeSql(attendee.phone)},
          ${escapeSql(resolvedMemberType)},
          ${escapeSql(resolvedClub || null)},
          ${escapeSql(resolvedDesignation || null)},
          ${escapeSql(resolvedZone || null)},
          ${escapeSql(qrToken)},
          ${escapeSql(ticketStatus)},
          ${escapeSql(input.paymentProofUrl || null)},
          ${escapeSql(JSON.stringify({
            ...(attendee.customAnswers || {}),
            member_type: resolvedMemberType,
            club_name: resolvedClub,
            designation: resolvedDesignation,
            zone: resolvedZone,
          }))}
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

    // 8. Send Ticket Email with QR attachment for confirmed free passes, or Booking Received email for paid UPI orders
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
    } else if (!isFree && customerEmail) {
      sendBookingReceivedEmail({
        to: customerEmail,
        fullName: input.attendees[0]?.name || user?.profile?.full_name || "Delegate",
        eventTitle: event.title,
        eventDate: new Date().toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }),
        eventCity: event.city || "District 3192",
        orderNumber,
        orderTotal: `₹${feeCalculation.totalPayable.toFixed(2)}`,
        upiTransactionId: input.upiTransactionId?.trim() || undefined,
        ticketCount: generatedTickets.length,
        tierNames: input.attendees.map((a) => tierMap.get(a.ticketTierId)?.name || "Pass"),
      }).catch((err) => logger.error("Async booking received email failed", { error: String(err) }));
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
 * Super Admin / Event Organizer Action to Approve or Reject a UPI Payment
 * Strictly verified: Caller must be an admin/super_admin or the owner/organizer of the event.
 */
export async function verifyOrderPaymentAction(params: {
  orderId: string;
  action: "APPROVE" | "REJECT";
  rejectionReason?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await requireAuth();

    // Verify order exists and check caller authorization against event organizer
    const { data: orderRows, error: orderFetchErr } = await executeSql(`
      SELECT o.id, o.order_number, o.total_amount, o.status as current_status, o.event_id,
             e.organizer_id, e.created_by_user_id, e.organization_id, e.title as event_title, e.city as event_city
      FROM saas_orders o
      LEFT JOIN saas_events e ON o.event_id = e.id
      WHERE o.id = ${escapeSql(params.orderId)}
      LIMIT 1;
    `);

    if (orderFetchErr || !orderRows || orderRows.length === 0) {
      return { success: false, error: "Order not found." };
    }

    const ord = orderRows[0];
    const isEventOwner = ord.organizer_id === user.clerkId || ord.created_by_user_id === user.clerkId;
    const isAdmin = hasMinimumRole(user.profile.role, "admin");
    let isOrgMember = false;

    if (!isEventOwner && !isAdmin && ord.organization_id) {
      const { data: memberRows } = await executeSql(`
        SELECT user_id FROM organization_members
        WHERE organization_id = ${escapeSql(ord.organization_id)} AND user_id = ${escapeSql(user.clerkId)}
        LIMIT 1;
      `);
      isOrgMember = !!(memberRows && memberRows.length > 0);
    }

    if (!isEventOwner && !isAdmin && !isOrgMember) {
      return { success: false, error: "Unauthorized: Only event organizers and administrators can verify payments." };
    }

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
        const { data: tktDetails } = await executeSql(`
          SELECT t.ticket_code, t.qr_token, t.attendee_email, t.attendee_name, tr.name as tier_name
          FROM saas_tickets t
          JOIN saas_ticket_tiers tr ON tr.id = t.ticket_tier_id
          WHERE t.order_id = ${escapeSql(params.orderId)};
        `);

        if (tktDetails && tktDetails.length > 0) {
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
        organizationId: ord.organization_id,
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
        organizationId: ord.organization_id,
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
  upiTransactionId?: string;
}) {
  return verifyOrderPaymentAction({
    orderId: params.orderId,
    action: "APPROVE",
  });
}

export interface ManualAttendeeInput {
  eventId: string;
  ticketTierId: string;
  name: string;
  email: string;
  phone?: string;
  memberType?: string;
  clubName?: string;
  designation?: string;
  zone?: string;
  customAnswers?: Record<string, any>;
  paymentMethod?: "OFFLINE_CASH" | "DIRECT_BANK_TRANSFER" | "VIP_COMPLIMENTARY" | "MANUAL_UPI" | string;
  amountPaid?: number;
  referenceNote?: string;
  foodPreference?: string;
  sendConfirmationEmail?: boolean;
}

/**
 * Manual Attendee Creation Action
 * Allows Organizers & Super Admins to manually issue tickets for desk spot registrations,
 * offline cash payments, direct bank transfers, or VIP passes.
 */
export async function createManualAttendeeAction(
  input: ManualAttendeeInput
): Promise<{ success: boolean; orderNumber?: string; ticketCode?: string; error?: string }> {
  try {
    const user = await requireAuth();

    // 1. Fetch Event and Verify Organizer/Admin Rights
    const { data: eventRows } = await executeSql(`
      SELECT e.id, e.title, e.city, e.venue_name, e.start_date, e.organization_id
      FROM saas_events e
      WHERE e.id = ${escapeSql(input.eventId)}
      LIMIT 1;
    `);

    const event = eventRows?.[0];
    if (!event) {
      return { success: false, error: "Event not found." };
    }

    const isSuperAdmin = user.profile.role === "super_admin" || user.profile.role === "admin";
    const isOrganizer = user.profile.role === "organizer";

    if (!isSuperAdmin && !isOrganizer) {
      return { success: false, error: "You are not authorized to create manual attendees." };
    }

    // 2. Fetch Ticket Tier
    const { data: tierRows } = await executeSql(`
      SELECT id, name, price, total_capacity, sold_count
      FROM saas_ticket_tiers
      WHERE id = ${escapeSql(input.ticketTierId)} AND event_id = ${escapeSql(input.eventId)}
      LIMIT 1;
    `);

    const tier = tierRows?.[0];
    if (!tier) {
      return { success: false, error: "Selected ticket tier was not found." };
    }

    // 3. Resolve Zone & Club
    const { clubName, zone } = resolveClubAndZone({
      clubName: input.clubName,
      customAnswers: {
        zone: input.zone,
        food_preference: input.foodPreference,
        reference_note: input.referenceNote,
      },
    });

    const amountPaid = typeof input.amountPaid === "number" ? input.amountPaid : Number(tier.price) || 0;
    const paymentMode = input.paymentMethod || (amountPaid === 0 ? "VIP_COMPLIMENTARY" : "OFFLINE_CASH");
    const orderNumber = `RS-ORD-M${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    const resolvedMemberType = input.memberType || "Rotaract";
    const resolvedDesignation = input.designation?.trim() || "";

    // 4. Insert Paid Order
    const insertOrderSql = `
      INSERT INTO saas_orders (
        order_number,
        event_id,
        organization_id,
        user_id,
        customer_name,
        customer_email,
        customer_phone,
        total_amount,
        currency,
        status,
        payment_status,
        payment_method,
        upi_transaction_id,
        metadata
      ) VALUES (
        ${escapeSql(orderNumber)},
        ${escapeSql(input.eventId)},
        ${escapeSql(event.organization_id || user.profile.home_club_id || null)},
        ${escapeSql(user.clerkId)},
        ${escapeSql(input.name.trim())},
        ${escapeSql(input.email.trim())},
        ${escapeSql(input.phone?.trim() || null)},
        ${escapeSql(amountPaid)},
        'INR',
        'PAID',
        'PAID',
        ${escapeSql(paymentMode)},
        ${escapeSql(input.referenceNote?.trim() || "Manual Spot Entry")},
        ${escapeSql(JSON.stringify({
          member_type: resolvedMemberType,
          club_name: clubName,
          designation: resolvedDesignation,
          zone,
          food_preference: input.foodPreference,
          manual_entry_by: user.email,
          manual_entry_role: user.profile.role,
        }))}
      ) RETURNING id, order_number;
    `;

    const { data: orderRes } = await executeSql(insertOrderSql);
    const orderId = orderRes?.[0]?.id;
    if (!orderId) {
      throw new Error("Failed to create order record for manual attendee");
    }

    // 5. Generate Ticket
    const ticketCode = `RS-MANUAL-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const qrToken = generateSecureTicketToken("MANUAL-" + Date.now(), input.eventId);

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
        member_type,
        club_name,
        designation,
        zone,
        qr_token,
        status,
        custom_answers
      ) VALUES (
        ${escapeSql(ticketCode)},
        ${escapeSql(orderId)},
        ${escapeSql(input.eventId)},
        ${escapeSql(tier.id)},
        ${escapeSql(user.clerkId)},
        ${escapeSql(input.name.trim())},
        ${escapeSql(input.email.trim())},
        ${escapeSql(input.phone?.trim() || null)},
        ${escapeSql(resolvedMemberType)},
        ${escapeSql(clubName || null)},
        ${escapeSql(resolvedDesignation || null)},
        ${escapeSql(zone || null)},
        ${escapeSql(qrToken)},
        'CONFIRMED',
        ${escapeSql(JSON.stringify({
          ...(input.customAnswers || {}),
          member_type: resolvedMemberType,
          club_name: clubName || input.customAnswers?.club_name,
          designation: resolvedDesignation,
          zone: zone || input.customAnswers?.zone,
          food_preference: input.foodPreference || input.customAnswers?.food_preference,
          payment_mode: paymentMode,
          reference_note: input.referenceNote || "Manual Spot Entry",
          manual_entry_by: user.email,
        }))}
      ) RETURNING id, ticket_code, qr_token;
    `;

    await executeSql(insertTicketSql);

    // 6. Update sold count on tier
    await executeSql(`
      UPDATE saas_ticket_tiers
      SET sold_count = sold_count + 1
      WHERE id = ${escapeSql(tier.id)};
    `);

    // 7. Send Ticket Email if opted in
    if (input.sendConfirmationEmail !== false && input.email) {
      try {
        const formattedDate = event.start_date
          ? new Date(event.start_date).toLocaleDateString("en-IN", {
              weekday: "short",
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : "Scheduled Event Date";

        await sendTicketEmailWithQR({
          to: input.email.trim(),
          fullName: input.name.trim(),
          eventTitle: event.title,
          eventDate: formattedDate,
          eventCity: event.venue_name || event.city || "District 3192",
          orderNumber,
          orderTotal: `₹${amountPaid.toFixed(2)} (${paymentMode.replace(/_/g, " ")})`,
          tickets: [
            {
              code: ticketCode,
              qrToken,
              tierName: tier.name,
            },
          ],
        });
      } catch (emailErr) {
        logger.warn("Could not dispatch manual ticket email", { error: String(emailErr) });
      }
    }

    // 8. Log Audit Action
    await logAuditAction({
      actorId: user.clerkId,
      actorRole: user.profile.role,
      actorEmail: user.email,
      action: "MANUAL_ATTENDEE_CREATED",
      entityType: "TICKET",
      entityId: ticketCode,
      organizationId: event.organization_id,
      newState: {
        orderNumber,
        ticketCode,
        attendeeName: input.name,
        attendeeEmail: input.email,
        clubName,
        zone,
        paymentMode,
        amountPaid,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/admin");
    revalidatePath("/tickets");

    return {
      success: true,
      orderNumber,
      ticketCode,
    };
  } catch (err: any) {
    logger.error("createManualAttendeeAction error", { error: String(err) });
    return { success: false, error: err?.message || "Failed to create manual attendee." };
  }
}
