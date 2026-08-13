import Image from "next/image";

/* ============================================================
   Trust strip, the divided badge row above the closing CTA.

   Matching the reference exactly: a light band, immediately ABOVE
   the dark call to action, split into equal cells by vertical
   hairlines, each cell carrying one mark and one short label. It is
   the last reassurance a reader passes before the closing ask,
   which is precisely why it sits there and not at the very bottom.

   The mark in each cell is the real accreditation artwork rather
   than a drawn icon, because these are issued credentials, an MBE
   or WBE badge is recognised by its own colours and redrawing it
   would be both wrong and, for a certification mark, not ours to
   redraw.

   Heights are per badge. Intrinsic ratios run 1:1 to 4.18:1, so a
   single uniform box lets the square hexagon fill its height while
   the long horizontal lockups shrink to a third of it. The four
   values keep their proportions to each other, so scaling the row
   up scales all of them and none of them changes relative weight.
   ============================================================ */

const CERTS = [
  { name: "NMSDC", logo: "/logos/certifications/NMSDC.png", w: 340, h: 340, cls: "h-[68px]" },
  { name: "Ohio WBE", logo: "/logos/certifications/wbe.png", w: 845, h: 202, cls: "h-[46px]" },
  { name: "Ohio MBE", logo: "/logos/certifications/ohiombe.png", w: 734, h: 202, cls: "h-[46px]" },
  { name: "City of Columbus MBE", logo: "/logos/certifications/mbe.png", w: 707, h: 353, cls: "h-[56px]" },
];

export default function CertificationStrip() {
  return (
    <section className="w-full bg-[var(--hz-paper)]">
      <div className="mx-auto w-full max-w-[2200px] px-6 sm:px-10 lg:px-16 2xl:px-28">
        {/* Vertical rules only between cells , `divide-x` leaves the outer
            edges open, so the row reads as a strip rather than a boxed table. */}
        <ul className="grid grid-cols-2 divide-y divide-[var(--hz-strip-line)] border-y border-[var(--hz-strip-line)] sm:grid-cols-4 sm:divide-y-0 sm:divide-x">
          {CERTS.map((c) => (
            <li key={c.name} className="flex items-center justify-center px-5 py-9 sm:px-6">
              {/* Badge only. Each of these already carries its issuer's name in
                  its own artwork, so the label beside it was setting the same
                  words twice, and the pair made every cell wide enough that
                  four of them crowded the row. The name moves to `alt`, where
                  it does the job for anyone who cannot see the mark. */}
              <Image
                src={c.logo}
                alt={c.name}
                width={c.w}
                height={c.h}
                className={`${c.cls} w-auto flex-none object-contain`}
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
