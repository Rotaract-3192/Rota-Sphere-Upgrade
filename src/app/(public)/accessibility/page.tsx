import Link from "next/link";
import { Eye, Keyboard, Sparkles, ShieldCheck, Mail, ArrowRight, CheckCircle2, Monitor } from "lucide-react";
import { LastUpdatedBadge } from "@/components/ui/LastUpdatedBadge";

export const metadata = {
  title: "Accessibility Statement | RotaSphere District 3192",
  description:
    "RotaSphere's commitment to web accessibility, WCAG 2.1 AA compliance, keyboard navigation, and reduced motion design.",
};

export default function AccessibilityPage() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24 transition-colors">
      {/* ── 1. HERO HEADER ──────────────────────────────────────────────── */}
      <section className="bg-gray-900 text-white py-16 sm:py-20 px-4 sm:px-6 lg:px-8 text-center relative overflow-hidden">
        <div className="w-full max-w-3xl mx-auto space-y-4 relative z-10">
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <span className="text-xs font-black uppercase tracking-widest text-[#60a5fa] bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full inline-flex items-center gap-1.5">
              <Eye size={14} /> Digital Inclusion
            </span>
            <LastUpdatedBadge date="2026-08-18" label="Statement updated" />
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            Accessibility Statement
          </h1>
          <p className="text-sm sm:text-base text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Our commitment to ensuring that RotaSphere is accessible, inclusive, and easy to use for all delegates and organizers.
          </p>
        </div>
      </section>

      {/* ── 2. MAIN CONTENT ─────────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 space-y-8 text-gray-800 dark:text-gray-200 text-xs sm:text-sm leading-relaxed">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 sm:p-10 shadow-xs space-y-8">
          
          {/* Conformance Commitment */}
          <div className="space-y-3">
            <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="text-[#1e9df1]" size={20} /> Conformance Standard: WCAG 2.1 Level AA
            </h2>
            <p>
              RotaSphere is engineered to conform with the <strong>Web Content Accessibility Guidelines (WCAG) 2.1 Level AA</strong> standards. We continually audit our UI components, ticketing checkout flows, and gate check-in screens to remove digital barriers for people with auditory, cognitive, neurological, physical, speech, and visual disabilities.
            </p>
          </div>

          {/* Built-in Features Grid */}
          <div className="border-t border-gray-100 dark:border-gray-800 pt-8 space-y-4">
            <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="text-emerald-600" size={20} /> Built-in Accessibility Features
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-gray-900 dark:text-white text-xs sm:text-sm">
                  <Keyboard size={16} className="text-[#1e9df1]" /> Keyboard-First Navigation
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  All interactive controls, modals, tabs, dropdowns, and forms can be navigated seamlessly using Tab, Enter, Space, and Arrow keys.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-gray-900 dark:text-white text-xs sm:text-sm">
                  <Sparkles size={16} className="text-purple-600" /> Reduced-Motion Compliance
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  RotaSphere respects your system&apos;s <code>prefers-reduced-motion</code> setting, disabling 3D animations and motion effects automatically.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-gray-900 dark:text-white text-xs sm:text-sm">
                  <Monitor size={16} className="text-emerald-600" /> Screen Reader Compatibility
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Built on Radix UI primitives with explicit ARIA labels, live region announcements for scan results, and descriptive alternative text for event imagery.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-gray-900 dark:text-white text-xs sm:text-sm">
                  <Eye size={16} className="text-amber-600" /> High-Contrast Typography
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Tailored color contrast ratios that exceed 4.5:1 for normal text and 3:1 for large text across both Light and Dark themes.
                </p>
              </div>
            </div>
          </div>

          {/* Feedback & Assistance */}
          <div className="border-t border-gray-100 dark:border-gray-800 pt-8 space-y-4">
            <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
              <Mail className="text-[#1e9df1]" size={20} /> Accessibility Assistance &amp; Feedback
            </h2>
            <p>
              If you experience any difficulty accessing any part of RotaSphere, purchasing tickets, or viewing your digital pass, please reach out to our accessibility team:
            </p>
            <div className="bg-gray-50 dark:bg-gray-800/80 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 space-y-2 text-xs">
              <p className="font-bold text-gray-900 dark:text-white">
                Accessibility Desk: <a href="mailto:tech.rotaract3192@gmail.com" className="text-[#1e9df1] hover:underline font-normal">tech.rotaract3192@gmail.com</a>
              </p>
              <p className="font-bold text-gray-900 dark:text-white">
                Support SLA: <span className="font-normal text-gray-700 dark:text-gray-300">Accessibility tickets receive prioritized review within 24 hours.</span>
              </p>
            </div>
          </div>

          <div className="border-t border-gray-100 dark:border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white">Need help booking a pass?</h3>
              <p className="text-xs text-gray-500">Our support team is ready to assist you with registration.</p>
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
