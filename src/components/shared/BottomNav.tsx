"use client";

/**
 * Mobile Bottom Navigation Bar (Dock / Tab Bar)
 * Mobile-first native experience replacing traditional burger menu.
 * Features: 5 primary navigation targets, spring active indicators, safe-area inset support,
 * elevated center action button, and Clerk role-aware admin shortcuts.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Calendar, Users, Ticket, PlusCircle, Shield, Image as ImageIcon } from "lucide-react";
import { motion } from "framer-motion";

function useSafeUser() {
  try {
    return useUser();
  } catch {
    return { isSignedIn: false, isLoaded: true, user: null };
  }
}

export function BottomNav() {
  const pathname = usePathname();
  const { isSignedIn, user } = useSafeUser();
  const userEmail = user?.primaryEmailAddress?.emailAddress?.toLowerCase();
  const isSuperAdmin = userEmail === "tech.rotaract3192@gmail.com";

  // Hide BottomNav on scanner or full-screen view if needed
  if (pathname.startsWith("/check-in")) {
    return null;
  }

  const isTabActive = (href: string) => {
    if (href === "/events") {
      return pathname === "/" || pathname === "/events" || pathname.startsWith("/events/");
    }
    return pathname === href || pathname.startsWith(href + "/");
  };

  const navItems = [
    {
      label: "Events",
      href: "/events",
      icon: Calendar,
      isCenter: false,
    },
    {
      label: "Clubs",
      href: "/clubs",
      icon: Users,
      isCenter: false,
    },
    {
      label: "Host",
      href: "/dashboard",
      icon: PlusCircle,
      isCenter: true,
    },
    {
      label: "Passes",
      href: "/tickets",
      icon: Ticket,
      isCenter: false,
    },
    isSuperAdmin
      ? {
          label: "Admin",
          href: "/admin",
          icon: Shield,
          isCenter: false,
        }
      : {
          label: "Gallery",
          href: "/gallery",
          icon: ImageIcon,
          isCenter: false,
        },
  ];

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white/95 dark:bg-gray-950/95 backdrop-blur-xl border-t border-gray-200/80 dark:border-gray-800/80 shadow-2xl transition-colors pb-[max(env(safe-area-inset-bottom),8px)] pt-1 px-2"
    >
      <div className="grid grid-cols-5 items-center justify-around max-w-lg mx-auto">
        {navItems.map((item) => {
          const active = isTabActive(item.href);
          const Icon = item.icon;

          if (item.isCenter) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center -mt-5 group focus:outline-hidden"
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-90 ${
                    active
                      ? "bg-gradient-to-tr from-[#1e9df1] to-blue-600 text-white shadow-blue-500/40 ring-4 ring-white dark:ring-gray-950"
                      : "bg-[#1e9df1] hover:bg-[#1583cd] text-white shadow-blue-500/30 ring-4 ring-white dark:ring-gray-950 group-hover:scale-105"
                  }`}
                >
                  <Icon size={24} className="transition-transform group-hover:rotate-45" />
                </div>
                <span
                  className={`text-[10px] font-extrabold mt-1 tracking-tight ${
                    active ? "text-[#1e9df1]" : "text-gray-600 dark:text-gray-400"
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-col items-center justify-center py-1.5 rounded-2xl transition-all active:scale-95 group focus:outline-hidden"
            >
              <div className="relative flex items-center justify-center w-8 h-8">
                <Icon
                  size={20}
                  className={`transition-colors duration-200 ${
                    active
                      ? "text-[#1e9df1] scale-110"
                      : "text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200"
                  }`}
                />
                {active && (
                  <motion.div
                    layoutId="mobileActiveTabPill"
                    className="absolute inset-0 bg-blue-500/10 dark:bg-blue-500/20 rounded-xl -z-10"
                    transition={{ type: "spring", stiffness: 450, damping: 35 }}
                  />
                )}
              </div>
              <span
                className={`text-[10px] tracking-tight transition-colors duration-200 ${
                  active
                    ? "font-black text-[#1e9df1]"
                    : "font-semibold text-gray-500 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
