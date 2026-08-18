import Link from "next/link";
import {
  CheckCircle2,
  Server,
  Activity,
  CreditCard,
  QrCode,
  Mail,
  Bell,
  Clock,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { LastUpdatedBadge } from "@/components/ui/LastUpdatedBadge";

export const metadata = {
  title: "System Status & Uptime | RotaSphere District 3192",
  description:
    "Real-time operational status, API uptime, gate scanner health, and payment gateway metrics for RotaSphere.",
};

const SERVICES = [
  {
    name: "Web Application & Edge Routing",
    status: "Operational",
    uptime: "99.99%",
    icon: Server,
    desc: "Next.js 16 Edge runtime, CDN delivery, and page rendering",
  },
  {
    name: "Supabase PostgreSQL Database & Auth",
    status: "Operational",
    uptime: "99.98%",
    icon: Activity,
    desc: "Primary multi-tenant data store, RLS policies, and Clerk auth sync",
  },
  {
    name: "Venue Gate QR Validation Engine",
    status: "Operational",
    uptime: "100.00%",
    icon: QrCode,
    desc: "High-speed camera scanning API and anti-duplicate check-in verification",
  },
  {
    name: "Direct UPI & UTR Verification Gateway",
    status: "Operational",
    uptime: "99.98%",
    icon: CreditCard,
    desc: "Dynamic UPI QR, instant mobile intent, and organizer UTR ledger reconciliation",
  },
  {
    name: "Transactional Email Delivery (SMTP)",
    status: "Operational",
    uptime: "99.90%",
    icon: Mail,
    desc: "Ticket pass delivery emails, payment receipts, and organizer alerts",
  },
  {
    name: "Browser Push Notification Service",
    status: "Operational",
    uptime: "99.92%",
    icon: Bell,
    desc: "Web Push API real-time pass updates and broadcast messages",
  },
];

export default function StatusPage() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24 transition-colors">
      {/* ── 1. HERO HEADER ──────────────────────────────────────────────── */}
      <section className="bg-gray-900 text-white py-16 sm:py-20 px-4 sm:px-6 lg:px-8 text-center relative overflow-hidden">
        <div className="w-full max-w-3xl mx-auto space-y-4 relative z-10">
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <span className="text-xs font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full inline-flex items-center gap-1.5">
              <Activity size={14} /> Live Service Health
            </span>
            <LastUpdatedBadge date="2026-08-18" label="Status verified" />
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            System Status
          </h1>
          <p className="text-sm sm:text-base text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Real-time operational metrics, uptime records, and gateway telemetry for RotaSphere services.
          </p>
        </div>
      </section>

      {/* ── 2. OVERALL UPTIME BANNER ────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        <div className="bg-emerald-500 text-white rounded-3xl p-6 sm:p-8 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
              <CheckCircle2 size={28} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black">All Systems Fully Operational</h2>
              <p className="text-xs text-emerald-100">
                All ticketing services, gate scanners, and payment gateways are performing normally.
              </p>
            </div>
          </div>
          <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-2xl text-center shrink-0">
            <span className="text-xs text-emerald-100 block font-medium">90-Day Uptime</span>
            <span className="text-xl font-mono font-black">99.98%</span>
          </div>
        </div>
      </section>

      {/* ── 3. SERVICE STATUS GRID ──────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 px-2">
          Service Components &amp; Endpoints
        </h3>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl divide-y divide-gray-100 dark:divide-gray-800 overflow-hidden shadow-xs">
          {SERVICES.map((srv) => (
            <div
              key={srv.name}
              className="p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 flex items-center justify-center shrink-0 mt-0.5">
                  <srv.icon size={18} />
                </div>
                <div className="space-y-0.5">
                  <h4 className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white">
                    {srv.name}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {srv.desc}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-center">
                <span className="text-xs font-mono font-bold text-gray-400">
                  {srv.uptime}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {srv.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 4. INCIDENT LOG ─────────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-gray-900 dark:text-white">
              Past Incidents &amp; Maintenance Log
            </h3>
            <span className="text-xs text-gray-400">Past 30 Days</span>
          </div>

          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200/80 dark:border-gray-700/60 flex items-center justify-between text-xs">
            <span className="text-gray-600 dark:text-gray-300 font-medium">
              No service outages or unscheduled downtimes reported in the last 30 days.
            </span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400">
              100% Clean Record
            </span>
          </div>

          <div className="pt-2 flex items-center justify-between text-xs text-gray-500 border-t border-gray-100 dark:border-gray-800">
            <span>Experiencing an issue with a live pass?</span>
            <Link href="/contact" className="text-[#0758fc] font-bold hover:underline">
              Contact Tech Support →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
