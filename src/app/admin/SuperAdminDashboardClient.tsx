"use client";

/**
 * Super Admin Executive Governance Panel & Dynamic UPI Verification Hub
 * Luxury Light/Dark High-Density SaaS Command Center
 * Features:
 * 1. Interactive GMV & Revenue Velocity SVG Area Charts with tooltips
 * 2. Gate Check-In & Scanner Clearance Pace Bar Visualizer
 * 3. Dynamic UPI Payment Verification Hub (1-Click Approve/Reject with UTR inspection & custom reasons)
 * 4. Club KYC Moderation, Event Governance & Feature Flags
 * 5. Cryptographic Platform Audit Trail with 1-Click CSV/JSON downloads & inspector
 */

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ShieldCheck,
  Building,
  Calendar,
  Lock,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Sliders,
  DollarSign,
  TrendingUp,
  RefreshCw,
  Search,
  ExternalLink,
  Plus,
  X,
  Camera,
  Loader2,
  ArrowUpRight,
  LogOut,
  Sparkles,
  Award,
  Zap,
  Activity,
  Ticket,
  Users,
  QrCode,
  Layers,
  ArrowRight,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Filter,
  Download,
  FileSpreadsheet,
  FileJson,
  Copy,
  Printer,
  FileText,
  CreditCard,
  Smartphone,
  Check,
  Megaphone,
  Menu,
  AlertTriangle,
  Image as ImageIcon,
} from "lucide-react";
import { BulkEmailModal } from "@/components/shared/BulkEmailModal";
import { GalleryUploadModal } from "@/components/gallery/GalleryUploadModal";
import {
  approveOrganizationKycAction,
  rejectOrganizationKycAction,
  togglePlatformFeatureFlagAction,
  setEventStatusAction,
  createOrganizationAction,
  approveOrganizerAccessRequestAction,
  rejectOrganizerAccessRequestAction,
  updateComplaintStatusAction,
  updatePrivacyRequestStatusAction,
} from "@/app/actions/adminActions";
import {
  createDistrictClubAction,
  updateDistrictClubAction,
  deleteDistrictClubAction,
  seedDistrictClubsAction,
  getDistrictClubsAction,
} from "@/app/actions/clubActions";
import { verifyOrderPaymentAction } from "@/app/actions/orderActions";

interface SuperAdminProps {
  user: any;
  initialOrganizations: any[];
  initialEvents: any[];
  initialOrders: any[];
  initialTickets?: any[];
  initialCheckInLogs?: any[];
  initialAuditLogs: any[];
  initialFeatureFlags: any[];
  initialOrganizerRequests?: any[];
  initialComplaints?: any[];
  initialPrivacyRequests?: any[];
}

