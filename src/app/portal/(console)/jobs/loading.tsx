import { ListPageSkeleton } from "@/components/portal/kit/skeletons";

// /portal/jobs redirects to state roles; this covers the hop.
export default function JobsLoading() {
  return <ListPageSkeleton label="Loading job postings" kpis={4} />;
}
