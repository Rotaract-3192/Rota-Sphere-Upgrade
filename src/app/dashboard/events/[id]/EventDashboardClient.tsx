"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  CreditCard,
  Users,
  Ticket,
  Edit3,
  QrCode,
  Megaphone,
  ExternalLink,
  Copy,
  Check,
  CheckCircle2,
  XCircle,
  Camera,
  FileSpreadsheet,
  Search,
  Filter,
  Clock,
  ArrowLeft,
  Calendar,
  MapPin,
  Sparkles,
  Plus,
  Trash2,
  AlertCircle,
  Eye,
  RefreshCw,
  Download,
  Send,
  ChevronRight,
  ShieldCheck,
  X,
  Loader2,
  DollarSign,
  Share2,
} from "lucide-react";
import { verifyOrderPaymentAction } from "@/app/actions/orderActions";
import { updateEventAction } from "@/app/actions/eventActions";
import { checkInTicketAction } from "@/app/actions/checkInActions";
import { exportEventAttendeesToExcel } from "@/lib/utils/excelExporter";
import { BulkEmailModal } from "@/components/shared/BulkEmailModal";

interface EventDashboardClientProps {
  user: any;
  event: any;
  initialTiers: any[];
  initialOrders: any[];
  initialTickets: any[];
  initialCheckIns: any[];
  categories?: any[];
  initialTab?: string;
}

