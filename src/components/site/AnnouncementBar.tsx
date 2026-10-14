"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { hasPreferenceConsent } from "@/components/layout/CookieConsent";
export type Announcement = { id: string; tag?: string; text: string; link?: { href: string; label: string } };

const storageKey = (id: string) => `ob-announcement-dismissed:${id}`;

/** A slim, dismissible bar above the navigation; text comes from /admin/content */
export default function AnnouncementBar({ announcement }: { announcement: Announcement | null }) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (!announcement) return;
    try {
      const key = storageKey(announcement.id);
      if (localStorage.getItem(key) === "1" || sessionStorage.getItem(key) === "1") setHidden(true);
    } catch {
      // Storage can be unavailable (private mode); the bar simply stays visible
    }
  }, [announcement]);

  // Publishes the bar's height so full-screen heroes can subtract it (owner rule: hero fully on screen)
  const barRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = document.documentElement;
    const el = barRef.current;
    if (!el) {
      root.style.removeProperty("--ann-h");
      return;
    }
    const set = () => root.style.setProperty("--ann-h", `${el.offsetHeight}px`);
    set();
    const ro = new ResizeObserver(set);
    ro.observe(el);
    return () => {
      ro.disconnect();
      root.style.removeProperty("--ann-h");
    };
  }, [announcement, hidden]);

  if (!announcement || hidden) return null;
  const current = announcement;

  const dismiss = () => {
    setHidden(true);
    try {
      // Remembered across visits only with preference consent (see /cookies)
      (hasPreferenceConsent() ? localStorage : sessionStorage).setItem(storageKey(current.id), "1");
    } catch {
      // Ignore: dismissal lasts for this page view only
    }
  };

  return (
    <div ref={barRef} role="region" aria-label="Announcement" className="on-dark relative z-50 bg-navy-900 text-mist-50">
      <div className="gutter flex min-h-11 items-center justify-center gap-3 py-2 pr-12 text-center text-small leading-snug sm:text-small">
        {announcement.tag && (
          <span className="inline-flex shrink-0 items-center bg-cyan-500 px-2 py-0.5 text-caption font-semibold text-navy-950">{announcement.tag}</span>
        )}
        <p>
          <span className="text-tide-300">{announcement.text}</span>{" "}
          {announcement.link && (
          <Link
            href={announcement.link.href}
            className="whitespace-nowrap font-medium text-white underline decoration-cyan-300/60 underline-offset-4 hover:decoration-cyan-300"
          >
            {announcement.link.label}
          </Link>
          )}
        </p>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss announcement"
          className="absolute right-2 top-1/2 grid size-10 -translate-y-1/2 place-items-center text-tide-300 transition-colors hover:text-white md:right-4"
        >
          <svg aria-hidden viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M4 4l8 8M12 4l-8 8" />
          </svg>
        </button>
      </div>
    </div>
  );
}
