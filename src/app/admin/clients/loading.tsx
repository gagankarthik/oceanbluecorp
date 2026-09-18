import { AdminListSkeleton } from "@/components/admin/skeletons";

// Same skeleton the page shows while its list loads.
export default function Loading() {
  return <AdminListSkeleton stats={4} rows={8} />;
}
