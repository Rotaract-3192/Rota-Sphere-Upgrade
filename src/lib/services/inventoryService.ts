/**
 * Inventory Service
 * Manages concurrency-safe inventory holds and capacity validations.
 */

import { supabaseAdmin } from "@/lib/db/supabaseAdmin";
import { logger } from "@/lib/logger/logger";

export interface HoldInventoryParams {
  ticketTierId: string;
  quantity: number;
  sessionId: string;
  userId?: string | null;
  holdDurationMinutes?: number;
}

export async function holdTicketInventory(params: HoldInventoryParams): Promise<{ success: boolean; error?: string; holdId?: string }> {
  try {
    // 1. Fetch live tier with current inventory counts
    const { data: tier, error: tierErr } = await supabaseAdmin
      .from("saas_ticket_tiers")
      .select("id, total_capacity, sold_count, reserved_count, is_active, sales_end")
      .eq("id", params.ticketTierId)
      .single();

    if (tierErr || !tier) {
      return { success: false, error: "Ticket tier not found" };
    }

    if (!tier.is_active || new Date(tier.sales_end).getTime() < Date.now()) {
      return { success: false, error: "Ticket sales have ended for this tier" };
    }

    const available = tier.total_capacity - tier.sold_count - tier.reserved_count;
    if (available < params.quantity) {
      return { success: false, error: `Only ${Math.max(0, available)} tickets remaining in this tier` };
    }

    // 2. Insert hold record
    const expiresAt = new Date(Date.now() + (params.holdDurationMinutes ?? 10) * 60 * 1000).toISOString();
    const { data: hold, error: holdErr } = await supabaseAdmin
      .from("ticket_inventory_holds")
      .insert({
        ticket_tier_id: params.ticketTierId,
        session_id: params.sessionId,
        user_id: params.userId ?? null,
        quantity: params.quantity,
        expires_at: expiresAt,
      })
      .select("id")
      .single();

    if (holdErr || !hold) {
      return { success: false, error: "Failed to place inventory hold" };
    }

    // 3. Atomically increment reserved_count
    await supabaseAdmin
      .from("saas_ticket_tiers")
      .update({ reserved_count: tier.reserved_count + params.quantity })
      .eq("id", params.ticketTierId);

    return { success: true, holdId: hold.id };
  } catch (err) {
    logger.error("holdTicketInventory error", { error: String(err) });
    return { success: false, error: "Internal inventory reservation error" };
  }
}

export async function releaseExpiredInventoryHolds(): Promise<void> {
  try {
    const now = new Date().toISOString();
    const { data: expiredHolds } = await supabaseAdmin
      .from("ticket_inventory_holds")
      .select("id, ticket_tier_id, quantity")
      .lt("expires_at", now);

    if (!expiredHolds || expiredHolds.length === 0) return;

    for (const hold of expiredHolds) {
      const { data: tier } = await supabaseAdmin
        .from("saas_ticket_tiers")
        .select("reserved_count")
        .eq("id", hold.ticket_tier_id)
        .single();

      if (tier) {
        await supabaseAdmin
          .from("saas_ticket_tiers")
          .update({ reserved_count: Math.max(0, tier.reserved_count - hold.quantity) })
          .eq("id", hold.ticket_tier_id);
      }

      await supabaseAdmin.from("ticket_inventory_holds").delete().eq("id", hold.id);
    }
  } catch (err) {
    logger.error("releaseExpiredInventoryHolds error", { error: String(err) });
  }
}
