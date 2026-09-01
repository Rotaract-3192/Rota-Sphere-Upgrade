import { executeSql } from "@/lib/db/directDb";
import { EventsPageClient } from "@/components/events/EventsPageClient";
import { Search, Sparkles, Filter, MapPin, Users, X, ArrowLeft } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Explore Events & Delegate Passes | RotaSphere District 3192",
  description:
    "Discover, search, and book verified conferences, cultural fests, workshops, and sports meets across all 85 chartered clubs in Rotaract District 3192.",
  keywords: [
    "Rotaract events",
    "District 3192 passes",
    "college fests Bangalore",
    "youth summits Bangalore",
    "book event passes",
    "Rotaract clubs",
  ],
  alternates: {
    canonical: "/events",
  },
  openGraph: {
    title: "Explore Events & Delegate Passes | RotaSphere District 3192",
    description:
      "Browse and book delegate passes for flagship conferences, summits, and workshops across District 3192.",
    url: "/events",
    siteName: "RotaSphere District 3192",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "/brand-logo.png",
        width: 1200,
        height: 630,
        alt: "Explore Events — RotaSphere District 3192",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Explore Events & Passes | RotaSphere District 3192",
    description: "Discover verified Rotaract events and book official delegate passes.",
    images: ["/brand-logo.png"],
  },
};

interface PageProps {
  searchParams: Promise<{
    q?: string;
    search?: string;
    club?: string;
    club_id?: string;
    club_slug?: string;
    category?: string;
    city?: string;
    format?: string;
    date?: string;
    type?: string;
  }>;
}

