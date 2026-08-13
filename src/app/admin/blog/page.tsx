"use client";

import { ArticleList } from "@/components/admin/articles/article-list";

// The four content sections share one list component; the page only names the
// section it is (see components/admin/articles/article-list.tsx).
export default function AdminBlogPage() {
  return <ArticleList kind="blog" />;
}
