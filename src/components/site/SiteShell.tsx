"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import AnnouncementBar, { type Announcement } from "@/components/site/AnnouncementBar";
import RevealObserver from "@/components/site/RevealObserver";
import BackToTop from "@/components/site/BackToTop";
import RouteBreadcrumbs from "@/components/site/RouteBreadcrumbs";
import Maintenance from "@/components/layout/Maintenance";

const BARE = ["/portal", "/auth", "/maintenance"];

export default function SiteShell({
  children,
  announcement,
  maintenance,
}: {
  children: React.ReactNode;
  announcement: Announcement | null;
  maintenance: { enabled: boolean; message: string; eta: string };
}) {
  const pathname = usePathname() ?? "/";
  const bare = BARE.some((p) => pathname === p || pathname.startsWith(p + "/"));
  if (bare) return <>{children}</>;

  // Public site only; /status stays up so the outage can be explained.
  if (maintenance.enabled && !pathname.startsWith("/status")) {
    return <Maintenance message={maintenance.message} eta={maintenance.eta} />;
  }

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-navy-950 focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>
      <AnnouncementBar announcement={announcement} />
      <Header />
      <main id="main">{children}</main>
      <Footer />
      <BackToTop />
      <RevealObserver />
      <RouteBreadcrumbs />
    </>
  );
}
