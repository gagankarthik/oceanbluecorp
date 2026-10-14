"use client";

import { useState } from "react";

type Field = {
  id: string;
  label: string;
  value: string;
  confidence: number;
  /** Region on the document, in % of its box */
  box: { top: number; left: number; width: number; height: number };
};

const fields: Field[] = [
  { id: "number", label: "Invoice number", value: "INV-20931", confidence: 0.99, box: { top: 12, left: 58, width: 34, height: 6 } },
  { id: "supplier", label: "Supplier", value: "Fairway Industrial Supply", confidence: 0.97, box: { top: 11, left: 7, width: 44, height: 9 } },
  { id: "date", label: "Due date", value: "10/11/2026 or 11/10/2026", confidence: 0.62, box: { top: 21, left: 58, width: 34, height: 6 } },
  { id: "total", label: "Total due", value: "$12,480.00", confidence: 0.95, box: { top: 76, left: 56, width: 36, height: 8 } },
];

const THRESHOLD = 0.8;

export default function BlueIQDemo() {
  const [focus, setFocus] = useState<string | null>(null);
  const [onlyReview, setOnlyReview] = useState(false);
  const shown = onlyReview ? fields.filter((f) => f.confidence < THRESHOLD) : fields;

  return (
    <div data-ui className="grid overflow-hidden border border-white/10 bg-navy-950/60 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      {/* Document */}
      <div className="relative border-b border-white/10 p-6 md:border-b-0 md:border-r">
        <p className="text-[length:var(--text-small)] font-medium text-tide-300">scan_0412.jpg, phone photo</p>
        <div className="relative mt-4 aspect-[3/4] rotate-[-1.2deg] bg-mist-50 shadow-[0_24px_50px_-20px_rgba(0,0,0,0.6)]">
          {/* simulated invoice content */}
          <div className="absolute inset-0 p-[7%] text-navy-900">
            <div className="flex justify-between">
              <div className="w-[48%] space-y-1.5">
                <div className="h-2.5 w-4/5 bg-navy-900/80" />
                <div className="h-1.5 w-full bg-navy-900/25" />
                <div className="h-1.5 w-2/3 bg-navy-900/25" />
              </div>
              <div className="w-[36%] space-y-1.5">
                <div className="h-2 w-full bg-navy-900/60" />
                <div className="h-1.5 w-3/4 bg-navy-900/25" />
                <div className="mt-3 h-2 w-full bg-navy-900/45" />
              </div>
            </div>
            <div className="mt-[18%] space-y-2.5">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="flex justify-between gap-3">
                  <div className="h-1.5 bg-navy-900/25" style={{ width: `${40 + ((i * 13) % 30)}%` }} />
                  <div className="h-1.5 w-[14%] bg-navy-900/25" />
                </div>
              ))}
            </div>
            <div className="absolute bottom-[17%] right-[9%] h-3 w-[30%] bg-navy-900/80" />
          </div>
          {shown.map((f) => {
            const review = f.confidence < THRESHOLD;
            const lit = focus === f.id;
            return (
              <div
                key={f.id}
                aria-hidden
                className={`absolute border-2 transition-[opacity,transform] duration-300 ${
                  review ? "border-buoy-400 bg-buoy-400/15" : "border-ocean-500 bg-ocean-500/10"
                } ${focus && !lit ? "opacity-25" : "opacity-100"} ${lit ? "scale-[1.04]" : ""}`}
                style={{ top: `${f.box.top}%`, left: `${f.box.left}%`, width: `${f.box.width}%`, height: `${f.box.height}%` }}
              />
            );
          })}
        </div>
      </div>

      {/* Extracted fields */}
      <div className="p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-[length:var(--text-small)] font-medium text-on-deep">Extracted fields</p>
          <label className="flex cursor-pointer items-center gap-3 text-[0.875rem] text-tide-300">
            <span>Needs review only</span>
            <input type="checkbox" className="peer sr-only" checked={onlyReview} onChange={(e) => setOnlyReview(e.target.checked)} />
            <span
              aria-hidden
              className="relative h-5 w-9 rounded-full bg-white/15 transition-colors after:absolute after:left-0.5 after:top-0.5 after:size-4 after:rounded-full after:bg-mist-100 after:transition-transform peer-checked:bg-buoy-500 peer-checked:after:translate-x-4 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-cyan-500"
            />
          </label>
        </div>

        <ul className="mt-6">
          {shown.map((f) => {
            const review = f.confidence < THRESHOLD;
            return (
              <li key={f.id}>
                <button
                  type="button"
                  onMouseEnter={() => setFocus(f.id)}
                  onMouseLeave={() => setFocus(null)}
                  onFocus={() => setFocus(f.id)}
                  onBlur={() => setFocus(null)}
                  className="grid w-full grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 border-t border-white/10 py-4 text-left transition-colors hover:bg-white/[0.03]" /* taste-skill-ignore: data-ui fragment */
                >
                  <span className="text-[0.8125rem] text-tide-300">{f.label}</span>
                  <span className={`row-span-2 flex items-center gap-3 text-[0.875rem] tabular-nums ${review ? "text-buoy-300" : "text-on-deep"}`}>
                    <span className="relative h-1 w-14 overflow-hidden rounded-full bg-white/10">
                      <span className={`absolute inset-y-0 left-0 rounded-full ${review ? "bg-buoy-400" : "bg-ocean-400"}`} style={{ width: `${f.confidence * 100}%` }} />
                    </span>
                    {f.confidence.toFixed(2)}
                  </span>
                  <span className="text-[1.0625rem] text-on-deep">{f.value}</span>
                </button>
              </li>
            );
          })}
        </ul>

        <p className="mt-2 flex items-start gap-3 border-t border-white/10 pt-5 text-[0.9375rem] leading-relaxed text-buoy-300" /* taste-skill-ignore: real table or data-ui fragment */>
          <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-buoy-400" />
          The due date could be read two ways, so Blue-IQ flags it for a person instead of guessing.
        </p>
      </div>
    </div>
  );
}
