import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageHero, { type Cell } from "@/components/site/PageHero";
import Closing from "@/components/site/Closing";
import ResourceList from "@/components/site/ResourceList";
import { byCategory, categories, isCategory, type Category } from "@/lib/resources";
import { sectionMetadata } from "@/lib/articles-public";
import { breadcrumbJsonLd, jsonLdString } from "@/lib/seo";

type Props = { params: Promise<{ category: string }> };

const mastheads: Record<Category, Cell[]> = {
  "customer-stories": [{ photo: "bridge" }, { tone: "bg-ocean-600" }, { photo: "facade" }, { tone: "bg-tide-200" }],
  "case-studies": [{ photo: "tower", position: "50% 70%" }, { tone: "bg-navy-900" }, { photo: "lattice" }, { tone: "bg-ocean-600" }],
  blog: [{ photo: "concrete" }, { tone: "bg-tide-200" }, { photo: "bridge" }, { tone: "bg-navy-900" }],
  news: [{ photo: "facade" }, { tone: "bg-navy-900" }, { photo: "tower", position: "50% 70%" }, { tone: "bg-tide-200" }],
};

export function generateStaticParams() {
  return Object.keys(categories).map((category) => ({ category }));
}

export const revalidate = 60;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = (await params).category;
  if (!isCategory(c)) return {};
  const live = await byCategory(c);
  // An empty section stays out of search until its first piece is published.
  return sectionMetadata(categories[c].kind, { title: categories[c].name, description: categories[c].intro }, live.length);
}

export default async function CategoryPage({ params }: Props) {
  const c = (await params).category;
  if (!isCategory(c)) notFound();
  const cat = categories[c];
  const items = await byCategory(c);
  const words = cat.name.split(" ");
  const lines: [string] | [string, string] = words.length > 1 ? [words[0], words.slice(1).join(" ")] : [cat.name];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdString(
            breadcrumbJsonLd([
              { name: "Resources", path: "/resources" },
              { name: cat.name, path: `/resources/${c}` },
            ]),
          ),
        }}
      />
      <PageHero
        cells={mastheads[c]}
        lines={lines}
        standfirst={cat.intro}
        side={
          <Link href="/resources" className="text-navy-900 underline underline-offset-4">
            All resources
          </Link>
        }
      />
      <section className="bg-field-paper">
        <div className="gutter grid pb-24 md:pb-32 lg:grid-cols-12">
          <div className="axis">
            <ResourceList items={items} showCategory={false} />
          </div>
        </div>
      </section>
      <Closing />
    </>
  );
}
