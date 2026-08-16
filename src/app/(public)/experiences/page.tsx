import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Star, MapPin, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "Rotaract Experiences | RotaSphere",
  description: "Curated workshops, retreats, and leadership immersions across District 3192.",
};

interface ExperienceItem {
  id: string;
  title: string;
  location: string;
  rating: number;
  reviews: number;
  image: string;
  price: string;
}

const EXPERIENCES: ExperienceItem[] = [];

export default function ExperiencesPage() {
  return (
    <div className="max-w-[1440px] mx-auto px-base md:px-xl py-section">
      <div className="flex items-center gap-sm mb-xs">
        <span className="text-badge font-bold uppercase tracking-wider bg-brand/10 text-brand px-xs py-xxs rounded-full flex items-center gap-xxs">
          <Sparkles size={12} /> NEW
        </span>
        <h1 className="text-display-md font-bold text-ink">Rotaract Experiences</h1>
      </div>
      <p className="text-body-md text-muted mb-xl max-w-xl">
        Immersive multi-day workshops, retreats, and hands-on masterclasses designed for leadership development.
      </p>

      {EXPERIENCES.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-gray-200 rounded-3xl p-8 bg-gray-50/50">
          <Sparkles className="mx-auto text-gray-300 mb-3" size={36} />
          <h3 className="text-lg font-bold text-gray-900">No experiences scheduled yet</h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto mt-1">
            District workshops and leadership experiences will be listed here once announced.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-lg">
          {EXPERIENCES.map((exp) => (
            <div
              key={exp.id}
              className="group bg-canvas border border-hairline rounded-card overflow-hidden shadow-card hover:shadow-card transition-shadow"
            >
              <div className="relative w-full h-64 overflow-hidden bg-surface-strong">
                <Image
                  src={exp.image}
                  alt={exp.title}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="p-base">
                <div className="flex items-center justify-between gap-xs mb-xxs">
                  <span className="text-body-sm text-muted flex items-center gap-xxs">
                    <MapPin size={12} /> {exp.location}
                  </span>
                  <span className="flex items-center gap-xxs text-body-sm font-medium text-ink">
                    <Star size={14} className="fill-ink text-ink" /> {exp.rating} ({exp.reviews})
                  </span>
                </div>
                <h3 className="text-title-md font-semibold text-ink mb-xs line-clamp-1">{exp.title}</h3>
                <p className="text-body-sm font-semibold text-ink">{exp.price} <span className="font-normal text-muted">/ person</span></p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
