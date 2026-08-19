/**
 * GET /api/cron/retention
 * Runs the DPDP retention engine.
 * Protected by CRON_SECRET — must match Authorization header.
 * Safe to call from Vercel Cron or an external scheduler.
 */

import { NextResponse } from "next/server";
import { runRetentionEngine } from "@/lib/privacy/retentionEngine";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("Authorization");

  if (!secret || authHeader !== `Bearer ${secret}`) {
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
