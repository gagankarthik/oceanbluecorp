import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { AlertTriangle, RefreshCw, Database } from "lucide-react";
import type { AsyncState } from "@/types/async-state";
import { EmptyState } from "./empty-state";
import { cn } from "@/lib/utils";

interface DataStateProps<T> {
  state: AsyncState<T>;
  /** Skeleton shown during loading. */
  skeleton: React.ReactNode;
  /** Render callback when data is available. */
  children: (data: T) => React.ReactNode;
  /** Override the default empty-state. */
  emptyState?: React.ReactNode;
  /** Override the default error state. */
  errorState?: (error: Error, retry?: () => void) => React.ReactNode;
  /** Icon for the default empty state. */
  emptyIcon?: LucideIcon;
  /** Title for the default empty state. */
  emptyTitle?: string;
  /** Description for the default empty state. */
  emptyDescription?: string;
  /** CTA action for the default empty state. */
  emptyAction?: React.ReactNode;
  className?: string;
}

/**
 * Composition wrapper that maps an AsyncState<T> to the right UI.
 * Eliminates the repeated if-loading / if-error / if-empty chains in every page.
 *
 * @example
 * <DataState
 *   state={jobsState}
 *   skeleton={<AdminListSkeleton rows={8} />}
 *   emptyIcon={Briefcase}
 *   emptyTitle="No jobs yet"
 *   emptyDescription="Create your first job posting to get started."
 * >
 *   {(jobs) => <JobTable jobs={jobs} />}
 * </DataState>
 */
export function DataState<T>({
  state,
  skeleton,
  children,
  emptyState,
  errorState,
  emptyIcon = Database,
  emptyTitle = "No data",
  emptyDescription,
  emptyAction,
  className,
}: DataStateProps<T>) {
  if (state.status === "loading" || state.status === "idle") {
    return <>{skeleton}</>;
  }

  if (state.status === "error") {
    if (errorState) return <>{errorState(state.error, state.onRetry)}</>;
    return (
      <DefaultErrorState
        error={state.error}
        onRetry={state.onRetry}
        className={className}
      />
    );
  }

  if (state.status === "empty") {
    if (emptyState) return <>{emptyState}</>;
    return (
      <EmptyState
        icon={emptyIcon}
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
        className={className}
      />
    );
  }

  return <>{children(state.data)}</>;
}

function DefaultErrorState({
  error,
  onRetry,
  className,
}: {
  error: Error;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center gap-3 px-6 py-12 text-center",
        className,
      )}
    >
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-rose-50">
        <AlertTriangle className="h-6 w-6 text-rose-500" strokeWidth={1.5} />
      </span>
      <div>
        <p className="text-sm font-semibold text-slate-900">Failed to load</p>
        <p className="mt-1 max-w-xs text-xs leading-relaxed text-slate-500">{error.message}</p>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 transition-colors hover:bg-slate-50"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Retry
        </button>
      )}
    </div>
  );
}
