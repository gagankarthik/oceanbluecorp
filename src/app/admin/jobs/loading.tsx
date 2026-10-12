import { AdminListSkeleton } from "@/components/admin/skeletons";

export default function JobsLoading() {
  return <AdminListSkeleton rows={10} label="Loading job postings" />;
}
