"use client";

import { use } from "react";
import { ArticleEditor } from "@/components/admin/articles/article-editor";

export default function AdminCustomerStoryEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <ArticleEditor kind="customer-story" id={id} />;
}
