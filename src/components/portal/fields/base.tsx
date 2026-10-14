"use client";

import { forwardRef, useId, useRef, useState } from "react";
import Icon, { type IconName } from "../icons";

/* Form primitives for portal screens. Same vocabulary as the relationships
   forms: 13px labels, 40px controls on a mist ring, 12px help and error lines. */

export const inputCls =
  "block h-10 w-full rounded-lg bg-mist-0 px-3 text-adm-base text-navy-900 ring-1 ring-inset ring-[var(--color-border-control)] transition-shadow placeholder:text-placeholder hover:ring-mist-600 focus:outline-none focus:ring-2 focus:ring-ocean-600 disabled:cursor-not-allowed disabled:bg-mist-50 disabled:text-mist-600 aria-[invalid=true]:ring-coral-600";

export const textareaCls = inputCls.replace("h-10", "min-h-24 py-2.5 leading-normal resize-y");

const RED = "text-coral-700";
const AMBER = "text-status-warning";

/** Error line under a control; `id` pairs with the control's aria-describedby. */
export function FieldError({ id, children }: { id?: string; children?: React.ReactNode }) {
  if (!children) return null;
  return (
    <p id={id} role="alert" className={`mt-1.5 flex items-start gap-1.5 text-adm-xs font-medium ${RED}`}>
      <Icon name="alert" className="mt-px size-3.5 shrink-0" />
      <span>{children}</span>
    </p>
  );
}

/** Non-blocking note under a control. */
export function FieldWarning({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return (
    <p className={`mt-1.5 flex items-start gap-1.5 text-adm-xs font-medium ${AMBER}`}>
      <Icon name="alert" className="mt-px size-3.5 shrink-0" />
      <span>{children}</span>
    </p>
  );
}

/**
 * Label, control, then one of error / warning / helper. `htmlFor` doubles as
 * the error id stem (`${htmlFor}-error`), matching useFormErrors.invalidProps.
 */
export function Field({
  label,
  htmlFor,
  labelId,
  required,
  optional,
  hint,
  helper,
  error,
  warning,
  className = "",
  children,
}: {
  label: React.ReactNode;
  htmlFor?: string;
  /** For controls that pair by aria-labelledby (contentEditable) */
  labelId?: string;
  required?: boolean;
  /** Says "Optional" on the right, for sections that mix both */
  optional?: boolean;
  /** Right of the label, e.g. a counter */
  hint?: React.ReactNode;
  helper?: React.ReactNode;
  error?: string;
  warning?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`min-w-0 ${className}`}>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <label id={labelId} htmlFor={htmlFor} className="text-adm-base font-medium text-navy-900">
          {label}
          {required && (
            <span className={RED} aria-hidden>
              {" "}*
            </span>
          )}
          {required && <span className="sr-only"> (required)</span>}
        </label>
        {(hint || optional) && <span className="shrink-0 text-adm-xs text-mist-600">{hint ?? "Optional"}</span>}
      </div>
      {children}
      {error ? (
        <FieldError id={htmlFor ? `${htmlFor}-error` : undefined}>{error}</FieldError>
      ) : warning ? (
        <FieldWarning>{warning}</FieldWarning>
      ) : helper ? (
        <p className="mt-1.5 text-adm-xs leading-snug text-mist-600">{helper}</p>
      ) : null}
    </div>
  );
}

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

/** Text input; autofill off by default because these forms hold other people's data. */
export const TextInput = forwardRef<HTMLInputElement, InputProps>(function TextInput({ className = "", ...props }, ref) {
  return <input ref={ref} autoComplete="off" {...props} className={`${inputCls} ${className}`} />;
});

