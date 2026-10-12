import { AdminListSkeleton } from "@/components/admin/skeletons";

export default function ApplicationsLoading() {
  return <AdminListSkeleton rows={10} label="Loading applications" />;
}
