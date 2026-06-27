"use client";

import { useState, useCallback, useEffect } from "react";

/**
 * SSR-safe typed localStorage hook.
 *
 * Returns [value, setValue] exactly like useState, but persists to localStorage.
 * Safe on the server (returns initialValue without calling localStorage).
 *
 * @example
 * const [collapsed, setCollapsed] = useLocalStorage('adminSidebarCollapsed', false);
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, (value: T | ((prev: T) => T)) => void] {
  // Lazy initializer runs only on client — never on server.
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      return item !== null ? (JSON.parse(item) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  // Keep in sync when key changes (rare, but defensive).
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item !== null) setStoredValue(JSON.parse(item) as T);
    } catch {
      // ignore
    }
  }, [key]);

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((prev) => {
        const next = value instanceof Function ? value(prev) : value;
        try {
          window.localStorage.setItem(key, JSON.stringify(next));
        } catch {
          // Storage quota or private browsing — silently ignore.
        }
        return next;
      });
    },
    [key],
  );

  return [storedValue, setValue];
}
