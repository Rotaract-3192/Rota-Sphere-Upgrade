"use client";

/**
 * Organizer SaaS Hub Client
 * Enterprise-grade multi-tenant dashboard with:
 * 1. Event Creation & Live Editing Wizard
 * 2. Excel / CSV Registration Exporter
 * 3. 30-Day Soft-Delete Trash Bin with Restore & Permanent Delete
 * 4. Inventory, Attendees, Orders, and Gate Scanner Ops
 */

import { useState, useMemo } from "react";
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
  Camera,
  ExternalLink,
  Tag,
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
  UserPlus,
  Building,
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
import { GalleryUploadModal } from "@/components/gallery/GalleryUploadModal";
import { ManualAttendeeModal } from "@/components/dashboard/ManualAttendeeModal";
import { exportEventAttendeesToExcel } from "@/lib/utils/excelExporter";
import { resolveClubAndZone } from "@/lib/utils/zoneResolver";
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

  // Search & Filter queries
  const [attendeeSearch, setAttendeeSearch] = useState("");
  const [selectedAttendeeEventId, setSelectedAttendeeEventId] = useState<string>("ALL");
  const [eventSearch, setEventSearch] = useState("");

  // Event Wizard & Edit State
  const [wizardOpen, setWizardOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<any | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Bulk Email Broadcast State
  const [isBulkEmailOpen, setIsBulkEmailOpen] = useState(false);
  const [selectedBroadcastEventId, setSelectedBroadcastEventId] = useState<string>("");
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);

  // Manual Attendee Entry State
  const [manualAttendeeModalOpen, setManualAttendeeModalOpen] = useState(false);
  const [manualAttendeeEventId, setManualAttendeeEventId] = useState<string | undefined>(undefined);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [previewProofUrl, setPreviewProofUrl] = useState<string | null>(null);
  const [proofModalOrder, setProofModalOrder] = useState<any | null>(null);

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

  // Finance Chart & Analytics State
  const [financeRange, setFinanceRange] = useState<"7d" | "30d" | "all">("30d");
  const [financeHoverPoint, setFinanceHoverPoint] = useState<number | null>(null);

  // Dynamic Finance Chart Data Computation
  const financePoints = useMemo(() => {
    const daysCount = financeRange === "7d" ? 7 : financeRange === "30d" ? 14 : 30;
    const points: Array<{ label: string; value: number; ordersCount: number }> = [];
    const now = new Date();

    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const targetDateStr = d.toDateString();
      const dayLabel = d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });

      const dayOrders = orders.filter((o: any) => {
        if (!o.created_at) return false;
        const orderDate = new Date(o.created_at);
        return !isNaN(orderDate.getTime()) && orderDate.toDateString() === targetDateStr && o.status === "PAID";
      });

      const dayRevenue = dayOrders.reduce((sum: number, o: any) => sum + (parseFloat(o.total_amount) || 0), 0);

      points.push({
        label: dayLabel,
        value: dayRevenue,
        ordersCount: dayOrders.length,
      });
    }

    const hasData = points.some((p: { value: number }) => p.value > 0);
    if (!hasData) {
      const baseRev = totalGrossSales > 0 ? totalGrossSales / daysCount : 0;
      return points.map((p, idx) => ({
        ...p,
        value: baseRev > 0 ? Math.round(baseRev * (0.7 + (idx % 4) * 0.2)) : 0,
      }));
    }

    return points;
  }, [orders, financeRange, totalGrossSales]);

  const chartWidth = 700;
  const chartHeight = 200;
  const chartPadding = 20;

  const maxRev = Math.max(...financePoints.map((p: { value: number }) => p.value), 100);

  const financePointsWithCoords = useMemo(() => {
    return financePoints.map((pt: { label: string; value: number; ordersCount: number }, i: number) => {
      const x = chartPadding + (i / Math.max(financePoints.length - 1, 1)) * (chartWidth - chartPadding * 2);
      const y = chartHeight - chartPadding - (pt.value / maxRev) * (chartHeight - chartPadding * 2);
      return { ...pt, x, y };
    });
  }, [financePoints, maxRev]);

  const financeLinePathD = useMemo(() => {
    if (financePointsWithCoords.length === 0) return "";
    return financePointsWithCoords.reduce(
      (acc: string, pt: { x: number; y: number }, i: number) => (i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`),
      ""
    );
  }, [financePointsWithCoords]);

  const financeAreaPathD = useMemo(() => {
    if (financePointsWithCoords.length === 0) return "";
    const first = financePointsWithCoords[0];
    const last = financePointsWithCoords[financePointsWithCoords.length - 1];
    return `${financeLinePathD} L ${last.x} ${chartHeight - chartPadding} L ${first.x} ${chartHeight - chartPadding} Z`;
  }, [financeLinePathD, financePointsWithCoords]);

  // Pass Tier Revenue Breakdown
  const tierBreakdown = useMemo(() => {
    const map: Record<string, { name: string; revenue: number; ticketsCount: number }> = {};
    tickets.forEach((t: any) => {
      const name = t.saas_ticket_tiers?.name || "General Delegate Pass";
      const price = parseFloat(t.saas_ticket_tiers?.price || t.unit_price || "0");
      if (!map[name]) {
        map[name] = { name, revenue: 0, ticketsCount: 0 };
      }
      map[name].revenue += price;
      map[name].ticketsCount += 1;
    });

    const list = Object.values(map);
    const totalRev = list.reduce((s: number, item: { revenue: number }) => s + item.revenue, 0) || 1;
    return list.map((item: { name: string; revenue: number; ticketsCount: number }) => ({
      ...item,
      percent: Math.round((item.revenue / totalRev) * 100),
    }));
  }, [tickets]);

  // Filtered queries
  const filteredEvents = activeEvents.filter(
    (e) =>
      e.title.toLowerCase().includes(eventSearch.toLowerCase()) ||
      e.city?.toLowerCase().includes(eventSearch.toLowerCase())
  );

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      const q = attendeeSearch.toLowerCase().trim();
      const directClub = t.club_name || t.custom_answers?.club_name || "";
      const directDesig = t.designation || t.custom_answers?.designation || "";
      const directMemberType = t.member_type || t.custom_answers?.member_type || "";

      const matchesSearch =
        !q ||
        t.attendee_name?.toLowerCase().includes(q) ||
        t.attendee_email?.toLowerCase().includes(q) ||
        t.ticket_code?.toLowerCase().includes(q) ||
        directClub.toLowerCase().includes(q) ||
        directDesig.toLowerCase().includes(q) ||
        directMemberType.toLowerCase().includes(q);

      const matchesEvent =
        selectedAttendeeEventId === "ALL" ||
        t.event_id === selectedAttendeeEventId ||
        t.saas_events?.id === selectedAttendeeEventId ||
        t.saas_events?.title === selectedAttendeeEventId;

      return matchesSearch && matchesEvent;
    });
  }, [tickets, attendeeSearch, selectedAttendeeEventId]);

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

  // ─── 4. NATIVE EXCEL (.XLSX) REGISTRATION EXPORTER ────────────────────────
  async function handleExportEventRegistrations(eventId: string, eventTitle: string) {
    setActionLoadingId(eventId);
    showToast(`Generating Excel (.xlsx) workbook for "${eventTitle}"...`);
    const res = await getEventRegistrationsAction(eventId);
    setActionLoadingId(null);

    if (res.success && res.data && res.data.length > 0) {
      exportEventAttendeesToExcel(eventTitle, res.data);
    } else {
      // Fallback to local tickets if any match
      const matchingTickets = tickets.filter(
        (t) => t.event_id === eventId || t.saas_events?.title === eventTitle
      );
      exportEventAttendeesToExcel(eventTitle, matchingTickets);
    }
    showToast(`✓ Excel workbook (.xlsx) downloaded with Zonal Count Breakdown`);
  }

  function handleExportFilteredAttendeesExcel() {
    const listToExport = filteredTickets;
    if (listToExport.length === 0) {
      alert("No attendees found to export for the selected filter.");
      return;
    }

    const currentEvent = activeEvents.find((e) => e.id === selectedAttendeeEventId);
    const eventName = currentEvent ? currentEvent.title : "District_3192_Delegates";

    exportEventAttendeesToExcel(eventName, listToExport);
    showToast(`✓ Exported ${listToExport.length} delegates to Excel (.xlsx) with Zonal Breakdown`);
  }

  function handleExportAllAttendeesExcel() {
    if (tickets.length === 0) {
      alert("No attendees to export");
      return;
    }
    exportEventAttendeesToExcel("RotaSphere_All_District_Delegates", tickets);
    showToast("✓ All attendees exported to Excel workbook (.xlsx)");
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row text-gray-900">
      
      {/* ── MOBILE TOP NAV (visible below md) ───────────────────────────── */}
      <div className="md:hidden bg-gray-900 text-white border-b border-gray-800 px-4 pt-3 pb-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="relative w-9 h-9 shrink-0">
              <Image src="/brand/logo.png" alt="Logo" fill className="object-contain" priority />
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
                  active ? "bg-[#0758fc] text-white" : "bg-gray-800 text-gray-400"
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
                <div className="relative w-12 h-12 shrink-0">
                  <Image
                    src="/brand/logo.png"
                    alt="Rotaract District 3192 Ticketing Logo"
                    fill
                    className="object-contain"
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
            {(user?.profile?.role === "super_admin" ||
              user?.email === "tech.rotaract3192@gmail.com") && (
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
                    : "bg-[#0758fc] text-white shadow-sm"
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
            <div className="w-8 h-8 rounded-full bg-[#0758fc] text-white font-bold flex items-center justify-center text-xs shadow-xs">
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

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => {
                    setManualAttendeeEventId(undefined);
                    setManualAttendeeModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 bg-white hover:bg-gray-50 border border-blue-200 text-[#0758fc] font-bold text-xs px-4 py-3 rounded-xl transition-all shadow-xs cursor-pointer active:scale-95"
                >
                  <UserPlus size={15} className="text-[#0758fc]" />
                  <span>+ Add Manual Attendee</span>
                </button>
                <button
                  onClick={() => setIsGalleryModalOpen(true)}
                  className="inline-flex items-center gap-1.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-800 font-bold text-xs px-4 py-3 rounded-xl transition-all shadow-xs cursor-pointer active:scale-95"
                >
                  <Camera size={15} className="text-[#0758fc]" />
                  <span>Add Gallery Photos</span>
                </button>
                <button
                  onClick={handleOpenCreateModal}
                  className="inline-flex items-center gap-2 bg-[#0758fc] hover:bg-[#054fe0] text-white font-bold text-xs px-5 py-3 rounded-xl transition-all shadow-md cursor-pointer hover:scale-105 active:scale-95"
                >
                  <PlusCircle size={16} /> Create New Event
                </button>
              </div>
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
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#0758fc]">Organizer Shortcuts</span>
                  <h3 className="text-base font-bold text-gray-900">What would you like to do today?</h3>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleOpenCreateModal}
                  className="bg-white hover:bg-blue-600 hover:text-white text-gray-900 border border-blue-200/80 p-3.5 rounded-2xl transition-all font-bold text-xs flex flex-col items-center justify-center gap-2 text-center shadow-2xs group cursor-pointer"
                >
                  <PlusCircle size={20} className="text-[#0758fc] group-hover:text-white transition-colors" />
                  <span>Create New Event</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setManualAttendeeEventId(undefined);
                    setManualAttendeeModalOpen(true);
                  }}
                  className="bg-white hover:bg-blue-600 hover:text-white text-gray-900 border border-blue-200/80 p-3.5 rounded-2xl transition-all font-bold text-xs flex flex-col items-center justify-center gap-2 text-center shadow-2xs group cursor-pointer"
                >
                  <UserPlus size={20} className="text-[#0758fc] group-hover:text-white transition-colors" />
                  <span>+ Manual Attendee</span>
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
                  onClick={handleExportAllAttendeesExcel}
                  className="bg-white hover:bg-blue-600 hover:text-white text-gray-900 border border-blue-200/80 p-3.5 rounded-2xl transition-all font-bold text-xs flex flex-col items-center justify-center gap-2 text-center shadow-2xs group cursor-pointer"
                >
                  <FileSpreadsheet size={20} className="text-amber-500 group-hover:text-white transition-colors" />
                  <span>Export Excel (.xlsx)</span>
                </button>
              </div>
            </div>

            {/* Quick Actions & Recent Events */}
            <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">Your Active Events</h3>
                <Link
                  href="/events"
                  className="text-xs font-bold text-[#0758fc] hover:underline flex items-center gap-1"
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
                    className="inline-flex items-center gap-2 bg-[#0758fc] hover:bg-[#054fe0] text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer"
                  >
                    <PlusCircle size={14} /> Create Event Now
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {activeEvents.map((evt) => (
                    <div key={evt.id} className="py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-gray-50/50 px-2 rounded-2xl transition-colors">
                      <div className="space-y-1">
                        <Link href={`/events/${evt.slug}`} className="text-base font-bold text-gray-900 hover:text-[#0758fc] transition-colors">
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
                          <Edit3 size={14} className="text-[#0758fc]" />
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
                          <Megaphone size={14} className="text-[#0758fc]" />
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
                className="inline-flex items-center gap-2 bg-[#0758fc] hover:bg-[#054fe0] text-white font-bold text-xs px-5 py-3 rounded-xl transition-all shadow-md cursor-pointer"
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
                          <Edit3 size={13} className="text-[#0758fc]" />
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
              <div className="bg-white border border-gray-200 rounded-3xl p-12 text-center space-y-3 shadow-xs w-full flex flex-col items-center justify-center">
                <Archive className="mx-auto text-gray-300 shrink-0" size={48} />
                <h3 className="text-base font-bold text-gray-800 text-center w-full block">Trash Bin is Empty</h3>
                <p className="text-xs text-gray-400 w-full max-w-md mx-auto text-center block leading-relaxed">
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
                            <td className="py-3.5 font-bold text-gray-900">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span>{t.name}</span>
                                {Number(t.max_per_order) === 1 && (
                                  <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                                    🔒 Limit 1
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3.5 text-gray-500">{e.title}</td>
                            <td className="py-3.5 font-bold text-[#0758fc]">{Number(t.price) === 0 ? "FREE" : `₹${t.price}`}</td>
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
                <p className="text-xs text-gray-500 mt-1">
                  Search, filter, and export registered delegates per event with QR code pass status.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {selectedAttendeeEventId !== "ALL" && (
                  <button
                    type="button"
                    onClick={() => setSelectedAttendeeEventId("ALL")}
                    className="text-xs font-bold text-gray-600 hover:text-gray-900 px-3 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer"
                  >
                    Show All Events
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setManualAttendeeEventId(selectedAttendeeEventId !== "ALL" ? selectedAttendeeEventId : undefined);
                    setManualAttendeeModalOpen(true);
                  }}
                  className="inline-flex items-center gap-2 bg-[#0758fc] hover:bg-blue-600 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer active:scale-98"
                >
                  <UserPlus size={15} />
                  + Add Manual Attendee
                </button>

                <button
                  type="button"
                  onClick={handleExportFilteredAttendeesExcel}
                  className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer active:scale-98"
                >
                  <FileSpreadsheet size={15} />
                  {selectedAttendeeEventId === "ALL"
                    ? "Export All to Excel (.xlsx)"
                    : `Export "${activeEvents.find((e) => e.id === selectedAttendeeEventId)?.title || "Event"}" (${filteredTickets.length})`}
                </button>
              </div>
            </div>

            {/* Event Filter Selector & Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Event Dropdown Filter */}
              <div className="sm:w-80 shrink-0">
                <select
                  value={selectedAttendeeEventId}
                  onChange={(e) => setSelectedAttendeeEventId(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-2.5 text-xs font-bold text-gray-800 outline-none focus:border-[#0758fc] shadow-xs cursor-pointer"
                >
                  <option value="ALL">📅 All Events ({tickets.length} Attendees)</option>
                  {activeEvents.map((ev) => {
                    const evCount = tickets.filter((t) => t.event_id === ev.id || t.saas_events?.title === ev.title).length;
                    return (
                      <option key={ev.id} value={ev.id}>
                        {ev.title} ({evCount} Attendees)
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Search Bar */}
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3.5 top-3 text-gray-400" />
                <input
                  type="text"
                  value={attendeeSearch}
                  onChange={(e) => setAttendeeSearch(e.target.value)}
                  placeholder="Search attendees by name, email, club, or ticket code..."
                  className="w-full bg-white border border-gray-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-gray-900 outline-none focus:border-[#0758fc] shadow-xs"
                />
              </div>
            </div>

            {selectedAttendeeEventId !== "ALL" && (
              <div className="flex items-center justify-between bg-blue-50 border border-blue-200 text-blue-900 rounded-2xl px-4 py-2.5 text-xs">
                <span>
                  Filtering for event: <strong>{activeEvents.find((e) => e.id === selectedAttendeeEventId)?.title || "Selected Event"}</strong> ({filteredTickets.length} delegates)
                </span>
                <span className="font-mono text-[11px] text-blue-700">Excel export will include Zonal Count Breakdown</span>
              </div>
            )}

            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50/80 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-800 text-gray-400 dark:text-gray-500 uppercase tracking-wider font-bold">
                    <tr>
                      <th className="py-3.5 px-6">Ticket Code</th>
                      <th className="py-3.5 px-6">Attendee &amp; Role</th>
                      <th className="py-3.5 px-6">Club &amp; Zone</th>
                      <th className="py-3.5 px-6">Event &amp; Tier</th>
                      <th className="py-3.5 px-6">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-medium text-gray-700 dark:text-gray-300">
                    {filteredTickets.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-gray-400 dark:text-gray-500">
                          No attendees registered yet.
                        </td>
                      </tr>
                    ) : (
                      filteredTickets.map((t: any) => {
                        const { clubName, zone, memberType, designation } = resolveClubAndZone(t);
                        return (
                          <tr key={t.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40">
                            <td className="py-3.5 px-6 font-mono font-bold text-gray-900 dark:text-white">{t.ticket_code}</td>
                            <td className="py-3.5 px-6">
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-gray-900 dark:text-white">{t.attendee_name}</p>
                                {designation && (
                                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                                    {designation}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-gray-400 dark:text-gray-500">{t.attendee_email}</p>
                              {t.attendee_phone && (
                                <p className="text-[10px] text-gray-400 dark:text-gray-500">{t.attendee_phone}</p>
                              )}
                            </td>
                            <td className="py-3.5 px-6">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md ${
                                    memberType === "Rotary"
                                      ? "bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700"
                                      : memberType === "Non-Rotaract"
                                      ? "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700"
                                      : "bg-blue-100 dark:bg-blue-950/80 text-[#0758fc] dark:text-blue-400 border border-blue-200 dark:border-blue-800"
                                  }`}
                                >
                                  {memberType}
                                </span>
                                <p className="font-bold text-gray-800 dark:text-gray-200 line-clamp-1">{clubName}</p>
                              </div>
                              <span className="inline-block mt-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/50 text-[#0758fc] dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                                {zone}
                              </span>
                            </td>
                            <td className="py-3.5 px-6">
                              <p className="text-gray-800 dark:text-gray-200 font-medium line-clamp-1">{t.saas_events?.title || "Event"}</p>
                              <p className="text-[11px] text-gray-500 dark:text-gray-400 font-bold">{t.saas_ticket_tiers?.name || "Standard Pass"}</p>
                            </td>
                            <td className="py-3.5 px-6">
                              {(() => {
                                const isRej = t.status === "PAYMENT_REJECTED" || t.status === "REJECTED" || t.order_status === "PAYMENT_REJECTED";
                                const isPend = t.status === "PENDING_VERIFICATION" || t.status === "PENDING" || t.order_status === "PENDING_VERIFICATION";
                                const isUsed = t.status === "USED";
                                const isCanc = t.status === "CANCELLED";
                                const isRef = t.status === "REFUNDED";
                                const isTrans = t.status === "TRANSFERRED";

                                return (
                                  <span
                                    className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                                      isUsed
                                        ? "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                                        : isRej
                                        ? "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                                        : isPend
                                        ? "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                                        : isCanc
                                        ? "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700"
                                        : isRef
                                        ? "bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                                        : isTrans
                                        ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                                        : "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                                    }`}
                                  >
                                    ● {isUsed ? "CHECKED_IN" : isRej ? "REJECTED" : isPend ? "PENDING APPROVAL" : isCanc ? "CANCELLED" : isRef ? "REFUNDED" : isTrans ? "TRANSFERRED" : "CONFIRMED"}
                                  </span>
                                );
                              })()}
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
                <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-3xl p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center shrink-0">
                      <Clock size={20} />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-amber-900 dark:text-amber-200">
                        {pending.length} Pending UPI Payment{pending.length > 1 ? "s" : ""} — Action Required
                      </h3>
                      <p className="text-xs text-amber-700 dark:text-amber-300">These registrants submitted their UTR reference. Verify against your bank account and approve or reject.</p>
                    </div>
                  </div>

                  <div className="divide-y divide-amber-200 dark:divide-amber-800">
                    {pending.map((o: any) => (
                      <div key={o.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-bold text-gray-900 dark:text-white text-xs bg-white dark:bg-gray-800 border border-amber-200 dark:border-amber-700 px-2.5 py-1 rounded-lg">{o.order_number}</span>
                            <span className="font-extrabold text-gray-900 dark:text-white text-sm">₹{o.total_amount}</span>
                          </div>
                          <p className="text-xs font-bold text-gray-800 dark:text-gray-200">{o.customer_name}</p>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400">{o.customer_email}</p>
                          {o.upi_transaction_id && (
                            <p className="text-xs text-gray-700 dark:text-gray-300">
                              UTR: <span className="font-mono font-extrabold text-gray-900 dark:text-white bg-white dark:bg-gray-800 border border-amber-200 dark:border-amber-700 px-1.5 py-0.5 rounded-md">{o.upi_transaction_id}</span>
                            </p>
                          )}
                          {(o.payment_proof_url || o.upi_receipt_url || o.upi_screenshot_url) && (
                            <button
                              type="button"
                              onClick={() => setPreviewProofUrl(o.payment_proof_url || o.upi_receipt_url || o.upi_screenshot_url)}
                              className="text-[11px] text-[#0758fc] dark:text-blue-400 font-bold hover:underline flex items-center gap-1 cursor-pointer mt-0.5"
                            >
                              <ExternalLink size={11} /> View Payment Screenshot Proof
                            </button>
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
                                setTickets((prev) => prev.map((t: any) => (t.order_id === o.id ? { ...t, status: "CONFIRMED", order_status: "PAID" } : t)));
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
                                setTickets((prev) => prev.map((t: any) => (t.order_id === o.id ? { ...t, status: "PAYMENT_REJECTED", order_status: "PAYMENT_REJECTED" } : t)));
                                showToast("Payment rejected.");
                              }
                            }}
                            disabled={actionLoadingId === o.id}
                            className="bg-white dark:bg-gray-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 font-bold px-4 py-2 rounded-xl text-xs transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
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
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50/80 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-800 text-gray-400 dark:text-gray-500 uppercase tracking-wider font-bold">
                    <tr>
                      <th className="py-3.5 px-6">Order ID</th>
                      <th className="py-3.5 px-6">Customer</th>
                      <th className="py-3.5 px-6">Amount</th>
                      <th className="py-3.5 px-6">UTR / Reference</th>
                      <th className="py-3.5 px-6">Status</th>
                      <th className="py-3.5 px-6 text-right">Moderation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-medium text-gray-700 dark:text-gray-300">
                    {orders.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-gray-400 dark:text-gray-500">
                          No orders processed yet.
                        </td>
                      </tr>
                    ) : (
                      orders.map((o) => {
                        const isPending = o.status === "PENDING_VERIFICATION";
                        const isPaid = o.status === "PAID";
                        const isRejected = o.status === "PAYMENT_REJECTED";

                        return (
                          <tr key={o.id} className={`hover:bg-gray-50/50 dark:hover:bg-gray-800/40 ${isPending ? "bg-amber-50/30 dark:bg-amber-950/20" : ""}`}>
                            <td className="py-3.5 px-6 font-mono font-bold text-gray-900 dark:text-white">{o.order_number}</td>
                            <td className="py-3.5 px-6">
                              <p className="font-bold text-gray-900 dark:text-white">{o.customer_name}</p>
                              <p className="text-[11px] text-gray-400 dark:text-gray-500">{o.customer_email}</p>
                            </td>
                            <td className="py-3.5 px-6">
                              {o.upi_transaction_id ? (
                                <div className="space-y-1">
                                  <span className="font-mono font-bold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-md text-xs block w-fit">
                                    {o.upi_transaction_id}
                                  </span>
                                  {isPending && (o.payment_proof_url || o.upi_receipt_url || o.upi_screenshot_url) && (
                                    <button
                                      type="button"
                                      onClick={() => setProofModalOrder(o)}
                                      className="text-[11px] text-[#0758fc] dark:text-blue-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                                    >
                                      <Camera size={12} /> View Payment Photo Proof
                                    </button>
                                  )}
                                </div>
                              ) : (o.payment_proof_url || o.upi_receipt_url || o.upi_screenshot_url) ? (
                                <div className="space-y-1">
                                  <span className="text-[10px] font-extrabold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                                    <Camera size={11} /> Screenshot Proof
                                  </span>
                                  {isPending && (
                                    <button
                                      type="button"
                                      onClick={() => setProofModalOrder(o)}
                                      className="text-[11px] text-[#0758fc] dark:text-blue-400 font-bold hover:underline flex items-center gap-1 block cursor-pointer"
                                    >
                                      View Screenshot Proof
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <span className="text-gray-400 dark:text-gray-500 italic text-[11px]">Free / N/A</span>
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
                                      const proofUrl = o.payment_proof_url || o.upi_receipt_url || o.upi_screenshot_url;
                                      if (proofUrl) {
                                        setProofModalOrder(o);
                                      } else {
                                        setActionLoadingId(o.id);
                                        const res = await verifyOrderPaymentAction({ orderId: o.id, action: "APPROVE" });
                                        setActionLoadingId(null);
                                        if (res.success) {
                                          setOrders(orders.map((item) => (item.id === o.id ? { ...item, status: "PAID" } : item)));
                                          setTickets((prev) => prev.map((t: any) => (t.order_id === o.id ? { ...t, status: "CONFIRMED", order_status: "PAID" } : t)));
                                          showToast("UPI payment approved! Passes activated.");
                                        }
                                      }
                                    }}
                                    disabled={actionLoadingId === o.id}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-3 py-1.5 rounded-xl text-xs transition-all shadow-xs cursor-pointer disabled:opacity-50 inline-flex items-center gap-1"
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
                                        setTickets((prev) => prev.map((t: any) => (t.order_id === o.id ? { ...t, status: "PAYMENT_REJECTED", order_status: "PAYMENT_REJECTED" } : t)));
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
              <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl p-6 space-y-3 w-full flex flex-col items-center justify-center">
                <QrCode className="mx-auto text-gray-300 shrink-0" size={36} />
                <p className="text-sm font-semibold text-gray-700 text-center w-full block">No active events to scan</p>
                <p className="text-xs text-gray-400 text-center w-full max-w-md mx-auto block leading-relaxed">
                  Create and publish an event first to launch its scanner.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {activeEvents.map((evt) => (
                  <div key={evt.id} className="bg-white border border-gray-200 hover:border-[#0758fc]/30 p-6 rounded-3xl shadow-xs space-y-4 transition-all hover:shadow-md">
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
                      className="w-full inline-flex items-center justify-center gap-2 bg-[#0758fc] hover:bg-[#054fe0] text-white font-bold text-xs px-5 py-3 rounded-xl transition-all shadow-md hover:scale-[1.02]"
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
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-extrabold text-gray-900">Finance &amp; Settlement Analytics</h2>
                <p className="text-xs text-gray-500 mt-1">
                  Real-time sales velocity, 0% platform fee settlement ledger, and pass revenue breakdown.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportAllAttendeesExcel}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer"
                >
                  <FileSpreadsheet size={15} /> Export Finance Ledger (.xlsx)
                </button>
              </div>
            </div>

            {/* Top KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-white border border-gray-200 p-6 rounded-3xl shadow-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Gross Sales Revenue</span>
                  <DollarSign size={18} className="text-[#0758fc]" />
                </div>
                <p className="text-3xl font-black text-gray-900">₹{totalGrossSales.toLocaleString("en-IN")}</p>
                <p className="text-[11px] text-emerald-600 font-bold flex items-center gap-1 pt-1">
                  <TrendingUp size={12} /> 100% Direct Non-Profit Payouts
                </p>
              </div>

              <div className="bg-white border border-gray-200 p-6 rounded-3xl shadow-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Platform Fee (0%)</span>
                  <Tag size={18} className="text-gray-400" />
                </div>
                <p className="text-3xl font-black text-gray-500">₹0.00</p>
                <p className="text-[11px] text-gray-400 font-medium pt-1">Zero Markup for District 3192</p>
              </div>

              <div className="bg-white border border-gray-200 p-6 rounded-3xl shadow-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Net Estimated Settlement</span>
                  <CheckCircle2 size={18} className="text-emerald-600" />
                </div>
                <p className="text-3xl font-black text-emerald-600">₹{totalGrossSales.toLocaleString("en-IN")}</p>
                <p className="text-[11px] text-emerald-700 font-bold pt-1">Direct Bank / VPA Settlement</p>
              </div>
            </div>

            {/* Interactive Area Chart & Tier Breakdown Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Main SVG Area Line Chart */}
              <div className="lg:col-span-2 bg-white border border-gray-200 rounded-3xl p-6 sm:p-7 shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-extrabold text-gray-900">Revenue Velocity &amp; Sales Progression</h3>
                    <p className="text-xs text-gray-500">Daily gross booking volume progression over time</p>
                  </div>

                  <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
                    {(["7d", "30d", "all"] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setFinanceRange(r)}
                        className={`text-xs font-bold px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                          financeRange === r ? "bg-white text-gray-900 shadow-xs" : "text-gray-500 hover:text-gray-800"
                        }`}
                      >
                        {r === "7d" ? "7 Days" : r === "30d" ? "30 Days" : "All Time"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Vector SVG Curve */}
                <div className="relative w-full h-[240px] bg-slate-50/60 rounded-2xl p-3 border border-slate-100 overflow-hidden flex flex-col justify-end">
                  <svg
                    viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                    className="w-full h-full overflow-visible"
                    preserveAspectRatio="none"
                  >
                    <defs>
                      <linearGradient id="organizerRevGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0758fc" stopOpacity="0.32" />
                        <stop offset="100%" stopColor="#0758fc" stopOpacity="0.0" />
                      </linearGradient>
                      <linearGradient id="organizerLineGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#0758fc" />
                        <stop offset="100%" stopColor="#10b981" />
                      </linearGradient>
                    </defs>

                    {/* Gridlines */}
                    <line x1="0" y1={chartHeight - 20} x2={chartWidth} y2={chartHeight - 20} stroke="#e2e8f0" strokeWidth="1" />
                    <line x1="0" y1={chartHeight / 2} x2={chartWidth} y2={chartHeight / 2} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />

                    {/* Area Fill */}
                    <path d={financeAreaPathD} fill="url(#organizerRevGradient)" />

                    {/* Glowing Stroke Line */}
                    <path d={financeLinePathD} fill="none" stroke="url(#organizerLineGrad)" strokeWidth="3.5" strokeLinecap="round" />

                    {/* Data Nodes */}
                    {financePointsWithCoords.map((pt: any, i: number) => {
                      const isHovered = financeHoverPoint === i;
                      return (
                        <g key={i} className="cursor-pointer" onMouseEnter={() => setFinanceHoverPoint(i)} onMouseLeave={() => setFinanceHoverPoint(null)}>
                          <circle
                            cx={pt.x}
                            cy={pt.y}
                            r={isHovered ? 7 : 4}
                            className={`${isHovered ? "fill-[#0758fc] stroke-white stroke-2" : "fill-white stroke-[#0758fc] stroke-2"} transition-all`}
                          />
                        </g>
                      );
                    })}
                  </svg>

                  {/* Tooltip Popup */}
                  {financeHoverPoint !== null && financePointsWithCoords[financeHoverPoint] && (
                    <div
                      className="absolute z-20 bg-gray-900 text-white text-xs px-3 py-2 rounded-xl shadow-xl border border-gray-800 pointer-events-none transform -translate-x-1/2 -translate-y-full"
                      style={{
                        left: `${(financePointsWithCoords[financeHoverPoint].x / chartWidth) * 100}%`,
                        top: `${(financePointsWithCoords[financeHoverPoint].y / chartHeight) * 100 - 10}%`,
                      }}
                    >
                      <p className="font-extrabold text-[#60a5fa]">{financePointsWithCoords[financeHoverPoint].label}</p>
                      <p className="text-white font-mono font-black">₹{financePointsWithCoords[financeHoverPoint].value.toLocaleString("en-IN")}</p>
                      <p className="text-[10px] text-gray-400">{financePointsWithCoords[financeHoverPoint].ordersCount} booking(s)</p>
                    </div>
                  )}
                </div>

                {/* Bottom Chart Footer Metrics */}
                <div className="grid grid-cols-3 gap-4 pt-2 border-t border-gray-100 text-xs">
                  <div>
                    <span className="text-gray-400 font-semibold block">Total Orders</span>
                    <span className="text-gray-900 font-extrabold text-sm">{orders.length}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 font-semibold block">Avg Order Value</span>
                    <span className="text-gray-900 font-extrabold text-sm">
                      ₹{orders.length > 0 ? (totalGrossSales / orders.length).toFixed(0) : "0"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 font-semibold block">Confirmed Tickets</span>
                    <span className="text-emerald-600 font-extrabold text-sm">{tickets.filter((t: any) => t.status === "CONFIRMED" || t.status === "USED" || t.status === "ISSUED").length} Issued</span>
                  </div>
                </div>
              </div>

              {/* Pass Tier Breakdown Visualizer */}
              <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xs space-y-5 flex flex-col justify-between">
                <div className="space-y-1">
                  <h3 className="text-base font-extrabold text-gray-900">Revenue by Pass Tier</h3>
                  <p className="text-xs text-gray-500">Sales contribution per ticket category</p>
                </div>

                <div className="space-y-4 flex-1 justify-center flex flex-col">
                  {tierBreakdown.length === 0 ? (
                    <div className="text-center py-6 text-xs text-gray-400">No pass sales registered yet</div>
                  ) : (
                    tierBreakdown.map((t: any, idx: number) => (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-gray-800">{t.name}</span>
                          <span className="text-gray-900 font-mono">₹{t.revenue.toLocaleString("en-IN")}</span>
                        </div>
                        <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#0758fc] rounded-full transition-all"
                            style={{ width: `${t.percent}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-gray-400">
                          <span>{t.ticketsCount} pass(es) sold</span>
                          <span>{t.percent}% of total</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-2xl flex items-center gap-2.5 text-xs text-blue-900">
                  <ShieldCheck size={18} className="text-blue-600 shrink-0" />
                  <p className="text-[11px] leading-relaxed">
                    100% of event registration payments settle directly to your Rotary / Rotaract club VPA account.
                  </p>
                </div>
              </div>

            </div>

            {/* Financial Ledger Table */}
            <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-xs space-y-4 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-gray-900">Settlement Ledger &amp; Order Transactions</h3>
                  <p className="text-xs text-gray-500">All processed customer bookings and payment references</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-400 uppercase tracking-wider font-bold">
                    <tr>
                      <th className="py-3.5 px-6">Order ID</th>
                      <th className="py-3.5 px-6">Customer</th>
                      <th className="py-3.5 px-6">Amount (INR)</th>
                      <th className="py-3.5 px-6">UTR / Reference</th>
                      <th className="py-3.5 px-6">Status</th>
                      <th className="py-3.5 px-6 text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                    {orders.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-gray-400">
                          No financial transactions recorded yet.
                        </td>
                      </tr>
                    ) : (
                      orders.map((o) => (
                        <tr key={o.id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="py-4 px-6 font-mono font-bold text-[#0758fc]">{o.order_number || o.id.slice(0, 8)}</td>
                          <td className="py-4 px-6">
                            <p className="font-bold text-gray-900">{o.customer_name || "Delegate"}</p>
                            <p className="text-[11px] text-gray-400 font-mono">{o.customer_email}</p>
                          </td>
                          <td className="py-4 px-6 font-mono font-extrabold text-gray-900">
                            ₹{parseFloat(o.total_amount || "0").toFixed(2)}
                          </td>
                          <td className="py-4 px-6">
                            {o.upi_transaction_id ? (
                              <span className="font-mono font-bold text-xs bg-gray-100 border border-gray-200 px-2 py-1 rounded-lg text-gray-900">
                                {o.upi_transaction_id}
                              </span>
                            ) : (o.payment_proof_url || o.upi_receipt_url || o.upi_screenshot_url) ? (
                              <span className="text-[10px] font-extrabold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-lg inline-flex items-center gap-1">
                                <Camera size={11} /> Screenshot Proof
                              </span>
                            ) : (
                              <span className="text-gray-400 italic">Free / Direct</span>
                            )}
                          </td>
                          <td className="py-4 px-6">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${
                                o.status === "PAID"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : o.status === "PENDING_VERIFICATION"
                                  ? "bg-amber-50 text-amber-800 border-amber-300 animate-pulse"
                                  : "bg-rose-50 text-rose-700 border-rose-200"
                              }`}
                            >
                              ● {o.status}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right text-gray-400 font-mono text-[11px]">
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
        defaultClubName={organization?.name}
        defaultOrganizationId={organization?.id}
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

      {/* ── PAYMENT SCREENSHOT LIGHTBOX MODAL ───────────────────────── */}
      {previewProofUrl && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in-50">
          <div className="relative max-w-2xl w-full bg-white rounded-3xl p-6 shadow-2xl space-y-4 text-center">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
                <ExternalLink size={18} className="text-[#0758fc]" /> Payment Receipt Screenshot Proof
              </h3>
              <button
                type="button"
                onClick={() => setPreviewProofUrl(null)}
                className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="max-h-[75vh] overflow-y-auto rounded-2xl border border-gray-200 bg-gray-900 p-2 flex items-center justify-center">
              <img
                src={previewProofUrl}
                alt="Payment Receipt Screenshot Proof"
                className="max-w-full h-auto max-h-[70vh] rounded-xl object-contain"
              />
            </div>

            <div className="pt-1 flex justify-end">
              <button
                type="button"
                onClick={() => setPreviewProofUrl(null)}
                className="bg-gray-900 hover:bg-black text-white font-bold text-xs px-6 py-2.5 rounded-xl cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── INTERACTIVE PHOTO REVIEW & APPROVAL MODAL ────────────────── */}
      {proofModalOrder && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in-50">
          <div className="relative max-w-3xl w-full bg-white rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 text-left">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#0758fc] block">
                  Verify Payment Screenshot Before Approval
                </span>
                <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                  Order Ref: <span className="font-mono text-base">{proofModalOrder.order_number}</span>
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setProofModalOrder(null)}
                className="w-9 h-9 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Delegate & Payment Meta */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50 border border-gray-200 rounded-2xl p-3.5 text-xs">
              <div>
                <span className="text-[10px] text-gray-400 font-bold block uppercase">Delegate Name</span>
                <span className="font-bold text-gray-900 block truncate">{proofModalOrder.customer_name}</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 font-bold block uppercase">Amount Paid</span>
                <span className="font-extrabold text-emerald-700 block">₹{proofModalOrder.total_amount}</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 font-bold block uppercase">Entered UTR ID</span>
                <span className="font-mono font-bold text-gray-900 block truncate bg-white border border-gray-200 px-1.5 py-0.5 rounded-md">
                  {proofModalOrder.upi_transaction_id || "Optional (Not Provided)"}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 font-bold block uppercase">Submitted Email</span>
                <span className="font-bold text-gray-600 block truncate">{proofModalOrder.customer_email}</span>
              </div>
            </div>

            {/* Payment Receipt Image Viewport */}
            <div className="max-h-[55vh] overflow-y-auto rounded-2xl border border-gray-300 bg-gray-950 p-3 flex flex-col items-center justify-center">
              {proofModalOrder.payment_proof_url || proofModalOrder.upi_receipt_url || proofModalOrder.upi_screenshot_url ? (
                <img
                  src={proofModalOrder.payment_proof_url || proofModalOrder.upi_receipt_url || proofModalOrder.upi_screenshot_url}
                  alt="Delegate Payment Receipt Screenshot"
                  className="max-w-full h-auto max-h-[50vh] rounded-xl object-contain shadow-lg"
                />
              ) : (
                <div className="p-12 text-center text-gray-400 space-y-2">
                  <Camera size={32} className="mx-auto text-gray-600" />
                  <p className="text-xs font-bold">No receipt screenshot photo was attached by attendee.</p>
                </div>
              )}
            </div>

            {/* Action Bar */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-gray-100">
              <span className="text-xs text-gray-500 font-medium">
                Verify that the 12-digit UTR and amount on the screenshot match your bank account statement.
              </span>
              <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
                <button
                  type="button"
                  onClick={async () => {
                    const reason = prompt("Enter reason for rejection:", "UTR reference not found in bank account statement");
                    if (!reason) return;
                    setActionLoadingId(proofModalOrder.id);
                    const res = await verifyOrderPaymentAction({
                      orderId: proofModalOrder.id,
                      action: "REJECT",
                      rejectionReason: reason,
                    });
                    setActionLoadingId(null);
                    if (res.success) {
                      setOrders(
                        orders.map((item) =>
                          item.id === proofModalOrder.id ? { ...item, status: "PAYMENT_REJECTED", payment_rejection_reason: reason } : item
                        )
                      );
                      setTickets((prev) => prev.map((t: any) => (t.order_id === proofModalOrder.id ? { ...t, status: "PAYMENT_REJECTED", order_status: "PAYMENT_REJECTED" } : t)));
                      setProofModalOrder(null);
                      showToast("Payment rejected.");
                    }
                  }}
                  className="flex-1 sm:flex-initial bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs px-5 py-3 rounded-2xl transition-all cursor-pointer text-center"
                >
                  Reject Payment
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    setActionLoadingId(proofModalOrder.id);
                    const res = await verifyOrderPaymentAction({ orderId: proofModalOrder.id, action: "APPROVE" });
                    setActionLoadingId(null);
                    if (res.success) {
                      setOrders(orders.map((item) => (item.id === proofModalOrder.id ? { ...item, status: "PAID" } : item)));
                      setTickets((prev) => prev.map((t: any) => (t.order_id === proofModalOrder.id ? { ...t, status: "CONFIRMED", order_status: "PAID" } : t)));
                      setProofModalOrder(null);
                      showToast("UPI payment verified & approved! Delegate passes activated.");
                    }
                  }}
                  disabled={actionLoadingId === proofModalOrder.id}
                  className="flex-1 sm:flex-initial bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-6 py-3 rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-center"
                >
                  <CheckCircle2 size={16} /> Confirm Photo &amp; Approve Pass
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gallery Multi-Photo Upload Modal */}
      <GalleryUploadModal
        isOpen={isGalleryModalOpen}
        onClose={() => setIsGalleryModalOpen(false)}
      />

      {/* Manual Attendee Entry & Spot Registration Modal */}
      <ManualAttendeeModal
        isOpen={manualAttendeeModalOpen}
        onClose={() => {
          setManualAttendeeModalOpen(false);
          setManualAttendeeEventId(undefined);
        }}
        events={activeEvents}
        initialEventId={manualAttendeeEventId}
        onAttendeeAdded={(newTicket) => {
          setTickets((prev) => [newTicket, ...prev]);
          showToast(`✓ Ticket created for ${newTicket.attendee_name}`);
        }}
      />
    </div>
  );
}
