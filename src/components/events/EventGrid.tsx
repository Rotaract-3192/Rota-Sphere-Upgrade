/**
 * EventGrid — Responsive 4-Column Card Grid
 * Supports SaaS events query with multi-tier pricing calculation.
 */

import { executeSql } from "@/lib/db/directDb";
import { EventCard } from "./EventCard";

export interface EventWithPrice {
  id: string;
  slug: string;
  title: string;
  category?: string;
  thumbnail_url: string | null;
  city: string | null;
  start_date: string;
  minPrice: number | null;
  hasFreeTickets: boolean;
  sold_count?: number;
  capacity: number;
}

export interface EventGridProps {
  events?: any[];
  initialEvents?: any[];
  category?: string;
  city?: string;
  date?: string;
  ticketType?: "all" | "free" | "paid";
  limit?: number;
}

export function formatEvents(rawEvents: any[]): EventWithPrice[] {
  if (!rawEvents || !Array.isArray(rawEvents)) return [];

  return rawEvents.map((evt) => {
    const tiers = evt.saas_ticket_tiers || evt.rotasphere_ticket_tiers || [];
    const prices = Array.isArray(tiers) ? tiers.map((t: any) => Number(t.price)) : [];
    const validPrices = prices.filter((p: number) => !isNaN(p));
    const minPrice = validPrices.length > 0 ? Math.min(...validPrices) : null;
    const hasFreeTickets = validPrices.some((p: number) => p === 0);

    return {
      id: evt.id,
      slug: evt.slug,
      title: evt.title,
      category: evt.category || evt.category_id,
      thumbnail_url: evt.cover_image_url || evt.thumbnail_url || null,
      city: evt.city || null,
      start_date: evt.start_date,
      minPrice,
      hasFreeTickets,
      sold_count: evt.sold_count || 0,
      capacity: evt.capacity || 100,
    };
  });
}

export function EventGrid(props: EventGridProps) {
  const events = formatEvents(props.events || props.initialEvents || []);

  if (events.length === 0) {
    return (
      <div className="text-center py-16 px-4 bg-gray-900/30 rounded-3xl border border-white/5">
        <p className="text-sm font-semibold text-gray-400">No events found matching your criteria.</p>
        <p className="text-xs text-gray-500 mt-1">Try changing your filters or check back later for new events.</p>
      </div>
    );
  }

  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
      role="region"
      aria-label="Events list"
    >
      {events.map((event) => (
        <EventCard
          key={event.id}
          id={event.id}
          slug={event.slug}
          title={event.title}
          thumbnailUrl={event.thumbnail_url}
          city={event.city}
          startDate={event.start_date}
          price={event.minPrice}
          badge={event.hasFreeTickets ? "Free Entry" : undefined}
        />
      ))}
    </div>
  );
}

export async function ServerEventGrid(props: EventGridProps) {
  try {
    const limitCount = props.limit ?? 12;
    const sql = `
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
      GROUP BY e.id
      ORDER BY e.start_date ASC
      LIMIT ${limitCount};
    `;

    const { data: saasData } = await executeSql(sql);
    return <EventGrid events={saasData || []} />;
  } catch {
    return <EventGrid events={[]} />;
  }
}

export function EventGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
      aria-busy="true"
      aria-label="Loading events"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse flex flex-col gap-2">
          <div className="w-full aspect-[4/3] bg-gray-800 rounded-2xl" />
          <div className="h-4 bg-gray-800 rounded w-3/4 mt-1" />
          <div className="h-3 bg-gray-800 rounded w-1/2" />
          <div className="h-3 bg-gray-800 rounded w-1/4" />
        </div>
      ))}
    </div>
  );
}
