"use client";

import { useMemo } from "react";
import { RECRUITING_ROLES } from "@/lib/auth/config";
import { useUserDirectory, type DirectoryUser } from "@/hooks/use-console-data";
import Select, { type SelectOption } from "../Select";
import Icon from "../icons";
import { Avatar } from "../ui";

export type StaffPerson = { id: string; sub?: string; name: string; email: string; role: string };

/**
 * Staff who can work a requisition or a candidate. `keyBy` picks the identifier
 * a record stores: job teams and candidate owners use the directory id, tasks
 * use the Cognito sub.
 */
export function useStaff({
  roles = RECRUITING_ROLES as readonly string[],
  enabled = true,
  activeOnly = false,
}: { roles?: readonly string[]; enabled?: boolean; activeOnly?: boolean } = {}) {
  const dir = useUserDirectory(enabled);
  const people = useMemo<StaffPerson[]>(() => {
    const allow = new Set(roles.map(String));
    return (dir.users || [])
      .filter((u: DirectoryUser) => !!u.role && allow.has(u.role) && (!activeOnly || u.status === "active"))
      .map((u) => ({ id: u.id, sub: u.sub, name: u.name || u.email, email: u.email, role: u.role || "" }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [dir.users, roles, activeOnly]);
  return { people, loading: dir.isLoading, error: dir.error, reload: dir.reload };
}

const keyOf = (p: StaffPerson, by: "id" | "sub") => (by === "sub" ? p.sub ?? "" : p.id);

/**
 * One person or nobody, searchable. "Me" leads when `meKey` is set; a saved
 * value missing from the roster is kept as an option so it never blanks.
 */
export function StaffPicker({
  label,
  people,
  value,
  onChange,
  keyBy = "id",
  meKey,
  noneLabel = "Unassigned",
  allowNone = true,
  fallbackName,
  exclude = [],
  disabled,
}: {
  label: string;
  people: StaffPerson[];
  value: string;
  onChange: (key: string, person: StaffPerson | null) => void;
  keyBy?: "id" | "sub";
  /** The signed-in user's key; listed first as "Me" */
  meKey?: string;
  noneLabel?: string;
  allowNone?: boolean;
  /** Name for a saved value the roster doesn't contain */
  fallbackName?: string;
  exclude?: string[];
  disabled?: boolean;
}) {
  const options = useMemo<SelectOption[]>(() => {
    const list = people.filter((p) => keyOf(p, keyBy) && !exclude.includes(keyOf(p, keyBy)));
    const me = meKey ? list.find((p) => keyOf(p, keyBy) === meKey) : undefined;
    const rest = list.filter((p) => p !== me);
    const opts: SelectOption[] = [];
    if (allowNone) opts.push({ value: "", label: noneLabel });
    if (meKey) opts.push({ value: meKey, label: "Me", description: me?.email });
    for (const p of rest) opts.push({ value: keyOf(p, keyBy), label: p.name, description: `${p.email} · ${p.role}` });
    if (value && !opts.some((o) => o.value === value)) opts.push({ value, label: fallbackName || "Former teammate" });
    return opts;
  }, [people, keyBy, meKey, allowNone, noneLabel, exclude, value, fallbackName]);

  return (
    <Select
      label={label}
      variant="field"
      width="w-full min-w-64"
      value={value}
      options={options}
      searchable={options.length > 6}
      disabled={disabled}
      onChange={(k) => onChange(k, people.find((p) => keyOf(p, keyBy) === k) ?? null)}
    />
  );
}

/** Several people: chips with remove, then a searchable "Add" picker. */
export function StaffMultiPicker({
  label,
  people,
  values,
  names,
  onAdd,
  onRemove,
  keyBy = "id",
  exclude = [],
}: {
  label: string;
  people: StaffPerson[];
  values: string[];
  /** Saved names, index-aligned with values, for people no longer in the roster */
  names?: string[];
  onAdd: (person: StaffPerson) => void;
  onRemove: (key: string, index: number) => void;
  keyBy?: "id" | "sub";
  exclude?: string[];
}) {
  const left = people.filter((p) => !values.includes(keyOf(p, keyBy)) && !exclude.includes(keyOf(p, keyBy)));
  return (
    <div className="grid gap-2">
      {values.length > 0 && (
        <ul className="flex flex-wrap gap-1.5" aria-label={`${label}: ${values.length} chosen`}>
          {values.map((k, i) => {
            const p = people.find((x) => keyOf(x, keyBy) === k);
            const name = p?.name || names?.[i] || k;
            return (
              <li key={k} className="inline-flex h-9 max-w-full items-center gap-2 rounded-full bg-mist-0 pl-1 pr-1 ring-1 ring-inset ring-mist-300">
                <Avatar name={name} size="sm" />
                <span className="min-w-0 truncate text-adm-base font-medium text-navy-900">{name}</span>
                <button
                  type="button"
                  onClick={() => onRemove(k, i)}
                  aria-label={`Remove ${name}`}
                  title={`Remove ${name}`}
                  className="adm-hit grid size-7 shrink-0 place-items-center rounded-full text-mist-500 hover:bg-status-danger-soft hover:text-status-danger"
                >
                  <Icon name="x" className="size-3.5" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <Select
        label={label}
        variant="field"
        width="w-full min-w-64"
        value=""
        searchable={left.length > 6}
        options={[
          { value: "", label: values.length ? "Add another teammate…" : "Add a teammate…" },
          ...left.map((p) => ({ value: keyOf(p, keyBy), label: p.name, description: `${p.email} · ${p.role}` })),
        ]}
        onChange={(k) => {
          const p = left.find((x) => keyOf(x, keyBy) === k);
          if (p) onAdd(p);
        }}
      />
    </div>
  );
}
