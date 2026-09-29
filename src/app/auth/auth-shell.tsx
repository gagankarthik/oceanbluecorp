"use client";

import Link from "next/link";
import Image from "next/image";
import type { ReactNode, SVGProps } from "react";
import { GeoTeam, GeoStack, GeoRack } from "@/components/site/geo-art";
import { DotsBackdrop } from "@/components/site/dots-backdrop";
import { IconArrowLeft } from "@/components/site/icons";

/* The frame every auth screen shares: a navy brand panel beside the task on
   desktop, a compact branded bar above it on phones. The panel says where
   the person is and who to ask, never markets the product: everyone who
   reaches this door was invited. */

const PILLARS = [
  { Art: GeoTeam, label: "People" },
  { Art: GeoStack, label: "Platforms" },
  { Art: GeoRack, label: "Operations" },
];

export function AuthShell({
  kicker,
  title,
  body,
  children,
}: {
  /** Step context only ("Step 2 of 2 · New account"); omit rather than repeat the logo. */
  kicker?: string;
  title: string;
  body: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-dvh w-full bg-white lg:h-dvh lg:min-h-[480px] lg:overflow-hidden">
      {/* Its own look, not the home hero: a light panel with the three things
          the console runs (people, platforms, operations) drawn in the site's
          isometric line style. */}
      <aside className="relative isolate hidden w-[46%] max-w-[720px] flex-col justify-between overflow-hidden border-r border-line bg-paper px-12 py-10 lg:flex xl:px-14">
        {/* A slow cobalt dot field, strongest behind the copy and fading to the edges. */}
        <DotsBackdrop color="rgb(29, 78, 216)" maxOpacity={0.24} mask="[mask-image:radial-gradient(90%_70%_at_40%_55%,black,transparent_80%)]" />
        <div className="flex items-center justify-between gap-6">
          <Link href="/" aria-label="Ocean Blue Corporation, home">
            <Image src="/logo.webp" alt="Ocean Blue Corporation" width={170} height={45} className="h-9 w-auto" priority />
          </Link>
          <Link href="/" className="group inline-flex items-center gap-2 type-label font-medium text-ink-muted hover:text-ink">
            <IconArrowLeft size={16} className="transition-transform duration-150 group-hover:-translate-x-0.5" />
            Back to site
          </Link>
        </div>

        <div className="max-w-md">
          <div key={title} className="rise">
            {kicker && <p className="mb-3 type-label text-cobalt">{kicker}</p>}
            <h2 className="type-headline text-ink">{title}</h2>
            <p className="mt-3 max-w-[42ch] type-body-lg text-ink-muted">{body}</p>
          </div>

          <ul aria-hidden className="mt-8 grid grid-cols-3 gap-3">
            {PILLARS.map(({ Art, label }) => (
              <li key={label} className="rounded-2xl border border-line bg-white/85 px-3 pt-3 pb-2.5 text-center backdrop-blur-sm">
                <Art className="mx-auto h-16 w-auto" />
                <p className="mt-2 type-caption font-semibold text-ink-muted">{label}</p>
              </li>
            ))}
          </ul>
        </div>

        <p className="max-w-[40ch] type-caption text-ink-subtle">
          Access is granted by an administrator. If you need an account or your invitation expired, email{" "}
          <a href="mailto:hr@oceanbluecorp.com" className="font-semibold text-cobalt underline-offset-4 hover:underline">
            hr@oceanbluecorp.com
          </a>
          .
        </p>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col lg:overflow-y-auto">
        {/* Phones and tablets: the brand, and the way back, in one bar. */}
        <div className="flex items-center justify-between border-b border-line px-5 py-4 lg:hidden">
          <Link href="/" aria-label="Ocean Blue Corporation, home">
            <Image src="/logo.webp" alt="Ocean Blue Corporation" width={150} height={40} className="h-8 w-auto" priority />
          </Link>
          <Link href="/" className="inline-flex items-center gap-1.5 type-label font-medium text-ink-muted hover:text-ink">
            <IconArrowLeft size={16} />
            Back to site
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center px-5 py-10 sm:px-10 lg:py-8">
          <div className="rise w-full max-w-[420px]">{children}</div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Auth-only glyphs, drawn to the site set's rules ---------- */

type P = SVGProps<SVGSVGElement> & { size?: number };
function Svg({ size = 18, children, ...rest }: P & { children: ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...rest}>
      {children}
    </svg>
  );
}

export const IconEye = (p: P) => (
  <Svg {...p}>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="3" />
  </Svg>
);

export const IconEyeOff = (p: P) => (
  <Svg {...p}>
    <path d="M10 5.8A9.9 9.9 0 0 1 12 5.5C18 5.5 21.5 12 21.5 12a17 17 0 0 1-2.9 3.7M6.1 7.1C3.8 8.8 2.5 12 2.5 12S6 18.5 12 18.5a9.4 9.4 0 0 0 4.5-1.1M9.9 9.9a3 3 0 0 0 4.2 4.2M3.5 3.5l17 17" />
  </Svg>
);

export const IconShield = (p: P) => (
  <Svg {...p}>
    <path d="M12 3 19.5 6v5.6c0 4.6-3.1 7.8-7.5 9.4-4.4-1.6-7.5-4.8-7.5-9.4V6z" />
  </Svg>
);

/** A status mark for full-panel states: success, error, working, neutral. */
export function StatusMark({ tone, children }: { tone: "success" | "danger" | "neutral"; children: ReactNode }) {
  const cls =
    tone === "success" ? "bg-success-container text-success" : tone === "danger" ? "bg-danger-container text-danger" : "bg-cobalt-tint text-cobalt";
  return <span className={`mx-auto flex size-16 items-center justify-center rounded-2xl ${cls}`}>{children}</span>;
}
