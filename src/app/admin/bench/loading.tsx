import { AdminListSkeleton } from "@/components/admin/skeletons";

/** Mirrors the bench workspace: title → pool tabs → stat strip → toolbar → table. */
export default function BenchLoading() {
  return <AdminListSkeleton tabs={3} stats={4} rows={10} />;
}
