import { getCurrentUser } from "@/lib/auth/getUser";
import { executeSql } from "@/lib/db/directDb";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Calendar,
  Clock,
  MapPin,
  ShieldCheck,
  Share2,
  Bookmark,
  Users,
  Award,
  Sparkles,
  Ticket,
  ChevronRight,
  Globe,
  Mail,
} from "lucide-react";
import { EventBookingClient } from "./EventBookingClient";
import type { SaasEvent, SaasTicketTier } from "@/types/saas";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const { data } = await executeSql(`SELECT title, summary, description FROM saas_events WHERE slug = '${slug}' LIMIT 1;`);
  const event = data?.[0];

  if (!event) return { title: "Event Not Found | RotaSphere" };

  return {
    title: `${event.title} | RotaSphere SaaS Ticketing`,
    description: event.summary || event.description?.slice(0, 160),
  };
}

export default async function EventDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const user = await getCurrentUser();

  // Fetch Event
  const { data: eventRows } = await executeSql(`
    SELECT e.*, o.name as org_name, o.logo_url as org_logo
    FROM saas_events e
    LEFT JOIN organizations o ON e.organization_id = o.id
    WHERE e.slug = '${slug}'
    LIMIT 1;
  `);

  const event = eventRows?.[0] as unknown as SaasEvent;
  if (!event) {
    notFound();
  }

  // Fetch Tiers
  const { data: tierRows } = await executeSql(`
    SELECT * FROM saas_ticket_tiers
    WHERE event_id = '${event.id}' AND is_active = true AND is_visible = true
    ORDER BY price ASC;
  `);
  const tiers = (tierRows || []) as unknown as SaasTicketTier[];

  // Fetch Speakers
  const { data: speakerRows } = await executeSql(`
    SELECT * FROM event_speakers
    WHERE event_id = '${event.id}'
    ORDER BY display_order ASC;
  `);
  const speakers = speakerRows || [];

  // Fetch Schedules
  const { data: scheduleRows } = await executeSql(`
    SELECT * FROM event_schedules
    WHERE event_id = '${event.id}'
    ORDER BY start_time ASC;
  `);
  const schedules = scheduleRows || [];

  // Fetch Sponsors
  const { data: sponsorRows } = await executeSql(`
    SELECT * FROM event_sponsors
    WHERE event_id = '${event.id}'
    ORDER BY display_order ASC;
  `);
  const sponsors = sponsorRows || [];

  const startDateObj = new Date(event.start_date);
  const formattedDate = startDateObj.toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const formattedTime = startDateObj.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      {/* ── 1. HERO COVER & EVENT BANNER ───────────────────────────────── */}
      <div className="relative w-full h-[380px] sm:h-[480px] bg-gray-900 overflow-hidden">
        {event.cover_image_url ? (
          <Image
            src={event.cover_image_url}
            alt={event.title}
            fill
            priority
            className="object-cover opacity-60"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-gray-900 to-gray-800" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/40 to-transparent" />

        <div className="absolute bottom-0 inset-x-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 text-white space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-extrabold uppercase tracking-widest bg-amber-400 text-gray-950 px-3 py-1 rounded-full shadow-sm">
              {event.event_type}
            </span>
            <span className="text-xs font-semibold text-gray-300 flex items-center gap-1 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
              <ShieldCheck size={14} className="text-emerald-400" /> Verified Organizer
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white max-w-4xl leading-tight">
            {event.title}
          </h1>

          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-300 font-medium">
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-[#ff385c]" />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-amber-400" />
              <span>{formattedTime} IST</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin size={18} className="text-emerald-400" />
              <span>{event.venue_name ? `${event.venue_name}, ${event.city}` : event.city}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. TWO-COLUMN LAYOUT: CONTENT + TICKETING BOOKING CARD ─────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* Main Left Column */}
          <div className="lg:col-span-2 space-y-12">
            
            {/* About & Description */}
            <section className="bg-white p-8 rounded-3xl border border-gray-200 shadow-xs space-y-4">
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">About This Event</h2>
              <div className="prose prose-gray max-w-none text-gray-700 text-sm sm:text-base leading-relaxed whitespace-pre-line">
                {event.description}
              </div>
            </section>

            {/* Schedule & Agenda */}
            {schedules.length > 0 && (
              <section className="bg-white p-8 rounded-3xl border border-gray-200 shadow-xs space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900 tracking-tight">Event Schedule</h2>
                  <span className="text-xs font-semibold text-gray-500">{schedules.length} Sessions</span>
                </div>
                <div className="divide-y divide-gray-100">
                  {schedules.map((sch: any) => (
                    <div key={sch.id} className="py-4 flex gap-4 items-start">
                      <div className="bg-gray-100 px-3 py-1.5 rounded-xl text-xs font-mono font-bold text-gray-800 text-center min-w-[75px]">
                        {new Date(sch.start_time).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-base font-bold text-gray-900">{sch.title}</h3>
                        {sch.description && <p className="text-xs text-gray-500">{sch.description}</p>}
                        {sch.stage_room && (
                          <span className="inline-block text-[11px] font-semibold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-md">
                            📍 {sch.stage_room}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Keynote Speakers */}
            {speakers.length > 0 && (
              <section className="bg-white p-8 rounded-3xl border border-gray-200 shadow-xs space-y-6">
                <h2 className="text-xl font-bold text-gray-900 tracking-tight">Featured Speakers</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {speakers.map((spk: any) => (
                    <div key={spk.id} className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                      {spk.avatar_url ? (
                        <div className="relative w-14 h-14 rounded-full overflow-hidden flex-shrink-0 bg-gray-200">
                          <Image src={spk.avatar_url} alt={spk.name} fill className="object-cover" />
                        </div>
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-lg flex-shrink-0">
                          {spk.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <h3 className="text-base font-bold text-gray-900">{spk.name}</h3>
                        <p className="text-xs text-gray-500">{spk.role_title || "Speaker"} · {spk.organization || "District 3192"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Sponsors */}
            {sponsors.length > 0 && (
              <section className="bg-white p-8 rounded-3xl border border-gray-200 shadow-xs space-y-6">
                <h2 className="text-xl font-bold text-gray-900 tracking-tight">Event Partners & Sponsors</h2>
                <div className="flex flex-wrap items-center gap-6">
                  {sponsors.map((spon: any) => (
                    <div key={spon.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center gap-3">
                      <div className="relative w-12 h-12 bg-white rounded-xl overflow-hidden p-1 shadow-xs">
                        <Image src={spon.logo_url} alt={spon.name} fill className="object-contain" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900">{spon.name}</p>
                        <span className="text-[10px] uppercase font-extrabold text-amber-600">{spon.tier} Sponsor</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Venue & Location */}
            <section className="bg-white p-8 rounded-3xl border border-gray-200 shadow-xs space-y-4">
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">Venue & Guidelines</h2>
              <div className="space-y-2 text-sm text-gray-700">
                <p className="font-semibold text-gray-900">{event.venue_name || event.city}</p>
                {event.address && <p className="text-gray-500">{event.address}</p>}
                {event.terms_and_conditions && (
                  <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500">
                    <p className="font-bold text-gray-700 uppercase tracking-wider mb-1">Terms & Policies</p>
                    <p>{event.terms_and_conditions}</p>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Right Floating Booking Sidebar */}
          <div className="lg:col-span-1">
            <EventBookingClient
              event={event}
              tiers={tiers}
              userEmail={user?.email}
              userName={user?.profile?.full_name}
            />
          </div>

        </div>
      </div>
    </main>
  );
}
