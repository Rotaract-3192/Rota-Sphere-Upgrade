"use client";

import { useState, useEffect } from "react";
import {
  Shield, Bell, Download, FileText, AlertTriangle,
  Trash2, ChevronRight, CheckCircle2, XCircle, Clock,
  RefreshCw, Loader2, Send, Eye, ToggleLeft, ToggleRight,
  Lock, Info
} from "lucide-react";
import {
  getUserConsentsAction,
  updateUserConsentAction,
  submitPrivacyRequestAction,
  getUserPrivacyRequestsAction,
  submitPrivacyComplaintAction,
  getUserPrivacyComplaintsAction,
  requestDataExportAction,
  getDataExportAction,
} from "@/app/actions/privacyActions";
import { CONSENT_LABELS, ConsentPurpose } from "@/lib/consent/consentManager";

interface Props {
  userId: string;
  userEmail: string;
  userName: string;
}

type Tab = "consents" | "requests" | "export" | "complaints" | "deletion";

const STATUS_BADGE: Record<string, string> = {
  open: "bg-blue-50 text-blue-700 border-blue-200",
  under_review: "bg-amber-50 text-amber-700 border-amber-200",
  awaiting_info: "bg-orange-50 text-orange-700 border-orange-200",
  in_progress: "bg-purple-50 text-purple-700 border-purple-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  resolved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
  closed: "bg-gray-100 text-gray-600 border-gray-200",
};

