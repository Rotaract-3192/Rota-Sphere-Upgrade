"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search,
  HelpCircle,
  Ticket,
  QrCode,
  ShieldCheck,
  RefreshCw,
  CreditCard,
  Lock,
  Building,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  ExternalLink,
  MessageSquare,
} from "lucide-react";

interface FAQItem {
  q: string;
  a: string;
  category: "attendees" | "organizers" | "payments" | "privacy" | "security";
}

const ALL_FAQS: FAQItem[] = [
  // ATTENDEES
  {
    category: "attendees",
    q: "How do I purchase a ticket or pass on RotaSphere?",
    a: "Browse upcoming events from the Events Discovery page, select your desired event, choose your ticket tier (e.g., Early Bird, General, VIP), fill out the required registration details, and proceed to checkout using Instant UPI (GPay, PhonePe, Paytm, BHIM).",
  },
  {
    category: "attendees",
    q: "Where can I find and download my scannable Gate QR Pass?",
    a: "Log in and navigate to 'My Passes' (/tickets). Click 'Download Pass' on your ticket card to save a high-contrast digital badge with your unique, dynamic QR code.",
  },
  {
    category: "attendees",
    q: "Why is my QR code showing 'Pending Verification'?",
    a: "If you paid via Direct Club UPI, your submitted 12-digit UTR number must be validated by the host club organizer. Once approved, your dynamic QR code unlocks immediately.",
  },
  {
    category: "attendees",
    q: "Can I transfer my pass to another member or friend?",
    a: "Yes! RotaSphere offers 100% free pass transfers. Open 'My Passes' (/tickets), click 'Transfer Pass', and enter the recipient's registered email address. The original QR code is deactivated and a fresh pass is issued to the recipient.",
  },
  {
    category: "attendees",
    q: "How do I cancel my booking and request a refund?",
    a: "Go to 'My Passes' (/tickets), click 'Request Refund', and select your reason. Your request will be processed in accordance with the event's Cancellation & Refund Policy.",
  },
  {
    category: "attendees",
    q: "Money was debited from my bank account, but my order failed. What should I do?",
    a: "Do not pay twice immediately. Our automated reconciliation system checks pending transactions with the payment gateway every 15 minutes. If your pass is not generated within 2 hours, submit a quick trace on the Dispute Desk (/disputes).",
  },
  {
    category: "attendees",
    q: "I was charged twice for the same booking. How do I get a duplicate refund?",
    a: "Open a case on the Dispute Desk (/disputes) selecting 'Duplicate Payment'. Once verified against the gateway ledger, the extra charge is automatically refunded to your source payment method.",
  },

  // ORGANIZERS
  {
    category: "organizers",
    q: "How do I get organizer access to host an event on RotaSphere?",
    a: "Rotaract Club Presidents, Secretaries, and Event Chairs can visit the Organizer Dashboard (/dashboard) and request host access by providing their Rotaract Club Name, designation, and district roster credentials.",
  },
  {
    category: "organizers",
    q: "How do I create multi-tier tickets (e.g., Early Bird, VIP, Combo)?",
    a: "From your Organizer Dashboard, open the Event Studio, navigate to 'Ticket Tiers', and configure pricing, tier capacity, max tickets per order, and sale start/end dates.",
  },
  {
    category: "organizers",
    q: "Can I create custom registration forms (e.g., college, dietary preference, T-shirt size)?",
    a: "Yes! The Event Studio includes a dynamic form builder where you can add required or optional custom fields tailored to your event logistics.",
  },
  {
    category: "organizers",
    q: "How does the venue Gate Check-in Scanner work?",
    a: "Event check-in volunteers can open the web-based Scanner (/check-in) on any smartphone or tablet. The camera reads the attendee's QR token and instantly verifies admission, preventing duplicate or counterfeit scans.",
  },
  {
    category: "organizers",
    q: "Can other clubs see my event attendee data?",
    a: "No. RotaSphere enforces strict PostgreSQL Row-Level Security (RLS) multi-tenant isolation. Organizers can only view and export delegate data for events hosted by their own club.",
  },
  {
    category: "organizers",
    q: "How do settlements and payout reconciliations work?",
    a: "For online payments, funds settle to the registered club bank account following event completion. For manual UPI workflows, payments settle 100% directly to the club's treasurer account.",
  },

  // PAYMENTS
  {
    category: "payments",
    q: "What payment methods are supported on RotaSphere?",
    a: "We support UPI (GPay, PhonePe, Paytm, BHIM, CRED), Credit/Debit Cards (Visa, Mastercard, RuPay), Net Banking across 50+ Indian banks, and Direct Club UPI Transfers.",
  },
  {
    category: "payments",
    q: "Are there any hidden convenience fees added at checkout?",
    a: "No. All ticket prices, platform fees, and statutory GST amounts are clearly itemized on the booking summary before you confirm payment.",
  },
  {
    category: "payments",
    q: "How long does a refund take to reflect in my bank account?",
    a: "UPI refunds typically credit within 1 to 3 business days. Credit/Debit card and Net Banking refunds take 3 to 7 business days depending on your issuing bank's clearing cycle.",
  },
  {
    category: "payments",
    q: "Where can I download my payment invoice / tax receipt?",
    a: "Navigate to 'My Passes' (/tickets) and click 'Download Invoice' on your booking card to get an itemized tax receipt with GST breakdown.",
  },

  // PRIVACY & DPDP
  {
    category: "privacy",
    q: "How does RotaSphere comply with the DPDP Act 2023?",
    a: "RotaSphere implements purpose-specific consent notices, granular marketing opt-outs, 7-year financial retention limits, right-to-erasure workflows, and a dedicated Grievance Officer.",
  },
  {
    category: "privacy",
    q: "How can I download a copy of all personal data held about me?",
    a: "Visit the Privacy Center (/privacy-center) and click 'Download My Data'. You will receive an export of your registration history, active passes, and profile records.",
  },
  {
    category: "privacy",
    q: "How do I request account deletion / data erasure?",
    a: "Go to the Privacy Center (/privacy-center), select the 'Account Deletion' tab, and submit an erasure request. Non-financial personal data will be hard-deleted or anonymized.",
  },
  {
    category: "privacy",
    q: "Who is the Grievance Officer and how can I contact them?",
    a: "Our designated Grievance Officer is Thejaswin P. S. You can reach the grievance desk directly at tech.rotaract3192@gmail.com.",
  },

  // SECURITY & GATE SAFETY
  {
    category: "security",
    q: "How are QR codes protected against screenshots and duplication?",
    a: "Every pass QR token is cryptographically signed with SHA-256 HMAC and linked to a single-use gate validation state. Duplicate scans at the venue trigger an immediate security alert.",
  },
  {
    category: "security",
    q: "What should I do if I suspect unauthorized access to my account?",
    a: "Immediately notify our security response team at tech.rotaract3192@gmail.com and update your authentication credentials via Clerk SSO.",
  },
  {
    category: "security",
    q: "How do I report a counterfeit or fraudulent event listing?",
    a: "Use our Contact Hub (/contact) or email tech.rotaract3192@gmail.com with the event URL. Fraudulent listings are taken down within 2 hours.",
  },
];

