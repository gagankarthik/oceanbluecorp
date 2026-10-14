import { ListPageSkeleton } from "@/components/portal/kit/skeletons";

export default function Loading() {
  return <ListPageSkeleton label="Loading the talent bench" actions={3} kpis={4} insights={false} />;
}
