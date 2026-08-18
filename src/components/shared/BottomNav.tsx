"use client";

/**
 * Mobile Bottom Navigation Bar (Dock / Tab Bar)
 * High-end tactile native mobile experience with fluid Framer Motion animations:
 * - Home button at the leading edge for instant return to discovery feed
 * - Sliding active pill capsule background with spring physics
 * - Bouncy icon micro-interactions on selection and tap
 * - Elevated pulsating center action button for "My Tickets"
 * - Safe-area inset support for modern edge-to-edge mobile devices
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Home, Calendar, Users, Ticket, Shield, Image as ImageIcon } from "lucide-react";
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

  // Hide BottomNav on scanner or full-screen routes
  if (pathname.startsWith("/check-in")) {
    return null;
  }

  const isTabActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    if (href === "/events") {
      return pathname === "/events" || pathname.startsWith("/events/");
    }
    return pathname === href || pathname.startsWith(href + "/");
  };

  const navItems = [
    {
      label: "Home",
      href: "/",
      icon: Home,
      isCenter: false,
    },
    {
      label: "Events",
      href: "/events",
      icon: Calendar,
      isCenter: false,
    },
    {
      label: "My Tickets",
      href: "/tickets",
      icon: Ticket,
      isCenter: true,
    },
    {
      label: "Clubs",
      href: "/clubs",
      icon: Users,
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
      className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white/92 dark:bg-gray-950/92 backdrop-blur-2xl border-t border-gray-200/80 dark:border-gray-800/80 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] transition-colors pb-[max(env(safe-area-inset-bottom),10px)] pt-1.5 px-3 rounded-t-3xl"
    >
      <div className="grid grid-cols-5 items-center justify-around max-w-md mx-auto relative">
        {navItems.map((item) => {
          const active = isTabActive(item.href);
          const Icon = item.icon;

          if (item.isCenter) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center -mt-6 group focus:outline-hidden"
              >
                <motion.div
                  whileTap={{ scale: 0.88, rotate: -4 }}
                  whileHover={{ scale: 1.06, y: -2 }}
                  transition={{ type: "spring", stiffness: 500, damping: 20 }}
                  className={`w-13 h-13 rounded-full flex items-center justify-center shadow-xl transition-all relative ${
                    active
                      ? "bg-gradient-to-tr from-[#0758fc] via-blue-600 to-indigo-600 text-white shadow-[#0758fc]/45 ring-4 ring-white dark:ring-gray-950 scale-105 animate-soft-pulse"
                      : "bg-[#0758fc] hover:bg-[#054fe0] text-white shadow-[#0758fc]/30 ring-4 ring-white dark:ring-gray-950"
                  }`}
                >
                  <motion.div
                    animate={{
                      scale: active ? 1.08 : 1,
                      rotate: active ? -3 : 0,
                    }}
                    transition={{ type: "spring", stiffness: 500, damping: 25 }}
                  >
                    <Icon size={23} strokeWidth={2.4} />
                  </motion.div>
                </motion.div>
                <motion.span
                  animate={{ y: active ? -1 : 0 }}
                  className={`text-[10px] font-black mt-1 tracking-tight transition-colors ${
                    active ? "text-[#0758fc]" : "text-gray-600 dark:text-gray-400"
                  }`}
                >
                  {item.label}
                </motion.span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-col items-center justify-center py-1.5 px-1 text-center transition-all group focus:outline-hidden"
            >
              <motion.div
                whileTap={{ scale: 0.84 }}
                transition={{ type: "spring", stiffness: 600, damping: 22 }}
                className="relative flex flex-col items-center"
              >
                {/* Active Capsule Glow Background */}
                {active && (
                  <motion.div
                    layoutId="bottom-nav-active-pill"
                    className="absolute -inset-x-3 -inset-y-1 bg-[#0758fc]/10 dark:bg-[#0758fc]/20 rounded-2xl -z-10 border border-[#0758fc]/20"
                    transition={{ type: "spring", stiffness: 450, damping: 30 }}
                  />
                )}

                <motion.div
                  animate={{
                    scale: active ? 1.15 : 1,
                    y: active ? -2 : 0,
                  }}
                  transition={{ type: "spring", stiffness: 500, damping: 25 }}
                >
                  <Icon
                    size={20}
                    strokeWidth={active ? 2.5 : 1.8}
                    className={`transition-colors duration-200 ${
                      active
                        ? "text-[#0758fc]"
                        : "text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"
                    }`}
                  />
                </motion.div>

                <span
                  className={`text-[10px] tracking-tight truncate max-w-[56px] transition-all duration-200 mt-0.5 ${
                    active
                      ? "text-[#0758fc] font-black"
                      : "text-gray-500 dark:text-gray-400 font-semibold group-hover:text-gray-900 dark:group-hover:text-white"
                  }`}
                >
                  {item.label}
                </span>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
