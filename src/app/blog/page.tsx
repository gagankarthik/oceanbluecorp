import type { Metadata } from "next";
import ComingSoon from "@/components/landing/ComingSoon";
import ArticleIndex from "@/components/landing/ArticleIndex";
import { getLiveArticles, sectionMetadata } from "@/lib/articles-public";

const COPY = {
  title: "Blog",
  description:
    "Notes from Ocean Blue Corporation's engineers and recruiters on IT hiring, delivery, and enterprise platforms.",
};

// robots: index:false while the section is empty, lifted automatically by the
// first published post. See sectionMetadata for why that is not a hand-edit.
export async function generateMetadata(): Promise<Metadata> {
  const posts = await getLiveArticles("blog");
  return sectionMetadata("blog", COPY, posts.length);
}

export default async function Blog() {
  const posts = await getLiveArticles("blog");

  if (posts.length === 0) {
    return (
      <ComingSoon
        eyebrow="Blog"
        title="Notes from the people doing the work."
        subtitle="Our engineers and recruiters write about hiring, delivery, and the platforms we run."
        note="The first pieces are being written. If you have a specific question now, ask us directly and you will get an answer from the person who does the work, not a form response."
      />
    );
  }

  return (
    <ArticleIndex
      kind="blog"
      articles={posts}
      title="Blog"
      subtitle="Our engineers and recruiters write about hiring, delivery, and the platforms we run."
    />
  );
}
