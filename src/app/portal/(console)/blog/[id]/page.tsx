"use client";

import { use } from "react";
import { ArticleEditor } from "@/components/admin/articles/article-editor";

// `id` is a record id, or the literal "new".
export default function AdminBlogEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <ArticleEditor kind="blog" id={id} />;
}
