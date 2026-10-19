import { CrmListSkeleton } from "@/components/portal/kit/skeletons";

export default function Loading() {
  return <CrmListSkeleton page label="Loading API keys" tabs={3} filters={1} />;
}
