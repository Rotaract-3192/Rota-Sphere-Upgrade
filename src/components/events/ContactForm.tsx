"use client";

/**
 * ContactForm — Mobile-First Interactive Inquiry Form
 * RotaSphere Design System: Clean white/blue, high contrast, crisp touch targets.
 */

import { useState } from "react";
import { Send, Phone, Mail, User, CheckCircle2, MessageSquare } from "lucide-react";

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !phone) return;
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="lg:col-span-7 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-3xl p-6 sm:p-8 text-center space-y-3 animate-fade-in-up">
        <CheckCircle2 size={44} className="text-emerald-600 dark:text-emerald-400 mx-auto" />
        <h4 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">Inquiry Received!</h4>
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 max-w-sm mx-auto leading-relaxed">
          Thank you, <strong className="text-gray-900 dark:text-white">{name}</strong>. Our District 3192 Team will contact you at <strong className="text-gray-900 dark:text-white">{phone}</strong> within 24 hours.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-4 sm:space-y-5 animate-fade-in-up">
      <div>
        <label htmlFor="user-name" className="block text-[11px] sm:text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
          Your Name
        </label>
        <div className="relative">
          <User size={16} className="absolute left-3.5 top-3.5 text-gray-400" />
          <input
            id="user-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your full name"
            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:border-[#0758fc] focus:bg-white dark:focus:bg-gray-900 focus:ring-4 focus:ring-[#0758fc]/15 rounded-2xl px-4 py-3 pl-10 text-base sm:text-sm font-medium text-gray-900 dark:text-white placeholder:text-gray-400 outline-none transition-all"
          />
        </div>
      </div>

      <div>
        <label htmlFor="user-phone" className="block text-[11px] sm:text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
          Phone / WhatsApp Number
        </label>
        <div className="relative">
          <Phone size={16} className="absolute left-3.5 top-3.5 text-gray-400" />
          <input
            id="user-phone"
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91 98765 43210"
            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:border-[#0758fc] focus:bg-white dark:focus:bg-gray-900 focus:ring-4 focus:ring-[#0758fc]/15 rounded-2xl px-4 py-3 pl-10 text-base sm:text-sm font-medium text-gray-900 dark:text-white placeholder:text-gray-400 outline-none transition-all"
          />
        </div>
      </div>

      <div>
        <label htmlFor="user-comment" className="block text-[11px] sm:text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
          Message / Club Details
        </label>
        <div className="relative">
          <textarea
            id="user-comment"
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tell us about your event or inquiry..."
            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:border-[#0758fc] focus:bg-white dark:focus:bg-gray-900 focus:ring-4 focus:ring-[#0758fc]/15 rounded-2xl p-3.5 sm:p-4 text-base sm:text-sm font-medium text-gray-900 dark:text-white placeholder:text-gray-400 outline-none transition-all resize-none"
          />
        </div>
      </div>

      <button
        type="submit"
        className="w-full bg-[#0758fc] hover:bg-[#054fe0] text-white font-black text-xs sm:text-sm py-3.5 rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 shadow-md shadow-[#0758fc]/20 active:scale-95 cursor-pointer"
      >
        <Send size={16} /> Send Inquiry
      </button>
    </form>
  );
}
