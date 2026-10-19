import { CrmListSkeleton } from "@/components/portal/kit/skeletons";

export default function Loading() {
  return <CrmListSkeleton page label="Loading customer stories" tabs={3} filters={2} />;
}
