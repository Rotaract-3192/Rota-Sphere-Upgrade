/**
 * Root Layout
 * Architecture §3: Clerk provider wraps the entire app.
 * DESIGN-airbnb.md: Inter font as substitute for Airbnb Cereal VF.
 * Architecture §67: Semantic HTML, accessibility.
 * Architecture §92: SEO metadata on all pages.
 */

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    template: "%s | RotaSphere",
    default: "RotaSphere — Rotaract Event Platform",
  },
  description:
    "Discover, register, and manage Rotaract events across District 3192. Buy tickets, track registrations, and connect with your community.",
  keywords: ["rotaract", "events", "district 3192", "tickets", "community", "gallery"],
  authors: [{ name: "RotaSphere" }],
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  openGraph: {
    type: "website",
    siteName: "RotaSphere",
    title: "RotaSphere — Rotaract Event Platform",
    description: "Discover, register, and manage Rotaract events across District 3192.",
  },
  twitter: {
    card: "summary_large_image",
    title: "RotaSphere — Rotaract Event Platform",
    description: "Discover, register, and manage Rotaract events across District 3192.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
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
    <html lang="en" className={inter.variable}>
      <body className="antialiased bg-canvas text-ink font-sans">
        {children}
      </body>
    </html>
  );

  if (isKeyConfigured) {
    return <ClerkProvider publishableKey={envKey}>{content}</ClerkProvider>;
  }

  return content;
}
