import type { Metadata } from "next";
import ComingSoon from "@/components/landing/ComingSoon";
import ArticleIndex from "@/components/landing/ArticleIndex";
import { getLiveArticles, sectionMetadata } from "@/lib/articles-public";

const COPY = {
  title: "News",
  description:
    "Company announcements, awards, certifications, and updates from Ocean Blue Corporation.",
};

// robots: index:false while the section is empty, lifted automatically by the
// first published entry. See sectionMetadata for why that is not a hand-edit.
export async function generateMetadata(): Promise<Metadata> {
  const entries = await getLiveArticles("news");
  return sectionMetadata("news", COPY, entries.length);
}

export default async function News() {
  const entries = await getLiveArticles("news");

  if (entries.length === 0) {
    return (
      <ComingSoon
        eyebrow="News"
        title="Announcements, certifications, milestones."
        subtitle="What is changing here: new certifications, new delivery capacity, new work."
        note="Nothing posted yet. For press or partnership enquiries, contact us and we will come straight back to you."
      />
    );
  }

  return (
    <ArticleIndex
      kind="news"
      articles={entries}
      title="Newsroom"
      subtitle="What is changing here: new certifications, new delivery capacity, new work."
    />
  );
}
