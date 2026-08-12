import Image from "next/image";

/* ============================================================
   Accreditation strip — the last thing before the footer.

   The reference site puts its trust marks at the very bottom of
   the page, below the argument and above the sitemap. That is the
   right position for them: nobody arrives wanting to read a
   certification list, but plenty of people want to confirm one
   exists before they leave. Parked here it costs the page nothing
   and is exactly where a procurement reader will look for it.

   Full colour, on paper. These are accreditations and an MBE or
   WBE mark is recognised by its own colours — the desaturated
   treatment used inside the dark proof band was right there
   because they were a list; here they are the credential.

   Heights are per badge: the intrinsic ratios run 1:1 to 4.18:1,
   so one uniform box lets the square hexagon fill its height while
   the long horizontal lockups shrink to a third of it.
   ============================================================ */

const CERTS = [
  { name: "NMSDC", logo: "/logos/certifications/NMSDC.png", w: 340, h: 340, cls: "h-14 sm:h-16" },
  { name: "Ohio WBE", logo: "/logos/certifications/wbe.png", w: 845, h: 202, cls: "h-10 sm:h-11" },
  { name: "Ohio MBE", logo: "/logos/certifications/ohiombe.png", w: 734, h: 202, cls: "h-10 sm:h-11" },
  { name: "MBE", logo: "/logos/certifications/mbe.png", w: 707, h: 353, cls: "h-11 sm:h-12" },
];

export default function CertificationStrip() {
  return (
    <section className="w-full border-t border-[var(--hz-paper-line)] bg-[var(--hz-paper)] py-12 sm:py-14">
      <div className="mx-auto w-full max-w-[2200px] px-6 sm:px-10 lg:px-16 2xl:px-28">
        <div className="flex flex-col items-center gap-8 lg:flex-row lg:justify-between lg:gap-12">
          <p className="max-w-[26ch] text-center text-[13px] font-semibold uppercase tracking-[0.14em] text-[var(--hz-text-subtle)] lg:text-left">
            A certified minority and women owned business
          </p>
          <ul className="grid grid-cols-2 items-center gap-x-12 gap-y-8 sm:grid-cols-4 sm:gap-x-14">
            {CERTS.map((c) => (
              <li key={c.name} className="flex items-center justify-center">
                <Image
                  src={c.logo}
                  alt={`${c.name} certification`}
                  width={c.w}
                  height={c.h}
                  className={`${c.cls} w-auto object-contain`}
                />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
