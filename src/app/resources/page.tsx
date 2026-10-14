import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import Link from "next/link";
import PageHero from "@/components/site/PageHero";
import Closing from "@/components/site/Closing";
import ResourceList from "@/components/site/ResourceList";
import { byCategory, categories, type Category } from "@/lib/resources";

export const metadata: Metadata = pageMetadata({
  path: "/resources",
  title: "Resources",
  description:
    "Customer stories, case studies, blog articles and news from Oceanblue Solutions, Inc., the IT staffing, enterprise solutions and managed services partner.",
});

const order: Category[] = ["customer-stories", "case-studies", "blog", "news"];

export const revalidate = 60;

export default async function ResourcesPage() {
  const lists = await Promise.all(order.map((c) => byCategory(c)));
  return (
    <>
      <PageHero
        cells={[{ photo: "lattice" }, { tone: "bg-tide-200" }, { photo: "concrete" }, { tone: "bg-ocean-600" }]}
        lines={["Resources"]}
        standfirst="Customer stories, case studies, practical articles from our teams, and company news."
        side={
          <ul className="grid gap-1">
            {order.map((c) => (
              <li key={c}>
                <Link href={`/resources/${c}`} className="text-navy-900 underline decoration-navy-900/30 underline-offset-4 hover:decoration-navy-900">
                  {categories[c].name}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/resources/media-kit" className="text-navy-900 underline decoration-navy-900/30 underline-offset-4 hover:decoration-navy-900">
                Media kit
              </Link>
            </li>
          </ul>
        }
      />

      {order.map((c, idx) => (
        <section key={c} className={idx % 2 ? "bg-field-mist" : "bg-field-paper"}>
          <div className={`gutter grid gap-10 lg:grid-cols-12 ${idx === 0 ? "pb-20 md:pb-24" : "py-20 md:py-24"}`}>
            <div className="side" data-reveal>
              <h2 className="display text-head">{categories[c].name}</h2>
              <p className="mt-3 max-w-measure-narrow text-mist-600">{categories[c].intro}</p>
              <Link href={`/resources/${c}`} className="mt-5 inline-block font-medium text-ocean-700 underline underline-offset-4">
                All {categories[c].name.toLowerCase()}
              </Link>
            </div>
            <div className="axis">
              <ResourceList items={lists[idx].slice(0, 3)} showCategory={false} />
            </div>
          </div>
        </section>
      ))}

      <section aria-labelledby="media-kit-title" className="on-dark bg-navy-900 text-mist-50">
        <div className="gutter grid items-center gap-8 py-16 md:py-20 lg:grid-cols-12">
          <div className="lg:col-span-7" data-reveal>
            <h2 id="media-kit-title" className="display text-head">
              Media kit
            </h2>
            <p className="mt-3 max-w-measure-narrow text-tide-300">
              Logos, approved company descriptions, a fact sheet and brand colours for press, partners and procurement teams.
            </p>
          </div>
          <div className="lg:col-span-4 lg:col-start-9 lg:justify-self-end" data-reveal>
            <Link
              href="/resources/media-kit"
              className="inline-flex min-h-12 items-center bg-cyan-500 px-6 font-medium text-navy-950 btn-fill btn-fill-cyan active:scale-[0.98]"
            >
              Open the media kit
            </Link>
          </div>
        </div>
      </section>

      <Closing />
    </>
  );
}
