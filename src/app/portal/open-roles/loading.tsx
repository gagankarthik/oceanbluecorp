import { ListPageSkeleton } from "@/components/portal/kit/skeletons";

export default function Loading() {
  return <ListPageSkeleton label="Loading open roles" actions={2} kpis={4} insights={false} />;
}
