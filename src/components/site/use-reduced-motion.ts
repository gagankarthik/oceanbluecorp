"use client";

import { useSyncExternalStore } from "react";

// prefers-reduced-motion without pulling in the motion runtime. False on the server.
const QUERY = "(prefers-reduced-motion: reduce)";

const subscribe = (cb: () => void) => {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};

export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, () => window.matchMedia(QUERY).matches, () => false);
}
