"use client";

import { US_STATES } from "@/components/portal/console/theme";
import { WORKPLACES, WORKPLACE_LABEL, type Workplace } from "@/lib/workplace";
import { Choice, Field, NativeSelect, TextInput } from "./base";

export type LocationValue = {
  city: string;
  /** Two-letter code; legacy full names are normalised by the caller (normalizeState) */
  state: string;
  workplace?: Workplace;
  address?: string;
  zip?: string;
};

type Key = "city" | "address" | "zip";

/**
 * City plus US state (stored as the code), with optional workplace and
 * street/ZIP parts. Remote makes the city optional. One column on phones.
 */
export function LocationInput({
  value,
  onChange,
  ids,
  errors = {},
  invalidProps = () => ({}),
  workplace = false,
  address = false,
  cityRequired = false,
  limits = {},
}: {
  value: LocationValue;
  onChange: (patch: Partial<LocationValue>) => void;
  ids: { city: string; state: string; workplace?: string; address?: string; zip?: string };
  errors?: Partial<Record<Key, string>>;
  invalidProps?: (k: Key) => Record<string, unknown>;
  /** Show the On-site / Hybrid / Remote choice */
  workplace?: boolean;
  /** Show street address and ZIP */
  address?: boolean;
  /** Ignored when the workplace is remote */
  cityRequired?: boolean;
  limits?: Partial<Record<Key, number>>;
}) {
  const remote = value.workplace === "remote";
  const needCity = cityRequired && !remote;
  const unknownState = !!value.state && !US_STATES.some((s) => s.code === value.state);

  return (
    <div className="grid gap-5">
      {workplace && (
        <Field label="Workplace" htmlFor={ids.workplace}>
          <Choice
            id={ids.workplace}
            label="Workplace"
            value={value.workplace ?? "on-site"}
            options={WORKPLACES.map((w) => ({ value: w, label: WORKPLACE_LABEL[w] }))}
            onChange={(w) => onChange({ workplace: w })}
            className="sm:max-w-sm"
          />
        </Field>
      )}
      {address && (
        <Field label="Street address" htmlFor={ids.address} error={errors.address}>
          <TextInput
            id={ids.address}
            {...invalidProps("address")}
            maxLength={limits.address}
            value={value.address ?? ""}
            onChange={(e) => onChange({ address: e.target.value })}
            placeholder="123 Main Street"
          />
        </Field>
      )}
      <div className={`grid gap-5 ${address ? "sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_8rem]" : "sm:grid-cols-2"}`}>
        <Field
          label="City"
          htmlFor={ids.city}
          required={needCity}
          optional={!needCity && workplace}
          error={errors.city}
        >
          <TextInput
            id={ids.city}
            {...invalidProps("city")}
            maxLength={limits.city}
            value={value.city}
            onChange={(e) => onChange({ city: e.target.value })}
            placeholder={remote ? "Leave blank if anywhere" : "e.g. Columbus"}
          />
        </Field>
        <Field label="State" htmlFor={ids.state} optional={workplace}>
          <NativeSelect id={ids.state} value={value.state} onChange={(e) => onChange({ state: e.target.value })}>
            <option value="">Select state…</option>
            {US_STATES.map((s) => (
              <option key={s.code} value={s.code}>
                {s.name}
              </option>
            ))}
            {unknownState && <option value={value.state}>{value.state}</option>}
          </NativeSelect>
        </Field>
        {address && (
          <Field label="ZIP code" htmlFor={ids.zip} error={errors.zip}>
            <TextInput
              id={ids.zip}
              {...invalidProps("zip")}
              maxLength={limits.zip}
              inputMode="numeric"
              className="tabular-nums"
              value={value.zip ?? ""}
              onChange={(e) => onChange({ zip: e.target.value })}
              placeholder="78701"
            />
          </Field>
        )}
      </div>
    </div>
  );
}
