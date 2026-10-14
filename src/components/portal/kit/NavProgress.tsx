"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createContext, Suspense, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

type Ctx = { start: () => void; done: () => void };
type Phase = "idle" | "pending" | "visible" | "finishing";
const ProgressContext = createContext<Ctx>({ start: () => {}, done: () => {} });

/** Start/finish the top bar by hand, e.g. around a router.push() or a slow save. */
export const useNavProgress = () => useContext(ProgressContext);

/** router.push/replace that also runs the top bar (link clicks need nothing). */
export function usePortalRouter() {
  const router = useRouter();
  const { start } = useNavProgress();
  return useMemo(
    () => ({
      ...router,
      push: (...a: Parameters<typeof router.push>) => {
        if (isNewUrl(a[0])) start();
        router.push(...a);
      },
      replace: (...a: Parameters<typeof router.replace>) => {
        if (isNewUrl(a[0])) start();
        router.replace(...a);
      },
    }),
    [router, start],
  );
}

function isNewUrl(href: string) {
  try {
    const next = new URL(href, location.href);
    return next.origin === location.origin && (next.pathname !== location.pathname || next.search !== location.search);
  } catch {
    return false;
  }
}

// Shown only when a navigation outlasts this, so instant ones never flash.
const SHOW_AFTER = 120;
// A navigation that never settles (aborted, same-URL) stops waiting here.
const GIVE_UP = 10_000;

/**
 * Thin ocean bar along the bottom of the top bar while a client navigation is
 * pending. Starts on any same-origin link click (capture phase, before Link
 * prevents default), on back/forward, or via useNavProgress().start();
 * completes when the pathname or query changes. Under reduced motion it is a
 * static bar that appears and disappears.
 */
export function NavProgressProvider({ children }: { children: React.ReactNode }) {
  const [state, setStateRaw] = useState<Phase>("idle");
  const [value, setValue] = useState(0);
  const phase = useRef<Phase>("idle");
  const timers = useRef<number[]>([]);
  const tick = useRef<number | null>(null);

  const setState = (p: Phase) => {
    phase.current = p;
    setStateRaw(p);
  };
  const clear = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
    if (tick.current !== null) window.clearInterval(tick.current);
    tick.current = null;
  };

  const done = useCallback(() => {
    const p = phase.current;
    if (p === "idle" || p === "finishing") return;
    clear();
    if (p === "pending") return setState("idle");
    setValue(1);
    setState("finishing");
    timers.current.push(window.setTimeout(() => setState("idle"), 260));
  }, []);

  const start = useCallback(() => {
    clear();
    setValue(0);
    setState("pending");
    timers.current.push(
      window.setTimeout(() => {
        setState("visible");
        setValue(0.15);
        // Eases toward 90% and waits there for the route to settle.
        tick.current = window.setInterval(() => setValue((v) => v + (0.9 - v) * 0.12), 240);
      }, SHOW_AFTER),
      window.setTimeout(done, GIVE_UP),
    );
  }, [done]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.hasAttribute("download") || (a.target && a.target !== "_self")) return;
      if (isNewUrl(a.href)) start();
    };
    const onPop = () => start();
    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onPop);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPop);
      clear();
    };
  }, [start]);

  const ctx = useMemo(() => ({ start, done }), [start, done]);
  return (
    <ProgressContext.Provider value={ctx}>
      <Suspense fallback={null}>
        <RouteWatcher onChange={done} />
      </Suspense>
      <BarState.Provider value={{ state, value }}>{children}</BarState.Provider>
    </ProgressContext.Provider>
  );
}

const BarState = createContext<{ state: Phase; value: number }>({ state: "idle", value: 0 });

function RouteWatcher({ onChange }: { onChange: () => void }) {
  const path = usePathname();
  const query = useSearchParams()?.toString();
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    onChange();
  }, [path, query, onChange]);
  return null;
}

/** The bar itself; place inside a `relative` element (the portal top bar). */
export function NavProgressBar() {
  const { state, value } = useContext(BarState);
  const shown = state === "visible" || state === "finishing";
  // Transform animates only while shown: resets happen out of sight, and the
  // finished bar fades at full width instead of retracting.
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 -bottom-px h-0.5 overflow-hidden">
      <div
        className={`kit-progress h-full origin-left bg-ocean-600 ease-out motion-reduce:transition-none ${
          shown ? "opacity-100 transition-[transform,opacity] duration-300" : "opacity-0 transition-opacity duration-200"
        }`}
        style={{ transform: `scaleX(${value})` }}
      />
    </div>
  );
}