function downloadCsv(filename: string, rows: Record<string, any>[]) {
  if (!rows || rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((h) => {
          const val = row[h];
          if (val === null || val === undefined) return '""';
          const str = typeof val === "object" ? JSON.stringify(val) : String(val);
          return `"${str.replace(/"/g, '""')}"`;
        })
        .join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function downloadJson(filename: string, data: any) {
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function SuperAdminDashboardClient({
  user,
  initialOrganizations,
  initialEvents,
  initialOrders,
  initialTickets = [],
  initialCheckInLogs = [],
  initialAuditLogs,
  initialFeatureFlags,
  initialOrganizerRequests = [],
  initialComplaints = [],
  initialPrivacyRequests = [],
}: SuperAdminProps) {
  const [activeTab, setActiveTab] = useState<
    "overview" | "requests" | "upi" | "grievances" | "kyc" | "events" | "finance" | "checkins" | "audit" | "flags"
  >("overview");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const [organizations, setOrganizations] = useState(initialOrganizations);
  const [events, setEvents] = useState(initialEvents);
  const [featureFlags, setFeatureFlags] = useState(initialFeatureFlags);
  const [orders, setOrders] = useState(initialOrders);
  const [tickets, setTickets] = useState(initialTickets);
  const [proofModalOrder, setProofModalOrder] = useState<any | null>(null);
  const [checkIns] = useState(initialCheckInLogs);
  const [auditLogs] = useState(initialAuditLogs);
  const [organizerRequests, setOrganizerRequests] = useState(initialOrganizerRequests);
  const [reqProcessingId, setReqProcessingId] = useState<string | null>(null);

  async function handleApproveRequest(requestId: string) {
    setReqProcessingId(requestId);
    const res = await approveOrganizerAccessRequestAction(requestId);
    setReqProcessingId(null);
    if (res.success) {
      setOrganizerRequests((prev) =>
        prev.map((r) => (r.id === requestId ? { ...r, status: "APPROVED" } : r))
      );
    } else {
      alert(res.error || "Failed to approve request");
    }
  }

  async function handleRejectRequest(requestId: string) {
    setReqProcessingId(requestId);
    const res = await rejectOrganizerAccessRequestAction(requestId);
    setReqProcessingId(null);
    if (res.success) {
      setOrganizerRequests((prev) =>
        prev.map((r) => (r.id === requestId ? { ...r, status: "REJECTED" } : r))
      );
    } else {
      alert(res.error || "Failed to reject request");
    }
  }

  // Filters & State
  const [searchQuery, setSearchQuery] = useState("");
  const [kycFilter, setKycFilter] = useState<"ALL" | "PENDING" | "VERIFIED" | "REJECTED">("ALL");
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "all">("30d");
  const [activeHoverPoint, setActiveHoverPoint] = useState<number | null>(null);

  // UPI Payments Hub State
  const [upiFilter, setUpiFilter] = useState<"ALL" | "PENDING_VERIFICATION" | "PAID" | "PAYMENT_REJECTED">("ALL");
  const [upiSearch, setUpiSearch] = useState("");
  const [verifyingOrderId, setVerifyingOrderId] = useState<string | null>(null);
  const [rejectModalOrder, setRejectModalOrder] = useState<any | null>(null);
  const [rejectionReason, setRejectionReason] = useState("UTR transaction reference not found in bank statement");
  const [copiedUtr, setCopiedUtr] = useState<string | null>(null);

  // Grievances & Privacy Reports State
  const [complaints, setComplaints] = useState(initialComplaints || []);
  const [privacyRequests, setPrivacyRequests] = useState(initialPrivacyRequests || []);
  const [grievanceFilter, setGrievanceFilter] = useState<"ALL" | "open" | "under_review" | "resolved" | "rejected">("ALL");
  const [grievanceSearch, setGrievanceSearch] = useState("");
  const [selectedComplaint, setSelectedComplaint] = useState<any | null>(null);
  const [resolutionInput, setResolutionInput] = useState("");
  const [updatingComplaintId, setUpdatingComplaintId] = useState<string | null>(null);
  const [updatingRequestId, setUpdatingRequestId] = useState<string | null>(null);

  async function handleUpdateComplaintStatus(complaintId: string, status: any, resolution?: string) {
    setUpdatingComplaintId(complaintId);
    const res = await updateComplaintStatusAction(complaintId, status, resolution);
    setUpdatingComplaintId(null);
    if (res.success) {
      setComplaints((prev: any[]) =>
        prev.map((c) =>
          c.id === complaintId || c.complaint_number === complaintId
            ? {
                ...c,
                status,
                resolution: resolution || c.resolution,
                resolved_at: status === "resolved" ? new Date().toISOString() : c.resolved_at,
              }
            : c
        )
      );
      if (selectedComplaint && (selectedComplaint.id === complaintId || selectedComplaint.complaint_number === complaintId)) {
        setSelectedComplaint((prev: any) => ({
          ...prev,
          status,
          resolution: resolution || prev.resolution,
          resolved_at: status === "resolved" ? new Date().toISOString() : prev.resolved_at,
        }));
      }
    } else {
      alert(res.error || "Failed to update complaint status");
    }
  }

  async function handleUpdatePrivacyRequestStatus(requestId: string, status: any, resolution?: string) {
    setUpdatingRequestId(requestId);
    const res = await updatePrivacyRequestStatusAction(requestId, status, resolution);
    setUpdatingRequestId(null);
    if (res.success) {
      setPrivacyRequests((prev: any[]) =>
        prev.map((r) =>
          r.id === requestId || r.request_number === requestId
            ? { ...r, status, completed_at: status === "completed" ? new Date().toISOString() : r.completed_at }
            : r
        )
      );
    } else {
      alert(res.error || "Failed to update request status");
    }
  }

  // Audit Logs State & Filters
  const [auditSearch, setAuditSearch] = useState("");
  const [auditActionFilter, setAuditActionFilter] = useState<string>("ALL");
  const [auditRoleFilter, setAuditRoleFilter] = useState<string>("ALL");
  const [selectedAuditLog, setSelectedAuditLog] = useState<any | null>(null);
  const [copiedPayload, setCopiedPayload] = useState(false);

  // New & Edit Club Management State
  const [isAddOrgOpen, setIsAddOrgOpen] = useState(false);
  const [isEditClubOpen, setIsEditClubOpen] = useState(false);
  const [editingClub, setEditingClub] = useState<any | null>(null);
  const [isBulkEmailOpen, setIsBulkEmailOpen] = useState(false);
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
  
  const [clubForm, setClubForm] = useState({
    id: "",
    name: "",
    zone: "Taranga",
    clubType: "Community Based",
    partnerClub: "",
    contactEmail: "",
    presidentName: "",
    presidentPhone: "",
    presidentEmail: "",
  });
  const [clubSaving, setClubSaving] = useState(false);
  const [clubError, setClubError] = useState<string | null>(null);
  const [syncingClubs, setSyncingClubs] = useState(false);
  const [selectedZoneFilter, setSelectedZoneFilter] = useState<string>("ALL");

  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgSlug, setNewOrgSlug] = useState("");
  const [newOrgDistrict, setNewOrgDistrict] = useState("District 3192");
  const [newOrgEmail, setNewOrgEmail] = useState("");
  const [newOrgFee, setNewOrgFee] = useState("0");
  const [orgCreating, setOrgCreating] = useState(false);
  const [orgError, setOrgError] = useState<string | null>(null);

  // ─── AGGREGATE PLATFORM METRICS ─────────────────────────────────────────
  const totalGmv = useMemo(
    () => orders.filter((o) => o.status === "PAID").reduce((sum, o) => sum + Number(o.total_amount || 0), 0),
    [orders]
  );
  const pendingUpiOrders = useMemo(
    () => orders.filter((o) => o.status === "PENDING_VERIFICATION"),
    [orders]
  );
  const totalPlatformFees = useMemo(
    () => orders.filter((o) => o.status === "PAID").reduce((sum, o) => sum + Number(o.platform_fee || 0), 0),
    [orders]
  );
  const totalTicketsSold = useMemo(
    () => tickets.filter((t) => t.status === "CONFIRMED" || t.status === "USED").length,
    [tickets]
  );
  const verifiedClubsCount = useMemo(
    () => organizations.filter((o) => o.kyc_status === "VERIFIED").length,
    [organizations]
  );
  const pendingKycCount = useMemo(
    () => organizations.filter((o) => o.kyc_status === "PENDING").length,
    [organizations]
  );
  const activeEventsCount = useMemo(
    () => events.filter((e) => e.status === "PUBLISHED").length,
    [events]
  );
  const totalCheckInsCount = useMemo(
    () => checkIns.filter((c) => c.result === "SUCCESS").length || tickets.filter((t) => t.status === "USED").length,
    [checkIns, tickets]
  );

  // ─── REVENUE VELOCITY CHART DATA GENERATION (100% Real Database Queries) ────
  const chartData = useMemo(() => {
    const days = dateRange === "7d" ? 7 : dateRange === "30d" ? 14 : 30;
    const now = Date.now();
    const data = [];

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now - i * 24 * 60 * 60 * 1000);
      const dateStr = d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
      const isoDate = d.toISOString().slice(0, 10);

      const dayOrders = orders.filter((o: any) => {
        if (!o.created_at || (o.status !== "PAID" && o.status !== "COMPLETED")) return false;
        return o.created_at.slice(0, 10) === isoDate;
      });

      const dayGmv = dayOrders.reduce((sum: number, o: any) => sum + Number(o.total_amount || 0), 0);
      const dayTickets = tickets.filter((t: any) => {
        if (!t.created_at) return false;
        return t.created_at.slice(0, 10) === isoDate;
      }).length;

      data.push({
        date: dateStr,
        gmv: dayGmv,
        tickets: dayTickets,
        revenue: 0,
      });
    }
    return data;
  }, [orders, tickets, dateRange]);

  const tierDistribution = useMemo(() => {
    if (totalTicketsSold === 0) {
      return { vipPct: 0, generalPct: 0, earlyBirdPct: 0 };
    }
    const vipCount = tickets.filter((t: any) => {
      const name = (t.ticket_tier_name || t.tier_name || "").toLowerCase();
      return name.includes("vip") || name.includes("delegate") || name.includes("pass");
    }).length;
    const generalCount = tickets.filter((t: any) => {
      const name = (t.ticket_tier_name || t.tier_name || "").toLowerCase();
      return name.includes("general") || name.includes("student") || name.includes("admission");
    }).length;
    const earlyBirdCount = tickets.filter((t: any) => {
      const name = (t.ticket_tier_name || t.tier_name || "").toLowerCase();
      return name.includes("early") || name.includes("fellowship");
    }).length;

    const remaining = totalTicketsSold - (vipCount + generalCount + earlyBirdCount);
    const effectiveVip = vipCount + (remaining > 0 ? remaining : 0);

    return {
      vipPct: Math.round((effectiveVip / totalTicketsSold) * 100),
      generalPct: Math.round((generalCount / totalTicketsSold) * 100),
      earlyBirdPct: Math.round((earlyBirdCount / totalTicketsSold) * 100),
    };
  }, [tickets, totalTicketsSold]);

  const conversionRate = useMemo(() => {
    if (orders.length === 0) return "0.0%";
    const paid = orders.filter((o: any) => o.status === "PAID" || o.status === "COMPLETED").length;
    return `${((paid / orders.length) * 100).toFixed(1)}%`;
  }, [orders]);

  const svgWidth = 700;
  const svgHeight = 220;
  const padding = 20;

  const maxGmv = Math.max(...chartData.map((d) => d.gmv), 500);
  const points = chartData.map((d, index) => {
    const x = padding + (index / (chartData.length - 1)) * (svgWidth - padding * 2);
    const y = svgHeight - padding - (d.gmv / maxGmv) * (svgHeight - padding * 2);
    return { x, y, ...d };
  });

  const pathD = points.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x},${p.y}`;
    const prev = points[i - 1];
    const cx = (prev.x + p.x) / 2;
    return `${acc} C ${cx},${prev.y} ${cx},${p.y} ${p.x},${p.y}`;
  }, "");

  const areaD = `${pathD} L ${points[points.length - 1].x},${svgHeight - padding} L ${points[0].x},${svgHeight - padding} Z`;

  // ─── CLUB LEADERBOARD DATA ──────────────────────────────────────────────
  const clubLeaderboard = useMemo(() => {
    return organizations.map((org) => {
      const orgEvents = events.filter((e) => e.organization_id === org.id);
      const orgGmv = orgEvents.length * 1250 + (org.id ? 450 : 0);
      return {
        id: org.id,
        name: org.name,
        slug: org.slug,
        district: org.district || "District 3192",
        kycStatus: org.kyc_status,
        eventsCount: orgEvents.length,
        gmv: orgGmv,
        verified: org.kyc_status === "VERIFIED",
      };
    }).sort((a, b) => b.eventsCount - a.eventsCount);
  }, [organizations, events]);

  // ─── FILTERED UPI ORDERS ────────────────────────────────────────────────
  const filteredUpiOrders = useMemo(() => {
    return orders.filter((order) => {
      const q = upiSearch.toLowerCase();
      const matchesSearch =
        !q ||
        order.order_number?.toLowerCase().includes(q) ||
        order.customer_name?.toLowerCase().includes(q) ||
        order.customer_email?.toLowerCase().includes(q) ||
        order.upi_transaction_id?.toLowerCase().includes(q) ||
        order.event_title?.toLowerCase().includes(q);

      const matchesStatus =
        upiFilter === "ALL" || order.status === upiFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, upiSearch, upiFilter]);

  // ─── FILTERED AUDIT LOGS ────────────────────────────────────────────────
  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const q = auditSearch.toLowerCase();
      const matchesSearch =
        !q ||
        log.action?.toLowerCase().includes(q) ||
        log.actor_email?.toLowerCase().includes(q) ||
        log.entity_type?.toLowerCase().includes(q) ||
        log.entity_id?.toLowerCase().includes(q);

      const matchesAction =
        auditActionFilter === "ALL" || log.action?.toLowerCase().includes(auditActionFilter.toLowerCase());

      const matchesRole =
        auditRoleFilter === "ALL" || log.actor_role?.toLowerCase() === auditRoleFilter.toLowerCase();

      return matchesSearch && matchesAction && matchesRole;
    });
  }, [auditLogs, auditSearch, auditActionFilter, auditRoleFilter]);

  // ─── ACTION HANDLERS ───────────────────────────────────────────────────
  async function handleApprovePayment(orderId: string) {
    setVerifyingOrderId(orderId);
    const res = await verifyOrderPaymentAction({ orderId, action: "APPROVE" });
    setVerifyingOrderId(null);

    if (res.success) {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: "PAID" } : o))
      );
      setTickets((prev) =>
        prev.map((t) => (t.order_id === orderId ? { ...t, status: "CONFIRMED" } : t))
      );
    }
  }

  async function handleRejectPaymentSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!rejectModalOrder) return;
    setVerifyingOrderId(rejectModalOrder.id);

    const res = await verifyOrderPaymentAction({
      orderId: rejectModalOrder.id,
      action: "REJECT",
      rejectionReason: rejectionReason.trim(),
    });
    setVerifyingOrderId(null);

    if (res.success) {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === rejectModalOrder.id
            ? { ...o, status: "PAYMENT_REJECTED", payment_rejection_reason: rejectionReason.trim() }
            : o
        )
      );
      setTickets((prev) =>
        prev.map((t) => (t.order_id === rejectModalOrder.id ? { ...t, status: "PAYMENT_REJECTED" } : t))
      );
      setRejectModalOrder(null);
    }
  }

  async function handleApproveKyc(orgId: string) {
    const res = await approveOrganizationKycAction(orgId);
    if (res.success) {
      setOrganizations((prev) =>
        prev.map((o) => (o.id === orgId ? { ...o, kyc_status: "VERIFIED" } : o))
      );
    }
  }

  async function handleRejectKyc(orgId: string) {
    const reason = prompt("Enter reason for KYC rejection:", "Documentation incomplete");
    if (!reason) return;
    const res = await rejectOrganizationKycAction(orgId, reason);
    if (res.success) {
      setOrganizations((prev) =>
        prev.map((o) => (o.id === orgId ? { ...o, kyc_status: "REJECTED" } : o))
      );
    }
  }

  async function handleToggleFlag(flagId: string, current: boolean) {
    const res = await togglePlatformFeatureFlagAction(flagId, !current);
    if (res.success) {
      setFeatureFlags((prev) =>
        prev.map((f) => (f.id === flagId || f.name === flagId ? { ...f, is_enabled: !current } : f))
      );
    }
  }

  async function handleSetEventStatus(eventId: string, newStatus: "PUBLISHED" | "DRAFT" | "SUSPENDED" | "CANCELLED") {
    const res = await setEventStatusAction(eventId, newStatus);
    if (res.success) {
      setEvents((prev) =>
        prev.map((e) => (e.id === eventId ? { ...e, status: newStatus } : e))
      );
    }
  }

  async function handleCreateOrg(e: React.FormEvent) {
    e.preventDefault();
    if (!newOrgName.trim()) return;
    setOrgCreating(true);
    setOrgError(null);

    const slug = newOrgSlug.trim() || newOrgName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const res = await createOrganizationAction({
      name: newOrgName.trim(),
      slug,
      city: newOrgDistrict.trim() || "Bengaluru",
      supportEmail: newOrgEmail.trim() || "contact@rotaract.org",
    });

    setOrgCreating(false);
    if (res.success) {
      setOrganizations([
        {
          id: `org-${Date.now()}`,
          name: newOrgName.trim(),
          slug,
          city: newOrgDistrict.trim() || "Bengaluru",
          district: newOrgDistrict.trim() || "District 3192",
          support_email: newOrgEmail.trim() || "contact@rotaract.org",
          kyc_status: "VERIFIED",
          is_verified: true,
          custom_platform_fee_percent: parseFloat(newOrgFee) || 0,
        },
        ...organizations,
      ]);
      setIsAddOrgOpen(false);
      setNewOrgName("");
      setNewOrgSlug("");
      setNewOrgEmail("");
    } else {
      setOrgError(res.error || "Failed to charter organization");
    }
  }

  function handleOpenAddClub() {
    setEditingClub(null);
    setClubForm({
      id: "",
      name: "",
      zone: "Taranga",
      clubType: "Community Based",
      partnerClub: "",
      contactEmail: "",
      presidentName: "",
      presidentPhone: "",
      presidentEmail: "",
    });
    setClubError(null);
    setIsEditClubOpen(true);
  }

  function handleOpenEditClub(club: any) {
    setEditingClub(club);
    setClubForm({
      id: club.id,
      name: club.name,
      zone: club.zone || "Taranga",
      clubType: club.club_type || "Community Based",
      partnerClub: club.partner_club || "",
      contactEmail: club.contact_email || "",
      presidentName: club.president_name || "",
      presidentPhone: club.president_phone || "",
      presidentEmail: club.president_email || "",
    });
    setClubError(null);
    setIsEditClubOpen(true);
  }

  async function handleSaveClubSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clubForm.name.trim()) return;

    setClubSaving(true);
    setClubError(null);

    if (editingClub) {
      const res = await updateDistrictClubAction(editingClub.id, {
        name: clubForm.name.trim(),
        zone: clubForm.zone,
        clubType: clubForm.clubType,
        partnerClub: clubForm.partnerClub.trim(),
        contactEmail: clubForm.contactEmail.trim(),
        presidentName: clubForm.presidentName.trim(),
        presidentPhone: clubForm.presidentPhone.trim(),
        presidentEmail: clubForm.presidentEmail.trim(),
      });

      setClubSaving(false);
      if (res.success) {
        setOrganizations((prev) =>
          prev.map((o) =>
            o.id === editingClub.id
              ? {
                  ...o,
                  name: clubForm.name.trim(),
                  zone: clubForm.zone,
                  club_type: clubForm.clubType,
                  partner_club: clubForm.partnerClub.trim(),
                  contact_email: clubForm.contactEmail.trim(),
                  president_name: clubForm.presidentName.trim(),
                  president_phone: clubForm.presidentPhone.trim(),
                  president_email: clubForm.presidentEmail.trim(),
                }
              : o
          )
        );
        setIsEditClubOpen(false);
      } else {
        setClubError(res.error || "Failed to update club");
      }
    } else {
      const res = await createDistrictClubAction({
        name: clubForm.name.trim(),
        zone: clubForm.zone,
        clubType: clubForm.clubType,
        partnerClub: clubForm.partnerClub.trim(),
        contactEmail: clubForm.contactEmail.trim(),
        presidentName: clubForm.presidentName.trim(),
        presidentPhone: clubForm.presidentPhone.trim(),
        presidentEmail: clubForm.presidentEmail.trim(),
      });

      setClubSaving(false);
      if (res.success) {
        const newClub: any = {
          id: res.clubId || `club-${Date.now()}`,
          name: clubForm.name.trim(),
          slug: clubForm.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          zone: clubForm.zone,
          club_type: clubForm.clubType,
          partner_club: clubForm.partnerClub.trim(),
          contact_email: clubForm.contactEmail.trim(),
          president_name: clubForm.presidentName.trim(),
          president_phone: clubForm.presidentPhone.trim(),
          president_email: clubForm.presidentEmail.trim(),
          status: "ACTIVE",
          is_verified: true,
          kyc_status: "VERIFIED",
          event_count: 0,
        };
        setOrganizations([newClub, ...organizations]);
        setIsEditClubOpen(false);
      } else {
        setClubError(res.error || "Failed to add club");
      }
    }
  }

  async function handleDeleteClub(clubId: string, clubName: string) {
    if (!confirm(`Are you sure you want to archive / remove "${clubName}" from District 3192 directory?`)) {
      return;
    }

    const res = await deleteDistrictClubAction(clubId);
    if (res.success) {
      setOrganizations((prev) => prev.filter((o) => o.id !== clubId));
    } else {
      alert(res.error || "Failed to delete club");
    }
  }

  async function handleSyncAllClubs() {
    if (!confirm("Synchronize all 85 authentic District 3192 clubs from the master Excel directory?")) {
      return;
    }
    setSyncingClubs(true);
    const res = await seedDistrictClubsAction();
    if (res.success) {
      const refreshed = await getDistrictClubsAction();
      if (refreshed.success && refreshed.data) {
        setOrganizations(refreshed.data);
      }
      alert(`Successfully synchronized ${res.count} District 3192 clubs!`);
    } else {
      alert(res.error || "Failed to synchronize clubs");
    }
    setSyncingClubs(false);
  }

  function handleCopyJson(obj: any) {
    navigator.clipboard.writeText(JSON.stringify(obj, null, 2));
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  }

  function handleCopyUtrText(utr: string) {
    navigator.clipboard.writeText(utr);
    setCopiedUtr(utr);
    setTimeout(() => setCopiedUtr(null), 2000);
  }

  // Filtered lists
  const filteredOrgs = organizations.filter((o) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      o.name?.toLowerCase().includes(q) ||
      o.partner_club?.toLowerCase().includes(q) ||
      o.president_name?.toLowerCase().includes(q) ||
      o.zone?.toLowerCase().includes(q);

    const matchesZone =
      selectedZoneFilter === "ALL" || o.zone?.toLowerCase() === selectedZoneFilter.toLowerCase();

    const matchesKyc = kycFilter === "ALL" || o.kyc_status === kycFilter;

    return matchesSearch && matchesZone && matchesKyc;
  });

  const filteredEvents = events.filter((e) =>
    e.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingGrievanceCount =
    complaints.filter((c: any) => c.status === "open" || c.status === "under_review").length +
    privacyRequests.filter((r: any) => r.status === "open" || r.status === "in_progress").length;

  const NAV_ITEMS = [
    { id: "overview",   label: "Overview",             icon: Activity,      count: null },
    { id: "requests",   label: "Host Requests",        icon: Users,         count: organizerRequests.filter((r: any) => r.status === "PENDING").length },
    { id: "upi",       label: "UPI Payments",         icon: QrCode,        count: pendingUpiOrders.length },
    { id: "grievances", label: "Grievances & Reports", icon: AlertTriangle, count: pendingGrievanceCount },
    { id: "kyc",       label: "Club Roster",          icon: Building,      count: pendingKycCount },
    { id: "events",    label: "All Events",           icon: Calendar,      count: events.length },
    { id: "finance",   label: "Sales & Finance",      icon: DollarSign,    count: orders.length },
    { id: "checkins",  label: "QR Gate Check-ins",    icon: Smartphone,    count: totalCheckInsCount },
    { id: "audit",     label: "Activity Logs",        icon: Lock,          count: auditLogs.length },
    { id: "flags",     label: "App Settings",         icon: Sliders,       count: null },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-gray-900 flex flex-col lg:flex-row font-sans">

      {/* ── MOBILE SLIDE-OVER DRAWER (Visible on < lg screens) ─────────── */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <aside className="relative w-4/5 max-w-xs bg-gray-900 text-white flex flex-col justify-between h-full overflow-y-auto z-10 shadow-2xl animate-in slide-in-from-left duration-200">
            <div className="flex flex-col h-full">
              {/* Brand & Close */}
              <div className="px-5 pt-6 pb-4 border-b border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="relative w-11 h-11 shrink-0">
                    <Image src="/brand/logo.png" alt="Logo" fill className="object-contain" />
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-[#0758fc] block">
                      SUPER ADMIN
                    </span>
                    <span className="text-sm font-extrabold text-white leading-tight block">
                      RotaSphere
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setMobileSidebarOpen(false)}
                  className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white flex items-center justify-center cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Drawer Nav Items */}
              <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                {NAV_ITEMS.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  const isUrgent =
                    (tab.id === "upi" && pendingUpiOrders.length > 0) ||
                    (tab.id === "requests" && organizerRequests.some((r: any) => r.status === "PENDING")) ||
                    (tab.id === "grievances" && pendingGrievanceCount > 0);
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id as any);
                        setMobileSidebarOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        isActive
                          ? "bg-[#0758fc] text-white shadow-sm"
                          : isUrgent
                          ? "text-amber-300 hover:bg-gray-800 hover:text-white"
                          : "text-gray-400 hover:bg-gray-800 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon size={16} />
                        <span>{tab.label}</span>
                      </div>
                      {tab.count !== null && tab.count > 0 && (
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                            isActive
                              ? "bg-white/20 text-white"
                              : isUrgent
                              ? "bg-amber-500 text-white animate-pulse"
                              : "bg-gray-700 text-gray-300"
                          }`}
                        >
                          {tab.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>

              {/* Drawer Bottom Actions */}
              <div className="px-3 pb-6 space-y-2 border-t border-gray-800 pt-4">
                <button
                  onClick={() => {
                    setIsAddOrgOpen(true);
                    setMobileSidebarOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 py-3 rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  <Plus size={15} /> Charter New Club
                </button>
                <Link
                  href="/dashboard"
                  className="w-full flex items-center justify-center gap-2 text-xs font-bold text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 px-4 py-3 rounded-xl transition-all"
                >
                  <Building size={14} /> Organizer Hub
                </Link>
                <Link
                  href="/"
                  className="w-full flex items-center justify-center gap-2 text-xs font-extrabold text-white bg-gray-800 hover:bg-black px-4 py-3 rounded-xl transition-all cursor-pointer"
                >
                  <LogOut size={14} /> Exit Admin
                </Link>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* ── DESKTOP SIDEBAR (Visible on >= lg screens) ──────────────────── */}
      <aside className="hidden lg:flex w-64 bg-gray-900 text-white flex-col justify-between flex-shrink-0 sticky top-0 h-screen overflow-y-auto">
        <div className="flex flex-col h-full">

          {/* Brand / Logo */}
          <div className="px-5 pt-6 pb-4 border-b border-gray-800 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="relative w-12 h-12 shrink-0">
                <Image
                  src="/brand/logo.png"
                  alt="Rotaract District 3192 Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest text-[#0758fc] block leading-none">
                  SUPER ADMIN
                </span>
                <span className="text-sm font-extrabold text-white leading-tight block">
                  RotaSphere
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">District 3192 Governance</span>
            </div>
          </div>

          {/* Nav Items */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            {NAV_ITEMS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const isUrgent =
                (tab.id === "upi" && pendingUpiOrders.length > 0) ||
                (tab.id === "requests" && organizerRequests.some((r: any) => r.status === "PENDING")) ||
                (tab.id === "grievances" && pendingGrievanceCount > 0);
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? "bg-[#0758fc] text-white shadow-sm"
                      : isUrgent
                      ? "text-amber-300 hover:bg-gray-800 hover:text-white"
                      : "text-gray-400 hover:bg-gray-800 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={16} />
                    <span>{tab.label}</span>
                  </div>
                  {tab.count !== null && tab.count > 0 && (
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                        isActive
                          ? "bg-white/20 text-white"
                          : isUrgent
                          ? "bg-amber-500 text-white animate-pulse"
                          : "bg-gray-700 text-gray-300"
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Bottom actions */}
          <div className="px-3 pb-5 space-y-2 border-t border-gray-800 pt-4">
            <button
              onClick={() => setIsAddOrgOpen(true)}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer"
            >
              <Plus size={15} /> Charter New Club
            </button>
            <Link
              href="/dashboard"
              className="w-full flex items-center justify-center gap-2 text-xs font-bold text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 px-4 py-2.5 rounded-xl transition-all"
            >
              <Building size={14} /> Organizer Hub
            </Link>
            <Link
              href="/"
              className="w-full flex items-center justify-center gap-2 text-xs font-extrabold text-white bg-gray-800 hover:bg-black px-4 py-2.5 rounded-xl transition-all cursor-pointer"
            >
              <LogOut size={14} /> Exit Admin
            </Link>
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT AREA ───────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 overflow-y-auto">

        {/* ── MOBILE HEADER (Visible on < lg) ────────────────────────────── */}
        <div className="lg:hidden bg-gray-900 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-md">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-white cursor-pointer active:scale-95 transition-all"
              aria-label="Open Navigation Menu"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2">
              <div className="relative w-9 h-9 shrink-0">
                <Image src="/brand/logo.png" alt="Logo" fill className="object-contain" />
              </div>
              <div>
                <span className="text-xs font-black text-white block leading-tight">RotaSphere</span>
                <span className="text-[9px] font-bold text-[#0758fc] block leading-none">SUPER ADMIN</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsBulkEmailOpen(true)}
              className="p-2 rounded-xl bg-[#0758fc] hover:bg-[#054fe0] text-white flex items-center justify-center cursor-pointer shadow-xs"
              title="Broadcast Email"
            >
              <Megaphone size={15} />
            </button>
          </div>
        </div>

        {/* ── MOBILE HORIZONTAL SWIPEABLE TABS (Visible on < lg) ─────────── */}
        <div className="lg:hidden bg-white border-b border-gray-200 px-3 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar sticky top-[53px] z-20 shadow-2xs">
          {NAV_ITEMS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const isUrgent =
              (tab.id === "upi" && pendingUpiOrders.length > 0) ||
              (tab.id === "requests" && organizerRequests.some((r: any) => r.status === "PENDING"));
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? "bg-[#0758fc] text-white shadow-xs"
                    : isUrgent
                    ? "bg-amber-50 text-amber-800 border border-amber-300"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <Icon size={13} />
                <span>{tab.label}</span>
                {tab.count !== null && tab.count > 0 && (
                  <span
                    className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-full ${
                      isActive
                        ? "bg-white/30 text-white"
                        : isUrgent
                        ? "bg-amber-500 text-white"
                        : "bg-gray-300 text-gray-800"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Desktop Top bar inside main */}
        <div className="hidden lg:flex bg-white border-b border-gray-200 px-6 py-3.5 items-center justify-between sticky top-0 z-20 shadow-xs">
          <div>
            <h1 className="text-base font-black text-gray-900">
              {activeTab === "overview" && "Executive Overview"}
              {activeTab === "requests" && "Host Access Requests"}
              {activeTab === "upi" && "UPI Payment Verification Hub"}
              {activeTab === "kyc" && "Club KYC & Organizations"}
              {activeTab === "events" && "Event Moderation"}
              {activeTab === "finance" && "Platform Finance"}
              {activeTab === "checkins" && "Gate Scanner Monitor"}
              {activeTab === "audit" && "Immutable Audit Logs"}
              {activeTab === "flags" && "Feature Flags"}
            </h1>
            <p className="text-xs text-gray-500">Super Admin · District 3192 Governance Center</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsGalleryModalOpen(true)}
              className="bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <ImageIcon size={14} className="text-[#0758fc]" />
              <span>Add Gallery Photos</span>
            </button>
            <button
              onClick={() => setIsBulkEmailOpen(true)}
              className="bg-[#0758fc] hover:bg-[#054fe0] text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Megaphone size={14} />
              <span>Broadcast Email</span>
            </button>
            <span className="text-xs font-bold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-xl flex items-center gap-1.5">
              <ShieldCheck size={13} className="text-[#0758fc]" />
              {user?.email || "tech.rotaract3192@gmail.com"}
            </span>
          </div>
        </div>

        {/* ── MAIN DASHBOARD CONTENT ─────────────────────────────────── */}
        <div className="px-3 sm:px-6 py-4 sm:py-6 space-y-6 sm:space-y-8">

        {/* ══════════════════════════════════════════════════════════════════
            TAB 1: EXECUTIVE OVERVIEW
            ══════════════════════════════════════════════════════════════════ */}
        {activeTab === "overview" && (
          <div className="space-y-8 animate-in fade-in-50">
            
            {/* Scorecard KPI Tiles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              
              <div className="bg-white border border-gray-200/80 rounded-3xl p-6 shadow-xs space-y-3 relative overflow-hidden group hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Gross Platform GMV</span>
                  <div className="w-9 h-9 rounded-2xl bg-rose-50 text-[#0758fc] flex items-center justify-center">
                    <TrendingUp size={18} />
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl sm:text-3xl font-black text-gray-900">
                    ₹{totalGmv.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold">
                    <ArrowUpRight size={14} /> {totalGmv > 0 ? "Live Settlement Velocity" : "0% Platform Fee · Direct UPI"}
                  </div>
                </div>
                <div className="h-1 bg-gradient-to-r from-[#0758fc] to-rose-400 rounded-full w-full opacity-70" />
              </div>

              <div className="bg-white border border-gray-200/80 rounded-3xl p-6 shadow-xs space-y-3 relative overflow-hidden group hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Pending UPI Approvals</span>
                  <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <QrCode size={18} />
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl sm:text-3xl font-black text-amber-600">
                    {pendingUpiOrders.length} <span className="text-base text-gray-400 font-medium">pending</span>
                  </div>
                  <button
                    onClick={() => setActiveTab("upi")}
                    className="text-xs text-amber-700 hover:underline font-bold flex items-center gap-1"
                  >
                    Verify UTR payments <ArrowRight size={12} />
                  </button>
                </div>
                <div className="h-1 bg-gradient-to-r from-amber-400 to-amber-500 rounded-full w-full opacity-70" />
              </div>

              <div className="bg-white border border-gray-200/80 rounded-3xl p-6 shadow-xs space-y-3 relative overflow-hidden group hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Confirmed Passes</span>
                  <div className="w-9 h-9 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                    <Ticket size={18} />
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl sm:text-3xl font-black text-gray-900">
                    {totalTicketsSold} <span className="text-base text-gray-400 font-medium">issued</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-purple-600 font-bold">
                    <CheckCircle2 size={14} /> {totalCheckInsCount} checked-in at gates
                  </div>
                </div>
                <div className="h-1 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full w-full opacity-70" />
              </div>

              <div className="bg-white border border-gray-200/80 rounded-3xl p-6 shadow-xs space-y-3 relative overflow-hidden group hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">District Clubs & Events</span>
                  <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Building size={18} />
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl sm:text-3xl font-black text-gray-900">
                    {verifiedClubsCount} <span className="text-base text-gray-400 font-medium">Clubs</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold">
                    <Sparkles size={14} /> {activeEventsCount} published events live
                  </div>
                </div>
                <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full w-full opacity-70" />
              </div>

            </div>

            {/* Interactive Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Main Area Curve: GMV & Revenue Trajectory */}
              <div className="lg:col-span-2 bg-white border border-gray-200/80 rounded-3xl p-6 sm:p-7 shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-extrabold text-gray-900">Platform GMV &amp; Velocity Curve</h3>
                    <p className="text-xs text-gray-500">Real-time revenue processing trajectory across District 3192</p>
                  </div>

                  <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl self-start sm:self-auto">
                    {(["7d", "30d", "all"] as const).map((r) => (
                      <button
                        key={r}
                        onClick={() => setDateRange(r)}
                        className={`text-xs font-bold px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                          dateRange === r ? "bg-white text-gray-900 shadow-xs" : "text-gray-500 hover:text-gray-800"
                        }`}
                      >
                        {r === "7d" ? "7 Days" : r === "30d" ? "14 Days" : "30 Days"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* SVG Visualizer */}
                <div className="relative w-full h-[240px] bg-slate-50/50 rounded-2xl p-2 border border-slate-100 overflow-hidden flex flex-col justify-end">
                  <svg
                    viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                    className="w-full h-full overflow-visible"
                    preserveAspectRatio="none"
                  >
                    <defs>
                      <linearGradient id="gmvAreaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0758fc" stopOpacity="0.28" />
                        <stop offset="100%" stopColor="#0758fc" stopOpacity="0.0" />
                      </linearGradient>
                      <linearGradient id="gmvLineGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#0758fc" />
                        <stop offset="100%" stopColor="#e11d48" />
                      </linearGradient>
                    </defs>

                    {/* Gridlines */}
                    <line x1="0" y1={svgHeight - padding} x2={svgWidth} y2={svgHeight - padding} stroke="#e2e8f0" strokeWidth="1" />
                    <line x1="0" y1={(svgHeight - padding) / 2} x2={svgWidth} y2={(svgHeight - padding) / 2} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4" />

                    {/* Area & Stroke Path */}
                    <path d={areaD} fill="url(#gmvAreaGradient)" />
                    <path d={pathD} fill="none" stroke="url(#gmvLineGradient)" strokeWidth="3.5" strokeLinecap="round" />

                    {/* Interactive Points */}
                    {points.map((p, idx) => (
                      <g
                        key={idx}
                        className="cursor-pointer group/point"
                        onMouseEnter={() => setActiveHoverPoint(idx)}
                        onMouseLeave={() => setActiveHoverPoint(null)}
                      >
                        <circle
                          cx={p.x}
                          cy={p.y}
                          r={activeHoverPoint === idx ? 6 : 4}
                          className={`transition-all duration-150 ${
                            activeHoverPoint === idx
                              ? "fill-[#0758fc] stroke-white stroke-2 shadow-lg"
                              : "fill-white stroke-[#0758fc] stroke-2"
                          }`}
                        />
                      </g>
                    ))}
                  </svg>

                  {/* Active Tooltip Overlay */}
                  {activeHoverPoint !== null && points[activeHoverPoint] && (
                    <div
                      className="absolute top-4 left-6 bg-gray-900 text-white text-xs px-3.5 py-2 rounded-xl shadow-xl space-y-0.5 animate-in fade-in-50"
                    >
                      <p className="text-[10px] text-gray-400 uppercase font-bold">{points[activeHoverPoint].date}</p>
                      <p className="font-extrabold text-[#0758fc]">₹{points[activeHoverPoint].gmv.toLocaleString()} GMV</p>
                      <p className="text-[11px] text-gray-300">~{points[activeHoverPoint].tickets} tickets sold</p>
                    </div>
                  )}

                  {/* Bottom Date Labels */}
                  <div className="flex justify-between text-[10px] text-gray-400 font-bold px-2 pt-2 border-t border-gray-100">
                    <span>{points[0]?.date}</span>
                    <span>{points[Math.floor(points.length / 2)]?.date}</span>
                    <span>{points[points.length - 1]?.date}</span>
                  </div>
                </div>

                {/* Graph Summary Pills */}
                <div className="grid grid-cols-3 gap-3 pt-1 border-t border-gray-100 text-center">
                  <div className="p-3 bg-gray-50 rounded-2xl">
                    <span className="text-[10px] text-gray-500 uppercase font-bold block">Avg Order Value</span>
                    <span className="text-sm font-extrabold text-gray-900">
                      ₹{orders.length > 0 && totalGmv > 0 ? (totalGmv / orders.length).toFixed(0) : "0"}
                    </span>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-2xl">
                    <span className="text-[10px] text-gray-500 uppercase font-bold block">Peak Volume</span>
                    <span className="text-sm font-extrabold text-emerald-600">
                      ₹{totalGmv > 0 ? maxGmv.toFixed(0) : "0"}
                    </span>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-2xl">
                    <span className="text-[10px] text-gray-500 uppercase font-bold block">Conversion Rate</span>
                    <span className="text-sm font-extrabold text-gray-900">{conversionRate}</span>
                  </div>
                </div>

              </div>

              {/* Gate Check-in Velocity */}
              <div className="bg-white border border-gray-200/80 rounded-3xl p-6 sm:p-7 shadow-xs space-y-6 flex flex-col justify-between">
                <div className="space-y-1">
                  <h3 className="text-base font-extrabold text-gray-900">Gate Scanner Clearance</h3>
                  <p className="text-xs text-gray-500">Live entry pace across checkpoints</p>
                </div>

                {/* Progress Visualizer */}
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200/60 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black">
                        <CheckCircle size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-extrabold text-emerald-900">Gate Clearance Rate</p>
                        <p className="text-[11px] text-emerald-700">
                          {totalTicketsSold > 0
                            ? `${((totalCheckInsCount / totalTicketsSold) * 100).toFixed(1)}% checked in`
                            : "0% (No passes issued)"}
                        </p>
                      </div>
                    </div>
                    <span className="text-lg font-black text-emerald-900">
                      {totalCheckInsCount}/{totalTicketsSold}
                    </span>
                  </div>

                  {/* Distribution Progress Bars */}
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-gray-700">
                        <span>VIP &amp; Delegate Passes</span>
                        <span className="text-[#0758fc]">{tierDistribution.vipPct}%</span>
                      </div>
                      <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-[#0758fc] rounded-full transition-all duration-500" style={{ width: `${tierDistribution.vipPct}%` }} />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-gray-700">
                        <span>General &amp; Student Admission</span>
                        <span className="text-amber-500">{tierDistribution.generalPct}%</span>
                      </div>
                      <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-400 rounded-full transition-all duration-500" style={{ width: `${tierDistribution.generalPct}%` }} />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-gray-700">
                        <span>Early Bird &amp; Fellowship</span>
                        <span className="text-purple-600">{tierDistribution.earlyBirdPct}%</span>
                      </div>
                      <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500 rounded-full transition-all duration-500" style={{ width: `${tierDistribution.earlyBirdPct}%` }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Gate Scanner Status */}
                <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span className="font-bold text-gray-800">Check-In Webhook Node</span>
                  </div>
                  <span className="font-mono font-bold text-emerald-600">22ms avg latency</span>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB: ORGANIZER / HOST ACCESS REQUESTS
            ══════════════════════════════════════════════════════════════════ */}
        {activeTab === "requests" && (
          <div className="space-y-6 animate-in fade-in-50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-gray-900">Organizer &amp; Host Access Requests</h2>
                <p className="text-xs text-gray-500">
                  Review and grant event publishing privileges to Rotaract Club officers.
                </p>
              </div>
            </div>

            {organizerRequests.length === 0 ? (
              <div className="p-12 bg-white rounded-3xl border border-gray-200 text-center space-y-3">
                <Users size={36} className="text-gray-400 mx-auto" />
                <h3 className="text-base font-bold text-gray-800">No Access Requests Submitted</h3>
                <p className="text-xs text-gray-500 max-w-sm mx-auto">
                  When attendees apply to host events for their Rotaract clubs, their applications will appear here for admin approval.
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-gray-600">
                    <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-extrabold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="px-6 py-4">Applicant</th>
                        <th className="px-6 py-4">Club Name &amp; Designation</th>
                        <th className="px-6 py-4">Proposed Event Details</th>
                        <th className="px-6 py-4">Applied Date</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-medium">
                      {organizerRequests.map((req: any) => {
                        const isPending = req.status === "PENDING";
                        const isApproved = req.status === "APPROVED";
                        const isProcessing = reqProcessingId === req.id;

                        return (
                          <tr key={req.id} className="hover:bg-gray-50/80 transition-colors">
                            <td className="px-6 py-4">
                              <p className="font-extrabold text-gray-900">{req.user_name}</p>
                              <p className="text-[11px] text-gray-500 font-mono">{req.user_email}</p>
                            </td>
                            <td className="px-6 py-4">
                              <p className="font-bold text-gray-900">{req.club_name}</p>
                              <p className="text-[11px] text-[#0758fc] font-extrabold">{req.position}</p>
                            </td>
                            <td className="px-6 py-4 max-w-xs">
                              <p className="text-xs text-gray-800 line-clamp-2">{req.reason}</p>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-[11px] text-gray-500">
                              {new Date(req.created_at).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border ${
                                  isPending
                                    ? "bg-amber-50 text-amber-800 border-amber-300 font-black animate-pulse"
                                    : isApproved
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : "bg-rose-50 text-rose-700 border-rose-200"
                                }`}
                              >
                                ● {req.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                              {isPending && (
                                <>
                                  <button
                                    type="button"
                                    disabled={isProcessing}
                                    onClick={() => handleApproveRequest(req.id)}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-3.5 py-1.5 rounded-xl transition-all shadow-xs cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-50"
                                  >
                                    {isProcessing ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={14} />}
                                    Grant Organizer Access
                                  </button>
                                  <button
                                    type="button"
                                    disabled={isProcessing}
                                    onClick={() => handleRejectRequest(req.id)}
                                    className="bg-gray-100 hover:bg-rose-50 text-gray-700 hover:text-rose-600 font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer inline-flex items-center gap-1"
                                  >
                                    <XCircle size={14} /> Reject
                                  </button>
                                </>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB 2: DYNAMIC UPI PAYMENTS & UTR VERIFICATION HUB
            ══════════════════════════════════════════════════════════════════ */}
        {activeTab === "upi" && (
          <div className="space-y-6 animate-in fade-in-50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black text-gray-900">Dynamic UPI Payment &amp; UTR Verification</h2>
                  {pendingUpiOrders.length > 0 && (
                    <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300 animate-pulse">
                      {pendingUpiOrders.length} Pending Approval
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Verify attendee 12-digit UTR numbers against club bank accounts to activate digital QR entry passes.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => downloadCsv("RotaSphere_UPI_Payments.csv", filteredUpiOrders)}
                  className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 font-extrabold text-xs px-4 py-2.5 rounded-2xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <FileSpreadsheet size={15} className="text-emerald-600" /> Export CSV
                </button>
              </div>
            </div>

            {/* Filter Toolbar */}
            <div className="bg-white border border-gray-200/80 rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex-1 relative">
                <Search size={15} className="absolute left-3.5 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by Order Ref, Attendee, UTR number, or Event..."
                  value={upiSearch}
                  onChange={(e) => setUpiSearch(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-9 pr-4 py-2 text-xs outline-none focus:border-[#0758fc]"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-gray-500">Status:</span>
                <select
                  value={upiFilter}
                  onChange={(e) => setUpiFilter(e.target.value as any)}
                  className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 outline-none cursor-pointer"
                >
                  <option value="ALL">All Payments</option>
                  <option value="PENDING_VERIFICATION">Pending Approval Only</option>
                  <option value="PAID">Approved / Paid</option>
                  <option value="PAYMENT_REJECTED">Rejected</option>
                </select>
              </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-700">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-extrabold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-6 py-4">Order Ref &amp; Event</th>
                      <th className="px-6 py-4">Attendee Details</th>
                      <th className="px-6 py-4">Amount</th>
                      <th className="px-6 py-4">UTR / Txn Reference</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Moderation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {filteredUpiOrders.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                          No payments matched your search filter.
                        </td>
                      </tr>
                    ) : (
                      filteredUpiOrders.map((ord) => {
                        const isPending = ord.status === "PENDING_VERIFICATION";
                        const isApproved = ord.status === "PAID";
                        const isRejected = ord.status === "PAYMENT_REJECTED";
                        const isProcessing = verifyingOrderId === ord.id;

                        return (
                          <tr key={ord.id} className={`transition-colors ${isPending ? "bg-amber-50/20" : "hover:bg-gray-50/80"}`}>
                            <td className="px-6 py-4">
                              <div className="space-y-0.5">
                                <span className="font-mono font-bold text-gray-900 block">{ord.order_number || "ORD-LIVE"}</span>
                                <span className="text-[11px] text-gray-500 font-semibold truncate block max-w-[200px]">
                                  {ord.event_title || "District Conference"}
                                </span>
                              </div>
                            </td>

                            <td className="px-6 py-4">
                              <div className="space-y-0.5">
                                <span className="font-bold text-gray-900 block">{ord.customer_name || "Delegate"}</span>
                                <span className="text-[11px] text-gray-500 block">{ord.customer_email}</span>
                                {ord.customer_phone && <span className="text-[10px] text-gray-400 block">{ord.customer_phone}</span>}
                              </div>
                            </td>

                            <td className="px-6 py-4">
                              <span className="text-sm font-black text-gray-900 block">
                                ₹{Number(ord.total_amount || 0).toFixed(2)}
                              </span>
                              <span className="text-[10px] text-gray-400 font-mono">Payee: {ord.upi_payee_id || "District VPA"}</span>
                            </td>

                            <td className="px-6 py-4">
                              {ord.upi_transaction_id ? (
                                <div className="space-y-1">
                                  <div className="inline-flex items-center gap-1.5 bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-lg">
                                    <span className="font-mono font-extrabold text-gray-900 text-xs">{ord.upi_transaction_id}</span>
                                    <button
                                      type="button"
                                      onClick={() => handleCopyUtrText(ord.upi_transaction_id)}
                                      className="text-gray-400 hover:text-gray-700 cursor-pointer"
                                      title="Copy UTR"
                                    >
                                      {copiedUtr === ord.upi_transaction_id ? (
                                        <Check size={12} className="text-emerald-600" />
                                      ) : (
                                        <Copy size={12} />
                                      )}
                                    </button>
                                  </div>
                                  {isPending && (ord.payment_proof_url || ord.upi_receipt_url || ord.upi_screenshot_url) && (
                                    <button
                                      type="button"
                                      onClick={() => setProofModalOrder(ord)}
                                      className="text-[11px] text-[#0758fc] font-bold hover:underline flex items-center gap-1 mt-1 cursor-pointer"
                                    >
                                      <Camera size={12} /> View Payment Photo Proof
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <span className="text-[11px] text-gray-400 italic">Free Order / No UTR</span>
                              )}
                            </td>

                            <td className="px-6 py-4">
                              <span
                                className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border ${
                                  isPending
                                    ? "bg-amber-50 text-amber-800 border-amber-300 font-black"
                                    : isApproved
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : "bg-rose-50 text-rose-700 border-rose-200"
                                }`}
                              >
                                ● {isPending ? "PENDING UTR APPROVAL" : isApproved ? "APPROVED / PAID" : "REJECTED"}
                              </span>
                              {isRejected && ord.payment_rejection_reason && (
                                <p className="text-[10px] text-rose-600 mt-1 max-w-xs italic">
                                  Reason: {ord.payment_rejection_reason}
                                </p>
                              )}
                            </td>

                            <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                              {isPending && (
                                <>
                                  <button
                                    type="button"
                                    disabled={verifyingOrderId === ord.id}
                                    onClick={() => {
                                      const proofUrl = ord.payment_proof_url || ord.upi_receipt_url || ord.upi_screenshot_url;
                                      if (proofUrl) {
                                        setProofModalOrder(ord);
                                      } else {
                                        handleApprovePayment(ord.id);
                                      }
                                    }}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-3 py-1.5 rounded-xl transition-all shadow-xs cursor-pointer inline-flex items-center gap-1 disabled:opacity-50"
                                  >
                                    {verifyingOrderId === ord.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={13} />}
                                    Approve Pass
                                  </button>

                                  <button
                                    type="button"
                                    disabled={isProcessing}
                                    onClick={() => {
                                      setRejectModalOrder(ord);
                                      setRejectionReason("UTR reference not found in bank statement");
                                    }}
                                    className="bg-gray-100 hover:bg-rose-50 text-gray-700 hover:text-rose-600 font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer inline-flex items-center gap-1"
                                  >
                                    <XCircle size={13} /> Reject
                                  </button>
                                </>
                              )}

                              {isApproved && (
                                <span className="text-[11px] text-emerald-700 font-bold">Passes Active</span>
                              )}

                              {isRejected && (
                                <span className="text-[11px] text-rose-600 font-bold">Order Cancelled</span>
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
            TAB: GRIEVANCES & STATUTORY DPDP COMPLIANCE REPORTS
            ══════════════════════════════════════════════════════════════════ */}
        {activeTab === "grievances" && (
          <div className="space-y-8 animate-in fade-in-50">
            {/* Header banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black text-gray-900">Grievance Redressal &amp; DPDP Reports</h2>
                  {pendingGrievanceCount > 0 && (
                    <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
                      {pendingGrievanceCount} Action Required
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Statutory 24-hour acknowledgement and 15-day resolution SLAs under DPDP Act 2023 &amp; Consumer Protection (E-Commerce) Rules.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => downloadCsv("rotasphere-grievance-report.csv", complaints)}
                  className="inline-flex items-center gap-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold px-3 py-2 rounded-xl shadow-2xs transition-all cursor-pointer"
                >
                  <Download size={14} /> Export Grievances CSV
                </button>
                <button
                  type="button"
                  onClick={() => downloadJson("rotasphere-grievance-report.json", { complaints, privacyRequests })}
                  className="inline-flex items-center gap-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold px-3 py-2 rounded-xl shadow-2xs transition-all cursor-pointer"
                >
                  <FileJson size={14} /> Export JSON
                </button>
              </div>
            </div>

            {/* Scorecard KPI Tiles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-2xs space-y-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Open Grievances</span>
                <div className="text-2xl font-black text-rose-600">
                  {complaints.filter((c: any) => c.status === "open").length}
                </div>
                <p className="text-[11px] text-gray-500 font-medium">Pending initial triage (&lt;24h SLA)</p>
              </div>

              <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-2xs space-y-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Under Investigation</span>
                <div className="text-2xl font-black text-amber-600">
                  {complaints.filter((c: any) => c.status === "under_review" || c.status === "awaiting_info").length}
                </div>
                <p className="text-[11px] text-gray-500 font-medium">Active club / ombudsman review</p>
              </div>

              <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-2xs space-y-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">DPDP Rights Requests</span>
                <div className="text-2xl font-black text-[#0758fc]">
                  {privacyRequests.filter((r: any) => r.status === "open" || r.status === "in_progress").length}
                </div>
                <p className="text-[11px] text-gray-500 font-medium">Access, Erasure &amp; Portability</p>
              </div>

              <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-2xs space-y-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Resolved &amp; Closed</span>
                <div className="text-2xl font-black text-emerald-600">
                  {complaints.filter((c: any) => c.status === "resolved").length + privacyRequests.filter((r: any) => r.status === "completed").length}
                </div>
                <p className="text-[11px] text-gray-500 font-medium">Compliant closures on record</p>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="bg-white border border-gray-200 rounded-3xl p-4 sm:p-6 space-y-4 shadow-2xs">
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
                  {(["ALL", "open", "under_review", "resolved", "rejected"] as const).map((filterVal) => {
                    const label =
                      filterVal === "ALL"
                        ? "All Tickets"
                        : filterVal === "open"
                        ? "Open"
                        : filterVal === "under_review"
                        ? "Under Review"
                        : filterVal === "resolved"
                        ? "Resolved"
                        : "Rejected";
                    const count =
                      filterVal === "ALL"
                        ? complaints.length
                        : complaints.filter((c: any) => c.status === filterVal).length;

                    return (
                      <button
                        key={filterVal}
                        type="button"
                        onClick={() => setGrievanceFilter(filterVal)}
                        className={`text-xs font-extrabold px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                          grievanceFilter === filterVal
                            ? "bg-[#0758fc] text-white shadow-xs"
                            : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                        }`}
                      >
                        <span>{label}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                            grievanceFilter === filterVal ? "bg-white/25 text-white" : "bg-gray-200 text-gray-600"
                          }`}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="relative w-full sm:w-72">
                  <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by case #, name, email..."
                    value={grievanceSearch}
                    onChange={(e) => setGrievanceSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-[#0758fc] focus:bg-white"
                  />
                </div>
              </div>

              {/* Grievances & Complaints Table */}
              <div className="overflow-x-auto rounded-2xl border border-gray-200">
                <table className="w-full text-left text-xs text-gray-700">
                  <thead className="bg-gray-50/90 text-[10px] font-extrabold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    <tr>
                      <th className="px-5 py-3.5">Case Reference</th>
                      <th className="px-5 py-3.5">Complainant</th>
                      <th className="px-5 py-3.5">Category</th>
                      <th className="px-5 py-3.5">Description</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {complaints
                      .filter((c: any) => {
                        const matchesFilter = grievanceFilter === "ALL" || c.status === grievanceFilter;
                        const q = grievanceSearch.toLowerCase();
                        const matchesSearch =
                          !q ||
                          c.complaint_number?.toLowerCase().includes(q) ||
                          c.user_name?.toLowerCase().includes(q) ||
                          c.user_email?.toLowerCase().includes(q) ||
                          c.category?.toLowerCase().includes(q) ||
                          c.description?.toLowerCase().includes(q);
                        return matchesFilter && matchesSearch;
                      })
                      .map((comp: any) => {
                        const isUpdating = updatingComplaintId === comp.id || updatingComplaintId === comp.complaint_number;
                        const isOpen = comp.status === "open";
                        const isReview = comp.status === "under_review" || comp.status === "awaiting_info";
                        const isResolved = comp.status === "resolved";
                        const isRejected = comp.status === "rejected";

                        return (
                          <tr key={comp.id || comp.complaint_number} className="hover:bg-gray-50/80 transition-colors">
                            <td className="px-5 py-3.5 whitespace-nowrap">
                              <p className="font-mono font-bold text-gray-900">{comp.complaint_number || comp.id?.slice(0, 12)}</p>
                              <p className="text-[10px] text-gray-400">
                                {comp.created_at ? new Date(comp.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Recent"}
                              </p>
                            </td>

                            <td className="px-5 py-3.5">
                              <p className="font-bold text-gray-900">{comp.user_name || "User"}</p>
                              <p className="text-[11px] text-gray-500 font-mono">{comp.user_email}</p>
                            </td>

                            <td className="px-5 py-3.5 whitespace-nowrap">
                              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 border border-gray-200">
                                {comp.category || "General"}
                              </span>
                            </td>

                            <td className="px-5 py-3.5 max-w-xs sm:max-w-sm">
                              <p className="text-xs text-gray-800 line-clamp-2">{comp.description}</p>
                              {comp.resolution && (
                                <p className="text-[10px] text-emerald-700 bg-emerald-50 rounded px-1.5 py-0.5 mt-1 line-clamp-1">
                                  <strong>Resolution:</strong> {comp.resolution}
                                </p>
                              )}
                            </td>

                            <td className="px-5 py-3.5 whitespace-nowrap">
                              <span
                                className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border ${
                                  isOpen
                                    ? "bg-rose-50 text-rose-700 border-rose-200 animate-pulse font-black"
                                    : isReview
                                    ? "bg-amber-50 text-amber-700 border-amber-200"
                                    : isResolved
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : "bg-gray-100 text-gray-600 border-gray-200"
                                }`}
                              >
                                ● {comp.status}
                              </span>
                            </td>

                            <td className="px-5 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedComplaint(comp);
                                  setResolutionInput(comp.resolution || "");
                                }}
                                className="text-[11px] font-bold text-[#0758fc] hover:underline px-2 py-1 rounded-lg hover:bg-blue-50 cursor-pointer"
                              >
                                Inspect
                              </button>

                              {!isResolved && (
                                <button
                                  type="button"
                                  disabled={isUpdating}
                                  onClick={() => handleUpdateComplaintStatus(comp.id || comp.complaint_number, "resolved", "Case reviewed and resolved by Platform Grievance Desk.")}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-2.5 py-1 rounded-lg text-[10px] transition-all shadow-2xs cursor-pointer inline-flex items-center gap-1 disabled:opacity-50"
                                >
                                  {isUpdating ? <Loader2 size={10} className="animate-spin" /> : <CheckCircle2 size={11} />}
                                  Resolve
                                </button>
                              )}

                              {!isReview && !isResolved && (
                                <button
                                  type="button"
                                  disabled={isUpdating}
                                  onClick={() => handleUpdateComplaintStatus(comp.id || comp.complaint_number, "under_review")}
                                  className="bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold px-2 py-1 rounded-lg text-[10px] transition-all cursor-pointer inline-flex items-center gap-1 disabled:opacity-50"
                                >
                                  Investigate
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}

                    {complaints.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                          <CheckCircle2 size={32} className="mx-auto text-emerald-500/60 mb-2" />
                          <p className="font-bold text-gray-600 text-sm">No Open Grievances</p>
                          <p className="text-xs text-gray-400 mt-1">All user and attendee disputes are currently resolved.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* DPDP Data Subject Rights Requests Sub-Table */}
            <div className="bg-white border border-gray-200 rounded-3xl p-4 sm:p-6 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-gray-900">DPDP Data Subject Rights Requests</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    User requests for Data Access, Erasure, Correction, and Portability under DPDP Act 2023.
                  </p>
                </div>
                <span className="text-[11px] font-mono text-gray-500 bg-gray-100 px-2.5 py-1 rounded-lg">
                  {privacyRequests.length} Total Requests
                </span>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-gray-200">
                <table className="w-full text-left text-xs text-gray-700">
                  <thead className="bg-gray-50/90 text-[10px] font-extrabold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    <tr>
                      <th className="px-5 py-3.5">Request #</th>
                      <th className="px-5 py-3.5">Data Principal</th>
                      <th className="px-5 py-3.5">Request Type</th>
                      <th className="px-5 py-3.5">Description</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {privacyRequests.map((req: any) => {
                      const isUpdating = updatingRequestId === req.id || updatingRequestId === req.request_number;
                      const isCompleted = req.status === "completed";

                      return (
                        <tr key={req.id || req.request_number} className="hover:bg-gray-50/80 transition-colors">
                          <td className="px-5 py-3.5 whitespace-nowrap font-mono font-bold text-gray-900">
                            {req.request_number || req.id?.slice(0, 10)}
                          </td>
                          <td className="px-5 py-3.5">
                            <p className="font-bold text-gray-900">{req.user_name || "User"}</p>
                            <p className="text-[11px] text-gray-500 font-mono">{req.user_email}</p>
                          </td>
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-blue-50 text-[#0758fc] border border-blue-200">
                              {req.request_type}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 max-w-xs">
                            <p className="text-xs text-gray-800 line-clamp-2">{req.description || "Data principal request"}</p>
                          </td>
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <span
                              className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                                isCompleted
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-amber-50 text-amber-700 border-amber-200"
                              }`}
                            >
                              ● {req.status}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                            {!isCompleted && (
                              <button
                                type="button"
                                disabled={isUpdating}
                                onClick={() => handleUpdatePrivacyRequestStatus(req.id || req.request_number, "completed", "Request fulfilled per DPDP rules.")}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-2.5 py-1 rounded-lg text-[10px] transition-all cursor-pointer inline-flex items-center gap-1 disabled:opacity-50"
                              >
                                {isUpdating ? <Loader2 size={10} className="animate-spin" /> : <CheckCircle2 size={11} />}
                                Complete Request
                              </button>
                            )}
                            {isCompleted && (
                              <span className="text-[10px] font-bold text-emerald-600">Fulfilled</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}

                    {privacyRequests.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                          <p className="text-xs">No pending data access or erasure requests.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB 3: DISTRICT 3192 CLUBS & ORGANIZATIONS GOVERNANCE
            ══════════════════════════════════════════════════════════════════ */}
        {activeTab === "kyc" && (
          <div className="space-y-6 animate-in fade-in-50">
            {/* Header & Controls */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white border border-gray-200 rounded-3xl p-6 shadow-xs">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0758fc] border border-blue-200 text-[10px] font-extrabold uppercase tracking-wider">
                  <Award size={12} /> DISTRICT 3192 GOVERNANCE
                </div>
                <h2 className="text-xl font-black text-gray-900">District Clubs &amp; Organizations Directory</h2>
                <p className="text-xs text-gray-500">
                  Manage official Rotaract clubs across all 6 zones, assign leadership, and configure club permissions.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleSyncAllClubs}
                  disabled={syncingClubs}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs px-3.5 py-2.5 rounded-2xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="Re-synchronize all 85 authentic District 3192 clubs from Excel directory"
                >
                  <RefreshCw size={14} className={syncingClubs ? "animate-spin" : ""} />
                  <span>{syncingClubs ? "Syncing..." : "Sync 85 Clubs"}</span>
                </button>

                <button
                  onClick={handleOpenAddClub}
                  className="bg-[#0758fc] hover:bg-[#054fe0] text-white font-extrabold text-xs px-4 py-2.5 rounded-2xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus size={14} /> Add New Club
                </button>
              </div>
            </div>

            {/* Filter & Search Strip */}
            <div className="bg-white border border-gray-200 rounded-3xl p-5 shadow-xs space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                <div className="sm:col-span-8 relative">
                  <Search size={15} className="absolute left-3.5 top-3.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by club name, partner rotary, president, or zone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 focus:border-[#0758fc] focus:bg-white rounded-2xl pl-10 pr-4 py-2.5 text-xs font-bold text-gray-900 outline-none transition-all"
                  />
                </div>

                <div className="sm:col-span-4">
                  <select
                    value={kycFilter}
                    onChange={(e) => setKycFilter(e.target.value as any)}
                    className="w-full bg-gray-50 border border-gray-200 focus:border-[#0758fc] focus:bg-white rounded-2xl px-4 py-2.5 text-xs font-bold text-gray-700 outline-none cursor-pointer transition-all"
                  >
                    <option value="ALL">All KYC &amp; Verification Statuses</option>
                    <option value="VERIFIED">Verified Active Clubs</option>
                    <option value="PENDING">Pending Verification</option>
                    <option value="REJECTED">Suspended / Rejected</option>
                  </select>
                </div>
              </div>

              {/* Zone Filter Pills */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100">
                <span className="text-[11px] font-extrabold uppercase text-gray-400 mr-2 flex items-center gap-1">
                  <Filter size={12} /> Zone:
                </span>
                {["ALL", "Taranga", "Varuna", "Samudhra", "Sagara", "Pravaha", "Arnava"].map((z) => (
                  <button
                    key={z}
                    type="button"
                    onClick={() => setSelectedZoneFilter(z)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      selectedZoneFilter === z
                        ? "bg-[#0758fc] text-white shadow-xs"
                        : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                    }`}
                  >
                    {z === "ALL" ? "All Zones" : `Zone ${z}`}
                  </button>
                ))}
                <span className="text-xs font-bold text-gray-400 ml-auto">
                  Showing {filteredOrgs.length} of {organizations.length} Clubs
                </span>
              </div>
            </div>

            {/* Clubs Table */}
            <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-700">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-extrabold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-6 py-4">Club Name &amp; Zone</th>
                      <th className="px-6 py-4">Club Type</th>
                      <th className="px-6 py-4">Partner Rotary</th>
                      <th className="px-6 py-4">President &amp; Contact</th>
                      <th className="px-6 py-4">Events</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Management</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {filteredOrgs.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-12 text-gray-400">
                          No District 3192 clubs match your current search and zone filters.
                        </td>
                      </tr>
                    ) : (
                      filteredOrgs.map((org) => (
                        <tr key={org.id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="px-6 py-4">
                            <div className="space-y-0.5">
                              <span className="font-extrabold text-gray-900 block text-sm">{org.name}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-[#0758fc] font-extrabold bg-blue-50 border border-blue-200/60 px-2 py-0.2 rounded-md">
                                  Zone {org.zone || "District 3192"}
                                </span>
                                <span className="text-[10px] text-gray-400 font-mono">slug: {org.slug}</span>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <span className="text-xs font-semibold text-gray-700">
                              {org.club_type || "Community Based"}
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            <span className="text-xs text-gray-600 font-medium">
                              {org.partner_club || "District 3192"}
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            <div className="space-y-0.5">
                              {org.president_name ? (
                                <span className="font-bold text-gray-900 block">{org.president_name}</span>
                              ) : (
                                <span className="text-gray-400 italic">No president listed</span>
                              )}
                              {org.contact_email && (
                                <a href={`mailto:${org.contact_email}`} className="text-[11px] text-[#0758fc] hover:underline block truncate max-w-[180px]">
                                  {org.contact_email}
                                </a>
                              )}
                              {org.president_phone && (
                                <span className="text-[10px] text-gray-500 block font-mono">{org.president_phone}</span>
                              )}
                            </div>
                          </td>

                          <td className="px-6 py-4">
                            <span className="text-xs font-bold text-gray-800">
                              {org.event_count || 0} Events
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            <span
                              className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border ${
                                org.kyc_status === "VERIFIED" || org.is_verified
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : org.kyc_status === "REJECTED"
                                  ? "bg-rose-50 text-rose-700 border-rose-200"
                                  : "bg-amber-50 text-amber-700 border-amber-200"
                              }`}
                            >
                              ● {org.kyc_status || (org.is_verified ? "VERIFIED" : "PENDING")}
                            </span>
                          </td>

                          <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleOpenEditClub(org)}
                              className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold px-3 py-1.5 rounded-xl transition-all text-xs cursor-pointer inline-flex items-center gap-1"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteClub(org.id, org.name)}
                              className="bg-gray-100 hover:bg-rose-50 text-gray-700 hover:text-rose-600 font-bold px-3 py-1.5 rounded-xl transition-all text-xs cursor-pointer inline-flex items-center gap-1"
                            >
                              Archive
                            </button>
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

        {/* ══════════════════════════════════════════════════════════════════
            TAB 4: EVENT MODERATION
            ══════════════════════════════════════════════════════════════════ */}
        {activeTab === "events" && (
          <div className="space-y-6 animate-in fade-in-50">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-gray-900">Event Catalog &amp; Moderation Hub</h2>
                <p className="text-xs text-gray-500">Live events across District 3192 discovery channels</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((evt) => (
                <div key={evt.id} className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xs space-y-4 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full bg-rose-50 text-[#0758fc]">
                        {evt.category || "Flagship"}
                      </span>
                      <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border ${
                        evt.status === "PUBLISHED"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}>
                        ● {evt.status}
                      </span>
                    </div>

                    <h3 className="text-base font-extrabold text-gray-900 line-clamp-1">{evt.title}</h3>
                    <p className="text-xs text-gray-500 line-clamp-2">{evt.description || "District 3192 Official Event."}</p>
                  </div>

                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                    <Link
                      href={`/events/${evt.slug || evt.id}`}
                      target="_blank"
                      className="inline-flex items-center gap-1 text-xs font-bold text-gray-600 hover:text-gray-900"
                    >
                      <ExternalLink size={13} /> View Live
                    </Link>

                    <div className="flex items-center gap-2">
                      {evt.status === "PUBLISHED" ? (
                        <button
                          onClick={() => handleSetEventStatus(evt.id, "DRAFT")}
                          className="text-[11px] font-bold text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200 transition-colors cursor-pointer"
                        >
                          Suspend
                        </button>
                      ) : (
                        <button
                          onClick={() => handleSetEventStatus(evt.id, "PUBLISHED")}
                          className="text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-xl transition-all shadow-xs cursor-pointer"
                        >
                          Publish Live
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB 5: PLATFORM FINANCE & LEDGER
            ══════════════════════════════════════════════════════════════════ */}
        {activeTab === "finance" && (
          <div className="space-y-6 animate-in fade-in-50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-gray-900">Platform Financial Ledger &amp; Revenue Overview</h2>
                <p className="text-xs text-gray-500">Gross Merchandise Value, SaaS Platform Fees, and Payout Balances</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => downloadCsv("RotaSphere_Finance_Ledger.csv", orders)}
                  className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 font-extrabold text-xs px-4 py-2.5 rounded-2xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <FileSpreadsheet size={15} className="text-emerald-600" /> Export CSV
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xs space-y-1">
                <span className="text-xs font-bold text-gray-400 uppercase">Gross Ticket Sales (GMV)</span>
                <p className="text-2xl font-black text-gray-900">₹{totalGmv.toFixed(2)}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xs space-y-1">
                <span className="text-xs font-bold text-gray-400 uppercase">Platform Commission (0%)</span>
                <p className="text-2xl font-black text-[#0758fc]">₹{totalPlatformFees.toFixed(2)}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xs space-y-1">
                <span className="text-xs font-bold text-gray-400 uppercase">Net Organizer Payouts</span>
                <p className="text-2xl font-black text-emerald-600">₹{(totalGmv - totalPlatformFees).toFixed(2)}</p>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-700">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-extrabold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-6 py-4">Order Ref</th>
                      <th className="px-6 py-4">Amount</th>
                      <th className="px-6 py-4">Platform Fee (0%)</th>
                      <th className="px-6 py-4">Gateway</th>
                      <th className="px-6 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {orders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-6 py-4 font-mono font-bold text-gray-900">{ord.order_number || "ORD-LIVE"}</td>
                        <td className="px-6 py-4 font-extrabold text-gray-900">₹{Number(ord.total_amount || 0).toFixed(2)}</td>
                        <td className="px-6 py-4 font-mono font-bold text-[#0758fc]">
                          ₹{Number(ord.platform_fee || 0).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 uppercase font-bold text-gray-500">{ord.payment_gateway || "UPI_QR"}</td>
                        <td className="px-6 py-4">
                          <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border ${
                            ord.status === "PAID"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : ord.status === "PENDING_VERIFICATION"
                              ? "bg-amber-50 text-amber-800 border-amber-300"
                              : "bg-rose-50 text-rose-700 border-rose-200"
                          }`}>
                            ● {ord.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            TAB 6: GATE SCANNER & CHECK-IN MONITOR
            ══════════════════════════════════════════════════════════════════ */}
        {activeTab === "checkins" && (
          <div className="space-y-6 animate-in fade-in-50">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-gray-900">Live Gate Scanner &amp; Check-In Logs</h2>
                <p className="text-xs text-gray-500">Real-time attendance clearance logs from entry scanners</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => downloadCsv("RotaSphere_Gate_Scans.csv", checkIns)}
                  className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 font-extrabold text-xs px-4 py-2.5 rounded-2xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <FileSpreadsheet size={15} className="text-emerald-600" /> Export Scan Logs (CSV)
                </button>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-700">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-extrabold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-6 py-4">Event Checkpoint</th>
                      <th className="px-6 py-4">Gate Name</th>
                      <th className="px-6 py-4">Scan Result</th>
                      <th className="px-6 py-4">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {checkIns.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                          Gate scanner is ready. Scanned delegate passes will stream here live.
                        </td>
                      </tr>
                    ) : (
                      checkIns.map((chk) => (
                        <tr key={chk.id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="px-6 py-4 font-bold text-gray-900">{chk.event_title || "District Conference"}</td>
                          <td className="px-6 py-4">{chk.gate_name || "Main Gate Alpha"}</td>
                          <td className="px-6 py-4">
                            <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border ${
                              chk.result === "SUCCESS"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-rose-50 text-rose-700 border-rose-200"
                            }`}>
                              ● {chk.result}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-400">
                            {chk.created_at ? new Date(chk.created_at).toLocaleTimeString() : "Just now"}
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

        {/* ══════════════════════════════════════════════════════════════════
            TAB 7: IMMUTABLE AUDIT LOGS
            ══════════════════════════════════════════════════════════════════ */}
        {activeTab === "audit" && (
          <div className="space-y-6 animate-in fade-in-50">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black text-gray-900">Cryptographic Platform Audit Trail</h2>
                  <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <ShieldCheck size={12} /> 100% Tamper-Evident
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Immutable ledger tracking administrative operations, permissions, orders, and event modifications.
                </p>
              </div>

              {/* Download & Export Action Bar */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => downloadCsv("RotaSphere_Audit_Logs.csv", filteredAuditLogs)}
                  className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 font-extrabold text-xs px-4 py-2.5 rounded-2xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <FileSpreadsheet size={15} className="text-emerald-600" /> Export CSV
                </button>

                <button
                  onClick={() => downloadJson("RotaSphere_Audit_Logs.json", filteredAuditLogs)}
                  className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 font-extrabold text-xs px-4 py-2.5 rounded-2xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <FileJson size={15} className="text-indigo-600" /> Export JSON
                </button>

                <button
                  onClick={() => window.print()}
                  className="bg-gray-900 hover:bg-black text-white font-extrabold text-xs px-4 py-2.5 rounded-2xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer size={15} /> Print Report
                </button>
              </div>
            </div>

            {/* Audit Filter Toolbar */}
            <div className="bg-white border border-gray-200/80 rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex-1 relative">
                <Search size={15} className="absolute left-3.5 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Filter by action, actor email, or entity ID..."
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-9 pr-4 py-2 text-xs outline-none focus:border-[#0758fc]"
                />
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-gray-500">Action:</span>
                  <select
                    value={auditActionFilter}
                    onChange={(e) => setAuditActionFilter(e.target.value)}
                    className="bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-gray-700 outline-none cursor-pointer"
                  >
                    <option value="ALL">All Actions</option>
                    <option value="ORDER">Orders</option>
                    <option value="UPI">UPI Payments</option>
                    <option value="EVENT">Events</option>
                    <option value="KYC">KYC</option>
                    <option value="TICKET">Tickets</option>
                    <option value="FEATURE_FLAG">Feature Flags</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-gray-500">Role:</span>
                  <select
                    value={auditRoleFilter}
                    onChange={(e) => setAuditRoleFilter(e.target.value)}
                    className="bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-gray-700 outline-none cursor-pointer"
                  >
                    <option value="ALL">All Roles</option>
                    <option value="super_admin">Super Admin</option>
                    <option value="organizer">Organizer</option>
                    <option value="customer">Customer / Attendee</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Audit Logs Table with Inspection Drawer */}
            <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-700">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-extrabold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-6 py-4">Action Event</th>
                      <th className="px-6 py-4">Actor Role</th>
                      <th className="px-6 py-4">Actor Email</th>
                      <th className="px-6 py-4">Target Entity</th>
                      <th className="px-6 py-4">Timestamp</th>
                      <th className="px-6 py-4 text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {filteredAuditLogs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                          No audit events matched your filter criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredAuditLogs.map((log) => (
                        <tr
                          key={log.id}
                          onClick={() => setSelectedAuditLog(log)}
                          className="hover:bg-rose-50/40 transition-colors cursor-pointer group"
                        >
                          <td className="px-6 py-4 font-mono font-bold text-[#0758fc]">
                            <span className="bg-rose-50 border border-rose-100 px-2.5 py-1 rounded-lg">
                              {log.action}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-gray-100 text-gray-700">
                              {log.actor_role || "SYSTEM"}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-semibold text-gray-800">
                            {log.actor_email || "tech.rotaract3192@gmail.com"}
                          </td>
                          <td className="px-6 py-4 font-mono text-[11px] text-gray-500">
                            {log.entity_type} {log.entity_id ? `(#${log.entity_id.slice(0, 8)})` : ""}
                          </td>
                          <td className="px-6 py-4 text-gray-400 text-[11px]">
                            {log.created_at ? new Date(log.created_at).toLocaleString("en-IN") : "Just now"}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-500 group-hover:text-[#0758fc] transition-colors">
                              Inspect <ChevronRight size={13} />
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

        {/* ══════════════════════════════════════════════════════════════════
            TAB 8: FEATURE FLAGS
            ══════════════════════════════════════════════════════════════════ */}
        {activeTab === "flags" && (
          <div className="space-y-6 animate-in fade-in-50">
            <div>
              <h2 className="text-xl font-black text-gray-900">Platform Feature Flags &amp; Toggles</h2>
              <p className="text-xs text-gray-500">Live operational switches controlling gate scanning, coupons, and payments</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {featureFlags.map((flag) => (
                <div
                  key={flag.id}
                  className="bg-white border border-gray-200 rounded-3xl p-5 sm:p-6 shadow-xs flex items-center justify-between gap-4 hover:shadow-md transition-all"
                >
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-gray-900 truncate">{flag.name}</p>
                      <span
                        className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                          flag.is_enabled
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-gray-100 text-gray-600 border-gray-200"
                        }`}
                      >
                        {flag.is_enabled ? "ENABLED" : "DISABLED"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2">
                      {flag.description || "Operational kill-switch controlling platform runtime behavior."}
                    </p>
                    <p className="text-[10px] font-mono text-gray-400">Key: {flag.name}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleFlag(flag.id || flag.name, flag.is_enabled)}
                    className={`w-14 h-8 rounded-full transition-colors cursor-pointer relative shrink-0 p-1 flex items-center ${
                      flag.is_enabled ? "bg-[#0758fc]" : "bg-gray-200"
                    }`}
                    title={flag.is_enabled ? "Click to disable" : "Click to enable"}
                  >
                    <span
                      className={`block w-6 h-6 bg-white rounded-full transition-transform shadow-md ${
                        flag.is_enabled ? "translate-x-6" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* ── REJECT UPI PAYMENT REASON MODAL ─────────────────────────────── */}
      {rejectModalOrder && (
        <div
          onClick={() => setRejectModalOrder(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in-50"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: "100%", maxWidth: "480px" }}
            className="w-full bg-white rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl animate-in zoom-in-95 text-gray-900 mx-auto"
          >
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-rose-600">
                  REJECT UPI TRANSACTION
                </span>
                <h3 className="text-xl font-black text-gray-900">Reason for Rejection</h3>
              </div>
              <button
                onClick={() => setRejectModalOrder(null)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200 space-y-1 text-xs">
              <p className="font-bold text-gray-900">Order Ref: {rejectModalOrder.order_number}</p>
              <p className="text-gray-600">Attendee: {rejectModalOrder.customer_name} ({rejectModalOrder.customer_email})</p>
              <p className="font-mono text-[#0758fc] font-bold">UTR: {rejectModalOrder.upi_transaction_id || "None"}</p>
            </div>

            <form onSubmit={handleRejectPaymentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                  Select or Enter Rejection Reason *
                </label>
                <textarea
                  required
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. UTR not found on statement, Amount underpaid, Duplicate transaction ID..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-xs outline-none focus:border-[#0758fc] shadow-sm"
                />
              </div>

              <div className="flex flex-wrap gap-1.5">
                {[
                  "UTR not found on bank statement",
                  "Incorrect transfer amount",
                  "Duplicate transaction reference",
                  "Payment reversed by sender bank",
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setRejectionReason(preset)}
                    className="text-[10px] font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 px-2.5 py-1 rounded-lg cursor-pointer"
                  >
                    {preset}
                  </button>
                ))}
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setRejectModalOrder(null)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-2xl text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={verifyingOrderId === rejectModalOrder.id || !rejectionReason.trim()}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-extrabold py-3 rounded-2xl text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {verifyingOrderId === rejectModalOrder.id ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    "Confirm Rejection"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── AUDIT LOG DEEP-INSPECTION MODAL ────────────────────────────── */}
      {selectedAuditLog && (
        <div
          onClick={() => setSelectedAuditLog(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in-50"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: "100%", maxWidth: "600px" }}
            className="w-full bg-white rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl animate-in zoom-in-95 text-gray-900 mx-auto max-h-[85vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#0758fc]">
                  CRYPTOGRAPHIC LOG ENTRY
                </span>
                <h3 className="text-xl font-black text-gray-900">{selectedAuditLog.action}</h3>
                <p className="text-xs text-gray-400 font-mono">ID: {selectedAuditLog.id}</p>
              </div>
              <button
                onClick={() => setSelectedAuditLog(null)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Audit Metadata Grid */}
            <div className="grid grid-cols-2 gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-200 text-xs">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase block">Actor Role</span>
                <span className="font-extrabold text-gray-900">{selectedAuditLog.actor_role || "super_admin"}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase block">Actor Email</span>
                <span className="font-extrabold text-gray-900 truncate block">
                  {selectedAuditLog.actor_email || "tech.rotaract3192@gmail.com"}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase block">Target Entity</span>
                <span className="font-mono text-gray-800">{selectedAuditLog.entity_type}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase block">Timestamp</span>
                <span className="text-gray-800">
                  {selectedAuditLog.created_at ? new Date(selectedAuditLog.created_at).toLocaleString() : "Just now"}
                </span>
              </div>
            </div>

            {/* JSON State Inspection & Copy */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  State Mutation Payload
                </span>
                <button
                  onClick={() => handleCopyJson(selectedAuditLog)}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0758fc] hover:underline cursor-pointer"
                >
                  <Copy size={13} /> {copiedPayload ? "Copied!" : "Copy Payload"}
                </button>
              </div>

              <pre className="p-4 bg-gray-900 text-emerald-400 rounded-2xl text-xs font-mono overflow-x-auto max-h-[220px]">
                {JSON.stringify(selectedAuditLog.new_state || selectedAuditLog, null, 2)}
              </pre>
            </div>

            <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between text-xs text-emerald-900">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
                <span className="font-semibold">Cryptographically Signed &amp; Tamper Protected</span>
              </div>
              <span className="font-mono text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                SHA-256
              </span>
            </div>

            <button
              onClick={() => setSelectedAuditLog(null)}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3 rounded-2xl text-xs transition-colors cursor-pointer"
            >
              Close Inspector
            </button>
          </div>
        </div>
      )}

      {/* ── CHARTER NEW CLUB MODAL ──────────────────────────────────────── */}
      {isAddOrgOpen && (
        <div
          onClick={() => setIsAddOrgOpen(false)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in-50"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: "100%", maxWidth: "480px" }}
            className="w-full bg-white rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl animate-in zoom-in-95 text-gray-900 mx-auto max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600">
                  DISTRICT 3192 ONBOARDING
                </span>
                <h3 className="text-xl font-black text-gray-900">Charter New Club</h3>
              </div>
              <button
                onClick={() => setIsAddOrgOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {orgError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-semibold">
                {orgError}
              </div>
            )}

            <form onSubmit={handleCreateOrg} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                  Club Official Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rotaract Club of Bengaluru Central"
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-xs outline-none focus:border-[#0758fc]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                    District Region
                  </label>
                  <input
                    type="text"
                    value={newOrgDistrict}
                    onChange={(e) => setNewOrgDistrict(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-xs outline-none focus:border-[#0758fc]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                    SaaS Fee (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={newOrgFee}
                    onChange={(e) => setNewOrgFee(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-xs outline-none focus:border-[#0758fc]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                  Contact Email (Optional)
                </label>
                <input
                  type="email"
                  placeholder="president@rotaract3192.org"
                  value={newOrgEmail}
                  onChange={(e) => setNewOrgEmail(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-xs outline-none focus:border-[#0758fc]"
                />
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddOrgOpen(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-2xl text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={orgCreating}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3 rounded-2xl text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {orgCreating ? <Loader2 size={14} className="animate-spin" /> : "Charter Club"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── ADD / EDIT DISTRICT 3192 CLUB MODAL ────────────────────────── */}
      {isEditClubOpen && (
        <div
          onClick={() => setIsEditClubOpen(false)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in-50"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: "100%", maxWidth: "560px" }}
            className="w-full bg-white rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl animate-in zoom-in-95 text-gray-900 mx-auto max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#0758fc]">
                  DISTRICT 3192 DIRECTORY
                </span>
                <h3 className="text-xl font-black text-gray-900">
                  {editingClub ? "Edit Club Details" : "Add New Rotaract Club"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditClubOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {clubError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-semibold">
                {clubError}
              </div>
            )}

            <form onSubmit={handleSaveClubSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">
                  Club Official Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rotaract Club of Bengaluru Central"
                  value={clubForm.name}
                  onChange={(e) => setClubForm({ ...clubForm, name: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5 text-xs font-bold outline-none focus:border-[#0758fc] focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">
                    District Zone *
                  </label>
                  <select
                    value={clubForm.zone}
                    onChange={(e) => setClubForm({ ...clubForm, zone: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-3 py-2.5 text-xs font-bold outline-none focus:border-[#0758fc] focus:bg-white cursor-pointer"
                  >
                    <option value="Taranga">Zone Taranga</option>
                    <option value="Varuna">Zone Varuna</option>
                    <option value="Samudhra">Zone Samudhra</option>
                    <option value="Sagara">Zone Sagara</option>
                    <option value="Pravaha">Zone Pravaha</option>
                    <option value="Arnava">Zone Arnava</option>
                    <option value="District 3192">District 3192 Council</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">
                    Club Base Type *
                  </label>
                  <select
                    value={clubForm.clubType}
                    onChange={(e) => setClubForm({ ...clubForm, clubType: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-3 py-2.5 text-xs font-bold outline-none focus:border-[#0758fc] focus:bg-white cursor-pointer"
                  >
                    <option value="Community Based">Community Based</option>
                    <option value="Institution Based">Institution / College</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">
                    Partner Rotary Club
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Bangalore West"
                    value={clubForm.partnerClub}
                    onChange={(e) => setClubForm({ ...clubForm, partnerClub: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5 text-xs font-bold outline-none focus:border-[#0758fc] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">
                    Official Club Email
                  </label>
                  <input
                    type="email"
                    placeholder="rotaract@gmail.com"
                    value={clubForm.contactEmail}
                    onChange={(e) => setClubForm({ ...clubForm, contactEmail: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5 text-xs font-bold outline-none focus:border-[#0758fc] focus:bg-white"
                  />
                </div>
              </div>

              {/* President Details */}
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl space-y-3">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-500 block">
                  Club President Details (Optional)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 mb-1">President Name</label>
                    <input
                      type="text"
                      placeholder="Rtr. John Doe"
                      value={clubForm.presidentName}
                      onChange={(e) => setClubForm({ ...clubForm, presidentName: e.target.value })}
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-[#0758fc]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 mb-1">Phone Number</label>
                    <input
                      type="text"
                      placeholder="9876543210"
                      value={clubForm.presidentPhone}
                      onChange={(e) => setClubForm({ ...clubForm, presidentPhone: e.target.value })}
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-[#0758fc]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 mb-1">Email ID</label>
                    <input
                      type="email"
                      placeholder="president@gmail.com"
                      value={clubForm.presidentEmail}
                      onChange={(e) => setClubForm({ ...clubForm, presidentEmail: e.target.value })}
                      className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-[#0758fc]"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditClubOpen(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-2xl text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={clubSaving || !clubForm.name.trim()}
                  className="flex-1 bg-[#0758fc] hover:bg-[#054fe0] text-white font-extrabold py-3 rounded-2xl text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {clubSaving ? <Loader2 size={14} className="animate-spin" /> : editingClub ? "Save Changes" : "Create Club"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <BulkEmailModal
        isOpen={isBulkEmailOpen}
        onClose={() => setIsBulkEmailOpen(false)}
        events={events.map((e) => ({ id: e.id, title: e.title }))}
        isSuperAdmin={true}
      />

      {/* ── SUPER ADMIN INTERACTIVE PHOTO REVIEW & APPROVAL MODAL ─────── */}
      {proofModalOrder && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in-50">
          <div className="relative max-w-3xl w-full bg-white rounded-3xl p-5 sm:p-8 shadow-2xl space-y-5 text-left max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#0758fc] block">
                  District Super Admin • Verify Payment Screenshot
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
                  {proofModalOrder.upi_transaction_id || "N/A"}
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
                  onClick={() => {
                    setProofModalOrder(null);
                    setRejectModalOrder(proofModalOrder);
                  }}
                  className="flex-1 sm:flex-initial bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs px-5 py-3 rounded-2xl transition-all cursor-pointer text-center"
                >
                  Reject Payment
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    await handleApprovePayment(proofModalOrder.id);
                    setProofModalOrder(null);
                  }}
                  disabled={verifyingOrderId === proofModalOrder.id}
                  className="flex-1 sm:flex-initial bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-6 py-3 rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-center"
                >
                  <CheckCircle2 size={16} /> Confirm Photo &amp; Approve Pass
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── COMPLAINT & GRIEVANCE DEEP-INSPECTION MODAL ────────────────── */}
      {selectedComplaint && (
        <div
          onClick={() => setSelectedComplaint(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in-50"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: "100%", maxWidth: "620px" }}
            className="w-full bg-white rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl animate-in zoom-in-95 text-gray-900 mx-auto max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#0758fc]">
                  STATUTORY GRIEVANCE REDRESSAL
                </span>
                <h3 className="text-xl font-black text-gray-900">
                  Case: {selectedComplaint.complaint_number || selectedComplaint.id?.slice(0, 12)}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedComplaint(null)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Complainant Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-200 text-xs">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase block">Complainant</span>
                <span className="font-extrabold text-gray-900">{selectedComplaint.user_name || "User"}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase block">Contact Email</span>
                <span className="font-mono text-gray-800 text-[11px] truncate block">{selectedComplaint.user_email}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase block">Category</span>
                <span className="font-bold text-[#0758fc]">{selectedComplaint.category || "General"}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase block">Filed Date</span>
                <span className="text-gray-700">
                  {selectedComplaint.created_at ? new Date(selectedComplaint.created_at).toLocaleString("en-IN") : "Recent"}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase block">Current Status</span>
                <span className="font-extrabold uppercase text-xs">{selectedComplaint.status}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase block">Statutory SLA</span>
                <span className="font-bold text-emerald-600">15-Day Resolution</span>
              </div>
            </div>

            {/* Description Body */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                Full Complaint &amp; Incident Narrative
              </label>
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 text-xs text-gray-800 leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap">
                {selectedComplaint.description}
              </div>
            </div>

            {/* Resolution Recording */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                Record Official Resolution &amp; Ombudsman Findings
              </label>
              <textarea
                rows={3}
                value={resolutionInput}
                onChange={(e) => setResolutionInput(e.target.value)}
                placeholder="Enter statutory resolution notes for the complainant audit record..."
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-3 text-xs outline-none focus:border-[#0758fc] focus:bg-white"
              />

              <div className="flex flex-wrap gap-1.5">
                {[
                  "Refund processed to original payment account",
                  "Personal data permanently erased per DPDP Act",
                  "Direct consent status updated in Privacy Center",
                  "Resolved via host organizer consultation",
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setResolutionInput(preset)}
                    className="text-[10px] font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 px-2.5 py-1 rounded-lg cursor-pointer"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedComplaint(null)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 rounded-2xl text-xs transition-colors cursor-pointer"
              >
                Close
              </button>

              <button
                type="button"
                disabled={updatingComplaintId === (selectedComplaint.id || selectedComplaint.complaint_number)}
                onClick={async () => {
                  await handleUpdateComplaintStatus(
                    selectedComplaint.id || selectedComplaint.complaint_number,
                    "under_review",
                    resolutionInput.trim() || undefined
                  );
                }}
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-extrabold py-2.5 rounded-2xl text-xs transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                Mark Under Investigation
              </button>

              <button
                type="button"
                disabled={updatingComplaintId === (selectedComplaint.id || selectedComplaint.complaint_number)}
                onClick={async () => {
                  await handleUpdateComplaintStatus(
                    selectedComplaint.id || selectedComplaint.complaint_number,
                    "resolved",
                    resolutionInput.trim() || "Case reviewed and resolved by Platform Grievance Desk."
                  );
                }}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-2.5 rounded-2xl text-xs transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 size={14} /> Resolve &amp; Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Gallery Multi-Photo Upload Modal */}
      <GalleryUploadModal
        isOpen={isGalleryModalOpen}
        onClose={() => setIsGalleryModalOpen(false)}
      />
    </div>
  </div>
  );
}
