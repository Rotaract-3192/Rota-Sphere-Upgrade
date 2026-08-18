/**
 * Accessible Skip-to-Content Link for Screen Readers and Keyboard Navigation
 */
export function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2.5 focus:bg-[#0758fc] focus:text-white focus:font-extrabold focus:text-xs focus:rounded-xl focus:shadow-2xl focus:outline-none focus:ring-4 focus:ring-blue-300"
    >
      Skip to main content
    </a>
  );
}
