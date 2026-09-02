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
import type { Metadata } from "next";
import {
  resolveIanaTimezone,
  formatTimezoneLabel,
  formatEventDateDisplay,
  formatEventTimeDisplay,
} from "@/lib/utils/dateTimeUtils";
import { EventJsonLd, BreadcrumbJsonLd } from "@/components/seo/JsonLd";
import { EventBookingClient } from "./EventBookingClient";
import type { SaasEvent, SaasTicketTier } from "@/types/saas";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://events.rotaract3192.org";
  const { data } = await executeSql(`
    SELECT e.title, e.summary, e.description, e.cover_image_url, e.logo_url, e.city, cat.name as category, e.event_type, e.start_date, o.name as org_name
    FROM saas_events e
    LEFT JOIN organizations o ON e.organization_id = o.id
    LEFT JOIN event_categories cat ON e.category_id = cat.id
    WHERE e.slug = '${slug.replace(/'/g, "''")}' AND e.status = 'PUBLISHED' AND e.deleted_at IS NULL
    LIMIT 1;
  `);
  const event = data?.[0];

  if (!event) {
    return {
      title: "Event Not Found | RotaSphere",
      description: "The requested Rotaract District 3192 event could not be found.",
    };
  }

  const hostingClub = event.org_name || "Rotaract District 3192";
  const eventTitle = `${event.title} | ${hostingClub}`;
  const eventDescription =
    event.summary ||
    event.description?.slice(0, 160) ||
    `Official event pass and registration for ${event.title} hosted by ${hostingClub} in District 3192.`;
  const eventImage = event.cover_image_url || `${baseUrl}/brand-logo.png`;
  const eventUrl = `${baseUrl}/events/${slug}`;

  return {
    title: eventTitle,
    description: eventDescription,
    keywords: [
      event.title,
      event.city || "Bengaluru",
      event.category || "Conference",
      hostingClub,
      "Rotaract District 3192",
      "Rotaract events",
      "event tickets",
      "delegate passes",
    ],
    alternates: {
      canonical: eventUrl,
    },
    openGraph: {
      title: eventTitle,
      description: eventDescription,
      url: eventUrl,
      siteName: "RotaSphere District 3192",
      locale: "en_IN",
      type: "website",
      images: [
        {
          url: eventImage,
          width: 1200,
          height: 630,
          alt: event.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: eventTitle,
      description: eventDescription,
      images: [eventImage],
      creator: "@rotaract3192",
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
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
    WHERE e.slug = '${slug}' AND e.status = 'PUBLISHED' AND e.deleted_at IS NULL
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

  const ianaTz = resolveIanaTimezone(event.timezone);
  const tzLabel = formatTimezoneLabel(event.timezone);

  const startDateObj = new Date(event.start_date);
  const endDateObj = event.end_date ? new Date(event.end_date) : null;

  const formattedDate = startDateObj.toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: ianaTz,
  });

  const isSameDay = endDateObj
    ? startDateObj.toLocaleDateString("en-IN", { timeZone: ianaTz }) === endDateObj.toLocaleDateString("en-IN", { timeZone: ianaTz })
    : true;

  const formattedEndDate = endDateObj && !isSameDay
    ? endDateObj.toLocaleDateString("en-IN", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
        timeZone: ianaTz,
      })
    : null;

  const formattedTime = startDateObj.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: ianaTz,
  });
  const formattedEndTime = endDateObj
    ? endDateObj.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZone: ianaTz,
      })
    : null;

  const hostingClub = (event as any).org_name || (event as any).organization_name || "Rotaract District 3192";

  return (
    <>
      <EventJsonLd
        event={event as any}
        tiers={tiers}
        speakers={speakers as any}
        orgName={hostingClub}
      />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "/" },
          { name: "Events", url: "/events" },
          { name: event.title, url: `/events/${event.slug}` },
        ]}
      />
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
            {((event as any).org_name || (event as any).organization_name) && (
              <span className="text-xs font-bold text-white flex items-center gap-1.5 bg-[#0758fc]/85 backdrop-blur-md px-3.5 py-1 rounded-full border border-blue-300/30 shadow-xs">
                🏛️ Hosted by {(event as any).org_name || (event as any).organization_name}
              </span>
            )}
            {event.allow_non_rotaract === false ? (
              <span className="text-xs font-bold text-amber-300 bg-amber-950/70 backdrop-blur-md px-3 py-1 rounded-full border border-amber-500/40 flex items-center gap-1.5 shadow-xs">
                <ShieldCheck size={14} className="text-amber-400" /> 🛡️ Rotaract &amp; Rotary Exclusive
              </span>
            ) : (
              <span className="text-xs font-semibold text-blue-200 bg-blue-950/70 backdrop-blur-md px-3 py-1 rounded-full border border-blue-400/30 flex items-center gap-1.5 shadow-xs">
                <Globe size={14} className="text-blue-400" /> 🌐 Open to Everyone (Guests Welcome)
              </span>
            )}
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white max-w-4xl leading-tight">
            {event.title}
          </h1>

          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-300 font-medium">
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-[#0758fc]" />
              <span>{formattedEndDate ? `${formattedDate} – ${formattedEndDate}` : formattedDate}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-amber-400" />
              <span>{formattedTime}{formattedEndTime ? ` – ${formattedEndTime}` : ""} {tzLabel}</span>
            </div>
            {event.google_maps_url ? (
              <a
                href={event.google_maps_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 underline underline-offset-4 font-semibold transition-colors"
                title="View location in Google Maps"
              >
                <MapPin size={18} className="text-emerald-400" />
                <span>{event.venue_name ? `${event.venue_name}, ${event.city}` : event.city} (Maps ↗)</span>
              </a>
            ) : (
              <div className="flex items-center gap-2">
                <MapPin size={18} className="text-emerald-400" />
                <span>{event.venue_name ? `${event.venue_name}, ${event.city}` : event.city}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── 2. TWO-COLUMN LAYOUT: CONTENT + TICKETING BOOKING CARD ─────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* Main Left Column (Order 2 on mobile, Order 1 on desktop) */}
          <div className="lg:col-span-2 space-y-12 order-2 lg:order-1">

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
                      <div className="bg-gray-100 px-3 py-1.5 rounded-xl text-xs font-mono font-bold text-gray-800 text-center min-w-[85px]">
                        {new Date(sch.start_time).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true, timeZone: ianaTz })}
                        {sch.end_time ? ` – ${new Date(sch.end_time).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true, timeZone: ianaTz })}` : ""}
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

            {/* Venue & Guidelines */}
            <section className="bg-white p-8 rounded-3xl border border-gray-200 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 tracking-tight">Venue &amp; Location Guidelines</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Physical event address &amp; navigation directions</p>
                </div>
                {(event.google_maps_url || event.venue_name) && (
                  <a
                    href={
                      event.google_maps_url ||
                      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${event.venue_name || ""}, ${event.address || event.city}`)}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-[#0758fc] hover:bg-[#054fe0] text-white text-xs font-bold px-4 py-2.5 rounded-full transition-all shadow-sm shrink-0 w-fit"
                  >
                    <MapPin size={14} /> Open in Google Maps ↗
                  </a>
                )}
              </div>

              <div className="space-y-3 text-sm text-gray-700">
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 text-[#0758fc] flex items-center justify-center shrink-0">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <p className="font-extrabold text-gray-900 text-base">{event.venue_name || event.city}</p>
                    {event.address && <p className="text-xs text-gray-600 mt-1">{event.address}</p>}
                    {event.city && <p className="text-xs text-gray-500 mt-0.5">{event.city}{event.state ? `, ${event.state}` : ""}</p>}
                  </div>
                </div>

                {event.terms_and_conditions && (
                  <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-600 leading-relaxed">
                    <p className="font-bold text-gray-800 uppercase tracking-wider mb-1">Host Club Guidelines</p>
                    <p>{event.terms_and_conditions}</p>
                  </div>
                )}
              </div>
            </section>

            {/* Event Governance, Policies & DPDP Privacy Transparency */}
            <section className="bg-white p-8 rounded-3xl border border-gray-200 shadow-xs space-y-6">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#0758fc] bg-blue-50 px-2.5 py-0.5 rounded-full">
                    Transparency &amp; Governance
                  </span>
                  <h2 className="text-xl font-bold text-gray-900 tracking-tight">Event Policies &amp; Data Notice</h2>
                </div>
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  ◉ Directory Verified RY 2026–27
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Policy 1: Ticket Validity */}
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-1.5">
                  <h3 className="font-bold text-gray-900 flex items-center gap-1.5">
                    🎟️ Ticket Validity &amp; Admission
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    Pass includes single-use cryptographic dynamic QR code. Valid only for {event.title}. Photo ID verification may be requested at the venue gate.
                  </p>
                </div>

                {/* Policy 2: Cancellation & Refund */}
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-1.5">
                  <h3 className="font-bold text-gray-900 flex items-center gap-1.5">
                    🔄 Cancellation &amp; Refunds
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    Cancellations accepted up to 48h prior to event. 100% full refund guaranteed if event is cancelled or postponed by the host organizer. Pass transfer is 100% free anytime.
                  </p>
                </div>

                {/* Policy 3: Organizer Contact */}
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-1.5">
                  <h3 className="font-bold text-gray-900 flex items-center gap-1.5">
                    🏛️ Verified Host Organizer
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    Hosted by {(event as any).org_name || "Rotaract Club of District 3192"}. Official chartered club in District 3192. Settlements execute directly to verified club accounts.
                  </p>
                </div>

                {/* Policy 4: DPDP Privacy Transparency */}
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-1.5">
                  <h3 className="font-bold text-gray-900 flex items-center gap-1.5">
                    🛡️ Attendee Data Notice (DPDP)
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    Registration data is shared strictly with the host club for gate check-in and certificate distribution. Your personal data is never sold or shared with external third-party advertisers.
                  </p>
                </div>
              </div>

              <div className="pt-2 text-[11px] text-gray-400 flex flex-wrap items-center justify-between gap-2 border-t border-gray-100">
                <span>Subject to RotaSphere <Link href="/terms" className="text-[#0758fc] hover:underline font-bold">Terms of Service</Link> and <Link href="/privacy" className="text-[#0758fc] hover:underline font-bold">Privacy Policy</Link>.</span>
                <Link href="/disputes" className="text-gray-600 hover:text-gray-900 hover:underline font-semibold">Report an Issue with this Event →</Link>
              </div>
            </section>
          </div>

          {/* Right Floating Booking Sidebar (Order 1 on mobile, Order 2 on desktop) */}
          <div className="lg:col-span-1 order-1 lg:order-2">
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
    </>
  );
}
