import type { Metadata } from "next";
import { Award, Users, ShieldCheck } from "lucide-react";
import { getDistrictClubsAction } from "@/app/actions/clubActions";
import { ClubsDirectoryClient } from "./ClubsDirectoryClient";

export const metadata: Metadata = {
  title: "Rotaract Clubs Directory | District 3192 Network | RotaSphere",
  description:
    "Official directory of all 85+ chartered Rotaract clubs across Zones Taranga, Varuna, Samudhra, Sagara, Pravaha, and Arnava in District 3192 (Bengaluru, Tumakuru, Kolar).",
  keywords: [
    "Rotaract clubs Bangalore",
    "District 3192 clubs",
    "Rotaract Zone Taranga",
    "Rotaract Zone Varuna",
    "chartered Rotaract clubs",
    "Rotary club partners",
  ],
  alternates: {
    canonical: "/clubs",
  },
  openGraph: {
    title: "Rotaract Clubs Directory | District 3192 Network",
    description:
      "Explore 85+ chartered Rotaract clubs in District 3192, their zones, flagship projects, and leadership teams.",
    url: "/clubs",
    siteName: "RotaSphere District 3192",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "/brand-logo.png",
        width: 1200,
        height: 630,
        alt: "Rotaract District 3192 Clubs Directory",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Rotaract Clubs Directory | District 3192",
    description: "Explore 85+ chartered clubs across District 3192.",
    images: ["/brand-logo.png"],
  },
};

export const dynamic = "force-dynamic";

export default async function ClubsPage() {
  const res = await getDistrictClubsAction();
  const clubs = res.data || [];

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        
        {/* Header */}
        <div className="max-w-3xl space-y-3 mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-[#0758fc] border border-blue-200 text-xs font-extrabold uppercase tracking-wider">
            <Award size={12} /> DISTRICT 3192 OFFICIAL NETWORK
          </div>
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-gray-900 tracking-tight">
            Rotaract Clubs Directory
          </h1>
          <p className="text-sm sm:text-base text-gray-600 font-normal leading-relaxed">
            Discover all 85+ chartered Rotaract clubs across Zones Taranga, Varuna, Samudhra, Sagara, Pravaha, and Arnava in District 3192. Explore their events, leadership, and community initiatives.
          </p>
        </div>

        {/* Dynamic Interactive Directory */}
        <ClubsDirectoryClient initialClubs={clubs} />
      </div>
    </div>
  );
}
