import { ShieldCheck, Lock, Eye, Server } from "lucide-react";

export const metadata = {
  title: "Privacy Policy | RotaSphere District 3192",
  description: "Data privacy policy and DPDP Act compliance for Rotaract District 3192 ticketing.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      <section className="bg-gray-900 text-white py-14 sm:py-20 px-4 sm:px-6 lg:px-8 text-center relative overflow-hidden">
        <div className="max-w-3xl mx-auto space-y-4 relative z-10">
          <span className="text-xs font-black uppercase tracking-widest text-[#60a5fa] inline-flex items-center gap-1.5">
            <Lock size={14} /> Data Protection
          </span>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            Privacy Policy
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 max-w-xl mx-auto leading-relaxed">
            How Rotaract District 3192 collects, encrypts, and protects delegate personal information.
          </p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 space-y-8 text-gray-800 text-xs sm:text-sm leading-relaxed">
        <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-10 shadow-xs space-y-6">
          <div className="space-y-3">
            <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
              <ShieldCheck className="text-[#1e9df1]" size={20} /> 1. Information We Collect
            </h2>
            <p>When you register for an event pass on RotaSphere, we collect minimal required delegate information:</p>
            <ul className="list-disc pl-5 space-y-2 text-gray-600">
              <li>Full Name and Email Address (authenticated via Clerk SSO).</li>
              <li>Rotaract Club Name and Designation (if provided).</li>
              <li>UPI Transaction UTR Reference numbers submitted during checkout.</li>
            </ul>
          </div>

          <div className="border-t border-gray-100 pt-6 space-y-3">
            <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
              <Lock className="text-emerald-600" size={20} /> 2. Gate QR Encryption &amp; Security
            </h2>
            <p>
              Your Gate QR Pass token is dynamically signed and encrypted. Gate Scanner operators strictly verify pass validity without exposing sensitive payment credentials or banking details.
            </p>
          </div>

          <div className="border-t border-gray-100 pt-6 space-y-3">
            <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
              <Server className="text-purple-600" size={20} /> 3. Data Isolation &amp; Zero Selling Policy
            </h2>
            <p>
              RotaSphere enforces tenant-level data isolation. Delegate registration lists are strictly visible only to the authorized host Rotaract Club for gate check-in and attendance record-keeping. We never sell, rent, or monetize delegate personal data to third-party advertisers.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
