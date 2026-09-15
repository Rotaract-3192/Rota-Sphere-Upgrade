/**
 * RotaSphere — Homepage
 * Modern Entertainment & Discovery Layout inspired by BookMyShow UX patterns.
 * Clean light & dark theme support with real-time stats and directDb data.
 */

import { Suspense } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { executeSql } from "@/lib/db/directDb";
import { EventMapExplorer } from "@/components/events/EventMapExplorer";
import { ContactForm } from "@/components/events/ContactForm";
import { HomeGreetingBar } from "@/components/home/HomeGreetingBar";
import { HomeCategoryIcons } from "@/components/home/HomeCategoryIcons";
import { FeaturedHeroCarousel } from "@/components/home/FeaturedHeroCarousel";
import { MarqueePromoStrip } from "@/components/home/MarqueePromoStrip";
import { RecommendedEventsSection } from "@/components/home/RecommendedEventsSection";
import { ClubsSpotlightSection } from "@/components/home/ClubsSpotlightSection";
import {
  Sparkles,
  Calendar,
  MapPin,
  ArrowRight,
  Phone,
  Mail,
  Ticket,
  Users,
  QrCode,
  Search,
  Zap,
} from "lucide-react";

export const metadata: Metadata = {
  title: "RotaSphere — District 3192 Rotaract Experience & Ticketing",
  description:
    "Discover, register, and experience flagship Rotaract events, conferences, workshops, and youth leadership summits across 85 chartered clubs in District 3192.",
  keywords: [
    "Rotaract District 3192",
    "Rotaract Bangalore",
    "District 3192 events",
    "youth events Bangalore",
    "event ticketing",
    "Rotary International Zone 5",
    "college fests Bangalore",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "RotaSphere — District 3192 Rotaract Experience & Ticketing",
    description:
      "Discover, register, and experience flagship Rotaract events, conferences, and workshops across District 3192.",
    url: "/",
    siteName: "RotaSphere District 3192",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "/brand-logo.png",
        width: 1200,
        height: 630,
        alt: "RotaSphere District 3192",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "RotaSphere — District 3192 Rotaract Platform",
    description: "Official event ticketing and club discovery platform for Rotaract District 3192.",
    images: ["/brand-logo.png"],
  },
};

export const revalidate = 60;

// Fetch real platform stats from DB
async function getPlatformStats() {
  try {
    const [clubs, events, passes] = await Promise.all([
      executeSql(`SELECT COUNT(*) as count FROM organizations WHERE status = 'ACTIVE';`),
      executeSql(`SELECT COUNT(*) as count FROM saas_events WHERE status = 'PUBLISHED' AND deleted_at IS NULL;`),
      executeSql(`SELECT COUNT(*) as count FROM saas_tickets WHERE status = 'CONFIRMED';`),
    ]);

    return {
      clubs: Number(clubs.data?.[0]?.count ?? 0),
      events: Number(events.data?.[0]?.count ?? 0),
      passes: Number(passes.data?.[0]?.count ?? 0),
    };
  } catch {
    return { clubs: 0, events: 0, passes: 0 };
  }
}

async function getMapEvents() {
  try {
    const { data } = await executeSql(`
      SELECT e.*, 
        COALESCE(
          json_agg(
            json_build_object(
              'id', t.id,
              'name', t.name,
              'price', t.price,
              'total_capacity', t.total_capacity,
              'sales_start', t.sales_start,
              'sales_end', t.sales_end,
              'is_active', t.is_active
            )
          ) FILTER (WHERE t.id IS NOT NULL),
          '[]'
        ) as saas_ticket_tiers
      FROM saas_events e
      LEFT JOIN saas_ticket_tiers t ON e.id = t.event_id
      WHERE e.status = 'PUBLISHED' AND (e.deleted_at IS NULL)
      GROUP BY e.id
      ORDER BY e.created_at DESC NULLS LAST, e.start_date DESC
      LIMIT 12;
    `);
    return data || [];
  } catch {
    return [];
  }
}

