"use client";

import { useState, useRef, type ComponentType } from "react";
import Image from "next/image";
import * as SiteIcons from "@/components/site/icons";
import { GeoTeam, GeoPart, GeoStack, GeoRack, GeoBooks, GeoLattice, GeoCivic, GeoCross, GeoColumns, GeoPlant } from "@/components/site/geo-art";
import { LinkButton, buttonClass } from "@/components/site/button";
import { IconCheck, IconArrowRight } from "@/components/site/icons";
import { IconCopy, IconDownload } from "@/components/site/resources/icons";
import { cn } from "@/lib/utils";
import { CONTAINER, OPENER_Y, SECTION_Y } from "@/components/site/sections";

/* The brand kit describes the system the public site actually runs on: the
   palette tokens in globals.css (@theme), IBM Plex, the site icon set and the
   wireframe drawings. Icons and drawings are enumerated, not hand-listed, so
   the kit cannot drift from the code. */

type Swatch = { name: string; hex: string; token: string; note: string; dark?: boolean };

const COLOR_GROUPS: { group: string; body: string; colors: Swatch[] }[] = [
  {
    group: "Action",
    body: "Cobalt is the one action colour: primary buttons, links, selection and focus. About 10% of any page, so it always reads as clickable.",
    colors: [
      { name: "Cobalt", hex: "#1d4ed8", token: "cobalt", note: "Primary buttons, links, focus", dark: true },
      { name: "Cobalt deep", hex: "#1740ad", token: "cobalt-deep", note: "Hover and pressed", dark: true },
      { name: "Cobalt tint", hex: "#eef2ff", token: "cobalt-tint", note: "Selected chips, soft highlights" },
      { name: "Cobalt light", hex: "#a9c1ff", token: "cobalt-light", note: "Links and accents on navy" },
    ],
  },
  {
    group: "Brand",
    body: "The two blues of the Ocean Blue mark. The logo blue can carry text; aqua is for fills and marks only (2.7:1 on white).",
    colors: [
      { name: "Brand blue", hex: "#0975c1", token: "brand", note: "Brand moments, illustration", dark: true },
      { name: "Aqua", hex: "#0cacCF", token: "aqua", note: "Fills and marks, never text", dark: true },
    ],
  },
  {
    group: "Ink",
    body: "Navy text in three steps, about 30% of a page including one dark band. Every step is AA on white and on paper.",
    colors: [
      { name: "Ink (navy)", hex: "#0b1a33", token: "ink", note: "Headings, dark panels", dark: true },
      { name: "Ink muted", hex: "#3a4a66", token: "ink-muted", note: "Body copy", dark: true },
      { name: "Ink subtle", hex: "#56637b", token: "ink-subtle", note: "Captions, metadata", dark: true },
    ],
  },
  {
    group: "Surfaces",
    body: "White and a cool blue-grey alternate down a page, about 60% of it; hairlines separate, shadows only lift what you can interact with.",
    colors: [
      { name: "White", hex: "#ffffff", token: "white", note: "Base, cards" },
      { name: "Paper", hex: "#f3f6fb", token: "paper", note: "Alternating sections, footer" },
      { name: "Paper deep", hex: "#e7edf6", token: "paper-deep", note: "Image wells, pressed wells" },
      { name: "Line", hex: "#e2e8f1", token: "line", note: "Hairlines, card borders" },
      { name: "Line strong", hex: "#cbd5e3", token: "line-strong", note: "Inputs, outline buttons" },
    ],
  },
  {
    group: "Status",
    body: "Meaning only, never decoration. Amber is the single warm hue and means time-sensitive.",
    colors: [
      { name: "Success", hex: "#047857", token: "success", note: "Applied, operational", dark: true },
      { name: "Warning", hex: "#92400e", token: "warning", note: "Deadlines, degraded", dark: true },
      { name: "Danger", hex: "#b91c1c", token: "danger", note: "Errors, outages", dark: true },
    ],
  },
];

