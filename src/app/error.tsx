"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import { logger } from "@/lib/logger/logger";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error("Global boundary caught error", { message: error.message, digest: error.digest });
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6 bg-gray-50 text-center">
      <div className="w-full max-w-md mx-auto bg-white border border-gray-200 rounded-3xl p-8 sm:p-10 shadow-xl flex flex-col items-center justify-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto shadow-inner shrink-0">
          <AlertCircle size={32} />
        </div>

        <div className="w-full text-center space-y-2">
          <h1 className="text-2xl font-extrabold text-gray-900 block text-center w-full">Something Went Wrong</h1>
          <p className="text-xs sm:text-sm text-gray-500 w-full max-w-xs mx-auto text-center block leading-relaxed">
            We encountered an unexpected error. Please try refreshing or return home.
          </p>
        </div>

        <div className="w-full flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="flex-1 bg-[#0758fc] hover:bg-[#054fe0] text-white font-extrabold text-xs py-3 px-5 rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95 text-center"
          >
            <RefreshCw size={15} /> Try Again
          </button>
          <Link
            href="/"
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs py-3 px-5 rounded-2xl transition-colors flex items-center justify-center gap-2 cursor-pointer text-center"
          >
            <Home size={15} /> Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
