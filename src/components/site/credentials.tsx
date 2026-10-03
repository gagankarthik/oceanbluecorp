import Image from "next/image";
import { cn } from "@/lib/utils";
import { CONTAINER, SECTION_Y, ChamferGround, SectionLink } from "./sections";
import PixelCard from "@/components/PixelCard";

/* Partners and certifications as one dark band, two columns of hairline
   cells on a plain ground. Marks rest in one tone; pointed at, that cell alone
   fills with cobalt pixels (react-bits PixelCard) and the mark comes up in its
   own colours. Names are in the alt text only.

   `w`/`h` are intrinsic pixels so nothing reflows on decode; `cls` sets the
   rendered height per mark, because the ratios run from 1:1 to 4.2:1.
   `mono` picks the resting tone: `silhouette` for single-colour vector marks,
   `invert` (greyscale, inverted) for badges with their own light fills. */

type Mark = { name: string; src: string; w: number; h: number; cls: string; mono: "silhouette" | "invert" };

const PARTNERS: Mark[] = [
  { name: "AWS", src: "/logos/partners/aws-partner-trimmed.png", w: 492, h: 492, cls: "h-16 sm:h-20", mono: "invert" },
  { name: "Snowflake", src: "/logos/partners/snowflake.svg", w: 146, h: 139, cls: "h-11 sm:h-14", mono: "silhouette" },
  { name: "Databricks", src: "/logos/partners/databricks.svg", w: 300, h: 331, cls: "h-11 sm:h-14", mono: "silhouette" },
];

const CERTS: Mark[] = [
  { name: "NMSDC certified MBE", src: "/logos/certifications/NMSDC.png", w: 340, h: 340, cls: "h-14 sm:h-16", mono: "invert" },
  { name: "State of Ohio certified WBE", src: "/logos/certifications/wbe.png", w: 845, h: 202, cls: "h-7 sm:h-9", mono: "invert" },
  { name: "State of Ohio certified MBE", src: "/logos/certifications/ohiombe.png", w: 734, h: 202, cls: "h-7 sm:h-9", mono: "invert" },
  { name: "City of Columbus certified MBE", src: "/logos/certifications/mbe.png", w: 707, h: 353, cls: "h-10 sm:h-12", mono: "invert" },
];

const MONO = {
  silhouette: "brightness-0 invert opacity-70",
  invert: "grayscale invert opacity-80",
};

/** Column lines that run past the grid and fade out, as if the grid continues. */
function Rails({ cols, className }: { cols: number; className?: string }) {
  return (
    <div aria-hidden className={cn("grid h-14 sm:h-20", className)} style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
      {Array.from({ length: cols }, (_, i) => (
        <span key={i} className={cn("border-l border-dashed border-white/10", i === cols - 1 && "border-r")} />
      ))}
    </div>
  );
}

function MarkGrid({ marks, cols, cellClass }: { marks: Mark[]; cols: number; cellClass: string }) {
  return (
    <div>
      <Rails cols={cols} className="[mask-image:linear-gradient(to_top,black,transparent)]" />
      <ul
        className="grid border-t border-l border-white/10"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {marks.map((m) => (
          <li key={m.name} className={cn("border-r border-b border-white/10", cellClass)} style={{ ["--pixel-card-active-color" as string]: "rgb(29 78 216 / 0.35)" }}>
            <PixelCard noFocus gap={6} speed={30} clearCenter={0.5} colors="#1d4ed8,#3b82f6,#93c5fd" className="aspect-auto h-full w-full rounded-none border-0">
              <div className="flex items-center justify-center px-4 py-3">
                <Image
                  src={m.src}
                  alt={m.name}
                  width={m.w}
                  height={m.h}
                  sizes="160px"
                  className={cn(
                    m.cls,
                    "w-auto max-w-full object-contain transition-[filter,opacity] duration-300 ease-[var(--ease-standard)] group-hover:opacity-100 group-hover:filter-none",
                    MONO[m.mono],
                  )}
                />
              </div>
            </PixelCard>
          </li>
        ))}
      </ul>
      <Rails cols={cols} className="[mask-image:linear-gradient(to_bottom,black,transparent)]" />
    </div>
  );
}

function ColumnHead({ id, kicker, title, sub, link }: { id: string; kicker: string; title: string; sub: string; link: { href: string; label: string } }) {
  return (
    <div className="reveal mx-auto max-w-[520px] text-center">
      <p className="type-label text-cobalt-light">{kicker}</p>
      <h2 id={id} className="mt-3 type-headline-sm text-white">
        {title}
      </h2>
      <p className="mt-4 type-body text-white/70">{sub}</p>
      <SectionLink href={link.href} dark className="mt-6">
        {link.label}
      </SectionLink>
    </div>
  );
}

/**
 * Technology partners beside certifications, on a dark chamfered band. The
 * two grids share a height: one tall row of partners, two rows of badges.
 */
export function CredentialsBand({ ground = "paper", below }: { ground?: "white" | "paper"; below?: "white" | "paper" | "none" }) {
  return (
    <ChamferGround ground={ground} below={below}>
      <section
        data-tone="dark"
        className={cn("on-dark chamfer chamfer-notched relative isolate overflow-hidden bg-night text-white", SECTION_Y)}
        aria-labelledby="partners-heading"
      >
        <div className={cn(CONTAINER, "grid gap-16 lg:grid-cols-2 lg:gap-12")}>
          <div>
            <ColumnHead
              id="partners-heading"
              kicker="Technology partnerships"
              title="Built on the platforms you already run"
              sub="Most of our cloud, data and AI delivery runs on these platforms, so your teams get hands-on expertise inside the stack they have."
              link={{ href: "/solutions/cloud", label: "Explore cloud engineering" }}
            />
            <div className="reveal mt-4 sm:mt-6">
              <MarkGrid marks={PARTNERS} cols={3} cellClass="h-44 sm:h-[320px]" />
            </div>
          </div>
          <div>
            <ColumnHead
              id="certs-heading"
              kicker="Certifications"
              title="Certified minority and women owned"
              sub="Certified by the NMSDC, the State of Ohio and the City of Columbus, for agencies and enterprises with supplier-diversity programs."
              link={{ href: "/about", label: "About Ocean Blue" }}
            />
            <div className="reveal mt-4 sm:mt-6">
              <MarkGrid marks={CERTS} cols={2} cellClass="h-36 sm:h-40" />
            </div>
          </div>
        </div>
      </section>
    </ChamferGround>
  );
}
