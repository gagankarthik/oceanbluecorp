"use client";

import * as React from "react";
import Icon from "@/components/portal/icons";
import { ProgressBar } from "@/components/portal/kit";

// Building blocks for the stepped job editor: the stepper and the save-state line.

export interface StepDef {
  id: string;
  label: string;
}

/**
 * Connected step markers (lg and up) or "Step n of N" with a bar (below).
 * Steps up to `reachable` are buttons; later ones are inert.
 */
export function Stepper({
  steps,
  current,
  reachable,
  invalid = [],
  onGo,
}: {
  steps: StepDef[];
  current: number;
  /** Highest index that may be opened */
  reachable: number;
  /** Indexes with an error showing */
  invalid?: number[];
  onGo: (index: number) => void;
}) {
  return (
    <nav aria-label="Form steps">
      <div className="lg:hidden">
        {/* The step's own heading follows, so the name is not repeated here. */}
        <p className="flex items-baseline justify-between gap-3 text-adm-base text-mist-600">
          <span className="tabular-nums">
            Step {current + 1} of {steps.length}
          </span>
          {current < steps.length - 1 && <span>Next: {steps[current + 1].label}</span>}
        </p>
        <div className="mt-2">
          <ProgressBar value={((current + 1) / steps.length) * 100} />
        </div>
      </div>
      <ol className="hidden items-center lg:flex">
        {steps.map((s, i) => {
          const done = i < current;
          const on = i === current;
          const bad = invalid.includes(i);
          const can = i <= reachable && !on;
          const marker = (
            <>
              <span
                aria-hidden
                className={`grid size-7 shrink-0 place-items-center rounded-full text-adm-xs font-semibold tabular-nums ${
                  bad
                    ? "bg-mist-0 text-status-danger ring-2 ring-inset ring-status-danger-mark"
                    : on
                      ? "bg-ocean-600 text-white"
                      : done
                        ? "bg-ocean-50 text-ocean-700 ring-1 ring-inset ring-ocean-200"
                        : "bg-mist-0 text-mist-600 ring-1 ring-inset ring-mist-300"
                }`}
              >
                {done && !bad ? <Icon name="check" className="size-4" /> : i + 1}
              </span>
              <span className={`whitespace-nowrap text-adm-base ${on ? "font-semibold text-navy-900" : "text-mist-700"}`}>{s.label}</span>
            </>
          );
          return (
            <li key={s.id} className={`flex items-center ${i < steps.length - 1 ? "flex-1" : ""}`}>
              {can ? (
                <button type="button" onClick={() => onGo(i)} className="flex min-h-10 items-center gap-2 rounded-lg px-1 hover:text-navy-900">
                  {marker}
                </button>
              ) : (
                <span aria-current={on ? "step" : undefined} className="flex min-h-10 items-center gap-2 px-1">
                  {marker}
                  {bad && <span className="sr-only">(has errors)</span>}
                </span>
              )}
              {i < steps.length - 1 && <span aria-hidden className={`mx-3 h-px min-w-6 flex-1 ${i < current ? "bg-ocean-300" : "bg-mist-300"}`} />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export type SaveState =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "saved"; at: Date }
  | { kind: "error"; message: string };

const clock = (d: Date) => d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }).toLowerCase();

/** "Saved 2:14 pm", announced politely. */
export function SaveStateLine({ state, className = "" }: { state: SaveState; className?: string }) {
  return (
    <p aria-live="polite" className={`text-adm-base tabular-nums ${state.kind === "error" ? "text-status-danger" : "text-mist-600"} ${className}`}>
      {state.kind === "saving" ? "Saving…" : state.kind === "saved" ? `Saved ${clock(state.at)}` : state.kind === "error" ? state.message : ""}
    </p>
  );
}
