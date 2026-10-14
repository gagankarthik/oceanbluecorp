"use client";

import { useState } from "react";
import FieldError from "@/components/site/FieldError";

export const field =
  "mt-2 block min-h-12 w-full bg-mist-0 px-4 text-body text-navy-900 ring-1 ring-inset ring-[var(--color-border-control)] transition-shadow placeholder:text-placeholder focus:outline-none focus:ring-2 focus:ring-ocean-600 aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-coral-700";

/** aria-invalid + aria-describedby for a control whose FieldError is `${id}-error`. */
export const invalid = (id: string, error?: string) =>
  error ? { "aria-invalid": true as const, "aria-describedby": `${id}-error` } : {};

/** "Step 2 of 2" over a step heading. */
export function StepLabel({ n, of }: { n: number; of: number }) {
  return <p className="mb-1 text-small font-medium text-mist-600">Step {n} of {of}</p>;
}

// Mirrors the Cognito pool policy, so a refused password doesn't burn the challenge session.
const RULES: { label: string; test: (v: string) => boolean }[] = [
  { label: "8 characters", test: (v) => v.length >= 8 },
  { label: "an uppercase letter", test: (v) => /[A-Z]/.test(v) },
  { label: "a lowercase letter", test: (v) => /[a-z]/.test(v) },
  { label: "a number", test: (v) => /\d/.test(v) },
  { label: "a symbol", test: (v) => /[\^$*.[\]{}()?"!@#%&/\,><':;|_~`+=-]/.test(v) },
];

export const unmetRules = (v: string) => RULES.filter((r) => !r.test(v)).map((r) => r.label);

export function PasswordRules({ value }: { value: string }) {
  return (
    <ul aria-label="Password requirements" className="grid gap-1.5 text-small sm:grid-cols-2">
      {RULES.map((r) => {
        const ok = r.test(value);
        return (
          <li key={r.label} className={`flex items-center gap-2 ${ok ? "text-ocean-700" : "text-mist-600"}`}>
            <span aria-hidden className={`size-2 shrink-0 ${ok ? "bg-ocean-600" : "bg-mist-300"}`} />
            {r.label}
            <span className="sr-only">{ok ? ", met" : ", not met"}</span>
          </li>
        );
      })}
    </ul>
  );
}

export function PasswordInput({
  id,
  label,
  value,
  onChange,
  autoComplete,
  onKeyUp,
  aside,
  error,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: string;
  onKeyUp?: React.KeyboardEventHandler<HTMLInputElement>;
  aside?: React.ReactNode;
  error?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <label htmlFor={id} className="font-medium">
          {label}
        </label>
        {aside}
      </div>
      {/* The margin sits on the wrapper so the toggle centres on the box itself */}
      <div className="relative mt-2">
        <input
          id={id}
          type={show ? "text" : "password"}
          autoComplete={autoComplete}
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyUp={onKeyUp}
          {...invalid(id, error)}
          className={`${field.replace("mt-2 ", "")} pr-20`}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-pressed={show}
          aria-label={show ? "Hide password" : "Show password"}
          className="absolute right-2 top-1/2 min-h-10 -translate-y-1/2 px-3 text-small font-medium text-ocean-700 hover:text-navy-900"
        >
          {show ? "Hide" : "Show"}
        </button>
      </div>
      <FieldError id={id} message={error} />
    </div>
  );
}

/** The server may append Cognito's own reason after a newline; it shows quieter underneath. */
export function ErrorNote({ error }: { error: string | null }) {
  if (!error) return null;
  const [head, ...detail] = error.split("\n");
  return (
    <p role="alert" className="mt-4 flex gap-3 border-l-4 border-coral-600 bg-coral-50 px-4 py-3 text-small text-coral-800">
      <svg aria-hidden viewBox="0 0 20 20" className="mt-0.5 size-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <circle cx="10" cy="10" r="7.5" />
        <path d="M10 6v4.5M10 13.6v.1" />
      </svg>
      <span>
        {head}
        {detail.length > 0 && <span className="mt-1 block text-small text-coral-700">{detail.join(" ")}</span>}
      </span>
    </p>
  );
}

/** Confirmation that something went through: green, announced politely */
export function SuccessNote({ children }: { children: React.ReactNode }) {
  return (
    <p role="status" className="mt-4 flex gap-3 border-l-4 border-kelp-700 bg-kelp-50 px-4 py-3 text-small text-kelp-800">
      <svg aria-hidden viewBox="0 0 20 20" className="mt-0.5 size-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="10" cy="10" r="7.5" />
        <path d="m6.8 10.2 2.2 2.2 4.2-4.6" />
      </svg>
      <span>{children}</span>
    </p>
  );
}
