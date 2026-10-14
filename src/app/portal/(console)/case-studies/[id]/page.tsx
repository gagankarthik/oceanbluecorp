"use client";

import { use } from "react";
import { ArticleEditor } from "@/components/portal/console/articles/article-editor";

export default function AdminCaseStudyEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <ArticleEditor kind="case-study" id={id} />;
}
