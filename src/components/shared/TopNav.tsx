"use client";

/**
 * TopNav — Premium RotaSphere SaaS Header
 * Clean navbar with event discovery, gallery, pass access, organizer hub, admin panel, and Clerk auth.
 */

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useUser, UserButton } from "@clerk/nextjs";
import { Menu, X, Calendar, Image as ImageIcon, Shield, Ticket, PlusCircle, Users, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { PushNotificationBell } from "@/components/shared/PushNotificationBell";

const NAV_TABS = [
  { label: "Explore Events", href: "/events", icon: Calendar, isNew: false },
  { label: "Clubs", href: "/clubs", icon: Users, isNew: false },
  { label: "My Tickets", href: "/tickets", icon: Ticket, isNew: false },
  { label: "Photo Gallery", href: "/gallery", icon: ImageIcon, isNew: true },
] as const;

function useSafeUser() {
  try {
    return useUser();
  } catch {
    return { isSignedIn: false, isLoaded: true, user: null };
  }
}

export function TopNav() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { isSignedIn, isLoaded, user } = useSafeUser();
  const userEmail = user?.primaryEmailAddress?.emailAddress?.toLowerCase();
  const isAdminUser = userEmail === "tech.rotaract3192@gmail.com";

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <header
      role="banner"
      className="sticky top-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 h-16 sm:h-20 shadow-xs transition-colors"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between gap-4">

        {/* ── LEFT: Wordmark Logo ──────────────────────────────────────── */}
        <Link
          href="/"
          className="flex items-center gap-3 group focus:outline-hidden"
          aria-label="RotaSphere home"
        >
          <div className="relative w-11 h-11 sm:w-13 sm:h-13 shrink-0 group-hover:scale-105 transition-transform">
            <Image
              src="/brand/logo.png"
              alt="Rotaract District 3192 Ticketing Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-gray-900 dark:text-white">
                RotaSphere
              </span>
              <span className="text-[10px] font-black text-[#0758fc] bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 px-1.5 py-0.2 rounded-md">
                3192
              </span>
            </div>
            <span className="text-[10px] text-gray-400 font-bold -mt-0.5 hidden sm:block">
              District 3192 Ticketing
            </span>
          </div>
        </Link>

        {/* ── CENTER: Desktop Navigation Tabs ─────────────────────────── */}
        <nav aria-label="Main navigation" className="hidden md:flex items-center gap-1 lg:gap-2">
          {NAV_TABS.map(({ label, href, icon: Icon, isNew }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={[
                  "relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs lg:text-sm font-bold transition-all",
                  active
                    ? "text-[#0758fc] bg-blue-50/80 dark:bg-blue-950/40"
                    : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800",
                ].join(" ")}
              >
                <Icon size={16} className={active ? "text-[#0758fc]" : "text-gray-400"} />
                <span>{label}</span>
                {isNew && (
                  <span className="text-[9px] font-extrabold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 rounded-full px-1.5 py-0.2">
                    NEW
                  </span>
                )}
                {active && (
                  <motion.div
                    layoutId="activeNavIndicator"
                    className="absolute bottom-0 inset-x-3.5 h-0.5 bg-[#0758fc] rounded-full"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* ── RIGHT: Actions & User Button ─────────────────────────────── */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Dark Mode Toggle */}
          <ThemeToggle />
          {/* Push Notifications Bell */}
          <PushNotificationBell />

          {/* Admin panel link */}
          {isAdminUser && (
            <Link
              href="/admin"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-extrabold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3 py-2 rounded-xl transition-colors"
            >
              <Shield size={14} className="text-amber-700" />
              <span>Admin</span>
            </Link>
          )}

          {/* Host an Event CTA */}
          <Link
            href="/dashboard"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 px-3.5 py-2 rounded-xl transition-colors"
          >
            <PlusCircle size={16} className="text-gray-600 dark:text-gray-300" />
            Host Event
          </Link>

          {/* Auth State Button */}
          {isLoaded && !isSignedIn && (
            <Link
              href="/sign-in"
              className="text-xs sm:text-sm font-bold text-white bg-[#0758fc] hover:bg-[#054fe0] px-4 sm:px-5 py-2 rounded-xl shadow-xs transition-all active:scale-95"
            >
              Sign In
            </Link>
          )}

          {isLoaded && isSignedIn && (
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8 sm:w-9 sm:h-9 rounded-full ring-2 ring-gray-200 dark:ring-gray-700 shadow-xs",
                },
              }}
            />
          )}
        </div>
      </div>
    </header>
  );
}
