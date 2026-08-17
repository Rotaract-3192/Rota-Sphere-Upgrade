"use client";

import { useState } from "react";
import { Mail, Phone, MapPin, Send, CheckCircle2, Shield, Clock } from "lucide-react";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    club: "",
    subject: "Pass Booking / UTR Query",
    message: "",
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;
    setSubmitted(true);
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <section className="bg-gray-900 text-white py-14 sm:py-20 px-4 sm:px-6 lg:px-8 text-center relative overflow-hidden">
        <div className="max-w-3xl mx-auto space-y-4 relative z-10 flex flex-col items-center justify-center">
          <span className="text-xs font-black uppercase tracking-widest text-[#60a5fa] inline-flex items-center justify-center gap-1.5">
            <Mail size={14} /> District Secretariat
          </span>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight w-full text-center block">
            Contact District 3192 Support
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 w-full max-w-xl mx-auto text-center block leading-relaxed">
            Have a question about event passes, UPI payment verification, or organizer access? Our District Secretariat team is here to assist you.
          </p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Details Column */}
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
              <h2 className="text-lg font-black text-gray-900">Get in Touch</h2>

              <div className="space-y-5 text-xs sm:text-sm">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-50 text-[#1e9df1] rounded-2xl flex items-center justify-center shrink-0">
                    <Mail size={18} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Technical Support</span>
                    <a href="mailto:thejaswinps@gmail.com" className="font-bold text-gray-900 hover:text-[#1e9df1] transition-colors">
                      thejaswinps@gmail.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
                    <Clock size={18} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Support SLA</span>
                    <span className="font-bold text-gray-900">24 Hours Response SLA</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center shrink-0">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">District Secretariat</span>
                    <span className="font-bold text-gray-900">Rotaract District 3192 Headquarters, Bengaluru, Karnataka, India</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-900 to-slate-900 text-white rounded-3xl p-6 shadow-md space-y-3">
              <div className="flex items-center gap-2">
                <Shield size={18} className="text-[#60a5fa]" />
                <h3 className="font-bold text-sm">Direct Settlement Guarantee</h3>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">
                All event ticketing payments settle 100% directly to verified host Rotaract Club bank accounts. RotaSphere charges 0% platform markup.
              </p>
            </div>
          </div>

          {/* Form Column */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-10 shadow-xs space-y-6">
              <h2 className="text-xl font-black text-gray-900">Send us a Message</h2>

              {submitted ? (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-3xl p-8 text-center space-y-3">
                  <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <CheckCircle2 size={30} />
                  </div>
                  <h3 className="text-lg font-black text-emerald-950">Message Submitted!</h3>
                  <p className="text-xs text-emerald-800 leading-relaxed max-w-sm mx-auto">
                    Thank you for reaching out. Our District Secretariat team has received your query and will reply to your registered email address shortly.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSubmitted(false)}
                    className="mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition-all cursor-pointer"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Rtr. Rahul Kumar"
                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-xs sm:text-sm text-gray-900 outline-none focus:border-[#1e9df1] focus:bg-white transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700">Email Address *</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="rahul@example.com"
                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-xs sm:text-sm text-gray-900 outline-none focus:border-[#1e9df1] focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700">Rotaract Club Name (Optional)</label>
                      <input
                        type="text"
                        value={formData.club}
                        onChange={(e) => setFormData({ ...formData, club: e.target.value })}
                        placeholder="e.g. Rotaract Club of Koramangala"
                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-xs sm:text-sm text-gray-900 outline-none focus:border-[#1e9df1] focus:bg-white transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700">Query Category *</label>
                      <select
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-xs sm:text-sm text-gray-900 outline-none focus:border-[#1e9df1] focus:bg-white transition-all"
                      >
                        <option value="Pass Booking / UTR Query">Pass Booking / UTR Query</option>
                        <option value="Gate Scanner Assistance">Gate Scanner Assistance</option>
                        <option value="Organizer Access Request">Organizer Access Request</option>
                        <option value="Refund & Dispute Escalation">Refund &amp; Dispute Escalation</option>
                        <option value="General District Inquiry">General District Inquiry</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700">Your Message *</label>
                    <textarea
                      required
                      rows={5}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Please describe your query in detail..."
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-xs sm:text-sm text-gray-900 outline-none focus:border-[#1e9df1] focus:bg-white transition-all resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#1e9df1] hover:bg-[#1583cd] text-white font-extrabold text-xs sm:text-sm py-4 rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95 text-center"
                  >
                    <Send size={16} /> Send Message to District Secretariat
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
