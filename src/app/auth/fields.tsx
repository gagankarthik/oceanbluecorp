"use client";

import { useState } from "react";

export const field =
  "mt-2 block min-h-12 w-full bg-mist-0 px-4 text-[17px] text-navy-900 ring-1 ring-inset ring-mist-300 transition-shadow placeholder:text-mist-400 focus:outline-none focus:ring-2 focus:ring-ocean-600";

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
    <ul aria-label="Password requirements" className="grid gap-1.5 text-[14px] sm:grid-cols-2">
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
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: string;
  onKeyUp?: React.KeyboardEventHandler<HTMLInputElement>;
  aside?: React.ReactNode;
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
          className={`${field.replace("mt-2 ", "")} pr-20`}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-pressed={show}
          aria-label={show ? "Hide password" : "Show password"}
          className="absolute right-2 top-1/2 min-h-9 -translate-y-1/2 px-3 text-[14px] font-medium text-ocean-700 hover:text-navy-900"
        >
          {show ? "Hide" : "Show"}
        </button>
      </div>
    </div>
  );
}

/** The server may append Cognito's own reason after a newline; it shows quieter underneath. */
export function ErrorNote({ error }: { error: string | null }) {
  if (!error) return null;
  const [head, ...detail] = error.split("\n");
  return (
    <p role="alert" className="mt-4 flex gap-3 border-l-4 border-[#d92d20] bg-[#fef3f2] px-4 py-3 text-[15px] text-[#912018]">
      <svg aria-hidden viewBox="0 0 20 20" className="mt-0.5 size-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <circle cx="10" cy="10" r="7.5" />
        <path d="M10 6v4.5M10 13.6v.1" />
      </svg>
      <span>
        {head}
        {detail.length > 0 && <span className="mt-1 block text-[14px] text-[#b42318]">{detail.join(" ")}</span>}
      </span>
    </p>
  );
}

/** Confirmation that something went through: green, announced politely */
export function SuccessNote({ children }: { children: React.ReactNode }) {
  return (
    <p role="status" className="mt-4 flex gap-3 border-l-4 border-[#079455] bg-[#ecfdf3] px-4 py-3 text-[15px] text-[#05603a]">
      <svg aria-hidden viewBox="0 0 20 20" className="mt-0.5 size-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="10" cy="10" r="7.5" />
        <path d="m6.8 10.2 2.2 2.2 4.2-4.6" />
      </svg>
      <span>{children}</span>
    </p>
  );
}
