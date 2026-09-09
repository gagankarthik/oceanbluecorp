"use client";

import { useEffect, useState } from "react";

/**
 * SSR-safe `matchMedia`.
 *
 * Always false on the first render, on the server and on the client alike, then
 * corrected in an effect. Reading `window.matchMedia` during render would give
 * the two passes different answers and React would throw a hydration mismatch,
 * so the flicker is the price of not doing that.
 *
 * @example
 * const narrow = useMediaQuery("(max-width: 1439.98px)");
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    setMatches(mql.matches);
    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}
