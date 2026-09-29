import type { Metadata } from "next";
import { breadcrumbJsonLd, jsonLdString, ORG_ID, pageMetadata, SITE_URL } from "@/lib/seo";
import { notFound } from "next/navigation";
import ServiceDetail from "./ServiceDetail";
import { SOLUTIONS, SOLUTION_SLUGS } from "./content";

export const revalidate = 3600;

export function generateStaticParams() {
  return SOLUTION_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = SOLUTIONS[slug];
  if (!data) return {};

  return pageMetadata({
    path: `/solutions/${slug}`,
    title: data.meta.title,
    description: data.meta.description,
    keywords: data.meta.keywords,
  });
}

export default async function SolutionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = SOLUTIONS[slug];
  if (!data) notFound();

  const url = `${SITE_URL}/solutions/${slug}`;
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      "@id": `${url}#service`,
      name: data.eyebrow,
      serviceType: data.eyebrow,
      description: data.meta.description,
      url,
      provider: { "@id": ORG_ID },
      areaServed: { "@type": "Country", name: "United States" },
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: data.eyebrow,
        itemListElement: data.capabilities.map((c) => ({ "@type": "Offer", itemOffered: { "@type": "Service", name: c } })),
      },
    },
    breadcrumbJsonLd([
      { name: "Solutions", path: "/solutions" },
      { name: data.eyebrow, path: `/solutions/${slug}` },
    ]),
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(jsonLd) }} />
      <ServiceDetail slug={slug} />
    </>
  );
}
