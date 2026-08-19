"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Mail,
  Phone,
  MapPin,
  Send,
  CheckCircle2,
  Shield,
  Clock,
  Building,
  CreditCard,
  Lock,
  HelpCircle,
  Gavel,
  ArrowRight,
} from "lucide-react";
import { LastUpdatedBadge } from "@/components/ui/LastUpdatedBadge";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [ticketNumber, setTicketNumber] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    category: "Pass Booking / UTR Query",
    orderId: "",
    ticketId: "",
    message: "",
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;

    const randomNum = Math.floor(100000 + Math.random() * 900000);
    const generatedCase = `CASE-2026-${randomNum}`;
    setTicketNumber(generatedCase);
    setSubmitted(true);
  }

  const CONTACT_CHANNELS = [
    {
      label: "General Support",
      email: "tech.rotaract3192@gmail.com",
      desc: "Ticket passes, app assistance, and general inquiries",
      icon: HelpCircle,
      color: "text-[#0758fc] bg-blue-50 dark:bg-blue-950/50",
    },
    {
      label: "Payments & Refunds",
      email: "tech.rotaract3192@gmail.com",
      desc: "Payment reconciliations, duplicate debits, and refund status",
      icon: CreditCard,
      color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50",
    },
    {
      label: "Grievance Officer",
      email: "tech.rotaract3192@gmail.com",
      desc: "Statutory DPDP Act & IT Act consumer grievance redressal",
      icon: Gavel,
      color: "text-purple-600 bg-purple-50 dark:bg-purple-950/50",
    },
    {
      label: "Data Privacy Desk",
      email: "tech.rotaract3192@gmail.com",
      desc: "DPDP rights, data export requests, and erasure filings",
      icon: Lock,
      color: "text-amber-600 bg-amber-50 dark:bg-amber-950/50",
    },
    {
      label: "Organizer & Club Studio",
      email: "tech.rotaract3192@gmail.com",
      desc: "District event approvals, ticket studio, and gate scanner setup",
      icon: Building,
      color: "text-rose-600 bg-rose-50 dark:bg-rose-950/50",
    },
  ];

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24 transition-colors">
      {/* ── 1. HERO HEADER ──────────────────────────────────────────────── */}
      <section className="bg-gray-900 text-white py-16 sm:py-20 px-4 sm:px-6 lg:px-8 text-center relative overflow-hidden">
        <div className="w-full max-w-3xl mx-auto space-y-4 relative z-10">
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <span className="text-xs font-black uppercase tracking-widest text-[#60a5fa] bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full inline-flex items-center gap-1.5">
              <Mail size={14} /> District Secretariat Support Desk
            </span>
            <LastUpdatedBadge date="2026-08-18" label="Desk active" />
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            Contact Support &amp; Grievances
          </h1>
          <p className="text-sm sm:text-base text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Reach our dedicated support desks for event passes, UPI payments, organizer tools, and statutory DPDP grievance redressal.
          </p>
        </div>
      </section>

      {/* ── 2. DEDICATED CHANNELS GRID ──────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CONTACT_CHANNELS.map((ch) => (
            <div
              key={ch.email}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-5 shadow-xs space-y-2.5"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${ch.color}`}>
                  <ch.icon size={18} />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block">
                    {ch.label}
                  </span>
                  <a
                    href={`mailto:${ch.email}`}
                    className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white hover:text-[#0758fc] transition-colors"
                  >
                    {ch.email}
                  </a>
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                {ch.desc}
              </p>
            </div>
          ))}

          {/* Registered Office Tile */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-5 shadow-xs space-y-2.5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 text-slate-700 bg-slate-100 dark:bg-slate-800">
                <MapPin size={18} />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 block">
                  District Secretariat
                </span>
                <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">
                  Bengaluru, Karnataka, India
                </span>
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              District Secretariat, Rotaract District 3192, Bengaluru, Karnataka 560001
            </p>
          </div>
        </div>
      </section>

      {/* ── 3. FORM & GRIEVANCE OFFICER SECTION ──────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Grievance Officer & Statutory Info */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
              <div className="flex items-center gap-2">
                <Shield size={20} className="text-[#0758fc]" />
                <h3 className="font-black text-base text-gray-900 dark:text-white">
                  Statutory Grievance Redressal
                </h3>
              </div>

              <div className="space-y-3 text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                <p>
                  Under the <strong>Digital Personal Data Protection Act, 2023</strong> and the <strong>Information Technology (Intermediary Guidelines) Rules</strong>, any user may register a grievance with our designated officer:
                </p>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-1.5 font-medium">
                  <p><strong>Grievance Desk:</strong> Rotaract District 3192 Tech Team</p>
                  <p><strong>Designation:</strong> District Redressal &amp; Governance Desk</p>
                  <p><strong>Email:</strong> <a href="mailto:tech.rotaract3192@gmail.com" className="text-[#0758fc] underline">tech.rotaract3192@gmail.com</a></p>
                  <p><strong>Acknowledgement SLA:</strong> Within 24 Hours</p>
                  <p><strong>Resolution SLA:</strong> Within 15 Business Days</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-900 to-slate-900 text-white rounded-3xl p-6 shadow-md space-y-3">
              <div className="flex items-center gap-2">
                <Clock size={18} className="text-[#60a5fa]" />
                <h4 className="font-bold text-sm">Response Time SLA</h4>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">
                Support cases submitted via this portal are automatically acknowledged with a tracking ID and reviewed by our secretariat within 24 hours.
              </p>
            </div>
          </div>

          {/* Right Column: Support Form */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 sm:p-10 shadow-xs space-y-6">
              <div>
                <h2 className="text-xl font-black text-gray-900 dark:text-white">
                  Submit a Support Case / Grievance
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Fill out the details below to generate an official case ticket.
                </p>
              </div>

              {submitted ? (
                <div className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300 rounded-3xl p-8 text-center space-y-4 animate-in fade-in duration-200">
                  <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/80 text-emerald-600 dark:text-emerald-300 rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <CheckCircle2 size={30} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-black text-gray-900 dark:text-white">
                      Support Case Generated Successfully!
                    </h3>
                    <p className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400">
                      Tracking Reference ID: {ticketNumber}
                    </p>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
                    Thank you, {formData.name}. A confirmation receipt has been sent to <strong>{formData.email}</strong>. Our support desk will follow up within 24 hours.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({
                        name: "",
                        email: "",
                        phone: "",
                        category: "Pass Booking / UTR Query",
                        orderId: "",
                        ticketId: "",
                        message: "",
                      });
                    }}
                    className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200 font-bold text-xs px-6 py-2.5 rounded-xl shadow-xs cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    Submit Another Inquiry
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Rahul Sharma"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-[#0758fc] focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="e.g. rahul@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-[#0758fc] focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                        Mobile Phone Number
                      </label>
                      <input
                        type="tel"
                        placeholder="e.g. +91 98765 43210"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-[#0758fc] focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                        Issue Category *
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-[#0758fc] focus:outline-hidden"
                      >
                        <option value="Pass Booking / UTR Query">Pass Booking / UTR Payment Verification</option>
                        <option value="Payment Failure / Duplicate Charge">Payment Failure / Duplicate Charge</option>
                        <option value="Refund Request">Refund Request Status</option>
                        <option value="QR Gate Entry Issue">QR Gate Entry Issue</option>
                        <option value="Privacy / DPDP Request">Privacy / DPDP Data Request</option>
                        <option value="Organizer Access / Event Studio">Organizer Access / Event Studio</option>
                        <option value="Formal Grievance">Formal Consumer Grievance</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                        Order ID (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. ORD-94812"
                        value={formData.orderId}
                        onChange={(e) => setFormData({ ...formData, orderId: e.target.value })}
                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2 text-gray-900 dark:text-white font-medium"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                        Ticket ID / UTR (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. TKT-8291 or 12-digit UTR"
                        value={formData.ticketId}
                        onChange={(e) => setFormData({ ...formData, ticketId: e.target.value })}
                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2 text-gray-900 dark:text-white font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                      Detailed Message / Description *
                    </label>
                    <textarea
                      rows={5}
                      required
                      placeholder="Please provide complete context regarding your inquiry, transaction timestamps, or event name..."
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-[#0758fc] focus:outline-hidden"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full bg-[#0758fc] hover:bg-[#054fe0] text-white font-extrabold text-xs py-3.5 rounded-2xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Send size={15} /> Submit Support Case (Generate Tracking ID)
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
