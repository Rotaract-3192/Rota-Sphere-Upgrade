import type { Metadata } from "next";
import { Award, Users, ShieldCheck } from "lucide-react";
import { getDistrictClubsAction } from "@/app/actions/clubActions";
import { ClubsDirectoryClient } from "./ClubsDirectoryClient";

export const metadata: Metadata = {
  title: "Rotaract Clubs Directory | District 3192 | RotaSphere",
  description: "Official chartered Rotaract clubs directory across District 3192 (Bengaluru, Tumakuru, Kolar, Chikkaballapura).",
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
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-[#1e9df1] border border-blue-200 text-xs font-extrabold uppercase tracking-wider">
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
