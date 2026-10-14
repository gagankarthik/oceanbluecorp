"use client";

import { BENCH_STAGES, BOARD, STAGE_DOT, STAGE_LABEL, type Stage } from "../recruiting/model";
import Icon from "../icons";

/** Pipeline stages, or the bench set; a legacy value stays selectable so it never blanks. */
export function stageOptions(current: string, set: "pipeline" | "bench" | "both" = "pipeline"): Stage[] {
  const base: Stage[] = set === "bench" ? [...BENCH_STAGES] : set === "both" ? ["active", "inactive", ...BOARD] : [...BOARD];
  return current && !base.includes(current as Stage) ? [current as Stage, ...base] : base;
}

/**
 * The one stage control: native select (keyboard and phone pickers) with the
 * stage's dot. `size="sm"` for table rows. Undo lives with the caller's toast.
 */
export function StageSelect({
  id,
  value,
  onChange,
  set = "pipeline",
  size = "md",
  label = "Stage",
  disabled,
}: {
  id?: string;
  value: string;
  onChange: (s: Stage) => void;
  set?: "pipeline" | "bench" | "both";
  size?: "sm" | "md";
  /** Accessible name when there is no visible label */
  label?: string;
  disabled?: boolean;
}) {
  const dot = STAGE_DOT[value as Stage] ?? "#99a2af";
  const h = size === "sm" ? "h-8 text-[13px] pl-7 pr-8" : "h-10 text-[14px] pl-8 pr-9";
  return (
    <div className={`relative ${size === "sm" ? "w-36" : "w-full"}`} onClick={(e) => e.stopPropagation()}>
      <span aria-hidden className={`pointer-events-none absolute top-1/2 size-2 -translate-y-1/2 rounded-full ${size === "sm" ? "left-2.5" : "left-3"}`} style={{ background: dot }} />
      <select
        id={id}
        aria-label={id ? undefined : label}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value as Stage)}
        className={`block w-full cursor-pointer appearance-none rounded-lg bg-mist-0 font-medium text-navy-900 ring-1 ring-inset ring-mist-300 hover:ring-mist-400 focus:outline-none focus:ring-2 focus:ring-ocean-600 disabled:cursor-wait disabled:opacity-60 ${h}`}
      >
        {stageOptions(value, set).map((s) => (
          <option key={s} value={s}>
            {STAGE_LABEL[s] ?? s}
          </option>
        ))}
      </select>
      <Icon name="chevronDown" className={`pointer-events-none absolute top-1/2 size-4 -translate-y-1/2 text-mist-500 ${size === "sm" ? "right-2" : "right-3"}`} />
    </div>
  );
}
