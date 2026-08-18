import { Briefcase, Heart, Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Careers & Volunteer Opportunities | RotaSphere District 3192",
  description: "Join the Rotaract District 3192 technical and event organization team.",
};

export default function CareersPage() {
  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      <section className="bg-gray-900 text-white py-16 sm:py-24 px-4 sm:px-6 lg:px-8 text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto space-y-6 relative z-10">
          <span className="text-xs font-black uppercase tracking-widest text-[#60a5fa] inline-flex items-center gap-1.5">
            <Briefcase size={14} /> District Volunteer Corps
          </span>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            Build the Future of Youth Leadership
          </h1>
          <p className="text-xs sm:text-base text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Join the Rotaract District 3192 technical secretariat, event management team, and digital operations committee.
          </p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 space-y-8">
        <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-10 shadow-xs space-y-6">
          <h2 className="text-xl font-black text-gray-900">Open District Committee Roles</h2>
          
          <div className="space-y-4">
            <div className="p-5 border border-gray-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50/50">
              <div>
                <h3 className="text-sm font-bold text-gray-900">District Digital &amp; Tech Lead</h3>
                <p className="text-xs text-gray-500">Full-stack web development, Next.js, and serverless infrastructure.</p>
              </div>
              <Link
                href="/contact"
                className="bg-[#0758fc] hover:bg-[#054fe0] text-white font-extrabold text-xs px-5 py-2.5 rounded-xl transition-all w-fit shrink-0"
              >
                Apply Now
              </Link>
            </div>

            <div className="p-5 border border-gray-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50/50">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Event Gate Operations Manager</h3>
                <p className="text-xs text-gray-500">On-ground QR scanner operations and entry pass verification.</p>
              </div>
              <Link
                href="/contact"
                className="bg-[#0758fc] hover:bg-[#054fe0] text-white font-extrabold text-xs px-5 py-2.5 rounded-xl transition-all w-fit shrink-0"
              >
                Apply Now
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
