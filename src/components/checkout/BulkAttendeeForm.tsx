"use client";

/**
 * BulkAttendeeForm
 * Full-screen modal for collecting per-attendee details (name, email, phone)
 * when a user purchases a bulk ticket slab.
 *
 * - Row 1 pre-filled with buyer's own info
 * - Inline duplicate email detection
 * - UPI payment flow for paid slabs
 * - Server-side submission via createBulkTicketOrderAction
 */

import { useState, useRef, useCallback, useEffect } from "react";
import {
  X, Users, Check, AlertCircle, Loader2, Copy, ChevronDown, ChevronUp,
  User, Mail, Phone, ShieldCheck, QrCode, CreditCard, CheckCircle2, Package,
  Upload, Trash2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  createBulkTicketOrderAction,
  getEventCustomQuestionsAction,
  type BulkAttendeeInput,
} from "@/app/actions/orderActions";
import { compressImageFile } from "@/lib/utils/imageCompressor";
import type { SaasEvent, SaasTicketTier } from "@/types/saas";

interface BulkAttendeeFormProps {
  isOpen: boolean;
  onClose: () => void;
  event: SaasEvent;
  tier: SaasTicketTier;    // must be is_bulk_slab=true
  buyerName: string;
  buyerEmail: string;
  buyerPhone?: string;
}

interface AttendeeRow {
  name: string;
  email: string;
  phone: string;
  customAnswers?: Record<string, any>;
  customErrors?: Record<string, string>;
  nameError?: string;
  emailError?: string;
}

function makeEmptyRow(): AttendeeRow {
  return { name: "", email: "", phone: "", customAnswers: {} };
}

