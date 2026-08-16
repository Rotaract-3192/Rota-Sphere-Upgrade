/**
 * Footer — Airbnb Light Footer
 * DESIGN-airbnb.md §footer-light: 3 columns, legal band, SVG social links
 */

import Link from "next/link";
import Image from "next/image";

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
    heading: "Organizers",
    links: [
      { label: "Host an Event", href: "/dashboard" },
      { label: "Organizer Dashboard", href: "/dashboard" },
      { label: "Event Gallery", href: "/gallery" },
      { label: "Staff Check-in Scanner", href: "/check-in" },
      { label: "Community Forum", href: "/help" },
    ],
  },
  {
    heading: "RotaSphere",
    links: [
      { label: "About Us", href: "/about" },
      { label: "District 3192", href: "/district" },
      { label: "Events Discovery", href: "/events" },
      { label: "Photo Gallery", href: "/gallery" },
      { label: "Careers", href: "/careers" },
    ],
  },
] as const;

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer role="contentinfo" className="bg-gray-50 border-t border-gray-200 mt-16">
      {/* ── Main link columns ───────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info Column */}
          <div className="space-y-3">
            <Link href="/" className="flex items-center gap-3">
              <div className="relative w-11 h-11 shrink-0 rounded-2xl overflow-hidden shadow-xs bg-white">
                <Image
                  src="/brand/logo.png"
                  alt="Rotaract District 3192 Ticketing Logo"
                  fill
                  className="object-contain"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-black tracking-tight text-lg text-gray-900 leading-none">
                  Rota<span className="text-[#0052ff]">Sphere</span>
                </span>
                <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#0052ff]">
                  District 3192
                </span>
              </div>
            </Link>
            <p className="text-xs text-gray-500 leading-relaxed pr-4">
              Official Multi-Tenant Ticketing, Fellowship Passes, and Gate Verification Platform for Rotaract District 3192.
            </p>
          </div>
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.heading}>
              <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">
                {col.heading}
              </h3>
              <ul className="space-y-3" role="list">
                {col.links.map((link) => (
                  <li key={`${col.heading}-${link.label}-${link.href}`}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-600 hover:text-gray-900 hover:underline transition-colors"
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

      {/* ── Legal band ──────────────────────────────────────────────────── */}
      <div className="border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
            <span>© {year} RotaSphere, Inc.</span>
            <span>·</span>
            <Link href="/privacy" className="hover:underline text-gray-600">
              Privacy
            </Link>
            <span>·</span>
            <Link href="/terms" className="hover:underline text-gray-600">
              Terms
            </Link>
            <span>·</span>
            <Link href="/sitemap.xml" className="hover:underline text-gray-600">
              Sitemap
            </Link>
          </div>

          {/* Social icons */}
          <div className="flex items-center gap-4 text-gray-500">
            <a
              href="https://facebook.com/rotasphere"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="hover:text-gray-900 transition-colors"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </a>
            <a
              href="https://x.com/rotasphere"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="X (Twitter)"
              className="hover:text-gray-900 transition-colors"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
            <a
              href="https://instagram.com/rotasphere"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="hover:text-gray-900 transition-colors"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>
            <a
              href="https://linkedin.com/company/rotasphere"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="hover:text-gray-900 transition-colors"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
