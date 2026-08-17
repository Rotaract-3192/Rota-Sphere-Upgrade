import Link from "next/link";
import { Search, HelpCircle, Ticket, QrCode, ShieldCheck, RefreshCw, Mail, ArrowRight } from "lucide-react";
import { LastUpdatedBadge } from "@/components/ui/LastUpdatedBadge";

export const metadata = {
  title: "Help Centre & Support | RotaSphere District 3192",
  description: "Get answers to pass bookings, UPI payment verification, QR gate entry, ticket transfers, and organizer approvals.",
};

const FAQS = [
  {
    category: "Pass Bookings & Payments",
    icon: Ticket,
    questions: [
      {
        q: "How do I pay using UPI on RotaSphere?",
        a: "When booking a ticket, select 'Pay with UPI App' on mobile or scan the dynamic UPI QR code on desktop using GPay, PhonePe, or Paytm. After transferring the exact amount, enter your 12-digit UTR/UPI Reference number in the checkout form to submit your booking for organizer verification.",
      },
      {
        q: "Why is my ticket status showing 'PENDING UPI APPROVAL'?",
        a: "All Rotaract event payments settle 100% directly to the host club's bank account. Once your submitted 12-digit UTR reference is verified by the host organizer, your ticket status changes to ISSUED and your scannable QR pass unlocks.",
      },
      {
        q: "What if I entered the wrong UTR reference number?",
        a: "Go to 'My Passes' (/tickets) from the main menu, locate your pending ticket, and click 'Update UTR' to re-enter your correct 12-digit transaction reference number.",
      },
    ],
  },
  {
    category: "Gate Entry & QR Pass Scanner",
    icon: QrCode,
    questions: [
      {
        q: "When will my scannable Gate Entry QR Code unlock?",
        a: "Your Gate Entry QR Code unlocks automatically as soon as your UPI payment is approved by the host organizer. Unapproved or rejected passes remain locked to prevent fraudulent entry.",
      },
      {
        q: "Can I download my delegate pass to my phone?",
        a: "Yes! Once approved, open 'My Passes' (/tickets) and click 'Download Pass' to save a high-contrast PNG badge complete with event details, delegate name, and scannable QR code.",
      },
      {
        q: "How does gate verification work at District 3192 events?",
        a: "Event check-in operators use the official RotaSphere Scanner (/check-in) to scan your pass. Each QR token is encrypted and single-use to guarantee security.",
      },
    ],
  },
  {
    category: "Organizer Rights & Dashboard Access",
    icon: ShieldCheck,
    questions: [
      {
        q: "How do I get access to host an event on RotaSphere?",
        a: "Rotaract Club Presidents, Secretaries, and Event Chairs can request host access by visiting '/dashboard' and submitting their Rotaract Club Name, Designation, and Event Details. Applications are reviewed and approved by the District Super Administrator.",
      },
      {
        q: "Can other organizers see my event registration data?",
        a: "No. RotaSphere enforces strict multi-tenant data isolation. Organizers can strictly view and manage only their own created events, attendee lists, and financial ledgers.",
      },
    ],
  },
  {
    category: "Transfers, Refunds & Disputes",
    icon: RefreshCw,
    questions: [
      {
        q: "Can I transfer my pass to another Rotaract member?",
        a: "Yes. Issued tickets can be transferred to another delegate by opening 'My Passes' (/tickets) and clicking 'Transfer Pass'. Enter the recipient's registered email address to assign the ticket.",
      },
      {
        q: "How do I request a refund if an event is postponed or cancelled?",
        a: "Click 'Request Refund' on your ticket card in 'My Passes' (/tickets). Refund requests are governed by the event's Cancellation & Refund Policy.",
      },
    ],
  },
];

export default function HelpPage() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20 transition-colors">
      {/* Hero Search Header */}
      <section className="bg-gray-900 text-white py-14 sm:py-20 px-4 sm:px-6 lg:px-8 text-center relative overflow-hidden">
        <div className="w-full max-w-3xl mx-auto space-y-5 relative z-10">
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[#60a5fa] text-xs font-black uppercase tracking-widest">
              <HelpCircle size={14} /> District 3192 Support Hub
            </div>
            <LastUpdatedBadge date={new Date()} label="Help articles updated" />
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            How can we help you today?
          </h1>
          <p className="text-sm sm:text-base text-gray-400 max-w-xl mx-auto leading-relaxed">
            Find instant answers for delegate pass bookings, UPI payment verification, gate check-in scanning, and organizer access.
          </p>

          <div className="max-w-xl mx-auto relative pt-2">
            <Search size={18} className="absolute left-4.5 top-6 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search help topics (e.g. UTR payment, download pass, organizer access)..."
              className="w-full bg-white/10 border border-white/20 backdrop-blur-md rounded-2xl pl-12 pr-4 py-4 text-xs sm:text-sm text-white placeholder-gray-400 outline-none focus:border-[#1e9df1] focus:ring-2 focus:ring-[#1e9df1]/30 transition-all shadow-inner"
            />
          </div>
        </div>
      </section>

      {/* FAQ Categories */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {FAQS.map((cat, idx) => {
            const Icon = cat.icon;
            return (
              <div key={idx} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-blue-50 dark:bg-blue-950/40 text-[#1e9df1] rounded-2xl flex items-center justify-center shrink-0">
                    <Icon size={22} />
                  </div>
                  <h2 className="text-lg font-black text-gray-900 dark:text-white">{cat.category}</h2>
                </div>

                <div className="space-y-4 divide-y divide-gray-100 dark:divide-gray-800">
                  {cat.questions.map((faq, fIdx) => (
                    <div key={fIdx} className={fIdx > 0 ? "pt-4 space-y-1.5" : "space-y-1.5"}>
                      <h3 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white leading-snug w-full block">{faq.q}</h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed w-full block">{faq.a}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Support Banner */}
        <div className="bg-gradient-to-r from-gray-900 to-slate-900 text-white rounded-3xl p-8 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-1 text-center sm:text-left w-full sm:w-auto">
            <h3 className="text-xl font-black text-white w-full block">Still have questions?</h3>
            <p className="text-xs text-gray-400 w-full block">Our District Support Secretariat is available to assist you.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Link
              href="/contact"
              className="bg-[#1e9df1] hover:bg-[#1583cd] text-white font-extrabold text-xs px-6 py-3.5 rounded-2xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 text-center"
            >
              <Mail size={15} /> Contact Support
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

