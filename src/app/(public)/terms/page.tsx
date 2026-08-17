import { Scale, CheckCircle2, Shield, Users } from "lucide-react";

export const metadata = {
  title: "Terms of Service | RotaSphere District 3192",
  description: "Terms of service for delegates, event organizers, and gate check-in operators.",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      <section className="bg-gray-900 text-white py-14 sm:py-20 px-4 sm:px-6 lg:px-8 text-center relative overflow-hidden">
        <div className="max-w-3xl mx-auto space-y-4 relative z-10">
          <span className="text-xs font-black uppercase tracking-widest text-[#60a5fa] inline-flex items-center gap-1.5">
            <Scale size={14} /> Platform Rules
          </span>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            Terms of Service
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 max-w-xl mx-auto leading-relaxed">
            Standard operating conditions for attendees, club hosts, and event staff on RotaSphere.
          </p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 space-y-8 text-gray-800 text-xs sm:text-sm leading-relaxed">
        <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-10 shadow-xs space-y-6">
          <div className="space-y-3">
            <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
              <Users className="text-[#1e9df1]" size={20} /> 1. Delegate Responsibilities
            </h2>
            <ul className="list-disc pl-5 space-y-2 text-gray-600">
              <li>Delegates must provide accurate 12-digit UTR transaction references for UPI payments.</li>
              <li>Scannable Gate QR passes must be presented at the entrance via mobile device or printed badge.</li>
              <li>Fake or duplicated UTR submissions will result in immediate ticket revocation and account suspension.</li>
            </ul>
          </div>

          <div className="border-t border-gray-100 pt-6 space-y-3">
            <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
              <Shield className="text-emerald-600" size={20} /> 2. Host Organizer Obligations
            </h2>
            <ul className="list-disc pl-5 space-y-2 text-gray-600">
              <li>Organizers must promptly verify submitted UTR payments against club bank statements within 24-48 hours.</li>
              <li>Organizers must ensure accurate event timing, venue details, and pass availability.</li>
              <li>Direct UPI payment details provided must belong to the registered Rotaract Club or designated treasurer account.</li>
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}
