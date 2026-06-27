"use client";

import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** Custom fallback — receives error + reset fn. Defaults to AdminErrorFallback. */
  fallback?: (error: Error, reset: () => void) => React.ReactNode;
  /** Called after the boundary catches an error (for logging). */
  onError?: (error: Error, info: React.ErrorInfo) => void;
}

/**
 * Catches render-time errors in a subtree and shows a recovery UI instead
 * of crashing the entire admin. Place at the organism level, not page level,
 * so one broken widget never takes down the whole dashboard.
 *
 * Must be a class component — React doesn't expose getDerivedStateFromError
 * as a hook yet.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    this.props.onError?.(error, info);
    // Log to console in development; swap for a real error-tracking service here.
    if (process.env.NODE_ENV !== "production") {
      console.error("[ErrorBoundary]", error, info.componentStack);
    }
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.reset);
      }
      return <AdminErrorFallback error={this.state.error} onReset={this.reset} />;
    }
    return this.props.children;
  }
}

/** Default in-place error fallback for an admin section. */
function AdminErrorFallback({ error, onReset }: { error: Error; onReset: () => void }) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-rose-100 bg-rose-50 px-6 py-12 text-center"
    >
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-rose-100">
        <AlertTriangle className="h-6 w-6 text-rose-600" strokeWidth={1.5} />
      </span>
      <div>
        <p className="text-sm font-semibold text-slate-900">Something went wrong</p>
        <p className="mt-1 max-w-sm text-xs leading-relaxed text-slate-500">
          {error.message || "An unexpected error occurred in this section."}
        </p>
      </div>
      <button
        type="button"
        onClick={onReset}
        className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 transition-colors hover:bg-slate-50"
      >
        <RefreshCw className="h-3.5 w-3.5" />
        Try again
      </button>
    </div>
  );
}

/**
 * Convenience wrapper — wraps a single organism in an ErrorBoundary without
 * the consumer needing to manage state. Accepts same props as ErrorBoundary.
 */
export function WithErrorBoundary({
  children,
  ...props
}: ErrorBoundaryProps) {
  return <ErrorBoundary {...props}>{children}</ErrorBoundary>;
}
