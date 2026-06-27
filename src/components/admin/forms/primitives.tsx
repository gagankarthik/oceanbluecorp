"use client";

import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { tones, type Tone } from "@/components/admin/theme";

// ── Section wrapper ────────────────────────────────────────────────────────────
// A calm, scannable card section: tinted icon chip + title (+ optional description)
// in a soft header band, content padded below.

interface SectionProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  tone?: Tone;
  /** Optional slot rendered on the right of the header (e.g. a small action). */
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function FormSection({
  icon: Icon,
  title,
  description,
  tone = "blue",
  action,
  children,
  className,
}: SectionProps) {
  const t = tones[tone];
  return (
    <section className={cn("overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm", className)}>
      <header className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <div className="flex items-start gap-2.5">
          <span className={cn("mt-0.5 grid h-7 w-7 flex-shrink-0 place-items-center rounded-lg", t.bg)}>
            <Icon className={cn("h-4 w-4", t.text)} strokeWidth={2} />
          </span>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-slate-900">{title}</h3>
            {description && <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{description}</p>}
          </div>
        </div>
        {action}
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

// ── Field wrapper ──────────────────────────────────────────────────────────────

interface FieldProps {
  label: string;
  required?: boolean;
  hint?: string;
  /** Validation error message — shown below the control in rose text. */
  error?: string;
  /** Helper text shown below the control (only if no error). */
  helper?: string;
  /** Unique id forwarded to the label's htmlFor — improves screen-reader pairing. */
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
  fullWidth?: boolean;
}

export function Field({ label, required, hint, error, helper, htmlFor, children, className, fullWidth }: FieldProps) {
  const fieldId = htmlFor;
  const errorId = error && fieldId ? `${fieldId}-error` : undefined;
  return (
    <div className={cn(fullWidth && "col-span-full", className)}>
      <label
        htmlFor={fieldId}
        className="mb-1.5 flex items-baseline justify-between gap-2"
      >
        <span className="text-sm font-medium text-slate-700">
          {label}
          {required && (
            <span className="ml-0.5 text-rose-500" aria-label="required">
              *
            </span>
          )}
        </span>
        {hint && <span className="text-[11px] font-normal text-slate-400">{hint}</span>}
      </label>
      {children}
      {error ? (
        <p
          id={errorId}
          role="alert"
          className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-rose-600"
        >
          <span aria-hidden="true">⚠</span>
          {error}
        </p>
      ) : helper ? (
        <p className="mt-1.5 text-[11px] text-slate-400">{helper}</p>
      ) : null}
    </div>
  );
}

// ── Shared control classes ──────────────────────────────────────────────────────

const controlBase =
  "w-full rounded-lg border border-slate-200 bg-white text-sm text-slate-900 shadow-sm transition-colors " +
  "placeholder:text-slate-400 " +
  "focus:outline-none focus:border-[var(--hz-cobalt)] focus:ring-2 focus:ring-[rgba(29,78,216,0.2)] " +
  "hover:border-slate-300 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500 " +
  "aria-[invalid=true]:border-rose-400 aria-[invalid=true]:focus:ring-rose-200";

// ── Input ─────────────────────────────────────────────────────────────────────

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** When true, applies rose error ring. Pass the error message id to aria-describedby. */
  invalid?: boolean;
}

export const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  function FormInput({ className, invalid, ...props }, ref) {
    return (
      <input
        ref={ref}
        aria-invalid={invalid || undefined}
        {...props}
        className={cn(controlBase, "px-3 py-2", className)}
      />
    );
  },
);

// ── Money input (with $ prefix) ───────────────────────────────────────────────

export function MoneyInput({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-400">$</span>
      <FormInput
        type="number"
        step="0.01"
        min="0"
        className={cn("pl-7 tabular-nums", className)}
        {...props}
      />
    </div>
  );
}

// ── Select ────────────────────────────────────────────────────────────────────

export function FormSelect({
  children,
  className,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="group relative">
      <select
        {...props}
        className={cn(controlBase, "peer cursor-pointer appearance-none px-3 py-2.5 pr-11", className)}
      >
        {children}
      </select>
      <span className="pointer-events-none absolute right-1.5 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-md bg-slate-100 text-slate-500 transition-colors peer-hover:bg-slate-200/70 peer-focus:bg-[var(--hz-cobalt-100)] peer-focus:text-[var(--hz-cobalt)]">
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </span>
    </div>
  );
}

// ── Textarea ──────────────────────────────────────────────────────────────────

export function FormTextarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(controlBase, "resize-y px-3 py-2.5 leading-relaxed", className)}
    />
  );
}

// ── Assignee multi-select chip input ─────────────────────────────────────────

export interface AssigneeUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AssigneePickerProps {
  users: AssigneeUser[];
  selectedIds: string[];
  selectedNames: string[];
  selectedEmails: string[];
  onToggle: (user: AssigneeUser) => void;
}

export function AssigneePicker({
  users,
  selectedIds,
  selectedNames,
  selectedEmails,
  onToggle,
}: AssigneePickerProps) {
  const [search, setSearch] = React.useState("");
  const [open, setOpen] = React.useState(false);

  const filtered = users.filter(
    (u) =>
      !selectedIds.includes(u.id) &&
      (u.name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())),
  );

  return (
    <div>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Search team members…"
          className={cn(controlBase, "py-2.5 pl-9 pr-3")}
        />
        {open && filtered.length > 0 && (
          <div className="absolute left-0 right-0 top-full z-20 mt-1.5 max-h-52 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
            {filtered.map((u) => (
              <button
                key={u.id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => { onToggle(u); setSearch(""); setOpen(false); }}
                className="flex w-full items-center gap-3 border-b border-slate-100 px-3 py-2.5 text-left transition-colors last:border-0 hover:bg-slate-50"
              >
                <span className="grid h-7 w-7 flex-shrink-0 place-items-center rounded-full bg-[var(--hz-cobalt-100)] text-xs font-semibold text-[var(--hz-cobalt)]">
                  {(u.name || u.email)[0].toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">{u.name || u.email}</p>
                  <p className="truncate text-xs text-slate-500">{u.email}</p>
                </div>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold capitalize text-slate-600">{u.role}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedIds.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {selectedIds.map((id, idx) => {
            const u = users.find((r) => r.id === id);
            const name = selectedNames[idx] || u?.name || u?.email || id;
            return (
              <span
                key={id}
                className="inline-flex items-center gap-1 rounded-full border border-[var(--hz-cobalt-100)] bg-[var(--hz-cobalt-100)] py-1 pl-2.5 pr-1.5 text-xs font-medium text-[var(--hz-cobalt)]"
              >
                {name}
                <button
                  type="button"
                  onClick={() => u && onToggle(u)}
                  className="rounded-full p-0.5 transition-colors hover:bg-white/60"
                  aria-label={`Remove ${name}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