const CATEGORIES = [
  { id: "all", label: "All Topics", icon: HelpCircle },
  { id: "attendees", label: "Attendees & Passes", icon: Ticket },
  { id: "organizers", label: "Organizers & Studio", icon: Building },
  { id: "payments", label: "Payments & Refunds", icon: CreditCard },
  { id: "privacy", label: "Privacy & DPDP", icon: Lock },
  { id: "security", label: "Security & Gates", icon: ShieldCheck },
] as const;

export function HelpCenterClient() {
  const [selectedCat, setSelectedCat] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const filteredFaqs = ALL_FAQS.filter((faq) => {
    const matchesCat = selectedCat === "all" || faq.category === selectedCat;
    const matchesSearch =
      searchQuery.trim() === "" ||
      faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.a.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-10">
      {/* ── Search & Filter Controls ─────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-3.5 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search help topics (e.g. UTR payment, duplicate charge, download pass, QR scanner, DPDP data)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl pl-11 pr-4 py-3 text-xs sm:text-sm text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-[#0758fc] focus:outline-hidden"
          />
        </div>

        {/* Category Pill Filters */}
        <div className="flex flex-wrap gap-2 pt-1">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCat === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setSelectedCat(cat.id);
                  setOpenIndex(null);
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? "bg-[#0758fc] text-white shadow-md shadow-[#0758fc]/25"
                    : "bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-gray-400"
                }`}
              >
                <cat.icon size={14} />
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── FAQ Accordion List ───────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-2">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
            Showing {filteredFaqs.length} Answers
          </span>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-xs text-[#0758fc] hover:underline font-bold cursor-pointer"
            >
              Clear search
            </button>
          )}
        </div>

        {filteredFaqs.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-12 text-center space-y-3">
            <HelpCircle size={36} className="mx-auto text-gray-300" />
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              No matching help articles found
            </h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Can&apos;t find what you&apos;re looking for? Reach out directly to our District Secretariat support team.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-1.5 bg-[#0758fc] text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-sm mt-2"
            >
              Contact Support
            </Link>
          </div>
        ) : (
          filteredFaqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-xs transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full p-5 sm:p-6 text-left flex items-start sm:items-center justify-between gap-4 cursor-pointer hover:bg-gray-50/70 dark:hover:bg-gray-800/40 transition-colors"
                >
                  <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white leading-snug">
                    {faq.q}
                  </span>
                  <div className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 shrink-0">
                    {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 sm:px-6 pb-6 pt-1 text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed border-t border-gray-100 dark:border-gray-800 bg-gray-50/40 dark:bg-gray-800/20">
                    <p>{faq.a}</p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ── Quick Action Tiles ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
        <Link
          href="/tickets"
          className="p-5 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs hover:border-[#0758fc] transition-all space-y-2 group"
        >
          <Ticket size={22} className="text-[#0758fc] group-hover:scale-110 transition-transform" />
          <h4 className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white">My Passes</h4>
          <p className="text-xs text-gray-500">View, download, transfer, or cancel your active event tickets.</p>
        </Link>

        <Link
          href="/privacy-center"
          className="p-5 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs hover:border-emerald-500 transition-all space-y-2 group"
        >
          <Lock size={22} className="text-emerald-600 group-hover:scale-110 transition-transform" />
          <h4 className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white">Privacy Center</h4>
          <p className="text-xs text-gray-500">Manage DPDP consents, download personal data, or file privacy complaints.</p>
        </Link>

        <Link
          href="/disputes"
          className="p-5 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs hover:border-purple-500 transition-all space-y-2 group"
        >
          <ShieldCheck size={22} className="text-purple-600 group-hover:scale-110 transition-transform" />
          <h4 className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white">Dispute Desk</h4>
          <p className="text-xs text-gray-500">Track payment reconciliations and escalate gate entry issues.</p>
        </Link>

        <Link
          href="/dashboard"
          className="p-5 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xs hover:border-amber-500 transition-all space-y-2 group"
        >
          <Building size={22} className="text-amber-600 group-hover:scale-110 transition-transform" />
          <h4 className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white">Organizer Studio</h4>
          <p className="text-xs text-gray-500">Manage ticket tiers, custom registration forms, and scanner gates.</p>
        </Link>
      </div>
    </div>
  );
}