function escapeSql(str: string | null | undefined): string {
  if (str === null || str === undefined) return "NULL";
  return String(str).replace(/'/g, "''");
}

export default async function EventsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const q = params.q || params.search || "";
  const clubName = params.club || "";
  const clubId = params.club_id || "";
  const clubSlug = params.club_slug || "";
  const category = params.category || "";
  const city = params.city || "";
  const format = params.format || "";
  const date = params.date || "";
  const type = params.type || "";

  // Build query with organizations join
  let sql = `
    SELECT e.*, 
      o.name as organization_name,
      o.slug as organization_slug,
      o.zone as organization_zone,
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
    LEFT JOIN organizations o ON e.organization_id = o.id
    LEFT JOIN saas_ticket_tiers t ON e.id = t.event_id
    WHERE e.status = 'PUBLISHED' AND e.deleted_at IS NULL
  `;

  if (category) sql += ` AND (e.category_id = '${escapeSql(category)}' OR e.category = '${escapeSql(category)}')`;
  if (city) sql += ` AND e.city ILIKE '%${escapeSql(city)}%'`;
  if (format) sql += ` AND e.event_type = '${escapeSql(format.toUpperCase())}'`;
  if (date) sql += ` AND DATE(e.start_date) = '${escapeSql(date)}'`;
  if (type === "free") {
    sql += ` AND (NOT EXISTS (SELECT 1 FROM saas_ticket_tiers stt WHERE stt.event_id = e.id AND stt.price > 0))`;
  } else if (type === "paid") {
    sql += ` AND (EXISTS (SELECT 1 FROM saas_ticket_tiers stt WHERE stt.event_id = e.id AND stt.price > 0))`;
  }

  // Specific Club Filter
  if (clubId && (clubId.startsWith("org-") || clubId.length > 5)) {
    sql += ` AND (e.organization_id = '${escapeSql(clubId)}' OR o.name ILIKE '%${escapeSql(clubName || clubId)}%')`;
  } else if (clubName) {
    sql += ` AND (o.name ILIKE '%${escapeSql(clubName)}%' OR e.title ILIKE '%${escapeSql(clubName)}%' OR e.summary ILIKE '%${escapeSql(clubName)}%')`;
  } else if (clubSlug) {
    sql += ` AND (o.slug = '${escapeSql(clubSlug)}')`;
  }

  // General text search
  if (q && !clubName) {
    sql += ` AND (
      e.title ILIKE '%${escapeSql(q)}%' 
      OR e.description ILIKE '%${escapeSql(q)}%' 
      OR e.city ILIKE '%${escapeSql(q)}%'
      OR o.name ILIKE '%${escapeSql(q)}%'
      OR e.venue_name ILIKE '%${escapeSql(q)}%'
    )`;
  }

  sql += ` GROUP BY e.id, o.name, o.slug, o.zone ORDER BY e.created_at DESC NULLS LAST, e.start_date DESC;`;

  const { data: events } = await executeSql(sql);

  // Fetch only categories that have active published events
  const { data: categories } = await executeSql(`
    SELECT DISTINCT c.id, c.name, c.display_order
    FROM event_categories c
    INNER JOIN saas_events e ON (c.id::text = e.category_id OR c.slug = e.category_id)
    WHERE e.status = 'PUBLISHED'
    ORDER BY c.display_order ASC;
  `);

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      {/* ── HERO DISCOVERY BANNER ────────────────────────────────────── */}
      <section className="bg-gray-900 text-white py-12 sm:py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="max-w-7xl mx-auto space-y-6 relative z-10">
          <div className="space-y-3 max-w-2xl">
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#60a5fa] flex items-center gap-1.5">
              <Sparkles size={14} /> District 3192 Ticketing Engine
            </span>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
              {clubName ? `${clubName} Events` : "Discover Verified Events & Passes"}
            </h1>
            <p className="text-sm sm:text-base text-gray-400 leading-relaxed">
              {clubName
                ? `Browse official events, delegate passes, and registrations hosted by ${clubName}.`
                : "Secure entry passes for flagship Rotaract conferences, cultural nights, and community initiatives."}
            </p>
          </div>

          {/* Active Club Filter Pill / Banner */}
          {(clubName || clubId) && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0758fc]/15 border border-[#0758fc]/30 rounded-2xl p-4 text-xs text-white max-w-2xl">
              <div className="flex items-center gap-2.5">
                <Users size={18} className="text-[#60a5fa] shrink-0" />
                <span>
                  Filtering events organized by: <strong className="text-white font-bold">{clubName || "Chartered Club"}</strong>
                </span>
              </div>
              <Link
                href="/events"
                className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white font-bold px-3 py-1.5 rounded-xl transition-all text-xs shrink-0 self-start sm:self-auto cursor-pointer"
              >
                <ArrowLeft size={13} /> View All District Events
              </Link>
            </div>
          )}

          {/* Search Bar */}
          <form method="GET" action="/events" className="max-w-2xl flex gap-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-4 top-3.5 text-gray-400" />
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="Search events, clubs, cities..."
                className="w-full bg-white/10 border border-white/20 backdrop-blur-md rounded-2xl pl-11 pr-4 py-3 text-xs sm:text-sm text-white placeholder-gray-400 outline-none focus:border-[#0758fc]"
              />
            </div>
            <button
              type="submit"
              className="bg-[#0758fc] hover:bg-[#054fe0] text-white font-extrabold text-xs sm:text-sm px-6 py-3 rounded-2xl shadow-lg transition-all cursor-pointer"
            >
              Search
            </button>
          </form>

          {/* Category Filter Pills (Only rendered if specific event categories exist) */}
          {categories && categories.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none pt-1">
              <Link
                href={clubName ? `/events?club=${encodeURIComponent(clubName)}` : "/events"}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                  !category ? "bg-[#0758fc] text-white" : "bg-white/10 text-gray-300 hover:bg-white/20"
                }`}
              >
                All Events
              </Link>
              {categories.map((cat: any) => (
                <Link
                  key={cat.id}
                  href={`/events?category=${cat.id}${clubName ? `&club=${encodeURIComponent(clubName)}` : ""}`}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                    category === cat.id ? "bg-[#0758fc] text-white" : "bg-white/10 text-gray-300 hover:bg-white/20"
                  }`}
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── EVENT LISTINGS & INTERACTIVE MAP DISCOVERY ───────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        <EventsPageClient events={(events as any) || []} clubName={clubName} />
      </section>
    </main>
  );
}
