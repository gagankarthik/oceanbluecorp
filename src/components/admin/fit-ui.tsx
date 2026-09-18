// Shared presentational atoms for candidate/job fit results, reused by the
// Best Candidates panel, the Job Fit card, and Lead Sourcing so the verdict
// styling, score colour, and skill chips live in one place.
import { Check, X } from "lucide-react";
import { tones } from "@/components/admin/theme";
import { cn } from "@/lib/utils";

export type Verdict = "strong" | "possible" | "weak";

const VERDICT_META: Record<Verdict, { label: string; cls: string }> = {
  strong:   { label: "Strong fit", cls: cn(tones.emerald.bg, tones.emerald.text) },
  possible: { label: "Possible",   cls: cn(tones.amber.bg, tones.amber.text) },
  weak:     { label: "Weak",       cls: cn(tones.slate.bg, tones.slate.text) },
};

// Green at/above 60 (a fit), red below.
export function fitScoreColor(score: number): string {
  return score >= 60 ? "text-[var(--adm-success-ink)]" : "text-[var(--adm-danger-ink)]";
}

// Plain inline span (not inline-flex) so callers can toggle it with `hidden sm:inline`.
export function VerdictBadge({ verdict, className }: { verdict: Verdict; className?: string }) {
  const m = VERDICT_META[verdict] ?? VERDICT_META.weak;
  return (
    <span className={cn("whitespace-nowrap rounded-full px-2.5 py-1 text-[12px] font-medium leading-none", m.cls, className)}>
      {m.label}
    </span>
  );
}

export type MatchOrigin = "bank" | "bench" | "applicant";

const ORIGIN_META: Record<MatchOrigin, { label: string; cls: string }> = {
  bench:     { label: "Talent bench", cls: "bg-[var(--adm-accent-soft)] text-[var(--adm-accent)]" },
  applicant: { label: "Applicant",    cls: "bg-[var(--adm-surface-2)] text-[var(--adm-ink-mute)]" },
  bank:      { label: "Resume bank",  cls: "bg-[var(--adm-surface-2)] text-[var(--adm-ink-mute)]" },
};

/** Where a matched candidate came from: bench profile, applicant, or bank file. */
export function OriginBadge({ origin, className }: { origin?: MatchOrigin; className?: string }) {
  if (!origin) return null;
  const m = ORIGIN_META[origin];
  return (
    <span className={cn("whitespace-nowrap rounded-[6px] px-1.5 py-0.5 text-[12px] font-medium", m.cls, className)}>
      {m.label}
    </span>
  );
}

export function SkillChips({ matched, missing }: { matched: string[]; missing: string[] }) {
  if (matched.length === 0 && missing.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {matched.map((s) => (
        <span
          key={`m-${s}`}
          className="inline-flex items-center gap-1 rounded-[6px] bg-[var(--adm-success-soft)] px-2 py-0.5 text-[12px] font-medium text-[var(--adm-success-ink)]"
        >
          <Check className="h-3 w-3" strokeWidth={2.5} aria-hidden="true" />
          {s}
        </span>
      ))}
      {missing.map((s) => (
        <span
          key={`x-${s}`}
          className="inline-flex items-center gap-1 rounded-[6px] bg-[var(--adm-surface-2)] px-2 py-0.5 text-[12px] font-medium text-[var(--adm-ink-mute)]"
        >
          <X className="h-3 w-3 text-[var(--adm-ink-subtle)]" strokeWidth={2.5} aria-hidden="true" />
          {s}
        </span>
      ))}
    </div>
  );
}
