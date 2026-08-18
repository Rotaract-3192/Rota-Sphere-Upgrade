import Link from "next/link";
import {
  FileText,
  ShieldCheck,
  RefreshCw,
  CalendarX,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ArrowRight,
  HelpCircle,
  Users,
} from "lucide-react";
import { LastUpdatedBadge } from "@/components/ui/LastUpdatedBadge";

export const metadata = {
  title: "Cancellation Policy | RotaSphere District 3192",
  description:
    "Official ticket cancellation, delegate pass transfer, and event postponement rules for Rotaract District 3192 events.",
};

export default function CancellationPolicyPage() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24 transition-colors">
      {/* ── 1. HERO HEADER ──────────────────────────────────────────────── */}
      <section className="bg-gray-900 text-white py-16 sm:py-20 px-4 sm:px-6 lg:px-8 text-center relative overflow-hidden">
        <div className="w-full max-w-3xl mx-auto space-y-4 relative z-10">
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <span className="text-xs font-black uppercase tracking-widest text-[#60a5fa] bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full inline-flex items-center gap-1.5">
              <CalendarX size={14} /> Ticket Cancellation Terms
            </span>
            <LastUpdatedBadge date="2026-08-18" label="Policy updated" />
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            Event Cancellation Policy
          </h1>
          <p className="text-sm sm:text-base text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Transparent cancellation windows, free delegate pass transfers, and organizer postponement protections across Rotaract District 3192 events.
          </p>
        </div>
      </section>

      {/* ── 2. MAIN POLICY CONTENT ──────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 space-y-8 text-gray-800 dark:text-gray-200 text-xs sm:text-sm leading-relaxed">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 sm:p-10 shadow-xs space-y-10">
          
          {/* Section 1: Overview */}
          <div className="space-y-3">
            <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="text-[#1e9df1]" size={20} /> 1. Transparent Cancellation Governance
            </h2>
            <p>
              RotaSphere enforces clear, upfront cancellation terms for every event. Because RotaSphere hosts a wide spectrum of events—ranging from community service initiatives and professional summits to district conferences—<strong>each event publishes its specific cancellation terms directly on the event booking page before checkout.</strong>
            </p>
          </div>

          {/* Section 2: Standard Attendee Cancellation Rules */}
          <div className="border-t border-gray-100 dark:border-gray-800 pt-8 space-y-4">
            <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
              <Clock className="text-amber-600" size={20} /> 2. Attendee-Initiated Cancellation Tiers
            </h2>
            <p>Unless an organizer specifies a stricter policy on the event page, the standard District 3192 cancellation tiers apply:</p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 space-y-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                  Standard Window
                </span>
                <h3 className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm">48+ Hours Prior</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Cancellations submitted more than 48 hours before event start are eligible for a 100% full refund (less gateway processing if applicable).
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 space-y-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                  Late Window
                </span>
                <h3 className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm">24 – 48 Hours Prior</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Subject to organizer discretion. Delegate substitution is strongly recommended.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 space-y-1.5">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-800 dark:text-rose-300">
                  Cutoff Window
                </span>
                <h3 className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm">&lt; 24 Hours Prior</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Non-refundable due to finalized venue catering and kit printing, unless due to emergency medical circumstances.
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Complimentary Ticket Transfer */}
          <div className="border-t border-gray-100 dark:border-gray-800 pt-8 space-y-3">
            <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
              <RefreshCw className="text-emerald-600" size={20} /> 3. Zero-Cost Delegate Pass Transfers
            </h2>
            <p>
              If you cannot attend an event, you don&apos;t have to lose your registration! RotaSphere provides a <strong>100% Free Pass Transfer feature</strong>:
            </p>
            <ol className="list-decimal pl-5 space-y-1.5 text-gray-600 dark:text-gray-400">
              <li>Log in and navigate to <Link href="/tickets" className="text-[#1e9df1] font-bold hover:underline">My Passes (/tickets)</Link>.</li>
              <li>Locate your confirmed ticket card and click <strong>Transfer Pass</strong>.</li>
              <li>Enter the recipient&apos;s registered email address. The original QR code is instantly deactivated and a fresh, authenticated QR pass is generated for the new delegate.</li>
            </ol>
          </div>

          {/* Section 4: Organizer Postponements & Force Majeure */}
          <div className="border-t border-gray-100 dark:border-gray-800 pt-8 space-y-3">
            <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="text-rose-600" size={20} /> 4. Organizer Postponements, Rescheduling &amp; Force Majeure
            </h2>
            <p>
              If an event is cancelled by the Host Rotaract Club or District Secretariat due to adverse weather, administrative directives, or force majeure:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-gray-600 dark:text-gray-400">
              <li><strong>Event Cancellation:</strong> 100% of all registered delegates will automatically receive a full refund without any administrative deductions.</li>
              <li><strong>Event Rescheduling:</strong> Existing tickets automatically carry forward to the rescheduled date. If a delegate cannot attend on the revised date, they can request a 100% full refund within 7 days of the date announcement.</li>
            </ul>
          </div>

          {/* Section 5: Configurable Organizer Policy Models */}
          <div className="border-t border-gray-100 dark:border-gray-800 pt-8 space-y-3">
            <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
              <Users className="text-purple-600" size={20} /> 5. Organizer Policy Standards in Event Studio
            </h2>
            <p>
              Organizers creating events on RotaSphere can select one of the standardized district cancellation templates:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400">
              <li><strong>Option A (Flexible):</strong> Full 100% refund up to 24 hours prior to the event.</li>
              <li><strong>Option B (Moderate):</strong> Full refund up to 7 days prior; 50% refund up to 48 hours prior.</li>
              <li><strong>Option C (Strict):</strong> Full refund up to 14 days prior; non-refundable thereafter.</li>
              <li><strong>Option D (Non-Refundable):</strong> No refunds permitted (delegate pass transfer allowed anytime).</li>
            </ul>
            <p className="text-xs text-gray-500 pt-1">
              Organizers are legally prohibited from modifying or tightening cancellation policies post ticket issuance.
            </p>
          </div>

          {/* Contact / Help Desk */}
          <div className="border-t border-gray-100 dark:border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white">Need to cancel or transfer a pass?</h3>
              <p className="text-xs text-gray-500">Visit your passes dashboard or contact the support desk.</p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/tickets"
                className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold text-xs px-5 py-3 rounded-2xl transition-colors cursor-pointer"
              >
                My Passes
              </Link>
              <Link
                href="/refund-policy"
                className="bg-[#1e9df1] hover:bg-[#1583cd] text-white font-extrabold text-xs px-6 py-3 rounded-2xl shadow-md flex items-center gap-2 cursor-pointer transition-all active:scale-95 shrink-0"
              >
                View Refund Policy <ArrowRight size={14} />
              </Link>
            </div>
          </div>

        </div>
      </section>
    </main>
  );
}
