import { DetailSkeleton } from "@/components/portal/kit/skeletons";

// Same skeleton the record shows while it loads.
export default function Loading() {
  return <DetailSkeleton label="Loading candidate" />;
}