export function TextArea({ className = "", ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea autoComplete="off" {...props} className={`${textareaCls} ${className}`} />;
}

/** Native select with the portal chevron: keyboard, mobile pickers and optgroups for free. */
export function NativeSelect({ className = "", children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select {...props} className={`${inputCls} cursor-pointer appearance-none pr-9 ${className}`}>
        {children}
      </select>
      <Icon name="chevronDown" className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-mist-500" />
    </div>
  );
}

/** Checkbox with a title and an optional line of explanation. */
export function CheckRow({
  id,
  checked,
  onChange,
  title,
  description,
  boxed = false,
  disabled,
}: {
  id?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Draws a well around it, for a choice that stands alone */
  boxed?: boolean;
  disabled?: boolean;
}) {
  const auto = useId();
  const cid = id ?? auto;
  return (
    <label
      htmlFor={cid}
      className={`flex min-h-10 cursor-pointer items-start gap-3 ${boxed ? "rounded-lg bg-mist-50 px-3.5 py-3 ring-1 ring-inset ring-mist-200 hover:ring-mist-300" : "py-2"}`}
    >
      <input
        id={cid}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 size-4 shrink-0 cursor-pointer rounded accent-ocean-600"
      />
      <span className="min-w-0">
        <span className="block text-adm-base font-medium text-navy-900">{title}</span>
        {description && <span className="mt-0.5 block text-adm-xs leading-snug text-mist-600">{description}</span>}
      </span>
    </label>
  );
}

/** 2–4 mutually exclusive options shown at once (radiogroup with arrow keys). */
export function Choice<V extends string>({
  id,
  label,
  value,
  options,
  onChange,
  className = "",
}: {
  id?: string;
  label: string;
  value: V;
  options: { value: V; label: string; icon?: IconName }[];
  onChange: (v: V) => void;
  className?: string;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const move = (from: number, step: number) => {
    const next = (from + step + options.length) % options.length;
    onChange(options[next].value);
    refs.current[next]?.focus();
  };
  const anyOn = options.some((o) => o.value === value);
  return (
    <div id={id} role="radiogroup" aria-label={label} className={`flex h-10 w-full rounded-lg bg-mist-100 p-1 ${className}`}>
      {options.map((o, i) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={on}
            tabIndex={on || (!anyOn && i === 0) ? 0 : -1}
            onClick={() => onChange(o.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight" || e.key === "ArrowDown") {
                e.preventDefault();
                move(i, 1);
              }
              if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
                e.preventDefault();
                move(i, -1);
              }
            }}
            className={`inline-flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-3 text-adm-base font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-600 ${
              on ? "bg-mist-0 text-navy-900 shadow-sm" : "text-mist-600 hover:text-navy-900"
            }`}
          >
            {o.icon && <Icon name={o.icon} className="size-4" />}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

const noticeTone = {
  info: { box: "bg-ocean-50 text-navy-900 ring-ocean-200", icon: "text-ocean-700", glyph: "sparkle" as IconName },
  warning: { box: "bg-status-warning-soft text-status-warning-strong ring-status-warning-line", icon: "text-status-warning", glyph: "alert" as IconName },
  error: { box: "bg-status-danger-soft text-status-danger-strong ring-status-danger-line", icon: "text-status-danger", glyph: "alert" as IconName },
  success: { box: "bg-status-success-soft text-status-success-strong ring-status-success-line", icon: "text-status-success", glyph: "check" as IconName },
};

/** A tinted well for status lines inside a form: prefill results, warnings, info. */
export function Notice({
  tone = "info",
  icon,
  children,
  action,
  onDismiss,
  role,
}: {
  tone?: keyof typeof noticeTone;
  icon?: IconName;
  children: React.ReactNode;
  action?: React.ReactNode;
  onDismiss?: () => void;
  role?: "alert" | "status";
}) {
  const t = noticeTone[tone];
  return (
    <div role={role ?? (tone === "error" ? "alert" : undefined)} className={`flex flex-wrap items-start gap-3 rounded-lg px-4 py-3 text-adm-base leading-snug ring-1 ring-inset ${t.box}`}>
      <Icon name={icon ?? t.glyph} className={`mt-0.5 size-5 shrink-0 ${t.icon}`} />
      <div className="min-w-0 flex-1">{children}</div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
      {onDismiss && (
        <button type="button" onClick={onDismiss} aria-label="Dismiss" className="-my-1.5 -mr-1.5 grid size-8 shrink-0 place-items-center rounded-md opacity-70 hover:bg-black/5 hover:opacity-100">
          <Icon name="x" className="size-4" />
        </button>
      )}
    </div>
  );
}

/** Save failure above a form. Renders nothing without a message. */
export function FormBanner({ message, onDismiss }: { message?: string | null; onDismiss?: () => void }) {
  if (!message) return null;
  return (
    <Notice tone="error" onDismiss={onDismiss}>
      {message}
    </Notice>
  );
}

/**
 * A titled block of fields. `collapsible` folds it behind its header (closed
 * unless `defaultOpen`); the header says how many fields hold values.
 */
export function FormSection({
  id,
  title,
  description,
  badge,
  action,
  collapsible = false,
  defaultOpen = true,
  open: openProp,
  onOpenChange,
  children,
}: {
  id?: string;
  title: string;
  description?: React.ReactNode;
  /** Right of the title: "Required", "Optional", "3 filled" */
  badge?: React.ReactNode;
  action?: React.ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
  /** Controlled open state for a collapsible section */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}) {
  const [openState, setOpenState] = useState(defaultOpen);
  const open = openProp ?? openState;
  const setOpen = (fn: (v: boolean) => boolean) => {
    const next = fn(open);
    setOpenState(next);
    onOpenChange?.(next);
  };
  const bodyId = useId();
  const shown = !collapsible || open;
  const head = (
    <>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <h2 className="text-adm-md font-semibold text-navy-900">{title}</h2>
          {badge}
        </span>
        {description && <span className="mt-0.5 block text-adm-base text-mist-600">{description}</span>}
      </span>
    </>
  );
  return (
    <section id={id} className="min-w-0 scroll-mt-24 rounded-xl bg-mist-0 ring-1 ring-mist-200">
      {collapsible ? (
        <button
          type="button"
          aria-expanded={open}
          aria-controls={bodyId}
          onClick={() => setOpen((v) => !v)}
          className={`flex min-h-14 w-full items-center gap-3 rounded-xl px-5 py-3 text-left hover:bg-mist-50 ${open ? "rounded-b-none border-b border-mist-200" : ""}`}
        >
          {head}
          <Icon name="chevronDown" className={`size-5 shrink-0 text-mist-500 transition-transform duration-200 motion-reduce:transition-none ${open ? "rotate-180" : ""}`} />
        </button>
      ) : (
        <header className="flex min-h-14 flex-wrap items-center gap-3 border-b border-mist-200 px-5 py-3">
          {head}
          {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
        </header>
      )}
      {shown && (
        <div id={bodyId} className="grid gap-5 p-5">
          {children}
        </div>
      )}
    </section>
  );
}

/** Small pill for section headers. */
export function SectionBadge({ tone = "grey", children }: { tone?: "grey" | "red" | "green" | "blue"; children: React.ReactNode }) {
  const cls = {
    grey: "bg-mist-100 text-mist-700",
    red: "bg-status-danger-soft text-status-danger",
    green: "bg-status-success-soft text-status-success",
    blue: "bg-ocean-50 text-ocean-700",
  }[tone];
  return <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-adm-xs font-medium ${cls}`}>{children}</span>;
}

/**
 * Pinned to the bottom of the viewport while the form scrolls, in flow at the
 * end so it never hides the last field. Status left, actions right.
 */
export function StickyActions({ status, children }: { status?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="sticky bottom-0 z-20 pb-[max(0.25rem,env(safe-area-inset-bottom))] pt-2">
      <div className="flex flex-col gap-3 rounded-xl bg-mist-0 px-4 py-3 ring-1 ring-mist-200 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="min-w-0 text-adm-base text-mist-600">{status}</div>
        <div className="flex flex-wrap items-center gap-2 max-sm:[&>*]:flex-1">{children}</div>
      </div>
    </div>
  );
}
