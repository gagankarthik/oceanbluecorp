import { AdminFormSkeleton } from "@/components/admin/skeletons";

// Overrides the list skeleton; ArticleEditor shows this same one while it loads.
export default function Loading() {
  return <AdminFormSkeleton />;
}
