/**
 * Root Layout
 * Architecture §3: Clerk provider wraps the entire app.
 * DESIGN-airbnb.md: Inter font as substitute for Airbnb Cereal VF.
 * Architecture §67: Semantic HTML, accessibility.
 * Architecture §92: SEO metadata on all pages.
 */

import type { Metadata } from "next";
import { Inter, Open_Sans } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

import { RootJsonLd } from "@/components/seo/JsonLd";
import { SkipToContent } from "@/components/shared/SkipToContent";
import { ScrollProgressBar } from "@/components/shared/ScrollProgressBar";
import { ScrollToTop } from "@/components/shared/ScrollToTop";
import { CookieConsentBanner } from "@/components/shared/CookieConsentBanner";
import { FloatingContactButton } from "@/components/shared/FloatingContactButton";
import { BottomNav } from "@/components/shared/BottomNav";
import { GlobalCommandPalette } from "@/components/shared/GlobalCommandPalette";
import { UtmTracker } from "@/lib/analytics/utmTracker";

const openSans = Open_Sans({
  subsets: ["latin"],
  variable: "--font-sans-open",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    template: "%s | RotaSphere District 3192",
    default: "RotaSphere — Rotaract District 3192 Experience & Ticketing",
  },
  description:
    "Official event ticketing, registration, and club discovery platform for Rotaract District 3192. Discover verified conferences, sports fests, cultural nights, and community initiatives.",
  keywords: [
    "rotaract",
    "district 3192",
    "rotaract bangalore",
    "rotary international zone 5",
    "rotaract events",
    "event ticketing",
    "delegate pass",
    "rotaract clubs",
  ],
  authors: [{ name: "Rotaract District 3192 Council" }],
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://rotasphere.in"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: "RotaSphere District 3192",
    title: "RotaSphere — Rotaract District 3192 Experience & Ticketing",
    description:
      "Official event ticketing, registration, and club discovery platform for Rotaract District 3192. Discover verified conferences, fests, and workshops.",
    images: [
      {
        url: "/brand/logo.png",
        width: 1024,
        height: 1024,
        alt: "RotaSphere District 3192 Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "RotaSphere — Rotaract District 3192 Experience & Ticketing",
    description:
      "Official event ticketing, registration, and club discovery platform for Rotaract District 3192.",
    images: ["/brand/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  icons: {
    icon: [
      { url: "/brand/logo.png" },
      { url: "/favicon.ico" },
      { url: "/icon.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/brand/logo.png",
    apple: "/brand/logo.png",
  },
  manifest: "/site.webmanifest",
  appleWebApp: {
    title: "RotaSphere",
    statusBarStyle: "default",
    capable: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const envKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const isKeyConfigured =
    Boolean(envKey) &&
    !envKey?.includes("replace_me") &&
    (envKey?.startsWith("pk_test_") || envKey?.startsWith("pk_live_"));

  const content = (
    <html lang="en" className={`${openSans.variable} ${inter.variable}`} suppressHydrationWarning>
      <head>
        <RootJsonLd />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('rotasphere-theme');
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (theme === 'dark' || (!theme && prefersDark)) {
                  document.documentElement.classList.add('dark');
                  document.documentElement.style.colorScheme = 'dark';
                } else {
                  document.documentElement.classList.remove('dark');
                  document.documentElement.style.colorScheme = 'light';
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="antialiased bg-canvas text-ink font-sans relative selection:bg-[#0758fc] selection:text-white" suppressHydrationWarning>
        <SkipToContent />
        <ScrollProgressBar />
        <UtmTracker />
        <GlobalCommandPalette />

        <div id="main-content" className="pb-20 md:pb-0">
          {children}
        </div>

        <FloatingContactButton />
        <ScrollToTop />
        <CookieConsentBanner />
        <BottomNav />
      </body>
    </html>
  );

  if (isKeyConfigured) {
    return <ClerkProvider publishableKey={envKey}>{content}</ClerkProvider>;
  }

  return content;
}
