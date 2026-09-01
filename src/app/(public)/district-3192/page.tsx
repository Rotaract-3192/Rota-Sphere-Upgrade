import Link from "next/link";
import { Globe, Users, Trophy, Sparkles, MapPin, ArrowRight } from "lucide-react";

export const metadata = {
  title: "Rotaract District 3192 Secretariat & Leadership | RotaSphere",
  description:
    "Official portal for Rotary International District 3192 member clubs, district council leadership, and youth initiatives across Karnataka.",
  alternates: {
    canonical: "/district",
  },
  openGraph: {
    title: "Rotaract District 3192 Secretariat",
    description: "Official portal for Rotary International District 3192 member clubs and leadership.",
    url: "/district",
    siteName: "RotaSphere District 3192",
    locale: "en_IN",
    type: "website",
    images: ["/brand-logo.png"],
  },
};

export default function District3192Page() {
  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      <section className="bg-gray-900 text-white py-16 sm:py-24 px-4 sm:px-6 lg:px-8 text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto space-y-6 relative z-10">
          <span className="text-xs font-black uppercase tracking-widest text-[#60a5fa] inline-flex items-center gap-1.5">
            <Globe size={14} /> Rotary International District 3192
          </span>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            Rotaract District 3192 Secretariat
          </h1>
          <p className="text-xs sm:text-base text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Uniting vibrant young leaders across Bengaluru and Karnataka. Driving community service, professional development, and international youth fellowships.
          </p>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 space-y-3 shadow-xs text-center">
            <div className="w-12 h-12 bg-blue-50 text-[#0758fc] rounded-2xl flex items-center justify-center mx-auto">
              <Users size={24} />
            </div>
            <h2 className="text-2xl font-black text-gray-900">50+</h2>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Chartered Clubs</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 space-y-3 shadow-xs text-center">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
              <Sparkles size={24} />
            </div>
            <h2 className="text-2xl font-black text-gray-900">2,500+</h2>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Active Rotaractors</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 space-y-3 shadow-xs text-center">
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mx-auto">
              <Trophy size={24} />
            </div>
            <h2 className="text-2xl font-black text-gray-900">100+</h2>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Annual District Projects</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-3xl p-8 sm:p-10 space-y-6 shadow-xs">
          <h2 className="text-xl font-black text-gray-900">District Core Avenues</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-1">
              <h3 className="font-bold text-gray-900 text-sm">Community Service</h3>
              <p className="text-gray-600 leading-relaxed">Impactful blood donation drives, environmental conservation, and educational empowerment initiatives.</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-1">
              <h3 className="font-bold text-gray-900 text-sm">Professional Development</h3>
              <p className="text-gray-600 leading-relaxed">Leadership masterclasses, career summits, and executive networking sessions for young professionals.</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-1">
              <h3 className="font-bold text-gray-900 text-sm">Club Service &amp; Fellowships</h3>
              <p className="text-gray-600 leading-relaxed">Inter-club sports leagues, cultural youth festivals, and district assembly conventions.</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-1">
              <h3 className="font-bold text-gray-900 text-sm">International Service</h3>
              <p className="text-gray-600 leading-relaxed">Global Rotaract twin club agreements and international cultural exchange programs.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
