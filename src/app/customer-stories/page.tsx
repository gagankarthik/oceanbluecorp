import type { Metadata } from "next";
import ComingSoon from "@/components/landing/ComingSoon";
import ArticleIndex from "@/components/landing/ArticleIndex";
import { getLiveArticles, sectionMetadata } from "@/lib/articles-public";

const COPY = {
  title: "Customer stories",
  description:
    "Ocean Blue Corporation clients on what changed, how long it took, and what they would tell a peer.",
};

// robots: index:false while the section is empty, lifted automatically by the
// first published entry. See sectionMetadata for why that is not a hand-edit.
export async function generateMetadata(): Promise<Metadata> {
  const entries = await getLiveArticles("customer-story");
  return sectionMetadata("customer-story", COPY, entries.length);
}

export default async function CustomerStories() {
  const entries = await getLiveArticles("customer-story");

  if (entries.length === 0) {
    return (
      <ComingSoon
        eyebrow="Customer stories"
        title="What it is like to work with us."
        subtitle="In our clients' words: what changed, how long it took, and what they would tell a peer."
        note="We publish these only once the client has approved the wording, so there is nothing here yet. If you would rather skip the write-up and speak to a reference directly, we can arrange that."
      />
    );
  }

  return (
    <ArticleIndex
      kind="customer-story"
      articles={entries}
      title="Customer stories"
      subtitle="In our clients' words: what changed, how long it took, and what they would tell a peer."
    />
  );
}
