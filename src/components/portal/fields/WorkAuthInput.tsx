"use client";

import {
  WORK_AUTH_GROUPS, WORK_AUTH_OPTIONS, workAuthExpires, workAuthMeta, workAuthNeedsSponsorship,
} from "@/components/portal/console/theme";
import { pastDateWarning } from "@/lib/form-validation";
import { CheckRow, Field, NativeSelect, Notice, TextInput } from "./base";

export type WorkAuthValue = { workAuthorization: string; visaExpiry: string; visaSponsorshipRequired: boolean };

/** What the chosen authorization means for an offer, in one line. */
export function workAuthNote(value: string): { tone: "success" | "warning"; text: string } | null {
  if (!value) return null;
  const meta = workAuthMeta(value);
  if (meta?.sponsorship === "none") return { tone: "success", text: "Permanent US work authorization. No sponsorship needed." };
  if (meta?.sponsorship === "transfer") return { tone: "warning", text: "Already sponsored. A new employer files a transfer before the start date." };
  if (value === "OPT" || value === "CPT") return { tone: "warning", text: "OPT and CPT are time-limited. Check the expiry before extending an offer." };
  if (meta?.sponsorship === "required" && meta.timeLimited) return { tone: "warning", text: "Time-limited. Sponsorship is needed to continue past the expiry." };
  return { tone: "warning", text: "Verify authorization documents before extending an offer." };
}

/**
 * Grouped visa select. Choosing a visa sets "Requires sponsorship" from the
 * visa type (still overridable); the expiry appears only for time-limited ones.
 */
export function WorkAuthInput({
  value,
  onChange,
  idPrefix = "wa",
}: {
  value: WorkAuthValue;
  onChange: (patch: Partial<WorkAuthValue>) => void;
  idPrefix?: string;
}) {
  const showExpiry = workAuthExpires(value.workAuthorization);
  const legacy = !!value.workAuthorization && !WORK_AUTH_OPTIONS.includes(value.workAuthorization);
  const note = workAuthNote(value.workAuthorization);

  const pick = (next: string) => {
    const patch: Partial<WorkAuthValue> = { workAuthorization: next };
    // Known types decide the flag; clearing or a legacy value leaves it as is.
    if (workAuthMeta(next)) patch.visaSponsorshipRequired = workAuthNeedsSponsorship(next);
    onChange(patch);
  };

  return (
    <div className="grid gap-4">
      <div className={`grid gap-5 ${showExpiry ? "sm:grid-cols-[minmax(0,1fr)_12rem]" : ""}`}>
        <Field label="Visa or authorization" htmlFor={`${idPrefix}-type`}>
          <NativeSelect id={`${idPrefix}-type`} value={value.workAuthorization} onChange={(e) => pick(e.target.value)}>
            <option value="">Select…</option>
            {WORK_AUTH_GROUPS.map((g) => (
              <optgroup key={g.label} label={g.label}>
                {g.options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </optgroup>
            ))}
            {legacy && <option value={value.workAuthorization}>{value.workAuthorization}</option>}
          </NativeSelect>
        </Field>
        {showExpiry && (
          <Field
            label="Expiry date"
            htmlFor={`${idPrefix}-expiry`}
            warning={pastDateWarning(value.visaExpiry, "This authorization has expired. Confirm the current status with the candidate.")}
          >
            <TextInput id={`${idPrefix}-expiry`} type="date" className="tabular-nums" value={value.visaExpiry} onChange={(e) => onChange({ visaExpiry: e.target.value })} />
          </Field>
        )}
      </div>
      <CheckRow
        id={`${idPrefix}-sponsor`}
        checked={value.visaSponsorshipRequired}
        onChange={(v) => onChange({ visaSponsorshipRequired: v })}
        title="Requires sponsorship"
        description={workAuthMeta(value.workAuthorization) ? "Set from the visa type. Change it if this candidate is different." : undefined}
      />
      {note && <Notice tone={note.tone}>{note.text}</Notice>}
    </div>
  );
}