const TYPE_SCALE = [
  { label: "Display", cls: "type-display", note: "Home hero only · 42–80px", sample: "The people and platforms." },
  { label: "Headline large", cls: "type-headline-lg", note: "Page title · 36–56px", sample: "Page title" },
  { label: "Headline", cls: "type-headline", note: "Section title · 30–48px", sample: "Section headline" },
  { label: "Headline small", cls: "type-headline-sm", note: "Sub-section · 24–32px", sample: "Sub-section headline" },
  { label: "Title large", cls: "type-title-lg", note: "Card title · 20–24px", sample: "Card title" },
  { label: "Title", cls: "type-title", note: "List item · 17px", sample: "List item title" },
  { label: "Body large", cls: "type-body-lg text-ink-muted", note: "Lead paragraph · 17–19px", sample: "A lead paragraph introduces the section in a sentence or two." },
  { label: "Body", cls: "type-body text-ink-muted", note: "Running text · 16px", sample: "Body copy sets the reading rhythm at a comfortable line height." },
  { label: "Body small", cls: "type-body-sm text-ink-muted", note: "Card body · 14.5px", sample: "Secondary text inside cards and lists." },
  { label: "Label", cls: "type-label", note: "Buttons, kickers · 14px", sample: "Label text" },
  { label: "Caption", cls: "type-caption text-ink-subtle", note: "Meta, timestamps · 13px", sample: "Posted 3 days ago" },
];

const DRAWINGS: [string, ComponentType<{ className?: string }>][] = [
  ["GeoTeam", GeoTeam],
  ["GeoPart", GeoPart],
  ["GeoStack", GeoStack],
  ["GeoRack", GeoRack],
  ["GeoBooks", GeoBooks],
  ["GeoLattice", GeoLattice],
  ["GeoCivic", GeoCivic],
  ["GeoCross", GeoCross],
  ["GeoColumns", GeoColumns],
  ["GeoPlant", GeoPlant],
];

// Every glyph exported from the site icon set. Type exports are erased at
// runtime, so filtering to Icon-named function values yields the components.
const ICON_ENTRIES = (Object.entries(SiteIcons) as [string, unknown][])
  .filter(([name, v]) => name.startsWith("Icon") && typeof v === "function")
  .sort(([a], [b]) => a.localeCompare(b)) as [string, ComponentType<{ size?: number }>][];

const SECTIONS = [
  { id: "logo", label: "Logo" },
  { id: "color", label: "Color" },
  { id: "type", label: "Typography" },
  { id: "components", label: "Components" },
  { id: "icons", label: "Icons" },
  { id: "drawings", label: "Drawings" },
];

function CopyChip({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard
          ?.writeText(value)
          .then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
          })
          .catch(() => {});
      }}
      className="inline-flex min-h-8 items-center gap-1 rounded-md border border-line bg-white px-2 font-mono text-[12px] text-ink-muted transition-colors hover:border-ink hover:text-ink"
      title="Copy"
    >
      {value}
      {copied ? <IconCheck size={12} className="text-success" /> : <IconCopy size={12} />}
    </button>
  );
}

/** One icon tile; click copies the rendered <svg> markup. */
function IconCell({ name, Icon }: { name: string; Icon: ComponentType<{ size?: number }> }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    const svg = ref.current?.querySelector("svg");
    if (!svg) return;
    const clone = svg.cloneNode(true) as SVGElement;
    clone.removeAttribute("class");
    clone.setAttribute("width", "24");
    clone.setAttribute("height", "24");
    try {
      await navigator.clipboard.writeText(clone.outerHTML);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // clipboard is permission-gated / unavailable on plain http, no-op
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      title={`Copy ${name} SVG`}
      aria-label={copied ? `${name} SVG copied` : `Copy ${name} SVG`}
      className="group relative flex flex-col items-center gap-3 bg-white px-3 py-5 transition-colors hover:bg-paper"
    >
      <span ref={ref} className="text-ink">
        <Icon size={24} />
      </span>
      <span className="w-full truncate text-center font-mono text-[11px] text-ink-subtle">{name.replace(/^Icon/, "")}</span>
      <span aria-hidden className={cn("absolute top-2 right-2", copied ? "text-success" : "text-line-strong group-hover:text-ink-subtle")}>
        {copied ? <IconCheck size={12} /> : <IconCopy size={12} />}
      </span>
    </button>
  );
}

