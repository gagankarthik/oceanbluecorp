"use client";

import { useState } from "react";

/** A block of text with a button that copies it */
export default function CopyText({ label, text }: { label: string; text: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex h-full flex-col bg-mist-0 p-6 md:p-8">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-[18px] font-semibold">{label}</h3>
        <button
          type="button"
          onClick={copy}
          className="inline-flex min-h-10 items-center gap-2 bg-mist-100 px-4 text-[15px] font-medium text-navy-900 btn-fill btn-fill-mist active:scale-[0.98]"
        >
          <svg aria-hidden viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5">
            {copied ? <path d="m3 8.5 3.2 3L13 4.5" /> : <path d="M5.5 5.5V3.5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-2M3.5 5.5h6a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-6a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1Z" />}
          </svg>
          <span aria-live="polite">{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>
      <p className="mt-4 flex-1 leading-relaxed">{text}</p>
      <p className="mt-4 text-[14px] text-mist-600">{text.split(/\s+/).length} words</p>
    </div>
  );
}
