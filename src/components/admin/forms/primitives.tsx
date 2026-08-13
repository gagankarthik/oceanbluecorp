"use client";

import * as React from "react";
import type { IconComponent } from "../icons";
import { Search, X } from "lucide-react";
import { IconAlert } from "../icons";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/admin/avatar";

// ── Section wrapper ────────────────────────────────────────────────────────────
// A calm, scannable card section: tinted icon chip + title (+ optional description)
// in a soft header band, content padded below.

interface SectionProps {
  icon: IconComponent;
  title: string;
  description?: string;
  /** Optional slot rendered on the right of the header (e.g. a small action). */
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  /** Accepted for back-compat with older call sites; the redesigned header uses
   *  a plain muted glyph, so the tinted-chip tone is no longer applied. */
  tone?: string;
}

export function FormSection({
  icon: Icon,
  title,
  description,
  action,
  children,
  className,
}: SectionProps) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-[12px] border border-[var(--adm-line)] bg-[var(--adm-surface)] shadow-[var(--adm-shadow-sm)]",
        className,
      )}
    >
      <header className="flex items-start justify-between gap-4 border-b border-[var(--adm-line)] px-6 py-4">
        <div className="flex min-w-0 items-center gap-2.5">
          {/* A plain muted glyph, not a tinted tile. The chip was decoration, it coloured every section header the same accent regardless of
              what the section was, so it identified nothing. */}
          <Icon className="h-[18px] w-[18px] flex-none text-[var(--adm-ink-subtle)]" strokeWidth={1.75} />
          <div className="min-w-0">
            <h3 className="text-[15px] font-semibold text-[var(--adm-ink)]">{title}</h3>
            {description && (
              <p className="mt-0.5 text-[13px] leading-relaxed text-[var(--adm-ink-subtle)]">{description}</p>
            )}
          </div>
        </div>
        {action}
      </header>
      <div className="p-6">{children}</div>
    </section>
  );
}

// ── Field wrapper ──────────────────────────────────────────────────────────────

interface FieldProps {
  label: string;
  required?: boolean;
  hint?: string;
  /** Validation error message, shown below the control in rose text. */
  error?: string;
  /** Helper text shown below the control (only if no error). */
  helper?: string;
  /** Unique id forwarded to the label's htmlFor, improves screen-reader pairing. */
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
        className="mb-2 flex items-baseline justify-between gap-3"
      >
        <span className="text-[14px] font-medium text-[var(--adm-ink-mute)]">
          {label}
          {required && (
            <span className="ml-1 text-[var(--adm-danger)]" aria-label="required">
              *
            </span>
          )}
        </span>
        {hint && <span className="text-[12.5px] font-normal text-[var(--adm-ink-subtle)]">{hint}</span>}
      </label>
      {children}
      {error ? (
        <p
          id={errorId}
          role="alert"
          className="mt-2 flex items-center gap-1.5 text-[12.5px] font-medium text-[var(--adm-danger)]"
        >
          <IconAlert className="h-3.5 w-3.5 flex-none" aria-hidden="true" />
          {error}
        </p>
      ) : helper ? (
        <p className="mt-2 text-[12.5px] leading-snug text-[var(--adm-ink-subtle)]">{helper}</p>
      ) : null}
    </div>
  );
}

// ── Shared control classes ──────────────────────────────────────────────────────

const controlBase =
  "w-full rounded-[8px] border border-[var(--adm-line)] bg-[var(--adm-surface)] text-[14px] text-[var(--adm-ink)] transition-colors " +
  "shadow-[inset_0_1px_2px_rgba(16,24,40,0.03)] placeholder:text-[var(--adm-ink-subtle)] " +
  "focus:outline-none focus:border-[var(--adm-accent)] focus:ring-2 focus:ring-[var(--adm-focus-ring)] " +
  "hover:border-[var(--adm-line)] disabled:cursor-not-allowed disabled:bg-[var(--adm-surface-sunken)] disabled:text-[var(--adm-ink-subtle)] " +
  "aria-[invalid=true]:border-[var(--adm-danger)] aria-[invalid=true]:focus:ring-[var(--adm-danger-soft)]";

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
        // Default off, admin forms mostly capture third-party data (candidates,
        // clients), so the staffer's own browser autofill must not leak in.
        // Call sites for the user's OWN data can override with a real token.
        autoComplete="off"
        aria-invalid={invalid || undefined}
        {...props}
        className={cn(controlBase, "h-10 px-3", className)}
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
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-[var(--adm-ink-subtle)]">$</span>
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
    <div className="relative">
      <select
        autoComplete="off"
        {...props}
        className={cn(controlBase, "h-10 cursor-pointer appearance-none px-3 pr-9", className)}
      >
        {children}
      </select>
      {/* A plain chevron. This was a filled grey square that turned accent-blue
          on focus, a second, louder focus indicator competing with the ring
          the control already draws, and the sort of decorated control that
          reads as generated rather than designed. */}
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--adm-ink-subtle)]"
        fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
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
      autoComplete="off"
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
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--adm-ink-subtle)]" />
        <input
          type="text"
          autoComplete="off"
          aria-label="Search team members"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Search team members…"
          className={cn(controlBase, "h-10 pl-9 pr-3")}
        />
        {open && filtered.length > 0 && (
          <div className="absolute left-0 right-0 top-full z-20 mt-1.5 max-h-52 overflow-y-auto rounded-[6px] border border-[var(--adm-line)] bg-[var(--adm-surface)] shadow-lg">
            {filtered.map((u) => (
              <button
                key={u.id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => { onToggle(u); setSearch(""); setOpen(false); }}
                className="flex w-full items-center gap-3 border-b border-[var(--adm-line-soft)] px-3 py-2.5 text-left transition-colors last:border-0 hover:bg-[var(--adm-accent-tint)]"
              >
                <Avatar name={u.name} email={u.email} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[var(--adm-ink)]">{u.name || u.email}</p>
                  <p className="truncate text-xs text-[var(--adm-ink-subtle)]">{u.email}</p>
                </div>
                <span className="rounded-[4px] bg-[var(--adm-surface-2)] px-2 py-0.5 text-[10px] font-semibold capitalize text-[var(--adm-ink-mute)]">{u.role}</span>
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
                className="inline-flex items-center gap-1 rounded-[4px] border border-[var(--adm-accent-soft)] bg-[var(--adm-accent-soft)] py-1 pl-2.5 pr-1.5 text-xs font-medium text-[var(--adm-accent)]"
              >
                {name}
                <button
                  type="button"
                  onClick={() => u && onToggle(u)}
                  className="rounded-[4px] p-0.5 transition-colors hover:bg-white/60"
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
