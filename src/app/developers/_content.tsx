"use client";

import { useState } from "react";

/** A code sample with a copy button; the only interactive piece of the docs. */
export function CodeBlock({ lang = "bash", children }: { lang?: string; children: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="on-dark my-5 min-w-0 bg-navy-950 text-mist-50">
      <div className="flex items-center justify-between border-b border-navy-800 px-5 py-2">
        <span className="font-mono text-caption text-tide-300">{lang}</span>
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard.writeText(children).then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            });
          }}
          className="inline-flex min-h-10 items-center px-3 text-small font-medium text-tide-300 transition-colors hover:bg-navy-800 hover:text-white"
        >
          <span aria-live="polite">{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>
      {/* Long lines scroll inside the block, never the page */}
      <pre className="max-w-full overflow-x-auto overflow-y-hidden whitespace-pre p-5 font-mono text-small leading-normal">{children}</pre>
    </div>
  );
}
