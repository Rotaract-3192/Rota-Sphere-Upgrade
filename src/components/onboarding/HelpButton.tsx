"use client";

/**
 * HelpButton — Floating ? button that opens the RotaSphere Help & Tour Menu.
 * 100% styled in accordance with RotaSphere's clean design tokens.
 */

import React from "react";
import { useOnboarding } from "./OnboardingProvider";
import { attendeeTourSteps, organizerDashboardTourSteps } from "./tourSteps";
import { HelpCircle, Compass, Calendar, Mail, X } from "lucide-react";

export function HelpButton() {
  const { showHelp, setShowHelp, startTour, tourActive } = useOnboarding();

  // Don't render floating trigger while tour is active
  if (tourActive) return null;

  const menuItems = [
    {
      icon: Compass,
      iconBg: "bg-blue-50 dark:bg-blue-950/60 text-[#0758fc]",
      label: "Take Attendee Tour",
      desc: "How to browse, search & book passes",
      onClick: () => {
        setShowHelp(false);
        startTour(attendeeTourSteps);
      },
    },
    {
      icon: Calendar,
      iconBg: "bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400",
      label: "Take Organizer Tour",
      desc: "Dashboard, orders & ticket tiers",
      onClick: () => {
        setShowHelp(false);
        startTour(organizerDashboardTourSteps);
      },
    },
    {
      icon: Mail,
      iconBg: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400",
      label: "District Support",
      desc: "Email tech.rotaract3192@gmail.com",
      onClick: () => {
        setShowHelp(false);
        window.open("mailto:tech.rotaract3192@gmail.com", "_blank");
      },
    },
  ];

  return (
    <>
      {/* Backdrop overlay */}
      {showHelp && (
        <div
          className="fixed inset-0 z-[99975] bg-black/20 dark:bg-black/40 backdrop-blur-[1px]"
          onClick={() => setShowHelp(false)}
        />
      )}

      {/* Floating Menu Popover */}
      {showHelp && (
        <div className="fixed bottom-24 right-5 sm:right-7 z-[99980] w-72 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-4 shadow-2xl shadow-blue-500/15 dark:shadow-black/70 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-center justify-between px-2 pt-1 pb-2 border-b border-gray-100 dark:border-gray-800">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#0758fc]">
              Guided Walkthrough
            </span>
            <button
              type="button"
              onClick={() => setShowHelp(false)}
              className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <X size={14} />
            </button>
          </div>

          <div className="space-y-1 mt-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={item.onClick}
                  className="w-full flex items-start gap-3 p-2.5 rounded-2xl text-left hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors cursor-pointer group"
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${item.iconBg}`}
                  >
                    <Icon size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="block text-xs font-extrabold text-gray-900 dark:text-white group-hover:text-[#0758fc] transition-colors">
                      {item.label}
                    </span>
                    <span className="block text-[11px] text-gray-500 dark:text-gray-400 truncate leading-snug">
                      {item.desc}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Floating Trigger Button */}
      <button
        type="button"
        onClick={() => setShowHelp(!showHelp)}
        aria-label="Open Help & Tours"
        title="Need help navigating? Click for guided tours"
        className={`fixed bottom-6 right-5 sm:right-7 z-[99980] w-12 h-12 rounded-full flex items-center justify-center shadow-xl transition-all duration-200 cursor-pointer active:scale-95 ${
          showHelp
            ? "bg-[#0758fc] text-white shadow-blue-500/30 scale-105"
            : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 hover:text-[#0758fc] dark:hover:text-white border border-gray-200 dark:border-gray-800 hover:border-[#0758fc] shadow-gray-400/20 dark:shadow-black/60 hover:scale-105"
        }`}
      >
        {showHelp ? <X size={20} /> : <HelpCircle size={22} />}
      </button>
    </>
  );
}
