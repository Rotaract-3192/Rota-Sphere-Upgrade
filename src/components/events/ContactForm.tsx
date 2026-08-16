"use client";

/**
 * ContactForm — Interactive Light-Mode Inquiry Form
 * RotaSphere Design System: Clean white/blue, high contrast, crisp inputs.
 */

import { useState } from "react";
import { Send, Phone, Mail, User, CheckCircle2 } from "lucide-react";

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
      <div className="lg:col-span-7 bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center space-y-3">
        <CheckCircle2 size={48} className="text-emerald-600 mx-auto" />
        <h4 className="text-2xl font-bold text-gray-900">Inquiry Received!</h4>
        <p className="text-sm text-gray-600">
          Thank you, <span className="font-bold text-gray-900">{name}</span>. Our District 3192 Team will contact you at <span className="font-bold text-gray-900">{phone}</span> within 24 hours.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-5">
      <div>
        <label htmlFor="user-name" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
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
            className="w-full bg-gray-50/80 hover:bg-gray-50 focus:bg-white border border-gray-200 focus:border-[#1e9df1] focus:ring-4 focus:ring-[#1e9df1]/10 rounded-2xl px-4 py-3 pl-10 text-sm font-medium text-gray-900 placeholder:text-gray-400 outline-none transition-all"
          />
        </div>
      </div>

      <div>
        <label htmlFor="user-phone" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
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
            className="w-full bg-gray-50/80 hover:bg-gray-50 focus:bg-white border border-gray-200 focus:border-[#1e9df1] focus:ring-4 focus:ring-[#1e9df1]/10 rounded-2xl px-4 py-3 pl-10 text-sm font-medium text-gray-900 placeholder:text-gray-400 outline-none transition-all"
          />
        </div>
      </div>

      <div>
        <label htmlFor="user-comment" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
          Message / Club Details
        </label>
        <textarea
          id="user-comment"
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tell us about your event or inquiry..."
          className="w-full bg-gray-50/80 hover:bg-gray-50 focus:bg-white border border-gray-200 focus:border-[#1e9df1] focus:ring-4 focus:ring-[#1e9df1]/10 rounded-2xl p-4 text-sm font-medium text-gray-900 placeholder:text-gray-400 outline-none transition-all resize-none"
        />
      </div>

      <button
        type="submit"
        className="w-full bg-[#1e9df1] hover:bg-[#1583cd] text-white font-extrabold text-sm py-3.5 rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 shadow-md shadow-[#1e9df1]/20 active:scale-98 cursor-pointer"
      >
        <Send size={16} /> Send Inquiry
      </button>
    </form>
  );
}
