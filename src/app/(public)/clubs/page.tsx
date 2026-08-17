import type { Metadata } from "next";
import Link from "next/link";
import { Users, MapPin, Award, Calendar, ArrowRight, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Rotaract Clubs Directory | RotaSphere",
  description: "Explore active Rotaract clubs across District 3192.",
};

const CLUBS = [
  {
    name: "Rotaract Club of Bengaluru Central",
    city: "Bengaluru",
    district: "District 3192",
    members: "95+ Active Members",
    eventsCount: 32,
    charterYear: "2018",
  },
  {
    name: "Rotaract Club of Bangalore West",
    city: "Bengaluru",
    district: "District 3192",
    members: "85+ Active Members",
    eventsCount: 26,
    charterYear: "2019",
  },
  {
    name: "Rotaract Club of Koramangala",
    city: "Koramangala, Bengaluru",
    district: "District 3192",
    members: "70+ Active Members",
    eventsCount: 22,
    charterYear: "2020",
  },
  {
    name: "Rotaract Club of Indiranagar",
    city: "Indiranagar, Bengaluru",
    district: "District 3192",
    members: "65+ Active Members",
    eventsCount: 19,
    charterYear: "2021",
  },
  {
    name: "Rotaract Club of Tumakuru",
    city: "Tumakuru",
    district: "District 3192",
    members: "60+ Active Members",
    eventsCount: 17,
    charterYear: "2021",
  },
  {
    name: "Rotaract Club of Whitefield",
    city: "Whitefield, Bengaluru",
    district: "District 3192",
    members: "55+ Active Members",
    eventsCount: 15,
    charterYear: "2022",
  },
  {
    name: "Rotaract Club of Yelahanka",
    city: "Yelahanka, Bengaluru",
    district: "District 3192",
    members: "50+ Active Members",
    eventsCount: 14,
    charterYear: "2022",
  },
  {
    name: "Rotaract Club of Kolar Silk City",
    city: "Kolar",
    district: "District 3192",
    members: "45+ Active Members",
    eventsCount: 12,
    charterYear: "2023",
  },
  {
    name: "Rotaract Club of BMSCE",
    city: "Basavanagudi, Bengaluru",
    district: "District 3192",
    members: "110+ Institutional Members",
    eventsCount: 35,
    charterYear: "2017",
  },
];

export default function ClubsPage() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        
        {/* Header */}
        <div className="max-w-2xl space-y-3 mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-[#1e9df1] border border-blue-200 text-xs font-extrabold uppercase tracking-wider">
            <Award size={12} /> DISTRICT 3192 NETWORK
          </div>
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-gray-900 tracking-tight">
            Rotaract Clubs Directory
          </h1>
          <p className="text-sm sm:text-base text-gray-600 font-normal leading-relaxed">
            Discover charter Rotaract clubs in District 3192, explore their ongoing community projects, and register for their events.
          </p>
        </div>

        {/* Clubs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {CLUBS.map((club, idx) => (
            <div
              key={idx}
              className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xs hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between space-y-5"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <ShieldCheck size={11} /> Verified Club
                  </span>
                  <span className="text-xs text-gray-400 font-medium">Est. {club.charterYear}</span>
                </div>

                <h2 className="text-lg font-bold text-gray-900 leading-snug mb-1">
                  {club.name}
                </h2>

                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <MapPin size={12} className="text-[#1e9df1]" /> {club.city}, {club.district}
                </p>
              </div>

              <div className="border-t border-gray-100 pt-4 flex items-center justify-between text-xs text-gray-600 font-medium">
                <span className="flex items-center gap-1.5">
                  <Users size={14} className="text-gray-400" /> {club.members}
                </span>
                <span className="flex items-center gap-1.5 font-bold text-gray-900">
                  <Calendar size={14} className="text-[#1e9df1]" /> {club.eventsCount} events
                </span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
