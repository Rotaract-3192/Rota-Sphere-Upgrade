"use client";

/**
 * Footer Component
 * Dual-Layout Design:
 * - Desktop View (md+): Full 5-column comprehensive footer
 * - Mobile View (<md): Sleek, native-feeling mobile card with collapsible accordions, quick chips, and safe bottom padding
 */

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronDown, ChevronUp, ShieldCheck, Mail, Sparkles, ExternalLink, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { triggerPwaInstall } from "@/components/shared/PwaInstallPrompt";

const FOOTER_COLUMNS = [
  {
    heading: "Support",
    links: [
      { label: "Help Centre", href: "/help" },
      { label: "Contact Us", href: "/contact" },
      { label: "Cancellation Policy", href: "/cancellation-policy" },
      { label: "Refund Policy", href: "/refund-policy" },
      { label: "Dispute Resolution", href: "/disputes" },
    ],
  },
  {
    heading: "Legal & Privacy",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Privacy Center", href: "/privacy-center" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Cookie Policy", href: "/cookies" },
      { label: "Accessibility Statement", href: "/accessibility" },
      { label: "HTML Sitemap", href: "/sitemap" },
    ],
  },
  {
    heading: "Platform",
    links: [
      { label: "Discover Events", href: "/events" },
      { label: "For Organizers", href: "/dashboard" },
      { label: "Clubs Directory", href: "/clubs" },
      { label: "District 3192", href: "/district" },
      { label: "Platform Security", href: "/security" },
      { label: "System Status", href: "/status" },
    ],
  },
] as const;

