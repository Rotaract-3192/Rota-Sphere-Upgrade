import { executeSql } from "@/lib/db/directDb";
import { EventsPageClient } from "@/components/events/EventsPageClient";
import { Search, Sparkles, Filter, MapPin } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Explore Events & Passes | RotaSphere SaaS",
  description: "Discover verified conferences, festivals, TEDx talks, workshops, and concerts across District 3192.",
};

interface PageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    city?: string;
    format?: string;
  }>;
}

export default async function EventsPage({ searchParams }: PageProps) {
  const { q, category, city, format } = await searchParams;

  // Build query
  let sql = `
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
    WHERE e.status = 'PUBLISHED'
  `;

  if (category) sql += ` AND e.category_id = '${category}'`;
  if (city) sql += ` AND e.city ILIKE '%${city}%'`;
  if (format) sql += ` AND e.event_type = '${format.toUpperCase()}'`;
  if (q) sql += ` AND (e.title ILIKE '%${q}%' OR e.description ILIKE '%${q}%' OR e.city ILIKE '%${q}%')`;

  sql += ` GROUP BY e.id ORDER BY e.start_date ASC;`;

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
              Discover Verified Events &amp; Passes
            </h1>
            <p className="text-sm sm:text-base text-gray-400 leading-relaxed">
              Secure entry passes for flagship Rotaract conferences, cultural nights, and community initiatives.
            </p>
          </div>

          {/* Search Bar */}
          <form method="GET" action="/events" className="max-w-2xl flex gap-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-4 top-3.5 text-gray-400" />
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="Search events, clubs, cities..."
                className="w-full bg-white/10 border border-white/20 backdrop-blur-md rounded-2xl pl-11 pr-4 py-3 text-xs sm:text-sm text-white placeholder-gray-400 outline-none focus:border-[#1e9df1]"
              />
            </div>
            <button
              type="submit"
              className="bg-[#1e9df1] hover:bg-[#1583cd] text-white font-extrabold text-xs sm:text-sm px-6 py-3 rounded-2xl shadow-lg transition-all cursor-pointer"
            >
              Search
            </button>
          </form>

          {/* Category Filter Pills (Only rendered if specific event categories exist) */}
          {categories && categories.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none pt-1">
              <Link
                href="/events"
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                  !category ? "bg-[#1e9df1] text-white" : "bg-white/10 text-gray-300 hover:bg-white/20"
                }`}
              >
                All Events
              </Link>
              {categories.map((cat: any) => (
                <Link
                  key={cat.id}
                  href={`/events?category=${cat.id}`}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                    category === cat.id ? "bg-[#1e9df1] text-white" : "bg-white/10 text-gray-300 hover:bg-white/20"
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
        <EventsPageClient events={(events as any) || []} />
      </section>
    </main>
  );
}
