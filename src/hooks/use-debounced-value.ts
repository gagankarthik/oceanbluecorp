import { useEffect, useState } from "react";

/**
 * Returns a debounced copy of `value` that only updates after `delay` ms of no
 * changes. Use for list search inputs so filtering doesn't run on every keystroke:
 *   const debounced = useDebouncedValue(search, 250);
 *   const filtered = useMemo(() => rows.filter(...debounced...), [rows, debounced]);
 */
export function useDebouncedValue<T>(value: T, delay = 250): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}