export function Footer() {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const year = new Date().getFullYear();

  const toggleSection = (heading: string) => {
    setExpandedSection((prev) => (prev === heading ? null : heading));
  };

  return (
    <footer
      role="contentinfo"
      className="bg-gray-50 dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 mt-12 sm:mt-16 transition-colors"
    >
        {/* ══════════════════════════════════════════════════════════════════
            1. MOBILE-ONLY COMPACT & SLEEK FOOTER (< md)
            ══════════════════════════════════════════════════════════════════ */}
        <div className="md:hidden px-4 pt-8 pb-32 space-y-6">
          {/* Brand Header */}
          <div className="space-y-3">
            <Link href="/" className="flex items-center gap-3">
              <div className="relative w-10 h-10 shrink-0">
                <Image
                  src="/brand/logo.png"
                  alt="Rotaract District 3192 Ticketing Logo"
                  fill
                  className="object-contain"
                />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-black tracking-tight text-lg text-gray-900 dark:text-white">
                    Rota<span className="text-[#0758fc]">Sphere</span>
                  </span>
                  <span className="text-[9px] font-black text-[#0758fc] bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 px-1.5 py-0.2 rounded-md">
                    3192
                  </span>
                </div>
                <span className="text-[10px] font-extrabold text-gray-400">
                  Rotaract District 3192 Ticketing
                </span>
              </div>
            </Link>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Official event ticketing, direct UPI settlements, and gate passes across District 3192.
            </p>
          </div>

          {/* Quick Essential Navigation Chips */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            <Link
              href="/events"
              className="text-xs font-bold bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-800 px-3 py-1.5 rounded-xl shadow-2xs active:scale-95 transition-all"
            >
              Explore Events
            </Link>
            <Link
              href="/clubs"
              className="text-xs font-bold bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-800 px-3 py-1.5 rounded-xl shadow-2xs active:scale-95 transition-all"
            >
              Clubs (85)
            </Link>
            <Link
              href="/help"
              className="text-xs font-bold bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-800 px-3 py-1.5 rounded-xl shadow-2xs active:scale-95 transition-all"
            >
              Help &amp; FAQs
            </Link>
            <Link
              href="/privacy-center"
              className="text-xs font-bold bg-blue-50 dark:bg-blue-950/40 text-[#0758fc] border border-blue-200 dark:border-blue-800 px-3 py-1.5 rounded-xl shadow-2xs active:scale-95 transition-all"
            >
              Privacy Center
            </Link>
          </div>

          {/* Collapsible Mobile Accordions */}
          <div className="space-y-2 border-t border-gray-200/80 dark:border-gray-800/80 pt-4">
            {FOOTER_COLUMNS.map((col) => {
              const isOpen = expandedSection === col.heading;
              return (
                <div
                  key={col.heading}
                  className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden transition-all shadow-2xs"
                >
                  <button
                    type="button"
                    onClick={() => toggleSection(col.heading)}
                    className="w-full flex items-center justify-between p-3.5 text-xs font-black text-gray-900 dark:text-white text-left cursor-pointer active:bg-gray-50 dark:active:bg-gray-800"
                  >
                    <span>{col.heading}</span>
                    {isOpen ? (
                      <ChevronUp size={16} className="text-[#0758fc]" />
                    ) : (
                      <ChevronDown size={16} className="text-gray-400" />
                    )}
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="px-3.5 pb-3.5 pt-1 space-y-2 border-t border-gray-100 dark:border-gray-800"
                      >
                        {col.links.map((link) => (
                          <Link
                            key={link.href}
                            href={link.href}
                            className="block text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-[#0758fc] py-1 active:text-[#0758fc]"
                          >
                            {link.label}
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          {/* Social Icons, Theme Toggle & Verification */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 space-y-3.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
                <a
                  href="https://instagram.com/rotaract3192"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:text-[#0758fc] transition-colors"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
                <a
                  href="https://linkedin.com/company/rotaract3192"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                  className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:text-[#0758fc] transition-colors"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                  </svg>
                </a>
                <a
                  href="mailto:tech.rotaract3192@gmail.com"
                  aria-label="Email Tech Support"
                  className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:text-[#0758fc] transition-colors"
                >
                  <Mail size={16} />
                </a>
              </div>
              <ThemeToggle />
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => triggerPwaInstall()}
                className="w-full flex items-center justify-center gap-2 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-[#0758fc] dark:text-blue-400 font-extrabold text-xs py-2.5 px-4 rounded-2xl hover:bg-blue-100 dark:hover:bg-blue-900/80 transition-all cursor-pointer shadow-xs active:scale-95"
              >
                <Download size={14} />
                <span>Install RotaSphere as App</span>
              </button>
            </div>
          </div>

          {/* Copyright & DPDP */}
          <div className="text-center space-y-1 text-[11px] text-gray-400 dark:text-gray-500">
            <p>© {year} RotaSphere · All rights reserved.</p>
            <p>Compliant with Digital Personal Data Protection Act, 2023 (India)</p>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            2. DESKTOP-ONLY COMPREHENSIVE 5-COLUMN FOOTER (md+)
            ══════════════════════════════════════════════════════════════════ */}
        <div className="hidden md:block">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12 lg:py-16">
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10">
              {/* Brand & Mission Column */}
              <div className="col-span-2 space-y-4 pr-0 lg:pr-6">
                <Link href="/" className="flex items-center gap-3 group">
                  <div className="relative w-11 h-11 shrink-0 group-hover:scale-105 transition-transform">
                    <Image
                      src="/brand/logo.png"
                      alt="Rotaract District 3192 Ticketing Logo"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-black tracking-tight text-xl text-gray-900 dark:text-white leading-none">
                      Rota<span className="text-[#0758fc]">Sphere</span>
                    </span>
                    <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#0758fc] mt-0.5">
                      District 3192 Ticketing &amp; Ops
                    </span>
                  </div>
                </Link>

                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed max-w-sm">
                  Official Multi-Tenant Event Discovery, Ticketing, Direct UPI/Gateway Settlement, and Venue Gate Verification Platform for Rotaract District 3192.
                </p>
              </div>

              {/* Navigation Columns */}
              {FOOTER_COLUMNS.map((col) => (
                <div key={col.heading} className="space-y-4">
                  <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider">
                    {col.heading}
                  </h3>
                  <ul className="space-y-2.5" role="list">
                    {col.links.map((link) => (
                      <li key={`${col.heading}-${link.label}-${link.href}`}>
                        <Link
                          href={link.href}
                          className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:underline transition-colors block"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Operating Entity & Directory Verification Band */}
          <div className="border-t border-gray-200 dark:border-gray-800 bg-gray-100/70 dark:bg-gray-900/60 py-4 px-6 lg:px-8">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-[11px] text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-4">
                <span>
                  Operating Entity: <strong className="text-gray-700 dark:text-gray-300">RotaSphere Platform Operations / Rotaract District 3192 Secretariat</strong>
                </span>
                <span>·</span>
                <span className="text-gray-400">Bengaluru, Karnataka, India</span>
                <span>·</span>
                <span className="font-mono text-[10px] bg-gray-200/80 dark:bg-gray-800 px-2 py-0.5 rounded text-gray-600 dark:text-gray-300">
                  v2.4.0-prod
                </span>
              </div>
            </div>
          </div>

          {/* Legal & Copyright Band */}
          <div className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 transition-colors">
            <div className="max-w-7xl mx-auto px-6 lg:px-8 py-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                <span className="font-medium text-gray-700 dark:text-gray-300">© {year} RotaSphere. All rights reserved.</span>
                <span>·</span>
                <Link href="/privacy" className="hover:underline text-gray-600 dark:text-gray-300">
                  Privacy
                </Link>
                <span>·</span>
                <Link href="/privacy-center" className="hover:underline text-gray-600 dark:text-gray-300 font-bold text-[#0758fc]">
                  Privacy Center
                </Link>
                <span>·</span>
                <Link href="/terms" className="hover:underline text-gray-600 dark:text-gray-300">
                  Terms
                </Link>
                <span>·</span>
                <Link href="/cookies" className="hover:underline text-gray-600 dark:text-gray-300">
                  Cookies
                </Link>
                <span>·</span>
                <Link href="/accessibility" className="hover:underline text-gray-600 dark:text-gray-300">
                  Accessibility
                </Link>
                <span>·</span>
                <Link href="/sitemap" className="hover:underline text-gray-600 dark:text-gray-300">
                  Sitemap
                </Link>
              </div>

              {/* Install App Button, Social icons & Theme toggle */}
              <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
                <button
                  type="button"
                  onClick={() => triggerPwaInstall()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 text-xs font-black text-[#0758fc] dark:text-blue-400 transition-all cursor-pointer hover:scale-105 active:scale-95"
                  title="Install Web App on your device"
                >
                  <Download size={13} />
                  <span>Install App</span>
                </button>
                <ThemeToggle />
                <a
                  href="https://instagram.com/rotaract3192"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
                <a
                  href="https://linkedin.com/company/rotaract3192"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                  className="hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
  );
}
