"use client";

import { useState } from "react";
import { ShieldCheck, CheckCircle2, X, ExternalLink, Calendar, Building, Hash, Info, Award } from "lucide-react";

interface DirectoryVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DirectoryVerificationModal({ isOpen, onClose }: DirectoryVerificationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          aria-label="Close directory verification details"
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Award size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 px-2.5 py-0.5 rounded-full">
                Active &amp; Authenticated
              </span>
            </div>
            <h3 className="text-lg font-black text-gray-900 dark:text-white tracking-tight mt-1">
              District Directory Verification
            </h3>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
          This verification confirms that <strong>RotaSphere</strong> is officially recognized and authenticated against the active Rotaract District 3192 Directory for Rotary Year 2026–27.
        </p>

        {/* Verification Details Grid */}
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 sm:p-5 border border-gray-200/80 dark:border-gray-700/60 space-y-3.5 text-xs">
          <div className="flex items-center justify-between py-1 border-b border-gray-200/50 dark:border-gray-700/50">
            <span className="text-gray-500 dark:text-gray-400 font-medium flex items-center gap-1.5">
              <Building size={14} className="text-[#0758fc]" /> Organization Authority
            </span>
            <span className="font-bold text-gray-900 dark:text-white">
              Rotaract District 3192 Council
            </span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-gray-200/50 dark:border-gray-700/50">
            <span className="text-gray-500 dark:text-gray-400 font-medium flex items-center gap-1.5">
              <Calendar size={14} className="text-amber-500" /> Verification Period
            </span>
            <span className="font-bold text-gray-900 dark:text-white">
              RY 2026–27 (1 July 2026 – 30 June 2027)
            </span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-gray-200/50 dark:border-gray-700/50">
            <span className="text-gray-500 dark:text-gray-400 font-medium flex items-center gap-1.5">
              <Hash size={14} className="text-purple-500" /> Verification ID
            </span>
            <span className="font-mono font-bold text-gray-900 dark:text-white bg-gray-200/60 dark:bg-gray-700 px-2 py-0.5 rounded text-[11px]">
              RD3192-DIR-2026-V8
            </span>
          </div>

          <div className="flex items-center justify-between py-1">
            <span className="text-gray-500 dark:text-gray-400 font-medium flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-emerald-500" /> Target Scope
            </span>
            <span className="font-bold text-gray-900 dark:text-white">
              Council, Clubs &amp; Host Organizers
            </span>
          </div>
        </div>

        {/* Verification What it Means */}
        <div className="space-y-2 text-xs text-gray-600 dark:text-gray-300">
          <h4 className="font-bold text-gray-900 dark:text-white text-xs uppercase tracking-wider">
            What Directory Verification Validates:
          </h4>
          <ul className="space-y-1.5 list-disc pl-4 text-gray-500 dark:text-gray-400">
            <li>Club President, Secretary, and Treasurer credentials match official district records.</li>
            <li>Direct settlement bank accounts or official UPI IDs are validated prior to event ticket sales.</li>
            <li>Event organizers are bound by Rotaract District 3192 event governance protocols.</li>
          </ul>
        </div>

        {/* Legal Disclaimer Box */}
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-[11px] text-amber-800 dark:text-amber-300">
          <Info size={16} className="shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
          <p>
            <strong>Disclaimer:</strong> Directory Verification certifies organizational alignment and chartered club identity within Rotaract District 3192. It does not constitute statutory government certification or endorsement.
          </p>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full bg-[#0758fc] hover:bg-[#054fe0] text-white font-extrabold text-xs py-3 rounded-2xl shadow-md transition-all cursor-pointer"
          >
            Acknowledge &amp; Close
          </button>
        </div>
      </div>
    </div>
  );
}
