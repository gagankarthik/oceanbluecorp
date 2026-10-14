import { DetailSkeleton } from "@/components/portal/kit/skeletons";

// Same shape the record draws while it loads: header, main column, 320px rail.
export default function JobDetailLoading() {
  return <DetailSkeleton label="Loading job" />;
}
