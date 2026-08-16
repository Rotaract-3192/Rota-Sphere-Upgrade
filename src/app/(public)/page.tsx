/**
 * RotaSphere — Cinematic Dark Landing Page
 * Inspired by high-end luxury event & experience showcase design.
 * Tailored specifically for District 3192 & Rotaract Platform.
 */

import { Suspense } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { EventGrid, EventGridSkeleton } from "@/components/events/EventGrid";
import { CategoryStrip } from "@/components/events/CategoryStrip";
import { ContactForm } from "@/components/events/ContactForm";
import {
  Sparkles, Calendar, MapPin, Award, ArrowRight,
  Phone, Mail
} from "lucide-react";

export const metadata: Metadata = {
  title: "RotaSphere — District 3192 Rotaract Experience",
  description: "Discover, register, and experience flagship Rotaract events, conferences, and fellowships across District 3192.",
};

export const revalidate = 60;

const HERO_CARDS = [
  {
    title: "7+ Cities",
    subtitle: "across District 3192",
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&auto=format&fit=crop&q=80",
  },
  {
    title: "365 Days",
    subtitle: "of Impact & Service",
    image: "https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?w=600&auto=format&fit=crop&q=80",
  },
  {
    title: "10,000+",
    subtitle: "Active Rotaractors",
    image: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=600&auto=format&fit=crop&q=80",
  },
  {
    title: "Leadership",
    subtitle: "conclaves & retreats",
    image: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=600&auto=format&fit=crop&q=80",
  },
  {
    title: "Enjoy the Vibe",
    subtitle: "fellowship & galas",
    image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80",
  },
];

const TIMELINE_EVENTS = [
  {
    period: "Feb 18–20",
    city: "Bengaluru",
    title: "District Conference 2026 — Synergy",
    desc: "3-day mega flagship convention, global keynotes & gala awards night.",
    images: [
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1511578314322-379afb476865?w=400&auto=format&fit=crop&q=80",
    ],
  },
  {
    period: "March 5–7",
    city: "Surat & Vadodara",
    title: "Youth Leadership Conclave & Trek",
    desc: "Experiential outdoor leadership immersion and startup pitch competition.",
    images: [
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=400&auto=format&fit=crop&q=80",
    ],
  },
  {
    period: "April 12–14",
    city: "Ahmedabad & Rajkot",
    title: "Cultural Fiesta & Inter-Club Sports League",
    desc: "Annual sports championship, arts showcase & district fellowship dinner.",
    images: [
      "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=400&auto=format&fit=crop&q=80",
    ],
  },
];

const INCLUDED_FEATURES = [
  {
    icon: Sparkles,
    title: "World-Class Keynotes",
    desc: "Inspirational sessions with global leaders, founder-Rotaractors, and changemakers.",
  },
  {
    icon: Calendar,
    title: "Verified Delegate Passes",
    desc: "Instant digital ticket confirmation with secure QR code verification.",
  },
  {
    icon: MapPin,
    title: "Hospitality & Stay",
    desc: "Organized accommodations, airport transfers, and meals for outstation delegates.",
  },
  {
    icon: Award,
    title: "Certificates & Kits",
    desc: "Exclusive Rotaract delegate merchandise, badges, and official certificates.",
  },
];