export function BulkAttendeeForm({
  isOpen,
  onClose,
  event,
  tier,
  buyerName,
  buyerEmail,
  buyerPhone = "",
}: BulkAttendeeFormProps) {
  const slabSize = tier.bulk_slab_size ?? 1;
  const pricePerPerson = Number(tier.price) || 0;
  const totalPrice = pricePerPerson * slabSize;
  const isFree = pricePerPerson === 0;

  function buildInitialRows(): AttendeeRow[] {
    const rows = Array.from({ length: slabSize }, makeEmptyRow);
    // Pre-fill row 0 with buyer info
    rows[0] = { name: buyerName, email: buyerEmail, phone: buyerPhone };
    return rows;
  }

  const [attendees, setAttendees] = useState<AttendeeRow[]>(buildInitialRows);
  const [step, setStep] = useState<"details" | "payment" | "success">("details");
  const [upiId, setUpiId] = useState(event.upi_id || "");
  const [upiPayeeName, setUpiPayeeName] = useState(event.upi_payee_name || "");
  const [utrInput, setUtrInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{ orderNumber: string; ticketCount: number } | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set([0]));
  const [customQuestions, setCustomQuestions] = useState<any[]>([]);
  const idempotencyKey = useRef(`bulk_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`);

  useEffect(() => {
    if (isOpen && event?.id) {
      getEventCustomQuestionsAction(event.id).then((res) => {
        if (res.success && res.questions) {
          setCustomQuestions(res.questions);
        }
      });
    }
  }, [isOpen, event?.id]);

  const applicableQuestions = customQuestions.filter((q) => {
    const targetTiers = q.target_tiers || q.targetTiers;
    if (Array.isArray(targetTiers) && targetTiers.length > 0) {
      return targetTiers.includes(tier.id);
    }
    return true;
  });

  // Reset when re-opening
  const handleOpen = useCallback(() => {
    setAttendees(buildInitialRows());
    setStep("details");
    setUtrInput("");
    setGlobalError(null);
    setSuccessData(null);
    setExpandedRows(new Set([0]));
    idempotencyKey.current = `bulk_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }, [buyerName, buyerEmail, buyerPhone, slabSize]);

  function updateAttendee(idx: number, field: keyof AttendeeRow, value: string) {
    setAttendees((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value, [`${field}Error`]: undefined };
      return updated;
    });
    setGlobalError(null);
  }

  function updateAttendeeCustomAnswer(idx: number, qId: string, value: any) {
    setAttendees((prev) => {
      const updated = [...prev];
      const prevAnswers = updated[idx].customAnswers || {};
      const prevErrors = { ...(updated[idx].customErrors || {}) };
      delete prevErrors[qId];
      updated[idx] = {
        ...updated[idx],
        customAnswers: { ...prevAnswers, [qId]: value },
        customErrors: prevErrors,
      };
      return updated;
    });
    setGlobalError(null);
  }

  function toggleRow(idx: number) {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  }

  function validateAttendees(): boolean {
    const emailSeen = new Map<string, number>();
    let valid = true;

    setAttendees((prev) => {
      const updated = prev.map((row, idx) => {
        const nameError = row.name.trim() ? undefined : "Name is required";
        let emailError: string | undefined;
        if (!row.email.trim()) {
          emailError = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
          emailError = "Invalid email format";
        } else if (emailSeen.has(row.email.toLowerCase())) {
          emailError = `Duplicate of attendee #${(emailSeen.get(row.email.toLowerCase())! + 1)}`;
        } else {
          emailSeen.set(row.email.toLowerCase(), idx);
        }

        const customErrors: Record<string, string> = {};
        for (const q of applicableQuestions) {
          const qId = q.id;
          const qLabel = q.question_text || q.questionText || "Question";
          const qType = q.question_type || q.questionType;
          const rawVal = row.customAnswers?.[qId];
          const valStr = rawVal ? String(rawVal).trim() : "";

          if (q.is_required && !valStr) {
            customErrors[qId] = `${qLabel} is required`;
            valid = false;
          } else if (valStr) {
            const isAadhaarField = qType === "aadhaar" || (qType === "text" && /\baadhaar(\s*(card|number|no))?\b/i.test(qLabel));
            const isPanField = qType === "pan" || (qType === "text" && /\bpan(\s*(card|number|no))?\b/i.test(qLabel));
            const isPhoneField = qType === "phone" || (qType === "text" && /\b(phone|mobile|emergency\s*(phone|contact))\b/i.test(qLabel));

            if (isAadhaarField) {
              const digits = valStr.replace(/\D/g, "");
              if (digits.length !== 12) {
                customErrors[qId] = "Aadhaar must be 12 digits";
                valid = false;
              }
            } else if (isPanField) {
              const cleanPan = valStr.toUpperCase().replace(/\s/g, "");
              if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(cleanPan)) {
                customErrors[qId] = "Invalid PAN format (e.g. ABCDE1234F)";
                valid = false;
              }
            } else if (isPhoneField && valStr.replace(/\D/g, "").length < 10) {
              customErrors[qId] = "Must be at least 10 digits";
              valid = false;
            }
          }
        }

        if (nameError || emailError || Object.keys(customErrors).length > 0) valid = false;
        return { ...row, nameError, emailError, customErrors };
      });
      return updated;
    });

    return valid;
  }

  function handleContinueToPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!validateAttendees()) {
      setGlobalError("Please fix the highlighted errors before continuing.");
      // Auto-expand rows with errors
      setExpandedRows(new Set(attendees.map((_, i) => i)));
      return;
    }
    setGlobalError(null);
    if (isFree) {
      handleSubmitOrder();
    } else {
      setStep("payment");
    }
  }

  async function handleSubmitOrder() {
    setSubmitting(true);
    setGlobalError(null);

    const cleanAttendees: BulkAttendeeInput[] = attendees.map((a) => ({
      name: a.name.trim(),
      email: a.email.trim().toLowerCase(),
      phone: a.phone.trim() || undefined,
      customAnswers: a.customAnswers || {},
    }));

    const res = await createBulkTicketOrderAction({
      eventId: event.id,
      tierId: tier.id,
      attendees: cleanAttendees,
      buyerName: buyerName.trim(),
      buyerEmail: buyerEmail.trim().toLowerCase(),
      buyerPhone: buyerPhone.trim() || undefined,
      upiTransactionId: utrInput.trim() || undefined,
      idempotencyKey: idempotencyKey.current,
    });

    setSubmitting(false);

    if (res.success) {
      setSuccessData({ orderNumber: res.orderNumber!, ticketCount: res.ticketCount! });
      setStep("success");
    } else {
      setGlobalError(res.error || "Something went wrong. Please try again.");
    }
  }

  if (!isOpen) return null;

  const allFilled = attendees.every((a) => a.name.trim() && a.email.trim());
  const filledCount = attendees.filter((a) => a.name.trim() && a.email.trim()).length;

  return (
    <AnimatePresence>
      <motion.div
        key="bulk-form-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          key="bulk-form-modal"
          initial={{ opacity: 0, y: 60, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.97 }}
          transition={{ type: "spring", stiffness: 340, damping: 32 }}
          className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-2xl max-h-[95dvh] flex flex-col shadow-2xl overflow-hidden"
        >
          {/* ── Header ──────────────────────────────────────────────────── */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center">
                <Package size={16} className="text-indigo-600" />
              </div>
              <div>
                <h2 className="text-sm font-extrabold text-gray-900 leading-tight">
                  {tier.name}
                </h2>
                <p className="text-[11px] text-gray-500 leading-tight">
                  Group of {slabSize} · {isFree ? "Free Entry" : `₹${pricePerPerson.toLocaleString("en-IN")}/person`}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X size={15} className="text-gray-600" />
            </button>
          </div>

          {/* ── Progress indicator (details → payment → success) ─────── */}
          {step !== "success" && (
            <div className="flex items-center gap-2 px-6 py-3 border-b border-gray-50 bg-gray-50/60 shrink-0">
              {[
                { key: "details", label: "Attendees", icon: <Users size={12} /> },
                ...(!isFree ? [{ key: "payment", label: "Payment", icon: <CreditCard size={12} /> }] : []),
              ].map((s, i) => (
                <div key={s.key} className="flex items-center gap-1.5">
                  {i > 0 && <div className="w-5 h-px bg-gray-200" />}
                  <div className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full transition-all ${
                    step === s.key
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 text-gray-400"
                  }`}>
                    {s.icon}{s.label}
                  </div>
                </div>
              ))}
              <div className="ml-auto text-[11px] text-gray-400 font-semibold">
                {filledCount}/{slabSize} filled
              </div>
            </div>
          )}

          {/* ── Scrollable Body ──────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto overscroll-contain">

            {/* ─── STEP 1: Attendee Details ─────────────────────────── */}
            {step === "details" && (
              <form id="attendees-form" onSubmit={handleContinueToPayment} className="p-5 space-y-3">

                {globalError && (
                  <div className="flex items-center gap-2 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-4 py-3 rounded-2xl">
                    <AlertCircle size={14} className="shrink-0" />
                    {globalError}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-gray-700">
                    Enter details for all {slabSize} attendees
                  </p>
                  <button
                    type="button"
                    onClick={() => setExpandedRows(new Set(attendees.map((_, i) => i)))}
                    className="text-[11px] text-indigo-600 font-bold hover:underline cursor-pointer"
                  >
                    Expand All
                  </button>
                </div>

                {attendees.map((row, idx) => {
                  const isExpanded = expandedRows.has(idx);
                  const hasCustomErrors = !!(row.customErrors && Object.keys(row.customErrors).length > 0);
                  const hasError = !!(row.nameError || row.emailError || hasCustomErrors);
                  const isComplete = !!(row.name.trim() && row.email.trim() && !hasError);

                  return (
                    <div
                      key={idx}
                      className={`border rounded-2xl overflow-hidden transition-all ${
                        hasError
                          ? "border-rose-300 bg-rose-50/30"
                          : isComplete
                          ? "border-emerald-200 bg-emerald-50/20"
                          : "border-gray-200 bg-white"
                      }`}
                    >
                      {/* Row Header (collapsed) */}
                      <button
                        type="button"
                        onClick={() => toggleRow(idx)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left cursor-pointer hover:bg-gray-50/50 transition-colors"
                      >
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-extrabold shrink-0 ${
                          hasError
                            ? "bg-rose-100 text-rose-600 border border-rose-300"
                            : isComplete
                            ? "bg-emerald-100 text-emerald-700 border border-emerald-300"
                            : "bg-gray-100 text-gray-500 border border-gray-200"
                        }`}>
                          {isComplete && !hasError ? <Check size={12} /> : idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-gray-900 truncate">
                            {row.name.trim() || `Attendee ${idx + 1}`}
                            {idx === 0 && <span className="ml-1.5 text-[10px] text-indigo-600 font-bold">(you)</span>}
                          </p>
                          {row.email && (
                            <p className="text-[10px] text-gray-400 truncate">{row.email}</p>
                          )}
                        </div>
                        <div className="shrink-0 text-gray-400">
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </div>
                      </button>

                      {/* Expanded Fields */}
                      {isExpanded && (
                        <div className="px-4 pb-4 space-y-3 border-t border-gray-100">
                          {/* Name */}
                          <div className="pt-3">
                            <label className="block text-[11px] font-bold text-gray-700 mb-1">
                              Full Name *
                            </label>
                            <div className="relative">
                              <User size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                              <input
                                value={row.name}
                                onChange={(e) => updateAttendee(idx, "name", e.target.value)}
                                placeholder="Enter full name"
                                className={`w-full text-sm border rounded-xl pl-8 pr-3 py-2.5 bg-white outline-none focus:ring-2 transition-all ${
                                  row.nameError ? "border-rose-400 focus:ring-rose-200" : "border-gray-300 focus:ring-indigo-200 focus:border-indigo-400"
                                }`}
                              />
                            </div>
                            {row.nameError && (
                              <p className="text-[10px] text-rose-600 font-bold mt-1">{row.nameError}</p>
                            )}
                          </div>

                          {/* Email */}
                          <div>
                            <label className="block text-[11px] font-bold text-gray-700 mb-1">
                              Email Address *
                            </label>
                            <div className="relative">
                              <Mail size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                              <input
                                type="email"
                                value={row.email}
                                onChange={(e) => updateAttendee(idx, "email", e.target.value)}
                                placeholder="email@example.com"
                                className={`w-full text-sm border rounded-xl pl-8 pr-3 py-2.5 bg-white outline-none focus:ring-2 transition-all ${
                                  row.emailError ? "border-rose-400 focus:ring-rose-200" : "border-gray-300 focus:ring-indigo-200 focus:border-indigo-400"
                                }`}
                              />
                            </div>
                            {row.emailError && (
                              <p className="text-[10px] text-rose-600 font-bold mt-1">{row.emailError}</p>
                            )}
                          </div>

                          {/* Phone */}
                          <div>
                            <label className="block text-[11px] font-bold text-gray-700 mb-1">
                              Phone <span className="text-gray-400 font-normal">(optional)</span>
                            </label>
                            <div className="relative">
                              <Phone size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                              <input
                                type="tel"
                                value={row.phone}
                                onChange={(e) => updateAttendee(idx, "phone", e.target.value)}
                                placeholder="+91 9876543210"
                                className="w-full text-sm border border-gray-300 rounded-xl pl-8 pr-3 py-2.5 bg-white outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all"
                              />
                            </div>
                          </div>

                          {/* Custom Registration Questions for this Attendee */}
                          {applicableQuestions.length > 0 && (
                            <div className="pt-2 border-t border-gray-100 space-y-3">
                              <p className="text-[10px] font-extrabold uppercase text-gray-400 tracking-wider">
                                Additional Event Questions
                              </p>
                              {applicableQuestions.map((q) => {
                                const qId = q.id;
                                const qType = q.question_type || q.questionType || "text";
                                const qText = q.question_text || q.questionText;
                                const isReq = !!q.is_required;
                                const placeholder = q.placeholder || "";
                                const helpText = q.help_text || q.helpText;
                                const options = Array.isArray(q.options) ? q.options : [];
                                const currentVal = row.customAnswers?.[qId] ?? "";
                                const fieldError = row.customErrors?.[qId];

                                return (
                                  <div key={qId} className="space-y-1">
                                    <label className="block text-[11px] font-bold text-gray-700">
                                      {qText} {isReq && <span className="text-rose-500 font-black">*</span>}
                                    </label>

                                    {/* Aadhaar */}
                                    {qType === "aadhaar" && (
                                      <div>
                                        <input
                                          type="text"
                                          inputMode="numeric"
                                          maxLength={14}
                                          placeholder="XXXX XXXX XXXX"
                                          value={currentVal}
                                          onChange={(e) => {
                                            const digits = e.target.value.replace(/\D/g, "").slice(0, 12);
                                            const formatted = digits.replace(/(\d{4})(?=\d)/g, "$1 ");
                                            updateAttendeeCustomAnswer(idx, qId, formatted);
                                          }}
                                          className={`w-full text-sm font-mono border rounded-xl px-3 py-2 bg-white outline-none focus:ring-2 ${
                                            fieldError ? "border-rose-400 focus:ring-rose-200" : "border-gray-300 focus:ring-indigo-200"
                                          }`}
                                        />
                                        <span className="text-[10px] text-gray-400 block mt-0.5">12-digit Aadhaar UID</span>
                                      </div>
                                    )}

                                    {/* PAN */}
                                    {qType === "pan" && (
                                      <div>
                                        <input
                                          type="text"
                                          maxLength={10}
                                          placeholder="ABCDE1234F"
                                          value={currentVal}
                                          onChange={(e) => {
                                            const clean = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10);
                                            updateAttendeeCustomAnswer(idx, qId, clean);
                                          }}
                                          className={`w-full text-sm font-mono uppercase border rounded-xl px-3 py-2 bg-white outline-none focus:ring-2 ${
                                            fieldError ? "border-rose-400 focus:ring-rose-200" : "border-gray-300 focus:ring-indigo-200"
                                          }`}
                                        />
                                        <span className="text-[10px] text-gray-400 block mt-0.5">10-character PAN</span>
                                      </div>
                                    )}

                                    {/* Phone / Emergency */}
                                    {qType === "phone" && (
                                      <input
                                        type="tel"
                                        maxLength={10}
                                        placeholder={placeholder || "10-digit mobile number"}
                                        value={currentVal}
                                        onChange={(e) => {
                                          const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                                          updateAttendeeCustomAnswer(idx, qId, digits);
                                        }}
                                        className={`w-full text-sm font-mono border rounded-xl px-3 py-2 bg-white outline-none focus:ring-2 ${
                                          fieldError ? "border-rose-400 focus:ring-rose-200" : "border-gray-300 focus:ring-indigo-200"
                                        }`}
                                      />
                                    )}

                                    {/* File Upload / Photo Document */}
                                    {qType === "file_upload" && (
                                      <div>
                                        {currentVal ? (
                                          <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-xl border border-gray-200">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                              src={currentVal}
                                              alt="Document"
                                              className="w-12 h-12 rounded-lg object-cover border border-gray-200 bg-white shrink-0"
                                            />
                                            <span className="text-xs font-bold text-gray-700 flex-1 truncate">Document Uploaded</span>
                                            <button
                                              type="button"
                                              onClick={() => updateAttendeeCustomAnswer(idx, qId, "")}
                                              className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer"
                                            >
                                              <Trash2 size={13} />
                                            </button>
                                          </div>
                                        ) : (
                                          <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 hover:border-indigo-400 rounded-xl cursor-pointer bg-white transition-colors">
                                            <Upload size={14} className="text-gray-400" />
                                            <span className="text-xs font-bold text-gray-600">
                                              {placeholder || "Upload photo / ID document"}
                                            </span>
                                            <input
                                              type="file"
                                              accept="image/*"
                                              className="hidden"
                                              onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (!file) return;
                                                try {
                                                  const compressed = await compressImageFile(file);
                                                  updateAttendeeCustomAnswer(idx, qId, compressed);
                                                } catch {
                                                  const reader = new FileReader();
                                                  reader.onload = () => {
                                                    if (typeof reader.result === "string") {
                                                      updateAttendeeCustomAnswer(idx, qId, reader.result);
                                                    }
                                                  };
                                                  reader.readAsDataURL(file);
                                                }
                                              }}
                                            />
                                          </label>
                                        )}
                                      </div>
                                    )}

                                    {/* Dropdown */}
                                    {qType === "dropdown" && (
                                      <select
                                        value={currentVal}
                                        onChange={(e) => updateAttendeeCustomAnswer(idx, qId, e.target.value)}
                                        className={`w-full text-sm border rounded-xl px-3 py-2 bg-white outline-none focus:ring-2 ${
                                          fieldError ? "border-rose-400 focus:ring-rose-200" : "border-gray-300 focus:ring-indigo-200"
                                        }`}
                                      >
                                        <option value="">{placeholder || "Select an option..."}</option>
                                        {options.map((opt: string, optIdx: number) => (
                                          <option key={optIdx} value={opt}>{opt}</option>
                                        ))}
                                      </select>
                                    )}

                                    {/* Radio */}
                                    {qType === "radio" && (
                                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                                        {options.map((opt: string, optIdx: number) => (
                                          <button
                                            key={optIdx}
                                            type="button"
                                            onClick={() => updateAttendeeCustomAnswer(idx, qId, opt)}
                                            className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                                              currentVal === opt
                                                ? "bg-indigo-600 text-white border-indigo-600"
                                                : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
                                            }`}
                                          >
                                            {opt}
                                          </button>
                                        ))}
                                      </div>
                                    )}

                                    {/* Textarea */}
                                    {qType === "textarea" && (
                                      <textarea
                                        rows={2}
                                        value={currentVal}
                                        onChange={(e) => updateAttendeeCustomAnswer(idx, qId, e.target.value)}
                                        placeholder={placeholder || "Your answer"}
                                        className={`w-full text-sm border rounded-xl px-3 py-2 bg-white outline-none focus:ring-2 resize-none ${
                                          fieldError ? "border-rose-400 focus:ring-rose-200" : "border-gray-300 focus:ring-indigo-200"
                                        }`}
                                      />
                                    )}

                                    {/* Fallback Text / Number / Date */}
                                    {(qType === "text" || qType === "number" || qType === "date") && (
                                      <input
                                        type={qType}
                                        value={currentVal}
                                        onChange={(e) => updateAttendeeCustomAnswer(idx, qId, e.target.value)}
                                        placeholder={placeholder || qText}
                                        className={`w-full text-sm border rounded-xl px-3 py-2 bg-white outline-none focus:ring-2 ${
                                          fieldError ? "border-rose-400 focus:ring-rose-200" : "border-gray-300 focus:ring-indigo-200"
                                        }`}
                                      />
                                    )}

                                    {fieldError && (
                                      <p className="text-[10px] text-rose-600 font-bold mt-0.5">{fieldError}</p>
                                    )}
                                    {helpText && !fieldError && (
                                      <span className="text-[10px] text-gray-400 block">{helpText}</span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </form>
            )}

            {/* ─── STEP 2: Payment ──────────────────────────────────── */}
            {step === "payment" && !isFree && (
              <div className="p-5 space-y-5">
                {globalError && (
                  <div className="flex items-center gap-2 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-4 py-3 rounded-2xl">
                    <AlertCircle size={14} className="shrink-0" />
                    {globalError}
                  </div>
                )}

                {/* Order Summary */}
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-2">
                  <p className="text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-3">Order Summary</p>
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>{tier.name} × {slabSize} people</span>
                    <span className="font-bold">₹{totalPrice.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>₹{pricePerPerson.toLocaleString("en-IN")} × {slabSize} attendees</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between text-sm font-extrabold text-gray-900">
                    <span>Total</span>
                    <span className="text-indigo-700">₹{totalPrice.toLocaleString("en-IN")}</span>
                  </div>
                </div>

                {/* UPI Instructions */}
                {upiId && (
                  <div className="space-y-3">
                    <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <QrCode size={16} className="text-indigo-600" />
                        <p className="text-xs font-extrabold text-indigo-900">Pay via UPI</p>
                      </div>
                      <div className="bg-white border border-indigo-200 rounded-xl p-3 flex items-center justify-between">
                        <div>
                          <p className="text-[10px] text-gray-400 font-semibold">UPI ID</p>
                          <p className="text-sm font-extrabold text-gray-900 font-mono">{upiId}</p>
                          {upiPayeeName && (
                            <p className="text-[11px] text-gray-500">{upiPayeeName}</p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => navigator.clipboard.writeText(upiId)}
                          className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                        >
                          <Copy size={11} /> Copy
                        </button>
                      </div>
                      <p className="text-[11px] text-indigo-700 leading-relaxed">
                        Send <strong>₹{totalPrice.toLocaleString("en-IN")}</strong> to the UPI ID above, then paste your 12-digit UTR reference below.
                      </p>
                    </div>

                    {/* UTR Input */}
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1.5">
                        UPI UTR / Transaction ID *
                      </label>
                      <input
                        type="text"
                        value={utrInput}
                        onChange={(e) => setUtrInput(e.target.value)}
                        placeholder="12-digit UTR reference number"
                        maxLength={50}
                        className="w-full text-sm border border-gray-300 rounded-xl px-3 py-2.5 bg-white outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 font-mono"
                      />
                      <p className="text-[10px] text-gray-400 mt-1">
                        Found in your UPI app under transaction history.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ─── STEP 3: Success ──────────────────────────────────── */}
            {step === "success" && successData && (
              <div className="p-8 text-center space-y-5">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 280, damping: 20, delay: 0.1 }}
                  className="w-20 h-20 rounded-full bg-emerald-100 border-4 border-emerald-200 flex items-center justify-center mx-auto"
                >
                  <CheckCircle2 size={36} className="text-emerald-600" />
                </motion.div>

                <div className="space-y-2">
                  <h3 className="text-lg font-extrabold text-gray-900">Group Booking Confirmed!</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {isFree
                      ? `${successData.ticketCount} QR passes have been generated. Each attendee will receive their pass by email.`
                      : `Your payment details have been submitted. Once verified, each attendee will receive their personal QR pass by email.`}
                  </p>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-left space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500 font-semibold">Order Number</span>
                    <span className="font-extrabold text-gray-900 font-mono">{successData.orderNumber}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500 font-semibold">Attendees</span>
                    <span className="font-extrabold text-gray-900">{successData.ticketCount} people</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500 font-semibold">Event</span>
                    <span className="font-bold text-gray-700 text-right max-w-[180px] truncate">{event.title}</span>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 text-[11px] text-gray-400">
                  <ShieldCheck size={13} className="text-emerald-500" />
                  Check your tickets at <strong>/tickets</strong>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold text-sm py-3.5 rounded-2xl transition-colors cursor-pointer"
                >
                  Done
                </button>
              </div>
            )}
          </div>

          {/* ── Sticky Footer Actions ────────────────────────────────── */}
          {step !== "success" && (
            <div className="px-5 py-4 border-t border-gray-100 bg-white shrink-0 space-y-3">
              {/* Price summary strip */}
              <div className="flex items-center justify-between text-xs">
                <div className="text-gray-500">
                  <span className="font-bold text-gray-900">{slabSize} attendees</span> · {isFree ? "Free" : `₹${pricePerPerson.toLocaleString("en-IN")}/person`}
                </div>
                <div className="text-sm font-extrabold text-indigo-700">
                  {isFree ? "Free" : `₹${totalPrice.toLocaleString("en-IN")} total`}
                </div>
              </div>

              {/* CTA */}
              {step === "details" && (
                <button
                  type="submit"
                  form="attendees-form"
                  disabled={!allFilled || submitting}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-extrabold text-sm py-3.5 rounded-2xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <><Loader2 size={16} className="animate-spin" /> Processing…</>
                  ) : isFree ? (
                    <><CheckCircle2 size={16} /> Confirm All {slabSize} Attendees</>
                  ) : (
                    <><CreditCard size={16} /> Continue to Payment</>
                  )}
                </button>
              )}

              {step === "payment" && !isFree && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setStep("details")}
                    className="px-4 py-3 rounded-2xl border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmitOrder}
                    disabled={!utrInput.trim() || submitting}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-extrabold text-sm py-3.5 rounded-2xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <><Loader2 size={16} className="animate-spin" /> Submitting…</>
                    ) : (
                      <><ShieldCheck size={16} /> Submit Group Booking</>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
