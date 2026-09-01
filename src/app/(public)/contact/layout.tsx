import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us & Support | Rotaract District 3192 | RotaSphere",
  description:
    "Get support for pass bookings, payments, club onboarding, or grievance resolution with Rotaract District 3192 Council.",
  alternates: {
    canonical: "/contact",
  },
  openGraph: {
    title: "Contact Us & Support | RotaSphere District 3192",
    description: "Official contact directory and grievance redressal for District 3192.",
    url: "/contact",
    siteName: "RotaSphere District 3192",
    locale: "en_IN",
    type: "website",
    images: ["/brand-logo.png"],
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
