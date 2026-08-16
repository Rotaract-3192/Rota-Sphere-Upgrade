"use client";

/**
 * TopNav — Premium RotaSphere SaaS Header
 * Clean navbar with event discovery, gallery, pass access, organizer hub, admin panel, and Clerk auth.
 */

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser, UserButton } from "@clerk/nextjs";
import { Menu, X, Calendar, Image as ImageIcon, Shield, Ticket, PlusCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const NAV_TABS = [
  { label: "Explore Events", href: "/events", icon: Calendar, isNew: false },
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
  const isAdminUser = userEmail === "thejaswinps@gmail.com";

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <header
      role="banner"
      className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 h-16 sm:h-20 shadow-xs"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between gap-4">

        {/* ── LEFT: Wordmark Logo ──────────────────────────────────────── */}
        <Link
          href="/"
          className="flex items-center gap-2 font-black text-2xl tracking-tight text-gray-900 group focus:outline-hidden"
          aria-label="RotaSphere home"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#ff385c] to-rose-600 flex items-center justify-center text-white font-black text-lg shadow-sm group-hover:scale-105 transition-transform">
            R
          </div>
          <span className="font-extrabold tracking-tight">
            Rota<span className="text-[#ff385c]">Sphere</span>
          </span>
        </Link>

        {/* ── CENTER: Product Tabs (desktop) ──────────────────────────── */}
        <nav
          aria-label="Main navigation"
          className="hidden md:flex items-center gap-8"
        >
          {NAV_TABS.map(({ label, href, icon: Icon, isNew }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={[
                  "flex items-center gap-2 py-1 relative group transition-colors duration-150 text-sm font-bold",
                  active ? "text-gray-950" : "text-gray-500 hover:text-gray-900",
                ].join(" ")}
                aria-current={active ? "page" : undefined}
              >
                <Icon size={18} strokeWidth={active ? 2.2 : 1.75} className={active ? "text-[#ff385c]" : "text-gray-400 group-hover:text-gray-700"} />
                <span>{label}</span>

                {isNew && (
                  <span className="bg-amber-100 border border-amber-300 text-amber-900 rounded-full px-1.5 py-0.2 text-[9px] font-extrabold uppercase tracking-wider leading-none">
                    NEW
                  </span>
                )}

                {/* Active underline */}
                {active && (
                  <motion.span
                    layoutId="nav-underline"
                    className="absolute -bottom-2 left-0 right-0 h-0.5 bg-[#ff385c] rounded-full"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* ── RIGHT: Account utilities & Actions ───────────────────────── */}
        <div className="flex items-center gap-3">
          {/* Admin panel link */}
          {isAdminUser && (
            <Link
              href="/admin"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-3 py-1.5 rounded-xl transition-all shadow-xs"
            >
              <Shield size={14} className="text-amber-700" />
              Admin Hub
            </Link>
          )}

          {/* Host an Event CTA */}
          <Link
            href="/dashboard"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-gray-800 hover:text-gray-950 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-xl transition-all"
          >
            <PlusCircle size={16} className="text-gray-600" />
            Host Event
          </Link>

          {/* Auth State Button */}
          {isLoaded && !isSignedIn && (
            <Link
              href="/sign-in"
              className="text-xs sm:text-sm font-bold text-white bg-[#ff385c] hover:bg-[#e00b41] px-5 py-2 rounded-xl shadow-sm transition-all"
            >
              Sign In
            </Link>
          )}

          {isLoaded && isSignedIn && (
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-9 h-9 rounded-full ring-2 ring-gray-200 shadow-sm",
                },
              }}
            />
          )}

          {/* Mobile hamburger */}
          <button
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
            className="md:hidden flex items-center justify-center w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* ── MOBILE MENU ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute top-16 inset-x-0 bg-white border-b border-gray-200 shadow-xl md:hidden z-40 p-4 space-y-2"
          >
            <nav aria-label="Mobile navigation" className="flex flex-col gap-1">
              {NAV_TABS.map(({ label, href, icon: Icon, isNew }) => {
                const active = isActive(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className={[
                      "flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold",
                      active
                        ? "bg-gray-100 text-gray-900"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors",
                    ].join(" ")}
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={18} className={active ? "text-[#ff385c]" : "text-gray-400"} />
                      <span>{label}</span>
                    </div>
                    {isNew && (
                      <span className="text-[9px] font-extrabold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 rounded-full px-2 py-0.5">
                        NEW
                      </span>
                    )}
                  </Link>
                );
              })}

              <div className="h-px bg-gray-200 my-2" />

              {isAdminUser && (
                <Link
                  href="/admin"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-amber-900 bg-amber-50 rounded-xl transition-colors"
                >
                  <Shield size={18} className="text-amber-700" />
                  Admin Hub
                </Link>
              )}

              <Link
                href="/dashboard"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <PlusCircle size={18} className="text-gray-600" />
                Host an Event
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
