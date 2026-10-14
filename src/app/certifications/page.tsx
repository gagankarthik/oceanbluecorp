import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata } from "@/lib/seo";
import PageHero from "@/components/site/PageHero";
import Closing from "@/components/site/Closing";
import { MarkTile, partnerMarks } from "@/components/site/LogoWall";
import { certifications, company, partners } from "@/lib/site-content";

export const metadata: Metadata = pageMetadata({
  path: "/certifications",
  title: "Certifications & Partners",
  description:
    "Oceanblue Solutions, Inc. is an NMSDC certified MBE, a State of Ohio MBE and WBE, a City of Columbus MBE, and an AWS Advanced Tier Services Partner.",
});

const badges: Record<string, { src: string; w: number; h: number; cls: string }> = {
  "NMSDC certified MBE": { src: "/logos/certifications/NMSDC.png", w: 340, h: 340, cls: "h-36 w-auto" },
  "State of Ohio MBE": { src: "/logos/certifications/ohiombe.png", w: 734, h: 202, cls: "h-auto w-full max-w-[17rem]" },
  "State of Ohio WBE": { src: "/logos/certifications/wbe.png", w: 845, h: 202, cls: "h-auto w-full max-w-[17rem]" },
  "City of Columbus MBE": { src: "/logos/certifications/mbe.png", w: 707, h: 353, cls: "h-auto w-full max-w-[14rem]" },
};

export default function CertificationsPage() {
  return (
    <>
      <PageHero
        cells={[{ photo: "tower", position: "50% 70%" }, { tone: "bg-ocean-600" }, { photo: "lattice" }, { tone: "bg-navy-900" }]}
        lines={["Certifications", "and partnerships"]}
        standfirst="Four supplier-diversity certifications, each issued after an independent review of who owns and controls the company. National, state and city programs can all count work placed with us."
        side={<p>Minority-owned and women-owned. Platform partners: AWS, Snowflake and Databricks.</p>}
      />

      {certifications.map((lvl, idx) => (
        <section key={lvl.level} className={idx % 2 ? "bg-field-mist" : "bg-field-paper"}>
          <div className={`gutter grid gap-12 lg:grid-cols-12 ${idx === 0 ? "pb-24 md:pb-32" : "py-24 md:py-32"}`}>
            <div className="side" data-reveal>
              <h2 className="display text-head-xl">{lvl.level}</h2>
              <p className="mt-3 text-mist-600">{lvl.who}</p>
            </div>
            <ul className="axis grid gap-16">
              {lvl.certs.map((c, i) => {
                const b = badges[c.name];
                return (
                  <li key={c.name} className="grid gap-8 sm:grid-cols-[minmax(0,17rem)_1fr] sm:items-center" data-reveal style={{ "--d": i } as React.CSSProperties}>
                    <div className="flex min-h-40 items-center bg-mist-0 p-5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={b.src} alt={`${c.name} certification badge`} width={b.w} height={b.h} className={b.cls} />
                    </div>
                    <div>
                      <h3 className="display text-head-md">{c.name}</h3>
                      <p className="mt-2 text-small text-mist-600">Issued by {c.issuer}</p>
                      <p className="mt-4 max-w-measure-narrow">{c.body}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      ))}

      <section aria-labelledby="partners-title" className="on-dark bg-navy-900 text-mist-50">
        <div className="gutter grid gap-12 py-24 md:py-32 lg:grid-cols-12">
          <div className="side" data-reveal>
            <h2 id="partners-title" className="display text-head">
              Platform partners
            </h2>
            <p className="mt-4 max-w-measure-narrow text-tide-300">
              Most of our cloud, data and AI work runs on these three platforms, so you get people who already know the stack.
            </p>
          </div>
          <ul className="axis grid gap-10">
            {partners.map((p, i) => (
              <li key={p.name} className="grid gap-6 sm:grid-cols-[minmax(0,17rem)_1fr] sm:items-center" data-reveal style={{ "--d": i } as React.CSSProperties}>
                <ul className="text-navy-900">
                  <MarkTile mark={partnerMarks[i]} tall />
                </ul>
                <div>
                  <p className="text-title font-medium">{p.tier}</p>
                  <p className="mt-2 max-w-measure-narrow text-tide-300">{p.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="security-title" className="bg-field-paper">
        <div className="gutter grid gap-10 py-20 md:py-24 lg:grid-cols-12">
          <div className="side" data-reveal>
            <h2 id="security-title" className="display text-head">
              Security and data protection
            </h2>
          </div>
          <div className="axis" data-reveal>
            <ul className="grid gap-3 sm:grid-cols-3">
              {["Encrypted in transit and at rest", "Five staff roles, least privilege", "Access ends with the engagement"].map((t) => (
                <li key={t} className="bg-mist-100 p-5 font-medium">
                  {t}
                </li>
              ))}
            </ul>
            <Link href="/security" className="mt-6 inline-block font-medium text-ocean-700 underline underline-offset-4">
              How we protect client and candidate data
            </Link>
          </div>
        </div>
      </section>

      <Closing
        lines={["Need certificate", "copies for a bid?"]}
        sentence={`We will send current copies of each certificate, ready for your procurement or supplier-diversity team. Write to ${company.email}.`}
        action="Request copies"
      />
    </>
  );
}
