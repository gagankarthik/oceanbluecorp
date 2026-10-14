import type { Metadata } from "next";
import PageHero from "@/components/site/PageHero";
import ContactForm from "./ContactForm";
import { CONTACT_PATH_PARAM, parseContactPath } from "./paths";
import { company, officeAddresses, telHref } from "@/lib/site-content";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  path: "/contact",
  title: "Contact Us",
  description:
    "Hiring staff or finding work: talk to Oceanblue Solutions, Inc. about IT staffing, enterprise solutions, managed services or your next role. Call +1 (614) 844-6925 or email hr@oceanbluecorp.com.",
});

// ?for=work opens the job-seeker path, read on the server so it renders without a flash.
export default async function ContactPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const initialPath = parseContactPath((await searchParams)[CONTACT_PATH_PARAM]);
  return (
    <>
      <PageHero
        cells={[{ photo: "bridge" }, { tone: "bg-ocean-600" }, { photo: "facade" }, { tone: "bg-navy-900" }]}
        lines={["Contact us"]}
        standfirst={
          <>
            <a href={company.tel} className="text-ocean-700 underline decoration-ocean-700/35 underline-offset-[6px] hover:decoration-ocean-700">
              {company.phone}
            </a>
            . Hiring, or looking for work? Tell us what you need. You will talk to someone who can answer for it.
          </>
        }
        side={
          <address className="not-italic">
            {company.address[0]}
            <br />
            {company.address[1]}
            <br />
            <a href={`mailto:${company.email}`} className="text-navy-900 underline underline-offset-4">
              {company.email}
            </a>
            <br />
            {company.hours}
          </address>
        }
      />

      <section className="bg-field-paper">
        <div className="gutter pb-24 md:pb-32">
          <div className="mx-auto max-w-[52rem] bg-tide-100 p-6 md:p-10" data-reveal>
            <ContactForm initialPath={initialPath} />
          </div>
        </div>
      </section>

      <section id="locations" aria-labelledby="locations-title" className="scroll-mt-24 bg-field-mist">
        <div className="gutter py-24 md:py-32">
          <div className="grid gap-6 lg:grid-cols-12">
            <h2 id="locations-title" className="display text-[clamp(2.25rem,4vw,3.5rem)] lg:col-span-6" data-reveal>
              Four offices, three countries, one team
            </h2>
            <p className="max-w-[46ch] lg:col-span-5 lg:col-start-8 lg:self-end" data-reveal>
              Powell, Hyderabad, Vizianagaram and London. Enough overlap to hand work across the day, and someone awake when your systems
              are not.
            </p>
          </div>
          <ul className="mt-14 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {officeAddresses.map((o, i) => (
              <li key={o.city} className="flex flex-col bg-mist-0 p-6" data-reveal style={{ "--d": i } as React.CSSProperties}>
                <p className="text-[14px] font-semibold text-ocean-700">{o.hq ? "Headquarters" : o.country}</p>
                <h3 className="mt-1 text-[22px] font-semibold text-navy-900">{o.city}</h3>
                {o.hq && <p className="text-mist-600">{o.country}</p>}
                <address className="mt-4 flex-1 not-italic leading-relaxed">
                  {o.address[0]}
                  <br />
                  {o.address[1]}
                  {o.phone && (
                    <>
                      <br />
                      <a href={telHref(o.phone)} className="font-medium text-ocean-700 underline underline-offset-4">
                        {o.phone}
                      </a>
                    </>
                  )}
                </address>
                <div className="mt-6 flex flex-wrap gap-2">
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(o.address.join(", "))}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-10 items-center bg-ocean-600 px-4 text-[15px] font-medium text-white transition-colors hover:bg-ocean-700"
                  >
                    Get directions
                  </a>
                  <a
                    href={`mailto:${company.email}?subject=${encodeURIComponent(`Enquiry for our ${o.city} team`)}`}
                    className="inline-flex min-h-10 items-center bg-mist-100 px-4 text-[15px] font-medium text-navy-900 transition-colors hover:bg-tide-200"
                  >
                    Email this team
                  </a>
                </div>
              </li>
            ))}
          </ul>
          <figure className="mt-2" data-reveal>
            <div className="aspect-[16/7] overflow-hidden bg-mist-200">
              <iframe
                title="Map showing Oceanblue Solutions on Fairway Drive, Powell, Ohio"
                src="https://www.openstreetmap.org/export/embed.html?bbox=-83.1085%2C40.1480%2C-83.0875%2C40.1600&layer=mapnik&marker=40.1540%2C-83.0980"
                className="h-full w-full grayscale-[0.4]"
                loading="lazy"
              />
            </div>
            <figcaption className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[15px]">
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${company.address[0]}, ${company.address[1]}`)}`}
                className="font-medium text-ocean-700 underline underline-offset-4"
                target="_blank"
                rel="noopener noreferrer"
              >
                Get directions
              </a>
              <a
                href="https://www.openstreetmap.org/?mlat=40.1540&mlon=-83.0980#map=16/40.1540/-83.0980"
                className="text-mist-600 underline underline-offset-4"
                target="_blank"
                rel="noopener noreferrer"
              >
                View larger map
              </a>
            </figcaption>
          </figure>
        </div>
      </section>
    </>
  );
}
