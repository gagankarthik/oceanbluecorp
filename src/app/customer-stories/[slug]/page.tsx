import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ArticleDetail from "@/components/landing/ArticleDetail";
import { safeJsonLd } from "@/lib/json-ld";
import {
  articleJsonLd, articleMetadata, getLiveArticle, getRelatedArticles,
} from "@/lib/articles-public";

interface Props {
  params: Promise<{ slug: string }>;
}

const KIND = "customer-story" as const;

/**
 * Rendered on demand rather than pre-generated: publishing is a handful of
 * writes a week, and generateStaticParams would pin the route to whatever was
 * live at build time. The route handlers call revalidatePath on save, so a new
 * piece is reachable the moment it goes out.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = await getLiveArticle(KIND, slug);
  // An unpublished slug gets no metadata; the page below answers 404.
  if (!article) return { title: "Not found", robots: { index: false, follow: false } };
  return articleMetadata(article);
}

export default async function CustomerStory({ params }: Props) {
  const { slug } = await params;
  const article = await getLiveArticle(KIND, slug);

  // A draft, an unapproved case study, or one scheduled for next week is a 404,
  // not a 403: confirming that an unpublished piece exists at a guessable slug
  // is itself a leak. `getLiveArticle` applies `isLive`, the single definition
  // of published, so this cannot drift from what the admin shows.
  if (!article) notFound();

  const related = await getRelatedArticles(KIND, article.id);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(articleJsonLd(article)) }}
      />
      <ArticleDetail article={article} related={related} />
    </>
  );
}
