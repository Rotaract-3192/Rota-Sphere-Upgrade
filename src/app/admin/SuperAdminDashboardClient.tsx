"use client";

/**
 * Super Admin Governance Client
 * Platform-wide KYC verification, event moderation, immutable audit logs, and feature flags.
 */

import { useState } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  Building2,
  Calendar,
  CreditCard,
  History,
  ToggleLeft,
  CheckCircle2,
  XCircle,
  Star,
  ExternalLink,
  Search,
  Sparkles,
  TrendingUp,
  Sliders,
} from "lucide-react";
import {
  approveOrganizationKycAction,
  rejectOrganizationKycAction,
  toggleEventFeatureAction,
  togglePlatformFeatureFlagAction,
} from "@/app/actions/adminActions";

interface SuperAdminProps {
  user: any;
  initialOrganizations: any[];
  initialEvents: any[];
  initialOrders: any[];
  initialAuditLogs: any[];
  initialFeatureFlags: any[];
}

export function SuperAdminDashboardClient({
  user,
  initialOrganizations,
  initialEvents,
  initialOrders,
  initialAuditLogs,
  initialFeatureFlags,
}: SuperAdminProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "kyc" | "events" | "finance" | "audit" | "flags">("overview");

  const [organizations, setOrganizations] = useState(initialOrganizations);
  const [events, setEvents] = useState(initialEvents);
  const [orders, setOrders] = useState(initialOrders);
  const [auditLogs, setAuditLogs] = useState(initialAuditLogs);
  const [featureFlags, setFeatureFlags] = useState(initialFeatureFlags);

  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  // Aggregate Platform Financials
  const platformGMV = orders.filter((o) => o.status === "PAID").reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
  const platformRevenue = orders.filter((o) => o.status === "PAID").reduce((sum, o) => sum + Number(o.platform_fee || 0), 0);

  async function handleApproveKyc(orgId: string) {
    const res = await approveOrganizationKycAction(orgId);
    if (res.success) {
      showToast("Organization KYC Approved!");
      setOrganizations(organizations.map((o) => (o.id === orgId ? { ...o, kyc_status: "VERIFIED", is_verified: true } : o)));
    }
  }

  async function handleRejectKyc(orgId: string) {
    const reason = prompt("Enter reason for rejection:", "Incomplete documentation");
    if (!reason) return;
    const res = await rejectOrganizationKycAction(orgId, reason);
    if (res.success) {
      showToast("Organization KYC Rejected");
      setOrganizations(organizations.map((o) => (o.id === orgId ? { ...o, kyc_status: "REJECTED", is_verified: false } : o)));
    }
  }

  async function handleToggleFeature(eventId: string, current: boolean) {
    const res = await toggleEventFeatureAction(eventId, !current);
    if (res.success) {
      showToast(!current ? "Event Featured on Homepage!" : "Event removed from featured");
      setEvents(events.map((e) => (e.id === eventId ? { ...e, is_featured: !current } : e)));
    }
  }

  async function handleToggleFlag(flagId: string, current: boolean) {
    const res = await togglePlatformFeatureFlagAction(flagId, !current);
    if (res.success) {
      showToast(`Feature flag updated!`);
      setFeatureFlags(featureFlags.map((f) => (f.id === flagId ? { ...f, is_enabled: !current } : f)));
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col md:flex-row">
      
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-amber-400 text-gray-950 px-5 py-3 rounded-2xl shadow-2xl text-xs font-bold flex items-center gap-2">
          <Sparkles size={14} />
          <span>{toast}</span>
        </div>
      )}

      {/* ── SUPER ADMIN SIDEBAR ───────────────────────────────────────── */}
      <aside className="w-full md:w-64 bg-gray-950 p-6 border-r border-gray-800 flex flex-col justify-between">
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 text-amber-400 text-xs font-extrabold uppercase tracking-widest">
              <ShieldAlert size={16} /> Super Admin
            </div>
            <h1 className="text-xl font-extrabold text-white mt-1">Platform Governance</h1>
            <p className="text-[10px] text-gray-400">District 3192 Global Control</p>
          </div>

          <nav className="space-y-1">
            {[
              { id: "overview", label: "Platform Overview", icon: TrendingUp },
              { id: "kyc", label: "Organization KYC", icon: Building2 },
              { id: "events", label: "Event Moderation", icon: Calendar },
              { id: "finance", label: "Platform Finance", icon: CreditCard },
              { id: "audit", label: "Immutable Audit Logs", icon: History },
              { id: "flags", label: "Feature Flags", icon: Sliders },
            ].map(({ id, label, icon: Icon }) => {
              const active = activeTab === id;
              return (
                <button
                  key={id}
                  onClick={() => setActiveTab(id as any)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    active ? "bg-amber-400 text-gray-950 font-bold" : "text-gray-400 hover:bg-gray-800 hover:text-white"
                  }`}
                >
                  <Icon size={16} />
                  <span>{label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-3 bg-gray-900 rounded-2xl border border-gray-800 text-xs">
          <p className="text-gray-400">Logged in as</p>
          <p className="font-bold text-white truncate">{user.email}</p>
        </div>
      </aside>

      {/* ── MAIN CONTENT ─────────────────────────────────────────────── */}
      <main className="flex-1 p-6 sm:p-10 space-y-8 max-w-7xl">
        
        {/* ── 1. PLATFORM OVERVIEW ─────────────────────────────────────── */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Platform Health & Metrics</h2>
              <p className="text-xs text-gray-400 mt-1">Real-time GMV, commission earnings, and moderation status.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="bg-gray-950 border border-gray-800 p-6 rounded-3xl space-y-1">
                <span className="text-[11px] font-bold text-gray-400 uppercase">Platform GMV</span>
                <p className="text-2xl sm:text-3xl font-extrabold text-white">₹{platformGMV.toLocaleString("en-IN")}</p>
              </div>

              <div className="bg-gray-950 border border-gray-800 p-6 rounded-3xl space-y-1">
                <span className="text-[11px] font-bold text-gray-400 uppercase">Net Platform Earnings</span>
                <p className="text-2xl sm:text-3xl font-extrabold text-amber-400">₹{platformRevenue.toLocaleString("en-IN")}</p>
              </div>

              <div className="bg-gray-950 border border-gray-800 p-6 rounded-3xl space-y-1">
                <span className="text-[11px] font-bold text-gray-400 uppercase">Registered Organizations</span>
                <p className="text-2xl sm:text-3xl font-extrabold text-white">{organizations.length}</p>
              </div>

              <div className="bg-gray-950 border border-gray-800 p-6 rounded-3xl space-y-1">
                <span className="text-[11px] font-bold text-gray-400 uppercase">Total Events</span>
                <p className="text-2xl sm:text-3xl font-extrabold text-emerald-400">{events.length}</p>
              </div>
            </div>
          </div>
        )}

        {/* ── 2. KYC VERIFICATION ─────────────────────────────────────── */}
        {activeTab === "kyc" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-extrabold text-white">Organization KYC Moderation</h2>
              <p className="text-xs text-gray-400 mt-1">Review legal documentation, bank accounts, and approve organizer payouts.</p>
            </div>

            <div className="bg-gray-950 border border-gray-800 rounded-3xl overflow-hidden">
              <div className="divide-y divide-gray-800">
                {organizations.length === 0 ? (
                  <p className="p-8 text-center text-xs text-gray-500">No organizations found.</p>
                ) : (
                  organizations.map((org) => (
                    <div key={org.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-base font-bold text-white">{org.name}</span>
                          <span
                            className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                              org.kyc_status === "VERIFIED"
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                            }`}
                          >
                            ● {org.kyc_status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          City: {org.city} · Support: {org.support_email}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {org.kyc_status !== "VERIFIED" && (
                          <button
                            onClick={() => handleApproveKyc(org.id)}
                            className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
                          >
                            <CheckCircle2 size={14} /> Approve KYC
                          </button>
                        )}
                        {org.kyc_status !== "REJECTED" && (
                          <button
                            onClick={() => handleRejectKyc(org.id)}
                            className="inline-flex items-center gap-1 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 font-bold text-xs px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
                          >
                            <XCircle size={14} /> Reject
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── 3. EVENT MODERATION & FEATURED CURATION ─────────────────── */}
        {activeTab === "events" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-extrabold text-white">Event Moderation & Featuring</h2>
              <p className="text-xs text-gray-400 mt-1">Toggle featured status on the discovery homepage or review safety.</p>
            </div>

            <div className="bg-gray-950 border border-gray-800 rounded-3xl overflow-hidden">
              <div className="divide-y divide-gray-800">
                {events.map((evt) => (
                  <div key={evt.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-white">{evt.title}</span>
                        {evt.is_featured && (
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-400 border border-amber-400/30">
                            ★ Featured
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        Org: {evt.organizations?.name || "District"} · City: {evt.city} · Status: {evt.status}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleFeature(evt.id, evt.is_featured)}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                          evt.is_featured
                            ? "bg-amber-400 text-gray-950"
                            : "bg-gray-800 hover:bg-gray-700 text-gray-300"
                        }`}
                      >
                        <Star size={14} /> {evt.is_featured ? "Featured" : "Feature Event"}
                      </button>

                      <Link
                        href={`/events/${evt.slug}`}
                        className="p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300"
                      >
                        <ExternalLink size={14} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── 4. IMMUTABLE AUDIT LOGS ─────────────────────────────────── */}
        {activeTab === "audit" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-extrabold text-white">Immutable Platform Audit Logs</h2>
              <p className="text-xs text-gray-400 mt-1">Cryptographically tracked activity history across all platform entities.</p>
            </div>

            <div className="bg-gray-950 border border-gray-800 rounded-3xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-900 border-b border-gray-800 text-gray-400 uppercase font-bold">
                    <tr>
                      <th className="py-3 px-5">Timestamp</th>
                      <th className="py-3 px-5">Action</th>
                      <th className="py-3 px-5">Actor Role</th>
                      <th className="py-3 px-5">Entity</th>
                      <th className="py-3 px-5">Actor Email</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800 font-mono text-gray-300">
                    {auditLogs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-gray-500 font-sans">
                          No audit entries recorded yet.
                        </td>
                      </tr>
                    ) : (
                      auditLogs.map((log) => (
                        <tr key={log.id}>
                          <td className="py-3 px-5 text-gray-400">{new Date(log.created_at).toLocaleTimeString("en-IN")}</td>
                          <td className="py-3 px-5 font-bold text-amber-400">{log.action}</td>
                          <td className="py-3 px-5 text-gray-400">{log.actor_role}</td>
                          <td className="py-3 px-5">{log.entity_type}</td>
                          <td className="py-3 px-5 text-gray-400">{log.actor_email || log.actor_id}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── 5. FEATURE FLAGS ────────────────────────────────────────── */}
        {activeTab === "flags" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-extrabold text-white">System Feature Flags</h2>
              <p className="text-xs text-gray-400 mt-1">Real-time kill-switches and staged feature rollouts.</p>
            </div>

            <div className="bg-gray-950 border border-gray-800 rounded-3xl divide-y divide-gray-800">
              {featureFlags.map((flag) => (
                <div key={flag.id} className="p-6 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white">{flag.name}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{flag.description}</p>
                    <span className="text-[10px] font-mono text-gray-500 mt-1 block">Key: {flag.id}</span>
                  </div>

                  <button
                    onClick={() => handleToggleFlag(flag.id, flag.is_enabled)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      flag.is_enabled ? "bg-emerald-500 text-gray-950" : "bg-gray-800 text-gray-400"
                    }`}
                  >
                    {flag.is_enabled ? "ENABLED" : "DISABLED"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
