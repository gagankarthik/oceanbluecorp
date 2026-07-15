import type { Metadata } from "next";
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

  const url = `https://oceanbluecorp.com/solutions/${slug}`;
  return {
    title: data.meta.title,
    description: data.meta.description,
    keywords: data.meta.keywords,
    openGraph: {
      title: `${data.meta.title} | Ocean Blue Corporation`,
      description: data.meta.description,
      url,
    },
    alternates: { canonical: url },
  };
}

export default async function SolutionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = SOLUTIONS[slug];
  if (!data) notFound();

  return <ServiceDetail slug={slug} />;
}
