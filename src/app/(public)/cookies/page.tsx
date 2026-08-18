import Link from "next/link";
import { Cookie, ShieldCheck, Info, CheckCircle2, Lock, ArrowRight } from "lucide-react";
import { CookiePreferencesClient } from "./CookiePreferencesClient";
import { LastUpdatedBadge } from "@/components/ui/LastUpdatedBadge";

export const metadata = {
  title: "Cookie Policy | RotaSphere District 3192",
  description: "Learn how RotaSphere uses essential session cookies and manages your privacy preferences under the DPDP Act 2023.",
};

export default function CookiePolicyPage() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24 transition-colors">
      {/* ── 1. HERO HEADER ──────────────────────────────────────────────── */}
      <section className="bg-gray-900 text-white py-16 sm:py-20 px-4 sm:px-6 lg:px-8 text-center relative overflow-hidden">
        <div className="w-full max-w-3xl mx-auto space-y-4 relative z-10">
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <span className="text-xs font-black uppercase tracking-widest text-[#60a5fa] bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full inline-flex items-center gap-1.5">
              <Cookie size={14} /> Cookie Notice
            </span>
            <LastUpdatedBadge date="2026-08-18" label="Policy updated" />
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            Cookie Policy &amp; Storage
          </h1>
          <p className="text-sm sm:text-base text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Understand how RotaSphere uses cookies, local storage, and session tokens to secure your passes and optimize ticketing performance.
          </p>
        </div>
      </section>

      {/* ── 2. INTERACTIVE MANAGER & EXPLANATION ─────────────────────────── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 space-y-8 text-gray-800 dark:text-gray-200 text-xs sm:text-sm leading-relaxed">
        {/* Interactive Preferences Center */}
        <CookiePreferencesClient />

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 sm:p-10 shadow-xs space-y-8">
          <div className="space-y-3">
            <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="text-[#1e9df1]" size={20} /> What Are Cookies?
            </h2>
            <p>
              Cookies and local storage objects are small text files placed on your browser or device when you visit websites. They enable the website to recognize your device, maintain authenticated sessions (via Clerk SSO), keep items in your checkout basket, and deliver seamless gate check-in scanning.
            </p>
          </div>

          <div className="border-t border-gray-100 dark:border-gray-800 pt-6 space-y-3">
            <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
              <Lock className="text-emerald-600" size={20} /> Zero Third-Party Advertising Cookies
            </h2>
            <p>
              Unlike commercial social media platforms, <strong>RotaSphere does NOT utilize third-party cross-site advertising cookies</strong>, retargeting pixels, or behavioral tracking beacons. All cookies used on RotaSphere are strictly first-party or essential infrastructure cookies (Clerk SSO, Supabase, Cloudflare).
            </p>
          </div>

          <div className="border-t border-gray-100 dark:border-gray-800 pt-6 space-y-3">
            <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
              <Info className="text-amber-600" size={20} /> How to Manage Cookies in Your Browser
            </h2>
            <p>
              You can also control or delete cookies directly through your web browser settings (Chrome, Safari, Firefox, Edge). Note that disabling strictly essential cookies will prevent you from logging into your account, viewing your QR passes, or using the gate scanner.
            </p>
          </div>

          <div className="border-t border-gray-100 dark:border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white">Need deeper privacy controls?</h3>
              <p className="text-xs text-gray-500">Visit our Privacy Center to manage consent and data rights.</p>
            </div>
            <Link
              href="/privacy-center"
              className="bg-[#1e9df1] hover:bg-[#1583cd] text-white font-extrabold text-xs px-6 py-3 rounded-2xl shadow-md flex items-center gap-2 cursor-pointer transition-all active:scale-95 shrink-0"
            >
              Open Privacy Center <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
