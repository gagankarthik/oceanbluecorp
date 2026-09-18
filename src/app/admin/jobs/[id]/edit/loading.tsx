import { AdminFormSkeleton } from "@/components/admin/skeletons";

// Overrides the parent's list/record skeleton, which is the wrong shape for a form.
export default function Loading() {
  return <AdminFormSkeleton />;
}