async function getFeaturedHeroEvents() {
  try {
    const { data } = await executeSql(`
      SELECT e.id, e.title, e.slug, e.summary, e.description, e.cover_image_url, e.thumbnail_url, e.venue_name, e.city, e.start_date, e.event_type,
        o.name as organization_name,
        cat.name as category_name,
        COALESCE(
          (SELECT MIN(price) FROM saas_ticket_tiers WHERE event_id = e.id AND is_active = true),
          0
        ) as min_price,
        EXISTS (
          SELECT 1 FROM saas_ticket_tiers WHERE event_id = e.id AND (is_bulk_slab = true OR name ILIKE '%bulk%')
        ) as has_bulk_slab
      FROM saas_events e
      LEFT JOIN organizations o ON e.organization_id = o.id
      LEFT JOIN event_categories cat ON e.category_id = cat.id
      WHERE e.status = 'PUBLISHED' AND e.deleted_at IS NULL
      ORDER BY (CASE WHEN e.slug = 'vibe-rotaract-freshers-party' THEN 0 WHEN e.slug = 'project-jatayu-30' THEN 1 ELSE 2 END), e.start_date DESC
      LIMIT 5;
    `);
    return data || [];
  } catch {
    return [];
  }
}

async function getRecommendedEvents() {
  try {
    const { data } = await executeSql(`
      SELECT e.id, e.title, e.slug, e.summary, e.thumbnail_url, e.cover_image_url, e.venue_name, e.city, e.start_date,
        o.name as organization_name,
        cat.name as category_name,
        COALESCE(
          (SELECT MIN(price) FROM saas_ticket_tiers WHERE event_id = e.id AND is_active = true),
          0
        ) as min_price,
        EXISTS (
          SELECT 1 FROM saas_ticket_tiers WHERE event_id = e.id AND (is_bulk_slab = true OR name ILIKE '%bulk%')
        ) as has_bulk_slab
      FROM saas_events e
      LEFT JOIN organizations o ON e.organization_id = o.id
      LEFT JOIN event_categories cat ON e.category_id = cat.id
      WHERE e.status = 'PUBLISHED' AND e.deleted_at IS NULL
      ORDER BY e.created_at DESC NULLS LAST, e.start_date DESC
      LIMIT 8;
    `);
    return data || [];
  } catch {
    return [];
  }
}

