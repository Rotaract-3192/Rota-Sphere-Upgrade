import Link from "next/link";
import {
  Scale,
  Shield,
  Users,
  FileCheck,
  AlertTriangle,
  CreditCard,
  QrCode,
  Building,
  Gavel,
  CheckCircle2,
  HelpCircle,
  Clock,
  ArrowRight,
} from "lucide-react";
import { LastUpdatedBadge } from "@/components/ui/LastUpdatedBadge";

export const metadata = {
  title: "Terms of Service | RotaSphere District 3192",
  description:
    "Comprehensive Terms of Service for delegates, host organizers, and gate check-in operators on the RotaSphere platform in accordance with Indian Law.",
  alternates: {
    canonical: "/terms",
  },
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24 transition-colors">
      {/* ── 1. HERO HEADER ──────────────────────────────────────────────── */}
      <section className="bg-gray-900 text-white py-16 sm:py-20 px-4 sm:px-6 lg:px-8 text-center relative overflow-hidden">
        <div className="w-full max-w-3xl mx-auto space-y-4 relative z-10">
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <span className="text-xs font-black uppercase tracking-widest text-[#60a5fa] bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full inline-flex items-center gap-1.5">
              <Scale size={14} /> Legal &amp; Operating Agreement
            </span>
            <LastUpdatedBadge date="2026-08-18" label="Terms effective" />
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            Terms of Service
          </h1>
          <p className="text-sm sm:text-base text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Legal terms, platform rights, ticketing rules, and organizer obligations governing the use of RotaSphere.
          </p>
        </div>
      </section>

      {/* ── 2. TERMS CONTENT ────────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 space-y-8 text-gray-800 dark:text-gray-200 text-xs sm:text-sm leading-relaxed">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 sm:p-10 shadow-xs space-y-10">
          
          {/* 1. Acceptance */}
          <div className="space-y-3">
            <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
              <FileCheck className="text-[#0758fc]" size={20} /> 1. Acceptance of Terms
            </h2>
            <p>
              By accessing, browsing, registering for an account, purchasing a ticket, or hosting an event on <strong>RotaSphere</strong> (operated by <em>RotaSphere Platform Operations / Rotaract District 3192 Secretariat</em>), you agree to be bound by these Terms of Service, our <Link href="/privacy" className="text-[#0758fc] hover:underline font-bold">Privacy Policy</Link>, <Link href="/cancellation-policy" className="text-[#0758fc] hover:underline font-bold">Cancellation Policy</Link>, and <Link href="/refund-policy" className="text-[#0758fc] hover:underline font-bold">Refund Policy</Link>.
            </p>
            <p>
              If you do not agree to these Terms, you must not use our website, organizer studios, ticketing services, or gate scanner tools.
            </p>
          </div>

          {/* 2. Definitions */}
          <div className="border-t border-gray-100 dark:border-gray-800 pt-8 space-y-3">
            <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
              <Building className="text-purple-600" size={20} /> 2. Key Definitions
            </h2>
            <ul className="list-disc pl-5 space-y-2 text-gray-600 dark:text-gray-400">
              <li><strong>&quot;Platform&quot; or &quot;RotaSphere&quot;:</strong> The web application, APIs, database, ticketing infrastructure, and gate scanner software.</li>
              <li><strong>&quot;Attendee&quot; / &quot;Delegate&quot;:</strong> Any individual who explores events, purchases tickets, or registers for passes on RotaSphere.</li>
              <li><strong>&quot;Organizer&quot; / &quot;Host Club&quot;:</strong> Chartered Rotaract/Rotary Clubs, committees, or authorized event chairs who publish, manage, and execute events on RotaSphere.</li>
              <li><strong>&quot;Ticket&quot; / &quot;Pass&quot;:</strong> A digital admission credential, encoded with a cryptographic QR code, granting entrance to a specific event.</li>
              <li><strong>&quot;Payment Service Provider&quot;:</strong> Reserve Bank of India (RBI) and National Payments Corporation of India (NPCI) authorized UPI clearing networks and banking rails.</li>
            </ul>
          </div>

          {/* 3. Platform Intermediary Clarification */}
          <div className="border-t border-gray-100 dark:border-gray-800 pt-8 space-y-3">
            <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
              <Shield className="text-emerald-600" size={20} /> 3. Intermediary Technology Role
            </h2>
            <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 text-xs text-blue-950 dark:text-blue-200 space-y-2">
              <p className="font-bold">
                Important Role Distinction: RotaSphere is a Technology Platform &amp; Intermediary.
              </p>
              <p>
                RotaSphere provides multi-tenant event creation, ticketing, payment facilitation, and gate check-in technology. <em>Unless an event is explicitly published directly by the Rotaract District 3192 Council as a District-level initiative, RotaSphere is not the primary event organizer or producer.</em>
              </p>
              <p>
                Each Host Club is solely responsible for event production, venue management, schedule delivery, speaker appearances, food/delegate kits, safety, and fulfilling ticket entitlements.
              </p>
            </div>
          </div>

          {/* 4. Eligibility & Account Security */}
          <div className="border-t border-gray-100 dark:border-gray-800 pt-8 space-y-3">
            <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
              <Users className="text-amber-600" size={20} /> 4. Eligibility &amp; Account Responsibility
            </h2>
            <p>
              Users must be at least 18 years old to create an account and purchase passes. Minors attending youth or school-level events must have tickets booked through a parent, legal guardian, or authorized faculty coordinator.
            </p>
            <p>
              You are responsible for maintaining the confidentiality of your login credentials (via Clerk SSO) and for all actions conducted under your account. You agree to notify us immediately of any unauthorized access at <a href="mailto:tech.rotaract3192@gmail.com" className="text-[#0758fc] underline font-medium">tech.rotaract3192@gmail.com</a>.
            </p>
          </div>

          {/* 5. Organizer Obligations */}
          <div className="border-t border-gray-100 dark:border-gray-800 pt-8 space-y-3">
            <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
              <Building className="text-rose-600" size={20} /> 5. Organizer Terms &amp; Event Governance
            </h2>
            <p>Organizers publishing events on RotaSphere covenant and agree to:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-gray-600 dark:text-gray-400">
              <li>Provide strictly accurate event descriptions, venue locations, schedules, and ticket pricing.</li>
              <li>Hold all necessary municipal, police, venue, and copyright clearances required for hosting the event.</li>
              <li>Verify submitted UPI UTR payments promptly within 24 to 48 hours.</li>
              <li>Honor all valid digital QR tickets presented at the gate without discrimination.</li>
              <li>Protect attendee registration data in compliance with the DPDP Act 2023, never exporting or sharing delegate lists with external marketing agencies.</li>
            </ul>
          </div>

          {/* 6. Ticket Terms & Gate Admission */}
          <div className="border-t border-gray-100 dark:border-gray-800 pt-8 space-y-3">
            <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
              <QrCode className="text-blue-600" size={20} /> 6. Ticket Validity &amp; Anti-Duplication Rules
            </h2>
            <p>
              Each confirmed ticket generates a unique, cryptographically signed dynamic QR token:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400">
              <li>A ticket represents a personal revocable license for admission of one (1) delegate to the specified event.</li>
              <li>Each QR pass is <strong>single-use</strong>. Gate scanners detect and reject duplicate scan attempts instantly.</li>
              <li>Reselling, scalping, or duplicating tickets is strictly prohibited and results in immediate pass invalidation without refund.</li>
              <li>Event staff may require government or Rotaract photo ID at the venue gate to verify the ticket holder&apos;s identity.</li>
            </ul>
          </div>

          {/* 7. Pricing Transparency & Platform Fees */}
          <div className="border-t border-gray-100 dark:border-gray-800 pt-8 space-y-3">
            <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
              <CreditCard className="text-emerald-600" size={20} /> 7. Pricing Transparency &amp; Platform Fees
            </h2>
            <p>
              In accordance with the <em>Consumer Protection (E-Commerce) Rules, 2020</em>, RotaSphere provides complete fee transparency prior to checkout:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-gray-600 dark:text-gray-400">
              <li><strong>Ticket Price:</strong> Base registration fee set by the host organizer.</li>
              <li><strong>Platform / Convenience Fee:</strong> Clearly itemized on the booking summary before payment initiation.</li>
              <li><strong>Taxes:</strong> Applicable GST / statutory levies are clearly itemized. There are no hidden or unannounced fees.</li>
            </ul>
          </div>

          {/* 8. Event Postponements & Cancellations */}
          <div className="border-t border-gray-100 dark:border-gray-800 pt-8 space-y-3">
            <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
              <Clock className="text-amber-600" size={20} /> 8. Event Changes, Rescheduling &amp; Cancellations
            </h2>
            <p>
              If an event is cancelled by the host club, attendees are entitled to a full 100% refund of the ticket price as set forth in our <Link href="/refund-policy" className="text-[#0758fc] hover:underline font-bold">Refund Policy</Link>.
            </p>
            <p>
              If an event is postponed or relocated, existing tickets remain valid for the revised date. Attendees unable to attend on the rescheduled date may request a refund within the specified window.
            </p>
          </div>

          {/* 9. Prohibited Activities */}
          <div className="border-t border-gray-100 dark:border-gray-800 pt-8 space-y-3">
            <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="text-rose-600" size={20} /> 9. Prohibited Activities
            </h2>
            <p>Users and organizers are strictly prohibited from:</p>
            <ul className="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400">
              <li>Submitting fraudulent, counterfeit, or forged UPI UTR reference numbers.</li>
              <li>Using automated scripts, bots, or scrapers to extract event lists or ticket availability.</li>
              <li>Tampering with, copying, or reverse-engineering QR security tokens.</li>
              <li>Hosting events that promote unlawful acts, hate speech, defamation, or infringement of intellectual property.</li>
            </ul>
          </div>

          {/* 10. Disclaimers & Statutory Consumer Rights */}
          <div className="border-t border-gray-100 dark:border-gray-800 pt-8 space-y-3">
            <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
              <Scale className="text-purple-600" size={20} /> 10. Disclaimers &amp; Consumer Rights
            </h2>
            <p>
              While RotaSphere strives for continuous uptime and data integrity, services are provided on an &quot;AS IS&quot; basis. <em>Nothing in these Terms excludes, restricts, or limits any statutory consumer rights guaranteed under the Consumer Protection Act, 2019 or the Information Technology Act, 2000 that cannot lawfully be excluded under Indian law.</em>
            </p>
          </div>

          {/* 11. Governing Law & Dispute Jurisdiction */}
          <div className="border-t border-gray-100 dark:border-gray-800 pt-8 space-y-3">
            <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
              <Gavel className="text-gray-900 dark:text-white" size={20} /> 11. Governing Law &amp; Jurisdiction
            </h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the Republic of India. In the event of any legal dispute arising out of or in connection with the Platform, such disputes shall be subject to the exclusive jurisdiction of the competent courts situated in <strong>Bengaluru, Karnataka, India</strong>.
            </p>
          </div>

          {/* 12. Support & Grievances */}
          <div className="border-t border-gray-100 dark:border-gray-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white">Have questions about our Terms?</h3>
              <p className="text-xs text-gray-500">Contact our legal &amp; grievance desk for assistance.</p>
            </div>
            <Link
              href="/contact"
              className="bg-[#0758fc] hover:bg-[#054fe0] text-white font-extrabold text-xs px-6 py-3 rounded-2xl shadow-md flex items-center gap-2 cursor-pointer transition-all active:scale-95 shrink-0"
            >
              Contact Legal Desk <ArrowRight size={14} />
            </Link>
          </div>

        </div>
      </section>
    </main>
  );
}
