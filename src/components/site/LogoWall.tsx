/* eslint-disable @next/next/no-img-element */

type Mark = { name: string; src?: string; h: string; dark?: boolean; tint?: boolean };

/** The real logos supplied in /public/logos, grouped by kind */
export const clientMarks: Mark[] = [
  { name: "Ohio Department of Development", src: "/logos/clients/ohio-development.png", h: "h-11" },
  { name: "Diebold Nixdorf", src: "/logos/clients/diebold-nixdorf.svg", h: "h-14" },
  { name: "PivotPoint", src: "/logos/clients/pivotpoint.png", h: "h-8", dark: true },
  { name: "City Barbeque", src: "/logos/clients/citybarbeque.svg", h: "h-8" },
  { name: "Satya Wholesalers", src: "/logos/clients/satya-wholesalers.png", h: "h-11" },
  { name: "Condado Tacos & Tequila", src: "/logos/clients/tacos.webp", h: "h-9", dark: true },
];

export const certMarks: Mark[] = [
  { name: "NMSDC certified Minority Business Enterprise", src: "/logos/certifications/NMSDC.png", h: "h-24" },
  { name: "State of Ohio certified Minority Business Enterprise", src: "/logos/certifications/ohiombe.png", h: "h-12" },
  { name: "State of Ohio certified Women-Owned Business Enterprise", src: "/logos/certifications/wbe.png", h: "h-12" },
  { name: "City of Columbus certified Minority Business Enterprise", src: "/logos/certifications/mbe.png", h: "h-20" },
];

export const partnerMarks: Mark[] = [
  { name: "AWS Advanced Tier Services Partner", src: "/logos/partners/aws-partner-trimmed.png", h: "h-24" },
  { name: "Snowflake", src: "/logos/partners/snowflake.svg", h: "h-16" },
  { name: "Databricks", src: "/logos/partners/databricks.svg", h: "h-16" },
];

/** One logo, centred in a tile of fixed height so a row of them lines up */
export function MarkTile({ mark, tall = false }: { mark: Mark; tall?: boolean }) {
  return (
    <li
      title={mark.name}
      className={`flex items-center justify-center px-6 ${tall ? "h-40" : "h-28"} ${mark.dark ? "bg-navy-950" : "bg-mist-0"}`}
    >
      {mark.src ? (
        <img src={mark.src} alt={mark.name} className={`${mark.h} w-auto max-w-[80%] object-contain ${mark.tint ? "brightness-0" : ""}`} loading="lazy" />
      ) : (
        // No logo file supplied yet: the name is set in type until one is added
        <span className="text-center text-title font-medium leading-tight tracking-tight text-navy-900">{mark.name}</span>
      )}
    </li>
  );
}
