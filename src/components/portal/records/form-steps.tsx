"use client";

import * as React from "react";
import Icon from "@/components/portal/icons";
import { ProgressBar } from "@/components/portal/kit";

// A long form as numbered sections with a progress rail. Not a wizard:
// everything stays on one page; optional steps fold away until needed.

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
      aria-hidden
      className={`grid size-7 shrink-0 place-items-center rounded-full text-[12px] font-semibold tabular-nums transition-colors duration-200 ${
        state === "done" ? "bg-ocean-600 text-white" : "bg-mist-0 text-mist-700 ring-1 ring-inset ring-mist-300"
      }`}
    >
      {state === "done" ? <Icon name="check" className="size-4" /> : step}
    </span>
  );
}

function StateTag({ state, required }: { state: StepState; required?: boolean }) {
  if (state === "done") return <span className="rounded-md bg-[#ecfdf3] px-2 py-0.5 text-[12px] font-medium text-[#067647]">Done</span>;
  return required ? (
    <span className="rounded-md bg-[#fef3f2] px-2 py-0.5 text-[12px] font-medium text-[#b42318]">Required</span>
  ) : (
    <span className="rounded-md bg-mist-100 px-2 py-0.5 text-[12px] font-medium text-mist-700">Optional</span>
  );
}

/** One numbered section. Optional steps pass `open` + `onToggle` to fold. */
export function StepCard({
  id,
  step,
  title,
  description,
  state,
  required,
  open = true,
  onToggle,
  aside,
  children,
}: {
  id: string;
  step: number;
  title: string;
  description?: React.ReactNode;
  state: StepState;
  required?: boolean;
  open?: boolean;
  onToggle?: () => void;
  /** Right of the title, before the state tag */
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  const head = (
    <>
      <StepBadge step={step} state={state} />
      <span className="min-w-0 flex-1">
        <span id={`${id}-title`} className="block text-[15px] font-semibold text-navy-900">
          {title}
        </span>
        {description && <span className="mt-0.5 block text-[13px] leading-snug text-mist-600">{description}</span>}
      </span>
      {aside}
      <StateTag state={state} required={required} />
    </>
  );
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="min-w-0 scroll-mt-24 rounded-xl bg-mist-0 ring-1 ring-mist-200">
      {onToggle ? (
        <button
          type="button"
          aria-expanded={open}
          aria-controls={`${id}-body`}
          onClick={onToggle}
          className={`flex min-h-16 w-full items-center gap-3 rounded-xl px-5 py-3 text-left hover:bg-mist-50 ${open ? "rounded-b-none border-b border-mist-200" : ""}`}
        >
          {head}
          <Icon name="chevronDown" className={`size-5 shrink-0 text-mist-500 transition-transform duration-200 motion-reduce:transition-none ${open ? "rotate-180" : ""}`} />
        </button>
      ) : (
        <header className="flex min-h-16 items-center gap-3 border-b border-mist-200 px-5 py-3">{head}</header>
      )}
      {open && (
        <div id={`${id}-body`} className="p-5">
          {children}
        </div>
      )}
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

/** Scroll to a step and focus its first control (after `open` has rendered it). */
export function jumpToStep(id: string) {
  requestAnimationFrame(() => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    el.querySelector<HTMLElement>(`#${id}-body input, #${id}-body select, #${id}-body textarea, #${id}-body [contenteditable=true], #${id}-body button[role=radio]`)?.focus({ preventScroll: true });
  });
}

/** Progress over the required steps, then every step as a jump link. */
export function StepList({ steps, active, onJump }: { steps: StepInfo[]; active?: string; onJump: (id: string) => void }) {
  return (
    <nav aria-label="Form steps">
      <ol className="grid gap-0.5">
        {steps.map((s, i) => (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => onJump(s.id)}
              aria-current={active === s.id ? "step" : undefined}
              className={`flex min-h-10 w-full items-center gap-3 rounded-lg px-2 text-left text-[13px] transition-colors ${
                active === s.id ? "bg-ocean-50 font-medium text-navy-900" : "text-mist-700 hover:bg-mist-50 hover:text-navy-900"
              }`}
            >
              <StepBadge step={i + 1} state={s.state} />
              <span className="min-w-0 flex-1 truncate">{s.title}</span>
              {s.state !== "done" && <span className="shrink-0 text-[12px] text-mist-500">{s.required ? "Required" : "Optional"}</span>}
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function RequiredProgress({ steps }: { steps: StepInfo[] }) {
  const required = steps.filter((s) => s.required);
  const done = required.filter((s) => s.state === "done").length;
  const pct = required.length ? Math.round((done / required.length) * 100) : 100;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-[13px] font-semibold text-navy-900">{done === required.length ? "Ready to save" : "Required steps"}</p>
        <p className="text-[12px] tabular-nums text-mist-600">
          {done} of {required.length}
        </p>
      </div>
      <div className="mt-2">
        <ProgressBar value={pct} tone={pct === 100 ? "green" : "blue"} />
      </div>
    </div>
  );
}

/** Wide-screen rail: progress, step links, a summary, and the save actions pinned at its foot. */
export function StepRail({
  steps,
  active,
  onJump,
  summary,
  footer,
  className = "",
}: {
  steps: StepInfo[];
  active?: string;
  onJump: (id: string) => void;
  summary?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}) {
  return (
    <aside className={`flex flex-col rounded-xl bg-mist-0 ring-1 ring-mist-200 ${className}`}>
      <div className="shrink-0 border-b border-mist-200 p-4">
        <RequiredProgress steps={steps} />
      </div>
      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto">
        <div className="p-2">
          <StepList steps={steps} active={active} onJump={onJump} />
        </div>
        {summary && <div className="border-t border-mist-200 p-4">{summary}</div>}
      </div>
      {footer && <div className="shrink-0 border-t border-mist-200 p-4">{footer}</div>}
    </aside>
  );
}
