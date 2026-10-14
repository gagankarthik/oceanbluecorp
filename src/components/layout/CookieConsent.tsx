"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const BTN = "inline-flex min-h-11 items-center justify-center px-6 text-small font-medium active:scale-[0.98]";
const PRIMARY = `${BTN} bg-ocean-600 text-white btn-fill btn-fill-ocean`;
const SECONDARY = `${BTN} text-navy-900 ring-2 ring-inset ring-navy-900 btn-fill btn-fill-outline`;
const GHOST = `${BTN} transition-colors text-ocean-700 underline-offset-4 hover:underline`;

function Glyph({ d, className = "size-4" }: { d: string; className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

/**
 * Cookie consent: a non-modal banner fixed to the bottom of the page.
 *
 * Rejecting is as easy as accepting (same size, same row), and "Manage
 * choices" offers real per-category switches. Anything shown as optional can
 * actually be turned off, which is what regulators expect.
 *
 * The site runs no analytics or advertising tags, so Preferences is the only
 * optional category. Add one here only when a tool that needs it is added.
 *
 * Storage: `cookieConsent` is "all" | "essential" | "custom" (kept compatible
 * with the old values), `cookieConsentPrefs` holds the per-category choice as
 * JSON, and `cookieConsentDate` when it was given. Read it via
 * `hasPreferenceConsent()`.
 *
 * The "Cookie settings" buttons (footer, /cookies) reopen this by dispatching
 * `open-cookie-settings` on window.
 */

type Prefs = { preferences: boolean };
export const OPEN_COOKIE_SETTINGS = "open-cookie-settings";

/** True once the visitor has allowed preference storage. */
export function hasPreferenceConsent(): boolean {
  try {
    if (localStorage.getItem("cookieConsent") === "all") return true;
    return JSON.parse(localStorage.getItem("cookieConsentPrefs") || "{}").preferences === true;
  } catch {
    return false;
  }
}

const CATEGORIES: { key: keyof Prefs | "essential"; name: string; desc: string }[] = [
  { key: "essential", name: "Essential", desc: "Sign-in, security and keeping the site working. Always on." },
  { key: "preferences", name: "Preferences", desc: "Remembers choices across visits, such as a dismissed announcement." },
];

function Switch({ on, onChange, label, disabled }: { on: boolean; onChange?: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange?.(!on)}
      className={cn("relative -my-2.5 grid h-11 w-14 shrink-0 place-items-center rounded-full", disabled && "cursor-not-allowed")}
    >
      {/* The 24px track sits inside a 44px hit area. */}
      <span
        aria-hidden
        className={cn(
          "relative h-6 w-11 rounded-full transition-colors duration-150",
          on ? "bg-ocean-600" : "bg-mist-400",
          disabled && "opacity-50",
        )}
      >
        <span className={cn("absolute top-1 left-0 size-4 rounded-full bg-white shadow transition-transform duration-150 ease-out", on ? "translate-x-6" : "translate-x-1")} />
      </span>
    </button>
  );
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [manage, setManage] = useState(false);
  const [prefs, setPrefs] = useState<Prefs>({ preferences: false });
  const regionRef = useRef<HTMLDivElement>(null);
  const reopened = useRef(false);

  // Reopened from "Cookie settings": take focus there, as the visitor asked for it.
  useEffect(() => {
    if (visible && reopened.current) regionRef.current?.focus();
    reopened.current = false;
  }, [visible]);

  useEffect(() => {
    try {
      if (!localStorage.getItem("cookieConsent")) setVisible(true);
      const stored = localStorage.getItem("cookieConsentPrefs");
      if (stored) setPrefs({ preferences: JSON.parse(stored).preferences === true });
    } catch {
      // Storage unavailable (private mode): show the banner each visit.
      setVisible(true);
    }
    const reopen = () => {
      reopened.current = true;
      setManage(true);
      setVisible(true);
    };
    window.addEventListener(OPEN_COOKIE_SETTINGS, reopen);
    return () => window.removeEventListener(OPEN_COOKIE_SETTINGS, reopen);
  }, []);

  const save = useCallback((level: "all" | "essential" | "custom", chosen: Prefs) => {
    try {
      localStorage.setItem("cookieConsent", level);
      localStorage.setItem("cookieConsentPrefs", JSON.stringify(chosen));
      localStorage.setItem("cookieConsentDate", new Date().toISOString());
    } catch {
      // ignore
    }
    setPrefs(chosen);
    setVisible(false);
    setManage(false);
  }, []);

  if (!visible) return null;

  const secondary = SECONDARY;
  const primary = PRIMARY;

  return (
    <div
      // A non-modal banner, not a dialog: the page stays usable. It is first in
      // the DOM (see layout.tsx) so keyboard and screen-reader users reach it
      // before the page rather than after it (WCAG 2.4.3).
      ref={regionRef}
      role="region"
      aria-labelledby="cookie-title"
      aria-describedby="cookie-desc"
      tabIndex={-1}
      data-lenis-prevent
      className="fixed inset-x-0 bottom-0 z-[10000] max-h-[85dvh] overflow-y-auto overscroll-contain bg-mist-0 text-navy-900 shadow-[0_-12px_40px_-16px_rgba(6,26,40,0.35)] focus:outline-none"
    >
      <div className="gutter py-5 lg:py-6">
        {!manage ? (
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-10">
            <div className="min-w-0 flex-1">
              <h2 id="cookie-title" className="text-title font-semibold">Your privacy</h2>
              <p id="cookie-desc" className="mt-1 max-w-measure text-small leading-normal text-mist-600">
                We use essential cookies to run this site, and no tracking or advertising. With your permission we also remember choices you make, such as a closed announcement. See our{" "}
                <Link href="/cookies" className="text-ocean-700 underline underline-offset-4">
                  Cookie policy
                </Link>
                .
              </p>
            </div>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center lg:shrink-0">
              <button type="button" onClick={() => setManage(true)} className={GHOST}>
                Manage choices
              </button>
              <button type="button" onClick={() => save("essential", { preferences: false })} className={cn(secondary, "sm:flex-1 lg:flex-none")}>
                Reject optional
              </button>
              <button type="button" onClick={() => save("all", { preferences: true })} className={cn(primary, "sm:flex-1 lg:flex-none")}>
                Accept all
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setManage(false)}
                  aria-label="Back"
                  className="-ml-2 grid size-10 place-items-center text-mist-600 hover:bg-mist-100 hover:text-navy-900"
                >
                  <Glyph d="M16 10H4M8 6l-4 4 4 4" />
                </button>
                <h2 id="cookie-title" className="text-title font-semibold">Cookie choices</h2>
              </div>
              <button
                type="button"
                onClick={() => save("essential", { preferences: false })}
                aria-label="Close and keep essential cookies only"
                className="-mr-2 grid size-10 shrink-0 place-items-center text-mist-600 hover:bg-mist-100 hover:text-navy-900"
              >
                <Glyph d="M5 5l10 10M15 5 5 15" />
              </button>
            </div>
            <p id="cookie-desc" className="mt-1 text-small text-mist-600">
              Choose what we may remember. You can change this any time from the footer.
            </p>
            <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-10">
              <ul className="grid flex-1 gap-3 sm:grid-cols-2">
                {CATEGORIES.map((c) => {
                  const locked = c.key === "essential";
                  const on = locked ? true : prefs[c.key as keyof Prefs];
                  return (
                    <li key={c.key} className="flex items-start justify-between gap-4 bg-mist-100 p-4">
                      <span className="min-w-0">
                        <span className="flex items-center gap-2 text-small font-semibold">
                          {c.name}
                          {locked && (
                            <span className="inline-flex items-center gap-1 bg-tide-200 px-2 py-0.5 text-caption font-medium text-navy-900">
                              <Glyph d="m4.5 10.5 3.5 3.5 7.5-8" className="size-3" /> Always on
                            </span>
                          )}
                        </span>
                        <span className="mt-1 block text-small text-mist-600">{c.desc}</span>
                      </span>
                      <Switch
                        on={on}
                        disabled={locked}
                        label={`${c.name} cookies`}
                        onChange={locked ? undefined : (v) => setPrefs((p) => ({ ...p, [c.key]: v }))}
                      />
                    </li>
                  );
                })}
              </ul>
              <div className="flex gap-2 lg:shrink-0">
                <button type="button" onClick={() => save("all", { preferences: true })} className={cn(secondary, "flex-1 lg:flex-none")}>
                  Accept all
                </button>
                <button type="button" onClick={() => save("custom", prefs)} className={cn(primary, "flex-1 lg:flex-none")}>
                  Save choices
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </div>
  );
}
