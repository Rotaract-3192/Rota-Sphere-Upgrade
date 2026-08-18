import Link from "next/link";
import {
  Gavel,
  ShieldAlert,
  CheckCircle2,
  Mail,
  ArrowRight,
  Building,
  Scale,
  Users,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { DisputeDashboardClient } from "../disputes/DisputeDashboardClient";
import { LastUpdatedBadge } from "@/components/ui/LastUpdatedBadge";

export const metadata = {
  title: "Dispute Resolution & Ombudsman Desk | RotaSphere District 3192",
  description:
    "Multi-tier dispute resolution mechanism, payment trace audit, organizer mediation, and District Ombudsman procedure on RotaSphere.",
};

export default function DisputeResolutionPage() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24 transition-colors">
      {/* ── 1. HERO HEADER ──────────────────────────────────────────────── */}
      <section className="bg-gray-900 text-white py-16 sm:py-20 px-4 sm:px-6 lg:px-8 text-center relative overflow-hidden">
        <div className="w-full max-w-3xl mx-auto space-y-4 relative z-10">
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <span className="text-xs font-black uppercase tracking-widest text-[#60a5fa] bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full inline-flex items-center gap-1.5">
              <Gavel size={14} /> District Ombudsman &amp; Redressal
            </span>
            <LastUpdatedBadge date="2026-08-18" label="Procedure effective" />
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            Dispute Resolution Procedure
          </h1>
          <p className="text-sm sm:text-base text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Multi-tiered, independent audit mechanisms for payment reconciliation, gate entry discrepancies, and organizer compliance.
          </p>
        </div>
      </section>

      {/* ── 2. INTERACTIVE DASHBOARD SECTION ────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        <DisputeDashboardClient />
      </section>

      {/* ── 3. 5-TIER ESCALATION WORKFLOW DOCUMENTATION ─────────────────── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 space-y-8 text-gray-800 dark:text-gray-200 text-xs sm:text-sm leading-relaxed">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 sm:p-10 shadow-xs space-y-8">
          
          <div className="space-y-3">
            <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
              <Scale className="text-[#1e9df1]" size={20} /> 5-Tier Dispute Resolution Hierarchy
            </h2>
            <p>
              To ensure speedy and fair resolution of any ticketing, payment, or gate check-in grievance, RotaSphere follows a structured, multi-tier escalation framework:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {/* Level 1 */}
            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 space-y-1.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#1e9df1]">
                Level 1 — Instant Triage
              </span>
              <h3 className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm">Platform Support Desk</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                User files a case via the Dispute Desk. System generates a tracking ticket (<code>DIS-2026-XXXXXX</code>) and checks payment gateway logs automatically.
              </p>
            </div>

            {/* Level 2 */}
            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 space-y-1.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                Level 2 — Mediation
              </span>
              <h3 className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm">Host Club Organizer Review</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                If the dispute relates to event experience, venue admission, or direct club settlement, the case is routed to the Club President/Treasurer with a 48h resolution SLA.
              </p>
            </div>

            {/* Level 3 */}
            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 space-y-1.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Level 3 — Technical Audit
              </span>
              <h3 className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm">RotaSphere Platform Audit</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                For complex payment discrepancies, duplicate charges, or technical gate failures, RotaSphere engineers review database logs, UTR records, and UPI settlement ledgers.
              </p>
            </div>

            {/* Level 4 */}
            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 space-y-1.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                Level 4 — Statutory Escalation
              </span>
              <h3 className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm">District Ombudsman / Grievance Officer</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Unresolved disputes are escalated directly to the designated Grievance Officer (<a href="mailto:tech.rotaract3192@gmail.com" className="underline font-semibold">tech.rotaract3192@gmail.com</a>) with a binding determination.
              </p>
            </div>

            {/* Level 5 */}
            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 space-y-1.5 sm:col-span-2 lg:col-span-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Level 5 — External Legal Remedies
              </span>
              <h3 className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm">Statutory Consumer Rights &amp; Regulatory Authorities</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                <em>Nothing in our internal dispute mechanism excludes or limits statutory rights available under Indian law</em>, including filing complaints with the National Consumer Helpline (NCH), Consumer Disputes Redressal Commission, or Data Protection Board of India.
              </p>
            </div>
          </div>

          <div className="border-t border-gray-100 dark:border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white">Need immediate assistance with a live event gate?</h3>
              <p className="text-xs text-gray-500">Contact the District Secretariat emergency escalation desk.</p>
            </div>
            <Link
              href="/contact"
              className="bg-[#1e9df1] hover:bg-[#1583cd] text-white font-extrabold text-xs px-6 py-3 rounded-2xl shadow-md flex items-center gap-2 cursor-pointer transition-all active:scale-95 shrink-0"
            >
              Contact Secretariat <ArrowRight size={14} />
            </Link>
          </div>

        </div>
      </section>
    </main>
  );
}
