"use client";

import Icon, { type IconName } from "../icons";

// Form primitives for the publishing screens (article editor, content).

export const inputCls =
  "block w-full rounded-md bg-mist-0 px-3 text-adm-base text-navy-900 ring-1 ring-inset ring-mist-300 placeholder:text-placeholder focus:outline-none focus:ring-2 focus:ring-ocean-600 aria-[invalid=true]:ring-status-danger-mark disabled:bg-mist-50 disabled:text-mist-600";

/** `n/limit`: amber past the soft (guidance) limit, red past the hard (schema) one. */
export function Counter({ value, hard, soft }: { value: number; hard?: number; soft?: number }) {
  const shown = soft ?? hard;
  if (shown === undefined) return null;
  const over = hard !== undefined && value > hard;
  const long = !over && soft !== undefined && value > soft;
  const tone = over ? "text-status-danger" : long ? "text-status-warning" : "text-mist-600";
  const tip = soft !== undefined && hard !== undefined ? `About ${soft} shown in search; ${hard} at most` : undefined;
  return (
    <span className={`shrink-0 text-adm-xs font-normal tabular-nums ${tone}`} title={tip}>
      {value}/{shown}
      {over && soft !== undefined && ` · max ${hard}`}
    </span>
  );
}

export type Issues = { blockers?: string[]; warnings?: string[] };

/** Publish blockers (amber, block the save) and editorial warnings (grey) under a field. */
export function FieldIssues({ blockers = [], warnings = [] }: Issues) {
  if (!blockers.length && !warnings.length) return null;
  return (
    <ul className="mt-1.5 grid gap-1">
      {blockers.map((b) => (
        <li key={b} className="flex gap-1.5 text-adm-xs font-medium text-status-warning">
          <Icon name="alert" className="mt-px size-3.5 shrink-0" />
          {b}
        </li>
      ))}
      {warnings.map((w) => (
        <li key={w} className="flex gap-1.5 text-adm-xs text-mist-600">
          <Icon name="help" className="mt-px size-3.5 shrink-0 text-mist-500" />
          {w}
        </li>
      ))}
    </ul>
  );
}

/**
 * Label row (label, "needed to publish" marker, counter or badge), the control,
 * then error, issues and helper. `id` ties the label and `${id}-error` to the control.
 */
export function Field({
  id,
  label,
  children,
  helper,
  error,
  issues,
  publishRequired,
  required,
  counter,
  aside,
  labelId,
  className = "",
}: {
  id?: string;
  /** For controls a <label htmlFor> can't name (rich text): reference this id */
  labelId?: string;
  label: React.ReactNode;
  children: React.ReactNode;
  helper?: React.ReactNode;
  error?: string;
  issues?: Issues;
  /** Required only to publish or schedule */
  publishRequired?: boolean;
  /** Required even for a draft */
  required?: boolean;
  counter?: React.ReactNode;
  /** Right of the label when there is no counter, e.g. a lock badge */
  aside?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`grid min-w-0 content-start gap-1.5 ${className}`}>
      <div className="flex min-h-5 items-center justify-between gap-3">
        <label id={labelId} htmlFor={id} className="text-adm-base font-medium text-navy-900">
          {label}
          {required && <span className="text-status-danger"> *</span>}
          {publishRequired && <span className="ml-1.5 text-adm-xs font-normal text-mist-600">Needed to publish</span>}
        </label>
        {counter ?? aside}
      </div>
      {children}
      {error && (
        <p id={id ? `${id}-error` : undefined} role="alert" className="text-adm-xs text-status-danger">
          {error}
        </p>
      )}
      {issues && <FieldIssues {...issues} />}
      {helper && <p className="text-adm-xs text-mist-600">{helper}</p>}
    </div>
  );
}

type InputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> & {
  value: string;
  onChange: (v: string) => void;
};

export function TextInput({ value, onChange, className = "", ...rest }: InputProps) {
  return <input {...rest} value={value} onChange={(e) => onChange(e.target.value)} className={`${inputCls} h-10 ${className}`} />;
}

type AreaProps = Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange" | "value"> & {
  value: string;
  onChange: (v: string) => void;
};

export function TextArea({ value, onChange, className = "", rows = 3, ...rest }: AreaProps) {
  return (
    <textarea {...rest} rows={rows} value={value} onChange={(e) => onChange(e.target.value)} className={`${inputCls} resize-y py-2 leading-normal ${className}`} />
  );
}

export function Select({
  value,
  onChange,
  children,
  id,
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
  id?: string;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={`${inputCls} h-10 appearance-none pr-9`}>
        {children}
      </select>
      <Icon name="chevronDown" className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-mist-500" />
    </div>
  );
}

/** Checkbox row with a 40px hit area. */
export function CheckRow({
  id,
  checked,
  onChange,
  label,
  hint,
}: {
  id?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  label: React.ReactNode;
  hint?: React.ReactNode;
}) {
  return (
    <label htmlFor={id} className="flex min-h-10 cursor-pointer items-start gap-3 py-1">
      <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 size-4 shrink-0 accent-ocean-600" />
      <span className="min-w-0">
        <span className="block text-adm-base font-medium text-navy-900">{label}</span>
        {hint && <span className="block text-adm-xs text-mist-600">{hint}</span>}
      </span>
    </label>
  );
}

/** Field group inside a Panel body: a small heading, then the fields. */
export function Group({ title, icon, description, children }: { title: string; icon?: IconName; description?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="grid gap-4">
      <div>
        <p className="flex items-center gap-2 text-adm-base font-semibold text-navy-900">
          {icon && <Icon name={icon} className="size-4 text-mist-500" />}
          {title}
        </p>
        {description && <p className="mt-0.5 text-adm-xs text-mist-600">{description}</p>}
      </div>
      {children}
    </div>
  );
}
