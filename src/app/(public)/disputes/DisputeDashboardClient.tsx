"use client";

import { useState } from "react";
import {
  Gavel,
  ShieldAlert,
  CheckCircle2,
  Clock,
  AlertTriangle,
  PlusCircle,
  X,
  FileText,
  MessageSquare,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Send,
  Building,
} from "lucide-react";

interface DisputeItem {
  id: string;
  category: string;
  orderId?: string;
  ticketId?: string;
  title: string;
  description: string;
  status: "open" | "investigating" | "under_review" | "resolved" | "closed";
  date: string;
  lastUpdated: string;
  level: "Level 1: Support" | "Level 2: Organizer" | "Level 3: Platform Review" | "Level 4: Grievance Officer";
  timeline: { step: string; timestamp: string; note: string }[];
}

const INITIAL_DISPUTES: DisputeItem[] = [
  {
    id: "DIS-2026-001042",
    category: "Refund Not Received",
    orderId: "ORD-94812",
    ticketId: "TKT-8291-ABCD",
    title: "Pending UPI refund for cancelled workshop",
    description: "The AI & Tech Summit workshop was cancelled by the host club on 10 Aug. Bank account not yet credited with the ₹499 refund.",
    status: "investigating",
    date: "14 Aug 2026",
    lastUpdated: "16 Aug 2026",
    level: "Level 3: Platform Review",
    timeline: [
      { step: "Dispute Filed", timestamp: "14 Aug 2026, 11:30 AM", note: "Case logged by attendee. Assigned reference DIS-2026-001042." },
      { step: "Host Club Notified", timestamp: "14 Aug 2026, 02:15 PM", note: "Sent settlement verification request to Club Treasurer." },
      { step: "Platform Audit Initiated", timestamp: "16 Aug 2026, 10:00 AM", note: "Bank payout trace initiated with payment gateway." },
    ],
  },
  {
    id: "DIS-2026-000891",
    category: "Duplicate Payment",
    orderId: "ORD-73910",
    ticketId: "TKT-1029-XYZA",
    title: "Accidental double debit during checkout timeout",
    description: "Network timeout occurred while scanning UPI QR. Bank was debited twice for ₹350 each.",
    status: "resolved",
    date: "02 Aug 2026",
    lastUpdated: "04 Aug 2026",
    level: "Level 1: Support",
    timeline: [
      { step: "Case Logged", timestamp: "02 Aug 2026, 04:20 PM", note: "Attendee submitted UTR screenshot." },
      { step: "Gateway Reconciled", timestamp: "03 Aug 2026, 11:00 AM", note: "Duplicate transaction identified on UPI settlement ledger." },
      { step: "Refund Completed", timestamp: "04 Aug 2026, 03:45 PM", note: "Full duplicate amount of ₹350 reversed to source VPA." },
    ],
  },
];

const STATUS_CONFIG = {
  open: { label: "Open", badge: "bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border-blue-200" },
  investigating: { label: "Investigating", badge: "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-200" },
  under_review: { label: "Under Review", badge: "bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border-purple-200" },
  resolved: { label: "Resolved", badge: "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-200" },
  closed: { label: "Closed", badge: "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300" },
};

