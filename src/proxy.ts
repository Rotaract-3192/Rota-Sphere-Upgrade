/**
 * Next.js Edge Proxy (Middleware)
 * Architecture §60: Authentication enforced at edge via Clerk proxy.
 * Architecture §102 rule 5: Always enforce authorization on the server.
 */

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextRequest, NextResponse, NextFetchEvent } from "next/server";

const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const isClerkConfigured =
  Boolean(publishableKey) &&
  !publishableKey?.includes("replace_me") &&
  (publishableKey?.startsWith("pk_test_") || publishableKey?.startsWith("pk_live_"));

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/admin(.*)",
  "/tickets(.*)",
  "/orders(.*)",
]);

const handler = clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
  return NextResponse.next();
});

export default function proxy(req: NextRequest, evt: NextFetchEvent) {
  if (!isClerkConfigured) {
    return NextResponse.next();
  }
  return handler(req, evt as any);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
