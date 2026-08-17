/**
 * RotaSphere — Homepage
 * Clean white + blue design consistent with the rest of the platform.
 * Real-time stats fetched from DB.
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
  Sparkles, Calendar, MapPin, Award, ArrowRight,
  Phone, Mail, ShieldCheck, Ticket, Users, QrCode,
} from "lucide-react";

export const metadata: Metadata = {
  title: "RotaSphere — District 3192 Rotaract Experience",
  description: "Discover, register, and experience flagship Rotaract events, conferences, and fellowships across District 3192.",
};

export const revalidate = 60;

const INCLUDED_FEATURES = [
  {
    icon: Sparkles,
    title: "World-Class Keynotes",
    desc: "Inspirational sessions with global leaders, founder-Rotaractors, and changemakers.",
    color: "bg-blue-50 text-[#1e9df1]",
  },
  {
    icon: Ticket,
    title: "Verified Delegate Passes",
    desc: "Instant digital ticket confirmation with secure QR code verification.",
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    icon: MapPin,
    title: "Hospitality & Stay",
    desc: "Organized accommodations, airport transfers, and meals for outstation delegates.",
    color: "bg-amber-50 text-amber-600",
  },
  {
    icon: Award,
    title: "Certificates & Kits",
    desc: "Exclusive Rotaract delegate merchandise, badges, and official certificates.",
    color: "bg-purple-50 text-purple-600",
  },
];

// Fetch real platform stats from DB
async function getPlatformStats() {
  try {
    const [clubs, events, passes] = await Promise.all([
      executeSql(`SELECT COUNT(*) as count FROM organizations WHERE status = 'ACTIVE';`),
      executeSql(`SELECT COUNT(*) as count FROM saas_events WHERE status = 'PUBLISHED';`),
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
              'is_active', t.is_active
            )
          ) FILTER (WHERE t.id IS NOT NULL),
          '[]'
        ) as saas_ticket_tiers
      FROM saas_events e
      LEFT JOIN saas_ticket_tiers t ON e.id = t.event_id
      WHERE e.status = 'PUBLISHED' AND (e.deleted_at IS NULL)
      GROUP BY e.id
      ORDER BY e.start_date ASC
      LIMIT 12;
    `);
    return data || [];
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const stats = await getPlatformStats();
  const mapEvents = await getMapEvents();

  const statItems = [
    { icon: Users, value: stats.clubs > 0 ? `${stats.clubs}` : "—", label: "Registered Clubs" },
    { icon: Calendar, value: stats.events > 0 ? `${stats.events}` : "—", label: "Published Events" },
    { icon: Ticket, value: stats.passes > 0 ? `${stats.passes}` : "—", label: "Passes Issued" },
    { icon: QrCode, value: "Instant", label: "Gate Verification" },
  ];

  return (
    <div className="bg-white text-gray-900 min-h-screen font-sans">

      {/* ── 1. HERO SECTION ─────────────────────────────────────────────── */}
      <section className="relative bg-gray-900 text-white overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1600&auto=format&fit=crop&q=80"
            alt="District 3192 Events"
            fill
            priority
            className="object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900/95 via-gray-900/80 to-gray-900/60" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <div className="max-w-2xl space-y-6">
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight text-white">
              Discover <span className="text-[#1e9df1]">Verified</span> Events &amp; Masterclasses
            </h1>

            <p className="text-base sm:text-lg text-gray-300 leading-relaxed">
              Service, Leadership, Fellowship &amp; Growth. Seamlessly book tickets for flagship Rotaract conventions across Bengaluru, Tumakuru, Kolar, and beyond.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/events"
                className="bg-[#1e9df1] hover:bg-[#1583cd] text-white font-extrabold text-sm px-7 py-3.5 rounded-2xl transition-all shadow-lg shadow-[#1e9df1]/30 hover:scale-105"
              >
                Explore Flagship Events
              </Link>
              <Link
                href="/clubs"
                className="bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-sm px-7 py-3.5 rounded-2xl transition-all backdrop-blur-sm"
              >
                Discover Clubs
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-white/10">
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <ShieldCheck size={14} className="text-emerald-400" />
                <span>Verified by District 3192</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <QrCode size={14} className="text-[#1e9df1]" />
                <span>Instant QR Gate Pass</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <Ticket size={14} className="text-amber-400" />
                <span>UPI Payments Accepted</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. REAL-TIME STATS BAR ────────────────────────────────────────── */}
      <section className="border-b border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-gray-100">
            {statItems.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={i} className="flex flex-col items-center justify-center gap-1 py-6 px-4 text-center">
                  <Icon size={18} className="text-[#1e9df1] mb-1" />
                  <span className="text-2xl font-black text-gray-900">{stat.value}</span>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{stat.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 3. CATEGORY FILTER STRIP ──────────────────────────────────────── */}
      <section className="border-b border-gray-100 bg-gray-50">
        <Suspense fallback={<div className="h-16" />}>
          <CategoryStrip />
        </Suspense>
      </section>

      {/* ── 4. FEATURED EVENTS SHOWCASE ───────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold text-[#1e9df1] uppercase tracking-widest mb-2">
              <Calendar size={14} /> Upcoming Flagship Events
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
              Featured Conventions
            </h2>
          </div>
          <Link
            href="/events"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#1e9df1] hover:text-[#1583cd] transition-colors"
          >
            Explore all events <ArrowRight size={16} />
          </Link>
        </div>

        <Suspense fallback={<EventGridSkeleton count={8} />}>
          <ServerEventGrid limit={8} />
        </Suspense>
      </section>

      {/* ── INTERACTIVE EVENT MAP & VENUE DISCOVERY ─────────────────────── */}
      <section className="bg-gray-100/60 border-y border-gray-200 py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <EventMapExplorer
            events={mapEvents}
            title="Interactive Event Map & Venue Discovery"
            subtitle="Locate Rotaract conferences, conventions, and youth festivals across District 3192 on the map."
          />
        </div>
      </section>

      {/* ── 5. WHAT'S INCLUDED ────────────────────────────────────────────── */}
      <section className="bg-gray-50 border-t border-gray-100 py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-[#1e9df1] uppercase tracking-widest mb-3">
              <Sparkles size={14} /> Delegate Experience
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
              What&apos;s Included
            </h2>
            <p className="text-gray-600 text-sm sm:text-base mt-3 leading-relaxed w-full max-w-2xl mx-auto">
              Every RotaSphere pass comes with a premium delegate experience built for Rotaract leaders.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {INCLUDED_FEATURES.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div
                  key={idx}
                  className="bg-white border border-gray-100 hover:border-[#1e9df1]/30 rounded-3xl p-6 shadow-xs hover:shadow-md transition-all duration-300 hover:-translate-y-1 group"
                >
                  <div className={`w-12 h-12 rounded-2xl ${feat.color} flex items-center justify-center mb-4`}>
                    <Icon size={22} />
                  </div>
                  <h3 className="text-base font-bold text-gray-900 mb-2">{feat.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{feat.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 6. ABOUT & TIMELINE ───────────────────────────────────────────── */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-[#1e9df1] uppercase tracking-widest mb-3">
              <Calendar size={14} /> The Rotasphere Journey
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
              About the Experience
            </h2>
            <p className="text-gray-600 text-sm sm:text-base mt-3 leading-relaxed w-full max-w-2xl mx-auto">
              Curated itineraries for youth leaders across Bengaluru, Tumakuru, Kolar, and Chikkaballapura.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* Left Narrative */}
            <div className="lg:col-span-4 space-y-6">
              <h3 className="text-2xl font-bold text-gray-900 leading-tight">
                Designed for Young Changemakers Across District 3192.
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                No booking confusion, ticketing delays, or gate entry issues. Everything is centralized on RotaSphere so you can focus on making an impact.
              </p>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="bg-blue-50 rounded-2xl p-4 text-center">
                  <p className="text-3xl font-black text-[#1e9df1]">
                    {stats.events > 0 ? stats.events : "—"}
                  </p>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mt-1">Published Events</p>
                </div>
                <div className="bg-emerald-50 rounded-2xl p-4 text-center">
                  <p className="text-3xl font-black text-emerald-600">
                    {stats.clubs > 0 ? stats.clubs : "—"}
                  </p>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mt-1">Active Clubs</p>
                </div>
              </div>
            </div>

            {/* Right Timeline */}
            <div className="lg:col-span-8 space-y-6 relative pl-6 border-l-2 border-[#1e9df1]/20">
              {mapEvents.slice(0, 4).map((item: any, i: number) => (
                <div key={item.id || i} className="relative group">
                  {/* Timeline dot */}
                  <div className="absolute -left-[31px] top-5 w-4 h-4 rounded-full bg-[#1e9df1] border-4 border-white shadow-md group-hover:scale-125 transition-transform" />

                  <div className="bg-gray-50 border border-gray-100 hover:border-[#1e9df1]/30 rounded-2xl p-5 transition-all duration-300 hover:shadow-md">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-bold text-[#1e9df1] uppercase tracking-wider">
                        {new Date(item.start_date).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })} · {item.city || "Karnataka"}
                      </span>
                    </div>
                    <h4 className="text-lg font-bold text-gray-900 mb-1">{item.title}</h4>
                    <p className="text-sm text-gray-500 mb-4 line-clamp-2">{item.summary || item.description || "Official Rotaract District 3192 event."}</p>

                    {item.cover_image_url && (
                      <div className="relative w-32 h-20 rounded-xl overflow-hidden border border-gray-200">
                        <Image src={item.cover_image_url} alt={item.title} fill className="object-cover" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. CONTACT / INQUIRY FORM ─────────────────────────────────────── */}
      <section className="bg-gray-50 border-t border-gray-100 py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white border border-gray-100 rounded-3xl p-8 sm:p-12 shadow-xs">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-5 space-y-4">
                <div className="inline-flex items-center gap-2 text-xs font-bold text-[#1e9df1] uppercase tracking-widest mb-1">
                  <Mail size={14} /> Get in Touch
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                  Want to host or have questions?
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Leave a request and our District Team will reach out within 24 hours to assist with club registrations, event hosting, or ticket inquiries.
                </p>
                <div className="space-y-2 pt-2 text-xs text-gray-600">
                  <p className="flex items-center gap-2">
                    <Mail size={14} className="text-[#1e9df1]" /> support@rotasphere.in
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone size={14} className="text-[#1e9df1]" /> District 3192 Helpline
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
