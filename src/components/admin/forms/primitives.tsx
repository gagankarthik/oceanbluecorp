"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// ── Section wrapper ────────────────────────────────────────────────────────────

interface SectionProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormSection({ icon: Icon, title, description, children, className }: SectionProps) {
  return (
    <div className={cn("bg-white rounded-xl border border-gray-200 shadow-sm p-5", className)}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-4 h-4 text-blue-600 flex-shrink-0" />
        <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
      </div>
      {description && (
        <p className="text-xs text-gray-500 mb-4">{description}</p>
      )}
      {!description && <div className="mb-4" />}
      {children}
    </div>
  );
}

// ── Field wrapper ──────────────────────────────────────────────────────────────

interface FieldProps {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
  className?: string;
  fullWidth?: boolean;
}

export function Field({ label, required, hint, children, className, fullWidth }: FieldProps) {
  return (
    <div className={cn(fullWidth && "col-span-full", className)}>
      <label className="flex items-baseline justify-between mb-1.5">
        <span className="text-xs font-medium text-gray-600">
          {label}{required && <span className="text-rose-500 ml-0.5">*</span>}
        </span>
        {hint && <span className="text-[10px] text-gray-400 font-normal">{hint}</span>}
      </label>
      {children}
    </div>
  );
}

// ── Input ─────────────────────────────────────────────────────────────────────

export const FormInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function FormInput({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      {...props}
      className={cn(
        "w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white",
        "focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500",
        "transition-colors placeholder:text-gray-400 disabled:bg-gray-50 disabled:text-gray-500",
        className,
      )}
    />
  );
});

// ── Money input (with $ prefix) ───────────────────────────────────────────────

export function MoneyInput({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">$</span>
      <FormInput
        type="number"
        step="0.01"
        min="0"
        className={cn("pl-7", className)}
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
    <select
      {...props}
      className={cn(
        "w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white",
        "focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500",
        "transition-colors text-gray-700 disabled:bg-gray-50",
        className,
      )}
    >
      {children}
    </select>
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
      className={cn(
        "w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white resize-y",
        "focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500",
        "transition-colors placeholder:text-gray-400",
        className,
      )}
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
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Search team members…"
          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
        />
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        {open && filtered.length > 0 && (
          <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {filtered.map((u) => (
              <button
                key={u.id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => { onToggle(u); setSearch(""); setOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 text-left border-b border-gray-100 last:border-0"
              >
                <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-xs font-semibold text-blue-600 flex-shrink-0">
                  {(u.name || u.email)[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{u.name || u.email}</p>
                  <p className="text-xs text-gray-500 truncate">{u.email}</p>
                </div>
                <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded capitalize">{u.role}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedIds.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {selectedIds.map((id, idx) => {
            const u = users.find((r) => r.id === id);
            const name = selectedNames[idx] || u?.name || u?.email || id;
            return (
              <span
                key={id}
                className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-200"
              >
                {name}
                <button
                  type="button"
                  onClick={() => u && onToggle(u)}
                  className="p-0.5 hover:bg-blue-100 rounded-full transition-colors"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
