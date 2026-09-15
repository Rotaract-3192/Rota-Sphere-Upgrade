"use client";

/**
 * WelcomeModal — RotaSphere Onboarding Welcome Dialog.
 * Styled with 100% fidelity to RotaSphere's clean design system (light & dark mode).
 * Allows users to choose between the Attendee Tour and Organizer Command Tour.
 */

import React, { useState } from "react";
import Image from "next/image";
import { useOnboarding } from "./OnboardingProvider";
import { attendeeTourSteps, organizerDashboardTourSteps } from "./tourSteps";
import { Sparkles, Calendar, Ticket, ArrowRight, X, Users, Compass, ShieldCheck } from "lucide-react";

export function WelcomeModal() {
  const { showWelcome, dismissWelcome, startTour } = useOnboarding();
  const [selectedRole, setSelectedRole] = useState<"attendee" | "organizer">("attendee");
  const [exiting, setExiting] = useState(false);

  if (!showWelcome) return null;

  function handleStartSelectedTour() {
    setExiting(true);
    setTimeout(() => {
      dismissWelcome();
      if (selectedRole === "organizer") {
        startTour(organizerDashboardTourSteps);
      } else {
        startTour(attendeeTourSteps);
      }
    }, 250);
  }

  function handleClose() {
    setExiting(true);
    setTimeout(dismissWelcome, 250);
  }

  return (
    <div
      className={`fixed inset-0 z-[99990] flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-xs transition-opacity duration-200 ${
        exiting ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div
        className={`relative w-full max-w-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-blue-500/15 dark:shadow-black/80 transition-all duration-200 ${
          exiting ? "scale-95 translate-y-2 opacity-0" : "scale-100 translate-y-0 opacity-100"
        }`}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-5 right-5 p-1.5 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        {/* Brand Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="relative w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 p-2 flex items-center justify-center shrink-0">
            <Image
              src="/brand/logo.png"
              alt="District 3192 Logo"
              fill
              className="object-contain p-1.5"
              priority
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black uppercase tracking-wider text-[#0758fc]">
                District 3192
              </span>
              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500">
                · Official Platform
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">
              Welcome to RotaSphere
            </h2>
          </div>
        </div>

        {/* Intro */}
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
          The official ticketing, registrations, and event management ecosystem connecting <strong>85+ chartered Rotaract clubs</strong> across Bengaluru and Karnataka.
        </p>

        {/* Role Selector Cards */}
        <div className="space-y-2.5 mb-6">
          <label className="text-[11px] font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-wider block">
            Select your guided experience:
          </label>

          {/* Attendee Option */}
          <div
            onClick={() => setSelectedRole("attendee")}
            className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 ${
              selectedRole === "attendee"
                ? "bg-blue-50/70 dark:bg-blue-950/40 border-[#0758fc] shadow-sm ring-1 ring-[#0758fc]"
                : "bg-gray-50/60 dark:bg-gray-800/40 border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700"
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-[#0758fc] flex items-center justify-center shrink-0">
              <Ticket size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-extrabold text-gray-900 dark:text-white">
                  I'm an Attendee / Member
                </span>
                {selectedRole === "attendee" && (
                  <span className="w-2 h-2 rounded-full bg-[#0758fc]" />
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">
                Browse conferences &amp; youth fests, book delegate passes, and access gate entry QR tickets.
              </p>
            </div>
          </div>

          {/* Organizer Option */}
          <div
            onClick={() => setSelectedRole("organizer")}
            className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 ${
              selectedRole === "organizer"
                ? "bg-blue-50/70 dark:bg-blue-950/40 border-[#0758fc] shadow-sm ring-1 ring-[#0758fc]"
                : "bg-gray-50/60 dark:bg-gray-800/40 border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700"
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <Calendar size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-extrabold text-gray-900 dark:text-white">
                  I'm an Event Organizer
                </span>
                {selectedRole === "organizer" && (
                  <span className="w-2 h-2 rounded-full bg-[#0758fc]" />
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">
                Publish club events, verify direct UPI payments, configure bulk slabs, and export attendee rosters.
              </p>
            </div>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-3 gap-2 text-center mb-6 pt-1">
          <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800">
            <span className="text-sm font-black text-[#0758fc] block">85+ Clubs</span>
            <span className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold">Chartered</span>
          </div>
          <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800">
            <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 block">0% Fee</span>
            <span className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold">Direct UPI</span>
          </div>
          <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800">
            <span className="text-sm font-black text-amber-500 block">Instant QR</span>
            <span className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold">Gate Entry</span>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 py-3 px-4 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 transition-colors cursor-pointer"
          >
            Explore on My Own
          </button>

          <button
            type="button"
            onClick={handleStartSelectedTour}
            className="flex-1 py-3 px-4 rounded-xl text-xs font-extrabold text-white bg-[#0758fc] hover:bg-[#054fe0] shadow-md shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <Compass size={15} />
            <span>Take Guided Tour</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
