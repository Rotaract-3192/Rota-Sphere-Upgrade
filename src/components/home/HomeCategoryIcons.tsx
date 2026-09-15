"use client";

/**
 * HomeCategoryIcons — Circular Icon Category Bar
 * Directly inspired by the reference entertainment & ticketing app layout.
 * Features:
 * - High-contrast circular icon badges with custom gradient backgrounds
 * - Clear category labels below each circle
 * - Smooth horizontal scroll on mobile with touch drag ergonomics
 * - Instant filtering navigation to /events?category=...
 */

import React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  GraduationCap,
  Sparkles,
  Trophy,
  Mic2,
  HeartHandshake,
  Compass,
  Coffee,
  Building2,
  Calendar,
} from "lucide-react";

interface CategoryItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  bgGradient: string;
  iconColor: string;
}

const CATEGORY_ITEMS: CategoryItem[] = [
  {
    id: "all",
    label: "All Events",
    href: "/events",
    icon: Calendar,
    bgGradient: "from-blue-500/15 to-indigo-500/15 border-blue-200 dark:border-blue-900/60",
    iconColor: "text-[#0758fc] dark:text-blue-400",
  },
  {
    id: "conference",
    label: "Conferences",
    href: "/events?category=conference",
    icon: GraduationCap,
    bgGradient: "from-sky-500/15 to-blue-500/15 border-sky-200 dark:border-sky-900/60",
    iconColor: "text-sky-600 dark:text-sky-400",
  },
  {
    id: "festival",
    label: "Youth Fests",
    href: "/events?category=festival",
    icon: Sparkles,
    bgGradient: "from-rose-500/15 to-pink-500/15 border-rose-200 dark:border-rose-900/60",
    iconColor: "text-rose-600 dark:text-rose-400",
  },
  {
    id: "sports",
    label: "Sports Leagues",
    href: "/events?category=sports",
    icon: Trophy,
    bgGradient: "from-amber-500/15 to-orange-500/15 border-amber-200 dark:border-amber-900/60",
    iconColor: "text-amber-600 dark:text-amber-400",
  },
  {
    id: "tedx",
    label: "Keynotes",
    href: "/events?category=tedx",
    icon: Mic2,
    bgGradient: "from-purple-500/15 to-indigo-500/15 border-purple-200 dark:border-purple-900/60",
    iconColor: "text-purple-600 dark:text-purple-400",
  },
  {
    id: "service",
    label: "Community",
    href: "/events?category=service",
    icon: HeartHandshake,
    bgGradient: "from-emerald-500/15 to-teal-500/15 border-emerald-200 dark:border-emerald-900/60",
    iconColor: "text-emerald-600 dark:text-emerald-400",
  },
  {
    id: "outdoors",
    label: "Treks & Eco",
    href: "/events?category=service",
    icon: Compass,
    bgGradient: "from-teal-500/15 to-cyan-500/15 border-teal-200 dark:border-teal-900/60",
    iconColor: "text-teal-600 dark:text-teal-400",
  },
  {
    id: "fellowship",
    label: "Fellowships",
    href: "/events?category=fellowship",
    icon: Coffee,
    bgGradient: "from-orange-500/15 to-amber-500/15 border-orange-200 dark:border-orange-900/60",
    iconColor: "text-orange-600 dark:text-orange-400",
  },
  {
    id: "clubs",
    label: "85 Clubs",
    href: "/clubs",
    icon: Building2,
    bgGradient: "from-indigo-500/15 to-purple-500/15 border-indigo-200 dark:border-indigo-900/60",
    iconColor: "text-indigo-600 dark:text-indigo-400",
  },
];

export function HomeCategoryIcons() {
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get("category") || "all";

  return (
    <section data-tour="category-strip" className="w-full bg-white dark:bg-gray-950 py-4 sm:py-6 border-b border-gray-100 dark:border-gray-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Horizontal Scroll Track */}
        <div className="flex items-center gap-4 sm:gap-6 lg:gap-8 overflow-x-auto scrollbar-hide py-1 px-1">
          {CATEGORY_ITEMS.map((item) => {
            const Icon = item.icon;
            const isSelected =
              item.id === "all"
                ? !searchParams.get("category")
                : activeCategory === item.id;

            return (
              <Link
                key={item.id}
                href={item.href}
                className="group flex flex-col items-center gap-2 shrink-0 text-center transition-transform duration-200 hover:-translate-y-1 active:scale-95 focus:outline-hidden"
              >
                {/* Circular Icon Container */}
                <div
                  className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center border transition-all duration-200 shadow-xs bg-gradient-to-br ${item.bgGradient} ${
                    isSelected
                      ? "ring-2 ring-[#0758fc] ring-offset-2 ring-offset-white dark:ring-offset-gray-950 scale-105 shadow-md shadow-blue-500/20"
                      : "group-hover:scale-105 group-hover:shadow-md"
                  }`}
                >
                  <Icon size={24} className={item.iconColor} />
                </div>

                {/* Label */}
                <span
                  className={`text-xs sm:text-[13px] tracking-tight whitespace-nowrap transition-colors ${
                    isSelected
                      ? "font-black text-[#0758fc]"
                      : "font-semibold text-gray-700 dark:text-gray-300 group-hover:text-[#0758fc] dark:group-hover:text-white"
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>

      </div>
    </section>
  );
}
