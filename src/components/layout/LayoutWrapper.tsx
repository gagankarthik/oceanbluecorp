"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AnnouncementBar from "@/components/layout/AnnouncementBar";

export default function LayoutWrapper({
  children,
  announcement = "",
  announcementHref = "",
  announcementScroll = false,
}: {
  children: React.ReactNode;
  announcement?: string;
  announcementHref?: string;
  announcementScroll?: boolean;
}) {
  const pathname = usePathname();

  // Routes that should not show Header/Footer
  const isAdminRoute = pathname?.startsWith("/admin");
  const isAuthRoute = pathname?.startsWith("/auth");

  const hideHeaderFooter = isAdminRoute;

  if (hideHeaderFooter) {
    return <>{children}</>;
  }

  // Announcement strip sits above the navbar. When present it's a fixed 40px
  // bar (top-0); the header drops to top-10 and content gets pt-10 so the
  // relative spacing every page already has below the header is preserved.
  const showBar = !isAuthRoute && announcement.length > 0;

  return (
    <>
      {/* Skip link (WCAG 2.4.1 Bypass Blocks) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-lg focus:bg-[var(--hz-cobalt)] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg"
      >
        Skip to content
      </a>
      {showBar && <AnnouncementBar text={announcement} href={announcementHref || undefined} scroll={announcementScroll} />}
      {!isAuthRoute && <Header topOffset={showBar ? "top-10" : "top-0"} />}
      <main id="main-content" tabIndex={-1} className={`min-h-screen outline-none ${showBar ? "pt-10" : ""}`}>{children}</main>
      {!isAuthRoute && <Footer />}
    </>
  );
}
