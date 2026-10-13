import Image from "next/image";
import { cn } from "@/lib/utils";
import { CONTAINER, SECTION_Y, ChamferGround, SectionLink } from "./sections";
import PixelCard from "@/components/PixelCard";

/* Partners and certifications as one dark band, two columns of hairline
   cells on a plain ground. Marks sit straight on the navy, scaled to fill a
   fixed box so wide and square badges carry the same weight. Pointed at, a
   cell fills with cobalt pixels (react-bits PixelCard).

   `w`/`h` are intrinsic pixels so nothing reflows on decode. `onDark` turns a
   mark white where its own ink is navy and would vanish on the band. */

type Mark = { name: string; src: string; w: number; h: number; onDark?: boolean };

const PARTNERS: Mark[] = [
  { name: "AWS Partner, Advanced Tier Services", src: "/logos/partners/aws-partner-trimmed.png", w: 492, h: 492 },
  { name: "Snowflake", src: "/logos/partners/snowflake.svg", w: 146, h: 139 },
  { name: "Databricks", src: "/logos/partners/databricks.svg", w: 300, h: 331 },
];

const CERTS: Mark[] = [
  { name: "NMSDC certified MBE", src: "/logos/certifications/NMSDC.png", w: 340, h: 340 },
  { name: "State of Ohio certified WBE", src: "/logos/certifications/wbe.png", w: 845, h: 202, onDark: true },
  { name: "State of Ohio certified MBE", src: "/logos/certifications/ohiombe.png", w: 734, h: 202, onDark: true },
  { name: "City of Columbus certified MBE", src: "/logos/certifications/mbe.png", w: 707, h: 353 },
];

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

function MarkGrid({ marks, cols, cellClass, boxClass }: { marks: Mark[]; cols: number; cellClass: string; boxClass: string }) {
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
              <div className="flex items-center justify-center px-4 py-4">
                <div className={cn("relative max-w-full", boxClass)}>
                  <Image
                    src={m.src}
                    alt={m.name}
                    fill
                    sizes="220px"
                    className={cn("object-contain", m.onDark && "brightness-0 invert")}
                  />
                </div>
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
      <p className="measure mt-4 type-body text-white/70">{sub}</p>
      <SectionLink href={link.href} dark className="mt-6">
        {link.label}
      </SectionLink>
    </div>
  );
}

/**
 * Technology partners beside certifications, on a dark chamfered band. The
 * two grids share a height: one row of partners, two rows of badges.
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
              <MarkGrid marks={PARTNERS} cols={3} cellClass="h-36 sm:h-[240px]" boxClass="h-12 w-[80px] sm:h-14 sm:w-[96px]" />
            </div>
          </div>
          <div>
            <ColumnHead
              id="certs-heading"
              kicker="Certifications"
              title="Certified minority and women owned"
              sub="Certified by the NMSDC, the State of Ohio and the City of Columbus, for agencies and enterprises with supplier-diversity programs."
              link={{ href: "/about", label: "About Oceanblue" }}
            />
            <div className="reveal mt-4 sm:mt-6">
              <MarkGrid marks={CERTS} cols={2} cellClass="h-32 sm:h-[120px]" boxClass="h-12 w-[132px] sm:h-14 sm:w-[150px]" />
            </div>
          </div>
        </div>
      </section>
    </ChamferGround>
  );
}
