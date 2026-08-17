import { DollarSign, ShieldCheck, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Refund Policy | RotaSphere District 3192",
  description: "Direct UPI payment refund guidelines and non-profit settlement terms for Rotaract District 3192.",
};

export default function RefundPolicyPage() {
  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      <section className="bg-gray-900 text-white py-14 sm:py-20 px-4 sm:px-6 lg:px-8 text-center relative overflow-hidden">
        <div className="max-w-3xl mx-auto space-y-4 relative z-10">
          <span className="text-xs font-black uppercase tracking-widest text-[#60a5fa] inline-flex items-center gap-1.5">
            <DollarSign size={14} /> Settlement Transparency
          </span>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            Refund &amp; Settlement Policy
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 max-w-xl mx-auto leading-relaxed">
            Understanding 100% Direct UPI Settlement to host Rotaract Clubs and refund processing workflows.
          </p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 space-y-8 text-gray-800 text-xs sm:text-sm leading-relaxed">
        <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-10 shadow-xs space-y-6">
          <div className="space-y-3">
            <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
              <ShieldCheck className="text-emerald-600" size={20} /> 1. Non-Profit Direct Settlement Model
            </h2>
            <p>
              Rotaract District 3192 operates under a strictly non-profit community model. When you book a pass on RotaSphere, 100% of your payment is transferred directly into the bank account of the host Rotaract Club via UPI (GPay, PhonePe, Paytm). RotaSphere does not store attendee funds or charge convenience markups.
            </p>
          </div>

          <div className="border-t border-gray-100 pt-6 space-y-3">
            <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
              <CheckCircle2 className="text-[#1e9df1]" size={20} /> 2. Eligible Refund Conditions
            </h2>
            <p>Refunds are processed under the following scenarios:</p>
            <ul className="list-disc pl-5 space-y-2 text-gray-600">
              <li><strong>Event Cancellation:</strong> Complete cancellation of the event by the host club or District Secretariat.</li>
              <li><strong>Event Postponement:</strong> Rescheduling of event dates where the delegate cannot attend on the revised date.</li>
              <li><strong>Duplicate UTR Payment:</strong> Accidental double payment for the same ticket tier.</li>
              <li><strong>Approved Organizer Cancellation:</strong> Cancellation submitted and approved by the organizer at least 48 hours prior to the event.</li>
            </ul>
          </div>

          <div className="border-t border-gray-100 pt-6 space-y-3">
            <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
              <AlertCircle className="text-amber-600" size={20} /> 3. How to Request a Refund
            </h2>
            <ol className="list-decimal pl-5 space-y-2 text-gray-600">
              <li>Log in to your RotaSphere account and navigate to <code>My Passes (/tickets)</code>.</li>
              <li>Locate your confirmed ticket and click <strong>Request Refund</strong>.</li>
              <li>Select your reason for refund and submit the request.</li>
              <li>The host organizer will verify your payment UTR and initiate a direct UPI refund to your original payment account within 3-5 business days.</li>
            </ol>
          </div>

          <div className="border-t border-gray-100 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-gray-900">Need help with a pending refund?</h3>
              <p className="text-xs text-gray-500">Contact the District Ombudsman for refund assistance.</p>
            </div>
            <Link
              href="/contact"
              className="bg-[#1e9df1] hover:bg-[#1583cd] text-white font-extrabold text-xs px-6 py-3 rounded-2xl shadow-md flex items-center gap-2 cursor-pointer transition-all active:scale-95 shrink-0"
            >
              Contact Support <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
