/**
 * EventGrid — Responsive Modern Event Card Grid
 * Formats rich event attributes (summary, venue, category, format, tiers)
 * and passes them to the high-converting EventCard.
 */

import { executeSql } from "@/lib/db/directDb";
import { EventCard } from "./EventCard";

export interface EventWithPrice {
  id: string;
  slug: string;
  title: string;
  summary?: string | null;
  description?: string | null;
  category?: string;
  category_name?: string | null;
  thumbnail_url: string | null;
  venue_name?: string | null;
  city: string | null;
  start_date: string;
  end_date?: string | null;
  status?: string | null;
  event_type?: string;
  minPrice: number | null;
  hasFreeTickets: boolean;
  sold_count?: number;
  capacity: number;
  organization_name?: string | null;
  hasGroupPasses?: boolean;
  allow_non_rotaract?: boolean;
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
    const hasGroupPasses = Array.isArray(tiers) && tiers.some((t: any) => t.is_bulk_slab || t.tier_type === "BULK");

    // Clean summary or strip HTML from description if summary is missing
    let cleanSummary = evt.summary?.trim() || "";
    if (!cleanSummary && evt.description) {
      cleanSummary = evt.description.replace(/<[^>]*>?/gm, "").trim();
    }

    return {
      id: evt.id,
      slug: evt.slug,
      title: evt.title,
      summary: cleanSummary || null,
      description: evt.description || null,
      category: evt.category || evt.category_id,
      category_name: evt.category_name || evt.category || null,
      thumbnail_url: evt.cover_image_url || evt.thumbnail_url || null,
      venue_name: evt.venue_name || null,
      city: evt.city || null,
      start_date: evt.start_date,
      end_date: evt.end_date || null,
      status: evt.status || null,
      event_type: evt.event_type || "OFFLINE",
      minPrice,
      hasFreeTickets,
      sold_count: evt.sold_count || 0,
      capacity: evt.capacity || 100,
      organization_name: evt.organization_name || evt.org_name || evt.club_name || null,
      hasGroupPasses,
      allow_non_rotaract: evt.allow_non_rotaract !== false,
    };
  });
}

export function EventGrid(props: EventGridProps) {
  const events = formatEvents(props.events || props.initialEvents || []);

  if (events.length === 0) {
    return (
      <div className="text-center py-16 px-4 bg-gray-50 dark:bg-gray-900/30 rounded-3xl border border-gray-200 dark:border-white/5">
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">No events found matching your criteria.</p>
        <p className="text-xs text-gray-500 mt-1">Try changing your filters or check back later for new events.</p>
      </div>
    );
  }

  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7"
      role="region"
      aria-label="Events list"
    >
      {events.map((event) => (
        <EventCard
          key={event.id}
          id={event.id}
          slug={event.slug}
          title={event.title}
          summary={event.summary}
          thumbnailUrl={event.thumbnail_url}
          venueName={event.venue_name}
          city={event.city}
          startDate={event.start_date}
          endDate={event.end_date}
          status={event.status}
          eventType={event.event_type}
          categoryName={event.category_name}
          price={event.minPrice}
          organizationName={event.organization_name}
          hasGroupPasses={event.hasGroupPasses}
          allowNonRotaract={event.allow_non_rotaract}
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
        o.name as organization_name,
        cat.name as category_name,
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
      LEFT JOIN organizations o ON e.organization_id = o.id
      LEFT JOIN event_categories cat ON e.category_id = cat.id
      LEFT JOIN saas_ticket_tiers t ON e.id = t.event_id
      WHERE e.status = 'PUBLISHED' AND e.deleted_at IS NULL
      GROUP BY e.id, o.name, cat.name
      ORDER BY e.created_at DESC NULLS LAST, e.start_date DESC
      LIMIT ${limitCount};
    `;

    const { data: saasData } = await executeSql(sql);
    return <EventGrid events={saasData || []} />;
  } catch {
    return <EventGrid events={[]} />;
  }
}

import { EventCardSkeleton } from "@/components/ui/LoadingSkeleton";

export function EventGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7"
      aria-busy="true"
      aria-label="Loading events"
    >
      {Array.from({ length: count }).map((_, i) => (
        <EventCardSkeleton key={i} />
      ))}
    </div>
  );
}
