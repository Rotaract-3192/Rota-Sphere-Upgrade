import { Gavel, ShieldAlert, CheckCircle2, Mail, ArrowRight } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Dispute Resolution & Audit | RotaSphere District 3192",
  description: "Official payment UTR verification dispute resolution procedure for Rotaract District 3192.",
};

export default function DisputeResolutionPage() {
  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      <section className="bg-gray-900 text-white py-14 sm:py-20 px-4 sm:px-6 lg:px-8 text-center relative overflow-hidden">
        <div className="max-w-3xl mx-auto space-y-4 relative z-10">
          <span className="text-xs font-black uppercase tracking-widest text-[#60a5fa] inline-flex items-center gap-1.5">
            <Gavel size={14} /> District Ombudsman
          </span>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            Dispute Resolution Procedure
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 max-w-xl mx-auto leading-relaxed">
            Fair audit mechanisms for payment UTR verification disputes, ticket access issues, and organizer compliance.
          </p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 space-y-8 text-gray-800 text-xs sm:text-sm leading-relaxed">
        <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-10 shadow-xs space-y-6">
          <div className="space-y-3">
            <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
              <ShieldAlert className="text-amber-600" size={20} /> 1. UTR Verification &amp; Payment Disputes
            </h2>
            <p>
              In the rare event that a submitted 12-digit UTR reference is marked as <code>REJECTED</code> by an event organizer despite a successful debit from your bank account:
            </p>
            <ol className="list-decimal pl-5 space-y-2 text-gray-600">
              <li>Open <code>My Passes (/tickets)</code> and click <strong>Update UTR</strong> to verify your 12-digit transaction ID against your UPI bank statement or GPay/PhonePe receipt.</li>
              <li>If the issue remains unresolved, submit a formal dispute ticket to the District Secretariat via our <Link href="/contact" className="text-[#1e9df1] font-bold hover:underline">Contact Hub</Link>.</li>
              <li>Provide your UPI transaction screenshot showing the timestamp, debited amount, and UTR number.</li>
            </ol>
          </div>

          <div className="border-t border-gray-100 pt-6 space-y-3">
            <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
              <CheckCircle2 className="text-emerald-600" size={20} /> 2. District Ombudsman Escalation SLA
            </h2>
            <p>
              All escalated payment disputes are independently audited by the Rotaract District 3192 Super Administrator within <strong>24 hours</strong>. If your UPI transfer is verified against the host club&apos;s bank statement, your ticket will be elevated to <code>ISSUED</code> status immediately by the Super Admin.
            </p>
          </div>

          <div className="border-t border-gray-100 pt-6 space-y-3">
            <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
              <Mail className="text-purple-600" size={20} /> 3. Direct Ombudsman Contact
            </h2>
            <p className="text-gray-600">
              For urgent escalations during live event gate check-ins, email the District Secretariat directly at <strong>thejaswinps@gmail.com</strong> with the subject line <code>[URGENT DISPUTE] - Ticket #ID</code>.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
