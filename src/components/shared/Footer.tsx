"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { LastUpdatedBadge } from "@/components/ui/LastUpdatedBadge";
import { DirectoryVerificationModal } from "@/components/shared/DirectoryVerificationModal";

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
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const year = new Date().getFullYear();

  return (
    <>
      <footer role="contentinfo" className="bg-gray-50 dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 mt-16 transition-colors">
        {/* ── Main link columns ───────────────────────────────────────────── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10">
            {/* Brand & Mission Column (spans 2 on desktop) */}
            <div className="sm:col-span-2 space-y-4 pr-0 lg:pr-6">
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
                    Rota<span className="text-[#1e9df1]">Sphere</span>
                  </span>
                  <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#1e9df1] mt-0.5">
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

        {/* ── Operating Entity & Directory Verification Band ─────────────────── */}
        <div className="border-t border-gray-200 dark:border-gray-800 bg-gray-100/70 dark:bg-gray-900/60 py-4 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-[11px] text-gray-500 dark:text-gray-400">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 sm:gap-4 text-center md:text-left">
              <span>
                Operating Entity: <strong className="text-gray-700 dark:text-gray-300">RotaSphere Platform Operations / Rotaract District 3192 Secretariat</strong>
              </span>
              <span className="hidden sm:inline">·</span>
              <span className="text-gray-400">Bengaluru, Karnataka, India</span>
              <span className="hidden sm:inline">·</span>
              <span className="font-mono text-[10px] bg-gray-200/80 dark:bg-gray-800 px-2 py-0.5 rounded text-gray-600 dark:text-gray-300">
                v2.4.0-prod
              </span>
            </div>

            <div className="flex items-center gap-2">
              <LastUpdatedBadge
                label="Directory verified"
                date="2026-08-18"
                onClick={() => setShowVerificationModal(true)}
              />
            </div>
          </div>
        </div>

        {/* ── Legal & Copyright Band ────────────────────────────────────────── */}
        <div className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 sm:gap-3 text-xs text-gray-500 dark:text-gray-400">
              <span className="font-medium text-gray-700 dark:text-gray-300">© {year} RotaSphere. All rights reserved.</span>
              <span>·</span>
              <Link href="/privacy" className="hover:underline text-gray-600 dark:text-gray-300">
                Privacy
              </Link>
              <span>·</span>
              <Link href="/privacy-center" className="hover:underline text-gray-600 dark:text-gray-300 font-bold text-[#1e9df1]">
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

            {/* Social icons & Theme toggle */}
            <div className="flex items-center gap-4 text-gray-500 dark:text-gray-400">
              <ThemeToggle />
              <a
                href="https://facebook.com/rotaract3192"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a
                href="https://x.com/rotaract3192"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="X (Twitter)"
                className="hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
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
      </footer>

      {/* Directory Verification Modal */}
      <DirectoryVerificationModal
        isOpen={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
      />
    </>
  );
}
