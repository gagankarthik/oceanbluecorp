"use client";

import { use } from "react";
import { ArticleEditor } from "@/components/admin/articles/article-editor";

export default function AdminCaseStudyEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <ArticleEditor kind="case-study" id={id} />;
}
