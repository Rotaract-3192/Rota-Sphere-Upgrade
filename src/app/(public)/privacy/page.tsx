import Link from "next/link";
import {
  ShieldCheck,
  Lock,
  Eye,
  Server,
  FileText,
  AlertTriangle,
  Scale,
  CreditCard,
  QrCode,
  MapPin,
  Clock,
  UserCheck,
  RefreshCw,
  Mail,
  ArrowRight,
  Database,
  CheckCircle2,
  Users,
} from "lucide-react";
import { LastUpdatedBadge } from "@/components/ui/LastUpdatedBadge";

export const metadata = {
  title: "Privacy Policy | RotaSphere District 3192",
  description:
    "Comprehensive Privacy Policy & Notice under India's Digital Personal Data Protection Act, 2023 (DPDP Act) and DPDP Rules 2025 for RotaSphere ticketing platform.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24 transition-colors">
      {/* ── 1. HERO HEADER ──────────────────────────────────────────────── */}
      <section className="bg-gray-900 text-white py-16 sm:py-20 px-4 sm:px-6 lg:px-8 text-center relative overflow-hidden">
        <div className="w-full max-w-3xl mx-auto space-y-4 relative z-10">
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <span className="text-xs font-black uppercase tracking-widest text-[#60a5fa] bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full inline-flex items-center gap-1.5">
              <Lock size={14} /> DPDP Act 2023 &amp; Rules 2025 Notice
            </span>
            <LastUpdatedBadge date="2026-08-18" label="Policy effective" />
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            Privacy Policy &amp; Data Notice
          </h1>
          <p className="text-sm sm:text-base text-gray-400 max-w-2xl mx-auto leading-relaxed">
            How RotaSphere collects, processes, stores, protects, and retains personal data for event ticketing, payments, gate check-in scanning, and community operations.
          </p>
        </div>
      </section>

      {/* ── 2. QUICK NAVIGATION & PRIVACY CENTER CALLOUT ─────────────────── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="bg-gradient-to-r from-blue-900 to-slate-900 border border-blue-800 rounded-3xl p-6 sm:p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md">
          <div className="space-y-2 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <ShieldCheck size={20} className="text-[#60a5fa]" />
              <h2 className="font-extrabold text-lg">Manage Your Privacy Preferences</h2>
            </div>
            <p className="text-xs text-gray-300 max-w-xl">
              Exercise your DPDP rights: download your registration data, revoke marketing consents, request data erasure, or file a privacy grievance directly from your personal dashboard.
            </p>
          </div>
          <Link
            href="/privacy-center"
            className="bg-[#0758fc] hover:bg-[#054fe0] text-white font-extrabold text-xs px-6 py-3.5 rounded-2xl shadow-md flex items-center gap-2 cursor-pointer transition-all active:scale-95 shrink-0"
          >
            Open Privacy Center <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      {/* ── 3. MAIN POLICY CONTENT ──────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 space-y-8 text-gray-800 dark:text-gray-200 text-xs sm:text-sm leading-relaxed">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 sm:p-10 shadow-xs space-y-10">
          
          {/* Section 1: Introduction */}
          <div className="space-y-3">
            <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
              <FileText className="text-[#0758fc]" size={20} /> 1. Introduction &amp; Data Fiduciary Scope
            </h2>
            <p>
              This Privacy Policy explains how <strong>RotaSphere</strong> (operated by <em>RotaSphere Platform Operations / Rotaract District 3192 Secretariat</em>, hereinafter &quot;RotaSphere&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) collects, uses, stores, shares, and protects personal data when you use the RotaSphere platform, including our websites, event registration services, ticketing infrastructure, organizer dashboards, gate check-in systems, and related communications.
            </p>
            <p>
              This policy applies to both <strong>Attendees / Delegates</strong> purchasing passes or registering for events, and <strong>Event Organizers / Club Officers</strong> hosting events and operating gate verification terminals.
            </p>
            <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 text-xs text-blue-900 dark:text-blue-300">
              <strong>Indian Legal Framework:</strong> In accordance with the <em>Digital Personal Data Protection Act, 2023 (DPDP Act)</em> and the <em>DPDP Rules, 2025</em>, this standalone notice provides an itemized description of personal data collected, specific processing purposes, enabled services, data retention schedules, and mechanisms for withdrawing consent and exercising Data Principal rights.
            </div>
          </div>

          {/* Section 2: Information We Collect */}
          <div className="border-t border-gray-100 dark:border-gray-800 pt-8 space-y-4">
            <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
              <Database className="text-emerald-600" size={20} /> 2. Information We Collect
            </h2>
            <p>We collect personal data across clearly defined operational categories:</p>
            
            <div className="space-y-3 pl-2">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-xs uppercase tracking-wider">A. Account &amp; Profile Information</h3>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Full name, email address, mobile phone number, profile photo (if uploaded), role/designation, affiliated Rotaract/Rotary Club name, and Clerk authentication user ID.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-xs uppercase tracking-wider">B. Ticketing &amp; Registration Information</h3>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Selected event, ticket tier, quantity, unique ticket ID, encrypted dynamic QR token, registration timestamp, attendee badge details, seat/category designation, check-in status, and check-in timestamp.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-xs uppercase tracking-wider">C. Event-Specific Custom Registration Information</h3>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  <em>Organizers may request additional event-specific information</em> through custom registration form fields (e.g., college/institution name, dietary preferences, T-shirt size, emergency contact, or delegate category). <strong>RotaSphere does not mandate or collect these fields by default;</strong> they are configured dynamically by the host organizer solely for event logistics.
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Payment Information */}
          <div className="border-t border-gray-100 dark:border-gray-800 pt-8 space-y-3">
            <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
              <CreditCard className="text-purple-600" size={20} /> 3. Payment Information &amp; PCI-DSS Separation
            </h2>
            <p>
              When you purchase tickets on RotaSphere, we process transaction metadata necessary for order fulfilment:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-gray-600 dark:text-gray-400">
              <li>Order ID, Payment Gateway Transaction ID, Payment Status, Amount Paid, Currency (INR), and Transaction Timestamps.</li>
              <li>For direct UPI settlement workflows: Attendee-submitted 12-digit UPI UTR Reference numbers and payment receipt screenshots submitted for organizer verification.</li>
            </ul>
            <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs text-gray-700 dark:text-gray-300">
              <strong>Non-Storage of Card &amp; Banking Credentials:</strong> All pass payments are transacted directly via UPI (Unified Payments Interface) and Reserve Bank of India (RBI) authorized banking clearing networks (NPCI / BHIM / GPay / PhonePe / Paytm). <em>RotaSphere never receives, stores, or processes complete card details or banking authentication credentials on its servers.</em>
            </div>
          </div>

          {/* Section 4: Technical & Telemetry Information */}
          <div className="border-t border-gray-100 dark:border-gray-800 pt-8 space-y-3">
            <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
              <Server className="text-blue-600" size={20} /> 4. Technical, Log &amp; Security Information
            </h2>
            <p>To prevent fraud, guarantee gate security, and maintain platform uptime, we automatically log:</p>
            <ul className="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400">
              <li>IP address and approximate geographic location derived from IP (city/country level).</li>
              <li>Browser user agent, device model, operating system, and screen resolution.</li>
              <li>Login timestamps, authentication sessions, and security access audit trails.</li>
              <li>Error logs, exception traces, and API rate-limiting metrics.</li>
            </ul>
          </div>

          {/* Section 5: QR Code & Gate Check-In Data */}
          <div className="border-t border-gray-100 dark:border-gray-800 pt-8 space-y-3">
            <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
              <QrCode className="text-amber-600" size={20} /> 5. QR Code &amp; Gate Check-In Verification Data
            </h2>
            <p>
              When an attendee presents their digital pass at an event entrance, the RotaSphere Check-In Scanner app records:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-gray-600 dark:text-gray-400">
              <li>Scanned Ticket ID and cryptographically hashed QR token verification status.</li>
              <li>Exact timestamp of gate check-in scan.</li>
              <li>Gate Scanner Operator Account ID and gate entrance label.</li>
              <li>Duplicate scan detection logs (flagging and preventing counterfeit or repeated entry attempts).</li>
            </ul>
          </div>

          {/* Section 6: Location & Mapping Data */}
          <div className="border-t border-gray-100 dark:border-gray-800 pt-8 space-y-3">
            <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
              <MapPin className="text-rose-600" size={20} /> 6. Location Data Policy (MapLibre / Ola Maps)
            </h2>
            <p>
              RotaSphere integrates <strong>MapLibre GL</strong> and <strong>Ola Maps</strong> solely for rendering interactive event venue maps and driving directions. <em>We do NOT perform persistent background GPS tracking of users.</em> Location data is strictly used on-demand when searching for nearby events in District 3192.
            </p>
          </div>

          {/* Section 7: How We Use Personal Data */}
          <div className="border-t border-gray-100 dark:border-gray-800 pt-8 space-y-3">
            <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="text-emerald-600" size={20} /> 7. Specific Purposes for Data Processing
            </h2>
            <p>Personal data is processed exclusively for specified, lawful business purposes:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
              <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700">
                <strong className="text-gray-900 dark:text-white block mb-1">🎟️ Event Operations &amp; Ticketing</strong>
                Issuing digital QR passes, verifying attendance at venue gates, generating delegate credentials, and issuing participation certificates.
              </div>
              <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700">
                <strong className="text-gray-900 dark:text-white block mb-1">💳 Payments &amp; Settlement</strong>
                Processing direct UPI payments, validating UTR receipts, reconciling club accounts, and executing refunds.
              </div>
              <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700">
                <strong className="text-gray-900 dark:text-white block mb-1">🛡️ Platform Security &amp; Anti-Abuse</strong>
                Detecting ticket counterfeiting, preventing duplicate gate check-ins, securing organizer accounts, and maintaining audit logs.
              </div>
              <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700">
                <strong className="text-gray-900 dark:text-white block mb-1">📬 Critical Communications</strong>
                Sending booking confirmations, QR ticket delivery emails, event postponement notices, and payment receipts.
              </div>
            </div>
          </div>

          {/* Section 8: Consent & Withdrawal */}
          <div className="border-t border-gray-100 dark:border-gray-800 pt-8 space-y-3">
            <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
              <RefreshCw className="text-[#0758fc]" size={20} /> 8. Notice, Consent &amp; Consent Withdrawal
            </h2>
            <p>
              In strict accordance with the DPDP Rules 2025, RotaSphere enforces a clear separation between <strong>Necessary Transactional Processing</strong> and <strong>Optional Promotional Processing</strong>:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-gray-600 dark:text-gray-400">
              <li><strong>Necessary Processing:</strong> Providing your email and name is required to generate and deliver your event ticket, process your payment, and grant gate entry.</li>
              <li><strong>Optional Communications:</strong> Subscribing to district newsletters, promotional WhatsApp updates, or marketing emails is entirely voluntary and is never pre-bundled into Terms of Service acceptance.</li>
              <li><strong>Ease of Withdrawal:</strong> You can withdraw consent for any optional processing at any time with an ease comparable to giving it, via the <Link href="/privacy-center" className="text-[#0758fc] font-bold hover:underline">Privacy Center</Link>.</li>
            </ul>
          </div>

          {/* Section 9: Sharing of Personal Data */}
          <div className="border-t border-gray-100 dark:border-gray-800 pt-8 space-y-3">
            <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
              <Users className="text-purple-600" size={20} /> 9. Sharing &amp; Third-Party Processors
            </h2>
            <p>
              RotaSphere enforces strict tenant-level isolation and <strong>never sells or rents personal data</strong> to third-party data brokers or advertisers. Data is shared strictly with:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-gray-600 dark:text-gray-400">
              <li><strong>Host Event Organizers:</strong> When you register for an event, your registration fields, ticket tier, and check-in status are shared solely with the authorized host Rotaract Club for gate admission and delegate kit distribution. Other clubs cannot access your data.</li>
              <li><strong>Payment &amp; Banking Networks:</strong> National Payments Corporation of India (NPCI) and authorized UPI participating banking handles for direct peer-to-merchant settlements and UTR validation.</li>
              <li><strong>Infrastructure Processors:</strong> Clerk (Authentication), Supabase PostgreSQL (Encrypted Database), Cloudflare (CDN/DDoS Security), and Nodemailer/SMTP (Transactional Email).</li>
              <li><strong>Law Enforcement &amp; Statutory Bodies:</strong> Where required by valid court order, Indian law, or statutory regulations.</li>
            </ul>
          </div>

          {/* Section 10: Data Retention Framework */}
          <div className="border-t border-gray-100 dark:border-gray-800 pt-8 space-y-4">
            <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
              <Clock className="text-amber-600" size={20} /> 10. Purpose-Based Data Retention Schedule
            </h2>
            <p>
              In accordance with DPDP purpose-limitation guidelines, RotaSphere retains personal data only for as long as necessary:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
                <thead className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-bold">
                  <tr>
                    <th className="p-3">Data Category</th>
                    <th className="p-3">Retention Period</th>
                    <th className="p-3">Statutory / Operational Basis</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800 text-gray-600 dark:text-gray-300">
                  <tr>
                    <td className="p-3 font-semibold text-gray-900 dark:text-white">User Profile &amp; Account</td>
                    <td className="p-3">Until user requests deletion / account closure</td>
                    <td className="p-3">Contractual service provision</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-gray-900 dark:text-white">Payment &amp; Invoicing Records</td>
                    <td className="p-3">7 Years (2,555 days)</td>
                    <td className="p-3">Indian Income Tax Act &amp; Companies Act statutory accounting compliance</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-gray-900 dark:text-white">Event Registration &amp; Pass History</td>
                    <td className="p-3">3 Years (1,095 days)</td>
                    <td className="p-3">Certificate verification &amp; dispute audit trail</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-gray-900 dark:text-white">Gate Scanner &amp; Security Logs</td>
                    <td className="p-3">1 Year (365 days)</td>
                    <td className="p-3">Incident response, fraud prevention &amp; audit</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-gray-900 dark:text-white">Temporary OTPs / Verification Tokens</td>
                    <td className="p-3">24 Hours</td>
                    <td className="p-3">Immediate hard-deletion post verification</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 11: User Privacy Rights under DPDP */}
          <div className="border-t border-gray-100 dark:border-gray-800 pt-8 space-y-4">
            <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
              <UserCheck className="text-emerald-600" size={20} /> 11. Your Rights as a Data Principal
            </h2>
            <p>Under the DPDP Act 2023, you have guaranteed statutory rights over your personal data:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700">
                <strong className="text-gray-900 dark:text-white block mb-1">1. Right to Access &amp; Summary</strong>
                Request a complete summary of personal data being processed and third parties with whom it has been shared.
              </div>
              <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700">
                <strong className="text-gray-900 dark:text-white block mb-1">2. Right to Correction &amp; Update</strong>
                Correct inaccurate, misleading, or incomplete profile and contact data.
              </div>
              <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700">
                <strong className="text-gray-900 dark:text-white block mb-1">3. Right to Erasure / Deletion</strong>
                Request complete erasure of your personal data when the original processing purpose is complete (subject to legal retention holds).
              </div>
              <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700">
                <strong className="text-gray-900 dark:text-white block mb-1">4. Right of Grievance Redressal</strong>
                File privacy grievances with our designated Grievance Officer, with escalation available to the Data Protection Board of India.
              </div>
              <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700">
                <strong className="text-gray-900 dark:text-white block mb-1">5. Right to Data Portability / Export</strong>
                Download a machine-readable JSON copy of all your passes, registrations, and profile records.
              </div>
              <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700">
                <strong className="text-gray-900 dark:text-white block mb-1">6. Right to Nominate</strong>
                Nominate an individual to exercise data rights on your behalf in the event of death or incapacity.
              </div>
            </div>
            <p className="text-xs text-gray-500 pt-1">
              You can exercise all the above rights instantly via our self-serve <Link href="/privacy-center" className="text-[#0758fc] font-bold hover:underline">Privacy Center Dashboard</Link>.
            </p>
          </div>

          {/* Section 12: Data Security Safeguards */}
          <div className="border-t border-gray-100 dark:border-gray-800 pt-8 space-y-3">
            <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
              <Lock className="text-purple-600" size={20} /> 12. Technical &amp; Organizational Security Safeguards
            </h2>
            <p>RotaSphere implements rigorous industry-standard security safeguards:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-gray-600 dark:text-gray-400">
              <li><strong>Encryption:</strong> TLS 1.3 encryption for all data in transit; AES-256 encryption at rest for database stores.</li>
              <li><strong>Row Level Security (RLS):</strong> PostgreSQL tenant-level policies guaranteeing that club organizers can only query their own registered delegates.</li>
              <li><strong>Cryptographic QR Tokens:</strong> Pass QR codes use SHA-256 cryptographic signatures with single-use replay protection.</li>
              <li><strong>Access Controls &amp; MFA:</strong> Strict Role-Based Access Control (RBAC) and Multi-Factor Authentication for administrative consoles.</li>
            </ul>
          </div>

          {/* Section 13: Data Breach Response Protocol */}
          <div className="border-t border-gray-100 dark:border-gray-800 pt-8 space-y-3">
            <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="text-rose-600" size={20} /> 13. Data Breach Incident Notification (72-Hour SLA)
            </h2>
            <p>
              In the unlikely event of a verified personal data breach impacting RotaSphere delegates, RotaSphere maintains an incident response protocol compliant with DPDP Rules 2025:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-gray-600 dark:text-gray-400">
              <li>Prompt notification to affected Data Principals detailing the nature of the breach, affected data categories, and recommended mitigation steps.</li>
              <li>Formal statutory reporting to the <strong>Data Protection Board of India</strong> within 72 hours of incident confirmation.</li>
            </ul>
          </div>

          {/* Section 14: Children's Personal Data */}
          <div className="border-t border-gray-100 dark:border-gray-800 pt-8 space-y-3">
            <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="text-amber-600" size={20} /> 14. Children&apos;s Personal Data &amp; Age Policy
            </h2>
            <p>
              RotaSphere does not knowingly collect personal data from individuals under 18 years of age without verified parental/guardian authorization. Where youth or school-level Rotaract/Interact events require registrations for minors, the host organizer is contractually responsible for securing lawful parental consent prior to ticketing.
            </p>
          </div>

          {/* Section 15: Grievance Redressal Contact */}
          <div className="border-t border-gray-100 dark:border-gray-800 pt-8 space-y-4">
            <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
              <Mail className="text-[#0758fc]" size={20} /> 15. Grievance Officer &amp; Statutory Redressal
            </h2>
            <p>
              If you have any questions, concerns, or grievances regarding the processing of your personal data, you may contact our designated Grievance Officer under the DPDP Act 2023:
            </p>
            
            <div className="bg-gray-50 dark:bg-gray-800/80 rounded-2xl p-5 border border-gray-200 dark:border-gray-700 space-y-2 text-xs">
              <p className="font-bold text-gray-900 dark:text-white">
                Grievance Officer: <span className="font-normal text-gray-700 dark:text-gray-300">Rotaract District 3192 Tech Team</span>
              </p>
              <p className="font-bold text-gray-900 dark:text-white">
                Official Email: <a href="mailto:tech.rotaract3192@gmail.com" className="text-[#0758fc] hover:underline font-normal">tech.rotaract3192@gmail.com</a>
              </p>
              <p className="font-bold text-gray-900 dark:text-white">
                Postal Address: <span className="font-normal text-gray-700 dark:text-gray-300">District Secretariat, Rotaract District 3192, Bengaluru, Karnataka 560001, India</span>
              </p>
              <p className="font-bold text-gray-900 dark:text-white">
                Response SLA: <span className="font-normal text-gray-700 dark:text-gray-300">Grievances are acknowledged within 24 hours and addressed within 15 business days.</span>
              </p>
            </div>
          </div>

        </div>
      </section>
    </main>
  );
}
