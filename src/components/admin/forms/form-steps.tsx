"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

// A long form as numbered steps with a progress rail. Steps are sections on
// one page, not a wizard: everything stays visible and editable.

export type StepState = "done" | "todo" | "optional";

export interface StepInfo {
  id: string;
  title: string;
  state: StepState;
  required?: boolean;
}

function StepBadge({ step, state }: { step: number; state: StepState }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid h-6 w-6 flex-none place-items-center rounded-full text-adm-xs font-semibold tabular-nums transition-colors duration-200",
        state === "done"
          ? "bg-[var(--adm-accent)] text-white"
          : "border border-[var(--adm-line-control)] bg-[var(--adm-surface)] text-[var(--adm-ink-mute)]",
      )}
    >
      {state === "done" ? <Check className="adm-step-tick h-3.5 w-3.5" strokeWidth={3} /> : step}
    </span>
  );
}

const STATE_TEXT: Record<StepState, string> = { done: "Complete", todo: "Required", optional: "Optional" };

/** One numbered section of the form. */
export function StepCard({
  id,
  step,
  title,
  description,
  state,
  children,
}: {
  id: string;
  step: number;
  title: string;
  description?: string;
  state: StepState;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="scroll-mt-20 min-w-0 rounded-[8px] border border-[var(--adm-line)] bg-[var(--adm-surface)] shadow-[var(--adm-shadow-sm)]"
    >
      <header className="flex items-start gap-3 border-b border-[var(--adm-line-soft)] px-4 py-3">
        <StepBadge step={step} state={state} />
        <div className="min-w-0 flex-1">
          <h2 id={`${id}-title`} className="text-adm-base font-semibold leading-6 tracking-[-0.01em] text-[var(--adm-ink)]">{title}</h2>
          {description && <p className="text-adm-xs leading-snug text-[var(--adm-ink-subtle)]">{description}</p>}
        </div>
        <span
          className={cn(
            "mt-0.5 flex-none text-adm-xs font-medium",
            state === "done" ? "text-[var(--adm-success-ink)]" : state === "todo" ? "text-[var(--adm-ink-mute)]" : "text-[var(--adm-ink-subtle)]",
          )}
        >
          {STATE_TEXT[state]}
        </span>
      </header>
      <div className="p-4">{children}</div>
    </section>
  );
}

/** The section in view, for the rail's highlight. */
export function useActiveStep(ids: string[]): string | undefined {
  const [active, setActive] = React.useState<string | undefined>(ids[0]);
  const key = ids.join("|");
  React.useEffect(() => {
    const els = key.split("|").map((id) => document.getElementById(id)).filter((el): el is HTMLElement => !!el);
    if (!els.length || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        const top = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (top) setActive(top.target.id);
      },
      // A section counts once it reaches the upper third, under the sticky top bar.
      { rootMargin: "-72px 0px -60% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [key]);
  return active;
}

export function jumpToStep(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
  el.querySelector<HTMLElement>("input, select, textarea, [contenteditable=true], button[role=radio]")?.focus({ preventScroll: true });
}

/** Progress over the required steps, then every step as a jump link. */
export function StepRail({
  steps,
  active,
  summary,
  footer,
  className,
}: {
  steps: StepInfo[];
  active?: string;
  /** Scrolls with the step list. */
  summary?: React.ReactNode;
  /** Pinned to the bottom, so the primary action is always in reach. */
  footer?: React.ReactNode;
  className?: string;
}) {
  const required = steps.filter((s) => s.required);
  const doneRequired = required.filter((s) => s.state === "done").length;
  const pct = required.length ? Math.round((doneRequired / required.length) * 100) : 100;

  return (
    <aside className={cn("flex flex-col rounded-[8px] border border-[var(--adm-line)] bg-[var(--adm-surface)] shadow-[var(--adm-shadow-sm)]", className)}>
      <div className="flex-none border-b border-[var(--adm-line-soft)] px-4 py-3">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-adm-xs font-semibold text-[var(--adm-ink)]">
            {doneRequired === required.length ? "Ready to save" : "Required steps"}
          </p>
          <p className="text-adm-xs tabular-nums text-[var(--adm-ink-subtle)]">
            {doneRequired} of {required.length}
          </p>
        </div>
        <div
          role="progressbar"
          aria-label="Required steps complete"
          aria-valuemin={0}
          aria-valuemax={required.length}
          aria-valuenow={doneRequired}
          className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--adm-surface-2)]"
        >
          <div
            className={cn(
              "h-full rounded-full transition-[width] duration-500 ease-[var(--adm-ease)]",
              pct === 100 ? "bg-[var(--adm-success)]" : "bg-[var(--adm-accent)]",
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
      <nav aria-label="Form steps" className="p-2">
        <ol className="space-y-0.5">
          {steps.map((s, i) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => jumpToStep(s.id)}
                aria-current={active === s.id ? "step" : undefined}
                className={cn(
                  "flex w-full items-center gap-3 rounded-[6px] px-2 py-1.5 text-left text-adm-xs transition-colors",
                  active === s.id
                    ? "bg-[var(--adm-accent-tint)] font-medium text-[var(--adm-ink)]"
                    : "text-[var(--adm-ink-mute)] hover:bg-[var(--adm-row-hover)] hover:text-[var(--adm-ink)]",
                )}
              >
                <StepBadge step={i + 1} state={s.state} />
                <span className="min-w-0 flex-1 truncate">{s.title}</span>
                {s.state !== "done" && (
                  <span className="flex-none text-adm-xs text-[var(--adm-ink-subtle)]">{s.required ? "Required" : "Optional"}</span>
                )}
              </button>
            </li>
          ))}
        </ol>
      </nav>

      {summary && <div className="border-t border-[var(--adm-line-soft)] p-4">{summary}</div>}
      </div>

      {footer && <div className="flex-none border-t border-[var(--adm-line-soft)] p-4">{footer}</div>}
    </aside>
  );
}
