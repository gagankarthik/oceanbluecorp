"use client";

import * as React from "react";
import { hasErrors, type FieldErrors } from "@/lib/form-validation";

/**
 * Field errors for one form. Nothing shows until the first submit attempt;
 * after that every blur re-runs `validate`, so a fixed field clears as soon as
 * the user leaves it.
 *
 * `ids` maps a field key to its control's DOM id when they differ. The id is
 * what `Field htmlFor` gets, so `${id}-error` is the message Field renders.
 */
export function useFormErrors<K extends string>(
  validate: () => FieldErrors<K>,
  ids: Partial<Record<K, string>> = {},
) {
  const [errors, setErrors] = React.useState<FieldErrors<K>>({});
  const [attempted, setAttempted] = React.useState(false);

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
    const first = els[0];
    if (first) {
      first.focus({ preventScroll: true });
      first.scrollIntoView({ block: "center", behavior: "smooth" });
    }
    return false;
  }, [idFor]);

  /** Attach to the form's onBlur (it bubbles), or a single control's. */
  const revalidate = React.useCallback(() => {
    if (attemptedRef.current) setErrors(validateRef.current());
  }, []);

  const reset = React.useCallback(() => {
    attemptedRef.current = false;
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

  return { errors, setErrors, attempted, validateAll, revalidate, reset, invalidProps };
}
