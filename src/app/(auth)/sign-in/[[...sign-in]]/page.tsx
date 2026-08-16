"use client";

/**
 * Sign In Page
 * Supports Clerk authentication and fallback standalone preview mode.
 */

import { SignIn, useAuth } from "@clerk/nextjs";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Sparkles, ArrowRight, Shield } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get("redirect") ?? "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Check if valid Clerk publishable key is available
  const envKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const hasClerkKey =
    Boolean(envKey) &&
    !envKey?.includes("replace_me") &&
    (envKey?.startsWith("pk_test_") || envKey?.startsWith("pk_live_"));

  function handlePreviewSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      router.push(redirectUrl);
    }, 500);
  }

  return (
    <div className="min-h-screen bg-[#0b0d12] text-white flex flex-col justify-center items-center px-4 py-12">
      <div className="flex flex-col items-center mb-6 text-center">
        <Link href="/" className="flex flex-col items-center gap-2 group">
          <div className="relative w-16 h-16 rounded-2xl overflow-hidden shadow-lg bg-white p-1 group-hover:scale-105 transition-transform">
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
        <div className="inline-flex items-center gap-1.5 px-3 py-1 mt-2 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-semibold">
          <Sparkles size={13} /> District 3192 Single Sign-On
        </div>
      </div>

      {hasClerkKey ? (
        <div className="flex justify-center items-center w-full">
          <SignIn
            routing="path"
            path="/sign-in"
            signUpUrl="/sign-up"
            fallbackRedirectUrl={redirectUrl}
            appearance={{
              elements: {
                rootBox: "w-full max-w-[440px] mx-auto",
                card: "rounded-3xl shadow-2xl border border-white/10 bg-[#121620] backdrop-blur-xl",
                headerTitle: "text-white text-xl font-bold",
                headerSubtitle: "text-gray-400 text-sm",
                socialButtonsBlockButton: "bg-white/10 border-white/15 text-white hover:bg-white/15",
                formButtonPrimary: "bg-[#ff385c] hover:bg-[#e00b41] text-white font-semibold text-sm rounded-xl py-3",
                footerActionLink: "text-amber-400 hover:text-amber-300 font-semibold",
                formFieldInput: "bg-black/50 border-white/15 text-white rounded-xl",
                formFieldLabel: "text-gray-300 text-xs font-semibold uppercase tracking-wider",
                dividerLine: "bg-white/10",
                dividerText: "text-gray-400 text-xs",
              },
            }}
          />
        </div>
      ) : (
        <div className="w-full max-w-[440px] bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-2xl">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-white tracking-tight">Welcome back</h1>
            <p className="text-sm text-gray-400 mt-1">Sign in to access your tickets and organizer dashboard</p>
          </div>

          <form onSubmit={handlePreviewSignIn} className="space-y-4">
            <div>
              <label htmlFor="signin-email" className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <input
                id="signin-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="rotaractor@district3192.org"
                className="w-full bg-black/40 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-500 outline-none focus:border-amber-400 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="signin-password" className="block text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1">
                Password
              </label>
              <input
                id="signin-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-black/40 border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-500 outline-none focus:border-amber-400 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-400 hover:bg-amber-300 text-gray-900 font-bold text-sm py-3.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg cursor-pointer"
            >
              {loading ? "Signing in..." : "Continue to RotaSphere"}
              <ArrowRight size={16} />
            </button>

            <div className="pt-4 border-t border-white/10 text-center">
              <p className="text-xs text-gray-400">
                Don&apos;t have an account?{" "}
                <Link href="/sign-up" className="text-amber-400 hover:underline font-semibold">
                  Sign up
                </Link>
              </p>
            </div>
          </form>
        </div>
      )}

      <div className="mt-8 flex items-center gap-2 text-xs text-gray-500">
        <Shield size={14} /> Rotaract District 3192 Secure Single Sign-On
      </div>
    </div>
  );
}
