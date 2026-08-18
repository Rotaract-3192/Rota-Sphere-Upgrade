"use client";

/**
 * CategoryStrip — Mobile-First Horizontal Category Scroll
 * Features: Edge-to-edge frictionless touch scrolling, animated active pill indicator,
 * dark mode support, and responsive typography tailored for District 3192 events.
 */

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Calendar, HeartHandshake, Briefcase, Coffee, Trophy, Sparkles,
  Users, Mic2, BookOpen, Music
} from "lucide-react";
import { motion } from "framer-motion";

const CATEGORIES = [
  { id: "all", label: "All Events", icon: Calendar },
  { id: "conference", label: "Conferences", icon: Users },
  { id: "seminar", label: "Workshops", icon: BookOpen },
  { id: "festival", label: "Youth Fests", icon: Sparkles },
  { id: "tedx", label: "Keynotes", icon: Mic2 },
  { id: "entertainment", label: "Culturals", icon: Music },
  { id: "service", label: "Community Service", icon: HeartHandshake },
  { id: "sports", label: "Sports", icon: Trophy },
  { id: "professional", label: "Leadership", icon: Briefcase },
  { id: "fellowship", label: "Fellowships", icon: Coffee },
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
    <div className="w-full bg-white/95 dark:bg-gray-900/95 border-b border-gray-200/80 dark:border-gray-800/80 sticky top-16 sm:top-20 z-30 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-5 sm:gap-8 overflow-x-auto scrollbar-none py-2.5 sm:py-3.5 -mx-4 px-4 sm:mx-0 sm:px-0">
          {CATEGORIES.map(({ id, label, icon: Icon }) => {
            const active = selected === id;
            return (
              <button
                key={id}
                onClick={() => handleSelect(id)}
                className={[
                  "flex flex-col items-center gap-1 sm:gap-1.5 py-1 min-w-fit relative group cursor-pointer transition-all duration-150 active:scale-95 touch-manipulation focus:outline-hidden",
                  active ? "text-[#0758fc] font-black" : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium",
                ].join(" ")}
              >
                <Icon
                  size={19}
                  strokeWidth={active ? 2.3 : 1.8}
                  className={`transition-colors ${active ? "text-[#0758fc]" : "text-gray-400 dark:text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300"}`}
                />
                <span className="text-[11px] sm:text-xs whitespace-nowrap tracking-tight">{label}</span>

                {/* Active Underline Indicator */}
                {active && (
                  <motion.span
                    layoutId="category-underline"
                    className="absolute -bottom-2.5 sm:-bottom-3.5 left-0 right-0 h-0.5 bg-[#0758fc] rounded-full"
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
