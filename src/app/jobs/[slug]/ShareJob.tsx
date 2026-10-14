"use client";

import { useEffect, useRef, useState } from "react";

/** Shares the public address of the posting, never the host it happens to be viewed on. */
export default function ShareJob({ url, title }: { url: string; title: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const text = `${title} at Oceanblue Solutions`;

  async function share() {
    // Phones: the system share sheet; elsewhere, a short menu
    if (navigator.share && window.matchMedia("(pointer: coarse)").matches) {
      try {
        await navigator.share({ title: text, url });
        return;
      } catch {
        // Dismissed: fall through to the menu
      }
    }
    setOpen((v) => !v);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link", url);
    }
  }

  const enc = encodeURIComponent;
  const targets = [
    { label: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}` },
    { label: "Email", href: `mailto:?subject=${enc(text)}&body=${enc(`${text}\n${url}`)}` },
    { label: "X", href: `https://x.com/intent/post?text=${enc(text)}&url=${enc(url)}` },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={share}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex min-h-12 w-full items-center justify-center gap-2 bg-mist-0 px-6 font-medium text-navy-900 ring-1 ring-inset ring-mist-300 btn-fill btn-fill-quiet"
      >
        <svg aria-hidden viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="15" cy="4.5" r="2.2" />
          <circle cx="5" cy="10" r="2.2" />
          <circle cx="15" cy="15.5" r="2.2" />
          <path d="m7 9 6-3.3M7 11l6 3.3" />
        </svg>
        Share this role
      </button>
      {open && (
        <div role="menu" className="absolute inset-x-0 top-[calc(100%+6px)] z-20 bg-mist-0 p-2 shadow-xl ring-1 ring-mist-200">
          <button type="button" role="menuitem" onClick={copy} className="flex min-h-10 w-full items-center px-3 text-left text-[15px] hover:bg-mist-100">
            {copied ? "Link copied" : "Copy link"}
          </button>
          {targets.map((t) => (
            <a
              key={t.label}
              role="menuitem"
              href={t.href}
              target={t.label === "Email" ? undefined : "_blank"}
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="flex min-h-10 items-center px-3 text-[15px] hover:bg-mist-100"
            >
              {t.label}
            </a>
          ))}
        </div>
      )}
      <span aria-live="polite" className="sr-only">
        {copied ? "Link copied" : ""}
      </span>
    </div>
  );
}
