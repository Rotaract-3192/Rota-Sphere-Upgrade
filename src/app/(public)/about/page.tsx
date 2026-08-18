import Image from "next/image";
import Link from "next/link";
import { Sparkles, Shield, Heart, Trophy, ArrowRight } from "lucide-react";

export const metadata = {
  title: "About Us | RotaSphere District 3192",
  description: "Official multi-tenant ticketing platform for Rotaract District 3192.",
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      <section className="bg-gray-900 text-white py-16 sm:py-24 px-4 sm:px-6 lg:px-8 text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto space-y-6 relative z-10">
          <span className="text-xs font-black uppercase tracking-widest text-[#60a5fa] inline-flex items-center gap-1.5">
            <Sparkles size={14} /> Official District Platform
          </span>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            Empowering Youth Leadership &amp; Fellowships Across District 3192
          </h1>
          <p className="text-xs sm:text-base text-gray-400 max-w-2xl mx-auto leading-relaxed">
            RotaSphere is the purpose-built ticketing, pass management, and gate check-in infrastructure engineered exclusively for Rotaract District 3192.
          </p>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 space-y-3 shadow-xs">
            <div className="w-12 h-12 bg-blue-50 text-[#0758fc] rounded-2xl flex items-center justify-center">
              <Shield size={24} />
            </div>
            <h2 className="text-base font-black text-gray-900">0% Platform Fees</h2>
            <p className="text-xs text-gray-600 leading-relaxed">
              100% of event registration fees settle directly to host Rotaract Club bank accounts via UPI. No middleman markups.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 space-y-3 shadow-xs">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
              <Heart size={24} />
            </div>
            <h2 className="text-base font-black text-gray-900">Fellowship First</h2>
            <p className="text-xs text-gray-600 leading-relaxed">
              Designed to connect thousands of Rotaractors across district flagship conventions, sports leagues, and cultural nights.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 space-y-3 shadow-xs">
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center">
              <Trophy size={24} />
            </div>
            <h2 className="text-base font-black text-gray-900">Instant Gate QR Verification</h2>
            <p className="text-xs text-gray-600 leading-relaxed">
              High-speed encrypted gate scanner app enables sub-second delegate pass check-in at event entry.
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-gray-900 to-slate-900 text-white rounded-3xl p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl">
          <div className="space-y-2 text-center md:text-left">
            <h2 className="text-2xl font-black text-white">Ready to explore District 3192 Events?</h2>
            <p className="text-xs text-gray-400">Discover upcoming conferences, masterclasses, and fellowship nights.</p>
          </div>
          <Link
            href="/events"
            className="bg-[#0758fc] hover:bg-[#054fe0] text-white font-extrabold text-xs sm:text-sm px-8 py-4 rounded-2xl shadow-lg flex items-center gap-2 cursor-pointer transition-all active:scale-95 shrink-0"
          >
            Explore Events <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </main>
  );
}
