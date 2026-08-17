"use client";

import { useState } from "react";
import Link from "next/link";
import { MessageCircle, X, HelpCircle, Mail, Phone } from "lucide-react";

export function FloatingContactButton() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end">
      {/* Popover Menu */}
      {open && (
        <div className="mb-3 bg-gray-900/95 backdrop-blur-md border border-white/10 rounded-2xl p-4 shadow-2xl text-white space-y-3 w-64 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="text-xs font-black text-white flex items-center gap-1.5">
              <MessageCircle size={14} className="text-[#1e9df1]" /> Need Help?
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close help popover"
              className="text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>

          <div className="space-y-1.5 text-xs">
            <Link
              href="/help"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-white/10 transition-colors text-gray-200 font-bold"
            >
              <HelpCircle size={15} className="text-[#60a5fa]" />
              <span>Help Center &amp; FAQs</span>
            </Link>
            <Link
              href="/contact"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-white/10 transition-colors text-gray-200 font-bold"
            >
              <Mail size={15} className="text-[#34d399]" />
              <span>Contact District Team</span>
            </Link>
            <a
              href="mailto:support@rotaract3192.org"
              className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-white/10 transition-colors text-gray-200 font-bold"
            >
              <Phone size={15} className="text-[#f472b6]" />
              <span>support@rotaract3192.org</span>
            </a>
          </div>
        </div>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Open support and contact options"
        className="p-3.5 rounded-2xl bg-[#1e9df1] hover:bg-[#1583cd] text-white shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer flex items-center gap-2 font-bold text-xs group"
      >
        <MessageCircle size={18} className="group-hover:rotate-12 transition-transform" />
        <span className="hidden sm:inline">Support</span>
      </button>
    </div>
  );
}
