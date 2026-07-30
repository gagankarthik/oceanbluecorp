import { AdminListSkeleton } from "@/components/admin/skeletons";

/** Mirrors the jobs workspace: title → stat strip → canvas toolbar → table. */
export default function JobsLoading() {
  return <AdminListSkeleton stats={4} rows={10} />;
}
