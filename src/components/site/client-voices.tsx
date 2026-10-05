import { cn } from "@/lib/utils";

/**
 * Client voices, all visible at once: three cards in one row, the middle one
 * on navy, the outer two on white, all over the striped cobalt section. No carousel, so nobody waits to see who vouches
 * for us. White on cobalt and ink on white are both well above AA.
 */

type Story = {
  company: string;
  logo: string;
  logoCls: string;
  /** The supplied artwork is white-on-transparent, so it is darkened to show on white. */
  whiteArtwork?: boolean;
  quote: string;
  author: string;
  role: string;
};

const STORIES: Story[] = [
  {
    company: "Pivotpoint",
    logo: "https://pivotpoint.us/wp-content/uploads/2020/08/logo-long-w-ds.png",
    logoCls: "h-7",
    whiteArtwork: true,
    quote:
      "Oceanblue operates as a true strategic partner. Their team brings deep expertise, a disciplined approach to execution, and a consistent commitment to quality.",
    author: "Brian K.",
    role: "Co-Founder",
  },
  {
    company: "Diebold Nixdorf",
    logo: "https://www.dieboldnixdorf.com/-/media/diebold/images/global/logo/dn-color-logo.svg",
    logoCls: "h-8",
    quote:
      "Oceanblue's resources demonstrated high levels of skill and professionalism, delivering quality results that met our expectations and deadlines.",
    author: "Damodar Buchi Reddy",
    role: "Project Director",
  },
  {
    company: "Mapsys, Inc.",
    logo: "https://www.mapsysinc.com/wp-content/uploads/2021/11/mapsys-logo.png",
    logoCls: "h-6",
    whiteArtwork: true,
    quote:
      "I have partnered with Oceanblue for many years. They are trustworthy, honest, motivated, and bring a high degree of work ethic to everything they do.",
    author: "Ken H.",
    role: "Senior Account Executive",
  },
];

const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

function QuoteMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 36" className={className} fill="currentColor" aria-hidden>
      <path d="M0 36V21C0 9.4 6.2 2.4 18.6 0l2 4.6C13.8 6.4 10.3 10 10 15.5h9V36H0Zm27 0V21C27 9.4 33.2 2.4 45.6 0l2 4.6C40.8 6.4 37.3 10 37 15.5h9V36H27Z" />
    </svg>
  );
}

function Voice({ s, featured }: { s: Story; featured?: boolean }) {
  return (
    <figure
      className={cn(
        "relative flex h-full flex-col overflow-hidden rounded-2xl p-8",
        featured ? "on-dark bg-ink text-white" : "bg-white text-ink",
      )}
    >
      <div className="relative flex items-start justify-between gap-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={s.logo}
          alt={s.company}
          loading="lazy"
          decoding="async"
          className={cn(s.logoCls, "w-auto max-w-[170px] object-contain object-left", featured ? "brightness-0 invert" : s.whiteArtwork && "brightness-0")}
        />
        <QuoteMark className={cn("h-8 w-11 shrink-0", featured ? "text-cobalt-light" : "text-cobalt")} />
      </div>

      <blockquote className={cn("relative mt-8 mb-10 type-body-lg font-medium tracking-[-0.015em]", !featured && "text-ink")}>
        {s.quote}
      </blockquote>

      <figcaption className={cn("relative mt-auto flex items-center gap-3.5 border-t pt-6", featured ? "border-white/25" : "border-line")}>
        <span
          aria-hidden
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-full text-[14px] font-semibold",
            featured ? "bg-cobalt text-white" : "bg-cobalt-tint text-cobalt",
          )}
        >
          {initials(s.author)}
        </span>
        <span>
          <span className="block text-[15.5px] font-semibold">{s.author}</span>
          <span className={cn("block text-[14px]", featured ? "text-white/85" : "text-ink-subtle")}>
            {s.role}, {s.company}
          </span>
        </span>
      </figcaption>
    </figure>
  );
}

/** One row of three; the navy middle card is the focal point. */
export function ClientVoices() {
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      {STORIES.map((s, i) => (
        <Voice key={s.company} s={s} featured={i === 1} />
      ))}
    </div>
  );
}