export function PrivacyCenterClient({ userId, userEmail, userName }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("consents");

  const tabs = [
    { id: "consents" as Tab, label: "My Consents", icon: ToggleRight },
    { id: "requests" as Tab, label: "Data Requests", icon: FileText },
    { id: "export" as Tab, label: "Download My Data", icon: Download },
    { id: "complaints" as Tab, label: "Privacy Complaints", icon: AlertTriangle },
    { id: "deletion" as Tab, label: "Account Deletion", icon: Trash2 },
  ];

  return (
    <div className="space-y-6">
      {/* Tab nav */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === tab.id
                ? "bg-[#1e9df1] text-white shadow-md shadow-[#1e9df1]/25"
                : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-gray-400"
            }`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-3xl overflow-hidden">
        {activeTab === "consents" && <ConsentsTab userId={userId} userEmail={userEmail} />}
        {activeTab === "requests" && <RequestsTab userId={userId} userEmail={userEmail} userName={userName} />}
        {activeTab === "export" && <ExportTab userId={userId} userEmail={userEmail} />}
        {activeTab === "complaints" && <ComplaintsTab userId={userId} userEmail={userEmail} userName={userName} />}
        {activeTab === "deletion" && <DeletionTab userEmail={userEmail} />}
      </div>

      {/* Legal notice */}
      <div className="flex items-start gap-2 text-[11px] text-gray-400 dark:text-gray-600 bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700">
        <Info size={14} className="shrink-0 mt-0.5" />
        <p>
          This Privacy Center is provided under the Digital Personal Data Protection Act, 2023 (India).
          For assistance, contact <a href="mailto:tech.rotaract3192@gmail.com" className="underline">tech.rotaract3192@gmail.com</a>.
          Compliance configuration does not constitute legal certification.
          This platform should be reviewed by an Indian privacy/legal professional before commercial launch.
        </p>
      </div>
    </div>
  );
}

// ─── CONSENTS TAB ─────────────────────────────────────────────────────────────

function ConsentsTab({ userId, userEmail }: { userId: string; userEmail: string }) {
  const [consents, setConsents] = useState<Record<string, string>>(() => {
    const initialMap: Record<string, string> = {};
    (Object.keys(CONSENT_LABELS) as ConsentPurpose[]).forEach((p) => {
      initialMap[p] = "granted";
    });
    return initialMap;
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    getUserConsentsAction().then((res) => {
      const map: Record<string, string> = {};
      (Object.keys(CONSENT_LABELS) as ConsentPurpose[]).forEach((p) => {
        map[p] = "granted";
      });
      if (res.success && res.data && Array.isArray(res.data)) {
        (res.data as any[]).forEach((c: any) => {
          if (c.purpose && c.status) {
            map[c.purpose] = c.status;
          }
        });
      }
      setConsents(map);
      setLoading(false);
    });
  }, []);

  async function toggle(purpose: ConsentPurpose) {
    const current = consents[purpose] ?? "granted";
    const newStatus = current === "granted" ? "withdrawn" : "granted";
    setSaving(purpose);
    const res = await updateUserConsentAction([purpose], newStatus as any);
    if (res.success) {
      setConsents((prev) => ({ ...prev, [purpose]: newStatus }));
      setMessage(newStatus === "granted" ? "Consent enabled." : "Consent disabled.");
      setTimeout(() => setMessage(null), 3000);
    }
    setSaving(null);
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 space-y-6">
      <div>
        <h2 className="text-lg font-extrabold text-gray-900 dark:text-white">Manage Your Consents</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Each consent purpose is managed separately. Withdrawing consent is as easy as granting it.
        </p>
      </div>

      {message && (
        <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2 flex items-center gap-2">
          <CheckCircle2 size={14} /> {message}
        </div>
      )}

      <div className="space-y-3">
        {(Object.keys(CONSENT_LABELS) as ConsentPurpose[]).map((purpose) => {
          const meta = CONSENT_LABELS[purpose];
          const status = consents[purpose] ?? "granted";
          const isGranted = status === "granted";
          const isRequired = meta.required;
          const isSaving = saving === purpose;

          return (
            <div
              key={purpose}
              className={`flex items-start justify-between gap-4 p-4 rounded-2xl border ${
                isRequired ? "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700" : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{meta.label}</p>
                  {isRequired && (
                    <span className="text-[10px] font-extrabold uppercase bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full">
                      Required
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{meta.description}</p>
              </div>
              <div className="shrink-0">
                {isRequired ? (
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Lock size={12} />
                    <span>Always on</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => toggle(purpose)}
                    className="cursor-pointer disabled:opacity-50"
                    aria-label={isGranted ? `Withdraw ${meta.label}` : `Grant ${meta.label}`}
                  >
                    {isSaving ? (
                      <Loader2 size={22} className="animate-spin text-gray-400" />
                    ) : isGranted ? (
                      <ToggleRight size={28} className="text-[#1e9df1]" />
                    ) : (
                      <ToggleLeft size={28} className="text-gray-400" />
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── DATA REQUESTS TAB ────────────────────────────────────────────────────────

function RequestsTab({ userId, userEmail, userName }: { userId: string; userEmail: string; userName: string }) {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [requestType, setRequestType] = useState<string>("access");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    getUserPrivacyRequestsAction().then((res) => {
      if (res.success) setRequests(res.data || []);
      setLoading(false);
    });
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) return;
    setSubmitting(true);
    const res = await submitPrivacyRequestAction({ requestType: requestType as any, description });
    setSubmitting(false);
    if (res.success) {
      setMessage({ type: "ok", text: `Request submitted: ${res.requestNumber}` });
      setShowForm(false);
      setDescription("");
      getUserPrivacyRequestsAction().then((r) => { if (r.success) setRequests(r.data || []); });
    } else {
      setMessage({ type: "err", text: res.error || "Failed to submit" });
    }
    setTimeout(() => setMessage(null), 5000);
  }

  const REQUEST_TYPES = [
    { value: "access", label: "Access My Data" },
    { value: "correction", label: "Correct My Data" },
    { value: "erasure", label: "Erase My Data" },
    { value: "portability", label: "Data Portability" },
    { value: "consent_withdrawal", label: "Withdraw Consent" },
    { value: "objection", label: "Object to Processing" },
  ];

  return (
    <div className="p-6 sm:p-8 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-gray-900 dark:text-white">Data Rights Requests</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Submit requests under DPDP Act 2023. We aim to respond within 30 days.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-[#1e9df1] text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-[#1583cd] transition-colors cursor-pointer"
        >
          <Send size={13} /> New Request
        </button>
      </div>

      {message && (
        <div className={`text-xs rounded-xl px-4 py-2 border flex items-center gap-2 ${
          message.type === "ok" ? "text-emerald-700 bg-emerald-50 border-emerald-200" : "text-red-700 bg-red-50 border-red-200"
        }`}>
          {message.type === "ok" ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
          {message.text}
        </div>
      )}

      {showForm && (
        <form onSubmit={submit} className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">New Data Rights Request</h3>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Request Type</label>
            <select
              value={requestType}
              onChange={(e) => setRequestType(e.target.value)}
              className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              {REQUEST_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Description <span className="text-red-500">*</span></label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please describe your request in detail..."
              className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
            />
          </div>
          <div className="flex items-center gap-3">
            <button type="submit" disabled={submitting} className="flex items-center gap-2 bg-[#1e9df1] text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-[#1583cd] cursor-pointer disabled:opacity-50">
              {submitting ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
              Submit Request
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="text-xs text-gray-500 hover:text-gray-700 cursor-pointer">Cancel</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-8"><Loader2 size={20} className="animate-spin text-gray-400" /></div>
      ) : requests.length === 0 ? (
        <div className="text-center py-8 text-sm text-gray-500">No requests submitted yet.</div>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <div key={r.id} className="border border-gray-200 dark:border-gray-700 rounded-2xl p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-xs text-gray-500">{r.request_number}</span>
                  <p className="text-sm font-bold text-gray-900 dark:text-white capitalize">{r.request_type.replace("_", " ")}</p>
                </div>
                <span className={`text-[11px] font-bold uppercase border px-2.5 py-1 rounded-full ${STATUS_BADGE[r.status] || STATUS_BADGE.open}`}>
                  {r.status.replace("_", " ")}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{r.description}</p>
              {r.response && (
                <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3">
                  <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">Response:</p>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400">{r.response}</p>
                </div>
              )}
              <p className="text-[11px] text-gray-400">Submitted: {new Date(r.created_at).toLocaleDateString("en-IN")}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── EXPORT TAB ───────────────────────────────────────────────────────────────

function ExportTab({ userId, userEmail }: { userId: string; userEmail: string }) {
  const [loading, setLoading] = useState(false);
  const [exportId, setExportId] = useState<string | null>(null);
  const [exportData, setExportData] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function requestExport() {
    setLoading(true);
    const res = await requestDataExportAction();
    if (res.success && res.exportId) {
      setExportId(res.exportId);
      // Fetch the export content
      const get = await getDataExportAction(res.exportId);
      if (get.success && get.data?.content) {
        setExportData(get.data.content);
        setMessage({ type: "ok", text: "Your export is ready. Click Download to save." });
      }
    } else {
      setMessage({ type: "err", text: res.error || "Failed to generate export" });
    }
    setLoading(false);
  }

  function download() {
    if (!exportData) return;
    const json = Buffer.from(exportData, "base64").toString("utf-8");
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rotasphere-my-data-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="p-6 sm:p-8 space-y-6">
      <div>
        <h2 className="text-lg font-extrabold text-gray-900 dark:text-white">Download My Data</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Get a copy of all personal data we hold about you. The export includes your profile, tickets, orders, and consent history.
        </p>
      </div>

      <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 space-y-4">
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">What's included:</h3>
          {["Profile information", "Your tickets", "Your orders", "Consent history"].map((item) => (
            <div key={item} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
              <CheckCircle2 size={12} className="text-emerald-500" /> {item}
            </div>
          ))}
        </div>

        {message && (
          <div className={`text-xs rounded-xl px-4 py-2 border flex items-center gap-2 ${
            message.type === "ok" ? "text-emerald-700 bg-emerald-50 border-emerald-200" : "text-red-700 bg-red-50 border-red-200"
          }`}>
            {message.type === "ok" ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
            {message.text}
          </div>
        )}

        <div className="flex items-center gap-3">
          {!exportData ? (
            <button
              type="button"
              onClick={requestExport}
              disabled={loading}
              className="flex items-center gap-2 bg-[#1e9df1] text-white text-xs font-bold px-5 py-2.5 rounded-xl hover:bg-[#1583cd] cursor-pointer disabled:opacity-50"
            >
              {loading ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
              {loading ? "Preparing Export..." : "Generate Export"}
            </button>
          ) : (
            <button
              type="button"
              onClick={download}
              className="flex items-center gap-2 bg-emerald-600 text-white text-xs font-bold px-5 py-2.5 rounded-xl hover:bg-emerald-700 cursor-pointer"
            >
              <Download size={13} /> Download My Data (JSON)
            </button>
          )}
        </div>
        <p className="text-[11px] text-gray-400">Exports expire after 30 minutes. This action is logged for security.</p>
      </div>
    </div>
  );
}

// ─── COMPLAINTS TAB ───────────────────────────────────────────────────────────

function ComplaintsTab({ userId, userEmail, userName }: { userId: string; userEmail: string; userName: string }) {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [category, setCategory] = useState("data_breach");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    getUserPrivacyComplaintsAction().then((res) => {
      if (res.success) setComplaints(res.data || []);
      setLoading(false);
    });
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) return;
    setSubmitting(true);
    const res = await submitPrivacyComplaintAction({ userName, category: category as any, description });
    setSubmitting(false);
    if (res.success) {
      setMessage({ type: "ok", text: `Complaint submitted: ${res.complaintNumber}` });
      setShowForm(false);
      setDescription("");
      getUserPrivacyComplaintsAction().then((r) => { if (r.success) setComplaints(r.data || []); });
    } else {
      setMessage({ type: "err", text: res.error || "Failed to submit" });
    }
    setTimeout(() => setMessage(null), 5000);
  }

  const CATEGORIES = [
    { value: "data_breach", label: "Data Breach" },
    { value: "unauthorised_sharing", label: "Unauthorised Data Sharing" },
    { value: "consent_violation", label: "Consent Violation" },
    { value: "deletion_failure", label: "Data Not Deleted" },
    { value: "access_denial", label: "Access Request Denied" },
    { value: "correction_failure", label: "Correction Request Not Fulfilled" },
    { value: "excessive_collection", label: "Excessive Data Collection" },
    { value: "other", label: "Other" },
  ];

  return (
    <div className="p-6 sm:p-8 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-gray-900 dark:text-white">Privacy Complaints</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Raise a concern about how your personal data is handled.
          </p>
        </div>
        <button type="button" onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-red-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-red-700 cursor-pointer">
          <AlertTriangle size={13} /> Raise Complaint
        </button>
      </div>

      {message && (
        <div className={`text-xs rounded-xl px-4 py-2 border flex items-center gap-2 ${
          message.type === "ok" ? "text-emerald-700 bg-emerald-50 border-emerald-200" : "text-red-700 bg-red-50 border-red-200"
        }`}>
          {message.type === "ok" ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
          {message.text}
        </div>
      )}

      {showForm && (
        <form onSubmit={submit} className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-2xl p-5 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}
              className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Description <span className="text-red-500">*</span></label>
            <textarea required rows={4} value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your complaint in detail..."
              className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded-xl px-3 py-2.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none" />
          </div>
          <div className="flex items-center gap-3">
            <button type="submit" disabled={submitting}
              className="flex items-center gap-2 bg-red-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-red-700 cursor-pointer disabled:opacity-50">
              {submitting ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
              Submit Complaint
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="text-xs text-gray-500 hover:text-gray-700 cursor-pointer">Cancel</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-8"><Loader2 size={20} className="animate-spin text-gray-400" /></div>
      ) : complaints.length === 0 ? (
        <div className="text-center py-8 text-sm text-gray-500">No complaints submitted.</div>
      ) : (
        <div className="space-y-3">
          {complaints.map((c) => (
            <div key={c.id} className="border border-gray-200 dark:border-gray-700 rounded-2xl p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-xs text-gray-500">{c.complaint_number}</span>
                  <p className="text-sm font-bold text-gray-900 dark:text-white capitalize">{c.category.replace(/_/g, " ")}</p>
                </div>
                <span className={`text-[11px] font-bold uppercase border px-2.5 py-1 rounded-full ${STATUS_BADGE[c.status] || STATUS_BADGE.open}`}>
                  {c.status.replace("_", " ")}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{c.description}</p>
              {c.resolution && (
                <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 rounded-xl p-3">
                  <p className="text-xs font-bold text-emerald-700">Resolution: </p>
                  <p className="text-xs text-emerald-700">{c.resolution}</p>
                </div>
              )}
              <p className="text-[11px] text-gray-400">Submitted: {new Date(c.created_at).toLocaleDateString("en-IN")}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── ACCOUNT DELETION TAB ────────────────────────────────────────────────────

function DeletionTab({ userEmail }: { userEmail: string }) {
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function requestDeletion() {
    setSubmitting(true);
    await submitPrivacyRequestAction({
      requestType: "erasure",
      description: "Account deletion request — user self-initiated via Privacy Center. Please delete all personal data, anonymise required financial records, and delete push subscriptions.",
    });
    setSubmitted(true);
    setSubmitting(false);
  }

  if (submitted) {
    return (
      <div className="p-6 sm:p-8 text-center space-y-4">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 size={32} className="text-emerald-600" />
        </div>
        <h2 className="text-lg font-extrabold text-gray-900 dark:text-white">Deletion Request Submitted</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
          Your account deletion request has been received. We will process it within 30 days and notify you at {userEmail}.
          Legally required records (financial/accounting) will be retained per applicable law and then securely deleted.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 space-y-6">
      <div>
        <h2 className="text-lg font-extrabold text-gray-900 dark:text-white">Delete My Account</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          This will permanently delete your personal data subject to legal retention requirements.
        </p>
      </div>

      <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-2xl p-5 space-y-4">
        <h3 className="text-sm font-bold text-red-800 dark:text-red-300 flex items-center gap-2">
          <AlertTriangle size={16} /> What happens when you delete your account
        </h3>
        <ul className="space-y-2 text-xs text-red-700 dark:text-red-400">
          <li className="flex items-start gap-2"><XCircle size={12} className="mt-0.5 shrink-0" /> Your profile and personal data are deleted or anonymised</li>
          <li className="flex items-start gap-2"><XCircle size={12} className="mt-0.5 shrink-0" /> Your tickets are anonymised (event records retained for organisers)</li>
          <li className="flex items-start gap-2"><XCircle size={12} className="mt-0.5 shrink-0" /> All marketing consents are withdrawn</li>
          <li className="flex items-start gap-2"><XCircle size={12} className="mt-0.5 shrink-0" /> Push notification subscriptions are deleted</li>
          <li className="flex items-start gap-2"><CheckCircle2 size={12} className="mt-0.5 shrink-0 text-amber-600" /> Financial/payment records are retained per Indian accounting law (7 years) then deleted</li>
          <li className="flex items-start gap-2"><CheckCircle2 size={12} className="mt-0.5 shrink-0 text-amber-600" /> Audit logs are retained for the configured retention period</li>
        </ul>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-0.5 rounded"
          />
          <span className="text-xs text-red-800 dark:text-red-300">
            I understand the consequences and confirm I want to request deletion of my account and personal data.
          </span>
        </label>

        <button
          type="button"
          onClick={requestDeletion}
          disabled={!confirmed || submitting}
          className="flex items-center gap-2 bg-red-600 text-white text-xs font-bold px-5 py-2.5 rounded-xl hover:bg-red-700 cursor-pointer disabled:opacity-50"
        >
          {submitting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
          Request Account Deletion
        </button>

        <p className="text-[11px] text-red-600 dark:text-red-500">
          This submits a deletion request to our privacy team. Your account remains active until the request is processed.
          For immediate concerns contact <a href="mailto:tech.rotaract3192@gmail.com" className="underline">tech.rotaract3192@gmail.com</a>.
        </p>
      </div>
    </div>
  );
}
