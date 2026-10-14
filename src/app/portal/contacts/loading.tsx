import { ListPageSkeleton } from "@/components/portal/kit/skeletons";

export default function Loading() {
  return <ListPageSkeleton label="Loading contacts" actions={1} kpis={0} insights={false} />;
}
