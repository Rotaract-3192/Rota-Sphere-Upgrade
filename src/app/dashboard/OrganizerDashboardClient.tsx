"use client";

/**
 * Organizer SaaS Hub Client
 * Enterprise-grade multi-tenant dashboard with:
 * 1. Event Creation & Live Editing Wizard
 * 2. Excel / CSV Registration Exporter
 * 3. 30-Day Soft-Delete Trash Bin with Restore & Permanent Delete
 * 4. Inventory, Attendees, Orders, and Gate Scanner Ops
 */

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  Edit3,
  FileSpreadsheet,
  RotateCcw,
  AlertTriangle,
  Archive,
  ShieldAlert,
  Megaphone,
} from "lucide-react";
import {
  duplicateEventAction,
  cancelEventAction,
  trashEventAction,
  restoreEventAction,
  permanentDeleteEventAction,
  getEventRegistrationsAction,
} from "@/app/actions/eventActions";
import { verifyOrderPaymentAction } from "@/app/actions/orderActions";
import { CreateEventWizardModal } from "@/components/dashboard/CreateEventWizardModal";
import { BulkEmailModal } from "@/components/shared/BulkEmailModal";
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
    "overview" | "events" | "tickets" | "attendees" | "orders" | "scanner" | "finance" | "settings" | "trash"
  >("overview");

  const [events, setEvents] = useState(initialEvents);
  const [orders, setOrders] = useState(initialOrders);
  const [tickets, setTickets] = useState(initialTickets);
  const [coupons, setCoupons] = useState(initialCoupons);

  // Search queries
  const [attendeeSearch, setAttendeeSearch] = useState("");
  const [eventSearch, setEventSearch] = useState("");

  // Event Wizard & Edit State
  const [wizardOpen, setWizardOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<any | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Bulk Email Broadcast State
  const [isBulkEmailOpen, setIsBulkEmailOpen] = useState(false);
  const [selectedBroadcastEventId, setSelectedBroadcastEventId] = useState<string>("");

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  }

  // Active vs Trashed Event lists
  const activeEvents = events.filter((e) => !e.deleted_at && e.status !== "TRASHED");
  const trashedEvents = events.filter((e) => e.deleted_at || e.status === "TRASHED");

  // Calculate Metrics
  const totalGrossSales = orders
    .filter((o) => o.status === "PAID")
    .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
  const totalTicketsIssued = tickets.length;
  const totalCheckedIn = tickets.filter((t) => t.status === "USED").length;
  const checkInRate = totalTicketsIssued > 0 ? Math.round((totalCheckedIn / totalTicketsIssued) * 100) : 0;

  // Filtered queries
  const filteredEvents = activeEvents.filter(
    (e) =>
      e.title.toLowerCase().includes(eventSearch.toLowerCase()) ||
      e.city?.toLowerCase().includes(eventSearch.toLowerCase())
  );

  const filteredTickets = tickets.filter(
    (t) =>
      t.attendee_name?.toLowerCase().includes(attendeeSearch.toLowerCase()) ||
      t.attendee_email?.toLowerCase().includes(attendeeSearch.toLowerCase()) ||
      t.ticket_code?.toLowerCase().includes(attendeeSearch.toLowerCase())
  );

  // ─── 1. EDIT EVENT ──────────────────────────────────────────────────────────
  function handleOpenCreateModal() {
    setEventToEdit(null);
    setWizardOpen(true);
  }

  function handleOpenEditModal(evt: any) {
    setEventToEdit(evt);
    setWizardOpen(true);
  }

  // ─── 2. DUPLICATE & CANCEL EVENT ───────────────────────────────────────────
  async function handleDuplicateEvent(eventId: string) {
    setActionLoadingId(eventId);
    const res = await duplicateEventAction(eventId);
    setActionLoadingId(null);
    if (res.success) {
      showToast("Event duplicated successfully into Drafts!");
      window.location.reload();
    } else {
      alert(res.error || "Duplicate failed");
    }
  }

  async function handleCancelEvent(eventId: string) {
    if (!confirm("Are you sure you want to cancel this event? All active tickets will be marked cancelled.")) return;
    setActionLoadingId(eventId);
    const res = await cancelEventAction(eventId, "Cancelled by organizer");
    setActionLoadingId(null);
    if (res.success) {
      showToast("Event marked as CANCELLED");
      window.location.reload();
    }
  }

  const router = useRouter();

  // ─── 3. TRASH BIN (30-DAY RETENTION) ────────────────────────────────────────
  async function handleTrashEvent(eventId: string, title: string) {
    if (!confirm(`Move "${title}" to Trash Bin? It will be held safely for 30 days before permanent removal.`)) return;
    setActionLoadingId(eventId);
    const res = await trashEventAction(eventId);
    setActionLoadingId(null);
    if (res.success) {
      showToast(`"${title}" moved to Trash Bin (stored for 30 days)`);
      setEvents((prev) =>
        prev.map((e) => (e.id === eventId ? { ...e, status: "TRASHED", deleted_at: new Date().toISOString() } : e))
      );
      router.refresh();
    } else {
      alert(res.error || "Failed to move event to trash");
    }
  }

  async function handleRestoreEvent(eventId: string, title: string) {
    setActionLoadingId(eventId);
    const res = await restoreEventAction(eventId);
    setActionLoadingId(null);
    if (res.success) {
      showToast(`"${title}" successfully restored back to Active listings!`);
      setEvents((prev) =>
        prev.map((e) => (e.id === eventId ? { ...e, status: "PUBLISHED", deleted_at: null } : e))
      );
      router.refresh();
    } else {
      alert(res.error || "Failed to restore event");
    }
  }

  async function handlePermanentDelete(eventId: string, title: string) {
    if (!confirm(`⚠️ PERMANENTLY DELETE "${title}"?\n\nThis will permanently remove this event and its associated ticket data from the database. This action CANNOT be undone.`)) return;
    setActionLoadingId(eventId);
    const res = await permanentDeleteEventAction(eventId);
    setActionLoadingId(null);
    if (res.success) {
      showToast(`"${title}" permanently deleted.`);
      setEvents((prev) => prev.filter((e) => e.id !== eventId));
      router.refresh();
    } else {
      alert(res.error || "Failed to delete event permanently");
    }
  }

  function getDaysRemainingInTrash(deletedAt: string | null | undefined): number {
    if (!deletedAt) return 30;
    const deletedTime = new Date(deletedAt).getTime();
    const elapsedDays = Math.floor((Date.now() - deletedTime) / (1000 * 60 * 60 * 24));
    return Math.max(0, 30 - elapsedDays);
  }

  // ─── 4. EXCEL / CSV REGISTRATION EXPORTER ──────────────────────────────────
  function downloadCsvFile(content: string, fileName: string) {
    // Add UTF-8 BOM so Excel opens Indian names and symbols flawlessly
    const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  async function handleExportEventRegistrations(eventId: string, eventTitle: string) {
    setActionLoadingId(eventId);
    showToast(`Generating Excel export for "${eventTitle}"...`);
    const res = await getEventRegistrationsAction(eventId);
    setActionLoadingId(null);

    const headers = [
      "Ticket / Pass ID",
      "Event Title",
      "Attendee Name",
      "Attendee Email",
      "Attendee Phone",
      "Ticket Tier",
      "Amount Paid (INR)",
      "Payment Status",
      "Check-In Status",
      "Checked-In Timestamp",
      "Registration Date",
      "QR Gate Token",
    ];

    let rows: string[][] = [];

    if (res.success && res.data && res.data.length > 0) {
      rows = res.data.map((t: any) => [
        t.ticket_id || "",
        `"${(t.event_title || eventTitle).replace(/"/g, '""')}"`,
        `"${(t.attendee_name || "Delegate").replace(/"/g, '""')}"`,
        t.attendee_email || "",
        t.attendee_phone || "",
        `"${(t.tier_name || "General Admission").replace(/"/g, '""')}"`,
        t.unit_price || "0",
        t.order_status || "PAID",
        t.ticket_status === "USED" ? "CHECKED_IN" : "PENDING",
        t.checked_in_at ? new Date(t.checked_in_at).toLocaleString("en-IN") : "Not Scanned",
        t.created_at ? new Date(t.created_at).toLocaleString("en-IN") : "",
        t.qr_token || "",
      ]);
    } else {
      // Fallback to local tickets if any match
      const matchingTickets = tickets.filter(
        (t) => t.event_id === eventId || t.saas_events?.title === eventTitle
      );
      if (matchingTickets.length === 0) {
        // Generate header-only template for user
        rows = [
          [
            "EXAMPLE-TKT-001",
            `"${eventTitle.replace(/"/g, '""')}"`,
            "Sample Attendee",
            "attendee@example.com",
            "+91 9876543210",
            "General Delegate Pass",
            "0",
            "CONFIRMED",
            "PENDING",
            "Not Scanned",
            new Date().toLocaleString("en-IN"),
            "qr_sample_token_demo",
          ],
        ];
      } else {
        rows = matchingTickets.map((t) => [
          t.ticket_code || t.id,
          `"${(t.saas_events?.title || eventTitle).replace(/"/g, '""')}"`,
          `"${(t.attendee_name || "Delegate").replace(/"/g, '""')}"`,
          t.attendee_email || "",
          t.attendee_phone || "",
          `"${(t.saas_ticket_tiers?.name || "Standard").replace(/"/g, '""')}"`,
          t.unit_price || "0",
          "PAID",
          t.status === "USED" ? "CHECKED_IN" : "PENDING",
          t.checked_in_at ? new Date(t.checked_in_at).toLocaleString("en-IN") : "Not Scanned",
          new Date().toLocaleString("en-IN"),
          t.qr_code_hash || "",
        ]);
      }
    }

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const sanitizedTitle = eventTitle.replace(/[^a-zA-Z0-9]/g, "_");
    downloadCsvFile(csvContent, `${sanitizedTitle}_Registrations_${new Date().toISOString().slice(0, 10)}.csv`);
    showToast(`✓ Excel spreadsheet downloaded for "${eventTitle}"`);
  }

  function handleExportAllAttendeesCSV() {
    if (tickets.length === 0) {
      alert("No attendees to export");
      return;
    }
    const headers = [
      "Ticket Code",
      "Attendee Name",
      "Email",
      "Phone",
      "Event Title",
      "Ticket Tier",
      "Status",
      "Checked In At",
      "QR Hash",
    ];
    const rows = tickets.map((t) => [
      t.ticket_code,
      `"${(t.attendee_name || "").replace(/"/g, '""')}"`,
      t.attendee_email || "",
      t.attendee_phone || "",
      `"${(t.saas_events?.title || "").replace(/"/g, '""')}"`,
      `"${(t.saas_ticket_tiers?.name || "").replace(/"/g, '""')}"`,
      t.status,
      t.checked_in_at ? new Date(t.checked_in_at).toLocaleString("en-IN") : "Pending",
      t.qr_code_hash || "",
    ]);

    const csvContent = [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    downloadCsvFile(csvContent, `RotaSphere_All_Attendees_${new Date().toISOString().slice(0, 10)}.csv`);
    showToast("✓ All attendees exported to Excel spreadsheet");
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row text-gray-900">
      
      {/* ── MOBILE TOP NAV (visible below md) ───────────────────────────── */}
      <div className="md:hidden bg-gray-900 text-white border-b border-gray-800 px-4 pt-3 pb-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="relative w-7 h-7 rounded-lg overflow-hidden bg-white shrink-0">
              <Image src="/brand/logo.png" alt="Logo" fill className="object-contain p-0.5" priority />
            </div>
            <span className="text-sm font-extrabold text-white truncate max-w-[160px]">{organization?.name || "Dashboard"}</span>
          </div>
          <Link href="/" className="text-[11px] font-bold text-gray-400 hover:text-white bg-gray-800 px-2.5 py-1.5 rounded-lg border border-gray-700 flex items-center gap-1">
            <ExternalLink size={12} /> Exit
          </Link>
        </div>
        {/* Horizontal scrollable tab bar */}
        <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-1">
          {[
            { id: "overview", label: "Overview 🏠", icon: LayoutDashboard },
            { id: "events", label: `My Events (${activeEvents.length})`, icon: Calendar },
            { id: "tickets", label: "Passes 🎟️", icon: Ticket },
            { id: "attendees", label: `Guest List (${tickets.length})`, icon: Users },
            { id: "orders", label: orders.filter((o: any) => o.status === "PENDING_VERIFICATION").length > 0 ? `Bookings (${orders.filter((o: any) => o.status === "PENDING_VERIFICATION").length} ⚡)` : "Bookings 💳", icon: ShoppingBag },
            { id: "scanner", label: "QR Scanner 📱", icon: QrCode },
            { id: "finance", label: "Earnings 💰", icon: DollarSign },
            { id: "broadcast", label: "Send Emails 📢", icon: Megaphone },
            { id: "trash", label: `Recycle Bin (${trashedEvents.length})`, icon: Trash2 },
            { id: "settings", label: "Settings ⚙️", icon: Settings },
          ].map(({ id, label, icon: Icon }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                  active ? "bg-[#1e9df1] text-white" : "bg-gray-800 text-gray-400"
                }`}
              >
                <Icon size={13} />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── SIDEBAR NAVIGATION (desktop only) ────────────────────────── */}
      <aside className="hidden md:flex w-64 bg-gray-900 text-white p-5 flex-col justify-between flex-shrink-0 border-r border-gray-800">
        <div className="space-y-6">
          
          {/* Brand Header */}
          <div className="px-2 pt-2 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="relative w-9 h-9 rounded-xl overflow-hidden shadow-xs bg-white shrink-0">
                  <Image
                    src="/brand/logo.png"
                    alt="Rotaract District 3192 Ticketing Logo"
                    fill
                    className="object-contain p-0.5"
                    priority
                  />
                </div>
                <div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-[#3b82f6] block leading-none">
                    ORGANIZER
                  </span>
                  <span className="text-[11px] font-extrabold text-white leading-none">
                    District 3192
                  </span>
                </div>
              </div>
              <Link
                href="/"
                className="text-[11px] font-bold text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 px-2.5 py-1 rounded-lg border border-gray-700 flex items-center gap-1 transition-colors"
                title="Exit to Public Homepage"
              >
                <ExternalLink size={12} /> Exit
              </Link>
            </div>
            <h1 className="text-lg font-extrabold text-white tracking-tight mt-1 truncate">
              {organization?.name || "District 3192 Hub"}
            </h1>
            <p className="text-xs text-gray-400">Organizer Portal</p>

            {/* If SuperAdmin, show quick switcher banner */}
            {(user?.profile?.role === "super_admin" || user?.email === "thejaswinps@gmail.com") && (
              <Link
                href="/admin"
                className="w-full flex items-center justify-center gap-2 bg-amber-400/15 hover:bg-amber-400/25 text-amber-300 hover:text-white border border-amber-400/30 font-bold text-xs py-2 px-3 rounded-xl transition-all shadow-xs"
              >
                <ShieldAlert size={14} className="text-amber-400" />
                <span>Super Admin Panel</span>
              </Link>
            )}
          </div>

          {/* Nav Items */}
          <nav className="space-y-1">
            {[
              { id: "overview", label: "Overview", icon: LayoutDashboard },
              { id: "events", label: `My Events (${activeEvents.length})`, icon: Calendar },
              { id: "tickets", label: "Passes & Tiers", icon: Ticket },
              { id: "attendees", label: `Guest List (${tickets.length})`, icon: Users },
              {
                id: "orders",
                label: orders.filter((o: any) => o.status === "PENDING_VERIFICATION").length > 0
                  ? `Bookings & Sales (${orders.filter((o: any) => o.status === "PENDING_VERIFICATION").length} ⚡)`
                  : "Bookings & Sales",
                icon: ShoppingBag,
              },
              { id: "scanner", label: "QR Entry Scanner", icon: QrCode },
              { id: "finance", label: "Earnings & Payouts", icon: DollarSign },
              { id: "broadcast", label: "Send Email Broadcast 📢", icon: Megaphone, isBroadcast: true },
              { id: "trash", label: `Recycle Bin (${trashedEvents.length})`, icon: Trash2, isTrash: true },
              { id: "settings", label: "Account Settings", icon: Settings },
            ].map(({ id, label, icon: Icon, isTrash, isBroadcast }: any) => {
              const active = activeTab === id;
              const className = `w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                active
                  ? isTrash
                    ? "bg-rose-600 text-white shadow-sm"
                    : "bg-[#1e9df1] text-white shadow-sm"
                  : isTrash && trashedEvents.length > 0
                  ? "text-rose-400 hover:bg-gray-800 hover:text-white"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              }`;

              if (isBroadcast) {
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setSelectedBroadcastEventId("");
                      setIsBulkEmailOpen(true);
                    }}
                    className={className}
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={16} />
                      <span>{label}</span>
                    </div>
                  </button>
                );
              }

              return (
                <button
                  key={id}
                  onClick={() => setActiveTab(id as any)}
                  className={className}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={16} />
                    <span>{label}</span>
                  </div>
                  {isTrash && trashedEvents.length > 0 && (
                    <span className="bg-rose-500/20 text-rose-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-rose-500/30">
                      {trashedEvents.length}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Card with Exit Link */}
        <div className="space-y-2 pt-6">
          <div className="p-3 bg-gray-800/80 rounded-2xl flex items-center gap-3 border border-gray-700/50">
            <div className="w-8 h-8 rounded-full bg-[#1e9df1] text-white font-bold flex items-center justify-center text-xs shadow-xs">
              {user?.profile?.full_name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || "O"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate">{user?.profile?.full_name || "Rotaract Leader"}</p>
              <p className="text-[10px] text-gray-400 truncate">{user?.email || "organizer@rotasphere.org"}</p>
            </div>
          </div>

          <Link
            href="/"
            className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-[11px] font-bold py-2 px-3 rounded-xl border border-gray-700 transition-colors flex items-center justify-center gap-1.5"
          >
            <ExternalLink size={13} /> Exit to Public Website
          </Link>
        </div>
      </aside>

      {/* ── MAIN CONTENT AREA ─────────────────────────────────────────── */}
      <main className="flex-1 p-6 sm:p-10 space-y-8 max-w-7xl overflow-x-hidden">
        
        {/* Toast */}
        {toastMessage && (
          <div className="fixed top-6 right-6 z-50 bg-gray-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-gray-700 text-xs font-bold flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2">
            <Sparkles size={15} className="text-amber-400" />
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
                  Overview &amp; Real-Time Sales
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  Live ticket sales velocity, registrations, and gate check-in statistics.
                </p>
              </div>

              <button
                onClick={handleOpenCreateModal}
                className="inline-flex items-center gap-2 bg-[#1e9df1] hover:bg-[#1583cd] text-white font-bold text-xs px-5 py-3 rounded-xl transition-all shadow-md cursor-pointer hover:scale-105"
              >
                <PlusCircle size={16} /> Create New Event
              </button>
            </div>

            {/* Metric KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="bg-white border border-gray-200 p-6 rounded-3xl shadow-xs space-y-1">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Sales</span>
                <p className="text-2xl sm:text-3xl font-extrabold text-gray-900">₹{totalGrossSales.toLocaleString("en-IN")}</p>
                <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1 pt-1">
                  <TrendingUp size={13} /> Direct Payouts
                </span>
              </div>

              <div className="bg-white border border-gray-200 p-6 rounded-3xl shadow-xs space-y-1">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Passes Issued</span>
                <p className="text-2xl sm:text-3xl font-extrabold text-gray-900">{totalTicketsIssued}</p>
                <span className="text-[11px] font-semibold text-gray-500 pt-1 block">Across {activeEvents.length} Active Events</span>
              </div>

              <div className="bg-white border border-gray-200 p-6 rounded-3xl shadow-xs space-y-1">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Gate Check-in Rate</span>
                <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600">{checkInRate}%</p>
                <span className="text-[11px] font-semibold text-gray-500 pt-1 block">{totalCheckedIn} of {totalTicketsIssued} Scanned</span>
              </div>

              <div className="bg-white border border-gray-200 p-6 rounded-3xl shadow-xs space-y-1">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Published Events</span>
                <p className="text-2xl sm:text-3xl font-extrabold text-amber-500">
                  {activeEvents.filter((e) => e.status === "PUBLISHED").length}
                </p>
                <span className="text-[11px] font-semibold text-gray-500 pt-1 block">Live on discovery</span>
              </div>
            </div>

            {/* Friendly Quick Actions Strip for non-tech-savvy users */}
            <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-sky-50 border border-blue-100 rounded-3xl p-6 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#1e9df1]">Organizer Shortcuts</span>
                  <h3 className="text-base font-bold text-gray-900">What would you like to do today?</h3>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleOpenCreateModal}
                  className="bg-white hover:bg-blue-600 hover:text-white text-gray-900 border border-blue-200/80 p-3.5 rounded-2xl transition-all font-bold text-xs flex flex-col items-center justify-center gap-2 text-center shadow-2xs group cursor-pointer"
                >
                  <PlusCircle size={20} className="text-[#1e9df1] group-hover:text-white transition-colors" />
                  <span>Create New Event</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("scanner")}
                  className="bg-white hover:bg-blue-600 hover:text-white text-gray-900 border border-blue-200/80 p-3.5 rounded-2xl transition-all font-bold text-xs flex flex-col items-center justify-center gap-2 text-center shadow-2xs group cursor-pointer"
                >
                  <QrCode size={20} className="text-emerald-500 group-hover:text-white transition-colors" />
                  <span>Scan QR Passes</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedBroadcastEventId("");
                    setIsBulkEmailOpen(true);
                  }}
                  className="bg-white hover:bg-blue-600 hover:text-white text-gray-900 border border-blue-200/80 p-3.5 rounded-2xl transition-all font-bold text-xs flex flex-col items-center justify-center gap-2 text-center shadow-2xs group cursor-pointer"
                >
                  <Megaphone size={20} className="text-purple-500 group-hover:text-white transition-colors" />
                  <span>Send Announcement</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportAllAttendeesCSV}
                  className="bg-white hover:bg-blue-600 hover:text-white text-gray-900 border border-blue-200/80 p-3.5 rounded-2xl transition-all font-bold text-xs flex flex-col items-center justify-center gap-2 text-center shadow-2xs group cursor-pointer"
                >
                  <FileSpreadsheet size={20} className="text-amber-500 group-hover:text-white transition-colors" />
                  <span>Download Guest List</span>
                </button>
              </div>
            </div>

            {/* Quick Actions & Recent Events */}
            <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">Your Active Events</h3>
                <Link
                  href="/events"
                  className="text-xs font-bold text-[#1e9df1] hover:underline flex items-center gap-1"
                >
                  View Public Discovery <ExternalLink size={13} />
                </Link>
              </div>

              {activeEvents.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl p-6 space-y-3">
                  <Calendar className="mx-auto text-gray-300" size={36} />
                  <p className="text-sm font-semibold text-gray-700">No active events published yet</p>
                  <p className="text-xs text-gray-400">Click &quot;Create New Event&quot; to publish your first conference, tournament or workshop.</p>
                  <button
                    onClick={handleOpenCreateModal}
                    className="inline-flex items-center gap-2 bg-[#1e9df1] hover:bg-[#1583cd] text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer"
                  >
                    <PlusCircle size={14} /> Create Event Now
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {activeEvents.map((evt) => (
                    <div key={evt.id} className="py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-gray-50/50 px-2 rounded-2xl transition-colors">
                      <div className="space-y-1">
                        <Link href={`/events/${evt.slug}`} className="text-base font-bold text-gray-900 hover:text-[#1e9df1] transition-colors">
                          {evt.title}
                        </Link>
                        <p className="text-xs text-gray-500">
                          Status: <span className="font-bold text-emerald-600">{evt.status}</span> · City: {evt.city} · Date: {new Date(evt.start_date).toLocaleDateString("en-IN")} · Capacity: {evt.capacity}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {/* Edit Button */}
                        <button
                          onClick={() => handleOpenEditModal(evt)}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-700 bg-white border border-gray-200 hover:bg-gray-100 px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-2xs hover:border-gray-400"
                        >
                          <Edit3 size={14} className="text-[#1e9df1]" />
                          <span>Edit</span>
                        </button>

                        {/* Broadcast Email Button */}
                        <button
                          onClick={() => {
                            setSelectedBroadcastEventId(evt.id);
                            setIsBulkEmailOpen(true);
                          }}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-900 bg-blue-50 border border-blue-200 hover:bg-blue-100 px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-2xs"
                        >
                          <Megaphone size={14} className="text-[#1e9df1]" />
                          <span>Broadcast</span>
                        </button>

                        {/* Export Excel Button */}
                        <button
                          onClick={() => handleExportEventRegistrations(evt.id, evt.title)}
                          disabled={actionLoadingId === evt.id}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-2xs"
                        >
                          {actionLoadingId === evt.id ? (
                            <Loader2 size={14} className="animate-spin text-emerald-700" />
                          ) : (
                            <FileSpreadsheet size={14} className="text-emerald-700" />
                          )}
                          <span>Excel</span>
                        </button>

                        {/* Scanner Button */}
                        <Link
                          href={`/check-in?eventId=${evt.id}`}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-900 bg-gray-100 hover:bg-gray-200 px-3.5 py-2 rounded-xl transition-colors"
                        >
                          <QrCode size={14} /> Scanner
                        </Link>

                        {/* Duplicate Button */}
                        <button
                          onClick={() => handleDuplicateEvent(evt.id)}
                          title="Duplicate Event"
                          className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 cursor-pointer"
                        >
                          <Copy size={14} />
                        </button>

                        {/* Move to Trash Button */}
                        <button
                          onClick={() => handleTrashEvent(evt.id, evt.title)}
                          title="Move to Trash Bin (30-day retention)"
                          className="p-2 rounded-xl border border-rose-200 text-rose-600 bg-rose-50/50 hover:bg-rose-100 cursor-pointer transition-colors"
                        >
                          <Trash2 size={14} />
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
                <p className="text-xs text-gray-500 mt-1">Create, clone, edit listings, export attendee sheets, and trash/archive events.</p>
              </div>

              <button
                onClick={handleOpenCreateModal}
                className="inline-flex items-center gap-2 bg-[#1e9df1] hover:bg-[#1583cd] text-white font-bold text-xs px-5 py-3 rounded-xl transition-all shadow-md cursor-pointer"
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
                  <p className="p-8 text-center text-xs text-gray-500">No active events found matching your search.</p>
                ) : (
                  filteredEvents.map((evt) => (
                    <div key={evt.id} className="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors">
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

                      <div className="flex flex-wrap items-center gap-2">
                        {/* Edit Button */}
                        <button
                          onClick={() => handleOpenEditModal(evt)}
                          className="px-3.5 py-2 rounded-xl text-xs font-bold text-gray-800 bg-white border border-gray-200 hover:bg-gray-100 transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <Edit3 size={13} className="text-[#1e9df1]" />
                          <span>Edit</span>
                        </button>

                        {/* Export Excel Button */}
                        <button
                          onClick={() => handleExportEventRegistrations(evt.id, evt.title)}
                          className="px-3.5 py-2 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <FileSpreadsheet size={13} className="text-emerald-700" />
                          <span>Excel Sheet</span>
                        </button>

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

                        {/* Move to Trash */}
                        <button
                          onClick={() => handleTrashEvent(evt.id, evt.title)}
                          className="px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors cursor-pointer flex items-center gap-1.5 border border-rose-200"
                        >
                          <Trash2 size={13} />
                          <span>Move to Trash</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── 3. TRASH BIN TAB (30-DAY RETENTION) ───────────────────────── */}
        {activeTab === "trash" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-extrabold text-gray-900">Trash Bin</h2>
                  <span className="bg-rose-100 text-rose-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-rose-200">
                    30-Day Auto Retention
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Deleted events remain in the Trash Bin for 30 days. You can restore them anytime or permanently delete them now.
                </p>
              </div>
            </div>

            {trashedEvents.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-3xl p-12 text-center space-y-3 shadow-xs">
                <Archive className="mx-auto text-gray-300" size={48} />
                <h3 className="text-base font-bold text-gray-800">Trash Bin is Empty</h3>
                <p className="text-xs text-gray-400 max-w-md mx-auto">
                  When you delete an event, it will appear here for 30 days before being permanently purged.
                </p>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-xs divide-y divide-gray-100">
                {trashedEvents.map((evt) => {
                  const daysLeft = getDaysRemainingInTrash(evt.deleted_at);
                  return (
                    <div key={evt.id} className="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-rose-50/20 transition-colors">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-3">
                          <h4 className="text-base font-bold text-gray-900 line-through opacity-75">{evt.title}</h4>
                          <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                            TRASHED
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 flex items-center gap-3">
                          <span>City: {evt.city}</span>
                          <span>·</span>
                          <span className="text-amber-700 font-semibold flex items-center gap-1">
                            <Clock size={13} /> Auto-purges in {daysLeft} days
                          </span>
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleRestoreEvent(evt.id, evt.title)}
                          disabled={actionLoadingId === evt.id}
                          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer"
                        >
                          <RotateCcw size={14} />
                          <span>Restore Event</span>
                        </button>

                        <button
                          onClick={() => handlePermanentDelete(evt.id, evt.title)}
                          disabled={actionLoadingId === evt.id}
                          className="inline-flex items-center gap-2 bg-white hover:bg-rose-50 text-rose-600 border border-rose-300 font-bold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer"
                        >
                          <Trash2 size={14} />
                          <span>Delete Permanently</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── 4. TICKETS & INVENTORY TAB ──────────────────────────────── */}
        {activeTab === "tickets" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-extrabold text-gray-900">Tickets &amp; Live Inventory</h2>
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
                    {activeEvents.flatMap((e) =>
                      (e.saas_ticket_tiers || []).map((t: any) => {
                        const avail = t.total_capacity - t.sold_count;
                        return (
                          <tr key={t.id}>
                            <td className="py-3.5 font-bold text-gray-900">{t.name}</td>
                            <td className="py-3.5 text-gray-500">{e.title}</td>
                            <td className="py-3.5 font-bold text-[#1e9df1]">{Number(t.price) === 0 ? "FREE" : `₹${t.price}`}</td>
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

        {/* ── 5. ATTENDEES DIRECTORY TAB ──────────────────────────────── */}
        {activeTab === "attendees" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-extrabold text-gray-900">Attendee Directory</h2>
                <p className="text-xs text-gray-500 mt-1">Search, filter, and export registered delegates with QR code pass status.</p>
              </div>

              <button
                onClick={handleExportAllAttendeesCSV}
                className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-5 py-3 rounded-xl transition-all shadow-sm cursor-pointer"
              >
                <FileSpreadsheet size={15} /> Export All to Excel / CSV
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

        {/* ── 6. ORDERS & FINANCIALS TAB ──────────────────────────────── */}
        {activeTab === "orders" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-extrabold text-gray-900">Orders &amp; UPI Approvals</h2>
              <p className="text-xs text-gray-500 mt-1">Review, approve, or reject incoming UPI payment submissions for your events.</p>
            </div>

            {/* ── PENDING UPI APPROVALS ALERT PANEL ── */}
            {(() => {
              const pending = orders.filter((o: any) => o.status === "PENDING_VERIFICATION");
              if (pending.length === 0) return null;
              return (
                <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center shrink-0">
                      <Clock size={20} />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-amber-900">
                        {pending.length} Pending UPI Payment{pending.length > 1 ? "s" : ""} — Action Required
                      </h3>
                      <p className="text-xs text-amber-700">These registrants submitted their UTR reference. Verify against your bank account and approve or reject.</p>
                    </div>
                  </div>

                  <div className="divide-y divide-amber-200">
                    {pending.map((o: any) => (
                      <div key={o.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-bold text-gray-900 text-xs bg-white border border-amber-200 px-2.5 py-1 rounded-lg">{o.order_number}</span>
                            <span className="font-extrabold text-gray-900 text-sm">₹{o.total_amount}</span>
                          </div>
                          <p className="text-xs font-bold text-gray-800">{o.customer_name}</p>
                          <p className="text-[11px] text-gray-500">{o.customer_email}</p>
                          {o.upi_transaction_id && (
                            <p className="text-xs text-gray-700">
                              UTR: <span className="font-mono font-extrabold text-gray-900 bg-white border border-amber-200 px-1.5 py-0.5 rounded-md">{o.upi_transaction_id}</span>
                            </p>
                          )}
                          {o.upi_screenshot_url && (
                            <a href={o.upi_screenshot_url} target="_blank" rel="noopener noreferrer"
                              className="text-[11px] text-[#1e9df1] font-bold hover:underline flex items-center gap-1">
                              <ExternalLink size={11} /> View Payment Screenshot
                            </a>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={async () => {
                              setActionLoadingId(o.id);
                              const res = await verifyOrderPaymentAction({ orderId: o.id, action: "APPROVE" });
                              setActionLoadingId(null);
                              if (res.success) {
                                setOrders(orders.map((item: any) => (item.id === o.id ? { ...item, status: "PAID" } : item)));
                                showToast("✓ UPI approved! Passes activated.");
                              }
                            }}
                            disabled={actionLoadingId === o.id}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-4 py-2 rounded-xl text-xs transition-all shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                          >
                            {actionLoadingId === o.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                            Approve
                          </button>
                          <button
                            onClick={async () => {
                              const reason = prompt("Rejection reason:", "UTR reference not found in bank account");
                              if (!reason) return;
                              setActionLoadingId(o.id);
                              const res = await verifyOrderPaymentAction({ orderId: o.id, action: "REJECT", rejectionReason: reason });
                              setActionLoadingId(null);
                              if (res.success) {
                                setOrders(orders.map((item: any) => item.id === o.id ? { ...item, status: "PAYMENT_REJECTED", payment_rejection_reason: reason } : item));
                                showToast("Payment rejected.");
                              }
                            }}
                            disabled={actionLoadingId === o.id}
                            className="bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 font-bold px-4 py-2 rounded-xl text-xs transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                          >
                            <X size={14} /> Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Full Orders Table */}
            <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-400 uppercase tracking-wider font-bold">
                    <tr>
                      <th className="py-3.5 px-6">Order ID</th>
                      <th className="py-3.5 px-6">Customer</th>
                      <th className="py-3.5 px-6">Amount</th>
                      <th className="py-3.5 px-6">UTR / Reference</th>
                      <th className="py-3.5 px-6">Status</th>
                      <th className="py-3.5 px-6 text-right">Moderation</th>
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
                      orders.map((o) => {
                        const isPending = o.status === "PENDING_VERIFICATION";
                        const isPaid = o.status === "PAID";
                        const isRejected = o.status === "PAYMENT_REJECTED";

                        return (
                          <tr key={o.id} className={`hover:bg-gray-50/50 ${isPending ? "bg-amber-50/30" : ""}`}>
                            <td className="py-3.5 px-6 font-mono font-bold text-gray-900">{o.order_number}</td>
                            <td className="py-3.5 px-6">
                              <p className="font-bold text-gray-900">{o.customer_name}</p>
                              <p className="text-[11px] text-gray-400">{o.customer_email}</p>
                            </td>
                            <td className="py-3.5 px-6 font-extrabold text-gray-900">₹{o.total_amount}</td>
                            <td className="py-3.5 px-6">
                              {o.upi_transaction_id ? (
                                <span className="font-mono font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded-md text-xs">
                                  {o.upi_transaction_id}
                                </span>
                              ) : (
                                <span className="text-gray-400 italic text-[11px]">Free / N/A</span>
                              )}
                            </td>
                            <td className="py-3.5 px-6">
                              <span
                                className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${
                                  isPaid
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : isPending
                                    ? "bg-amber-50 text-amber-800 border-amber-300 font-black"
                                    : "bg-rose-50 text-rose-700 border-rose-200"
                                }`}
                              >
                                ● {isPending ? "PENDING UTR APPROVAL" : isPaid ? "APPROVED" : "REJECTED"}
                              </span>
                            </td>
                            <td className="py-3.5 px-6 text-right space-x-2">
                              {isPending && (
                                <>
                                  <button
                                    onClick={async () => {
                                      setActionLoadingId(o.id);
                                      const res = await verifyOrderPaymentAction({ orderId: o.id, action: "APPROVE" });
                                      setActionLoadingId(null);
                                      if (res.success) {
                                        setOrders(orders.map((item) => (item.id === o.id ? { ...item, status: "PAID" } : item)));
                                        showToast("UPI payment approved! Passes activated.");
                                      }
                                    }}
                                    disabled={actionLoadingId === o.id}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-3 py-1.5 rounded-xl text-xs transition-all shadow-xs cursor-pointer disabled:opacity-50"
                                  >
                                    Approve
                                  </button>

                                  <button
                                    onClick={async () => {
                                      const reason = prompt("Enter reason for rejection:", "UTR reference not found in bank account");
                                      if (!reason) return;
                                      setActionLoadingId(o.id);
                                      const res = await verifyOrderPaymentAction({
                                        orderId: o.id,
                                        action: "REJECT",
                                        rejectionReason: reason,
                                      });
                                      setActionLoadingId(null);
                                      if (res.success) {
                                        setOrders(
                                          orders.map((item) =>
                                            item.id === o.id ? { ...item, status: "PAYMENT_REJECTED", payment_rejection_reason: reason } : item
                                          )
                                        );
                                        showToast("Payment rejected.");
                                      }
                                    }}
                                    disabled={actionLoadingId === o.id}
                                    className="bg-gray-100 hover:bg-rose-50 text-gray-700 hover:text-rose-600 font-bold px-3 py-1.5 rounded-xl text-xs transition-all cursor-pointer disabled:opacity-50"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                              {!isPending && (
                                <span className="text-[11px] text-gray-400">
                                  {new Date(o.created_at).toLocaleDateString("en-IN")}
                                </span>
                              )}
                            </td>
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

        {/* ── 7. SCANNER OPERATIONS TAB ───────────────────────────────── */}
        {activeTab === "scanner" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-extrabold text-gray-900">Gate Scanner Operations</h2>
              <p className="text-xs text-gray-500 mt-1">
                Launch the event-specific scanner for any of your active events. Each scanner is locked to its event — operators cannot switch.
              </p>
            </div>

            {/* Per-Event Scanner Cards */}
            {activeEvents.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl p-6 space-y-3">
                <QrCode className="mx-auto text-gray-300" size={36} />
                <p className="text-sm font-semibold text-gray-700">No active events to scan</p>
                <p className="text-xs text-gray-400">Create and publish an event first to launch its scanner.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {activeEvents.map((evt) => (
                  <div key={evt.id} className="bg-white border border-gray-200 hover:border-[#1e9df1]/30 p-6 rounded-3xl shadow-xs space-y-4 transition-all hover:shadow-md">
                    <div className="flex items-start justify-between gap-3">
                      <div className="w-11 h-11 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shrink-0">
                        <QrCode size={22} />
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                        evt.status === "PUBLISHED"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-gray-50 text-gray-500 border-gray-200"
                      }`}>{evt.status}</span>
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-gray-900 leading-tight">{evt.title}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">{evt.city} · {new Date(evt.start_date).toLocaleDateString("en-IN")}</p>
                    </div>
                    <Link
                      href={`/check-in?eventId=${evt.id}`}
                      className="w-full inline-flex items-center justify-center gap-2 bg-[#1e9df1] hover:bg-[#1583cd] text-white font-bold text-xs px-5 py-3 rounded-xl transition-all shadow-md hover:scale-[1.02]"
                    >
                      <QrCode size={15} /> Open Scanner for this Event
                    </Link>
                  </div>
                ))}
              </div>
            )}

          </div>
        )}


        {/* ── 8. FINANCE & PAYOUTS TAB ─────────────────────────────────── */}
        {activeTab === "finance" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-extrabold text-gray-900">Finance &amp; Payouts</h2>
              <p className="text-xs text-gray-500 mt-1">Gross sales, platform fees, GST breakdown, and settlement balances.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-white border border-gray-200 p-6 rounded-3xl shadow-xs">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Gross Revenue</span>
                <p className="text-2xl font-extrabold text-gray-900 mt-1">₹{totalGrossSales.toLocaleString("en-IN")}</p>
              </div>
              <div className="bg-white border border-gray-200 p-6 rounded-3xl shadow-xs">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Platform Commission (0%)</span>
                <p className="text-2xl font-extrabold text-gray-500 mt-1">₹0.00</p>
              </div>
              <div className="bg-white border border-gray-200 p-6 rounded-3xl shadow-xs">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Net Estimated Payout</span>
                <p className="text-2xl font-extrabold text-emerald-600 mt-1">₹{totalGrossSales.toLocaleString("en-IN")}</p>
              </div>
            </div>
          </div>
        )}

        {/* ── 9. SETTINGS & TEAM TAB ──────────────────────────────────── */}
        {activeTab === "settings" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-extrabold text-gray-900">Organization Settings &amp; RBAC</h2>
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

      {/* ── 5-STEP EVENT CREATION & EDITING WIZARD MODAL ─────────────── */}
      <CreateEventWizardModal
        isOpen={wizardOpen}
        eventToEdit={eventToEdit}
        onClose={() => {
          setWizardOpen(false);
          setEventToEdit(null);
        }}
        onSuccess={(slug) => {
          setWizardOpen(false);
          setEventToEdit(null);
          showToast(eventToEdit ? "Event updated successfully!" : "Event created and published live!");
          window.location.reload();
        }}
      />

      {/* ── BULK EMAIL & EVENT RULES BROADCAST MODAL ────────────────── */}
      <BulkEmailModal
        isOpen={isBulkEmailOpen}
        onClose={() => setIsBulkEmailOpen(false)}
        events={activeEvents.map((e) => ({ id: e.id, title: e.title }))}
        defaultEventId={selectedBroadcastEventId}
      />
    </div>
  );
}
