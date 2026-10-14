"use client";

// Fit-result atoms shared by the job fit card, AI matches and the match profile.
import { Badge, type Tone } from "@/components/portal/kit";
import Icon from "@/components/portal/icons";

export type Verdict = "strong" | "possible" | "weak";
export type MatchOrigin = "bank" | "bench" | "applicant";

const VERDICT: Record<Verdict, { label: string; tone: Tone }> = {
  strong: { label: "Strong fit", tone: "green" },
  possible: { label: "Possible", tone: "amber" },
  weak: { label: "Weak", tone: "grey" },
};

const ORIGIN: Record<MatchOrigin, { label: string; tone: Tone }> = {
  bench: { label: "Talent bench", tone: "blue" },
  applicant: { label: "Applicant", tone: "grey" },
  bank: { label: "Resume bank", tone: "grey" },
};

/** 60 and up reads as a fit. */
const isFit = (score: number) => score >= 60;

export function VerdictBadge({ verdict }: { verdict: Verdict }) {
  const v = VERDICT[verdict] ?? VERDICT.weak;
  return <Badge tone={v.tone}>{v.label}</Badge>;
}

/** Where a match came from: bench profile, applicant, or bank file. */
export function OriginBadge({ origin }: { origin?: MatchOrigin }) {
  if (!origin) return null;
  const o = ORIGIN[origin];
  return <Badge tone={o.tone}>{o.label}</Badge>;
}

/**
 * Score out of 100 with a meter under it. `lg` for a record's headline score,
 * `md` for a ranked row.
 */
export function FitScore({ score, size = "md" }: { score: number; size?: "md" | "lg" }) {
  const fit = isFit(score);
  const pct = Math.max(0, Math.min(100, score));
  return (
    <span className={`inline-grid shrink-0 gap-1.5 ${size === "lg" ? "w-28" : "w-16"}`}>
      <span className="flex items-baseline justify-end tabular-nums">
        <span className={`font-semibold leading-none tracking-tight ${size === "lg" ? "text-adm-2xl" : "text-adm-lg"} ${fit ? "text-status-success" : "text-status-danger"}`}>{score}</span>
        <span className="ml-0.5 text-adm-xs font-medium text-mist-600">/100</span>
      </span>
      <span
        role="meter"
        aria-label="Fit score"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={100}
        className="block h-1.5 w-full overflow-hidden rounded-full bg-mist-200"
      >
        <span className={`block h-full rounded-full ${fit ? "bg-status-success" : "bg-status-danger-mark"}`} style={{ width: `${pct}%` }} />
      </span>
    </span>
  );
}

/** Phrases the model sometimes puts in a skills list instead of leaving it empty. */
const NO_SKILL = /^(none|n\/?a|nil|nothing|-+|none (significant|identified|missing|noted)|no (major |significant )?(gaps?|missing skills?))\.?$/i;

/** Matched skills (green, check) then missing ones (grey, cross). */
export function SkillChips({ matched: rawMatched, missing: rawMissing }: { matched: string[]; missing: string[] }) {
  const matched = (rawMatched || []).filter((s) => !NO_SKILL.test(s.trim()));
  const missing = (rawMissing || []).filter((s) => !NO_SKILL.test(s.trim()));
  if (matched.length === 0 && missing.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label={`${matched.length} skills matched, ${missing.length} missing`}>
      {matched.map((s) => (
        <li key={`m-${s}`} className="inline-flex max-w-full items-center gap-1 rounded-md bg-status-success-soft px-2 py-0.5 text-adm-xs font-medium text-status-success">
          <Icon name="check" className="size-3 shrink-0" />
          <span className="sr-only">Has </span>
          <span className="min-w-0 truncate">{s}</span>
        </li>
      ))}
      {missing.map((s) => (
        <li key={`x-${s}`} className="inline-flex max-w-full items-center gap-1 rounded-md bg-mist-100 px-2 py-0.5 text-adm-xs font-medium text-mist-700">
          <Icon name="x" className="size-3 shrink-0 text-mist-500" />
          <span className="sr-only">Missing </span>
          <span className="min-w-0 truncate">{s}</span>
        </li>
      ))}
    </ul>
  );
}
