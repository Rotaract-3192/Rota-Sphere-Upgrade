"use client";

/**
 * Organizer SaaS Hub Client
 * Enterprise-grade multi-tenant dashboard for Event Creation, Inventory, Attendees, Orders, and Scanner.
 */

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  LayoutDashboard,
  Calendar,
  Ticket,
  Users,
  ShoppingBag,
  QrCode,
  DollarSign,
  Settings,
  PlusCircle,
  Search,
  Filter,
  Download,
  Copy,
  Trash2,
  CheckCircle2,
  Clock,
  ChevronRight,
  TrendingUp,
  ShieldCheck,
  Tag,
  ExternalLink,
  Loader2,
  X,
  Sparkles,
} from "lucide-react";
import { createEventAction, duplicateEventAction, cancelEventAction } from "@/app/actions/eventActions";
import { CreateEventWizardModal } from "@/components/dashboard/CreateEventWizardModal";
import type { SaasEvent, TicketTierType } from "@/types/saas";

interface OrganizerDashboardClientProps {
  user: any;
  organization: any;
  initialEvents: any[];
  initialOrders: any[];
  initialTickets: any[];
  initialCoupons: any[];
}

export function OrganizerDashboardClient({
  user,
  organization,
  initialEvents,
  initialOrders,
  initialTickets,
  initialCoupons,
}: OrganizerDashboardClientProps) {
  const [activeTab, setActiveTab] = useState<
    "overview" | "events" | "tickets" | "attendees" | "orders" | "scanner" | "finance" | "settings"
  >("overview");

  const [events, setEvents] = useState(initialEvents);
  const [orders, setOrders] = useState(initialOrders);
  const [tickets, setTickets] = useState(initialTickets);
  const [coupons, setCoupons] = useState(initialCoupons);

  // Search queries
  const [attendeeSearch, setAttendeeSearch] = useState("");
  const [eventSearch, setEventSearch] = useState("");

  // Event Creation Wizard State
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardLoading, setWizardLoading] = useState(false);
  const [wizardTitle, setWizardTitle] = useState("");
  const [wizardDescription, setWizardDescription] = useState("");
  const [wizardCity, setWizardCity] = useState("Bengaluru");
  const [wizardVenue, setWizardVenue] = useState("");
  const [wizardEventType, setWizardEventType] = useState<"OFFLINE" | "ONLINE" | "HYBRID">("OFFLINE");
  const [wizardStartDate, setWizardStartDate] = useState("");
  const [wizardEndDate, setWizardEndDate] = useState("");
  const [wizardCapacity, setWizardCapacity] = useState(250);
  const [wizardCoverUrl, setWizardCoverUrl] = useState("");

  // Wizard Ticket Tiers
  const [wizardTiers, setWizardTiers] = useState<
    Array<{ name: string; tierType: TicketTierType; price: number; totalCapacity: number }>
  >([
    { name: "Early Bird Delegate Pass", tierType: "EARLY_BIRD", price: 499, totalCapacity: 100 },
    { name: "General Admission Pass", tierType: "REGULAR", price: 799, totalCapacity: 150 },
  ]);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  }

  // Calculate Metrics
  const totalGrossSales = orders
    .filter((o) => o.status === "PAID")
    .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
  const totalTicketsIssued = tickets.length;
  const totalCheckedIn = tickets.filter((t) => t.status === "USED").length;
  const checkInRate = totalTicketsIssued > 0 ? Math.round((totalCheckedIn / totalTicketsIssued) * 100) : 0;

  async function handleCreateEvent(e: React.FormEvent) {
    e.preventDefault();
    if (!wizardTitle.trim() || !wizardStartDate || !wizardEndDate) {
      alert("Please fill in event title and dates");
      return;
    }

    setWizardLoading(true);

    const res = await createEventAction({
      title: wizardTitle.trim(),
      description: wizardDescription.trim() || "Annual district conference and networking summit.",
      city: wizardCity,
      venueName: wizardVenue.trim() || undefined,
      eventType: wizardEventType,
      startDate: new Date(wizardStartDate).toISOString(),
      endDate: new Date(wizardEndDate).toISOString(),
      capacity: wizardCapacity,
      coverImageUrl: wizardCoverUrl.trim() || undefined,
      ticketTiers: wizardTiers,
    });

    setWizardLoading(false);

    if (res.success) {
      setWizardOpen(false);
      showToast("Event successfully created and published live!");
      window.location.reload();
    } else {
      alert(res.error || "Failed to create event");
    }
  }

  async function handleDuplicateEvent(eventId: string) {
    const res = await duplicateEventAction(eventId);
    if (res.success) {
      showToast("Event duplicated into Drafts!");
      window.location.reload();
    } else {
      alert(res.error || "Duplicate failed");
    }
  }

  async function handleCancelEvent(eventId: string) {
    if (!confirm("Are you sure you want to cancel this event? All tickets will be invalidated.")) return;
    const res = await cancelEventAction(eventId, "Cancelled by organizer");
    if (res.success) {
      showToast("Event marked as CANCELLED");
      window.location.reload();
    }
  }

  function handleExportAttendeesCSV() {
    if (tickets.length === 0) {
      alert("No attendees to export");
      return;
    }
    const headers = ["Ticket Code", "Attendee Name", "Email", "Phone", "Event", "Tier", "Status", "Checked In At"];
    const rows = tickets.map((t) => [
      t.ticket_code,
      `"${t.attendee_name}"`,
      t.attendee_email,
      t.attendee_phone || "",
      `"${t.saas_events?.title || ""}"`,
      `"${t.saas_ticket_tiers?.name || ""}"`,
      t.status,
      t.checked_in_at || "",
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `attendees-export-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Filtered lists
  const filteredEvents = events.filter((e) =>
    e.title.toLowerCase().includes(eventSearch.toLowerCase()) || e.city.toLowerCase().includes(eventSearch.toLowerCase())
  );

  const filteredTickets = tickets.filter(
    (t) =>
      t.attendee_name.toLowerCase().includes(attendeeSearch.toLowerCase()) ||
      t.attendee_email.toLowerCase().includes(attendeeSearch.toLowerCase()) ||
      t.ticket_code.toLowerCase().includes(attendeeSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      
      {/* ── SIDEBAR NAVIGATION ────────────────────────────────────────── */}
      <aside className="w-full md:w-64 bg-gray-900 text-white flex-shrink-0 flex flex-col justify-between p-4 sm:p-6 border-r border-gray-800">
        <div className="space-y-6">
          
          {/* Org Wordmark */}
          <div className="px-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400 block">
              Organizer Portal
            </span>
            <h1 className="text-xl font-extrabold text-white tracking-tight mt-0.5">
              {organization?.name || "District 3192 Hub"}
            </h1>
            <p className="text-xs text-gray-400 mt-1">Multi-Tenant SaaS</p>
          </div>

          {/* Nav Items */}
          <nav className="space-y-1">
            {[
              { id: "overview", label: "Dashboard", icon: LayoutDashboard },
              { id: "events", label: "Events Manager", icon: Calendar },
              { id: "tickets", label: "Tickets & Inventory", icon: Ticket },
              { id: "attendees", label: "Attendee Database", icon: Users },
              { id: "orders", label: "Orders & Revenue", icon: ShoppingBag },
              { id: "scanner", label: "Gate Scanner Ops", icon: QrCode },
              { id: "finance", label: "Finance & Payouts", icon: DollarSign },
              { id: "settings", label: "Team & Settings", icon: Settings },
            ].map(({ id, label, icon: Icon }) => {
              const active = activeTab === id;
              return (
                <button
                  key={id}
                  onClick={() => setActiveTab(id as any)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    active
                      ? "bg-[#ff385c] text-white shadow-sm"
                      : "text-gray-400 hover:bg-gray-800 hover:text-white"
                  }`}
                >
                  <Icon size={16} />
                  <span>{label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Card */}
        <div className="p-3 bg-gray-800/80 rounded-2xl flex items-center gap-3 mt-6 border border-gray-700/50">
          <div className="w-8 h-8 rounded-full bg-amber-400 text-gray-900 font-bold flex items-center justify-center text-xs">
            {user?.profile?.full_name?.charAt(0) || "O"}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-white truncate">{user?.profile?.full_name || "Rotaract Leader"}</p>
            <p className="text-[10px] text-gray-400 truncate">{user?.email || "organizer@rotasphere.org"}</p>
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT AREA ─────────────────────────────────────────── */}
      <main className="flex-1 p-6 sm:p-10 space-y-8 max-w-7xl overflow-x-hidden">
        
        {/* Toast */}
        {toastMessage && (
          <div className="fixed top-6 right-6 z-50 bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-gray-700 text-xs font-bold flex items-center gap-2">
            <Sparkles size={14} className="text-amber-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* ── 1. OVERVIEW TAB ─────────────────────────────────────────── */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                  Overview & Real-Time Sales
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  Live ticket sales velocity, registrations, and gate check-in statistics.
                </p>
              </div>

              <button
                onClick={() => setWizardOpen(true)}
                className="inline-flex items-center gap-2 bg-[#ff385c] hover:bg-[#e00b41] text-white font-bold text-xs px-5 py-3 rounded-xl transition-all shadow-md cursor-pointer hover:scale-105"
              >
                <PlusCircle size={16} /> Create New Event
              </button>
            </div>

            {/* Metric KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="bg-white border border-gray-200 p-6 rounded-3xl shadow-xs space-y-1">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Gross Ticket GMV</span>
                <p className="text-2xl sm:text-3xl font-extrabold text-gray-900">₹{totalGrossSales.toLocaleString("en-IN")}</p>
                <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1 pt-1">
                  <TrendingUp size={13} /> Real-Time Settlement
                </span>
              </div>

              <div className="bg-white border border-gray-200 p-6 rounded-3xl shadow-xs space-y-1">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Tickets Issued</span>
                <p className="text-2xl sm:text-3xl font-extrabold text-gray-900">{totalTicketsIssued}</p>
                <span className="text-[11px] font-semibold text-gray-500 pt-1 block">Across {events.length} Events</span>
              </div>

              <div className="bg-white border border-gray-200 p-6 rounded-3xl shadow-xs space-y-1">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Gate Check-in Rate</span>
                <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600">{checkInRate}%</p>
                <span className="text-[11px] font-semibold text-gray-500 pt-1 block">{totalCheckedIn} of {totalTicketsIssued} Scanned</span>
              </div>

              <div className="bg-white border border-gray-200 p-6 rounded-3xl shadow-xs space-y-1">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Live Events</span>
                <p className="text-2xl sm:text-3xl font-extrabold text-amber-500">
                  {events.filter((e) => e.status === "PUBLISHED").length}
                </p>
                <span className="text-[11px] font-semibold text-gray-500 pt-1 block">Active on discovery</span>
              </div>
            </div>

            {/* Quick Actions & Recent Events */}
            <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">Your Active Events</h3>
                <Link
                  href="/events"
                  className="text-xs font-bold text-[#ff385c] hover:underline flex items-center gap-1"
                >
                  View Public Discovery <ExternalLink size={13} />
                </Link>
              </div>

              {events.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl p-6 space-y-3">
                  <Calendar className="mx-auto text-gray-300" size={36} />
                  <p className="text-sm font-semibold text-gray-700">No events published yet</p>
                  <p className="text-xs text-gray-400">Click &quot;Create New Event&quot; to publish your first conference, tournament or workshop.</p>
                  <button
                    onClick={() => setWizardOpen(true)}
                    className="inline-flex items-center gap-2 bg-[#ff385c] hover:bg-[#e00b41] text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer"
                  >
                    <PlusCircle size={14} /> Create Event Now
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {events.map((evt) => (
                    <div key={evt.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <Link href={`/events/${evt.slug}`} className="text-base font-bold text-gray-900 hover:text-[#ff385c] transition-colors">
                          {evt.title}
                        </Link>
                        <p className="text-xs text-gray-500 mt-1">
                          Status: <span className="font-bold text-emerald-600">{evt.status}</span> · City: {evt.city} · Date: {new Date(evt.start_date).toLocaleDateString("en-IN")} · Capacity: {evt.capacity}
                        </p>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <Link
                          href={`/check-in?eventId=${evt.id}`}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-900 bg-gray-100 hover:bg-gray-200 px-3.5 py-2 rounded-xl transition-colors"
                        >
                          <QrCode size={14} /> Scanner
                        </Link>
                        <button
                          onClick={() => handleDuplicateEvent(evt.id)}
                          title="Duplicate Event"
                          className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 cursor-pointer"
                        >
                          <Copy size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── 2. EVENTS MANAGER TAB ───────────────────────────────────── */}
        {activeTab === "events" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-extrabold text-gray-900">Events Management</h2>
                <p className="text-xs text-gray-500 mt-1">Create, clone, edit, and moderate your organization&apos;s events.</p>
              </div>

              <button
                onClick={() => setWizardOpen(true)}
                className="inline-flex items-center gap-2 bg-[#ff385c] hover:bg-[#e00b41] text-white font-bold text-xs px-5 py-3 rounded-xl transition-all shadow-md cursor-pointer"
              >
                <PlusCircle size={16} /> Create Event
              </button>
            </div>

            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-3 text-gray-400" />
              <input
                type="text"
                value={eventSearch}
                onChange={(e) => setEventSearch(e.target.value)}
                placeholder="Search events by title or city..."
                className="w-full bg-white border border-gray-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-gray-900 outline-none focus:border-amber-400 shadow-xs"
              />
            </div>

            <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-xs">
              <div className="divide-y divide-gray-100">
                {filteredEvents.length === 0 ? (
                  <p className="p-8 text-center text-xs text-gray-500">No events found matching your search.</p>
                ) : (
                  filteredEvents.map((evt) => (
                    <div key={evt.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-base font-bold text-gray-900">{evt.title}</span>
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {evt.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">
                          {evt.city} · Start: {new Date(evt.start_date).toLocaleDateString("en-IN")} · Capacity: {evt.capacity}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link
                          href={`/events/${evt.slug}`}
                          className="px-3.5 py-2 rounded-xl text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                        >
                          View Page
                        </Link>
                        <button
                          onClick={() => handleDuplicateEvent(evt.id)}
                          className="px-3.5 py-2 rounded-xl text-xs font-bold text-gray-700 border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                          Duplicate
                        </button>
                        <button
                          onClick={() => handleCancelEvent(evt.id)}
                          className="px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── 3. TICKETS & INVENTORY TAB ──────────────────────────────── */}
        {activeTab === "tickets" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-extrabold text-gray-900">Tickets & Live Inventory</h2>
              <p className="text-xs text-gray-500 mt-1">
                Real-time capacity tracking, tiered ticket pricing, and promo coupon builder.
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
              <h3 className="text-base font-bold text-gray-900">Inventory Status by Tier</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-400 uppercase tracking-wider font-bold">
                      <th className="pb-3">Ticket Tier</th>
                      <th className="pb-3">Event</th>
                      <th className="pb-3">Price</th>
                      <th className="pb-3">Total Capacity</th>
                      <th className="pb-3">Sold</th>
                      <th className="pb-3">Available</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                    {events.flatMap((e) =>
                      (e.saas_ticket_tiers || []).map((t: any) => {
                        const avail = t.total_capacity - t.sold_count;
                        return (
                          <tr key={t.id}>
                            <td className="py-3.5 font-bold text-gray-900">{t.name}</td>
                            <td className="py-3.5 text-gray-500">{e.title}</td>
                            <td className="py-3.5 font-bold text-[#ff385c]">{Number(t.price) === 0 ? "FREE" : `₹${t.price}`}</td>
                            <td className="py-3.5">{t.total_capacity}</td>
                            <td className="py-3.5 text-emerald-600 font-bold">{t.sold_count}</td>
                            <td className="py-3.5 font-bold">{Math.max(0, avail)}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── 4. ATTENDEES DIRECTORY TAB ──────────────────────────────── */}
        {activeTab === "attendees" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-extrabold text-gray-900">Attendee Directory</h2>
                <p className="text-xs text-gray-500 mt-1">Search, filter, and export registered delegates with QR code pass status.</p>
              </div>

              <button
                onClick={handleExportAttendeesCSV}
                className="inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs px-5 py-3 rounded-xl transition-all shadow-sm cursor-pointer"
              >
                <Download size={15} /> Export CSV / Excel
              </button>
            </div>

            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-3 text-gray-400" />
              <input
                type="text"
                value={attendeeSearch}
                onChange={(e) => setAttendeeSearch(e.target.value)}
                placeholder="Search attendees by name, email, or ticket code..."
                className="w-full bg-white border border-gray-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-gray-900 outline-none focus:border-amber-400 shadow-xs"
              />
            </div>

            <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-400 uppercase tracking-wider font-bold">
                    <tr>
                      <th className="py-3.5 px-6">Ticket Code</th>
                      <th className="py-3.5 px-6">Attendee</th>
                      <th className="py-3.5 px-6">Event</th>
                      <th className="py-3.5 px-6">Tier</th>
                      <th className="py-3.5 px-6">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                    {filteredTickets.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-gray-400">
                          No attendees registered yet.
                        </td>
                      </tr>
                    ) : (
                      filteredTickets.map((t) => (
                        <tr key={t.id} className="hover:bg-gray-50/50">
                          <td className="py-3.5 px-6 font-mono font-bold text-gray-900">{t.ticket_code}</td>
                          <td className="py-3.5 px-6">
                            <p className="font-bold text-gray-900">{t.attendee_name}</p>
                            <p className="text-[11px] text-gray-400">{t.attendee_email}</p>
                          </td>
                          <td className="py-3.5 px-6 text-gray-600">{t.saas_events?.title || "Event"}</td>
                          <td className="py-3.5 px-6">{t.saas_ticket_tiers?.name || "Standard"}</td>
                          <td className="py-3.5 px-6">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                                t.status === "USED"
                                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                                  : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              }`}
                            >
                              ● {t.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── 5. ORDERS & FINANCIALS TAB ──────────────────────────────── */}
        {activeTab === "orders" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-extrabold text-gray-900">Orders & Invoices</h2>
              <p className="text-xs text-gray-500 mt-1">Transaction ledgers, gateway confirmations, and payment statuses.</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-400 uppercase tracking-wider font-bold">
                    <tr>
                      <th className="py-3.5 px-6">Order ID</th>
                      <th className="py-3.5 px-6">Customer</th>
                      <th className="py-3.5 px-6">Amount</th>
                      <th className="py-3.5 px-6">Gateway</th>
                      <th className="py-3.5 px-6">Status</th>
                      <th className="py-3.5 px-6">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                    {orders.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-gray-400">
                          No orders processed yet.
                        </td>
                      </tr>
                    ) : (
                      orders.map((o) => (
                        <tr key={o.id} className="hover:bg-gray-50/50">
                          <td className="py-3.5 px-6 font-mono font-bold text-gray-900">{o.order_number}</td>
                          <td className="py-3.5 px-6">
                            <p className="font-bold text-gray-900">{o.customer_name}</p>
                            <p className="text-[11px] text-gray-400">{o.customer_email}</p>
                          </td>
                          <td className="py-3.5 px-6 font-extrabold text-gray-900">₹{o.total_amount}</td>
                          <td className="py-3.5 px-6 uppercase text-[11px] font-bold text-gray-500">{o.payment_gateway || "Razorpay"}</td>
                          <td className="py-3.5 px-6">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                                o.status === "PAID"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-amber-50 text-amber-700 border border-amber-200"
                              }`}
                            >
                              ● {o.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-6 text-gray-400">
                            {new Date(o.created_at).toLocaleDateString("en-IN")}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── 6. SCANNER OPERATIONS TAB ───────────────────────────────── */}
        {activeTab === "scanner" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-extrabold text-gray-900">Staff Gate Scanner Operations</h2>
              <p className="text-xs text-gray-500 mt-1">
                Launch the mobile-first barcode scanner or assign gate credentials to volunteers.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white border border-gray-200 p-8 rounded-3xl shadow-xs space-y-4">
                <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                  <QrCode size={24} />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Launch Gate Check-In PWA</h3>
                <p className="text-xs text-gray-500">
                  Open the high-speed camera scanner with sound feedback and offline local validation.
                </p>
                <Link
                  href="/check-in"
                  className="inline-flex items-center gap-2 bg-[#ff385c] hover:bg-[#e00b41] text-white font-bold text-xs px-6 py-3.5 rounded-xl transition-all shadow-md"
                >
                  <QrCode size={16} /> Open Scanner Interface
                </Link>
              </div>

              <div className="bg-white border border-gray-200 p-8 rounded-3xl shadow-xs space-y-4">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                  <ShieldCheck size={24} />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Duplicate Scan Protection</h3>
                <p className="text-xs text-gray-500">
                  Tickets already scanned at any gate immediately trigger a yellow alert preventing pass sharing.
                </p>
                <div className="p-3 bg-gray-50 rounded-xl text-xs font-mono text-gray-600 border border-gray-200">
                  Enforced at Database Layer · Concurrency Safe
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── 7. FINANCE & PAYOUTS TAB ─────────────────────────────────── */}
        {activeTab === "finance" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-extrabold text-gray-900">Finance & Payouts</h2>
              <p className="text-xs text-gray-500 mt-1">Gross sales, platform fees, GST breakdown, and settlement balances.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-white border border-gray-200 p-6 rounded-3xl shadow-xs">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Gross Revenue</span>
                <p className="text-2xl font-extrabold text-gray-900 mt-1">₹{totalGrossSales.toLocaleString("en-IN")}</p>
              </div>
              <div className="bg-white border border-gray-200 p-6 rounded-3xl shadow-xs">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Platform Commission (3.5%)</span>
                <p className="text-2xl font-extrabold text-gray-500 mt-1">₹{(totalGrossSales * 0.035).toFixed(2)}</p>
              </div>
              <div className="bg-white border border-gray-200 p-6 rounded-3xl shadow-xs">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Net Estimated Payout</span>
                <p className="text-2xl font-extrabold text-emerald-600 mt-1">₹{(totalGrossSales * 0.965).toFixed(2)}</p>
              </div>
            </div>
          </div>
        )}

        {/* ── 8. SETTINGS & TEAM TAB ──────────────────────────────────── */}
        {activeTab === "settings" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-extrabold text-gray-900">Organization Settings & RBAC</h2>
              <p className="text-xs text-gray-500 mt-1">Configure tenant information, KYC documents, and team roles.</p>
            </div>

            <div className="bg-white border border-gray-200 p-8 rounded-3xl shadow-xs space-y-4">
              <h3 className="text-base font-bold text-gray-900">Organization Profile</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="font-bold text-gray-500 block mb-1">Organization Name</span>
                  <p className="font-semibold text-gray-900">{organization?.name || "District 3192 Enterprise"}</p>
                </div>
                <div>
                  <span className="font-bold text-gray-500 block mb-1">KYC Verification Status</span>
                  <span className="inline-block bg-emerald-50 text-emerald-700 font-bold px-3 py-1 rounded-full border border-emerald-200">
                    ● VERIFIED
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* ── 5-STEP EVENT CREATION WIZARD MODAL ───────────────────────── */}
      <CreateEventWizardModal
        isOpen={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onSuccess={(slug) => {
          setWizardOpen(false);
          showToast("Event successfully created and published live!");
          window.location.reload();
        }}
      />
    </div>
  );
}
