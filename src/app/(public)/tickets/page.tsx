import { getCurrentUser } from "@/lib/auth/getUser";
import { executeSql } from "@/lib/db/directDb";
import Link from "next/link";
import { Ticket as TicketIcon } from "lucide-react";
import { UserTicketsClient } from "./UserTicketsClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "My Tickets & Passes | RotaSphere District 3192",
  description: "View and manage your confirmed event tickets, QR code entry passes, and delegate credentials.",
  robots: {
    index: false,
    follow: true,
  },
};

export default async function MyTicketsPage() {
  const user = await getCurrentUser();
  let tickets: any[] = [];

  if (user?.clerkId) {
    const userEmailEscaped = user.email ? `'${user.email.replace(/'/g, "''")}'` : "NULL";
    const { data: ticketsData } = await executeSql(`
      SELECT t.*,
        json_build_object(
          'id', e.id,
          'title', e.title,
          'slug', e.slug,
          'start_date', e.start_date,
          'city', e.city,
          'venue_name', e.venue_name,
          'cover_image_url', e.cover_image_url
        ) as saas_events,
        json_build_object(
          'name', tt.name,
          'price', tt.price
        ) as saas_ticket_tiers
      FROM saas_tickets t
      LEFT JOIN saas_events e ON t.event_id = e.id
      LEFT JOIN saas_ticket_tiers tt ON t.ticket_tier_id = tt.id
      WHERE (t.owner_user_id = '${user.clerkId}' OR t.attendee_email = ${userEmailEscaped})
      ORDER BY t.created_at DESC;
    `);

    tickets = ticketsData || [];
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">My Tickets & Entry Passes</h1>
          <p className="text-sm text-gray-500 mt-1">
            Display your secure QR tokens at the gate scanner or transfer passes to friends.
          </p>
        </div>
        <Link
          href="/events"
          className="inline-flex items-center justify-center gap-2 bg-[#0758fc] hover:bg-[#054fe0] text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-all shadow-sm"
        >
          <TicketIcon size={16} /> Discover More Events
        </Link>
      </div>

      {/* Tickets List */}
      <UserTicketsClient initialTickets={tickets} userEmail={user?.email} />
    </div>
  );
}
