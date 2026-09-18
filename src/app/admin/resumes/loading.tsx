import { AdminListSkeleton } from "@/components/admin/skeletons";

// Title, five-figure stat strip, toolbar, table: the resume bank's list shape.
export default function Loading() {
  return <AdminListSkeleton stats={5} rows={8} />;
}
