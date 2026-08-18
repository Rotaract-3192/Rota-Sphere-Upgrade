import Link from "next/link";
import {
  DollarSign,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Clock,
  RefreshCw,
  CreditCard,
  Building,
  HelpCircle,
  FileText,
} from "lucide-react";
import { LastUpdatedBadge } from "@/components/ui/LastUpdatedBadge";

export const metadata = {
  title: "Refund Policy & Settlement Terms | RotaSphere District 3192",
  description:
    "Comprehensive Refund Policy, banking timelines, automatic refund triggers, failed payment reconciliations, and dispute guidance on RotaSphere.",
};

export default function RefundPolicyPage() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24 transition-colors">
      {/* ── 1. HERO HEADER ──────────────────────────────────────────────── */}
      <section className="bg-gray-900 text-white py-16 sm:py-20 px-4 sm:px-6 lg:px-8 text-center relative overflow-hidden">
        <div className="w-full max-w-3xl mx-auto space-y-4 relative z-10">
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <span className="text-xs font-black uppercase tracking-widest text-[#60a5fa] bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full inline-flex items-center gap-1.5">
              <DollarSign size={14} /> Settlement &amp; Refund Framework
            </span>
            <LastUpdatedBadge date="2026-08-18" label="Policy updated" />
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            Refund &amp; Settlement Policy
          </h1>
          <p className="text-sm sm:text-base text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Understanding automatic refunds, organizer approvals, payment gateway reconciliation, and realistic banking turnaround times.
          </p>
        </div>
      </section>

      {/* ── 2. QUICK ACTION CALLOUT: PAYMENT ISSUE HELPER ────────────────── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-3xl p-6 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2 font-bold text-sm">
              <AlertCircle size={18} className="text-amber-600 dark:text-amber-400" />
              <span>Money debited but ticket not issued?</span>
            </div>
            <p className="text-xs text-amber-800/80 dark:text-amber-300/80 max-w-xl">
              Do not make repeated payments immediately! Bank servers reconcile within 24 hours. Submit a payment trace request if your pass is not generated.
            </p>
          </div>
          <Link
            href="/disputes"
            className="bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs px-5 py-3 rounded-2xl shadow-sm transition-all active:scale-95 shrink-0"
          >
            Report Payment Issue
          </Link>
        </div>
      </section>

      {/* ── 3. MAIN POLICY CONTENT ──────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8 text-gray-800 dark:text-gray-200 text-xs sm:text-sm leading-relaxed">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 sm:p-10 shadow-xs space-y-10">
          
          {/* Section 1: Non-Profit Direct Settlement Model */}
          <div className="space-y-3">
            <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="text-[#0758fc]" size={20} /> 1. Overview of Platform Payment Models
            </h2>
            <p>
              RotaSphere operates on a <strong>Direct Non-Profit UPI Settlement Model (0% platform fee)</strong> directly to verified host Rotaract Club bank accounts via dynamic QR codes and instant UPI banking handles. 
            </p>
            <p>
              Because payments flow directly into chartered club accounts, refunds are processed according to standard UPI reverse settlement protocols, banking guidelines, and organizer reconciliation.
            </p>
          </div>

          {/* Section 2: Automatic vs Manual Refunds */}
          <div className="border-t border-gray-100 dark:border-gray-800 pt-8 space-y-4">
            <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="text-emerald-600" size={20} /> 2. Eligible Refund Categories
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 space-y-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Automated Triggers
                </span>
                <h3 className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm">Automatic Refunds</h3>
                <ul className="list-disc pl-4 space-y-1 text-xs text-gray-600 dark:text-gray-400">
                  <li><strong>Event Cancellation:</strong> If an event is cancelled by the host club or District Secretariat.</li>
                  <li><strong>Duplicate Transaction:</strong> Accidental double charge for the same ticket tier.</li>
                  <li><strong>Gateway Failure:</strong> Payment debited at bank but checkout timed out without ticket creation.</li>
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 space-y-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#0758fc]">
                  Discretionary Triggers
                </span>
                <h3 className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm">Organizer-Approved Refunds</h3>
                <ul className="list-disc pl-4 space-y-1 text-xs text-gray-600 dark:text-gray-400">
                  <li><strong>Eligible Cancellation:</strong> Attendee cancellation submitted prior to the event&apos;s cancellation deadline.</li>
                  <li><strong>Event Rescheduling:</strong> Inability to attend on a revised date following event postponement.</li>
                  <li><strong>Emergency Medical Case:</strong> Verified extenuating medical circumstances approved by the organizer.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Section 3: Realistic Banking Timelines */}
          <div className="border-t border-gray-100 dark:border-gray-800 pt-8 space-y-4">
            <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
              <Clock className="text-amber-600" size={20} /> 3. Realistic Refund Turnaround Timelines
            </h2>
            <p>
              Once a refund is initiated by RotaSphere or approved by the host organizer, the time required for funds to credit your bank account depends entirely on your original payment method and issuing bank:
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
                <thead className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-bold">
                  <tr>
                    <th className="p-3">Payment Method</th>
                    <th className="p-3">Platform Processing</th>
                    <th className="p-3">Expected Bank Settlement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800 text-gray-600 dark:text-gray-300">
                  <tr>
                    <td className="p-3 font-semibold text-gray-900 dark:text-white">UPI (GPay / PhonePe / Paytm / BHIM)</td>
                    <td className="p-3">24 Hours</td>
                    <td className="p-3 font-bold text-emerald-600 dark:text-emerald-400">1 to 3 Business Days</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-gray-900 dark:text-white">Debit Cards / Net Banking</td>
                    <td className="p-3">24 to 48 Hours</td>
                    <td className="p-3">3 to 5 Business Days</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-gray-900 dark:text-white">Credit Cards (Mastercard / Visa / RuPay)</td>
                    <td className="p-3">24 to 48 Hours</td>
                    <td className="p-3">5 to 7 Business Days</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-gray-900 dark:text-white">Direct Club UPI Transfer</td>
                    <td className="p-3">Club Treasurer Verification</td>
                    <td className="p-3">3 to 5 Business Days</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-[11px] text-gray-500">
              * Note: National holidays, bank strikes, and weekend cycles may extend inter-bank clearing periods.
            </p>
          </div>

          {/* Section 4: Refund Lifecycle Tracking */}
          <div className="border-t border-gray-100 dark:border-gray-800 pt-8 space-y-3">
            <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
              <RefreshCw className="text-purple-600" size={20} /> 4. Real-Time Refund Status Tracking
            </h2>
            <p>
              Attendees can monitor their refund lifecycle directly from <Link href="/tickets" className="text-[#0758fc] font-bold hover:underline">My Passes (/tickets)</Link> or the <Link href="/disputes" className="text-[#0758fc] font-bold hover:underline">Dispute Desk</Link>:
            </p>
            <div className="flex flex-wrap items-center gap-2 text-xs py-2">
              <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-bold">
                1. Refund Requested
              </span>
              <span>→</span>
              <span className="px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 font-bold">
                2. Organizer / Platform Approved
              </span>
              <span>→</span>
              <span className="px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold">
                3. Bank Clearing In-Progress
              </span>
              <span>→</span>
              <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold">
                4. Completed &amp; Credited
              </span>
            </div>
          </div>

          {/* Section 5: Partial Refunds */}
          <div className="border-t border-gray-100 dark:border-gray-800 pt-8 space-y-3">
            <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
              <FileText className="text-rose-600" size={20} /> 5. Partial Refunds for Multi-Ticket Orders
            </h2>
            <p>
              If an order contains multiple tickets or optional session add-ons (e.g. Workshop + Gala Dinner), RotaSphere supports <strong>Itemized Partial Refunds</strong>:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400">
              <li>You can request cancellation and refund for individual attendee tickets without cancelling the entire group booking.</li>
              <li>Add-on cancellations release the specific seat quota while keeping main entry credentials active.</li>
            </ul>
          </div>

          {/* Section 6: Chargebacks and Support Escalation */}
          <div className="border-t border-gray-100 dark:border-gray-800 pt-8 space-y-3">
            <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
              <CreditCard className="text-blue-600" size={20} /> 6. Chargebacks &amp; Direct Resolution
            </h2>
            <p>
              We encourage delegates to reach out directly to RotaSphere Support or open a dispute ticket on our <Link href="/disputes" className="text-[#0758fc] font-bold hover:underline">Dispute Desk</Link> before initiating a formal bank chargeback. Our team investigates payment issues within 24 hours to ensure fair and expedited resolution without long banking dispute cycles.
            </p>
          </div>

          {/* Action Footer */}
          <div className="border-t border-gray-100 dark:border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white">Have a pending refund or payment query?</h3>
              <p className="text-xs text-gray-500">Submit a support case or view your active dispute tickets.</p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/disputes"
                className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold text-xs px-5 py-3 rounded-2xl transition-colors cursor-pointer"
              >
                Dispute Desk
              </Link>
              <Link
                href="/contact"
                className="bg-[#0758fc] hover:bg-[#054fe0] text-white font-extrabold text-xs px-6 py-3 rounded-2xl shadow-md flex items-center gap-2 cursor-pointer transition-all active:scale-95 shrink-0"
              >
                Contact Payments Desk <ArrowRight size={14} />
              </Link>
            </div>
          </div>

        </div>
      </section>
    </main>
  );
}
