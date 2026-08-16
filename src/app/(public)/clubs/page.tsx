import type { Metadata } from "next";
import Link from "next/link";
import { Users, MapPin, Award, Calendar } from "lucide-react";

export const metadata: Metadata = {
  title: "Rotaract Clubs Directory | RotaSphere",
  description: "Explore active Rotaract clubs across District 3192.",
};

const CLUBS = [
  {
    name: "Rotaract Club of Central District",
    city: "Bengaluru",
    district: "District 3192",
    members: "65+ Active Members",
    eventsCount: 24,
  },
  {
    name: "Rotaract Club of Surat Metro",
    city: "Surat",
    district: "District 3192",
    members: "80+ Active Members",
    eventsCount: 18,
  },
  {
    name: "Rotaract Club of Heritage City",
    city: "Ahmedabad",
    district: "District 3192",
    members: "50+ Active Members",
    eventsCount: 15,
  },
  {
    name: "Rotaract Club of Vadodara Youth",
    city: "Vadodara",
    district: "District 3192",
    members: "45+ Active Members",
    eventsCount: 12,
  },
];

export default function ClubsPage() {
  return (
    <div className="max-w-[1440px] mx-auto px-base md:px-xl py-section">
      <h1 className="text-display-md font-bold text-ink mb-xs">Rotaract Clubs Directory</h1>
      <p className="text-body-md text-muted mb-xl max-w-xl">
        Discover active Rotaract clubs in District 3192, view their upcoming events, and get involved.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
        {CLUBS.map((club, idx) => (
          <div
            key={idx}
            className="bg-canvas border border-hairline rounded-card p-lg shadow-card hover:shadow-card transition-shadow flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-xs text-caption-sm text-brand font-semibold mb-xs">
                <Award size={14} /> {club.district}
              </div>
              <h2 className="text-title-md font-bold text-ink mb-xs">{club.name}</h2>
              <p className="text-body-sm text-muted flex items-center gap-xxs mb-md">
                <MapPin size={14} /> {club.city}
              </p>
            </div>

            <div className="border-t border-hairline pt-md flex items-center justify-between text-body-sm text-muted">
              <span className="flex items-center gap-xxs"><Users size={14} /> {club.members}</span>
              <span className="flex items-center gap-xxs"><Calendar size={14} /> {club.eventsCount} events</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
