/**
 * Next.js Edge Proxy (Middleware)
 * Auth enforced at edge via Clerk. DPDP security headers on every response.
 *
 * Updated to Clerk v7 recommended pattern — no createRouteMatcher.
 */

import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextRequest, NextResponse, NextFetchEvent } from "next/server";

const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const isClerkConfigured =
  Boolean(publishableKey) &&
  !publishableKey?.includes("replace_me") &&
  (publishableKey?.startsWith("pk_test_") || publishableKey?.startsWith("pk_live_"));

/** Routes that require authentication */
const PROTECTED_PATTERNS = [
  /^\/dashboard(\/.*)?$/,
  /^\/admin(\/.*)?$/,
  /^\/tickets(\/.*)?$/,
  /^\/orders(\/.*)?$/,
  /^\/privacy-center(\/.*)?$/,
  /^\/check-in(\/.*)?$/,
];

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATTERNS.some((p) => p.test(pathname));
}

/** DPDP-required security headers applied on every response */
function addSecurityHeaders(response: NextResponse): NextResponse {
  const isDev = process.env.NODE_ENV === "development";

  response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(self), microphone=(), geolocation=(self), payment=(self), usb=()");

  // Only apply CSP in production.
if (!isDev) {
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",

      // Clerk JavaScript
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://clerk.rotaract3192.org https://*.clerk.com https://clerk.com https://*.clerk.accounts.dev https://*.accounts.dev https://challenges.cloudflare.com",

      // Clerk / Next.js workers
      "worker-src 'self' blob:",

      // Styles
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com",

      // Fonts
      "font-src 'self' https://fonts.gstatic.com",

      // Images
      "img-src 'self' data: blob: https: https://img.clerk.com https://*.rotaract3192.org",

      // API / WebSocket / Clerk communication
      "connect-src 'self' https://*.supabase.co https://db.rotaract3192.org https://*.rotaract3192.org https://clerk.rotaract3192.org https://*.clerk.com https://api.clerk.com https://*.clerk.accounts.dev https://*.accounts.dev",

      // Clerk UI / authentication frames
      "frame-src 'self' https://clerk.rotaract3192.org https://*.clerk.com https://*.clerk.accounts.dev https://challenges.cloudflare.com",

      // Security
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; ")
  );
}

  return response;
}

const handler = clerkMiddleware(async (auth, req) => {
  const { pathname } = new URL(req.url);
  if (isProtectedPath(pathname)) {
    await auth.protect();
  }
  const response = NextResponse.next();
  return addSecurityHeaders(response);
});

export default function proxy(req: NextRequest, evt: NextFetchEvent) {
  if (!isClerkConfigured) {
    const response = NextResponse.next();
    return addSecurityHeaders(response);
  }
  return handler(req, evt as any);
}

export const config = {
  matcher: [
    "/((?!_next|sitemap\\.xml|robots\\.txt|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest|xml|txt)).*)",
    "/(api|trpc)(.*)",
  ],
};
