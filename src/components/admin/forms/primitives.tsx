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
        "overflow-hidden rounded-[var(--adm-radius-card)] border border-[var(--adm-line)] bg-[var(--adm-surface)]",
        className,
      )}
    >
      <header className="flex items-start justify-between gap-4 border-b border-[var(--adm-line-soft)] px-4 py-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          {/* A plain muted glyph, not a tinted tile. The chip was decoration, it coloured every section header the same accent regardless of
              what the section was, so it identified nothing. */}
          <Icon className="size-5 flex-none text-[var(--adm-ink-subtle)]" strokeWidth={1.75} />
          <div className="min-w-0">
            <h3 className="text-adm-md font-semibold text-[var(--adm-ink)]">{title}</h3>
            {description && (
              <p className="mt-0.5 text-adm-xs leading-relaxed text-[var(--adm-ink-subtle)]">{description}</p>
            )}
          </div>
        </div>
        {action}
      </header>
      <div className="p-4 sm:p-5">{children}</div>
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
        <span className="text-adm-base font-medium text-[var(--adm-ink-mute)]">
          {label}
          {required && (
            <span className="ml-1 text-[var(--adm-danger-ink)]" aria-label="required">
              *
            </span>
          )}
        </span>
        {hint && <span className="text-adm-xs font-normal text-[var(--adm-ink-subtle)]">{hint}</span>}
      </label>
      {children}
      {error ? (
        <p
          id={errorId}
          role="alert"
          className="mt-2 flex items-center gap-1.5 text-adm-xs font-medium text-[var(--adm-danger-ink)]"
        >
          <IconAlert className="h-3.5 w-3.5 flex-none" aria-hidden="true" />
          {error}
        </p>
      ) : helper ? (
        <p className="mt-2 text-adm-xs leading-snug text-[var(--adm-ink-subtle)]">{helper}</p>
      ) : null}
    </div>
  );
}

// ── Shared control classes ──────────────────────────────────────────────────────

const controlBase =
  "w-full rounded-[var(--adm-radius-input)] border border-[var(--adm-line-input)] bg-[var(--adm-surface)] text-adm-base text-[var(--adm-ink)] transition-colors " +
  "shadow-[inset_0_1px_2px_rgba(16,24,40,0.03)] placeholder:text-[var(--adm-ink-subtle)] " +
  "focus:outline-none focus:border-[var(--adm-accent)] focus:ring-2 focus:ring-[var(--adm-focus-ring)] " +
  "hover:border-[var(--adm-ink-subtle)] disabled:border-[var(--adm-line)] disabled:cursor-not-allowed disabled:bg-[var(--adm-surface-sunken)] disabled:text-[var(--adm-ink-subtle)] " +
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
      {/* Text, not type=number, so "$75" and "1,200" can be typed; toNumber() parses them. */}
      <FormInput
        type="text"
        inputMode="decimal"
        autoComplete="off"
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
      className={cn(controlBase, "resize-y px-3 py-2 leading-relaxed", className)}
    />
  );
}

// ── Segmented choice ─────────────────────────────────────────────────────────
// A short, mutually exclusive set shown all at once instead of behind a select.

