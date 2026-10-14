import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/site/PageHero";
import Closing from "@/components/site/Closing";
import { layers, models, servicesByLayer, type LayerId } from "@/lib/site-content";
import { breadcrumbJsonLd, jsonLdString, pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  path: "/services",
  title: "IT Services & Solutions",
  description:
    "Enterprise IT from one partner: IT staffing, engineering talent, cloud, cybersecurity, ERP, Salesforce, AI and data, managed services and training.",
});

const order: LayerId[] = ["people", "platforms", "operations"];

const look: Record<LayerId, { field: string; soft: string; hover: string }> = {
  people: { field: "bg-field-paper text-navy-900", soft: "text-mist-600", hover: "group-hover:text-ocean-700" },
  platforms: { field: "bg-ocean-600 text-white", soft: "text-white", hover: "group-hover:text-cyan-100" },
  operations: { field: "bg-navy-900 text-mist-50", soft: "text-tide-300", hover: "group-hover:text-cyan-300" },
};

export default function ServicesPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(breadcrumbJsonLd([{ name: "Services", path: "/services" }])) }} />
      <PageHero
        cells={[{ photo: "lattice" }, { tone: "bg-ocean-600" }, { photo: "facade", position: "50% 30%" }, { tone: "bg-navy-900" }, { photo: "bridge" }]}
        lines={["Our services"]}
        standfirst="The people who do the work, the platforms it runs on and the operations that keep it running. Use one practice or all of them, under one contract."
        side={
          <p>
            Three layers: people, platforms and operations, each sitting on the one above it. For enterprises and state government agencies
            across North America.
          </p>
        }
      />

      {order.map((id) => {
        const l = look[id];
        return (
          <section key={id} id={id} className={l.field}>
            <div className="gutter grid gap-12 py-24 md:py-32 lg:grid-cols-12">
              <div className="side" data-reveal>
                <h2 className="display text-[clamp(2.5rem,5vw,5rem)]">{layers[id].name}</h2>
                <p className={`mt-4 max-w-[30ch] ${l.soft}`}>{layers[id].summary}</p>
              </div>
              <ul className="axis grid gap-12">
                {servicesByLayer(id).map((s, i) => (
                  <li key={s.slug} data-reveal style={{ "--d": i % 3 } as React.CSSProperties}>
                    <Link href={`/services/${s.slug}`} className="group block">
                      <span className={`display block text-[clamp(1.75rem,3vw,3rem)] transition-colors ${l.hover}`}>{s.name}</span>
                      <span className={`mt-3 block max-w-[46ch] ${l.soft}`}>{s.tagline}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        );
      })}

      <section className="bg-field-paper">
        <div className="gutter grid gap-12 py-24 md:py-32 lg:grid-cols-12">
          <div className="side" data-reveal>
            <h2 className="display text-[clamp(2.25rem,4vw,3.75rem)]">Engagement models</h2>
            <p className="mt-4 max-w-[30ch] text-mist-600">
              Every engagement runs on the same four steps, whichever practice leads it.{" "}
              <Link href="/how-we-work" className="text-navy-900 underline underline-offset-4 hover:text-ocean-700">
                See how we work
              </Link>
              .
            </p>
          </div>
          <dl className="axis grid gap-x-12 gap-y-12 sm:grid-cols-2">
            {models.map((m, i) => (
              <div key={m.name} data-reveal style={{ "--d": i % 2 } as React.CSSProperties}>
                <dt className="text-[20px] font-medium">{m.name}</dt>
                <dd className="mt-2 max-w-[34ch]">{m.body}</dd>
                <dd className="mt-2 text-[15px] text-mist-600">Who owns the outcome: {m.owns}.</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <Closing />
    </>
  );
}
