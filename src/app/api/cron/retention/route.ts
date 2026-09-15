/**
 * GET /api/cron/retention
 * Runs the DPDP retention engine.
 * Protected by CRON_SECRET — must match Authorization header.
 * Safe to call from Vercel Cron or an external scheduler.
 */

import { NextResponse } from "next/server";
import { runRetentionEngine } from "@/lib/privacy/retentionEngine";
import { timingSafeEqual } from "crypto";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("Authorization");

  // Security L-1: Timing-safe comparison prevents side-channel attacks
  if (!secret || !authHeader) {
    return NextResponse.json({ error: "Unauthorized: Missing or invalid secret token." }, { status: 401 });
  }
  const expected = Buffer.from(`Bearer ${secret}`);
  const received = Buffer.from(authHeader);
  const isValid = expected.length === received.length && timingSafeEqual(expected, received);
  if (!isValid) {
    return NextResponse.json({ error: "Unauthorized: Missing or invalid secret token." }, { status: 401 });
  }

  try {
    const result = await runRetentionEngine();
    return NextResponse.json({ success: true, ...result });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}
