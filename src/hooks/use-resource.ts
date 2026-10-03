"use client";

// Shared GET cache for the console. One request per key at a time, every
// component reading a key sees the same data, stale data is shown while a
// refresh runs, and a write anywhere calls mutate(key) to refresh every reader.
// Deliberately small; no new dependency.

import * as React from "react";

type Entry<T = unknown> = {
  data?: T;
  error?: Error;
  at: number;              // when data last arrived
  inflight?: Promise<T>;
  /** The reader's fetcher, so mutate() revalidates the same way. */
  fetcher?: (key: string) => Promise<T>;
  listeners: Set<() => void>;
};

const cache = new Map<string, Entry>();
const FRESH_MS = 30_000;

function entry(key: string): Entry {
  let e = cache.get(key);
  if (!e) {
    e = { at: 0, listeners: new Set() };
    cache.set(key, e);
  }
  return e;
}

const notify = (e: Entry) => e.listeners.forEach((l) => l());

async function defaultFetcher<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw Object.assign(new Error(body.error || `Request failed (${res.status})`), { status: res.status });
  }
  return res.json();
}

/** Fetch (or join the in-flight fetch for) a key. */
function load<T>(key: string, fetcher: (key: string) => Promise<T>): Promise<T> {
  const e = entry(key) as Entry<T>;
  if (e.inflight) return e.inflight;
  e.inflight = fetcher(key)
    .then((data) => {
      e.data = data;
      e.error = undefined;
      e.at = Date.now();
      return data;
    })
    .catch((err: Error) => {
      e.error = err;
      throw err;
    })
    .finally(() => {
      e.inflight = undefined;
      notify(e);
    });
  notify(e);
  return e.inflight;
}

/** Current cached value for a key, without subscribing. */
export function peek<T>(key: string): T | undefined {
  return cache.get(key)?.data as T | undefined;
}

/**
 * Refresh every reader of `key` (or of every key a predicate matches, e.g.
 * `k => k.startsWith("/api/applications")`). Optionally set data first, for an
 * optimistic update.
 */
export function mutate<T>(
  key: string | ((key: string) => boolean),
  data?: T | ((current: T | undefined) => T),
  { revalidate = true } = {},
) {
  const keys = typeof key === "string" ? [key] : [...cache.keys()].filter(key);
  return Promise.all(keys.map((k) => {
    const e = entry(k) as Entry<T>;
    if (data !== undefined) {
      e.data = typeof data === "function" ? (data as (c: T | undefined) => T)(e.data) : data;
      notify(e);
    }
    if (!revalidate) return undefined;
    // Only refetch keys someone is reading; the rest just go stale.
    e.at = 0;
    if (!e.listeners.size) return undefined;
    const run = () => load<T>(k, e.fetcher ?? defaultFetcher).catch(() => undefined);
    // A request already in flight may predate the write; queue a fresh one behind it.
    return e.inflight ? e.inflight.then(run, run) : run();
  }));
}

export interface Resource<T> {
  data: T | undefined;
  error: Error | undefined;
  /** No data yet and a request is running: show a skeleton. */
  isLoading: boolean;
  /** A refresh is running over data already on screen: don't swap in a skeleton. */
  isValidating: boolean;
  reload: () => Promise<T | undefined>;
  /** Set data locally (optimistic) without a request. */
  setData: (data: T | ((current: T | undefined) => T)) => void;
}

/**
 * `key` null skips the request (e.g. waiting on a param). Refetches when the
 * data is older than FRESH_MS on mount, and when the tab regains focus.
 */
export function useResource<T>(
  key: string | null,
  { fetcher = defaultFetcher as (key: string) => Promise<T>, freshMs = FRESH_MS } = {},
): Resource<T> {
  const [, force] = React.useReducer((n: number) => n + 1, 0);
  const fetcherRef = React.useRef(fetcher);
  fetcherRef.current = fetcher;

  React.useEffect(() => {
    if (!key) return;
    const e = entry(key);
    e.fetcher = fetcherRef.current as Entry["fetcher"];
    e.listeners.add(force);
    if (!e.inflight && Date.now() - e.at > freshMs) load(key, fetcherRef.current).catch(() => undefined);

    const onFocus = () => {
      if (document.visibilityState === "visible" && !e.inflight && Date.now() - e.at > freshMs) {
        load(key, fetcherRef.current).catch(() => undefined);
      }
    };
    document.addEventListener("visibilitychange", onFocus);
    window.addEventListener("focus", onFocus);
    return () => {
      e.listeners.delete(force);
      document.removeEventListener("visibilitychange", onFocus);
      window.removeEventListener("focus", onFocus);
    };
  }, [key, freshMs]);

  const e = key ? (entry(key) as Entry<T>) : undefined;
  return {
    data: e?.data,
    error: e?.error,
    isLoading: !!key && e?.data === undefined && !e?.error,
    isValidating: !!e?.inflight,
    reload: React.useCallback(
      () => (key ? load<T>(key, fetcherRef.current).catch(() => undefined) : Promise.resolve(undefined)),
      [key],
    ),
    setData: React.useCallback((data) => { if (key) void mutate<T>(key, data, { revalidate: false }); }, [key]),
  };
}
