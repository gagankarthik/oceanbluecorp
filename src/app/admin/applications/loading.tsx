import { AdminListSkeleton } from "@/components/admin/skeletons";

/** Mirrors the applications workspace: title → stat strip → canvas toolbar → table. */
export default function ApplicationsLoading() {
  return <AdminListSkeleton stats={4} rows={10} />;
}
