import Link from "next/link";
import {
  Compass,
  Ticket,
  Building,
  Scale,
  LifeBuoy,
  ShieldCheck,
  Globe,
  ArrowRight,
} from "lucide-react";
import { LastUpdatedBadge } from "@/components/ui/LastUpdatedBadge";

export const metadata = {
  title: "HTML Sitemap | RotaSphere District 3192",
  description:
    "Complete directory and index of all public pages, attendee pass tools, organizer studios, legal policies, and support desks on RotaSphere.",
};

const SITEMAP_SECTIONS = [
  {
    title: "1. Event Discovery & District 3192",
    icon: Compass,
    color: "text-[#1e9df1] bg-blue-50 dark:bg-blue-950/50",
    links: [
      { label: "Home / Platform Overview", href: "/" },
      { label: "Events Discovery & Filters", href: "/events" },
      { label: "Rotaract Clubs Directory", href: "/clubs" },
      { label: "District 3192 Council & Leadership", href: "/district" },
      { label: "District Photo Gallery & Highlights", href: "/gallery" },
      { label: "About RotaSphere", href: "/about" },
      { label: "Careers & Volunteer Opportunities", href: "/careers" },
    ],
  },
  {
    title: "2. Attendee Portal & Pass Management",
    icon: Ticket,
    color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50",
    links: [
      { label: "My Passes & Digital QR Badges", href: "/tickets" },
      { label: "Privacy Center & Consent Management", href: "/privacy-center" },
      { label: "Sign In / SSO Login", href: "/sign-in" },
      { label: "Sign Up / Create Account", href: "/sign-up" },
    ],
  },
  {
    title: "3. Organizer Tools & Venue Gates",
    icon: Building,
    color: "text-amber-600 bg-amber-50 dark:bg-amber-950/50",
    links: [
      { label: "Organizer Dashboard & Event Studio", href: "/dashboard" },
      { label: "Venue Gate QR Check-in Scanner", href: "/check-in" },
      { label: "Super Admin Governance Console", href: "/admin" },
      { label: "Organizer Broadcast Notifications", href: "/dashboard/broadcast" },
    ],
  },
  {
    title: "4. Legal, Privacy & DPDP Compliance",
    icon: Scale,
    color: "text-purple-600 bg-purple-50 dark:bg-purple-950/50",
    links: [
      { label: "Privacy Policy & Data Notice (DPDP 2023)", href: "/privacy" },
      { label: "Privacy Center Dashboard", href: "/privacy-center" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Cookie Policy & Preferences", href: "/cookies" },
      { label: "Accessibility Statement (WCAG 2.1 AA)", href: "/accessibility" },
      { label: "XML Sitemap Feed", href: "/sitemap.xml" },
    ],
  },
  {
    title: "5. Support, Refunds & Dispute Desk",
    icon: LifeBuoy,
    color: "text-rose-600 bg-rose-50 dark:bg-rose-950/50",
    links: [
      { label: "Help Centre & Searchable FAQs", href: "/help" },
      { label: "Contact Us & Case Filing Hub", href: "/contact" },
      { label: "Event Cancellation Policy", href: "/cancellation-policy" },
      { label: "Refund Policy & Settlement Terms", href: "/refund-policy" },
      { label: "Dispute Resolution & Ombudsman Desk", href: "/disputes" },
    ],
  },
  {
    title: "6. Platform Security & Monitoring",
    icon: ShieldCheck,
    color: "text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800",
    links: [
      { label: "Platform Security & Cryptographic Tokens", href: "/security" },
      { label: "Live System Status & Gateway Health", href: "/status" },
    ],
  },
];

export default function SitemapPage() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24 transition-colors">
      {/* ── 1. HERO HEADER ──────────────────────────────────────────────── */}
      <section className="bg-gray-900 text-white py-16 sm:py-20 px-4 sm:px-6 lg:px-8 text-center relative overflow-hidden">
        <div className="w-full max-w-3xl mx-auto space-y-4 relative z-10">
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <span className="text-xs font-black uppercase tracking-widest text-[#60a5fa] bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full inline-flex items-center gap-1.5">
              <Globe size={14} /> Platform Directory
            </span>
            <LastUpdatedBadge date="2026-08-18" label="Sitemap indexed" />
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            HTML Sitemap
          </h1>
          <p className="text-sm sm:text-base text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Index and quick navigation for all public event pages, attendee pass tools, organizer studios, legal documents, and support channels.
          </p>
        </div>
      </section>

      {/* ── 2. SITEMAP DIRECTORY GRID ───────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SITEMAP_SECTIONS.map((sec) => (
            <div
              key={sec.title}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 sm:p-7 shadow-xs space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${sec.color}`}>
                  <sec.icon size={18} />
                </div>
                <h2 className="text-sm font-black text-gray-900 dark:text-white">
                  {sec.title}
                </h2>
              </div>

              <ul className="space-y-2 pt-1">
                {sec.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-[#1e9df1] dark:hover:text-[#1e9df1] hover:underline transition-colors flex items-center gap-1.5"
                    >
                      <ArrowRight size={12} className="text-gray-400 shrink-0" />
                      <span>{link.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
