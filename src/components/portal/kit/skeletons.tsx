/*
 * Loading placeholders. Server-safe (no hooks), so loading.tsx files import
 * them straight from here. Each composed skeleton mirrors the real layout's
 * geometry (same paddings, rings, gaps) so nothing jumps when data lands.
 */

/** One placeholder block; size it with className. Shimmer stops under reduced motion. */
export function Skeleton({ className = "" }: { className?: string }) {
  return <span aria-hidden className={`kit-skel block ${className}`} />;
}

/** Announces the wait once; the blocks inside carry no text of their own. */
function Busy({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div role="status" aria-busy="true" aria-label={label} className={`mx-auto grid w-full min-w-0 content-start gap-6 ${className}`}>
      {children}
      <span className="sr-only">{label}</span>
    </div>
  );
}

const card = "rounded-xl bg-mist-0 ring-1 ring-mist-200";

/** PageHeader: icon chip, title, description; action buttons right from md. */
export function HeaderSkeleton({ actions = 1, back = false, icon = true }: { actions?: number; back?: boolean; icon?: boolean }) {
  return (
    <div className="grid gap-4">
      {back && <Skeleton className="h-4 w-28" />}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3.5">
          {icon && <Skeleton className="size-10 shrink-0 rounded-lg" />}
          <div className="grid gap-2">
            <Skeleton className="h-6 w-44" />
            <Skeleton className="h-3.5 w-64 max-w-[60vw]" />
          </div>
        </div>
        {actions > 0 && (
          <div className="flex gap-2">
            {Array.from({ length: actions }, (_, i) => (
              <Skeleton key={i} className={`h-10 rounded-lg ${i === actions - 1 ? "w-32" : "w-24"}`} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** StatCard: label and icon chip, value, change line. */
export function StatCardSkeleton() {
  return (
    <div className={`${card} p-5`}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="size-9 rounded-lg" />
      </div>
      <Skeleton className="mt-3 h-[30px] w-20" />
      <Skeleton className="mt-3 h-[22px] w-28" />
    </div>
  );
}

/** KpiRow of `count` StatCards, same columns as KpiRow. */
export function KpiRowSkeleton({ count = 4 }: { count?: number }) {
  const cols = count >= 4 ? "sm:grid-cols-2 xl:grid-cols-4" : count === 3 ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2";
  return (
    <div className={`grid grid-cols-1 gap-4 ${cols}`}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={count === 3 && i === 2 ? "sm:max-lg:col-span-2" : ""}>
          <StatCardSkeleton />
        </div>
      ))}
    </div>
  );
}

/** Panel with a header row and a chart-height body. */
export function PanelSkeleton({ height = "h-64", className = "" }: { height?: string; className?: string }) {
  return (
    <div className={`${card} ${className}`}>
      <div className="flex min-h-14 items-center justify-between border-b border-mist-200 px-5">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>
      <div className="p-5">
        <Skeleton className={`${height} w-full rounded-lg`} />
      </div>
    </div>
  );
}

/** InsightsRow: primary chart 2/3, support 1/3 from lg. */
export function InsightsSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <PanelSkeleton className="lg:col-span-2" />
      <PanelSkeleton />
    </div>
  );
}

/** DataTable: toolbar, header row, `rows` rows, pagination footer. */
export function TableSkeleton({ rows = 8, columns = 5 }: { rows?: number; columns?: number }) {
  const widths = ["w-40", "w-24", "w-28", "w-20", "w-16", "w-24"];
  return (
    <div className={`${card} overflow-hidden`}>
      <div className="flex flex-col gap-3 border-b border-mist-200 p-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-10 w-full rounded-lg sm:w-60" />
          <Skeleton className="h-10 w-40 rounded-lg" />
          <Skeleton className="hidden h-10 w-40 rounded-lg sm:block" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24 rounded-lg" />
          <Skeleton className="h-10 w-20 rounded-lg" />
        </div>
      </div>
      <div className="hidden items-center gap-8 border-b border-mist-200 bg-mist-50 px-4 py-3.5 md:flex">
        {Array.from({ length: columns }, (_, i) => (
          <Skeleton key={i} className="h-3 w-16" />
        ))}
      </div>
      <ul className="divide-y divide-mist-100">
        {Array.from({ length: rows }, (_, r) => (
          <li key={r} className="flex items-center gap-8 px-4 py-4">
            <span className="flex min-w-0 flex-1 items-center gap-3 md:max-w-[16rem]">
              <Skeleton className="size-9 shrink-0 rounded-full" />
              <span className="grid flex-1 gap-1.5">
                <Skeleton className={`h-3.5 ${widths[r % 3]}`} />
                <Skeleton className="h-3 w-20" />
              </span>
            </span>
            {Array.from({ length: columns - 1 }, (_, c) => (
              <Skeleton key={c} className={`hidden h-3.5 ${c > 1 ? "lg:block" : "md:block"} ${widths[(r + c + 1) % widths.length]}`} />
            ))}
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between border-t border-mist-200 px-4 py-3.5">
        <Skeleton className="h-3.5 w-24" />
        <Skeleton className="h-8 w-28 rounded-md" />
      </div>
    </div>
  );
}

/**
 * List section: header, KPI row, insights, table. Turn parts off to match
 * the page (e.g. `header={false}` when the real PageHeader is already drawn).
 */
export function ListPageSkeleton({
  label = "Loading",
  header = true,
  actions = 1,
  kpis = 4,
  insights = true,
  rows = 8,
}: {
  label?: string;
  header?: boolean;
  actions?: number;
  /** 0 hides the KPI row */
  kpis?: number;
  insights?: boolean;
  rows?: number;
}) {
  return (
    <Busy label={label} className="max-w-[1600px]">
      {header && <HeaderSkeleton actions={actions} />}
      {kpis > 0 && <KpiRowSkeleton count={kpis} />}
      {insights && <InsightsSkeleton />}
      <TableSkeleton rows={rows} />
    </Busy>
  );
}

/** Dashboard: header, KPIs, insights, then two working panels. */
export function DashboardSkeleton({ label = "Loading the dashboard", header = true }: { label?: string; header?: boolean }) {
  return (
    <Busy label={label} className="max-w-[1600px]">
      {header && <HeaderSkeleton actions={2} />}
      <KpiRowSkeleton count={4} />
      <InsightsSkeleton />
      <div className="grid gap-6 lg:grid-cols-2">
        <PanelSkeleton height="h-48" />
        <PanelSkeleton height="h-48" />
      </div>
    </Busy>
  );
}

function LinesCard({ lines = 5 }: { lines?: number }) {
  const w = ["w-full", "w-11/12", "w-10/12", "w-full", "w-9/12"];
  return (
    <div className={`${card} grid gap-3 p-5`}>
      <Skeleton className="h-4 w-40" />
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} className={`h-3.5 ${w[i % w.length]}`} />
      ))}
    </div>
  );
}

/** Single record: back link and header, then content with a 320px aside from lg. */
export function DetailSkeleton({ label = "Loading record" }: { label?: string }) {
  return (
    <Busy label={label} className="max-w-[1600px]">
      <HeaderSkeleton back actions={2} />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid content-start gap-6">
          <LinesCard />
          <LinesCard lines={4} />
        </div>
        <div className="grid content-start gap-6">
          <div className={`${card} flex flex-col items-center gap-3 p-5`}>
            <Skeleton className="size-16 rounded-full" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
          <LinesCard lines={4} />
        </div>
      </div>
    </Busy>
  );
}

/**
 * Form or editor: narrow column, two field sections, action bar.
 * `aside` adds a settings column from lg (writing canvas + side panel editors).
 */
export function FormSkeleton({ label = "Loading form", sections = 2, aside = false }: { label?: string; sections?: number; aside?: boolean }) {
  if (aside) {
    return (
      <Busy label={label} className="max-w-[1360px]">
        <HeaderSkeleton back actions={1} />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="grid content-start gap-6">
            <div className={`${card} grid gap-5 p-5`}>
              <Skeleton className="h-12 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-20 w-full rounded-lg" />
            </div>
            <PanelSkeleton height="h-96" />
          </div>
          <div className="grid content-start gap-6">
            <LinesCard lines={4} />
            <LinesCard lines={5} />
          </div>
        </div>
        <Skeleton className="h-16 w-full rounded-xl" />
      </Busy>
    );
  }
  return (
    <Busy label={label} className="max-w-5xl">
      <HeaderSkeleton back actions={0} icon={false} />
      {Array.from({ length: sections }, (_, s) => (
        <div key={s} className={`${card} grid gap-5 p-5 sm:p-6`}>
          <Skeleton className="h-4 w-40" />
          <div className="grid gap-5 sm:grid-cols-2">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="grid gap-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      ))}
      <div className="flex justify-end gap-2">
        <Skeleton className="h-10 w-24 rounded-lg" />
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>
    </Busy>
  );
}
