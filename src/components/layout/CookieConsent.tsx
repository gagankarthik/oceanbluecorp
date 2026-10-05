"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { IconArrowLeft, IconCheck, IconX } from "@/components/site/icons";

/**
 * Cookie consent. A modal over a dimmed, blurred page: a card at the bottom
 * centre on desktop, a bottom sheet on phones. The page stays locked until a choice is
 * made.
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
 * The footer's "Cookie settings" link reopens this by dispatching
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
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full transition-colors duration-150",
        on ? "bg-cobalt" : "bg-line-strong",
        disabled && "cursor-not-allowed opacity-60",
      )}
    >
      <span className={cn("absolute top-1 left-0 size-4 rounded-full bg-white shadow transition-transform duration-150", on ? "translate-x-6" : "translate-x-1")} />
    </button>
  );
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [manage, setManage] = useState(false);
  const [prefs, setPrefs] = useState<Prefs>({ preferences: false });

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

  const btn = "inline-flex h-11 items-center justify-center rounded-full px-6 type-label whitespace-nowrap transition-colors duration-150";
  const secondary = cn(btn, "border border-line-strong bg-white text-ink hover:border-cobalt hover:text-cobalt");
  const primary = cn(btn, "bg-cobalt text-white hover:bg-cobalt-deep");

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookie-title"
      aria-describedby="cookie-desc"
      data-lenis-prevent
      className="site rise fixed inset-x-0 bottom-0 z-[10000] max-h-[85dvh] overflow-y-auto overscroll-contain border-t border-line bg-white shadow-[0_-8px_32px_rgb(11_26_51/0.12)]"
    >
      <div className="mx-auto max-w-[1240px] px-4 py-5 sm:px-6 lg:py-6">
        {!manage ? (
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-10">
            <div className="min-w-0 flex-1">
              <h2 id="cookie-title" className="type-title text-ink">Your privacy</h2>
              <p id="cookie-desc" className="mt-1 max-w-[80ch] type-body-sm text-ink-muted">
                We use essential cookies to run this site, and no tracking or advertising. With your permission we also remember choices you make, such as a closed announcement. See our{" "}
                <Link href="/cookies" className="font-semibold text-cobalt underline underline-offset-2">
                  Cookie policy
                </Link>
                .
              </p>
            </div>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center lg:shrink-0">
              <button type="button" onClick={() => setManage(true)} className={cn(btn, "text-ink-muted hover:bg-paper hover:text-ink")}>
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
                  className="-ml-2 flex size-9 items-center justify-center rounded-full text-ink-muted hover:bg-paper hover:text-ink"
                >
                  <IconArrowLeft size={16} />
                </button>
                <h2 id="cookie-title" className="type-title text-ink">Cookie choices</h2>
              </div>
              <button
                type="button"
                onClick={() => save("essential", { preferences: false })}
                aria-label="Close and keep essential cookies only"
                className="-mr-2 flex size-9 shrink-0 items-center justify-center rounded-full text-ink-muted hover:bg-paper hover:text-ink"
              >
                <IconX size={16} />
              </button>
            </div>
            <p id="cookie-desc" className="mt-1 type-body-sm text-ink-muted">
              Choose what we may remember. You can change this any time from the footer.
            </p>
            <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:gap-10">
              <ul className="grid flex-1 gap-3 sm:grid-cols-2">
                {CATEGORIES.map((c) => {
                  const locked = c.key === "essential";
                  const on = locked ? true : prefs[c.key as keyof Prefs];
                  return (
                    <li key={c.key} className="flex items-start justify-between gap-4 rounded-xl border border-line px-4 py-3.5">
                      <span className="min-w-0">
                        <span className="flex items-center gap-2 type-label text-ink">
                          {c.name}
                          {locked && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-success-container px-2 py-0.5 type-caption font-semibold text-success">
                              <IconCheck size={11} strokeWidth={2.5} /> Always on
                            </span>
                          )}
                        </span>
                        <span className="mt-0.5 block type-caption text-ink-subtle">{c.desc}</span>
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
