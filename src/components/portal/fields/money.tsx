"use client";

import type { RateUnit } from "@/lib/aws/dynamodb";
import { isNumber, payOverBillWarning, toNumber } from "@/lib/form-validation";
import { RATE_UNIT_LABELS, formatRate, grossMarginPct } from "@/lib/pipeline-records";
import { Field, NativeSelect, TextInput } from "./base";

export const RATE_UNITS: RateUnit[] = ["hourly", "daily", "weekly", "monthly", "annual"];

/** Parsed amount, or undefined for blank or unreadable input. Accepts "$80,000" and "55/hr". */
export function moneyValue(v: string): number | undefined {
  return isNumber(v) ? toNumber(v) : undefined;
}

/**
 * Money as text with a $ prefix, so "$75" and "1,200" can be typed; parse with
 * moneyValue / toNumber. `suffix` shows the unit inside the field ("/hr").
 */
export function MoneyInput({ suffix, className = "", ...props }: React.InputHTMLAttributes<HTMLInputElement> & { suffix?: string }) {
  return (
    <div className="relative">
      <span aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-adm-base text-mist-600">
        $
      </span>
      <TextInput type="text" inputMode="decimal" {...props} className={`pl-7 tabular-nums ${suffix ? "pr-12" : ""} ${className}`} />
      {suffix && (
        <span aria-hidden className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-adm-base text-mist-600">
          {suffix}
        </span>
      )}
    </div>
  );
}

/** Amount plus its unit (/hr, /day, /wk, /mo, /yr). */
export function RateInput({
  id,
  label,
  amount,
  unit,
  onAmount,
  onUnit,
  error,
  invalid,
  placeholder,
}: {
  id: string;
  label: string;
  amount: string;
  unit: RateUnit;
  onAmount: (v: string) => void;
  /** Omit to show the unit as fixed text */
  onUnit?: (u: RateUnit) => void;
  error?: string;
  invalid?: Record<string, unknown>;
  placeholder?: string;
}) {
  return (
    <Field label={label} htmlFor={id} error={error}>
      <div className="flex gap-2">
        <div className="min-w-0 flex-1">
          <MoneyInput id={id} {...invalid} value={amount} onChange={(e) => onAmount(e.target.value)} placeholder={placeholder} suffix={onUnit ? undefined : RATE_UNIT_LABELS[unit]} />
        </div>
        {onUnit && (
          <div className="w-24 shrink-0">
            <NativeSelect aria-label={`${label} unit`} value={unit} onChange={(e) => onUnit(e.target.value as RateUnit)}>
              {RATE_UNITS.map((u) => (
                <option key={u} value={u}>
                  {RATE_UNIT_LABELS[u]}
                </option>
              ))}
            </NativeSelect>
          </div>
        )}
      </div>
    </Field>
  );
}

/** Min and max side by side; each keeps its own error. */
export function RangeInput({
  ids,
  labels,
  min,
  max,
  onMin,
  onMax,
  errors = {},
  invalidProps = () => ({}),
  placeholders = {},
  suffix,
}: {
  ids: { min: string; max: string };
  labels: { min: string; max: string };
  min: string;
  max: string;
  onMin: (v: string) => void;
  onMax: (v: string) => void;
  errors?: { min?: string; max?: string };
  invalidProps?: (k: "min" | "max") => Record<string, unknown>;
  placeholders?: { min?: string; max?: string };
  suffix?: string;
}) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <Field label={labels.min} htmlFor={ids.min} error={errors.min}>
        <MoneyInput id={ids.min} {...invalidProps("min")} value={min} onChange={(e) => onMin(e.target.value)} placeholder={placeholders.min} suffix={suffix} />
      </Field>
      <Field label={labels.max} htmlFor={ids.max} error={errors.max}>
        <MoneyInput id={ids.max} {...invalidProps("max")} value={max} onChange={(e) => onMax(e.target.value)} placeholder={placeholders.max} suffix={suffix} />
      </Field>
    </div>
  );
}

/** Live gross margin for a bill and pay pair, plus the pay-over-bill warning. */
export function MarginPreview({ bill, pay, unit }: { bill: string; pay: string; unit?: RateUnit }) {
  const b = moneyValue(bill);
  const p = moneyValue(pay);
  if (b === undefined || p === undefined || b <= 0) return null;
  const pct = grossMarginPct({ billRate: b, payRate: p });
  if (pct === null) return null;
  const loss = !!payOverBillWarning(pay, bill);
  return (
    <p
      role="status"
      className={`rounded-lg px-3.5 py-2.5 text-adm-base font-medium tabular-nums ring-1 ring-inset ${
        loss ? "bg-status-danger-soft text-status-danger ring-status-danger-line" : "bg-status-success-soft text-status-success ring-status-success-line"
      }`}
    >
      Gross margin {pct.toFixed(1)}% · {unit ? formatRate(b - p, unit) : `$${(b - p).toFixed(2)}`} per {unit ? "unit" : "hour"}
      {loss && <span className="mt-0.5 block font-normal">Pay is above the bill rate, so this placement would run at a loss.</span>}
    </p>
  );
}
