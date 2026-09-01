import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "District Photo Gallery & Moments | RotaSphere District 3192",
  description:
    "Explore authentic photo memories, event highlights, and community impact albums from flagship conferences and fellowships across Rotaract District 3192.",
  keywords: [
    "Rotaract gallery",
    "District 3192 photos",
    "Rotaract conferences photos",
    "Rotaract youth events",
  ],
  alternates: {
    canonical: "/gallery",
  },
  openGraph: {
    title: "District Photo Gallery & Moments | RotaSphere District 3192",
    description: "Explore authentic photo memories and event highlights across District 3192.",
    url: "/gallery",
    siteName: "RotaSphere District 3192",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "/brand-logo.png",
        width: 1200,
        height: 630,
        alt: "RotaSphere Photo Gallery",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "District Photo Gallery | RotaSphere District 3192",
    description: "Explore photo highlights from Rotaract District 3192 events.",
    images: ["/brand-logo.png"],
  },
};

export default function GalleryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
