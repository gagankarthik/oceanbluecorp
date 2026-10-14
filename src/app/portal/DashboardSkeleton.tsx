// Server-safe placeholders shaped like the dashboard: KPIs, then the trend beside the attention rail, then insights beside recent activity.
import { HeaderSkeleton, KpiRowSkeleton, PanelSkeleton, Skeleton } from "@/components/portal/kit/skeletons";

export function DashboardBodySkeleton({ label = "Loading the dashboard" }: { label?: string }) {
  return (
    <div role="status" aria-busy="true" aria-label={label} className="grid min-w-0 gap-6">
      <KpiRowSkeleton count={4} lines={2} />
      <div className="grid gap-6 xl:grid-cols-3">
        <PanelSkeleton height="h-72" className="xl:col-span-2" />
        <div className="grid content-start gap-6 lg:grid-cols-2 xl:grid-cols-1">
          <PanelSkeleton height="h-56" />
          <PanelSkeleton height="h-40" />
        </div>
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <PanelSkeleton className="xl:col-span-2" />
        <PanelSkeleton />
      </div>
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
