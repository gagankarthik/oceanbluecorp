import Image from "next/image";

/* ============================================================
   Trust strip — the divided badge row above the closing CTA.

   Matching the reference exactly: a light band, immediately ABOVE
   the dark call to action, split into equal cells by vertical
   hairlines, each cell carrying one mark and one short label. It is
   the last reassurance a reader passes before the closing ask,
   which is precisely why it sits there and not at the very bottom.

   The mark in each cell is the real accreditation artwork rather
   than a drawn icon, because these are issued credentials — an MBE
   or WBE badge is recognised by its own colours and redrawing it
   would be both wrong and, for a certification mark, not ours to
   redraw.

   Heights are per badge. Intrinsic ratios run 1:1 to 4.18:1, so a
   single uniform box lets the square hexagon fill its height while
   the long horizontal lockups shrink to a third of it.
   ============================================================ */

const CERTS = [
  { name: "NMSDC", label: "NMSDC certified", logo: "/logos/certifications/NMSDC.png", w: 340, h: 340, cls: "h-11" },
  { name: "Ohio WBE", label: "Ohio WBE", logo: "/logos/certifications/wbe.png", w: 845, h: 202, cls: "h-8" },
  { name: "Ohio MBE", label: "Ohio MBE", logo: "/logos/certifications/ohiombe.png", w: 734, h: 202, cls: "h-8" },
  { name: "City of Columbus MBE", label: "City of Columbus MBE", logo: "/logos/certifications/mbe.png", w: 707, h: 353, cls: "h-9" },
];

export default function CertificationStrip() {
  return (
    <section className="w-full bg-[var(--hz-paper)]">
      <div className="mx-auto w-full max-w-[2200px] px-6 sm:px-10 lg:px-16 2xl:px-28">
        {/* Vertical rules only between cells — `divide-x` leaves the outer
            edges open, so the row reads as a strip rather than a boxed table. */}
        <ul className="grid grid-cols-2 divide-y divide-[var(--hz-paper-line)] border-y border-[var(--hz-paper-line)] sm:grid-cols-4 sm:divide-y-0 sm:divide-x">
          {CERTS.map((c) => (
            <li key={c.name} className="flex items-center justify-center gap-4 px-5 py-7 sm:px-6">
              <Image
                src={c.logo}
                alt=""
                aria-hidden
                width={c.w}
                height={c.h}
                className={`${c.cls} w-auto flex-none object-contain`}
              />
              <span className="text-[13.5px] font-medium leading-snug text-[var(--hz-text-mute)]">
                {c.label}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
