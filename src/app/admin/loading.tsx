import { DashboardSkeleton } from "@/components/admin/skeletons";

// Same skeleton the dashboard renders while its data loads, so the route
// fallback and the in-page loading state are one shape.
export default function AdminLoading() {
  return <DashboardSkeleton />;
}
