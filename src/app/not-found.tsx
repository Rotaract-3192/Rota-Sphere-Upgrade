import Link from "next/link";
import { Search, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[75vh] flex items-center justify-center px-base py-section bg-canvas text-center">
      <div className="max-w-md w-full">
        <div className="w-16 h-16 rounded-full bg-surface-soft text-muted flex items-center justify-center mx-auto mb-lg">
          <Search size={32} strokeWidth={1.5} />
        </div>
        <h1 className="text-display-xl font-bold text-ink mb-xs">404</h1>
        <h2 className="text-display-sm font-semibold text-ink mb-sm">Page not found</h2>
        <p className="text-body-md text-muted mb-xl">
          The page or event you are looking for doesn&apos;t exist or has been moved.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-sm">
          <Link
            href="/events"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-xs bg-brand hover:bg-brand-active text-on-primary font-medium text-btn-md px-lg py-sm rounded-sm transition-colors"
          >
            <Search size={16} />
            Explore events
          </Link>
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-xs border border-hairline text-ink hover:bg-surface-soft font-medium text-btn-md px-lg py-sm rounded-sm transition-colors"
          >
            <Home size={16} />
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