/** Every section of the kit: a sticky label column, content on the right. */
function KitSection({ id, n, title, sub, children }: { id: string; n: string; title: string; sub: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-28 border-t border-line py-14 first:border-t-0 first:pt-0 last:pb-0">
      <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-28">
            <p className="font-mono text-[13px] font-medium text-cobalt">{n}</p>
            <h2 className="mt-2 type-headline font-semibold text-ink">{title}</h2>
            <p className="mt-3 max-w-[40ch] type-body text-ink-muted">{sub}</p>
          </div>
        </div>
        <div className="min-w-0 lg:col-span-8">{children}</div>
      </div>
    </section>
  );
}

export default function BrandKitContent() {
  return (
    <>
      <section data-opener className="border-b border-line bg-white">
        <div className={`${CONTAINER} ${OPENER_Y} grid gap-10 lg:grid-cols-12 lg:items-end`}>
          <div className="lg:col-span-8">
            <p className="rise type-label font-semibold text-cobalt">Media kit</p>
            <h1 className="rise mt-3 type-headline-lg font-semibold text-ink" style={{ animationDelay: "80ms" }}>
              Brand kit and design system
            </h1>
            <p className="rise mt-6 max-w-[58ch] type-body-lg text-ink-muted" style={{ animationDelay: "160ms" }}>
              The logo, colour, type, icons and drawings behind Ocean Blue Corporation, the single source of truth for a consistent brand.
            </p>
            <div className="rise mt-9 flex flex-wrap gap-3" style={{ animationDelay: "240ms" }}>
              <a href="/logo.png" download className={buttonClass("primary", "lg")}>
                <IconDownload size={16} />
                Download logo
              </a>
              <LinkButton href="/contact" variant="outline" size="lg">
                Press and partnership requests
              </LinkButton>
            </div>
          </div>
          <nav aria-label="Brand kit sections" className="rise lg:col-span-4" style={{ animationDelay: "300ms" }}>
            <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-3 lg:grid-cols-2">
              {SECTIONS.map((s, i) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="group flex min-h-14 items-center justify-between gap-2 bg-white px-4 py-3 type-body-sm font-medium text-ink hover:bg-paper">
                    <span>
                      <span className="mr-2 font-mono text-[12px] text-ink-subtle">0{i + 1}</span>
                      {s.label}
                    </span>
                    <IconArrowRight size={14} className="text-ink-subtle transition-transform group-hover:translate-x-0.5" />
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </section>

      <div data-tone="white" className={`bg-white ${SECTION_Y}`}>
        <div className={CONTAINER}>
          <KitSection id="logo" n="01" title="Logo" sub="Primary wordmark. Keep clear space around it and don't recolor or distort.">
            <div className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2">
              <div className="flex min-h-[220px] items-center justify-center bg-white p-10">
                <Image src="/logo.png" alt="Ocean Blue Corporation logo on light" width={220} height={60} className="h-12 w-auto" />
              </div>
              <div className="flex min-h-[220px] items-center justify-center bg-ink p-10">
                <Image src="/logo.png" alt="Ocean Blue Corporation logo on dark" width={220} height={60} className="h-12 w-auto brightness-0 invert" />
              </div>
            </div>
            <a href="/logo.png" download className="mt-4 inline-flex min-h-10 items-center gap-2 type-label font-semibold text-cobalt hover:text-cobalt-deep">
              <IconDownload size={16} />
              Download logo (PNG)
            </a>
          </KitSection>

          <KitSection id="color" n="02" title="Color" sub="One cobalt accent, a warm ink ramp, and white and paper surfaces. Click any value to copy it.">
            <div className="space-y-10">
              {COLOR_GROUPS.map((g) => (
                <div key={g.group}>
                  <p className="text-[16px] font-semibold text-ink">{g.group}</p>
                  <p className="mt-1 max-w-[60ch] type-body-sm text-ink-muted">{g.body}</p>
                  <div className="mt-4 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 xl:grid-cols-3">
                    {g.colors.map((c) => (
                      <div key={c.token} className="bg-white">
                        <div className="flex h-24 items-end justify-end border-b border-line p-3" style={{ background: c.hex }}>
                          <span className={cn("type-caption font-medium", c.dark ? "text-white" : "text-ink")}>Aa</span>
                        </div>
                        <div className="p-4">
                          <p className="text-[15px] font-semibold text-ink">{c.name}</p>
                          <p className="mt-0.5 type-body-sm text-ink-muted">{c.note}</p>
                          <div className="mt-3 flex flex-wrap items-center gap-1.5">
                            <CopyChip value={c.hex} />
                            <CopyChip value={c.token} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </KitSection>

          <KitSection id="type" n="03" title="Typography" sub="IBM Plex Sans in eleven roles, fluid from phone to desktop, and IBM Plex Mono for code. Pages pick a role, never a pixel size.">
            <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line">
              {TYPE_SCALE.map((t) => (
                <div key={t.label} className="grid gap-2 bg-white px-5 py-6 sm:grid-cols-[9rem_minmax(0,1fr)] sm:items-baseline sm:gap-6">
                  <span>
                    <span className="block type-label font-semibold text-ink">{t.label}</span>
                    <span className="mt-0.5 block type-caption text-ink-subtle">{t.note}</span>
                  </span>
                  <p className={cn("min-w-0 break-words text-ink", t.cls)}>{t.sample}</p>
                </div>
              ))}
            </div>
          </KitSection>

          <KitSection id="components" n="04" title="Components" sub="Pill buttons in one height scale, hairline cards, and the one lit plane. No drop shadows at rest.">
            <div className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2">
              <div className="bg-white p-6">
                <p className="type-label font-semibold text-ink">Buttons</p>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <span className={buttonClass("primary", "md")}>Primary</span>
                  <span className={buttonClass("outline", "md")}>Outline</span>
                  <span className={buttonClass("dark", "md")}>Dark</span>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl bg-ink p-4">
                  <span className={buttonClass("inverse", "md")}>Inverse</span>
                  <span className={buttonClass("outline-dark", "md")}>Outline on dark</span>
                </div>
              </div>
              <div className="bg-white p-6">
                <p className="type-label font-semibold text-ink">Chips and cards</p>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-line bg-white px-3 py-1 type-caption text-ink-muted">Chip</span>
                  <span className="rounded-full bg-cobalt-tint px-3 py-1 type-caption font-medium text-cobalt">Tinted</span>
                  <span className="rounded-full bg-paper px-3 py-1 type-caption text-ink-muted">Paper</span>
                </div>
                <div className="mt-4 rounded-2xl border border-line p-5">
                  <p className="text-[16px] font-semibold text-ink">Card title</p>
                  <p className="mt-1 type-body-sm text-ink-muted">rounded-2xl, 1px line border, no shadow at rest.</p>
                </div>
              </div>
            </div>
          </KitSection>

          <KitSection
            id="icons"
            n="05"
            title="Icons"
            sub="The site icon set, drawn on one grid: 24×24 box, 1.5 stroke, round caps, currentColor. Click any icon to copy its SVG."
          >
            <div className="grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-6">
              {ICON_ENTRIES.map(([name, Icon]) => (
                <IconCell key={name} name={name} Icon={Icon} />
              ))}
            </div>
          </KitSection>

          <KitSection id="drawings" n="06" title="Drawings" sub="Isometric wireframes: thin ink lines, square vertex nodes, one cobalt plane per drawing. Each stands for a service or an industry.">
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-3 xl:grid-cols-4">
              {DRAWINGS.map(([name, Art]) => (
                <figure key={name} className="flex flex-col items-center gap-3 bg-paper px-4 pt-6 pb-4">
                  <Art className="h-28 w-auto" />
                  <figcaption className="font-mono text-[11.5px] text-ink-subtle">{name}</figcaption>
                </figure>
              ))}
            </div>
          </KitSection>
        </div>
      </div>
    </>
  );
}
