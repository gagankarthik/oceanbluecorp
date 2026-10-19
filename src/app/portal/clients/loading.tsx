import { CrmListSkeleton } from "@/components/portal/kit/skeletons";

export default function Loading() {
  return <CrmListSkeleton page label="Loading clients" tabs={3} filters={2} />;
}