export default function HomePage() {
  return (
    <div className="bg-[#0b0d12] text-white min-h-screen font-sans selection:bg-[#ff385c] selection:text-white">
      {/* ── 1. CINEMATIC HERO SECTION ───────────────────────────────────── */}
      <section className="relative min-h-[90vh] flex flex-col justify-between overflow-hidden pt-6 pb-12 px-4 sm:px-8 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-900/20 via-[#0b0d12] to-[#0b0d12]">
        
        {/* Giant Translucent Background Title */}
        <div className="absolute top-12 left-1/2 -translate-x-1/2 pointer-events-none select-none text-center w-full z-0 opacity-15">
          <h1 className="text-[14vw] font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-amber-100 to-transparent leading-none">
            DISTRICT 3192
          </h1>
        </div>

        {/* Hero Background Glow Atmosphere */}
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1600&auto=format&fit=crop&q=80"
            alt="Atmosphere"
            fill
            priority
            className="object-cover opacity-20 filter blur-xs"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0b0d12]/60 via-[#0b0d12]/80 to-[#0b0d12]" />
        </div>

        {/* Hero Header Content */}
        <div className="relative z-10 max-w-7xl mx-auto w-full pt-16 text-center">
          <h2 className="text-4xl sm:text-6xl md:text-7xl font-extrabold text-white tracking-tight mb-6 max-w-4xl mx-auto leading-tight">
            DISCOVER THE UNFORGETTABLE
          </h2>
          <p className="text-base sm:text-xl text-gray-300 max-w-2xl mx-auto font-light mb-12">
            Service, Leadership, Fellowship & Growth. Seamlessly book tickets for flagship Rotaract conventions across Bengaluru, Surat, Ahmedabad, and beyond.
          </p>
        </div>

        {/* Hero Floating Cards Carousel Row */}
        <div className="relative z-10 max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {HERO_CARDS.map((card, idx) => (
              <div
                key={idx}
                className="group relative h-48 sm:h-56 rounded-2xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-md shadow-2xl transition-all duration-300 hover:-translate-y-2 hover:border-amber-400/50"
              >
                <Image
                  src={card.image}
                  alt={card.title}
                  fill
                  className="object-cover opacity-60 group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent p-4 flex flex-col justify-end">
                  <p className="text-lg font-bold text-white leading-tight">{card.title}</p>
                  <p className="text-xs text-amber-300/90 font-medium">{card.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 2. CATEGORY FILTER STRIP ───────────────────────────────────── */}
      <section className="border-y border-white/10 bg-[#0e1118]">
        <Suspense fallback={<div className="h-16" />}>
          <CategoryStrip />
        </Suspense>
      </section>

      {/* ── 3. FEATURED EVENTS SHOWCASE ────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-widest mb-2">
              <Calendar size={14} /> Upcoming Flagship Events
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              FEATURED CONVENTIONS
            </h2>
          </div>
          <Link
            href="/events"
            className="inline-flex items-center gap-2 text-sm font-semibold text-amber-400 hover:text-amber-300 transition-colors"
          >
            Explore all events <ArrowRight size={16} />
          </Link>
        </div>

        <Suspense fallback={<EventGridSkeleton count={8} />}>
          <EventGrid limit={8} />
        </Suspense>
      </section>

      {/* ── 4. ABOUT THE EXPERIENCE & TIMELINE ──────────────────────────── */}
      <section className="relative py-24 px-4 sm:px-8 bg-gradient-to-b from-[#0b0d12] via-[#0f131c] to-[#0b0d12] border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          {/* Section Divider Header */}
          <div className="flex items-center gap-4 mb-16 text-center justify-center">
            <div className="h-px bg-gradient-to-r from-transparent via-amber-400/50 to-transparent flex-1" />
            <h2 className="text-2xl sm:text-3xl font-extrabold text-amber-300 uppercase tracking-widest px-4">
              ABOUT THE ROTASPHERE JOURNEY
            </h2>
            <div className="h-px bg-gradient-to-r from-transparent via-amber-400/50 to-transparent flex-1" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* Left Narrative */}
            <div className="lg:col-span-5 space-y-6">
              <h3 className="text-3xl font-bold text-white leading-tight">
                Designed for Young Changemakers Across District 3192.
              </h3>
              <p className="text-base text-gray-300 leading-relaxed font-light">
                We&apos;ve curated seamless, memorable itineraries for youth leaders across <span className="text-amber-400 font-semibold">Bengaluru, Surat, Ahmedabad, Vadodara, and Rajkot</span>.
              </p>
              <p className="text-sm text-gray-400 leading-relaxed">
                No need to worry about booking confusion, ticketing delays, or gate entries. Everything is centralized on RotaSphere so you can focus on making an impact and enjoying the journey.
              </p>

              <div className="pt-4 border-t border-white/10 flex items-center gap-6">
                <div>
                  <p className="text-3xl font-black text-amber-400">100%</p>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Verified Events</p>
                </div>
                <div className="w-px h-10 bg-white/10" />
                <div>
                  <p className="text-3xl font-black text-amber-400">50+</p>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Active Clubs</p>
                </div>
              </div>
            </div>

            {/* Right Interactive Timeline Path */}
            <div className="lg:col-span-7 space-y-8 relative pl-6 border-l-2 border-amber-500/30">
              {TIMELINE_EVENTS.map((item, i) => (
                <div key={i} className="relative group">
                  {/* Timeline Node Dot */}
                  <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-amber-400 border-4 border-[#0b0d12] shadow-md shadow-amber-400/50 group-hover:scale-125 transition-transform" />

                  <div className="bg-white/5 border border-white/10 hover:border-amber-400/50 rounded-2xl p-6 backdrop-blur-md transition-all duration-300">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                        {item.period} · {item.city}
                      </span>
                    </div>

                    <h4 className="text-xl font-bold text-white mb-2">{item.title}</h4>
                    <p className="text-sm text-gray-300 mb-4">{item.desc}</p>

                    {/* Timeline photos */}
                    <div className="flex items-center gap-3">
                      {item.images.map((img, imgIdx) => (
                        <div key={imgIdx} className="relative w-24 h-16 rounded-lg overflow-hidden border border-white/10">
                          <Image src={img} alt={item.title} fill className="object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. WHAT'S INCLUDED DELEGATE CARDS ──────────────────────────── */}
      <section className="py-24 px-4 sm:px-8 bg-[#0b0d12]">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-16 text-center justify-center">
            <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent flex-1" />
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white uppercase tracking-widest px-4">
              WHAT&apos;S INCLUDED
            </h2>
            <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent flex-1" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {INCLUDED_FEATURES.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div
                  key={idx}
                  className="bg-white/5 border border-white/10 hover:border-amber-400/50 rounded-2xl p-6 backdrop-blur-md transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="w-12 h-12 rounded-xl bg-amber-400/10 text-amber-400 flex items-center justify-center mb-4">
                    <Icon size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{feat.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed font-light">{feat.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 6. INTERACTIVE CONTACT & INQUIRY FORM ────────────────────── */}
      <section className="relative py-24 px-4 sm:px-8 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-amber-950/30 via-[#0b0d12] to-[#0b0d12] border-t border-white/10">
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="bg-white/5 border border-white/15 rounded-3xl p-8 sm:p-12 backdrop-blur-xl shadow-2xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              <div className="lg:col-span-5 space-y-4">
                <h3 className="text-3xl font-extrabold text-white">
                  Want to host or have questions?
                </h3>
                <p className="text-sm text-gray-300 font-light leading-relaxed">
                  Leave a request and our District Team will reach out to you within 24 hours to assist with club registrations, event hosting, or ticket inquiries.
                </p>
                <div className="space-y-2 pt-2 text-xs text-amber-300">
                  <p className="flex items-center gap-2"><Mail size={14} /> support@rotasphere.in</p>
                  <p className="flex items-center gap-2"><Phone size={14} /> District 3192 Helpline</p>
                </div>
              </div>

              {/* Inquiry Form Client Component */}
              <ContactForm />

            </div>
          </div>
        </div>
      </section>

      {/* ── 7. CINEMATIC FOOTER ─────────────────────────────────────────── */}
      <footer className="bg-black border-t border-white/10 py-12 px-4 sm:px-8 text-sm text-gray-400">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold text-amber-400 tracking-wider uppercase">ROTASPHERE</span>
            <span>·</span>
            <span>District 3192</span>
          </div>

          <div className="flex items-center gap-6 text-xs text-gray-400">
            <Link href="/about" className="hover:text-white transition-colors">About</Link>
            <Link href="/events" className="hover:text-white transition-colors">Events</Link>
            <Link href="/experiences" className="hover:text-white transition-colors">Experiences</Link>
            <Link href="/clubs" className="hover:text-white transition-colors">Clubs</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
          </div>

          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} Rotaract District 3192. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
