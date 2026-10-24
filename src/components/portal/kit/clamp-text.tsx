"use client";

import { useLayoutEffect, useRef, useState } from "react";
import Icon from "../icons";

/**
 * Long text in a side sheet or panel: the first few lines, faded, with "Show more". The
 * toggle appears only when the text really overflows, so short text reads as plain text.
 */
export function ClampText({ children, maxHeight = "10rem", className = "" }: { children: React.ReactNode; maxHeight?: string; className?: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [overflows, setOverflows] = useState(false);

  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const measure = () => setOverflows(el.scrollHeight > el.clientHeight + 4);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [children]);

  return (
    <div className={className}>
      <div
        ref={box}
        className="relative overflow-hidden transition-[max-height] duration-300 ease-out motion-reduce:transition-none"
        style={{ maxHeight: open ? "none" : maxHeight }}
      >
        {children}
        {!open && overflows && <span aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-mist-0 to-transparent" />}
      </div>
      {(overflows || open) && (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="mt-2 inline-flex items-center gap-1 rounded text-adm-base font-medium text-ocean-700 hover:text-ocean-800 hover:underline"
        >
          {open ? "Show less" : "Show more"}
          <Icon name="chevronDown" className={`size-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </button>
      )}
    </div>
  );
}
