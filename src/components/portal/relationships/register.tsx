"use client";

import { useState } from "react";
import { STATE_NAME, US_STATES, stateOf } from "@/components/portal/console/theme";
import Select from "../Select";
import { Avatar, Badge } from "../ui";

// The Clients / Vendors template: one register, two field sets.

export { stateOf };

/** "OH" → "Ohio"; unknown values pass through. */
export const stateName = (v?: string | null) => {
  const code = stateOf(v);
  return STATE_NAME.get(code) ?? code;
};

/** Inactive is a choice, not a fault: neutral grey. */
export function ActiveBadge({ active }: { active: boolean }) {
  return (
    <Badge tone={active ? "green" : "grey"} dot>
      {active ? "Active" : "Inactive"}
    </Badge>
  );
}

/** A KPI card that applies its filter to the table; pressed while that filter is on. */
export function KpiFilter({ active, onClick, label, children }: { active: boolean; onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={label}
      title={label}
      className={`block w-full rounded-lg text-left transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-md motion-reduce:hover:translate-y-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ocean-600 ${
        active ? "ring-2 ring-ocean-600 ring-offset-2 ring-offset-mist-50" : ""
      }`}
    >
      {children}
    </button>
  );
}

type TableState = { query: string; filters: Record<string, string> };

/**
 * Lets KPI cards drive a DataTable's filters: the table reports its state, and
 * a toggle remounts it (`key`) with the new filter and the same search.
 */
export function useTablePreset() {
  const [state, setState] = useState<TableState>({ query: "", filters: {} });
  const [preset, setPreset] = useState<TableState & { key: number }>({ key: 0, query: "", filters: {} });
  return {
    key: preset.key,
    table: { initialQuery: preset.query, initialFilters: preset.filters, onStateChange: setState },
    isOn: (k: string, v: string) => state.filters[k] === v,
    toggle: (k: string, v: string) =>
      setPreset((p) => ({ key: p.key + 1, query: state.query, filters: { ...state.filters, [k]: state.filters[k] === v ? "All" : v } })),
  };
}

/** Drawer head: avatar, name, a line under it, badges. */
export function RecordHead({ name, sub, badges }: { name: string; sub?: React.ReactNode; badges?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4">
      <Avatar name={name} size="lg" />
      <div className="min-w-0">
        <p className="truncate text-adm-md font-semibold text-navy-900">{name}</p>
        {sub && <p className="truncate text-adm-base text-mist-600">{sub}</p>}
        {badges && <div className="mt-2 flex flex-wrap gap-1.5">{badges}</div>}
      </div>
    </div>
  );
}

export function RecordStats({ items }: { items: { k: string; v: React.ReactNode }[] }) {
  return (
    <dl className="grid grid-cols-3 gap-3">
      {items.map((s) => (
        <div key={s.k} className="min-w-0 rounded-lg bg-mist-50 p-3">
          <dt className="text-adm-xs text-mist-600">{s.k}</dt>
          <dd className="mt-1 truncate text-adm-md font-semibold tabular-nums text-navy-900">{s.v}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Label + control + error/hint, for controls that aren't native inputs (Select). */
export function FieldShell({ label, required, error, hint, className = "", children }: { label: string; required?: boolean; error?: string; hint?: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={`text-adm-base font-medium text-navy-900 ${className}`}>
      <p className="mb-1.5">
        {label}
        {required && <span className="text-status-danger"> *</span>}
      </p>
      {children}
      {error ? (
        <span role="alert" className="mt-1 block text-adm-xs font-normal text-status-danger">
          {error}
        </span>
      ) : (
        hint && <span className="mt-1 block text-adm-xs font-normal text-mist-600">{hint}</span>
      )}
    </div>
  );
}

/** US state picker; stores the code. A legacy value it can't map stays selectable. */
export function StateField({ value, onChange, error, className }: { value: string; onChange: (v: string) => void; error?: string; className?: string }) {
  const known = !value || US_STATES.some((s) => s.code === value);
  return (
    <FieldShell label="State" error={error} className={className}>
      <Select
        label="State"
        showLabel={false}
        variant="field"
        width="w-full"
        searchable
        value={value}
        onChange={onChange}
        options={[
          { value: "", label: "Choose a state" },
          ...(known ? [] : [{ value, label: value, description: "As entered" }]),
          ...US_STATES.map((s) => ({ value: s.code, label: s.name, description: s.code })),
        ]}
      />
    </FieldShell>
  );
}

/** "Roles" cell: N open of M. */
export function RoleCount({ open = 0, all = 0 }: { open?: number; all?: number }) {
  return (
    <span className="whitespace-nowrap tabular-nums">
      <span className="font-medium">{open}</span>
      <span className="text-mist-600"> open of {all}</span>
    </span>
  );
}
