/**
 * Public Layout — wraps all public-facing pages
 * Includes: TopNav + main content + Footer
 */

import { TopNav } from "@/components/shared/TopNav";
import { Footer } from "@/components/shared/Footer";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <TopNav />
      <main id="main-content" tabIndex={-1}>
        {children}
      </main>
      <Footer />
    </>
  );
}