export function EventDashboardClient({
  user,
  event: initialEvent,
  initialTiers,
  initialOrders,
  initialTickets,
  initialCheckIns,
  categories,
  initialTab = "overview",
}: EventDashboardClientProps) {
  const router = useRouter();

  // Active state
  const [event, setEvent] = useState(initialEvent);
  const [tiers, setTiers] = useState(initialTiers);
  const [orders, setOrders] = useState(initialOrders);
  const [tickets, setTickets] = useState(initialTickets);
  const [checkIns, setCheckIns] = useState(initialCheckIns);
  const [activeTab, setActiveTab] = useState<
    "overview" | "orders" | "attendees" | "tickets" | "broadcast"
  >(
    (initialTab as any) === "edit" || (initialTab as any) === "scanner"
      ? "overview"
      : (initialTab as any) || "overview"
  );

  // Notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isBulkEmailOpen, setIsBulkEmailOpen] = useState(false);

  // Modals & Action loading
  const [proofModalOrder, setProofModalOrder] = useState<any | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [rejectionModalOrder, setRejectionModalOrder] = useState<any | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // Filters & Search
  const [attendeeSearch, setAttendeeSearch] = useState("");
  const [attendeeTierFilter, setAttendeeTierFilter] = useState("ALL");
  const [attendeeStatusFilter, setAttendeeStatusFilter] = useState("ALL");
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("ALL");

  // Tier Edit/Create Modal State
  const [tierModalOpen, setTierModalOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<any | null>(null);
  const [tierForm, setTierForm] = useState({
    name: "",
    description: "",
    price: 0,
    totalCapacity: 100,
    tierType: "REGULAR",
    allowedAudience: "ALL",
    isBulkSlab: false,
    bulkSlabSize: 15,
    maxPerOrder: 10,
  });

  // Toast helper
  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }

  // Copy link helper
  function handleCopyEventLink() {
    const url = `${window.location.origin}/events/${event.slug}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    showToast("✓ Public event booking link copied to clipboard!");
    setTimeout(() => setCopiedLink(false), 2500);
  }

  // ── Metrics Calculations ──────────────────────────────────────────────────
  const pendingOrders = useMemo(
    () => orders.filter((o) => o.status === "PENDING_VERIFICATION"),
    [orders]
  );

  const paidOrders = useMemo(
    () => orders.filter((o) => o.status === "PAID"),
    [orders]
  );

  const grossRevenue = useMemo(
    () => paidOrders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0),
    [paidOrders]
  );

  const totalSoldTickets = useMemo(
    () => tickets.filter((t) => t.status === "CONFIRMED" || t.status === "USED").length,
    [tickets]
  );

  const totalCheckedIn = useMemo(
    () => tickets.filter((t) => t.status === "USED" || t.checked_in_at).length,
    [tickets]
  );

  const checkInRate = totalSoldTickets > 0 ? Math.round((totalCheckedIn / totalSoldTickets) * 100) : 0;
  const capacityPercent = event.capacity > 0 ? Math.min(100, Math.round((totalSoldTickets / event.capacity) * 100)) : 0;

  // Filtered Attendees
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      const q = attendeeSearch.toLowerCase().trim();
      const matchesQuery =
        !q ||
        t.attendee_name?.toLowerCase().includes(q) ||
        t.attendee_email?.toLowerCase().includes(q) ||
        t.ticket_code?.toLowerCase().includes(q) ||
        t.club_name?.toLowerCase().includes(q) ||
        t.custom_answers?.club_name?.toLowerCase().includes(q);

      const matchesTier =
        attendeeTierFilter === "ALL" ||
        t.ticket_tier_id === attendeeTierFilter ||
        t.saas_ticket_tiers?.name === attendeeTierFilter;

      const isUsed = t.status === "USED" || !!t.checked_in_at;
      const isPend = t.status === "PENDING_VERIFICATION" || t.status === "PENDING" || t.order_status === "PENDING_VERIFICATION";
      const isConfirmed = t.status === "CONFIRMED" || t.status === "ACTIVE";

      let matchesStatus = true;
      if (attendeeStatusFilter === "CHECKED_IN") matchesStatus = isUsed;
      else if (attendeeStatusFilter === "CONFIRMED") matchesStatus = isConfirmed && !isUsed;
      else if (attendeeStatusFilter === "PENDING") matchesStatus = isPend;

      return matchesQuery && matchesTier && matchesStatus;
    });
  }, [tickets, attendeeSearch, attendeeTierFilter, attendeeStatusFilter]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const q = orderSearch.toLowerCase().trim();
      const matchesQuery =
        !q ||
        o.order_number?.toLowerCase().includes(q) ||
        o.customer_name?.toLowerCase().includes(q) ||
        o.customer_email?.toLowerCase().includes(q) ||
        o.upi_transaction_id?.toLowerCase().includes(q);

      const matchesStatus =
        orderStatusFilter === "ALL" ||
        (orderStatusFilter === "PENDING" && o.status === "PENDING_VERIFICATION") ||
        (orderStatusFilter === "PAID" && o.status === "PAID") ||
        (orderStatusFilter === "REJECTED" && o.status === "PAYMENT_REJECTED");

      return matchesQuery && matchesStatus;
    });
  }, [orders, orderSearch, orderStatusFilter]);

  // ── UPI Approval & Rejection Handlers ─────────────────────────────────────
  async function handleApproveOrder(orderId: string) {
    setActionLoadingId(orderId);
    const res = await verifyOrderPaymentAction({ orderId, action: "APPROVE" });
    setActionLoadingId(null);
    if (res.success) {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: "PAID" } : o))
      );
      setTickets((prev) =>
        prev.map((t) =>
          t.order_id === orderId ? { ...t, status: "CONFIRMED", order_status: "PAID" } : t
        )
      );
      if (proofModalOrder?.id === orderId) setProofModalOrder(null);
      showToast("✓ Payment approved! QR entry passes issued to delegate.");
      router.refresh();
    } else {
      alert(res.error || "Approval failed.");
    }
  }

  async function handleRejectOrder() {
    if (!rejectionModalOrder) return;
    setActionLoadingId(rejectionModalOrder.id);
    const res = await verifyOrderPaymentAction({
      orderId: rejectionModalOrder.id,
      action: "REJECT",
      rejectionReason: rejectionReason.trim() || "Invalid UTR / Payment not credited.",
    });
    setActionLoadingId(null);
    if (res.success) {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === rejectionModalOrder.id
            ? { ...o, status: "PAYMENT_REJECTED", payment_rejection_reason: rejectionReason }
            : o
        )
      );
      setTickets((prev) =>
        prev.map((t) =>
          t.order_id === rejectionModalOrder.id
            ? { ...t, status: "PAYMENT_REJECTED", order_status: "PAYMENT_REJECTED" }
            : t
        )
      );
      setRejectionModalOrder(null);
      setRejectionReason("");
      showToast("Payment rejected. Notification recorded.");
      router.refresh();
    } else {
      alert(res.error || "Rejection failed.");
    }
  }

  // ── Save / Add Ticket Tier Handler ─────────────────────────────────────────
  async function handleSaveTier() {
    if (!tierForm.name.trim()) {
      alert("Please enter a tier name.");
      return;
    }

    const updatedTiers = editingTier
      ? tiers.map((t) =>
          t.id === editingTier.id
            ? {
                ...t,
                id: editingTier.id,
                name: tierForm.name,
                description: tierForm.description,
                price: Number(tierForm.price) || 0,
                totalCapacity: Number(tierForm.totalCapacity) || 100,
                tierType: tierForm.isBulkSlab ? "BULK" : tierForm.tierType,
                allowedAudience: tierForm.allowedAudience,
                isBulkSlab: tierForm.isBulkSlab,
                bulkSlabSize: tierForm.isBulkSlab ? Number(tierForm.bulkSlabSize) || 15 : null,
                bulk_slab_size: tierForm.isBulkSlab ? Number(tierForm.bulkSlabSize) || 15 : null,
                maxPerOrder: tierForm.isBulkSlab ? Number(tierForm.bulkSlabSize) || 15 : Number(tierForm.maxPerOrder) || 10,
                max_per_order: tierForm.isBulkSlab ? Number(tierForm.bulkSlabSize) || 15 : Number(tierForm.maxPerOrder) || 10,
              }
            : t
        )
      : [
          ...tiers,
          {
            name: tierForm.name,
            description: tierForm.description,
            price: Number(tierForm.price) || 0,
            totalCapacity: Number(tierForm.totalCapacity) || 100,
            tierType: tierForm.isBulkSlab ? "BULK" : tierForm.tierType,
            allowedAudience: tierForm.allowedAudience,
            isBulkSlab: tierForm.isBulkSlab,
            bulkSlabSize: tierForm.isBulkSlab ? Number(tierForm.bulkSlabSize) || 15 : null,
            bulk_slab_size: tierForm.isBulkSlab ? Number(tierForm.bulkSlabSize) || 15 : null,
            maxPerOrder: tierForm.isBulkSlab ? Number(tierForm.bulkSlabSize) || 15 : Number(tierForm.maxPerOrder) || 10,
            max_per_order: tierForm.isBulkSlab ? Number(tierForm.bulkSlabSize) || 15 : Number(tierForm.maxPerOrder) || 10,
          },
        ];

    setActionLoadingId("tier-save");
    const res = await updateEventAction(event.id, {
      ticketTiers: updatedTiers.map((t) => ({
        id: t.id,
        name: t.name,
        description: t.description,
        price: Number(t.price) || 0,
        totalCapacity: Number(t.total_capacity || t.totalCapacity) || 100,
        tierType: t.tier_type || t.tierType || "REGULAR",
        allowedAudience: t.allowed_audience || t.allowedAudience || "ALL",
        isBulkSlab: Boolean(t.is_bulk_slab || t.isBulkSlab),
        bulkSlabSize: t.bulkSlabSize !== undefined ? t.bulkSlabSize : (t.bulk_slab_size != null ? Number(t.bulk_slab_size) : null),
        maxPerOrder: t.maxPerOrder || t.max_per_order || 10,
      })),
    });
    setActionLoadingId(null);

    if (res.success) {
      setTierModalOpen(false);
      setEditingTier(null);
      showToast("✓ Ticket tier saved!");
      window.location.reload();
    } else {
      alert(res.error || "Failed to update ticket tier.");
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 flex flex-col">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-[99999] bg-gray-900 dark:bg-gray-800 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-gray-700 text-xs font-bold flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2">
          <Sparkles size={15} className="text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── TOP EVENT COMMAND HEADER ─────────────────────────────────────── */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Top Bar: Back Breadcrumb + Live Event Metadata */}
          <div className="py-3 flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-800/80">
            <div className="flex items-center gap-3 min-w-0">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1 text-xs font-extrabold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 px-3 py-1.5 rounded-xl transition-colors shrink-0"
              >
                <ArrowLeft size={13} />
                <span>Organizer Hub</span>
              </Link>
              <span className="text-gray-300 dark:text-gray-700">/</span>
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 truncate max-w-[200px] sm:max-w-xs">
                {event.organization?.name || "District 3192"}
              </span>
              <span className="text-gray-300 dark:text-gray-700">/</span>
              <span className="text-xs font-black text-[#0758fc] dark:text-blue-400 truncate">
                {event.title}
              </span>
            </div>

            {/* Quick Actions Right */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsBulkEmailOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-[#0758fc] hover:bg-[#054fe0] px-3.5 py-1.5 rounded-xl transition-all shadow-xs cursor-pointer active:scale-95"
                title="Broadcast Email to Delegates"
              >
                <Megaphone size={13} />
                <span>Broadcast Email</span>
              </button>

              <button
                type="button"
                onClick={handleCopyEventLink}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-750 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                title="Copy Public Link"
              >
                {copiedLink ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                <span>{copiedLink ? "Copied" : "Share"}</span>
              </button>

              <Link
                href={`/events/${event.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-gray-900 dark:bg-gray-800 hover:bg-black dark:hover:bg-gray-700 px-3.5 py-1.5 rounded-xl transition-all shadow-xs"
              >
                <ExternalLink size={13} />
                <span>View Live Page</span>
              </Link>
            </div>
          </div>

          {/* Event Title Strip */}
          <div className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight truncate">
                  {event.title}
                </h1>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 leading-none whitespace-nowrap">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  {event.status}
                </span>
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-[#0758fc] dark:text-blue-400 border border-blue-200 dark:border-blue-800 leading-none whitespace-nowrap">
                  {event.category_name || "Rotaract Event"}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
                <span className="flex items-center gap-1">
                  <Calendar size={13} /> {new Date(event.start_date).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MapPin size={13} /> {event.venue_name || event.city || "Bangalore, India"}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 font-mono font-bold text-gray-700 dark:text-gray-300">
                  Cap: {totalSoldTickets} / {event.capacity}
                </span>
              </div>
            </div>

            {/* Quick Stats Pill */}
            <div className="flex items-center gap-3">
              <div className="bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700/80 px-3.5 py-2 rounded-2xl text-right">
                <span className="text-[10px] uppercase font-bold text-gray-400 block">Gross Revenue</span>
                <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                  ₹{grossRevenue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Event Navigation Tabs */}
          <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar border-t border-gray-100 dark:border-gray-800 pt-2 pb-1 text-xs font-bold">
            {[
              { id: "overview", label: "Overview & Stats", icon: LayoutDashboard },
              {
                id: "orders",
                label: "Payments & Orders",
                icon: CreditCard,
                badge: pendingOrders.length > 0 ? `${pendingOrders.length} ⚡` : null,
                isUrgent: pendingOrders.length > 0,
              },
              { id: "attendees", label: `Guest List (${tickets.length})`, icon: Users },
              { id: "tickets", label: `Passes & Tiers (${tiers.length})`, icon: Ticket },
              { id: "broadcast", label: "Broadcast Announcements", icon: Megaphone },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  data-tour={`tab-${tab.id}`}
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    if (tab.id === "broadcast") {
                      setIsBulkEmailOpen(true);
                    }
                  }}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all shrink-0 cursor-pointer ${
                    isActive
                      ? "bg-[#0758fc] text-white shadow-xs font-extrabold"
                      : tab.isUrgent
                      ? "text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  <Icon size={14} />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span
                      className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-amber-500 text-white animate-pulse"
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* ── MAIN WORKSPACE CONTENT ──────────────────────────────────────── */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">

        {/* ══════════════════════════════════════════════════════════════════
            TAB 1: OVERVIEW & REAL-TIME EVENT ANALYTICS
            ══════════════════════════════════════════════════════════════════ */}
        {activeTab === "overview" && (
          <div className="space-y-6 animate-in fade-in-50">
            {/* KPI Cards Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Gross Revenue */}
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 rounded-3xl shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Gross Revenue</span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <DollarSign size={16} />
                  </div>
                </div>
                <div className="text-2xl font-black text-gray-900 dark:text-white">
                  ₹{grossRevenue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </div>
                <p className="text-[11px] text-gray-400">From {paidOrders.length} confirmed orders</p>
              </div>

              {/* Passes Sold / Capacity */}
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 rounded-3xl shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Passes Sold</span>
                  <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950 text-[#0758fc] dark:text-blue-400 flex items-center justify-center">
                    <Ticket size={16} />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-gray-900 dark:text-white">{totalSoldTickets}</span>
                  <span className="text-xs text-gray-400 font-bold">/ {event.capacity} total</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#0758fc] h-full rounded-full transition-all"
                    style={{ width: `${capacityPercent}%` }}
                  />
                </div>
              </div>

              {/* Check-In Velocity */}
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 rounded-3xl shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Gate Check-Ins</span>
                  <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                    <QrCode size={16} />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-gray-900 dark:text-white">{totalCheckedIn}</span>
                  <span className="text-xs font-bold text-purple-600 dark:text-purple-400">({checkInRate}% checked in)</span>
                </div>
                <p className="text-[11px] text-gray-400">{totalSoldTickets - totalCheckedIn} remaining to enter</p>
              </div>

              {/* Pending Approvals */}
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 rounded-3xl shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">UPI Approvals</span>
                  <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <Clock size={16} />
                  </div>
                </div>
                <div className="text-2xl font-black text-gray-900 dark:text-white">
                  {pendingOrders.length}
                </div>
                {pendingOrders.length > 0 ? (
                  <button
                    onClick={() => setActiveTab("orders")}
                    className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                  >
                    Action required in Orders →
                  </button>
                ) : (
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">All payments up to date</p>
                )}
              </div>
            </div>

            {/* Ticket Tier Breakdown */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-gray-900 dark:text-white">Ticket Tier Inventory &amp; Performance</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Real-time breakdown of capacity, sales velocity, and revenue by pass type</p>
                </div>
                <button
                  onClick={() => setActiveTab("tickets")}
                  className="text-xs font-bold text-[#0758fc] dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  Manage Tiers →
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-800 text-gray-500 uppercase tracking-wider font-extrabold text-[10px]">
                    <tr>
                      <th className="py-3.5 px-4">Tier Name</th>
                      <th className="py-3.5 px-4">Price</th>
                      <th className="py-3.5 px-4">Audience</th>
                      <th className="py-3.5 px-4">Sold / Capacity</th>
                      <th className="py-3.5 px-4">Fill Rate</th>
                      <th className="py-3.5 px-4 text-right">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {tiers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-gray-400">No ticket tiers created for this event.</td>
                      </tr>
                    ) : (
                      tiers.map((tier) => {
                        const tierTickets = tickets.filter(
                          (t) =>
                            (t.ticket_tier_id === tier.id || t.saas_ticket_tiers?.name === tier.name) &&
                            (t.status === "CONFIRMED" || t.status === "USED")
                        );
                        const sold = tierTickets.length;
                        const capacity = Number(tier.total_capacity) || 100;
                        const rate = Math.min(100, Math.round((sold / capacity) * 100));
                        const tierRev = sold * Number(tier.price || 0);

                        return (
                          <tr key={tier.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                            <td className="py-3.5 px-4">
                              <span className="font-extrabold text-gray-900 dark:text-white block">{tier.name}</span>
                              {tier.is_bulk_slab && (
                                <span className="text-[10px] text-purple-600 font-bold">Group Slab ({tier.bulk_slab_size} passes)</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 font-bold text-gray-900 dark:text-white">
                              {Number(tier.price) === 0 ? "FREE" : `₹${tier.price}`}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                                {tier.allowed_audience || "ALL"}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-mono font-bold text-gray-900 dark:text-white">
                              {sold} / {capacity}
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2">
                                <div className="w-20 bg-gray-100 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
                                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${rate}%` }} />
                                </div>
                                <span className="text-[10px] font-bold text-gray-400">{rate}%</span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-right font-black text-gray-900 dark:text-white">
                              ₹{tierRev.toLocaleString("en-IN")}
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

        {/* ══════════════════════════════════════════════════════════════════
            TAB 2: ORDERS & PENDING UPI APPROVALS (Strictly Event-Scoped)
            ══════════════════════════════════════════════════════════════════ */}
        {activeTab === "orders" && (
          <div className="space-y-6 animate-in fade-in-50">
            {/* Pending Approvals Section */}
            {pendingOrders.length > 0 && (
              <div className="bg-amber-50/70 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-700 rounded-3xl p-5 sm:p-6 space-y-4 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center shrink-0">
                      <Clock size={20} className="animate-spin" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-amber-900 dark:text-amber-200">
                        {pendingOrders.length} Pending UPI Payment{pendingOrders.length > 1 ? "s" : ""} Awaiting Verification
                      </h3>
                      <p className="text-xs text-amber-700 dark:text-amber-300">
                        These registrants for <strong>{event.title}</strong> submitted their bank UTR. Check your account and approve to generate entry QR passes.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="divide-y divide-amber-200 dark:divide-amber-800/80">
                  {pendingOrders.map((ord: any) => (
                    <div key={ord.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-gray-900 dark:text-white text-xs bg-white dark:bg-gray-800 border border-amber-200 dark:border-amber-700 px-2.5 py-1 rounded-lg">
                            {ord.order_number}
                          </span>
                          <span className="font-extrabold text-gray-900 dark:text-white text-sm">
                            ₹{ord.total_amount}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-gray-900 dark:text-white">{ord.customer_name}</p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">{ord.customer_email}</p>
                        {ord.upi_transaction_id && (
                          <p className="text-xs text-gray-700 dark:text-gray-300 font-mono">
                            UTR: <span className="font-extrabold bg-white dark:bg-gray-800 px-1.5 py-0.5 rounded-md border border-amber-200 dark:border-amber-700">{ord.upi_transaction_id}</span>
                          </p>
                        )}
                        {(ord.payment_proof_url || ord.upi_receipt_url || ord.upi_screenshot_url) && (
                          <button
                            type="button"
                            onClick={() => setProofModalOrder(ord)}
                            className="text-[11px] text-[#0758fc] dark:text-blue-400 font-bold hover:underline inline-flex items-center gap-1 cursor-pointer mt-0.5"
                          >
                            <Camera size={12} /> View Screenshot Proof
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          disabled={actionLoadingId === ord.id}
                          onClick={() => handleApproveOrder(ord.id)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-4 py-2 rounded-xl transition-all shadow-xs cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-50"
                        >
                          {actionLoadingId === ord.id ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                          <span>Approve Pass</span>
                        </button>

                        <button
                          type="button"
                          disabled={actionLoadingId === ord.id}
                          onClick={() => setRejectionModalOrder(ord)}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs px-3 py-2 rounded-xl transition-all cursor-pointer inline-flex items-center gap-1"
                        >
                          <XCircle size={13} />
                          <span>Reject</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Filter Toolbar */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex-1 relative">
                <Search size={15} className="absolute left-3.5 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by order number, delegate name, email, or UTR..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-2xl pl-9 pr-4 py-2 text-xs outline-none focus:border-[#0758fc]"
                />
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <select
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                  className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 dark:text-gray-300 outline-none cursor-pointer"
                >
                  <option value="ALL">All Orders ({orders.length})</option>
                  <option value="PENDING">Pending Approval ({pendingOrders.length})</option>
                  <option value="PAID">Paid / Approved ({paidOrders.length})</option>
                  <option value="REJECTED">Rejected</option>
                </select>

                <button
                  type="button"
                  onClick={() => {
                    if (filteredOrders.length === 0) return alert("No orders to export");
                    exportEventAttendeesToExcel(`RotaSphere_Orders_${event.slug}`, tickets);
                    showToast("✓ Orders exported to Excel workbook (.xlsx)");
                  }}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 text-gray-800 dark:text-gray-200 font-bold text-xs px-3 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <FileSpreadsheet size={13} className="text-emerald-600 dark:text-emerald-400" />
                  <span>Export</span>
                </button>
              </div>
            </div>

            {/* Complete Orders Table */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-800 text-gray-500 uppercase tracking-wider font-extrabold text-[10px]">
                    <tr>
                      <th className="py-3.5 px-6">Order Ref</th>
                      <th className="py-3.5 px-6">Delegate</th>
                      <th className="py-3.5 px-6">Amount</th>
                      <th className="py-3.5 px-6">UTR Reference</th>
                      <th className="py-3.5 px-6">Status</th>
                      <th className="py-3.5 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-medium">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-gray-400">
                          No orders matched your search or filters.
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((ord: any) => {
                        const isPending = ord.status === "PENDING_VERIFICATION";
                        const isPaid = ord.status === "PAID";
                        const isRejected = ord.status === "PAYMENT_REJECTED";

                        return (
                          <tr key={ord.id} className={`hover:bg-gray-50/50 dark:hover:bg-gray-800/40 ${isPending ? "bg-amber-50/30 dark:bg-amber-950/20" : ""}`}>
                            <td className="py-3.5 px-6 font-mono font-bold text-gray-900 dark:text-white">
                              {ord.order_number}
                            </td>
                            <td className="py-3.5 px-6">
                              <p className="font-bold text-gray-900 dark:text-white">{ord.customer_name}</p>
                              <p className="text-[11px] text-gray-400 font-mono">{ord.customer_email}</p>
                            </td>
                            <td className="py-3.5 px-6 font-black text-gray-900 dark:text-white">
                              ₹{Number(ord.total_amount || 0).toFixed(2)}
                            </td>
                            <td className="py-3.5 px-6">
                              {ord.upi_transaction_id ? (
                                <div className="space-y-1">
                                  <span className="font-mono font-bold text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-md text-gray-900 dark:text-white block w-fit">
                                    {ord.upi_transaction_id}
                                  </span>
                                  {(ord.payment_proof_url || ord.upi_receipt_url || ord.upi_screenshot_url) && (
                                    <button
                                      type="button"
                                      onClick={() => setProofModalOrder(ord)}
                                      className="text-[11px] text-[#0758fc] dark:text-blue-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                                    >
                                      <Camera size={11} /> Proof
                                    </button>
                                  )}
                                </div>
                              ) : (ord.payment_proof_url || ord.upi_receipt_url || ord.upi_screenshot_url) ? (
                                <button
                                  type="button"
                                  onClick={() => setProofModalOrder(ord)}
                                  className="text-[11px] text-[#0758fc] dark:text-blue-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                                >
                                  <Camera size={11} /> View Photo Proof
                                </button>
                              ) : (
                                <span className="text-gray-400 italic text-[11px]">Free / N/A</span>
                              )}
                            </td>
                            <td className="py-3.5 px-6 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase whitespace-nowrap leading-none border ${
                                  isPaid
                                    ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                                    : isPending
                                    ? "bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700 font-black animate-pulse"
                                    : "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800"
                                }`}
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0"></span>
                                {isPending ? "PENDING APPROVAL" : isPaid ? "APPROVED" : "REJECTED"}
                              </span>
                            </td>
                            <td className="py-3.5 px-6 text-right space-x-2 whitespace-nowrap">
                              {isPending && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleApproveOrder(ord.id)}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-1.5 rounded-xl cursor-pointer inline-flex items-center gap-1 shadow-xs"
                                  >
                                    <CheckCircle2 size={12} /> Approve
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setRejectionModalOrder(ord)}
                                    className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs px-2.5 py-1.5 rounded-xl border border-rose-200 cursor-pointer inline-flex items-center gap-1"
                                  >
                                    <XCircle size={12} /> Reject
                                  </button>
                                </>
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

        {/* ══════════════════════════════════════════════════════════════════
            TAB 3: GUEST LIST / DELEGATES (Strictly Event-Scoped)
            ══════════════════════════════════════════════════════════════════ */}
        {activeTab === "attendees" && (
          <div className="space-y-6 animate-in fade-in-50">
            {/* Toolbar */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="flex-1 relative">
                <Search size={15} className="absolute left-3.5 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search delegates by name, ticket code, email, or club..."
                  value={attendeeSearch}
                  onChange={(e) => setAttendeeSearch(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-2xl pl-9 pr-4 py-2 text-xs outline-none focus:border-[#0758fc]"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <select
                  value={attendeeTierFilter}
                  onChange={(e) => setAttendeeTierFilter(e.target.value)}
                  className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 dark:text-gray-300 outline-none cursor-pointer"
                >
                  <option value="ALL">All Tiers</option>
                  {tiers.map((t) => (
                    <option key={t.id} value={t.name}>{t.name}</option>
                  ))}
                </select>

                <select
                  value={attendeeStatusFilter}
                  onChange={(e) => setAttendeeStatusFilter(e.target.value)}
                  className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 dark:text-gray-300 outline-none cursor-pointer"
                >
                  <option value="ALL">All Attendance</option>
                  <option value="CONFIRMED">Confirmed / Not Checked In</option>
                  <option value="CHECKED_IN">Checked In At Gate</option>
                  <option value="PENDING">Pending Approval</option>
                </select>

                <button
                  type="button"
                  onClick={() => {
                    if (filteredTickets.length === 0) return alert("No attendees to export");
                    exportEventAttendeesToExcel(`RotaSphere_Delegates_${event.slug}`, filteredTickets);
                    showToast("✓ Delegate roster exported to Excel (.xlsx)");
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <FileSpreadsheet size={13} />
                  <span>Export Excel (.xlsx)</span>
                </button>
              </div>
            </div>

            {/* Attendees Table */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-800 text-gray-500 uppercase tracking-wider font-extrabold text-[10px]">
                    <tr>
                      <th className="py-3.5 px-6">Ticket Code</th>
                      <th className="py-3.5 px-6">Delegate Details</th>
                      <th className="py-3.5 px-6">Club / Organization</th>
                      <th className="py-3.5 px-6">Tier</th>
                      <th className="py-3.5 px-6">Status</th>
                      <th className="py-3.5 px-6 text-right">Check-In</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-medium">
                    {filteredTickets.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-gray-400">
                          No delegates found matching your search.
                        </td>
                      </tr>
                    ) : (
                      filteredTickets.map((t: any) => {
                        const isUsed = t.status === "USED" || !!t.checked_in_at;
                        const isPend = t.status === "PENDING_VERIFICATION" || t.status === "PENDING" || t.order_status === "PENDING_VERIFICATION";
                        const isRej = t.status === "PAYMENT_REJECTED" || t.status === "REJECTED";

                        return (
                          <tr key={t.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/40 transition-colors">
                            <td className="py-3.5 px-6">
                              <span className="font-mono font-extrabold text-[#0758fc] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800">
                                {t.ticket_code}
                              </span>
                            </td>
                            <td className="py-3.5 px-6">
                              <p className="font-bold text-gray-900 dark:text-white">{t.attendee_name || "Delegate"}</p>
                              <p className="text-[11px] text-gray-400 font-mono">{t.attendee_email}</p>
                            </td>
                            <td className="py-3.5 px-6 text-gray-700 dark:text-gray-300">
                              {t.club_name || t.custom_answers?.club_name || event.organization?.name || "Rotaract 3192"}
                            </td>
                            <td className="py-3.5 px-6 font-bold text-gray-900 dark:text-white">
                              {t.saas_ticket_tiers?.name || "Standard Pass"}
                            </td>
                            <td className="py-3.5 px-6 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase whitespace-nowrap leading-none border ${
                                  isUsed
                                    ? "bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800"
                                    : isRej
                                    ? "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800"
                                    : isPend
                                    ? "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                                    : "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                                }`}
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0"></span>
                                {isUsed ? "CHECKED_IN" : isRej ? "REJECTED" : isPend ? "PENDING APPROVAL" : "CONFIRMED"}
                              </span>
                            </td>
                            <td className="py-3.5 px-6 text-right whitespace-nowrap">
                              {isUsed ? (
                                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold inline-flex items-center gap-1">
                                  <Check size={13} /> Admitted
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={async () => {
                                    const res = await checkInTicketAction({
                                      rawInput: t.ticket_code,
                                      eventId: event.id,
                                      gateName: "Dashboard Admin Gate",
                                    });
                                    if (res.result === "SUCCESS") {
                                      setTickets((prev) =>
                                        prev.map((item) =>
                                          item.id === t.id ? { ...item, status: "USED", checked_in_at: new Date().toISOString() } : item
                                        )
                                      );
                                      showToast(`✓ Checked in: ${t.attendee_name}`);
                                    } else {
                                      alert(res.message || "Failed to check in ticket.");
                                    }
                                  }}
                                  className="bg-gray-100 dark:bg-gray-800 hover:bg-[#0758fc] hover:text-white text-gray-700 dark:text-gray-300 text-xs font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer inline-flex items-center gap-1"
                                >
                                  <QrCode size={12} /> Check In
                                </button>
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

        {/* ══════════════════════════════════════════════════════════════════
            TAB 4: TICKET TIERS & BULK SLABS
            ══════════════════════════════════════════════════════════════════ */}
        {activeTab === "tickets" && (
          <div className="space-y-6 animate-in fade-in-50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white">Ticket Tiers &amp; Pricing</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Configure prices, capacities, bulk group slab discounts, and audience permissions</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingTier(null);
                  setTierForm({
                    name: "",
                    description: "",
                    price: 0,
                    totalCapacity: 100,
                    tierType: "REGULAR",
                    allowedAudience: "ALL",
                    isBulkSlab: false,
                    bulkSlabSize: 10,
                    maxPerOrder: 10,
                  });
                  setTierModalOpen(true);
                }}
                className="bg-[#0758fc] hover:bg-[#054fe0] text-white font-extrabold text-xs px-4 py-2.5 rounded-2xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer hover:scale-[1.02] active:scale-95"
              >
                <Plus size={15} />
                <span>Create New Tier</span>
              </button>
            </div>

            {/* Tiers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {tiers.map((t) => {
                const sold = tickets.filter(
                  (tkt) =>
                    (tkt.ticket_tier_id === t.id || tkt.saas_ticket_tiers?.name === t.name) &&
                    (tkt.status === "CONFIRMED" || tkt.status === "USED")
                ).length;
                const cap = Number(t.total_capacity) || 100;
                const rate = Math.min(100, Math.round((sold / cap) * 100));

                return (
                  <div
                    key={t.id}
                    className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-[#0758fc]/40 rounded-3xl p-6 shadow-xs flex flex-col justify-between gap-5 transition-all"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-base font-black text-gray-900 dark:text-white">{t.name}</h4>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                            {t.is_bulk_slab ? "Group Slab" : "Standard Pass"}
                          </span>
                        </div>
                        <span className="text-xl font-black text-[#0758fc] dark:text-blue-400">
                          {Number(t.price) === 0 ? "FREE" : `₹${t.price}`}
                        </span>
                      </div>

                      {t.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{t.description}</p>
                      )}

                      <div className="space-y-1.5 pt-2">
                        <div className="flex items-center justify-between text-xs font-bold text-gray-700 dark:text-gray-300">
                          <span>Sold: {sold} / {cap}</span>
                          <span className="text-[#0758fc]">{rate}%</span>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
                          <div className="bg-[#0758fc] h-full rounded-full transition-all" style={{ width: `${rate}%` }} />
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5 pt-1">
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                          Audience: {t.allowed_audience || "ALL"}
                        </span>
                        {t.is_bulk_slab && (
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                            Fixed: {t.bulk_slab_size} Passes
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingTier(t);
                          const isBulk = Boolean(t.is_bulk_slab || t.tier_type === "BULK");
                          setTierForm({
                            name: t.name || "",
                            description: t.description || "",
                            price: Number(t.price) || 0,
                            totalCapacity: Number(t.total_capacity) || 100,
                            tierType: t.tier_type || "REGULAR",
                            allowedAudience: t.allowed_audience || "ALL",
                            isBulkSlab: isBulk,
                            bulkSlabSize: t.bulk_slab_size != null 
                              ? Number(t.bulk_slab_size) 
                              : (t.bulkSlabSize != null 
                                  ? Number(t.bulkSlabSize) 
                                  : (t.max_per_order && Number(t.max_per_order) > 1 ? Number(t.max_per_order) : 15)),
                            maxPerOrder: t.max_per_order || 10,
                          });
                          setTierModalOpen(true);
                        }}
                        className="flex-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold text-xs py-2 px-3 rounded-xl transition-colors cursor-pointer text-center"
                      >
                        Edit Tier
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB 5: BROADCAST ANNOUNCEMENTS (Full Feature matching Admin Panel)
            ══════════════════════════════════════════════════════════════════ */}
        {activeTab === "broadcast" && (
          <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in-50">
            {/* Header banner */}
            <div className="bg-gradient-to-br from-blue-600 via-[#0758fc] to-indigo-700 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
              <div className="relative z-10 space-y-3">
                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold">
                  <Megaphone size={14} />
                  <span>District 3192 Official Broadcast Engine</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                  Delegate Announcement Hub
                </h2>
                <p className="text-xs sm:text-sm text-blue-100 max-w-xl">
                  Send high-converting email notifications, schedules, QR gate passes, and PDF documents to confirmed attendees of <strong>{event.title}</strong>.
                </p>
                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsBulkEmailOpen(true)}
                    className="bg-white hover:bg-blue-50 text-[#0758fc] font-black text-xs sm:text-sm px-6 py-3 rounded-2xl shadow-md transition-all flex items-center gap-2 cursor-pointer hover:scale-105 active:scale-95"
                  >
                    <Send size={15} />
                    <span>Open Broadcast Studio</span>
                  </button>
                </div>
              </div>
              <div className="absolute -right-6 -bottom-10 opacity-15 pointer-events-none">
                <Megaphone size={220} />
              </div>
            </div>

            {/* Recipient Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 rounded-3xl shadow-xs space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Total Registered</span>
                <span className="text-2xl font-black text-gray-900 dark:text-white">{tickets.length}</span>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">Total delegates in guest list</p>
              </div>

              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 rounded-3xl shadow-xs space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Approved &amp; Confirmed</span>
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{totalSoldTickets}</span>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">Ready for instant QR broadcasts</p>
              </div>

              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-5 rounded-3xl shadow-xs space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Admitted Today</span>
                <span className="text-2xl font-black text-purple-600 dark:text-purple-400">{totalCheckedIn}</span>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">Passed gate check-in</p>
              </div>
            </div>

            {/* Feature Capabilities Breakdown */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
              <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
                <Sparkles size={16} className="text-[#0758fc]" />
                <span>What you can do with the Broadcast Studio:</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-750 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-gray-900 dark:text-white">
                    <span className="text-base">📢</span>
                    <span>District 3192 Branded Layout</span>
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
                    Broadcasts use official HTML templates styled with District 3192 headers, logos, and customizable action buttons.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-750 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-gray-900 dark:text-white">
                    <span className="text-base">🎟️</span>
                    <span>Automated QR Pass Attachment</span>
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
                    Toggle automatic generation and attachment of personalized QR entry tickets directly to each delegate&apos;s email.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-750 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-gray-900 dark:text-white">
                    <span className="text-base">📎</span>
                    <span>Event Materials &amp; Attachments</span>
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
                    Attach schedule itineraries, rulebooks, parking passes, and PDFs directly to the mass email transmission.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-750 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-gray-900 dark:text-white">
                    <span className="text-base">🧪</span>
                    <span>Live Preview &amp; Test Dispatch</span>
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
                    Preview your email in real-time and send test verification emails to your inbox before reaching the guest list.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-gray-100 dark:border-gray-800">
                <span className="text-xs text-gray-400">Powered by the Platform Bulk Email Infrastructure</span>
                <button
                  type="button"
                  onClick={() => setIsBulkEmailOpen(true)}
                  className="bg-[#0758fc] hover:bg-[#054fe0] text-white font-black text-xs px-5 py-2.5 rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <Megaphone size={14} />
                  <span>Launch Broadcast Studio</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* ── PHOTO PROOF PREVIEW MODAL ────────────────────────────────────── */}
      {proofModalOrder && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in-50">
          <div className="relative max-w-2xl w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto text-left">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase text-[#0758fc] dark:text-blue-400 block">
                  Verify UPI Payment Screenshot
                </span>
                <h4 className="text-base font-black text-gray-900 dark:text-white">
                  Order Ref: {proofModalOrder.order_number}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setProofModalOrder(null)}
                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 flex items-center justify-center cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-gray-50 dark:bg-gray-800 p-3 rounded-2xl text-xs">
              <div>
                <span className="text-[10px] text-gray-400 font-bold block uppercase">Delegate</span>
                <span className="font-bold text-gray-900 dark:text-white truncate block">{proofModalOrder.customer_name}</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 font-bold block uppercase">Amount</span>
                <span className="font-black text-emerald-600 dark:text-emerald-400">₹{proofModalOrder.total_amount}</span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 font-bold block uppercase">UTR Number</span>
                <span className="font-mono font-bold text-gray-900 dark:text-white truncate block">{proofModalOrder.upi_transaction_id || "None"}</span>
              </div>
            </div>

            <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-black/5 flex items-center justify-center min-h-[250px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={proofModalOrder.payment_proof_url || proofModalOrder.upi_receipt_url || proofModalOrder.upi_screenshot_url}
                alt="Payment Screenshot Proof"
                className="max-h-[500px] w-auto object-contain rounded-xl"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-gray-100 dark:border-gray-800">
              <button
                type="button"
                onClick={() => setProofModalOrder(null)}
                className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-gray-700 dark:text-gray-300 font-bold text-xs px-4 py-2 rounded-xl cursor-pointer"
              >
                Close
              </button>

              {proofModalOrder.status === "PENDING_VERIFICATION" && (
                <button
                  type="button"
                  disabled={actionLoadingId === proofModalOrder.id}
                  onClick={() => handleApproveOrder(proofModalOrder.id)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-5 py-2 rounded-xl transition-all shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                >
                  {actionLoadingId === proofModalOrder.id ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                  <span>Approve Payment &amp; Issue QR Pass</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── REJECTION MODAL ──────────────────────────────────────────────── */}
      {rejectionModalOrder && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in-50">
          <div className="relative max-w-md w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-2xl space-y-4 text-left">
            <h4 className="text-base font-black text-rose-600">Reject Payment Proof</h4>
            <p className="text-xs text-gray-500">
              Explain why this payment for <strong>{rejectionModalOrder.order_number}</strong> is being rejected. The delegate will be notified.
            </p>

            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. UTR reference not credited to club account / wrong amount."
              className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-3 text-xs text-gray-900 dark:text-white outline-none"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectionModalOrder(null)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold px-3 py-2 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRejectOrder}
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CREATE / EDIT TIER MODAL ─────────────────────────────────────── */}
      {tierModalOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in-50">
          <div className="relative max-w-lg w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4 text-left max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <h4 className="text-base font-black text-gray-900 dark:text-white">
                {editingTier ? "Edit Ticket Tier" : "Create New Ticket Tier"}
              </h4>
              <button
                type="button"
                onClick={() => setTierModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 flex items-center justify-center cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-gray-700 dark:text-gray-300">Tier Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Rotaract Member Early Bird, VIP Pass..."
                  value={tierForm.name}
                  onChange={(e) => setTierForm({ ...tierForm, name: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-2.5 text-xs text-gray-900 dark:text-white outline-none focus:border-[#0758fc]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700 dark:text-gray-300">Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={tierForm.price}
                    onChange={(e) => setTierForm({ ...tierForm, price: Number(e.target.value) || 0 })}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-2.5 text-xs text-gray-900 dark:text-white outline-none focus:border-[#0758fc]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700 dark:text-gray-300">Total Capacity</label>
                  <input
                    type="number"
                    min="1"
                    value={tierForm.totalCapacity}
                    onChange={(e) => setTierForm({ ...tierForm, totalCapacity: Number(e.target.value) || 100 })}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-2.5 text-xs text-gray-900 dark:text-white outline-none focus:border-[#0758fc]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700 dark:text-gray-300">Audience Targeting</label>
                <select
                  value={tierForm.allowedAudience}
                  onChange={(e) => setTierForm({ ...tierForm, allowedAudience: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-3.5 py-2.5 text-xs text-gray-900 dark:text-white outline-none cursor-pointer"
                >
                  <option value="ALL">All Delegates (Rotaract &amp; Non-Rotaract)</option>
                  <option value="ROTARACT_ONLY">Verified Rotaractors Only</option>
                  <option value="NON_ROTARACT_ONLY">Non-Rotaract Guests Only</option>
                </select>
              </div>

              {/* Bulk Slab Toggle */}
              <div className="p-3 bg-purple-50/60 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-2xl space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tierForm.isBulkSlab}
                    onChange={(e) => setTierForm({ ...tierForm, isBulkSlab: e.target.checked })}
                    className="rounded accent-[#0758fc]"
                  />
                  <span className="font-bold text-purple-900 dark:text-purple-200">
                    This is a Group / Delegation Bulk Slab
                  </span>
                </label>

                {tierForm.isBulkSlab && (
                  <div className="space-y-1 pt-1">
                    <label className="font-bold text-purple-800 dark:text-purple-300">
                      Slab Size (exact passes per order, e.g. 10 or 15)
                    </label>
                    <input
                      type="number"
                      min="2"
                      max="200"
                      value={tierForm.bulkSlabSize ?? 15}
                      onChange={(e) => {
                        const raw = e.target.value;
                        if (raw === "") {
                          setTierForm({ ...tierForm, bulkSlabSize: "" as any });
                          return;
                        }
                        const val = parseInt(raw, 10);
                        setTierForm({ ...tierForm, bulkSlabSize: isNaN(val) ? 15 : val });
                      }}
                      onBlur={() => {
                        const val = Number(tierForm.bulkSlabSize);
                        if (!val || isNaN(val) || val < 2) {
                          setTierForm({ ...tierForm, bulkSlabSize: 15 });
                        } else if (val > 200) {
                          setTierForm({ ...tierForm, bulkSlabSize: 200 });
                        }
                      }}
                      className="w-full bg-white dark:bg-gray-800 border border-purple-300 dark:border-purple-700 rounded-xl px-3 py-2 text-xs"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 flex items-center justify-end gap-2 border-t border-gray-100 dark:border-gray-800">
              <button
                type="button"
                onClick={() => setTierModalOpen(false)}
                className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-gray-700 dark:text-gray-300 font-bold text-xs px-4 py-2 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoadingId === "tier-save"}
                onClick={handleSaveTier}
                className="bg-[#0758fc] hover:bg-[#054fe0] text-white font-extrabold text-xs px-5 py-2 rounded-xl transition-all shadow-xs cursor-pointer inline-flex items-center gap-1.5"
              >
                {actionLoadingId === "tier-save" && <Loader2 size={13} className="animate-spin" />}
                <span>Save Tier</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── BROADCAST BULK EMAIL MODAL (Identical to Super Admin) ─────── */}
      <BulkEmailModal
        isOpen={isBulkEmailOpen}
        onClose={() => setIsBulkEmailOpen(false)}
        events={[{ id: event.id, title: event.title }]}
        defaultEventId={event.id}
        isSuperAdmin={user?.profile?.role === "super_admin" || user?.email === "tech.rotaract3192@gmail.com"}
      />
    </div>
  );
}
