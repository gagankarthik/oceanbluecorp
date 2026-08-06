// Request-body validation for route handlers.
//
// WHY THIS EXISTS RATHER THAN ZOD
//
// Not because zod is wrong — because this needs one property zod alone does not
// give you: a route declares the fields it accepts and everything else is
// DROPPED. Every handler here used to read fields straight off `body`, which is
// how an anonymous applicant could post `status: "hired"` and `ownership` to the
// open careers endpoint. Gating those fields one by one fixes the instance; a
// declared shape fixes the class, because a field nobody declared cannot reach
// the record no matter who adds it to the body later.
//
// It is also ~120 lines with no dependency, in a project that has no runtime
// validation library and hand-rolls everything else at the boundary.
//
// Errors name the field and say what was expected: a 400 that reads
// "Invalid request" costs somebody an afternoon.

export type FieldKind = "string" | "number" | "boolean" | "stringArray" | "object";

export interface FieldRule {
  kind: FieldKind;
  required?: boolean;
  /** Reject a string that is only whitespace. Ignored for other kinds. */
  nonEmpty?: boolean;
  /** Longest accepted string; longer input is an error, never a silent truncation. */
  maxLength?: number;
  min?: number;
  max?: number;
  /** Closed set of accepted values (strings). */
  oneOf?: readonly string[];
  /** Coerce a numeric string to a number — form posts arrive as strings. */
  coerce?: boolean;
}

export type Schema = Record<string, FieldRule>;

export interface ValidationResult<T> {
  ok: boolean;
  /** Only the declared fields, with undefined omitted. */
  value: T;
  errors: string[];
}

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

function checkField(name: string, raw: unknown, rule: FieldRule, errors: string[]): unknown {
  if (raw === undefined || raw === null || raw === "") {
    if (rule.required) errors.push(`${name} is required`);
    return undefined;
  }

  switch (rule.kind) {
    case "string": {
      if (typeof raw !== "string") {
        errors.push(`${name} must be text`);
        return undefined;
      }
      const value = raw.trim();
      if (rule.nonEmpty !== false && value === "") {
        if (rule.required) errors.push(`${name} cannot be blank`);
        return undefined;
      }
      if (rule.maxLength && value.length > rule.maxLength) {
        errors.push(`${name} must be ${rule.maxLength} characters or fewer`);
        return undefined;
      }
      if (rule.oneOf && !rule.oneOf.includes(value)) {
        errors.push(`${name} must be one of: ${rule.oneOf.join(", ")}`);
        return undefined;
      }
      return value;
    }

    case "number": {
      const value = typeof raw === "number" ? raw : rule.coerce ? Number(raw) : NaN;
      if (!Number.isFinite(value)) {
        errors.push(`${name} must be a number`);
        return undefined;
      }
      if (rule.min !== undefined && value < rule.min) {
        errors.push(`${name} must be ${rule.min} or more`);
        return undefined;
      }
      if (rule.max !== undefined && value > rule.max) {
        errors.push(`${name} must be ${rule.max} or less`);
        return undefined;
      }
      return value;
    }

    case "boolean": {
      if (typeof raw === "boolean") return raw;
      if (rule.coerce && (raw === "true" || raw === "false")) return raw === "true";
      errors.push(`${name} must be true or false`);
      return undefined;
    }

    case "stringArray": {
      if (!Array.isArray(raw)) {
        errors.push(`${name} must be a list`);
        return undefined;
      }
      const items = raw
        .filter((v): v is string => typeof v === "string")
        .map((v) => v.trim())
        .filter(Boolean);
      if (rule.maxLength && items.some((v) => v.length > rule.maxLength!)) {
        errors.push(`each ${name} entry must be ${rule.maxLength} characters or fewer`);
        return undefined;
      }
      return items;
    }

    case "object": {
      if (!isPlainObject(raw)) {
        errors.push(`${name} must be an object`);
        return undefined;
      }
      return raw;
    }
  }
}

/**
 * Validate a body against a schema, keeping ONLY the declared fields.
 *
 * Undeclared keys are dropped silently rather than rejected: a client sending an
 * extra field should not have a valid request refused, and a field the route
 * never declared must not reach the database either way.
 */
export function validate<T = Record<string, unknown>>(
  body: unknown,
  schema: Schema,
): ValidationResult<T> {
  const errors: string[] = [];
  const value: Record<string, unknown> = {};

  if (!isPlainObject(body)) {
    return { ok: false, value: {} as T, errors: ["Request body must be a JSON object"] };
  }

  for (const [name, rule] of Object.entries(schema)) {
    const checked = checkField(name, body[name], rule, errors);
    if (checked !== undefined) value[name] = checked;
  }

  return { ok: errors.length === 0, value: value as T, errors };
}

/** One line fit for a 400 response, naming every field that failed. */
export function validationMessage(errors: string[]): string {
  return errors.length === 1 ? errors[0] : `${errors.length} problems: ${errors.join("; ")}`;
}
