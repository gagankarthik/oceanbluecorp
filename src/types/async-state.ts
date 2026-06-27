/**
 * Discriminated union for all async data states.
 *
 * Usage in a component:
 *   const [state, setState] = useState<AsyncState<Job[]>>({ status: 'loading' });
 *
 * Usage in JSX:
 *   if (state.status === 'loading') return <Skeleton />;
 *   if (state.status === 'error')   return <ErrorView error={state.error} onRetry={state.onRetry} />;
 *   if (state.status === 'empty')   return <EmptyView />;
 *   return <DataView data={state.data} />;
 */

export type AsyncState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; error: Error; onRetry?: () => void }
  | { status: "empty"; emptyVariant?: "fresh" | "filtered" | "error" | "permission" }
  | { status: "success"; data: T };

/**
 * Variant of AsyncState where "empty" is expressed as success with an empty
 * array/object (the component decides if it is "empty"). Use when the API
 * cannot distinguish "never had data" from "all filtered out".
 */
export type AsyncDataState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; error: Error; onRetry?: () => void }
  | { status: "success"; data: T };

/** Narrow helper — true when state is success (use for TypeScript narrowing). */
export function isSuccess<T>(s: AsyncState<T>): s is { status: "success"; data: T } {
  return s.status === "success";
}

/** Narrow helper — true when state is error. */
export function isError<T>(
  s: AsyncState<T>,
): s is { status: "error"; error: Error; onRetry?: () => void } {
  return s.status === "error";
}

/** Build a loading state. */
export const asyncLoading = (): AsyncState<never> => ({ status: "loading" });

/** Build a success state. */
export const asyncSuccess = <T>(data: T): AsyncState<T> => ({ status: "success", data });

/** Build an error state. */
export const asyncError = <T>(
  error: Error | string,
  onRetry?: () => void,
): AsyncState<T> => ({
  status: "error",
  error: typeof error === "string" ? new Error(error) : error,
  onRetry,
});

/** Build an empty state. */
export const asyncEmpty = <T>(
  emptyVariant?: "fresh" | "filtered" | "error" | "permission",
): AsyncState<T> => ({ status: "empty", emptyVariant });
