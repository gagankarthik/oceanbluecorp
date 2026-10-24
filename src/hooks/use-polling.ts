"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Calls `tick` every `ms` while `enabled`, but only while the tab is visible: a hidden tab
 * stops polling and catches up with one call the moment it is shown again. With `maxMs`
 * the polling gives up after that long and `timedOut` turns true, so a job stuck on the
 * server cannot keep a tab polling forever.
 */
export function usePolling(tick: () => void, ms: number, enabled: boolean, maxMs?: number) {
  const fn = useRef(tick);
  fn.current = tick;
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    setTimedOut(false);
    if (!enabled) return;
    const started = Date.now();
    let timer: ReturnType<typeof setInterval> | null = null;
    const expired = () => maxMs !== undefined && Date.now() - started > maxMs;
    const stop = () => {
      if (timer) clearInterval(timer);
      timer = null;
    };
    const start = () => {
      stop();
      timer = setInterval(() => {
        if (expired()) {
          stop();
          setTimedOut(true);
          return;
        }
        fn.current();
      }, ms);
    };
    const onVisibility = () => {
      if (document.hidden) return stop();
      if (expired()) return setTimedOut(true);
      fn.current();
      start();
    };
    if (!document.hidden) start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [enabled, ms, maxMs]);

  return timedOut;
}
