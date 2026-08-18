import Link from "next/link";
import {
  ShieldCheck,
  Lock,
  Server,
  KeyRound,
  FileCheck,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Mail,
  ArrowRight,
} from "lucide-react";
import { LastUpdatedBadge } from "@/components/ui/LastUpdatedBadge";

export const metadata = {
  title: "Platform Security & Cryptography | RotaSphere District 3192",
  description:
    "Security architecture, cryptographic gate QR tokens, Row Level Security, and vulnerability reporting protocols on RotaSphere.",
};

export default function SecurityPage() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24 transition-colors">
      {/* ── 1. HERO HEADER ──────────────────────────────────────────────── */}
      <section className="bg-gray-900 text-white py-16 sm:py-20 px-4 sm:px-6 lg:px-8 text-center relative overflow-hidden">
        <div className="w-full max-w-3xl mx-auto space-y-4 relative z-10">
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <span className="text-xs font-black uppercase tracking-widest text-[#60a5fa] bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full inline-flex items-center gap-1.5">
              <ShieldCheck size={14} /> Security Standards
            </span>
            <LastUpdatedBadge date="2026-08-18" label="Security audit" />
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            Platform Security &amp; Trust
          </h1>
          <p className="text-sm sm:text-base text-gray-400 max-w-2xl mx-auto leading-relaxed">
            How RotaSphere safeguards delegate personal data, secures online transactions, and enforces cryptographic gate admission integrity.
          </p>
        </div>
      </section>

      {/* ── 2. SECURITY PILLARS ─────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 space-y-8 text-gray-800 dark:text-gray-200 text-xs sm:text-sm leading-relaxed">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 sm:p-10 shadow-xs space-y-8">
          
          <div className="space-y-3">
            <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
              <KeyRound className="text-[#1e9df1]" size={20} /> 1. Cryptographic Single-Use QR Pass Integrity
            </h2>
            <p>
              Traditional static barcode tickets can be screenshotted and shared across multiple attendees. RotaSphere eliminates ticket fraud through <strong>SHA-256 HMAC cryptographic tokenization</strong>:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400">
              <li>Each QR pass contains a digitally signed token verified only against our secure gate validation endpoint.</li>
              <li>Once a pass is scanned at the venue entrance, its state changes to <code>CHECKED_IN</code> with an immutable timestamp.</li>
              <li>Subsequent duplicate scan attempts alert the gate operator immediately and flag the attempt in our security audit log.</li>
            </ul>
          </div>

          <div className="border-t border-gray-100 dark:border-gray-800 pt-8 space-y-3">
            <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
              <Server className="text-emerald-600" size={20} /> 2. Multi-Tenant Row Level Security (RLS)
            </h2>
            <p>
              RotaSphere enforces strict database-level data isolation using PostgreSQL Row Level Security (RLS). <em>Club organizers and event staff can strictly query only attendee records registered for their own events.</em> Cross-club data leakage is impossible at the database engine layer.
            </p>
          </div>

          <div className="border-t border-gray-100 dark:border-gray-800 pt-8 space-y-3">
            <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
              <Lock className="text-purple-600" size={20} /> 3. End-to-End Encryption &amp; Edge Protection
            </h2>
            <ul className="list-disc pl-5 space-y-1.5 text-gray-600 dark:text-gray-400">
              <li><strong>In-Transit:</strong> Enforced TLS 1.3 with HSTS (HTTP Strict Transport Security) on all domain endpoints.</li>
              <li><strong>At-Rest:</strong> Database storage and sensitive fields are encrypted with AES-256.</li>
              <li><strong>Edge Security:</strong> Cloudflare Web Application Firewall (WAF) mitigates DDoS attacks and automated scraping bots.</li>
            </ul>
          </div>

          <div className="border-t border-gray-100 dark:border-gray-800 pt-8 space-y-3">
            <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
              <FileCheck className="text-amber-600" size={20} /> 4. Responsible Vulnerability Disclosure Program
            </h2>
            <p>
              We welcome security researchers to test and improve our platform security. If you discover a vulnerability, please report it directly to:
            </p>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 font-medium space-y-1">
              <p>Email: <a href="mailto:tech.rotaract3192@gmail.com" className="text-[#1e9df1] underline">tech.rotaract3192@gmail.com</a></p>
              <p className="text-gray-500">Please provide reproduction steps and allow 48 hours for our security team to investigate before any public disclosure.</p>
            </div>
          </div>

          <div className="border-t border-gray-100 dark:border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white">Check live platform availability</h3>
              <p className="text-xs text-gray-500">View real-time status of APIs, gateway, and scanning services.</p>
            </div>
            <Link
              href="/status"
              className="bg-[#1e9df1] hover:bg-[#1583cd] text-white font-extrabold text-xs px-6 py-3 rounded-2xl shadow-md flex items-center gap-2 cursor-pointer transition-all active:scale-95 shrink-0"
            >
              View System Status <ArrowRight size={14} />
            </Link>
          </div>

        </div>
      </section>
    </main>
  );
}
