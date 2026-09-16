/**
 * RotaSphere — Homepage
 * Clean, high-end, cohesive single-theme layout tailored for Rotaract District 3192.
 * Real-time event data, pass pricing, category discovery, interactive venue map, and direct backend queries.
 */

import { Suspense } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { executeSql } from "@/lib/db/directDb";
import { ServerEventGrid, EventGridSkeleton } from "@/components/events/EventGrid";
import { EventMapExplorer } from "@/components/events/EventMapExplorer";
import { CategoryStrip } from "@/components/events/CategoryStrip";
import { ContactForm } from "@/components/events/ContactForm";
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
              'is_active', t.is_active,
              'is_bulk_slab', COALESCE(t.is_bulk_slab, false),
              'bulk_slab_size', t.bulk_slab_size
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

async function getFeaturedHeroEvent() {
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
      ORDER BY (CASE WHEN e.slug = 'vibe' THEN 0 WHEN e.slug = 'project-jatayu-30' THEN 1 ELSE 2 END), e.start_date DESC
      LIMIT 1;
    `);
    return data && data[0] ? data[0] : null;
  } catch {
    return null;
  }
}

export default async function HomePage() {
  const [stats, mapEvents, heroEvent] = await Promise.all([
    getPlatformStats(),
    getMapEvents(),
    getFeaturedHeroEvent(),
  ]);

  const statItems = [
    { icon: Users, value: stats.clubs > 0 ? `${stats.clubs}+` : "85+", label: "Chartered Clubs" },
    { icon: Calendar, value: stats.events > 0 ? `${stats.events}` : "—", label: "Published Events" },
    { icon: Ticket, value: stats.passes > 0 ? `${stats.passes}` : "—", label: "Passes Issued" },
    { icon: QrCode, value: "Instant", label: "Gate QR Verification" },
  ];

  return (
    <div className="bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 min-h-screen font-sans transition-colors">

      {/* ── 1. HERO SECTION ─────────────────────────────────────────────── */}
      <section className="relative bg-[#060b17] text-white overflow-hidden py-14 sm:py-20 lg:py-24 border-b border-gray-800/80">
        {/* Radiant Ambient Mesh Glows */}
        <div className="absolute -top-40 -right-40 w-96 h-96 sm:w-[580px] sm:h-[580px] bg-gradient-to-br from-[#0758fc]/30 via-indigo-600/20 to-purple-600/10 rounded-full blur-[130px] pointer-events-none" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 sm:w-[520px] sm:h-[520px] bg-gradient-to-tr from-blue-600/20 via-sky-500/15 to-transparent rounded-full blur-[110px] pointer-events-none" />

        {/* Subtle dot matrix texture overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none opacity-60" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            
            {/* ── LEFT: Headline, Search & Direct Discovery ── */}
            <div className="lg:col-span-7 space-y-6 text-left">
              {/* Headline */}
              <h1 className="text-4xl sm:text-6xl lg:text-[62px] font-black tracking-tight leading-[1.08] text-white">
                Experience <br className="hidden sm:inline" />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-200 to-sky-300">
                  Starts Here.
                </span>
              </h1>

              {/* Subheading */}
              <p className="text-sm sm:text-base lg:text-lg text-gray-300/95 leading-relaxed max-w-xl font-normal">
                Discover and secure official delegate passes for flagship conferences, youth summits, cultural fests, and sports tournaments across District 3192.
              </p>

              {/* Instant Quick Search Discovery Form */}
              <form
                action="/events"
                method="GET"
                data-tour="search-bar"
                className="max-w-xl flex items-center bg-white/10 hover:bg-white/[0.13] focus-within:bg-white/[0.16] border border-white/20 focus-within:border-[#0758fc] rounded-2xl p-1.5 transition-all shadow-2xl backdrop-blur-md"
              >
                <Search size={18} className="text-gray-400 ml-3 shrink-0" />
                <input
                  type="text"
                  name="q"
                  placeholder="Search events, fests, or host clubs..."
                  className="w-full bg-transparent px-3 py-2.5 text-xs sm:text-sm text-white placeholder-gray-400 outline-none"
                />
                <button
                  type="submit"
                  className="bg-[#0758fc] hover:bg-[#054fe0] text-white font-extrabold text-xs sm:text-sm px-5 py-2.5 rounded-xl transition-all shadow-md shrink-0 cursor-pointer active:scale-95"
                >
                  Find Passes
                </button>
              </form>

              {/* Popular Category Shortcuts */}
              <div className="flex flex-wrap items-center gap-2 pt-1" data-tour="trending-tags">
                <span className="text-xs font-bold text-gray-400">Trending:</span>
                <Link
                  href="/events?category=entertainment"
                  className="px-3 py-1 rounded-lg text-xs font-semibold bg-white/5 hover:bg-white/15 text-gray-300 border border-white/10 transition-colors"
                >
                  🌴 Freshers &amp; Socials
                </Link>
                <Link
                  href="/events?category=sports"
                  className="px-3 py-1 rounded-lg text-xs font-semibold bg-white/5 hover:bg-white/15 text-gray-300 border border-white/10 transition-colors"
                >
                  🏆 Sports Leagues
                </Link>
                <Link
                  href="/clubs"
                  className="px-3 py-1 rounded-lg text-xs font-semibold bg-white/5 hover:bg-white/15 text-gray-300 border border-white/10 transition-colors"
                >
                  🏛️ 85 Clubs Directory
                </Link>
              </div>

              {/* Trust Bar (Clean - District certified) */}
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-3 border-t border-white/10 text-xs text-gray-400">
                <div className="flex items-center gap-1.5">
                  <Zap size={14} className="text-[#60a5fa]" />
                  <span>Instant QR Gate Pass</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <QrCode size={14} className="text-emerald-400" />
                  <span>100% Direct UPI &amp; Verification</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Ticket size={14} className="text-amber-400" />
                  <span>Group &amp; Club Bulk Slabs</span>
                </div>
              </div>
            </div>

            {/* ── RIGHT: Hero Featured Event Showcase Pass ── */}
            <div className="lg:col-span-5 flex justify-center lg:justify-end">
              {heroEvent ? (
                <div className="relative w-full max-w-md group" data-tour="event-card">
                  {/* Outer Radiant Glow */}
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-400 rounded-3xl blur-md opacity-30 group-hover:opacity-60 transition duration-500" />

                  {/* Card Container */}
                  <div className="relative bg-[#0c1427]/95 border border-white/15 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl flex flex-col">
                    
                    {/* Poster */}
                    <div className="relative aspect-[16/10] w-full overflow-hidden bg-gray-900">
                      {heroEvent.cover_image_url || heroEvent.thumbnail_url ? (
                        <Image
                          src={heroEvent.cover_image_url || heroEvent.thumbnail_url}
                          alt={heroEvent.title}
                          fill
                          sizes="(max-width: 640px) 100vw, 420px"
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-sm font-black text-gray-500">
                          RotaSphere 3192
                        </div>
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-gray-950/90 via-gray-950/30 to-black/40" />

                      {/* Top Badges */}
                      <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
                        <span className="flex items-center gap-1 bg-black/65 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-extrabold text-white border border-white/20 shadow-xs">
                          <Sparkles size={11} className="text-amber-400" />
                          Featured Flagship
                        </span>
                        <span className="flex items-center gap-1 bg-emerald-500/90 text-white px-2 py-0.5 rounded-full text-[10px] font-bold shadow-xs">
                          ● Open for Booking
                        </span>
                      </div>

                      {/* Bottom Floating Price & Date */}
                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white z-10">
                        <span className="text-xs font-mono font-extrabold bg-[#0758fc]/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-blue-400/40 shadow-sm">
                          {Number(heroEvent.min_price) === 0 ? "Free Entry" : `From ₹${Number(heroEvent.min_price).toLocaleString("en-IN")}`}
                        </span>
                        <span className="text-[11px] font-bold text-gray-200 flex items-center gap-1 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/15">
                          <Calendar size={12} className="text-amber-400" />
                          {new Date(heroEvent.start_date).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            timeZone: "Asia/Kolkata",
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Content Details */}
                    <div className="p-5 space-y-3">
                      <div className="flex items-center gap-1.5 text-xs text-gray-400 font-semibold truncate">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0758fc] shrink-0" />
                        <span className="truncate">{heroEvent.organization_name || "Rotaract District 3192"}</span>
                      </div>

                      <h3 className="text-lg font-black text-white leading-snug group-hover:text-blue-400 transition-colors line-clamp-1">
                        {heroEvent.title}
                      </h3>

                      <p className="text-xs text-gray-300 line-clamp-2 leading-relaxed">
                        {heroEvent.summary || "Join fellow Rotaractors and guests for this featured flagship district event."}
                      </p>

                      <div className="flex items-center justify-between pt-1 text-xs text-gray-400">
                        <div className="flex items-center gap-1.5 truncate">
                          <MapPin size={13} className="text-[#0758fc] shrink-0" />
                          <span className="truncate font-medium">{heroEvent.venue_name || heroEvent.city || "Bengaluru"}</span>
                        </div>
                        {heroEvent.has_bulk_slab && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-300 bg-purple-950/60 border border-purple-800 px-2 py-0.5 rounded-md shrink-0">
                            <Users size={10} /> Bulk Deals
                          </span>
                        )}
                      </div>

                      {/* Action Button */}
                      <Link
                        href={`/events/${heroEvent.slug}`}
                        data-tour="hero-event-action"
                        className="w-full mt-2 py-3 rounded-xl bg-[#0758fc] hover:bg-[#054fe0] active:scale-95 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 transition-all cursor-pointer"
                      >
                        <span>Book Delegate Pass</span>
                        <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative w-full max-w-md bg-[#0c1427]/90 border border-white/15 rounded-3xl p-8 text-center space-y-4 shadow-2xl">
                  <Ticket size={44} className="mx-auto text-[#0758fc]" />
                  <h3 className="text-lg font-black text-white">Explore Upcoming Passes</h3>
                  <p className="text-xs text-gray-400">Browse official conferences, summits, and workshops.</p>
                  <Link
                    href="/events"
                    className="inline-block px-6 py-3 rounded-xl bg-[#0758fc] text-white font-extrabold text-xs"
                  >
                    View All Events
                  </Link>
                </div>
              )}
            </div>

          </div>
        </div>
      </section>

      {/* ── 2. REAL-TIME STATS BAR ────────────────────────────────────────── */}
      <section data-tour="stats-bar" className="border-b border-gray-100 dark:border-gray-800/80 bg-white dark:bg-gray-900 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-gray-100 dark:divide-gray-800">
            {statItems.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={i} className="flex flex-col items-center justify-center gap-1 py-5 px-3 text-center">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#0758fc] flex items-center justify-center mb-1">
                    <Icon size={18} />
                  </div>
                  <span className="text-2xl sm:text-3xl font-black text-gray-950 dark:text-white">{stat.value}</span>
                  <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{stat.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 3. CATEGORY PILLS BAR ─────────────────────────────────────────── */}
      <CategoryStrip />

      {/* ── 4. UPCOMING DISTRICT EVENTS FEED ──────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0758fc] uppercase tracking-wider mb-2">
              <Calendar size={14} /> Upcoming Flagship Events
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Featured Conventions &amp; Meets
            </h2>
          </div>
          <Link
            href="/events"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-[#0758fc] hover:text-[#054fe0] transition-colors"
          >
            Explore all events <ArrowRight size={16} />
          </Link>
        </div>

        <Suspense fallback={<EventGridSkeleton count={6} />}>
          <ServerEventGrid limit={8} />
        </Suspense>
      </section>

      {/* ── 5. INTERACTIVE EVENT MAP & VENUE DISCOVERY ─────────────────────── */}
      <section data-tour="map-explorer" className="bg-gray-50/70 dark:bg-gray-900/50 border-y border-gray-200/90 dark:border-gray-800 py-14 sm:py-18 px-4 sm:px-6 lg:px-8 transition-colors">
        <div className="max-w-7xl mx-auto">
          <EventMapExplorer
            events={mapEvents}
            title="Interactive Event Map &amp; Venue Discovery"
            subtitle="Locate Rotaract conferences, conventions, and youth festivals across District 3192 on the map."
          />
        </div>
      </section>

      {/* ── 6. ABOUT THE ROTASPHERE JOURNEY ─────────────────────────────────── */}
      <section className="py-14 sm:py-18 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800 transition-colors">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-[#0758fc] uppercase tracking-widest mb-2">
              <Calendar size={14} /> The Rotasphere Journey
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Unified Ticketing &amp; Passes
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-2 max-w-xl mx-auto">
              Curated itineraries for youth leaders across Bengaluru, Tumakuru, Kolar, and Chikkaballapura.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* Left Narrative */}
            <div className="lg:col-span-5 space-y-4">
              <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white leading-snug">
                Designed for Young Changemakers Across District 3192.
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                Zero booking confusion, transparent pass pricing, instant UPI payment verification, and gate check-in via cryptographic QR passes.
              </p>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 rounded-2xl p-4 text-center">
                  <p className="text-2xl sm:text-3xl font-black text-[#0758fc]">
                    {stats.events > 0 ? stats.events : "3"}
                  </p>
                  <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-1">Live Events</p>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/50 rounded-2xl p-4 text-center">
                  <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
                    {stats.clubs > 0 ? `${stats.clubs}+` : "85+"}
                  </p>
                  <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-1">Chartered Clubs</p>
                </div>
              </div>
            </div>

            {/* Right Live Timeline of Events */}
            <div className="lg:col-span-7 space-y-4 relative pl-6 border-l-2 border-[#0758fc]/20">
              {mapEvents.slice(0, 3).map((item: any, i: number) => (
                <div key={item.id || i} className="relative group">
                  {/* Timeline dot */}
                  <div className="absolute -left-[31px] top-5 w-4 h-4 rounded-full bg-[#0758fc] border-4 border-white dark:border-gray-950 shadow-md group-hover:scale-125 transition-transform" />

                  <div className="bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:border-[#0758fc]/30 rounded-2xl p-4 sm:p-5 transition-all duration-300 hover:shadow-md">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1.5">
                      <span className="text-[11px] font-bold text-[#0758fc] uppercase tracking-wider">
                        {new Date(item.start_date).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })} · {item.city || "Karnataka"}
                      </span>
                    </div>
                    <h4 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-1">{item.title}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{item.summary || item.description || "Official Rotaract District 3192 event."}</p>

                    <div className="mt-3 flex items-center justify-between">
                      <Link
                        href={`/events/${item.slug}`}
                        className="text-xs font-bold text-[#0758fc] hover:underline flex items-center gap-1"
                      >
                        View Details <ArrowRight size={12} />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. CONTACT / INQUIRY FORM ─────────────────────────────────────── */}
      <section className="bg-gray-50 dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800 py-12 sm:py-16 px-4 sm:px-6 lg:px-8 transition-colors">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white dark:bg-gray-900 border border-gray-200/90 dark:border-gray-800 rounded-3xl p-6 sm:p-10 shadow-xs space-y-6 sm:space-y-0">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-5 space-y-3 sm:space-y-4">
                <div className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-black text-[#0758fc] uppercase tracking-widest">
                  <Mail size={14} /> District Support
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
