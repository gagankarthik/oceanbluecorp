import Link from "next/link";
import Photo from "@/components/site/Photo";
import { layers, servicesByLayer, type LayerId } from "@/lib/site-content";
import type { PhotoKey } from "@/lib/photos";

const order: LayerId[] = ["people", "platforms", "operations"];

const columns: Record<LayerId, { title: string; lead: string; highlight: string; photo: PhotoKey; cta: string }> = {
  people: {
    title: "Talent and staffing",
    lead: "Skilled IT and engineering professionals who join your team, plus training for the people you already have.",
    highlight: "Matched shortlist within 48 hours",
    photo: "engineerLaptop",
    cta: "Explore talent services",
  },
  platforms: {
    title: "Technology services",
    lead: "Cloud, cybersecurity, ERP, Salesforce, data and AI, delivered in planned steps with security and cost control built in.",
    highlight: "AWS Advanced Tier Services Partner",
    photo: "workstation",
    cta: "Explore technology services",
  },
  operations: {
    title: "Managed services",
    lead: "Monitoring, helpdesk, patching and infrastructure management around the clock, on one service level agreement.",
    highlight: "Support around the clock",
    photo: "console",
    cta: "Explore managed services",
  },
};

/** What we offer, in three columns a customer can scan */
export default function ServicesOverview() {
  return (
    <section aria-labelledby="services-title" className="bg-navy-900 text-mist-50">
      <div className="gutter py-24 md:py-32">
        <div className="grid gap-6 lg:grid-cols-12">
          <h2 id="services-title" className="display text-[clamp(2.25rem,4vw,3.5rem)] lg:col-span-6" data-reveal>
            Our services
          </h2>
          <div className="max-w-[52ch] text-tide-300 lg:col-span-5 lg:col-start-8 lg:self-end" data-reveal style={{ "--d": 1 } as React.CSSProperties}>
            <p>
              Ten services across three areas. Use one, or bring them together under a single contract with one team accountable for the
              result.
            </p>
          </div>
        </div>

        <div className="mt-14 grid gap-2 lg:grid-cols-3">
          {order.map((id, i) => {
            const c = columns[id];
            const layerServices = servicesByLayer(id);
            // A column with a single service lists what that service covers instead
            const list =
              layerServices.length === 1
                ? layerServices[0].includes.map((x) => ({ key: x.title, name: x.title, href: `/services/${layerServices[0].slug}` }))
                : layerServices.map((x) => ({ key: x.slug, name: x.name, href: `/services/${x.slug}` }));
            return (
              <article key={id} id={`practice-${id}`} className="group flex flex-col bg-navy-800" data-reveal style={{ "--d": i } as React.CSSProperties}>
                <Photo name={c.photo} className="aspect-[16/10]" sizes="(min-width: 1024px) 33vw, 100vw" zoom />
                <div className="flex flex-1 flex-col p-6 md:p-8">
                  <p className="text-[15px] font-medium text-cyan-300">{c.highlight}</p>
                  <h3 className="display mt-3 text-[clamp(1.5rem,2vw,1.875rem)]">{c.title}</h3>
                  <p className="mt-3 text-tide-300">{c.lead}</p>

                  <ul className="mt-8 grid flex-1 content-start gap-1">
                    {list.map((s) => (
                      <li key={s.key}>
                        <Link
                          href={s.href}
                          className="group flex items-center justify-between gap-4 bg-navy-900/40 px-4 py-3 transition-colors hover:bg-navy-700"
                        >
                          <span className="font-medium text-white">{s.name}</span>
                          <svg aria-hidden viewBox="0 0 16 16" className="size-4 shrink-0 text-cyan-300 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="1.6">
                            <path d="M3 8h10M9 4l4 4-4 4" />
                          </svg>
                        </Link>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={`/services#${id}`}
                    className="mt-8 inline-flex min-h-12 w-fit items-center bg-cyan-500 px-5 font-medium text-navy-950 btn-fill btn-fill-cyan active:scale-[0.98]"
                  >
                    {c.cta}
                  </Link>
                </div>
              </article>
            );
          })}
        </div>

        <p className="mt-10 text-tide-300" data-reveal>
          {layers.people.name}, {layers.platforms.name.toLowerCase()} and {layers.operations.name.toLowerCase()}: one partner for all three.{" "}
          <Link href="/services" className="font-medium text-white underline underline-offset-4 hover:text-cyan-300">
            View all services
          </Link>
        </p>
      </div>
    </section>
  );
}