export function SegmentedChoice<V extends string>({
  id,
  label,
  value,
  options,
  onChange,
  className,
}: {
  id?: string;
  label: string;
  value: V;
  options: { value: V; label: string }[];
  onChange: (value: V) => void;
  className?: string;
}) {
  const refs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const move = (from: number, step: number) => {
    const next = (from + step + options.length) % options.length;
    onChange(options[next].value);
    refs.current[next]?.focus();
  };
  const anyOn = options.some((o) => o.value === value);
  return (
    <div
      id={id}
      role="radiogroup"
      aria-label={label}
      className={cn(
        "flex h-10 w-full rounded-[var(--adm-radius-input)] border border-[var(--adm-line-control)] bg-[var(--adm-surface-sunken)] p-0.5",
        className,
      )}
    >
      {options.map((o, i) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            ref={(el) => { refs.current[i] = el; }}
            type="button"
            role="radio"
            aria-checked={on}
            tabIndex={on || (!anyOn && i === 0) ? 0 : -1}
            onClick={() => onChange(o.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); move(i, 1); }
              if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); move(i, -1); }
            }}
            className={cn(
              "flex-1 whitespace-nowrap rounded-[calc(var(--adm-radius-input)-2px)] px-3 text-adm-xs transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--adm-focus-ring)]",
              on
                ? "bg-[var(--adm-surface)] font-semibold text-[var(--adm-ink)] shadow-[var(--adm-shadow-sm)]"
                : "font-medium text-[var(--adm-ink-mute)] hover:text-[var(--adm-ink)]",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

// ── People pickers ───────────────────────────────────────────────────────────

export interface AssigneeUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

function RoleChip({ role }: { role: string }) {
  return (
    <span className="flex-none rounded-[var(--adm-radius-chip)] bg-[var(--adm-surface-2)] px-2 py-0.5 text-adm-xs font-medium capitalize text-[var(--adm-ink-mute)]">
      {role}
    </span>
  );
}

/** Search box over the roster. `exclude` hides people already placed. */
function PeopleSearch({
  id,
  users,
  exclude,
  placeholder,
  onPick,
}: {
  id?: string;
  users: AssigneeUser[];
  exclude: string[];
  placeholder: string;
  onPick: (user: AssigneeUser) => void;
}) {
  const [search, setSearch] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const q = search.trim().toLowerCase();
  const filtered = users.filter(
    (u) => !exclude.includes(u.id) && (!q || u.name?.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)),
  );
  const pick = (u: AssigneeUser) => { onPick(u); setSearch(""); setOpen(false); };

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--adm-ink-subtle)]" />
      <input
        id={id}
        type="text"
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-label={placeholder}
        value={search}
        onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
          // Enter takes the top match rather than submitting the form.
          if (e.key === "Enter") {
            e.preventDefault();
            if (open && filtered[0]) pick(filtered[0]);
          }
        }}
        placeholder={placeholder}
        className={cn(controlBase, "h-10 pl-9 pr-3")}
      />
      {open && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1.5 max-h-60 overflow-y-auto rounded-[var(--adm-radius-card)] border border-[var(--adm-line)] bg-[var(--adm-surface)] py-1 shadow-[var(--adm-shadow-pop)]">
          {filtered.length === 0 ? (
            <p className="px-3 py-3 text-adm-xs text-[var(--adm-ink-subtle)]">
              {users.length === 0 ? "No team members to choose from." : "No one matches that search."}
            </p>
          ) : filtered.map((u) => (
            <button
              key={u.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => pick(u)}
              className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-[var(--adm-accent-tint)]"
            >
              <Avatar name={u.name} email={u.email} size="sm" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-adm-base font-medium text-[var(--adm-ink)]">{u.name || u.email}</span>
                <span className="block truncate text-adm-xs text-[var(--adm-ink-subtle)]">{u.email}</span>
              </span>
              <RoleChip role={u.role} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** One placed person: avatar, name, email, role and a remove control. */
function PersonRow({
  name,
  email,
  role,
  onRemove,
}: {
  name: string;
  email?: string;
  role?: string;
  onRemove: () => void;
}) {
  return (
    <li className="flex items-center gap-3 px-3 py-2">
      <Avatar name={name} email={email || ""} size="sm" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-adm-base font-medium text-[var(--adm-ink)]">{name}</span>
        {email && email !== name && <span className="block truncate text-adm-xs text-[var(--adm-ink-subtle)]">{email}</span>}
      </span>
      {role && <RoleChip role={role} />}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${name}`}
        title={`Remove ${name}`}
        className="flex-none rounded-[var(--adm-radius-control)] p-1 text-[var(--adm-ink-subtle)] transition-colors hover:bg-[var(--adm-danger-soft)] hover:text-[var(--adm-danger-ink)]"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </li>
  );
}

const PEOPLE_LIST =
  "divide-y divide-[var(--adm-line-soft)] rounded-[var(--adm-radius-input)] border border-[var(--adm-line)] bg-[var(--adm-surface)]";

/** One person or none. The chosen person shows as a row; removing them brings the search back. */
export function PersonPicker({
  id,
  users,
  selectedId,
  selectedName,
  selectedEmail,
  placeholder = "Search team members…",
  onChange,
}: {
  id?: string;
  users: AssigneeUser[];
  selectedId: string;
  selectedName?: string;
  selectedEmail?: string;
  placeholder?: string;
  onChange: (user: AssigneeUser | null) => void;
}) {
  if (!selectedId) return <PeopleSearch id={id} users={users} exclude={[]} placeholder={placeholder} onPick={onChange} />;
  const u = users.find((r) => r.id === selectedId);
  const name = u?.name || selectedName || u?.email || selectedEmail || "Unknown";
  return (
    <ul className={PEOPLE_LIST}>
      <PersonRow name={name} email={u?.email || selectedEmail} role={u?.role} onRemove={() => onChange(null)} />
    </ul>
  );
}

interface AssigneePickerProps {
  id?: string;
  users: AssigneeUser[];
  selectedIds: string[];
  selectedNames: string[];
  selectedEmails: string[];
  /** People placed elsewhere on the form, e.g. the manager, kept out of the search. */
  exclude?: string[];
  onToggle: (user: AssigneeUser) => void;
}

export function AssigneePicker({
  id,
  users,
  selectedIds,
  selectedNames,
  selectedEmails,
  exclude = [],
  onToggle,
}: AssigneePickerProps) {
  return (
    <div className="space-y-2">
      {selectedIds.length > 0 && (
        <ul className={PEOPLE_LIST}>
          {selectedIds.map((sid, idx) => {
            const u = users.find((r) => r.id === sid);
            const name = selectedNames[idx] || u?.name || u?.email || sid;
            const email = u?.email || selectedEmails[idx];
            return (
              <PersonRow
                key={sid}
                name={name}
                email={email}
                role={u?.role}
                onRemove={() => onToggle(u ?? { id: sid, name, email: email || "", role: "" })}
              />
            );
          })}
        </ul>
      )}
      <PeopleSearch
        id={id}
        users={users}
        exclude={[...selectedIds, ...exclude]}
        placeholder={selectedIds.length ? "Add another team member…" : "Search team members…"}
        onPick={onToggle}
      />
    </div>
  );
}
