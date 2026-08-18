import Link from "next/link";
import { HelpCircle, Mail, ArrowRight } from "lucide-react";
import { HelpCenterClient } from "./HelpCenterClient";
import { LastUpdatedBadge } from "@/components/ui/LastUpdatedBadge";

export const metadata = {
  title: "Help Centre & Support Hub | RotaSphere District 3192",
  description:
    "Get instant answers for ticket pass bookings, instant UPI payments, QR gate entry, transfers, cancellations, organizer tools, and DPDP privacy rights.",
};

export default function HelpPage() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24 transition-colors">
      {/* ── 1. HERO HEADER ──────────────────────────────────────────────── */}
      <section className="bg-gray-900 text-white py-16 sm:py-20 px-4 sm:px-6 lg:px-8 text-center relative overflow-hidden">
        <div className="w-full max-w-3xl mx-auto space-y-4 relative z-10">
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <span className="text-xs font-black uppercase tracking-widest text-[#60a5fa] bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full inline-flex items-center gap-1.5">
              <HelpCircle size={14} /> District 3192 Help Hub
            </span>
            <LastUpdatedBadge date="2026-08-18" label="Articles updated" />
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            How can we help you today?
          </h1>
          <p className="text-sm sm:text-base text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Find answers for pass bookings, payments, QR gate check-ins, organizer tools, cancellations, and data privacy.
          </p>
        </div>
      </section>

      {/* ── 2. SEARCHABLE CLIENT SECTION ─────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        <HelpCenterClient />
      </section>

      {/* ── 3. STILL NEED HELP FOOTER ────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        <div className="bg-gradient-to-r from-blue-900 to-slate-900 border border-blue-800 rounded-3xl p-6 sm:p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md">
          <div className="space-y-1.5 text-center sm:text-left">
            <h3 className="font-extrabold text-lg flex items-center justify-center sm:justify-start gap-2">
              <Mail size={18} className="text-[#60a5fa]" /> Still have questions?
            </h3>
            <p className="text-xs text-gray-300 max-w-xl">
              Our District Secretariat support team and Ombudsman are available with a 24-hour response SLA.
            </p>
          </div>
          <Link
            href="/contact"
            className="bg-[#1e9df1] hover:bg-[#1583cd] text-white font-extrabold text-xs px-6 py-3.5 rounded-2xl shadow-md flex items-center gap-2 cursor-pointer transition-all active:scale-95 shrink-0"
          >
            Contact Support Team <ArrowRight size={14} />
          </Link>
        </div>
      </section>
    </main>
  );
}
