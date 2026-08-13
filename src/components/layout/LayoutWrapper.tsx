"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import AnnouncementBar from "@/components/layout/AnnouncementBar";
import SmoothScroll from "@/components/providers/SmoothScroll";
import Maintenance from "@/components/layout/Maintenance";

export default function LayoutWrapper({
  children,
  announcement = "",
  announcementHref = "",
  announcementScroll = false,
  maintenance,
}: {
  children: React.ReactNode;
  announcement?: string;
  announcementHref?: string;
  announcementScroll?: boolean;
  /** Read server-side in the root layout; see lib/content getMaintenance. */
  maintenance?: { enabled: boolean; message: string; eta: string };
}) {
  const pathname = usePathname();

  // Routes that should not show Header/Footer
  const isAdminRoute = pathname?.startsWith("/admin");
  const isAuthRoute = pathname?.startsWith("/auth");

  // /maintenance is the preview of the maintenance screen. The real one
  // replaces the entire public shell, so the preview has to render bare too or
  // it shows an admin a header that will not be there.
  const isMaintenanceRoute = pathname?.startsWith("/maintenance");

  const hideHeaderFooter = isAdminRoute || isMaintenanceRoute;

  // ── Every hook runs before any early return ──────────────────────────────
  //
  // The returns below are conditional on the ROUTE, and this component lives
  // in the root layout, so it survives client navigation. With hooks declared
  // after them, walking from /blog to /admin changed the hook count between
  // renders and React throws ("rendered more hooks than during the previous
  // render"). They are all hoisted here; the ones that do work guard on
  // `showBar`, which is already false on the routes that return early.

  // Announcement strip sits above the navbar. When present it's a fixed 40px
  // bar (top-0); the header drops to top-10 and content gets pt-10 so the
  // relative spacing every page already has below the header is preserved.
  /**
   * Dismissal, remembered.
   *
   * Keyed by the announcement TEXT, not a fixed flag: closing "Celebrating 13
   * Years" must not also swallow the next announcement, which is the whole
   * point of the strip. A new message is a new key, so it shows again.
   *
   * Starts false and is corrected in an effect rather than read during render.
   * localStorage does not exist on the server, so seeding state from it would
   * hydrate a bar the client then removes, and React would log a mismatch.
   * The cost is one frame of the strip for someone who dismissed it, which is
   * the right trade against a hydration error on every page.
   */
  const dismissKey = `ob.announcement.dismissed:${announcement}`;
  const [dismissed, setDismissed] = useState(false);
  useEffect(() => {
    if (!announcement) return;
    try {
      if (window.localStorage.getItem(dismissKey) === "1") setDismissed(true);
    } catch {
      // Private mode or storage disabled: the strip simply stays dismissible
      // per page load rather than per browser.
    }
  }, [announcement, dismissKey]);

  const dismissBar = useCallback(() => {
    setDismissed(true);
    try {
      window.localStorage.setItem(dismissKey, "1");
    } catch {
      // Non-fatal, see above.
    }
  }, [dismissKey]);

  const showBar =
    !isAuthRoute && !hideHeaderFooter && announcement.length > 0 && !dismissed;

  // Past the fold the strip retracts and the header takes the top edge back.
  // The announcement is news for someone arriving; forty pixels of permanent
  // chrome is a tax on everyone still reading. `main` keeps its pt-10 either
  // way, animating that too would shift the whole document under the reader
  // mid-scroll, which is a far worse trade than a fixed header moving 40px.
  const [barRetracted, setBarRetracted] = useState(false);
  const retractedRef = useRef(false);
  useEffect(() => {
    if (!showBar) return;
    // Hysteresis, not a single threshold. With one trip point the bar flips
    // state on every pixel of jitter around it, a trackpad's elastic
    // overscroll, or a reader nudging back and forth over the line, makes it
    // flutter. Retracting at 96 and only returning below 24 means it comes
    // back when someone has genuinely returned to the top, and the transition
    // plays start to finish instead of being re-triggered midway.
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
    // with the very animation it is driving.
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

  // ── Early returns, all hooks are above ───────────────────────────────────

  if (hideHeaderFooter) {
    return <>{children}</>;
  }

  // Maintenance gates the PUBLIC site only. /admin and /auth stay reachable on
  // purpose: the switch is turned off from /admin/settings, and locking staff
  // out of the page that turns it off would leave nobody able to bring the
  // site back without a deploy.
  if (maintenance?.enabled && !isAuthRoute) {
    return <Maintenance message={maintenance.message} eta={maintenance.eta} />;
  }

  return (
    <>
      {/* Momentum scrolling, marketing routes only, this branch is already
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
      {/* The wrapper owns the positioning and the slide; the bar inside it is
          just a 40px strip. Duration and curve are mirrored on the header, see the note there. */}
      {showBar && (
        <div
          className={`fixed inset-x-0 top-0 z-[9990] transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
            barRetracted ? "-translate-y-full" : "translate-y-0"
          }`}
          aria-hidden={barRetracted}
        >
          <AnnouncementBar text={announcement} href={announcementHref || undefined} scroll={announcementScroll} onDismiss={dismissBar} />
        </div>
      )}
      {!isAuthRoute && <Header topOffset={showBar && !barRetracted ? "top-10" : "top-0"} />}
      <main id="main-content" tabIndex={-1} className={`min-h-screen outline-none ${showBar ? "pt-10" : ""}`}>{children}</main>
      {!isAuthRoute && <Footer />}
    </>
  );
}
