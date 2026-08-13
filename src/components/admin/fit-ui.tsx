// Shared presentational atoms for candidate/job fit results, reused by the
// Best Candidates panel, the Job Fit card, and Lead Sourcing so the verdict
// styling, score colour, and skill chips live in one place.
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type Verdict = "strong" | "possible" | "weak";

const VERDICT_META: Record<Verdict, { label: string; cls: string }> = {
  strong: { label: "Strong fit", cls: "bg-emerald-500/12 text-emerald-700" },
  possible: { label: "Possible", cls: "bg-amber-500/12 text-amber-700" },
  weak: { label: "Weak", cls: "bg-[var(--adm-surface-2)] text-[var(--adm-ink-mute)]" },
};

// Green at/above 60 (a fit), red below (down to 0).
export function fitScoreColor(score: number): string {
  return score >= 60 ? "text-emerald-600" : "text-red-600";
}

export function VerdictBadge({ verdict, className }: { verdict: Verdict; className?: string }) {
  const m = VERDICT_META[verdict] ?? VERDICT_META.weak;
  return <span className={cn("rounded-full px-2.5 py-1 text-[12px] font-semibold", m.cls, className)}>{m.label}</span>;
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
    <span className={cn("rounded-[4px] px-1.5 py-0.5 text-[11px] font-semibold", m.cls, className)}>
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
          className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[12px] font-medium text-emerald-700"
        >
          <Check className="h-3 w-3" strokeWidth={2.5} />
          {s}
        </span>
      ))}
      {missing.map((s) => (
        <span
          key={`x-${s}`}
          className="inline-flex items-center gap-1 rounded-md bg-[var(--adm-surface-2)] px-2 py-0.5 text-[12px] font-medium text-[var(--adm-ink-subtle)]"
        >
          <X className="h-3 w-3" strokeWidth={2.5} />
          {s}
        </span>
      ))}
    </div>
  );
}
