import { AdminListSkeleton } from "@/components/admin/skeletons";

// Same skeleton ArticleList shows while it loads.
export default function Loading() {
  return <AdminListSkeleton stats={4} rows={8} />;
}
