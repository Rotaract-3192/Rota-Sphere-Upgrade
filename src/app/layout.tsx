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
import { dark } from "@clerk/themes";
import "./globals.css";

import { RootJsonLd } from "@/components/seo/JsonLd";
import { SkipToContent } from "@/components/shared/SkipToContent";
import { ScrollProgressBar } from "@/components/shared/ScrollProgressBar";
import { ScrollToTop } from "@/components/shared/ScrollToTop";
import { CookieConsentBanner } from "@/components/shared/CookieConsentBanner";
import { FloatingContactButton } from "@/components/shared/FloatingContactButton";
import { BottomNav } from "@/components/shared/BottomNav";
import { GlobalCommandPalette } from "@/components/shared/GlobalCommandPalette";
import { PwaInstallPrompt } from "@/components/shared/PwaInstallPrompt";
import { UtmTracker } from "@/lib/analytics/utmTracker";
import { OnboardingWrapper } from "@/components/onboarding/OnboardingWrapper";

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
  authors: [{ name: "Rotaract District 3192 Council", url: "https://rotaract3192.org" }],
  creator: "Rotaract District 3192",
  publisher: "Rotaract District 3192",
  category: "events",
  classification: "Event Ticketing & Youth Community Platform",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://events.rotaract3192.org"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "RotaSphere District 3192",
    title: "RotaSphere — Rotaract District 3192 Experience & Ticketing",
    description:
      "Discover verified conferences, cultural fests, workshops, and concerts across all 85 chartered clubs in District 3192.",
    images: [
      {
        url: "/brand-logo.png",
        width: 1200,
        height: 630,
        alt: "RotaSphere District 3192 — Official Event & Ticketing Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "RotaSphere — Rotaract District 3192 Platform",
    description:
      "Discover verified events, passes, and 85 chartered Rotaract clubs across District 3192.",
    images: ["/brand-logo.png"],
    creator: "@rotaract3192",
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || process.env.GOOGLE_SITE_VERIFICATION || undefined,
    yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION || undefined,
    other: {
      "msvalidate.01": process.env.NEXT_PUBLIC_BING_VERIFICATION || "",
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
      { url: "/icon.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
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
        <OnboardingWrapper>
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
          <PwaInstallPrompt />
          <BottomNav />
        </OnboardingWrapper>
      </body>
    </html>
  );

  if (isKeyConfigured) {
    return (
      <ClerkProvider
        publishableKey={envKey}
        appearance={{
          theme: dark,
          variables: {
            colorPrimary: "#0758fc",
            colorBackground: "#121620",
            colorInput: "#090d16",
            colorInputForeground: "#ffffff",
            colorForeground: "#ffffff",
            colorMutedForeground: "#94a3b8",
            colorNeutral: "#ffffff",
            borderRadius: "0.875rem",
            colorDanger: "#ef4444",
          },
          elements: {
            card: "bg-[#121620] border border-white/10 shadow-2xl backdrop-blur-xl rounded-3xl",
            headerTitle: "text-white font-bold text-xl",
            headerSubtitle: "text-slate-400 text-sm",
            socialButtonsBlockButton: "bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-all rounded-xl",
            socialButtonsBlockButtonText: "text-white font-medium text-sm",
            formButtonPrimary: "bg-[#0758fc] hover:bg-[#054fe0] text-white font-bold rounded-xl py-3 shadow-lg shadow-blue-500/20 transition-all",
            footerActionLink: "text-[#3b82f6] hover:text-blue-400 font-semibold",
          },
        }}
      >
        {content}
      </ClerkProvider>
    );
  }

  return content;
}
