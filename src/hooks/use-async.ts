"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { AsyncState } from "@/types/async-state";

export interface UseAsyncOptions {
  /** If true, the fetch fires immediately on mount. */
  immediate?: boolean;
  /** Consider the result "empty" when the predicate returns true. */
  isEmpty?: <T>(data: T) => boolean;
}

/**
 * Generic hook for async operations with discriminated-union state.
 *
 * @example
 * const { state, execute } = useAsync(() => fetch('/api/jobs').then(r => r.json()), { immediate: true });
 * if (state.status === 'loading') return <Skeleton />;
 * if (state.status === 'error')   return <p>{state.error.message}</p>;
 * if (state.status === 'success') return <JobList jobs={state.data} />;
 */
export function useAsync<T>(
  asyncFn: () => Promise<T>,
  options: UseAsyncOptions = {},
) {
  const { immediate = false, isEmpty } = options;
  const [state, setState] = useState<AsyncState<T>>({ status: "idle" });

  // Keep a ref to the latest asyncFn so execute() doesn't stale-close over an
  // old version, while also never triggering the immediate-fire effect.
  const fnRef = useRef(asyncFn);
  useEffect(() => { fnRef.current = asyncFn; });

  const execute = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const data = await fnRef.current();
      if (isEmpty?.(data)) {
        setState({ status: "empty" });
      } else {
        setState({ status: "success", data });
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setState({ status: "error", error, onRetry: execute });
    }
  }, [isEmpty]);

  useEffect(() => {
    if (immediate) execute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { state, execute, setState };
}

/**
 * Simpler variant that returns `{ data, loading, error }` — for cases where
 * the discriminated union is overkill and a boolean-flag API is clearer.
 */
export function useAsyncSimple<T>(
  asyncFn: () => Promise<T>,
  deps: React.DependencyList = [],
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await asyncFn();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    execute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { data, loading, error, refetch: execute };
}
