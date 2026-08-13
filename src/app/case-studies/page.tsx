import type { Metadata } from "next";
import ComingSoon from "@/components/landing/ComingSoon";
import ArticleIndex from "@/components/landing/ArticleIndex";
import { getLiveArticles, sectionMetadata } from "@/lib/articles-public";

const COPY = {
  title: "Case studies",
  description:
    "How Ocean Blue Corporation solved real delivery and hiring problems: the challenge, the approach, and the measured results.",
};

// robots: index:false while the section is empty, lifted automatically by the
// first published entry. See sectionMetadata for why that is not a hand-edit.
export async function generateMetadata(): Promise<Metadata> {
  const entries = await getLiveArticles("case-study");
  return sectionMetadata("case-study", COPY, entries.length);
}

export default async function CaseStudies() {
  const entries = await getLiveArticles("case-study");

  if (entries.length === 0) {
    return (
      <ComingSoon
        eyebrow="Case studies"
        title="The problem, the team, what changed."
        subtitle="Engagements in full: what was broken, who we put on it, and what it measurably changed."
        note="The first write-ups are in review with the clients involved. Until they are cleared, we are happy to walk you through comparable work on a call."
      />
    );
  }

  return (
    <ArticleIndex
      kind="case-study"
      articles={entries}
      title="Case studies"
      subtitle="Engagements in full: what was broken, who we put on it, and what it measurably changed."
    />
  );
}
