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
    <div className="min-h-[70vh] flex items-center justify-center px-base py-section bg-canvas text-center">
      <div className="max-w-md w-full">
        <div className="w-16 h-16 rounded-full bg-error/10 text-error flex items-center justify-center mx-auto mb-lg">
          <AlertCircle size={32} strokeWidth={1.5} />
        </div>
        <h1 className="text-display-md font-bold text-ink mb-xs">Something went wrong</h1>
        <p className="text-body-md text-muted mb-xl">
          We encountered an unexpected error. Please try refreshing or return home.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-sm">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-xs bg-brand hover:bg-brand-active text-on-primary font-medium text-btn-md px-lg py-sm rounded-sm transition-colors"
          >
            <RefreshCw size={16} />
            Try again
          </button>
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-xs border border-hairline text-ink hover:bg-surface-soft font-medium text-btn-md px-lg py-sm rounded-sm transition-colors"
          >
            <Home size={16} />
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
