import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Star, MapPin, Sparkles, Calendar, ArrowRight } from "lucide-react";

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
  badge?: string;
  dates: string;
}

const EXPERIENCES: ExperienceItem[] = [
  {
    id: "exp-1",
    title: "High-Altitude Youth Leadership Camp & Trek",
    location: "Western Ghats, Sakleshpur",
    rating: 4.96,
    reviews: 84,
    image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop&q=80",
    price: "₹3,499",
    badge: "Bestseller",
    dates: "March 14–16, 2026",
  },
  {
    id: "exp-2",
    title: "Public Speaking & Keynote Mastery Retreat",
    location: "Nandi Hills Heritage Resort, Bengaluru",
    rating: 4.92,
    reviews: 62,
    image: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&auto=format&fit=crop&q=80",
    price: "₹2,199",
    badge: "Masterclass",
    dates: "April 4–5, 2026",
  },
  {
    id: "exp-3",
    title: "Eco-Innovation & Social Impact Hackathon",
    location: "IIM Bangalore Campus, Bannerghatta",
    rating: 4.88,
    reviews: 47,
    image: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800&auto=format&fit=crop&q=80",
    price: "₹1,299",
    badge: "Hackathon",
    dates: "April 18–19, 2026",
  },
];

export default function ExperiencesPage() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        
        {/* Header */}
        <div className="max-w-2xl space-y-3 mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-[#1e9df1] border border-blue-200 text-xs font-extrabold uppercase tracking-wider">
            <Sparkles size={12} /> CURATED IMMERSIONS
          </div>
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-gray-900 tracking-tight">
            Rotaract Experiences
          </h1>
          <p className="text-sm sm:text-base text-gray-600 font-normal leading-relaxed">
            Immersive multi-day workshops, outdoor leadership retreats, and hands-on masterclasses curated across District 3192.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {EXPERIENCES.map((exp) => (
            <div
              key={exp.id}
              className="group bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5 flex flex-col"
            >
              <div className="relative w-full aspect-16/10 overflow-hidden bg-gray-100">
                <Image
                  src={exp.image}
                  alt={exp.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {exp.badge && (
                  <span className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs text-gray-900 text-[10px] font-black uppercase px-2.5 py-1 rounded-full shadow-sm">
                    {exp.badge}
                  </span>
                )}
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <MapPin size={12} className="text-[#1e9df1]" /> {exp.location}
                    </span>
                    <span className="flex items-center gap-1 font-bold text-gray-900">
                      <Star size={13} className="fill-amber-400 text-amber-400" /> {exp.rating} ({exp.reviews})
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-gray-900 leading-snug group-hover:text-[#1e9df1] transition-colors">
                    {exp.title}
                  </h3>

                  <p className="text-xs text-gray-400 flex items-center gap-1.5">
                    <Calendar size={12} /> {exp.dates}
                  </p>
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                  <div>
                    <span className="text-base sm:text-lg font-black text-gray-900">{exp.price}</span>
                    <span className="text-xs text-gray-500 font-normal"> / delegate</span>
                  </div>

                  <Link
                    href="/events"
                    className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#1e9df1] hover:underline"
                  >
                    View Details <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
