import type { Article, ArticleKind } from "@/lib/aws/dynamodb";
import { getLiveArticles } from "@/lib/articles-public";
import { richTextToPlain } from "@/lib/rich-text";

export type Category = "customer-stories" | "case-studies" | "blog" | "news";

export const categories: Record<Category, { name: string; singular: string; intro: string; kind: ArticleKind }> = {
  "customer-stories": {
    name: "Customer stories",
    singular: "Customer story",
    intro: "What the people we work with say about working with us.",
    kind: "customer-story",
  },
  "case-studies": {
    name: "Case studies",
    singular: "Case study",
    intro: "How an engagement ran, from the first conversation to steady state.",
    kind: "case-study",
  },
  blog: {
    name: "Blog",
    singular: "Article",
    intro: "Practical notes from our engineers, recruiters and delivery leads.",
    kind: "blog",
  },
  news: {
    name: "News",
    singular: "News",
    intro: "Company announcements and milestones.",
    kind: "news",
  },
};

/** A published article as the resource pages list it; the full record rides along for the detail page. */
export type Resource = {
  slug: string;
  category: Category;
  title: string;
  summary: string;
  date: string;
  article: Article;
};

export const isCategory = (c: string): c is Category => c in categories;

const formatDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "";

function toResource(category: Category, a: Article): Resource {
  return {
    slug: a.slug,
    category,
    title: a.title,
    summary: a.excerpt?.trim() || a.subtitle?.trim() || richTextToPlain(a.body).slice(0, 200),
    date: formatDate(a.publishedAt),
    article: a,
  };
}

/** Live pieces in one section, featured first then newest. Empty when the table is unreachable. */
export async function byCategory(c: Category): Promise<Resource[]> {
  try {
    return (await getLiveArticles(categories[c].kind)).map((a) => toResource(c, a));
  } catch {
    return [];
  }
}

export async function getResource(c: string, slug: string): Promise<Resource | null> {
  if (!isCategory(c)) return null;
  return (await byCategory(c)).find((r) => r.slug === slug) ?? null;
}
