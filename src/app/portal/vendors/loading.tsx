import { ListPageSkeleton } from "@/components/portal/kit/skeletons";

export default function Loading() {
  return <ListPageSkeleton label="Loading vendors" actions={2} kpis={3} insights={false} />;
}