export function DisputeDashboardClient() {
  const [disputes, setDisputes] = useState<DisputeItem[]>(INITIAL_DISPUTES);
  const [expandedId, setExpandedId] = useState<string | null>("DIS-2026-001042");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [category, setCategory] = useState("Refund Not Received");
  const [orderId, setOrderId] = useState("");
  const [ticketId, setTicketId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);

  function handleCreateDispute(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !description) return;

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const newId = `DIS-2026-00${randomSuffix}`;
    const newDispute: DisputeItem = {
      id: newId,
      category,
      orderId: orderId || undefined,
      ticketId: ticketId || undefined,
      title,
      description,
      status: "open",
      date: "Just now",
      lastUpdated: "Just now",
      level: "Level 1: Support",
      timeline: [
        {
          step: "Dispute Submitted",
          timestamp: "Just now",
          note: `Case registered under ${category}. Queued for Level 1 support triage.`,
        },
      ],
    };

    setDisputes([newDispute, ...disputes]);
    setExpandedId(newId);
    setIsModalOpen(false);
    setTitle("");
    setDescription("");
    setOrderId("");
    setTicketId("");
    setSubmittedMessage(`Dispute successfully created with Reference ID: ${newId}`);
    setTimeout(() => setSubmittedMessage(null), 6000);
  }

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-widest text-[#0758fc] bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 px-2.5 py-0.5 rounded-full">
              Dispute Desk &amp; Ombudsman
            </span>
          </div>
          <h2 className="text-xl font-black text-gray-900 dark:text-white mt-1">
            My Disputes &amp; Grievances
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Track investigations, submit evidence, and monitor multi-tiered dispute escalations.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="bg-[#0758fc] hover:bg-[#054fe0] text-white font-extrabold text-xs px-5 py-3 rounded-2xl shadow-md flex items-center gap-2 cursor-pointer transition-all active:scale-95 shrink-0"
        >
          <PlusCircle size={15} /> Raise New Dispute
        </button>
      </div>

      {submittedMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 size={16} className="shrink-0" />
          <span>{submittedMessage}</span>
        </div>
      )}

      {/* Disputes list */}
      <div className="space-y-4">
        {disputes.map((d) => {
          const isExpanded = expandedId === d.id;
          const statusConf = STATUS_CONFIG[d.status] || STATUS_CONFIG.open;

          return (
            <div
              key={d.id}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl overflow-hidden shadow-xs transition-all"
            >
              {/* Summary Row */}
              <div
                onClick={() => setExpandedId(isExpanded ? null : d.id)}
                className="p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-black text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-lg border border-gray-200 dark:border-gray-700">
                      {d.id}
                    </span>
                    <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${statusConf.badge}`}>
                      {statusConf.label}
                    </span>
                    <span className="text-[11px] font-medium text-gray-400">
                      • {d.date}
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">
                    {d.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                    <span>Category: <strong className="text-gray-700 dark:text-gray-300">{d.category}</strong></span>
                    {d.orderId && <span>Order: <strong className="text-gray-700 dark:text-gray-300">{d.orderId}</strong></span>}
                    <span>Level: <strong className="text-[#0758fc]">{d.level}</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  <span className="text-xs text-gray-400 font-medium hidden sm:inline">
                    {isExpanded ? "Hide Details" : "View Timeline"}
                  </span>
                  <div className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500">
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </div>
              </div>

              {/* Expanded Detail Panel */}
              {isExpanded && (
                <div className="border-t border-gray-100 dark:border-gray-800 p-6 sm:p-8 bg-gray-50/50 dark:bg-gray-800/20 space-y-6">
                  {/* Full Description */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                      Issue Description
                    </h4>
                    <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 leading-relaxed">
                      {d.description}
                    </p>
                  </div>

                  {/* Timeline Progression */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                      <Clock size={14} /> Resolution Timeline &amp; Audit Trail
                    </h4>
                    <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200 dark:before:bg-gray-700">
                      {d.timeline.map((step, idx) => (
                        <div key={idx} className="relative space-y-1">
                          <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-[#0758fc] ring-4 ring-blue-50 dark:ring-gray-900" />
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-gray-900 dark:text-white">
                              {step.step}
                            </span>
                            <span className="text-[10px] text-gray-400 font-mono">
                              {step.timestamp}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {step.note}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions / Escalation Notice */}
                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs border-t border-gray-200/60 dark:border-gray-700/60">
                    <span className="text-gray-500">
                      Need immediate Ombudsman review? Email <a href="mailto:tech.rotaract3192@gmail.com" className="text-[#0758fc] font-bold underline">tech.rotaract3192@gmail.com</a> quoting <strong>{d.id}</strong>.
                    </span>
                    {d.status !== "resolved" && (
                      <span className="font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-3 py-1 rounded-xl">
                        Target SLA: 24h Update
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── CREATE DISPUTE MODAL ────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-5 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              type="button"
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-[#0758fc] flex items-center justify-center shrink-0">
                <Gavel size={20} />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900 dark:text-white">
                  File a Formal Dispute
                </h3>
                <p className="text-xs text-gray-500">
                  Your case will be assigned a unique tracking ID and audited by our team.
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateDispute} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  Dispute Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-[#0758fc]"
                >
                  <option value="Refund Not Received">Refund Not Received</option>
                  <option value="Duplicate Payment">Duplicate Payment / Double Charge</option>
                  <option value="Event Cancellation Issue">Event Cancellation / Rescheduling Dispute</option>
                  <option value="Gate Entry Denied">Gate Entry Denied / Scanner Token Error</option>
                  <option value="Organizer Misconduct">Organizer Misconduct / False Event Listing</option>
                  <option value="Other Transaction Issue">Other Transaction Issue</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                    Order ID (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ORD-94812"
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-900 dark:text-white font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                    Ticket ID / UTR (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. TKT-8291 or 12-digit UTR"
                    value={ticketId}
                    onChange={(e) => setTicketId(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-gray-900 dark:text-white font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  Summary / Subject *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bank debited but ticket not issued"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-gray-900 dark:text-white font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  Detailed Explanation &amp; Bank Evidence *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Provide transaction timestamps, debited amount, host club name, and detailed circumstances..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 text-gray-900 dark:text-white font-medium"
                />
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold py-2.5 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#0758fc] hover:bg-[#054fe0] text-white font-extrabold py-2.5 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Send size={14} /> Submit Dispute
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
