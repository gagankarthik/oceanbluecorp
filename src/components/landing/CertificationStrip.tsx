import Image from "next/image";

/**
 * Accreditation badges, in a divided strip above the closing CTA.
 *
 * `cls` is per badge on purpose: intrinsic ratios run from 1:1 to 4.18:1, so
 * a single uniform box would let the square mark fill its height while the
 * wide lockups shrank to a third of it. These four values hold the marks at
 * equal visual weight.
 */

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
        <ul className="grid grid-cols-2 divide-y divide-[var(--hz-strip-line)] border-y border-[var(--hz-strip-line)] sm:grid-cols-4 sm:divide-y-0 sm:divide-x">
          {CERTS.map((c) => (
            <li key={c.name} className="flex items-center justify-center px-5 py-9 sm:px-6">
              {/* Badge only: each mark already carries its issuer's name in
                  its own artwork. The name lives in `alt`. */}
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
