import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { executeSql } from "@/lib/db/directDb";

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  image?: string;
}

export async function POST(req: NextRequest) {
  // Protect with CRON_SECRET or internal calls only
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { userId, userEmail, payload } = body as {
    userId?: string;
    userEmail?: string;
    payload: PushPayload;
  };

  // Fetch target subscriptions
  let whereClause = "";
  if (userId) {
    whereClause = `WHERE user_id = '${userId.replace(/'/g, "''")}'`;
  } else if (userEmail) {
    whereClause = `WHERE user_email = '${userEmail.replace(/'/g, "''")}'`;
  }

  const { data: subs } = await executeSql(
    `SELECT * FROM push_subscriptions ${whereClause} LIMIT 100`
  );

  if (!subs || subs.length === 0) {
    return NextResponse.json({ sent: 0, message: "No subscriptions found" });
  }

  const results = await Promise.allSettled(
    subs.map(async (sub: any) => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      };
      await webpush.sendNotification(pushSubscription, JSON.stringify(payload));
    })
  );

  const sent = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;

  // Clean up expired subscriptions (410 Gone)
  const expiredEndpoints = results
    .map((r, i) =>
      r.status === "rejected" &&
      (r.reason as any)?.statusCode === 410
        ? subs[i].endpoint
        : null
    )
    .filter(Boolean);

  if (expiredEndpoints.length > 0) {
    for (const ep of expiredEndpoints) {
      await executeSql(
        `DELETE FROM push_subscriptions WHERE endpoint = '${(ep as string).replace(/'/g, "''")}'`
      );
    }
  }

  return NextResponse.json({ sent, failed });
}
