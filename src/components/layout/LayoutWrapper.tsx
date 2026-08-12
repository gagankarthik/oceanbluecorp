"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AnnouncementBar from "@/components/layout/AnnouncementBar";
import SmoothScroll from "@/components/providers/SmoothScroll";

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

  // Past the fold the strip retracts and the header takes the top edge back.
  // The announcement is news for someone arriving; forty pixels of permanent
  // chrome is a tax on everyone still reading. `main` keeps its pt-10 either
  // way — animating that too would shift the whole document under the reader
  // mid-scroll, which is a far worse trade than a fixed header moving 40px.
  const [barRetracted, setBarRetracted] = useState(false);
  const retractedRef = useRef(false);
  useEffect(() => {
    if (!showBar) return;
    // Hysteresis, not a single threshold. With one trip point the bar flips
    // state on every pixel of jitter around it — a trackpad's elastic
    // overscroll, or a reader nudging back and forth over the line, makes it
    // flutter. Retracting at 96 and only returning below 24 means the bar
    // comes back when someone has genuinely gone back to the top, and the
    // transition plays start to finish instead of being re-triggered midway.
    let raf = 0;
    const read = () => {
      raf = 0;
      const y = window.scrollY;
      const next = retractedRef.current ? y > 24 : y > 96;
      if (next === retractedRef.current) return;
      retractedRef.current = next;
      setBarRetracted(next);
    };
    // Coalesce to one read per frame. Scroll fires far more often than the
    // screen refreshes, and each unthrottled setState is a render competing
    // with the very animation this is driving.
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(read);
    };
    read();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [showBar]);

  return (
    <>
      {/* Momentum scrolling, marketing routes only — this branch is already
          past the /admin early return above, and eased scrolling in a dense
          data table fights the person trying to find a row in it. */}
      <SmoothScroll />

      {/* Skip link (WCAG 2.4.1 Bypass Blocks) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-lg focus:bg-[var(--hz-cobalt)] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg"
      >
        Skip to content
      </a>
      {showBar && (
        <div
          className={`fixed inset-x-0 top-0 z-[9990] transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
            barRetracted ? "-translate-y-full" : "translate-y-0"
          }`}
          aria-hidden={barRetracted}
        >
          <AnnouncementBar text={announcement} href={announcementHref || undefined} scroll={announcementScroll} />
        </div>
      )}
      {!isAuthRoute && (
        <Header topOffset={showBar && !barRetracted ? "top-10" : "top-0"} />
      )}
      <main id="main-content" tabIndex={-1} className={`min-h-screen outline-none ${showBar ? "pt-10" : ""}`}>{children}</main>
      {!isAuthRoute && <Footer />}
    </>
  );
}
