"use client";

import * as React from "react";
import { hasErrors, type FieldErrors } from "@/lib/form-validation";

/**
 * Field errors for one form.
 *
 * Default ("submit"): nothing shows until the first submit attempt; after that
 * every blur re-runs `validate`, so a fixed field clears as soon as it is left.
 *
 * `{ touched: true }`: reward early, punish late. A field is checked when it is
 * left (its control's id is mapped back to the key), its error clears as soon
 * as it changes (`clear`), and untouched fields stay quiet until submit.
 *
 * `ids` maps a field key to its control's DOM id when they differ. The id is
 * what `Field htmlFor` gets, so `${id}-error` is the message Field renders.
 */
export function useFormErrors<K extends string>(
  validate: () => FieldErrors<K>,
  ids: Partial<Record<K, string>> = {},
  options: { touched?: boolean } = {},
) {
  const [errors, setErrors] = React.useState<FieldErrors<K>>({});
  const [attempted, setAttempted] = React.useState(false);
  const touchedMode = !!options.touched;
  const touchedRef = React.useRef<Set<K>>(new Set());

  // Latest closures, so the stable callbacks below read current form state.
  const validateRef = React.useRef(validate);
  const idsRef = React.useRef(ids);
  const attemptedRef = React.useRef(attempted);
  React.useLayoutEffect(() => {
    validateRef.current = validate;
    idsRef.current = ids;
    attemptedRef.current = attempted;
  });

  const idFor = React.useCallback((field: K) => idsRef.current[field] ?? field, []);
  const keyForId = React.useCallback((id: string): K | undefined => {
    const hit = (Object.entries(idsRef.current) as [K, string][]).find(([, v]) => v === id);
    return hit ? hit[0] : undefined;
  }, []);

  // Focus waits for the render that attaches aria-describedby and the message,
  // so a screen reader reads the error with the field (WCAG 3.3.1, 4.1.3).
  const pendingFocus = React.useRef<HTMLElement | null>(null);
  React.useEffect(() => {
    const el = pendingFocus.current;
    if (!el) return;
    pendingFocus.current = null;
    el.focus({ preventScroll: true });
    el.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [errors]);

  /** Run on submit. Returns true when the form may be sent; otherwise focuses the first invalid control. */
  const validateAll = React.useCallback((): boolean => {
    const next = validateRef.current();
    attemptedRef.current = true;
    setAttempted(true);
    setErrors(next);
    if (!hasErrors(next)) return true;

    const els = (Object.keys(next) as K[])
      .map((k) => document.getElementById(idFor(k)))
      .filter((el): el is HTMLElement => !!el);
    // First in document order, not in the order the checks were written.
    els.sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
    pendingFocus.current = els[0] ?? null;
    return false;
  }, [idFor]);

  /**
   * Check only `fields` (one step of a multi-step form): their errors replace
   * any shown for them, others are kept. Focuses the first failure; true when all pass.
   */
  const validateSome = React.useCallback((fields: K[]): boolean => {
    const all = validateRef.current();
    fields.forEach((f) => touchedRef.current.add(f));
    const failing = fields.filter((f) => all[f]);
    setErrors((prev) => {
      const next = { ...prev };
      for (const f of fields) {
        if (all[f]) next[f] = all[f];
        else delete next[f];
      }
      return next;
    });
    if (!failing.length) return true;
    const els = failing.map((k) => document.getElementById(idFor(k))).filter((el): el is HTMLElement => !!el);
    els.sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
    pendingFocus.current = els[0] ?? null;
    return false;
  }, [idFor]);

  /** Fields among `fields` that fail right now, without showing anything. */
  const failing = React.useCallback((fields: K[]): K[] => {
    const all = validateRef.current();
    return fields.filter((f) => all[f]);
  }, []);

  /** Attach to the form's onBlur (it bubbles), or a single control's. */
  const revalidate = React.useCallback((e?: unknown) => {
    if (!touchedMode) {
      if (attemptedRef.current) setErrors(validateRef.current());
      return;
    }
    const id = (e as { target?: { id?: unknown } } | undefined)?.target?.id;
    const key = typeof id === "string" && id ? keyForId(id) ?? (id in idsRef.current ? (id as K) : undefined) : undefined;
    if (key) touchedRef.current.add(key);
    const all = validateRef.current();
    if (attemptedRef.current) return setErrors(all);
    const shown: FieldErrors<K> = {};
    for (const k of touchedRef.current) if (all[k]) shown[k] = all[k];
    setErrors(shown);
  }, [touchedMode, keyForId]);

  /** Drop one field's error while it is being edited; its next blur re-checks it. */
  const clear = React.useCallback((field: K) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  /** Mark a field touched without a blur, e.g. a picker that never takes focus. */
  const touch = React.useCallback((field: K) => {
    touchedRef.current.add(field);
  }, []);

  const reset = React.useCallback(() => {
    attemptedRef.current = false;
    touchedRef.current = new Set();
    setAttempted(false);
    setErrors({});
  }, []);

  /** aria-invalid + aria-describedby for the control behind `field`. */
  const invalidProps = React.useCallback(
    (field: K) =>
      errors[field]
        ? { "aria-invalid": true as const, "aria-describedby": `${idFor(field)}-error` }
        : {},
    [errors, idFor],
  );

  return { errors, setErrors, attempted, validateAll, validateSome, failing, revalidate, reset, invalidProps, clear, touch };
}
