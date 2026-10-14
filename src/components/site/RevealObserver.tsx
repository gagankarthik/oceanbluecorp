"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const PENDING = "[data-reveal]:not(.is-in)";

/** Marks the document as scripted and reveals [data-reveal] parts once as they enter */
export default function RevealObserver() {
  const pathname = usePathname();

  useEffect(() => {
    document.documentElement.classList.add("js");
    const reveal = (el: Element) => el.classList.add("is-in");
    if (!("IntersectionObserver" in window)) {
      document.querySelectorAll(PENDING).forEach(reveal);
      return;
    }
    // Threshold 0: a block taller than several screens never reaches a ratio
    // threshold on a short window, and would stay blank.
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            reveal(e.target);
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0 },
    );
    const watch = (root: ParentNode) => {
      if (root instanceof Element && root.matches(PENDING)) io.observe(root);
      root.querySelectorAll(PENDING).forEach((el) => io.observe(el));
    };
    watch(document);
    // Parts rendered later (filtered lists, data that arrives after mount).
    const mo = new MutationObserver((records) => {
      for (const r of records) r.addedNodes.forEach((n) => n instanceof Element && watch(n));
    });
    mo.observe(document.body, { childList: true, subtree: true });

    // Belt and braces: if the observer is throttled or late, a scroll still
    // reveals anything that has reached the viewport, so no section stays blank.
    let pending: ReturnType<typeof setTimeout> | undefined;
    const sweep = () => {
      pending = undefined;
      const limit = window.innerHeight * 0.94;
      document.querySelectorAll(PENDING).forEach((el) => {
        if (el.getBoundingClientRect().top < limit) reveal(el);
      });
    };
    const onScroll = () => {
      pending ??= setTimeout(sweep, 50);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    const settle = setTimeout(sweep, 1200);
    return () => {
      io.disconnect();
      mo.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      clearTimeout(pending);
      clearTimeout(settle);
    };
  }, [pathname]);

  return null;
}
