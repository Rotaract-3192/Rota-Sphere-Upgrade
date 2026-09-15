"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageCircle, X, HelpCircle, Mail, Phone, Compass, Calendar } from "lucide-react";
import { useOnboarding } from "@/components/onboarding/OnboardingProvider";
import { attendeeTourSteps, organizerDashboardTourSteps } from "@/components/onboarding/tourSteps";

export function FloatingContactButton() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { startTour, tourActive } = useOnboarding();

  // Don't render while a guided tour is active
  if (tourActive) return null;

  // Suppress on scanner or admin panel
  if (
    pathname.startsWith("/check-in") ||
    pathname.startsWith("/admin")
  ) {
    return null;
  }

  const isOrganizerArea = pathname.startsWith("/dashboard");

  const handleStartAttendeeTour = () => {
    setOpen(false);
    startTour(attendeeTourSteps);
  };

  const handleStartOrganizerTour = () => {
    setOpen(false);
    startTour(organizerDashboardTourSteps);
  };

  return (
    <div className="fixed bottom-20 md:bottom-6 left-4 md:left-auto md:right-6 z-40 flex flex-col items-start md:items-end">
      {/* Popover Menu */}
      {open && (
        <div className="mb-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-4 shadow-2xl text-gray-900 dark:text-white space-y-3 w-72 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-2.5">
            <span className="text-xs font-black flex items-center gap-1.5 text-gray-900 dark:text-white">
              <HelpCircle size={15} className="text-[#0758fc]" /> Help &amp; Guided Tours
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close help popover"
              className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors cursor-pointer"
            >
              <X size={15} />
            </button>
          </div>

          {/* Guided Tours Section */}
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#0758fc] block px-1 pb-1">
              Interactive Tours
            </span>

            <button
              type="button"
              onClick={handleStartAttendeeTour}
              className="w-full flex items-start gap-2.5 p-2 rounded-2xl text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#0758fc] flex items-center justify-center shrink-0">
                <Compass size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-xs font-bold text-gray-900 dark:text-white group-hover:text-[#0758fc] transition-colors">
                  Take Platform Tour
                </span>
                <span className="block text-[11px] text-gray-500 dark:text-gray-400 truncate">
                  Browse, search &amp; book passes
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={handleStartOrganizerTour}
              className="w-full flex items-start gap-2.5 p-2 rounded-2xl text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                <Calendar size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-xs font-bold text-gray-900 dark:text-white group-hover:text-[#0758fc] transition-colors">
                  Organizer Dashboard Tour
                </span>
                <span className="block text-[11px] text-gray-500 dark:text-gray-400 truncate">
                  Ticket tiers, orders &amp; passes
                </span>
              </div>
            </button>
          </div>

          {/* Support & Contact Section */}
          <div className="space-y-1 border-t border-gray-100 dark:border-gray-800 pt-2 text-xs">
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500 block px-1 pb-1">
              District Resources
            </span>

            <Link
              href="/help"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300 font-bold"
            >
              <HelpCircle size={15} className="text-[#0758fc]" />
              <span>Help Center &amp; FAQs</span>
            </Link>

            <Link
              href="/contact"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300 font-bold"
            >
              <Mail size={15} className="text-emerald-500" />
              <span>Contact District Team</span>
            </Link>

            <a
              href="mailto:tech.rotaract3192@gmail.com"
              className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300 font-bold truncate"
            >
              <Phone size={15} className="text-pink-500 shrink-0" />
              <span className="truncate">tech.rotaract3192@gmail.com</span>
            </a>
          </div>
        </div>
      )}

      {/* Trigger Button — Single Unified Help & Support Pill */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Open support and guided tour options"
        className="p-3.5 rounded-2xl bg-[#0758fc] hover:bg-[#054fe0] text-white shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer flex items-center gap-2 font-bold text-xs group"
      >
        <MessageCircle size={18} className="group-hover:rotate-12 transition-transform shrink-0" />
        <span className="hidden sm:inline font-black">Support &amp; Guide</span>
      </button>
    </div>
  );
}
