import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/db/supabaseAdmin";
import { verifyRazorpayWebhook } from "@/lib/payments/razorpay";
import { convertReservation, releaseReservation } from "@/lib/inventory/inventoryService";
import { issueTickets } from "@/lib/tickets/ticketService";
import { logger } from "@/lib/logger/logger";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("x-razorpay-signature") ?? "";

  if (!verifyRazorpayWebhook(body, signature)) {
    logger.warn("Razorpay webhook signature verification failed");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: { event: string; payload: Record<string, unknown> };
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventType = event.event;
  const payload = event.payload;

  const paymentEntity = (payload?.payment as Record<string, unknown>)?.entity as Record<string, unknown> | undefined;
  const refundEntity = (payload?.refund as Record<string, unknown>)?.entity as Record<string, unknown> | undefined;

  const providerEventId =
    (paymentEntity?.id as string) ||
    (refundEntity?.id as string) ||
    `${eventType}-${Date.now()}`;

  const { data: existing } = await supabaseAdmin
    .from("webhook_events")
    .select("id, status")
    .eq("provider", "razorpay")
    .eq("provider_event_id", providerEventId)
    .single();

  const existingEvent = existing as { id: string; status: string } | null;

  if (existingEvent?.status === "PROCESSED") {
    logger.info("Duplicate webhook event — already processed", { providerEventId, eventType });
    return NextResponse.json({ received: true });
  }

  await supabaseAdmin.from("webhook_events").upsert({
    provider: "razorpay",
    provider_event_id: providerEventId,
    event_type: eventType,
    payload: event as Record<string, unknown>,
    status: "RECEIVED",
  });

  logger.info("Razorpay webhook received", { eventType, providerEventId });

  try {
    if (eventType === "payment.captured") {
      await handlePaymentCaptured(paymentEntity!);
    } else if (eventType === "payment.failed") {
      await handlePaymentFailed(paymentEntity!);
    } else if (eventType === "refund.processed") {
      await handleRefundProcessed(refundEntity!);
    } else if (eventType === "refund.failed") {
      await handleRefundFailed(refundEntity!);
    }

    await supabaseAdmin
      .from("webhook_events")
      .update({ status: "PROCESSED", processed_at: new Date().toISOString() })
      .eq("provider", "razorpay")
      .eq("provider_event_id", providerEventId);

  } catch (err) {
    logger.error("Razorpay webhook processing failed", { eventType, error: String(err) });
    await supabaseAdmin
      .from("webhook_events")
      .update({ status: "FAILED" })
      .eq("provider", "razorpay")
      .eq("provider_event_id", providerEventId);
    return NextResponse.json({ received: true });
  }

  return NextResponse.json({ received: true });
}

async function handlePaymentCaptured(payment: Record<string, unknown>) {
  const gatewayOrderId = payment.order_id as string;
  const gatewayPaymentId = payment.id as string;
  const method = payment.method as string;

  const { data: orderData } = await supabaseAdmin
    .from("orders")
    .select("id, event_id, user_id, order_status")
    .eq("gateway_order_id", gatewayOrderId)
    .single();

  const order = orderData as { id: string; event_id: string; user_id: string; order_status: string } | null;

  if (!order) {
    logger.error("Order not found for captured payment", { gatewayOrderId });
    throw new Error("ORDER_NOT_FOUND");
  }

  if (order.order_status === "PAID") {
    logger.info("Order already PAID, skipping", { orderId: order.id });
    return;
  }

  await supabaseAdmin
    .from("payments")
    .update({
      provider_payment_id: gatewayPaymentId,
      status: "CAPTURED",
      method,
      verified_at: new Date().toISOString(),
      raw_response: payment,
      updated_at: new Date().toISOString(),
    })
    .eq("order_id", order.id)
    .eq("provider", "razorpay");

  await supabaseAdmin
    .from("orders")
    .update({
      order_status: "PAID",
      payment_status: "CAPTURED",
      updated_at: new Date().toISOString(),
    })
    .eq("id", order.id);

  const { data: itemsData } = await supabaseAdmin
    .from("order_items")
    .select("ticket_tier_id, quantity")
    .eq("order_id", order.id);

  const orderItems = (itemsData as Array<{ ticket_tier_id: string; quantity: number }> | null) ?? [];

  for (const item of orderItems) {
    await convertReservation(order.id, item.ticket_tier_id, item.quantity);
  }

  await issueTickets(order.id, order.event_id, order.user_id);

  logger.info("Payment captured and tickets issued", { orderId: order.id, gatewayPaymentId });
}

async function handlePaymentFailed(payment: Record<string, unknown>) {
  const gatewayOrderId = payment.order_id as string;

  const { data: orderData } = await supabaseAdmin
    .from("orders")
    .select("id")
    .eq("gateway_order_id", gatewayOrderId)
    .single();

  const order = orderData as { id: string } | null;
  if (!order) return;

  await supabaseAdmin
    .from("orders")
    .update({ order_status: "FAILED", payment_status: "FAILED", updated_at: new Date().toISOString() })
    .eq("id", order.id);

  const { data: itemsData } = await supabaseAdmin
    .from("order_items")
    .select("ticket_tier_id, quantity")
    .eq("order_id", order.id);

  const orderItems = (itemsData as Array<{ ticket_tier_id: string; quantity: number }> | null) ?? [];

  for (const item of orderItems) {
    await releaseReservation(order.id, item.ticket_tier_id);
  }

  logger.info("Payment failed, inventory released", { orderId: order.id });
}

async function handleRefundProcessed(refund: Record<string, unknown>) {
  const providerRefundId = refund.id as string;
  await supabaseAdmin
    .from("refunds")
    .update({
      status: "PROCESSED",
      provider_refund_id: providerRefundId,
      processed_at: new Date().toISOString(),
    })
    .eq("provider_refund_id", providerRefundId);
}

async function handleRefundFailed(refund: Record<string, unknown>) {
  const providerRefundId = refund.id as string;
  await supabaseAdmin
    .from("refunds")
    .update({ status: "FAILED" })
    .eq("provider_refund_id", providerRefundId);
}
