"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { IconArrowLeft, IconCheck, IconX } from "@/components/site/icons";

/**
 * Cookie consent. A card at the bottom-left on desktop, a bottom sheet on
 * phones, never covering the page's main actions.
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

  const btn = "inline-flex h-11 flex-1 items-center justify-center rounded-full px-5 type-label transition-colors duration-150";

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookie-title"
      aria-describedby="cookie-desc"
      className="site fixed inset-x-0 bottom-0 z-[10000] sm:inset-x-auto sm:bottom-5 sm:left-5 sm:w-[420px]"
    >
      <div className="rise max-h-[calc(100dvh-1rem)] overflow-y-auto overscroll-contain rounded-t-3xl border border-line bg-white shadow-[var(--shadow-modal)] sm:max-h-[calc(100dvh-2.5rem)] sm:rounded-2xl">
        <div className="flex items-start justify-between gap-4 px-5 pt-5 sm:px-6 sm:pt-6">
          <div className="flex items-center gap-2">
            {manage && (
              <button
                type="button"
                onClick={() => setManage(false)}
                aria-label="Back"
                className="-ml-2 flex size-9 items-center justify-center rounded-full text-ink-muted hover:bg-paper hover:text-ink"
              >
                <IconArrowLeft size={16} />
              </button>
            )}
            <h2 id="cookie-title" className="type-title text-ink">
              {manage ? "Cookie choices" : "Your privacy"}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => save("essential", { preferences: false })}
            aria-label="Close and keep essential cookies only"
            className="-mt-1 -mr-2 flex size-9 shrink-0 items-center justify-center rounded-full text-ink-muted hover:bg-paper hover:text-ink"
          >
            <IconX size={16} />
          </button>
        </div>

        {!manage ? (
          <div className="px-5 pt-2 pb-5 sm:px-6 sm:pb-6">
            <p id="cookie-desc" className="type-body-sm text-ink-muted">
              We use essential cookies to run this site, and no tracking or advertising. With your permission we also remember choices you make, such as a closed announcement. See our{" "}
              <Link href="/cookies" className="font-semibold text-cobalt underline underline-offset-2">
                Cookie policy
              </Link>
              .
            </p>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => save("essential", { preferences: false })}
                className={cn(btn, "border border-line-strong bg-white text-ink hover:border-cobalt hover:text-cobalt")}
              >
                Reject optional
              </button>
              <button type="button" onClick={() => save("all", { preferences: true })} className={cn(btn, "bg-cobalt text-white hover:bg-cobalt-deep")}>
                Accept all
              </button>
            </div>
            <button type="button" onClick={() => setManage(true)} className="mt-3 w-full py-1.5 text-center type-label font-medium text-ink-muted hover:text-ink">
              Manage choices
            </button>
          </div>
        ) : (
          <div className="px-5 pt-2 pb-5 sm:px-6 sm:pb-6">
            <p id="cookie-desc" className="type-body-sm text-ink-muted">
              Choose what we may remember. You can change this any time from the footer.
            </p>
            <ul className="mt-4 divide-y divide-line rounded-xl border border-line">
              {CATEGORIES.map((c) => {
                const locked = c.key === "essential";
                const on = locked ? true : prefs[c.key as keyof Prefs];
                return (
                  <li key={c.key} className="flex items-start justify-between gap-4 px-4 py-3.5">
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
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => save("all", { preferences: true })}
                className={cn(btn, "border border-line-strong bg-white text-ink hover:border-cobalt hover:text-cobalt")}
              >
                Accept all
              </button>
              <button type="button" onClick={() => save("custom", prefs)} className={cn(btn, "bg-cobalt text-white hover:bg-cobalt-deep")}>
                Save choices
              </button>
            </div>
          </div>
        )}
        <div className="h-[env(safe-area-inset-bottom)] sm:hidden" />
      </div>
    </div>
  );
}
