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
  const isDashboardRoute = pathname?.startsWith("/dashboard");
  const isAuthRoute = pathname?.startsWith("/auth");

  const hideHeaderFooter = isAdminRoute || isDashboardRoute;

  if (hideHeaderFooter) {
    return <>{children}</>;
  }

  // Announcement strip sits above the navbar. When present it's a fixed 40px
  // bar (top-0); the header drops to top-10 and content gets pt-10 so the
  // relative spacing every page already has below the header is preserved.
  const showBar = !isAuthRoute && announcement.length > 0;

  return (
    <>
      {showBar && <AnnouncementBar text={announcement} href={announcementHref || undefined} scroll={announcementScroll} />}
      {!isAuthRoute && <Header topOffset={showBar ? "top-10" : "top-0"} />}
      <main id="main-content" className={`min-h-screen ${showBar ? "pt-10" : ""}`}>{children}</main>
      {!isAuthRoute && <Footer />}
    </>
  );
}
