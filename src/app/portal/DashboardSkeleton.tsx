// Server-safe placeholders shaped like the dashboard: the "do" panels first, then KPIs, then charts.
import { HeaderSkeleton, InsightsSkeleton, KpiRowSkeleton, PanelSkeleton, Skeleton } from "@/components/portal/kit/skeletons";

export function DashboardBodySkeleton({ label = "Loading the dashboard" }: { label?: string }) {
  return (
    <div role="status" aria-busy="true" aria-label={label} className="grid min-w-0 gap-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <PanelSkeleton height="h-48" />
        <PanelSkeleton height="h-48" />
      </div>
      <KpiRowSkeleton count={4} />
      <InsightsSkeleton />
      <span className="sr-only">{label}</span>
    </div>
  );
}

/** Route fallback: header, view and range switches, then the body. */
export function DashboardPageSkeleton() {
  return (
    <div className="mx-auto grid w-full min-w-0 max-w-[1600px] content-start gap-6">
      <div className="grid gap-4">
        <HeaderSkeleton actions={3} />
        <div className="flex flex-wrap justify-between gap-3">
          <Skeleton className="h-11 w-64 max-w-full rounded-lg" />
          <Skeleton className="h-11 w-56 max-w-full rounded-lg" />
        </div>
      </div>
      <DashboardBodySkeleton />
    </div>
  );
}
