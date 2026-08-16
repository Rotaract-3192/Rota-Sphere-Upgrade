"use client";

/**
 * ContactForm — Interactive Glassmorphism Inquiry Form
 * DESIGN-airbnb.md & Cinematic dark showcase style
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
      <div className="lg:col-span-7 bg-amber-500/10 border border-amber-400/30 rounded-2xl p-8 text-center space-y-3">
        <CheckCircle2 size={48} className="text-amber-400 mx-auto" />
        <h4 className="text-2xl font-bold text-white">Inquiry Received!</h4>
        <p className="text-sm text-gray-300">
          Thank you, {name}. Our District 3192 Team will contact you at {phone} within 24 hours.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-4">
      <div>
        <label htmlFor="user-name" className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
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
            className="w-full bg-black/40 border border-white/15 rounded-xl px-4 py-3 pl-10 text-sm text-white placeholder:text-gray-500 outline-none focus:border-amber-400 transition-colors"
          />
        </div>
      </div>

      <div>
        <label htmlFor="user-phone" className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
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
            className="w-full bg-black/40 border border-white/15 rounded-xl px-4 py-3 pl-10 text-sm text-white placeholder:text-gray-500 outline-none focus:border-amber-400 transition-colors"
          />
        </div>
      </div>

      <div>
        <label htmlFor="user-comment" className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
          Message / Club Details
        </label>
        <textarea
          id="user-comment"
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tell us about your event or inquiry..."
          className="w-full bg-black/40 border border-white/15 rounded-xl p-4 text-sm text-white placeholder:text-gray-500 outline-none focus:border-amber-400 transition-colors resize-none"
        />
      </div>

      <button
        type="submit"
        className="w-full bg-white hover:bg-amber-400 text-gray-900 font-bold text-sm py-3.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg cursor-pointer"
      >
        <Send size={16} /> Send Inquiry
      </button>
    </form>
  );
}
