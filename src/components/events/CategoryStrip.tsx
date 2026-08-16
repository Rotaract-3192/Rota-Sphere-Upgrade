"use client";

/**
 * CategoryStrip — Sleek Dark Category Horizontal Scroll
 * Tailored for District 3192 Flagship Event Formats.
 */

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Calendar, HeartHandshake, Briefcase, Coffee, Trophy, Sparkles,
  TreePine, Globe, Users, Mic2, BookOpen, Music
} from "lucide-react";
import { motion } from "framer-motion";

const CATEGORIES = [
  { id: "all", label: "All Events", icon: Calendar },
  { id: "conference", label: "Conferences", icon: Users },
  { id: "seminar", label: "Workshops & Masterclasses", icon: BookOpen },
  { id: "festival", label: "Youth Festivals", icon: Sparkles },
  { id: "tedx", label: "Keynote Talks", icon: Mic2 },
  { id: "entertainment", label: "Cultural Nights", icon: Music },
  { id: "service", label: "Community Impact", icon: HeartHandshake },
  { id: "sports", label: "Sports Leagues", icon: Trophy },
  { id: "professional", label: "Leadership Retreats", icon: Briefcase },
  { id: "fellowship", label: "Club Fellowships", icon: Coffee },
] as const;

export function CategoryStrip() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get("category") ?? "all";
  const [selected, setSelected] = useState(currentCategory);

  function handleSelect(id: string) {
    setSelected(id);
    const params = new URLSearchParams(searchParams.toString());
    if (id === "all") {
      params.delete("category");
    } else {
      params.set("category", id);
    }
    router.push(`/events?${params.toString()}`);
  }

  return (
    <div className="w-full bg-[#0b0d12] border-b border-white/10 sticky top-16 z-30 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8 overflow-x-auto scrollbar-none py-3.5">
          {CATEGORIES.map(({ id, label, icon: Icon }) => {
            const active = selected === id;
            return (
              <button
                key={id}
                onClick={() => handleSelect(id)}
                className={[
                  "flex flex-col items-center gap-1.5 py-1 min-w-fit relative group cursor-pointer transition-colors duration-150",
                  active ? "text-amber-400 font-bold" : "text-gray-400 hover:text-gray-200 font-medium",
                ].join(" ")}
              >
                <Icon size={20} strokeWidth={active ? 2.2 : 1.6} />
                <span className="text-xs whitespace-nowrap">{label}</span>

                {/* Active indicator */}
                {active && (
                  <motion.span
                    layoutId="category-underline"
                    className="absolute -bottom-3.5 left-0 right-0 h-0.5 bg-amber-400 rounded-full"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
