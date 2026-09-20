"use client";

/**
 * Sign Up Page
 * Supports Clerk authentication and fallback standalone preview mode.
 */

import { SignUp } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Shield } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function SignUpPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const envKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const hasClerkKey =
    Boolean(envKey) &&
    !envKey?.includes("replace_me") &&
    (envKey?.startsWith("pk_test_") || envKey?.startsWith("pk_live_"));

  function handlePreviewSignUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      router.push("/dashboard");
    }, 500);
  }

  return (
    <div className="min-h-screen bg-[#0b0d12] text-white flex flex-col justify-center items-center px-4 py-12">
      <div className="flex flex-col items-center mb-6 text-center">
        <Link href="/" className="flex flex-col items-center gap-2 group">
          <div className="relative w-20 h-20 group-hover:scale-105 transition-transform">
            <Image
              src="/brand/logo.png"
              alt="Rotaract District 3192 Ticketing"
              fill
              className="object-contain"
              priority
            />
          </div>
          <span className="font-black text-2xl tracking-tight text-white">
            Rota<span className="text-[#3b82f6]">Sphere</span>
          </span>
        </Link>
      </div>

      {hasClerkKey ? (
        <div className="flex justify-center items-center w-full">
          <SignUp
            routing="path"
            path="/sign-up"
            signInUrl="/sign-in"
            fallbackRedirectUrl="/dashboard"
            appearance={{
              theme: dark,
              variables: {
                colorPrimary: "#0758fc",
                colorBackground: "#121620",
                colorInput: "#090d16",
                colorInputForeground: "#ffffff",
                colorForeground: "#ffffff",
                colorMutedForeground: "#94a3b8",
                borderRadius: "0.875rem",
              },
              elements: {
                rootBox: "w-full max-w-[440px] mx-auto",
                card: "rounded-3xl shadow-2xl border border-white/10 bg-[#121620] backdrop-blur-xl",
                headerTitle: "text-white text-xl font-bold",
                headerSubtitle: "text-slate-400 text-sm",
                socialButtonsBlockButton: "bg-white/5 border border-white/15 text-white hover:bg-white/10 transition-all rounded-xl",
                socialButtonsBlockButtonText: "text-white font-medium text-sm",
                formButtonPrimary: "bg-[#0758fc] hover:bg-[#054fe0] text-white font-semibold text-sm rounded-xl py-3 shadow-lg shadow-blue-500/25 transition-all",
                footerActionLink: "text-[#3b82f6] hover:text-blue-400 font-semibold",
                formFieldInput: "bg-[#090d16] border border-white/15 text-white rounded-xl focus:border-[#0758fc]",
                formFieldLabel: "text-slate-300 text-xs font-semibold uppercase tracking-wider",
                dividerLine: "bg-white/10",
                dividerText: "text-slate-400 text-xs uppercase tracking-wider",
                footer: "border-t border-white/10 bg-transparent",
                footerActionText: "text-slate-400 text-xs",
              },
            }}
          />
        </div>
      ) : (
        <div className="w-full max-w-[440px] bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-2xl">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-white tracking-tight">Create your account</h1>
            <p className="text-sm text-gray-400 mt-1">Join Rotaractors across District 3192</p>
          </div>

          <form onSubmit={handlePreviewSignUp} className="space-y-4">
            <div>
              <label htmlFor="signup-name" className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                Full Name
              </label>
              <input
                id="signup-name"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Rtr. Priya Sharma"
                className="w-full bg-[#090d16] border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-500 outline-none focus:border-[#0758fc] transition-colors"
              />
            </div>

            <div>
              <label htmlFor="signup-email" className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <input
                id="signup-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="rotaractor@district3192.org"
                className="w-full bg-[#090d16] border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-500 outline-none focus:border-[#0758fc] transition-colors"
              />
            </div>

            <div>
              <label htmlFor="signup-password" className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                Password
              </label>
              <input
                id="signup-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#090d16] border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-500 outline-none focus:border-[#0758fc] transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0758fc] hover:bg-[#054fe0] text-white font-bold text-sm py-3.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 cursor-pointer"
            >
              {loading ? "Creating account..." : "Register Account"}
              <ArrowRight size={16} />
            </button>

            <div className="pt-4 border-t border-white/10 text-center">
              <p className="text-xs text-gray-400">
                Already have an account?{" "}
                <Link href="/sign-in" className="text-[#3b82f6] hover:underline font-semibold">
                  Sign in
                </Link>
              </p>
            </div>
          </form>
        </div>
      )}

      <div className="mt-8 flex items-center gap-2 text-xs text-gray-500">
        <Shield size={14} /> Rotaract District 3192 Official Platform
      </div>
    </div>
  );
}
