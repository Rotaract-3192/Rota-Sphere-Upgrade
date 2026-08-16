/**
 * Inventory Service
 * Architecture §20-22: Transactional inventory management.
 * "A reservation must be created BEFORE collecting payment."
 * "Inventory MUST use SELECT FOR UPDATE (via DB function) to prevent overselling."
 * "Never store money as float."
 */

import { supabaseAdmin } from "@/lib/db/supabaseAdmin";
import { logger } from "@/lib/logger/logger";

export interface ReserveResult {
  success: boolean;
  reservationId?: string;
  error?: "INSUFFICIENT_INVENTORY" | "TIER_NOT_FOUND" | "TIER_DISABLED" | "DB_ERROR";
}

/**
 * Reserve inventory for a ticket tier.
 * Uses the DB-level reserve_inventory() function which acquires a row lock.
 * Architecture §21: "Inventory MUST use SELECT FOR UPDATE."
 */
export async function reserveInventory(
  tierId: string,
  quantity: number,
  orderId: string
): Promise<ReserveResult> {
  const { data, error } = await supabaseAdmin.rpc("reserve_inventory", {
    p_tier_id: tierId,
    p_quantity: quantity,
    p_order_id: orderId,
  });

  if (error) {
    logger.error("reserve_inventory RPC failed", { error: error.message, tierId, orderId });
    return { success: false, error: "DB_ERROR" };
  }

  if (data === false) {
    logger.warn("Insufficient inventory", { tierId, quantity, orderId });
    return { success: false, error: "INSUFFICIENT_INVENTORY" };
  }

  // Fetch the created reservation ID
  const { data: reservation } = await supabaseAdmin
    .from("inventory_reservations")
    .select("id")
    .eq("order_id", orderId)
    .eq("ticket_tier_id", tierId)
    .eq("status", "ACTIVE")
    .single();

  const resObj = reservation as { id: string } | null;
  return { success: true, reservationId: resObj?.id };
}

/**
 * Convert a reservation to confirmed (called after payment capture).
 * Updates reservation to CONVERTED and increments sold_count.
 * Architecture §21: "sold_count is incremented only on payment.captured webhook."
 */
export async function convertReservation(
  orderId: string,
  tierId: string,
  quantity: number
): Promise<void> {
  const { error: reservationError } = await supabaseAdmin
    .from("inventory_reservations")
    .update({ status: "CONVERTED" })
    .eq("order_id", orderId)
    .eq("ticket_tier_id", tierId)
    .eq("status", "ACTIVE");

  if (reservationError) {
    logger.error("Failed to convert reservation", { orderId, tierId, error: reservationError.message });
    throw new Error("RESERVATION_CONVERT_FAILED");
  }

  // Increment sold_count, decrement reserved_count
  const { data: tier } = await supabaseAdmin
    .from("ticket_tiers")
    .select("sold_count, reserved_count")
    .eq("id", tierId)
    .single();

  if (tier) {
    const t = tier as { sold_count: number; reserved_count: number };
    await supabaseAdmin
      .from("ticket_tiers")
      .update({
        sold_count: t.sold_count + quantity,
        reserved_count: Math.max(0, t.reserved_count - quantity),
        updated_at: new Date().toISOString(),
      })
      .eq("id", tierId);
  }
}

/**
 * Release a reservation (order cancelled or expired).
 * Architecture §21: "Expired reservations release inventory back to pool."
 */
export async function releaseReservation(
  orderId: string,
  tierId: string
): Promise<void> {
  const { data: reservation } = await supabaseAdmin
    .from("inventory_reservations")
    .select("quantity")
    .eq("order_id", orderId)
    .eq("ticket_tier_id", tierId)
    .eq("status", "ACTIVE")
    .single();

  if (!reservation) return;
  const res = reservation as { quantity: number };

  await supabaseAdmin
    .from("inventory_reservations")
    .update({ status: "CANCELLED" })
    .eq("order_id", orderId)
    .eq("ticket_tier_id", tierId);

  const { data: tier } = await supabaseAdmin
    .from("ticket_tiers")
    .select("reserved_count")
    .eq("id", tierId)
    .single();

  if (tier) {
    const t = tier as { reserved_count: number };
    await supabaseAdmin
      .from("ticket_tiers")
      .update({
        reserved_count: Math.max(0, t.reserved_count - res.quantity),
        updated_at: new Date().toISOString(),
      })
      .eq("id", tierId);
  }
}

/**
 * Check available inventory for a tier (non-locking read).
 * Use this for display purposes only, NOT for reservation decisions.
 */
export async function getAvailableCount(tierId: string): Promise<number> {
  const { data } = await supabaseAdmin
    .from("ticket_tiers")
    .select("capacity, sold_count, reserved_count")
    .eq("id", tierId)
    .single();

  if (!data) return 0;
  const t = data as { capacity: number; sold_count: number; reserved_count: number };
  return Math.max(0, t.capacity - t.sold_count - t.reserved_count);
}
