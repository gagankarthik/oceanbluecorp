"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import { easeOutExpo } from "@/lib/motion";
import { clearScroll, writeScroll } from "@/lib/scroll-signal";

/* ============================================================
   Momentum scrolling for the marketing site.

   Lenis rather than GSAP's ScrollSmoother, for one decisive
   reason: ScrollSmoother animates a transformed wrapper, and a
   transformed ancestor breaks `position: sticky` on everything
   inside it. The /13-years journey dial is sticky. Lenis drives
   the real window scroll instead, so sticky, scroll-margin and
   the fixed header all keep working, and framer-motion's
   `useScroll`, which 16 files depend on, still receives the
   native scroll events it reads.

   Mounted from LayoutWrapper, which already excludes /admin.
   That exclusion is deliberate and worth keeping: eased
   scrolling in a dense data table fights the person trying to
   find a row in it.
   ============================================================ */

export default function SmoothScroll() {
  const pathname = usePathname();
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    // Hard opt-out. Momentum scrolling is a common migraine and motion-sickness
    // trigger, and it is the single most disorienting thing on this list for
    // someone who has asked the OS to stop animating things.
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduce.matches) return;

    const lenis = new Lenis({
      duration: 1.05,
      // Shared with the reveal curves, so a scroll and the content it brings
      // into view decelerate on the same easing.
      easing: easeOutExpo,
      smoothWheel: true,
      // Touch is left alone on purpose. Native mobile scrolling already has
      // momentum tuned by the platform, and overriding it makes a phone feel
      // laggy rather than smooth, the opposite of the intent.
      syncTouch: false,
    });
    lenisRef.current = lenis;

    // Publish velocity for the scroll-reactive motion (see lib/scroll-signal).
    // Written to a plain object rather than state on purpose: this fires every
    // frame, and re-rendering the tree sixty times a second to animate a
    // background would cost more than the background.
    lenis.on("scroll", ({ velocity, scroll }: { velocity: number; scroll: number }) => {
      writeScroll(velocity, scroll);
    });

    let raf = 0;
    const frame = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    /* Same-page hash links. Left native they jump instantly, which reads as a
       glitch on a page that otherwise eases, and `scroll-behavior: smooth`
       cannot be used to fix it, because that fights Lenis for the same scroll. */
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
      const anchor = (e.target as HTMLElement | null)?.closest?.("a");
      const href = anchor?.getAttribute("href");
      if (!href || !href.startsWith("#") || href === "#") return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      // Clear the fixed header (and the announcement bar when it is up) so the
      // section heading is not parked underneath it.
      lenis.scrollTo(target as HTMLElement, { offset: -96 });
      // Keep the URL honest, preventDefault would otherwise drop the hash.
      window.history.pushState(null, "", href);
    };
    document.addEventListener("click", onClick);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("click", onClick);
      lenis.destroy();
      lenisRef.current = null;
      clearScroll();
    };
  }, []);

  /* App Router navigations do not reset Lenis's internal position, so a new
     page opens scrolled to wherever the last one was. `immediate` because this
     is a page change, not a movement within a page, easing it would animate
     content the visitor has not seen yet. */
  useEffect(() => {
    lenisRef.current?.scrollTo(0, { immediate: true });
  }, [pathname]);

  return null;
}
