"use client";

import { use } from "react";
import { JobDetail } from "@/components/portal/records/JobDetail";

export default function JobDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ category?: string }>;
}) {
  const { id } = use(params);
  return <JobDetail jobId={id} hint={use(searchParams)} />;
}
