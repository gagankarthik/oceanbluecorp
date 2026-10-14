"use client";

import { use } from "react";
import { ArticleEditor } from "@/components/portal/console/articles/article-editor";

export default function AdminNewsEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <ArticleEditor kind="news" id={id} />;
}
