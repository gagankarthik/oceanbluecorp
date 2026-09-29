import type { Metadata } from "next";
import NotFoundContent from "./_not-found-content";

// Server component so it can own `metadata`; the composition lives in
// _not-found-content. No search box: the site has no site-wide search,
// so the hint points at the sitemap and the careers search instead.

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return <NotFoundContent />;
}
