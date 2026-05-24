"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { X, Cookie, Shield, ChevronDown, ChevronUp } from "lucide-react";

type ConsentLevel = "all" | "essential";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("cookieConsent");
      if (!stored) setVisible(true);
    } catch {
      // localStorage unavailable (SSR / private mode)
    }
  }, []);

  const save = (level: ConsentLevel) => {
    try {
      localStorage.setItem("cookieConsent", level);
      localStorage.setItem("cookieConsentDate", new Date().toISOString());
    } catch {
      // ignore
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label="Cookie consent"
      className="fixed bottom-0 left-0 right-0 z-[9999] p-3 sm:p-4"
    >
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
        {/* Main row */}
        <div className="flex items-start gap-3 p-4 sm:p-5">
          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Cookie className="w-4.5 h-4.5 text-blue-600" aria-hidden="true" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900">We use cookies &amp; similar technologies</p>
            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
              We use essential cookies to make our site work, and optional analytics cookies to understand how you use it.
              By clicking <strong>Accept All</strong> you consent to all cookies.{" "}
              <Link href="/cookies" className="text-blue-600 hover:underline">Cookie Policy</Link>
              {" · "}
              <Link href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>
            </p>

            {/* Details toggle */}
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 mt-1.5 transition-colors"
              aria-expanded={showDetails}
            >
              {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {showDetails ? "Hide details" : "Show cookie details"}
            </button>
          </div>

          <button
            onClick={() => save("essential")}
            aria-label="Dismiss and accept essential cookies only"
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Details panel */}
        {showDetails && (
          <div className="px-5 pb-3 grid sm:grid-cols-3 gap-3 border-t border-gray-100 pt-3">
            {[
              {
                name: "Essential",
                always: true,
                desc: "Authentication, security, and session management. Cannot be disabled.",
                color: "bg-emerald-50 border-emerald-200 text-emerald-700",
              },
              {
                name: "Analytics",
                always: false,
                desc: "Help us understand how visitors use our site so we can improve it.",
                color: "bg-blue-50 border-blue-200 text-blue-700",
              },
              {
                name: "Preferences",
                always: false,
                desc: "Remember your settings like sidebar state and language preferences.",
                color: "bg-violet-50 border-violet-200 text-violet-700",
              },
            ].map((cat) => (
              <div key={cat.name} className={`rounded-xl border p-3 ${cat.color}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold">{cat.name}</span>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${cat.always ? "bg-emerald-200 text-emerald-800" : "bg-white/60"}`}>
                    {cat.always ? "Always on" : "Optional"}
                  </span>
                </div>
                <p className="text-[11px] opacity-80 leading-snug">{cat.desc}</p>
              </div>
            ))}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-2 px-5 py-3 bg-gray-50 border-t border-gray-100">
          <div className="flex items-center gap-1 text-[11px] text-gray-400 flex-1">
            <Shield className="w-3 h-3" aria-hidden="true" />
            <span>We never sell your personal data. GDPR &amp; CCPA compliant.</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto">
            <button
              onClick={() => save("essential")}
              className="flex-1 sm:flex-none px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Essential Only
            </button>
            <button
              onClick={() => save("all")}
              className="flex-1 sm:flex-none px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Accept All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
