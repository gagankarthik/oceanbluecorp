import { ListPageSkeleton } from "@/components/portal/kit/skeletons";

export default function Loading() {
  return <ListPageSkeleton label="Loading clients" actions={2} kpis={3} insights={false} />;
}
