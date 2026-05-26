"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Check, Copy } from "lucide-react";

type Swatch = { name: string; hex: string; varName: string; note?: string; dark?: boolean };

const COLOR_GROUPS: { group: string; colors: Swatch[] }[] = [
  {
    group: "Brand — Ocean Blue",
    colors: [
      { name: "Cobalt", hex: "#1d4ed8", varName: "--hz-cobalt", note: "Primary accent — buttons, links, active states", dark: true },
      { name: "Cobalt 600", hex: "#1740ad", varName: "--hz-cobalt-600", note: "Hover / gradient depth", dark: true },
      { name: "Cobalt 100", hex: "#dbe6fe", varName: "--hz-cobalt-100", note: "Tints, chips, soft fills" },
    ],
  },
  {
    group: "Accent",
    colors: [
      { name: "Cyan", hex: "#2ad8ef", varName: "--hz-cyan", note: "Secondary accent" },
      { name: "Cyan 400", hex: "#5ce0f7", varName: "--hz-cyan-400", note: "Accents on dark surfaces" },
      { name: "Indigo", hex: "#6366f1", varName: "--hz-indigo", note: "Tertiary / data viz", dark: true },
    ],
  },
  {
    group: "Dark surfaces",
    colors: [
      { name: "Ink", hex: "#050912", varName: "--hz-ink", note: "Deepest — hero / CTA", dark: true },
      { name: "Navy", hex: "#0a1730", varName: "--hz-navy", note: "Feature bands", dark: true },
      { name: "Navy 2", hex: "#0e2147", varName: "--hz-navy-2", note: "Raised dark surface", dark: true },
    ],
  },
  {
    group: "Neutrals",
    colors: [
      { name: "Text", hex: "#0f172a", varName: "--hz-text", note: "Headings / body", dark: true },
      { name: "Text muted", hex: "#475569", varName: "--hz-text-mute", note: "Secondary text", dark: true },
      { name: "Line", hex: "#e2e8f0", varName: "--hz-line", note: "Hairlines / borders" },
      { name: "Surface", hex: "#f8fafc", varName: "--hz-surface", note: "Section backgrounds" },
      { name: "Canvas", hex: "#ffffff", varName: "--hz-canvas", note: "Base / cards" },
    ],
  },
];

const TYPE_SCALE = [
  { label: "Display / Hero", cls: "text-[3.5rem] leading-none", sample: "Enterprises & agencies." },
  { label: "H1", cls: "text-[2.5rem] leading-tight", sample: "Section headline" },
  { label: "H2", cls: "text-[1.75rem]", sample: "Subsection heading" },
  { label: "H3", cls: "text-[1.25rem]", sample: "Card title" },
  { label: "Body", cls: "text-[16px] leading-relaxed", sample: "Body copy sets the reading rhythm at a relaxed line height for clarity." },
  { label: "Small / caption", cls: "text-[13px] text-[var(--hz-text-mute)]", sample: "Captions, metadata, and labels." },
];

function CopyChip({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard?.writeText(value).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1200);
        }).catch(() => {});
      }}
      className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-[11px] text-[var(--hz-text-mute)] transition-colors hover:bg-[var(--hz-cobalt-100)] hover:text-[var(--hz-cobalt)]"
      title="Copy"
    >
      {value}
      {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3 opacity-50" />}
    </button>
  );
}

