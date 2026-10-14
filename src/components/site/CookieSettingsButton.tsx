"use client";

import { OPEN_COOKIE_SETTINGS } from "@/components/layout/CookieConsent";

/** Reopens the cookie consent panel on its choices view */
export default function CookieSettingsButton({ className, children = "Cookie settings" }: { className?: string; children?: React.ReactNode }) {
  return (
    <button type="button" onClick={() => window.dispatchEvent(new Event(OPEN_COOKIE_SETTINGS))} className={className}>
      {children}
    </button>
  );
}
