import { FileText, ShieldCheck, RefreshCw, CalendarX, AlertTriangle } from "lucide-react";

export const metadata = {
  title: "Cancellation Policy | RotaSphere District 3192",
  description: "Official cancellation terms for Rotaract District 3192 delegate passes and event registrations.",
};

export default function CancellationPolicyPage() {
  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      <section className="bg-gray-900 text-white py-14 sm:py-20 px-4 sm:px-6 lg:px-8 text-center relative overflow-hidden">
        <div className="max-w-3xl mx-auto space-y-4 relative z-10">
          <span className="text-xs font-black uppercase tracking-widest text-[#60a5fa] inline-flex items-center gap-1.5">
            <FileText size={14} /> District Governance
          </span>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            Event Cancellation Policy
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 max-w-xl mx-auto leading-relaxed">
            Terms governing ticket pass cancellations, event postponements, and delegate substitution rights across Rotaract District 3192 events.
          </p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 space-y-8 text-gray-800 text-xs sm:text-sm leading-relaxed">
        <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-10 shadow-xs space-y-6">
          <div className="space-y-3">
            <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
              <ShieldCheck className="text-[#1e9df1]" size={20} /> 1. Overview &amp; District Standards
            </h2>
            <p>
              RotaSphere serves as the official ticketing and gate check-in platform for Rotaract District 3192 events. All event passes, registrations, and delegate credentials issued through RotaSphere are subject to the cancellation policies established by the respective Host Rotaract Club and the District Secretariat.
            </p>
          </div>

          <div className="border-t border-gray-100 pt-6 space-y-3">
            <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
              <CalendarX className="text-rose-600" size={20} /> 2. Attendee-Initiated Cancellations
            </h2>
            <ul className="list-disc pl-5 space-y-2 text-gray-600">
              <li>
                <strong>Cancellations 48+ Hours Prior:</strong> Delegates seeking to cancel their registered pass more than 48 hours prior to event commencement must submit a cancellation request through <code>My Passes (/tickets)</code> or contact the host club organizer directly.
              </li>
              <li>
                <strong>Late Cancellations (&lt; 48 Hours):</strong> Cancellations requested within 48 hours of event start time are non-refundable unless explicitly permitted by the host organizer due to emergency medical circumstances.
              </li>
              <li>
                <strong>Unverified UTR Submissions:</strong> Bookings cancelled prior to organizer UTR payment verification will automatically release the reserved ticket back into public inventory.
              </li>
            </ul>
          </div>

          <div className="border-t border-gray-100 pt-6 space-y-3">
            <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
              <RefreshCw className="text-emerald-600" size={20} /> 3. Ticket Transfers &amp; Delegate Substitution
            </h2>
            <p>
              If a registered delegate is unable to attend an event, RotaSphere provides a complimentary <strong>Pass Transfer</strong> facility. Delegates may transfer their confirmed pass to any active Rotaract member or attendee by entering the recipient&apos;s registered email address in <code>My Passes (/tickets)</code>.
            </p>
          </div>

          <div className="border-t border-gray-100 pt-6 space-y-3">
            <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
              <AlertTriangle className="text-amber-600" size={20} /> 4. Organizer Postponement or Force Majeure
            </h2>
            <p>
              In the event that an event is postponed, rescheduled, or cancelled by the Host Rotaract Club or District Secretariat due to adverse weather, administrative directives, or force majeure:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-gray-600">
              <li>All existing issued passes shall remain valid for the rescheduled date.</li>
              <li>Delegates unable to attend on the rescheduled date are entitled to a 100% full refund of the ticket price processed directly by the host club.</li>
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}