export default function BrandKitContent() {
  return (
    <div className="horizon w-full bg-[var(--hz-canvas)]">
      {/* Hero */}
      <section className="relative isolate w-full overflow-hidden" style={{ background: "#07142b" }}>
        <div aria-hidden className="absolute inset-0" style={{ background: "radial-gradient(60% 85% at 82% 0%, rgba(29,78,216,0.32), transparent 62%)" }} />
        <div className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-20 pt-32 sm:px-8">
          <Link href="/" className="group mb-6 inline-flex items-center gap-2 text-sm font-medium text-white/70 transition-colors hover:text-white">
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" /> Back to Home
          </Link>
          <h1 className="hz-display max-w-[18ch] text-[2.5rem] text-white sm:text-[3.25rem] lg:text-[4rem]">Brand kit & design system</h1>
          <p className="mt-6 max-w-xl text-[16px] leading-relaxed text-white/75 sm:text-[18px]">
            The colors, type, logo, and components behind Ocean Blue Corporation — the single source of truth for a consistent brand.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-20 px-6 py-20 sm:px-8">
        {/* Logo */}
        <section>
          <SectionHeading n="01" title="Logo" sub="Primary wordmark. Keep clear space around it and don't recolor or distort." />
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            <div className="flex items-center justify-center rounded-2xl border border-slate-200/80 bg-white p-12 shadow-sm">
              <Image src="/logo.png" alt="Ocean Blue Corporation logo on light" width={220} height={60} className="h-12 w-auto" />
            </div>
            <div className="flex items-center justify-center rounded-2xl p-12 shadow-sm" style={{ background: "#07142b" }}>
              <Image src="/logo.png" alt="Ocean Blue Corporation logo on dark" width={220} height={60} className="h-12 w-auto brightness-0 invert" />
            </div>
          </div>
          <a href="/logo.png" download className="mt-4 inline-flex items-center gap-2 text-[13px] font-semibold text-[var(--hz-cobalt)] hover:underline">
            Download logo (PNG)
          </a>
        </section>

        {/* Colors */}
        <section>
          <SectionHeading n="02" title="Color" sub="One decisive Ocean-Blue accent, a cyan secondary, deep navy darks, and a single cool slate neutral family. Click any value to copy." />
          <div className="mt-8 space-y-8">
            {COLOR_GROUPS.map((g) => (
              <div key={g.group}>
                <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--hz-text-mute)]">{g.group}</p>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {g.colors.map((c) => (
                    <div key={c.varName} className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
                      <div className="flex h-24 items-end justify-end p-3" style={{ background: c.hex }}>
                        {c.dark && <span className="text-[10px] font-medium text-white/60">Aa</span>}
                      </div>
                      <div className="p-4">
                        <p className="text-[14px] font-semibold text-[var(--hz-text)]">{c.name}</p>
                        {c.note && <p className="mt-0.5 text-[12px] leading-snug text-[var(--hz-text-mute)]">{c.note}</p>}
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          <CopyChip value={c.hex} />
                          <CopyChip value={`var(${c.varName})`} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Typography */}
        <section>
          <SectionHeading n="03" title="Typography" sub="Geist Sans across display and body; Geist Mono for code and labels. Tight tracking on large display, relaxed line height on body." />
          <div className="mt-8 divide-y divide-slate-100 rounded-2xl border border-slate-200/80 bg-white p-2 shadow-sm">
            {TYPE_SCALE.map((t) => (
              <div key={t.label} className="flex flex-col gap-2 px-5 py-5 sm:flex-row sm:items-baseline sm:gap-8">
                <span className="w-32 flex-none text-[12px] font-medium uppercase tracking-wide text-[var(--hz-text-mute)]">{t.label}</span>
                <p className={`hz-display min-w-0 truncate text-[var(--hz-text)] ${t.cls}`}>{t.sample}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Components */}
        <section>
          <SectionHeading n="04" title="Components" sub="Core interactive elements — buttons, chips, and cards use the rounded, cobalt-accented language sitewide." />
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--hz-text-mute)]">Buttons</p>
              <div className="flex flex-wrap items-center gap-3">
                <button className="inline-flex items-center rounded-full bg-[var(--hz-cobalt)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[var(--hz-cobalt-600)]">Primary</button>
                <button className="inline-flex items-center rounded-full border border-slate-300 px-5 py-2.5 text-sm font-semibold text-[var(--hz-text)] transition-colors hover:border-[var(--hz-cobalt)] hover:text-[var(--hz-cobalt)]">Secondary</button>
                <button className="inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold text-[var(--hz-cobalt)] hover:underline">Text link</button>
              </div>
            </div>
            <div className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--hz-text-mute)]">Chips & radius</p>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[var(--hz-cobalt-100)] px-2.5 py-1 text-xs font-semibold text-[var(--hz-cobalt)]">Badge</span>
                <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">rounded-lg</span>
                <span className="rounded-2xl bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">rounded-2xl (cards)</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function SectionHeading({ n, title, sub }: { n: string; title: string; sub: string }) {
  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3">
        <span className="font-mono text-[12px] font-semibold text-[var(--hz-cobalt)]">{n}</span>
        <span className="h-px flex-1 bg-slate-200" />
      </div>
      <h2 className="hz-display mt-4 text-[2rem] text-[var(--hz-text)] sm:text-[2.5rem]">{title}</h2>
      <p className="mt-3 text-[15px] leading-relaxed text-[var(--hz-text-mute)]">{sub}</p>
    </div>
  );
}