async function getSpotlightClubs() {
  try {
    const { data } = await executeSql(`
      SELECT o.id, o.name, o.slug, o.logo_url, o.city,
        COUNT(e.id) as event_count
      FROM organizations o
      LEFT JOIN saas_events e ON e.organization_id = o.id AND e.status = 'PUBLISHED' AND e.deleted_at IS NULL
      WHERE o.status = 'ACTIVE'
      GROUP BY o.id
      ORDER BY event_count DESC, o.name ASC
      LIMIT 8;
    `);
    return (data || []).map((c: any) => ({
      ...c,
      event_count: Number(c.event_count || 0),
    }));
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const [stats, mapEvents, featuredEvents, recommendedEvents, spotlightClubs] = await Promise.all([
    getPlatformStats(),
    getMapEvents(),
    getFeaturedHeroEvents(),
    getRecommendedEvents(),
    getSpotlightClubs(),
  ]);

  const statItems = [
    { icon: Users, value: stats.clubs > 0 ? `${stats.clubs}+` : "85+", label: "Chartered Clubs" },
    { icon: Calendar, value: stats.events > 0 ? `${stats.events}` : "—", label: "Published Events" },
    { icon: Ticket, value: stats.passes > 0 ? `${stats.passes}` : "—", label: "Passes Issued" },
    { icon: QrCode, value: "Instant", label: "Gate QR Verification" },
  ];

  return (
    <div className="bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 min-h-screen font-sans transition-colors">
      
      {/* ── 1. GREETING & LOCATION ZONE BAR ──────────────────────────────── */}
      <HomeGreetingBar />

      {/* ── 2. CIRCULAR CATEGORY ICONS STRIP ──────────────────────────────── */}
      <Suspense fallback={<div className="h-20" />}>
        <HomeCategoryIcons />
      </Suspense>

      {/* ── 3. SEARCH & DISCOVERY BAR ─────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-2">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Search Input Box */}
          <form
            action="/events"
            method="GET"
            data-tour="search-bar"
            className="flex-1 flex items-center bg-gray-50 dark:bg-gray-900 hover:bg-gray-100/80 dark:hover:bg-gray-800/80 focus-within:bg-white dark:focus-within:bg-gray-900 border border-gray-200 dark:border-gray-800 focus-within:border-[#0758fc] rounded-2xl p-1.5 transition-all shadow-xs"
          >
            <Search size={18} className="text-gray-400 ml-3 shrink-0" />
            <input
              type="text"
              name="q"
              placeholder="Search conferences, sports fests, cultural nights, or clubs..."
              className="w-full bg-transparent px-3 py-2 text-xs sm:text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none"
            />
            <button
              type="submit"
              className="bg-[#0758fc] hover:bg-[#054fe0] text-white font-extrabold text-xs sm:text-sm px-4 sm:px-5 py-2 rounded-xl transition-all shadow-sm shrink-0 cursor-pointer active:scale-95"
            >
              Search
            </button>
          </form>

          {/* Quick Trending Tags */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide text-xs" data-tour="trending-tags">
            <span className="text-[11px] font-bold text-gray-400 dark:text-gray-500 whitespace-nowrap">Trending:</span>
            <Link
              href="/events?category=festival"
              className="px-2.5 py-1 rounded-xl font-semibold bg-gray-100 dark:bg-gray-800/60 text-gray-700 dark:text-gray-300 hover:text-[#0758fc] whitespace-nowrap transition-colors"
            >
              🌴 Freshers
            </Link>
            <Link
              href="/events?category=sports"
              className="px-2.5 py-1 rounded-xl font-semibold bg-gray-100 dark:bg-gray-800/60 text-gray-700 dark:text-gray-300 hover:text-[#0758fc] whitespace-nowrap transition-colors"
            >
              🏆 Sports
            </Link>
            <Link
              href="/clubs"
              className="px-2.5 py-1 rounded-xl font-semibold bg-gray-100 dark:bg-gray-800/60 text-gray-700 dark:text-gray-300 hover:text-[#0758fc] whitespace-nowrap transition-colors"
            >
              🏛️ 85 Clubs
            </Link>
          </div>

        </div>
      </section>

      {/* ── 4. FEATURED HERO BANNER CAROUSEL ──────────────────────────────── */}
      <FeaturedHeroCarousel events={featuredEvents} />

      {/* ── 5. MARQUEE PROMOTIONAL BANNER STRIP ───────────────────────────── */}
      <MarqueePromoStrip />

      {/* ── 6. RECOMMENDED EVENTS (POSTER CARDS 2:3) ──────────────────────── */}
      <RecommendedEventsSection events={recommendedEvents} title="Recommended Events" seeAllHref="/events" />

      {/* ── 7. CHARTERED CLUBS IN SPOTLIGHT ───────────────────────────────── */}
      <ClubsSpotlightSection clubs={spotlightClubs} />

      {/* ── 8. INTERACTIVE VENUE MAP & LOCATION EXPLORER ──────────────────── */}
      <section data-tour="map-explorer" className="bg-gray-50/70 dark:bg-gray-900/50 border-y border-gray-200/90 dark:border-gray-800 py-12 sm:py-16 px-4 sm:px-6 lg:px-8 transition-colors">
        <div className="max-w-7xl mx-auto">
          <EventMapExplorer
            events={mapEvents}
            title="District 3192 Interactive Venue Map"
            subtitle="Explore Rotaract conferences, conventions, and festivals geographically across Bengaluru and surrounding zones."
          />
        </div>
      </section>

      {/* ── 9. REAL-TIME PLATFORM STATS BAR ───────────────────────────────── */}
      <section data-tour="stats-bar" className="border-b border-gray-100 dark:border-gray-800/80 bg-white dark:bg-gray-950 py-8 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 divide-y sm:divide-y-0 sm:divide-x divide-gray-100 dark:divide-gray-800">
            {statItems.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={i} className="flex flex-col items-center justify-center gap-1 py-4 px-3 text-center">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-[#0758fc] flex items-center justify-center mb-1">
                    <Icon size={20} />
                  </div>
                  <span className="text-2xl sm:text-3xl font-black text-gray-950 dark:text-white">{stat.value}</span>
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{stat.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 10. GET IN TOUCH & DISTRICT CONTACT ────────────────────────────── */}
      <section className="bg-gray-50 dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800 py-12 sm:py-16 px-4 sm:px-6 lg:px-8 transition-colors">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 sm:p-10 shadow-xs space-y-6 sm:space-y-0">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-5 space-y-3 sm:space-y-4">
                <div className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-black text-[#0758fc] uppercase tracking-widest">
                  <Mail size={14} /> District 3192 Support
                </div>
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-gray-900 dark:text-white tracking-tight leading-snug">
                  Want to host or have ticketing questions?
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  Our District IT Team responds within 24 hours to assist with club registrations, event hosting, and delegate pass inquiries.
                </p>
                <div className="space-y-2 pt-2 text-xs text-gray-600 dark:text-gray-300">
                  <a
                    href="mailto:tech.rotaract3192@gmail.com"
                    className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-[#0758fc] transition-colors"
                  >
                    <Mail size={14} className="text-[#0758fc] shrink-0" /> tech.rotaract3192@gmail.com
                  </a>
                  <p className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <Phone size={14} className="text-[#0758fc] shrink-0" /> District 3192 Helpline
                  </p>
                </div>
              </div>

              <ContactForm />
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
