import { NextRequest, NextResponse } from "next/server";
import { executeSql, escapeSql } from "@/lib/db/directDb";
import { getCurrentUser } from "@/lib/auth/getUser";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user?.clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { endpoint, keys } = body;

  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ error: "Invalid subscription data" }, { status: 400 });
  }

  try {
    await executeSql(`
      INSERT INTO push_subscriptions (user_id, user_email, endpoint, p256dh, auth)
      VALUES (
        ${escapeSql(user.clerkId)},
        ${escapeSql(user.email?.toLowerCase().trim())},
        ${escapeSql(endpoint)},
        ${escapeSql(keys.p256dh)},
        ${escapeSql(keys.auth)}
      )
      ON CONFLICT (endpoint) DO UPDATE
        SET user_id = EXCLUDED.user_id,
            user_email = EXCLUDED.user_email,
            p256dh = EXCLUDED.p256dh,
            auth = EXCLUDED.auth;
    `);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Push subscribe error:", err);
    return NextResponse.json({ error: "Failed to save subscription" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user?.clerkId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { endpoint } = await req.json();
  if (!endpoint) return NextResponse.json({ error: "Missing endpoint" }, { status: 400 });

  // Enforce IDOR protection: only delete if subscription belongs to caller
  await executeSql(`
    DELETE FROM push_subscriptions 
    WHERE endpoint = ${escapeSql(endpoint)} AND user_id = ${escapeSql(user.clerkId)};
  `);
  return NextResponse.json({ success: true });
}
