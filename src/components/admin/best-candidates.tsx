"use client";

// "Best candidates" — ranks the resume bank against a job. Loads the cached
// ranking on open (instant; resumes are vectorized once), re-runs on demand.
// `bare` renders it inside a tab panel (no card shell); default is a standalone
// AdminCard.
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AdminCard, AdminCardHeader } from "@/components/admin/admin-card";
import { WorkspaceButton } from "@/components/admin/workspace";
import { IconSource, IconWarning, IconGroup } from "@/components/admin/icons";
import { VerdictBadge, SkillChips, OriginBadge, fitScoreColor, type Verdict, type MatchOrigin } from "@/components/admin/fit-ui";
import { fmtDate } from "@/lib/format";
import { cn } from "@/lib/utils";

interface Candidate {
  resume_id: string;
  candidate_name: string | null;
  fit_score: number;
  similarity: number;
  qualified: boolean;
  verdict: Verdict;
  matched_skills: string[];
  missing_skills: string[];
  rationale: string | null;
  // Enrichment from the server: where this hit lives and how to open it.
  origin?: MatchOrigin;
  profileId?: string;
  email?: string;
  phone?: string;
  fileName?: string;
  bankId?: string;
}

export function BestCandidates({ jobId, bare = false }: { jobId: string; bare?: boolean }) {
  const [loading, setLoading] = useState(false);
  const [ran, setRan] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [matchedAt, setMatchedAt] = useState<string | null>(null);

  // Load the cached ranking on open — instant, no re-vectorizing.
  useEffect(() => {
    let active = true;
    fetch(`/api/jobs/${jobId}/match-candidates`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (active && d && Array.isArray(d.candidates) && d.candidates.length) {
          setCandidates(d.candidates);
          setMatchedAt(d.matchedAt ?? null);
          setRan(true);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [jobId]);

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/jobs/${jobId}/match-candidates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topK: 10 }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data?.error === "string" ? data.error : "Unable to find candidates right now.");
      } else {
        setCandidates(Array.isArray(data.candidates) ? data.candidates : []);
        setMatchedAt(data.matchedAt ?? null);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
      setRan(true);
    }
  }, [jobId]);

  const actionButton = (
    <WorkspaceButton variant="primary" onClick={run} disabled={loading} className="sm:flex-none">
      {loading ? "Scoring…" : ran ? "Re-run" : "Find candidates"}
    </WorkspaceButton>
  );

  const body = (
    <>
      {matchedAt && !loading && candidates.length > 0 && (
        <p className="mb-3 text-[12px] text-[var(--adm-ink-subtle)]">
          Saved ranking · updated {fmtDate(matchedAt)}. Re-run after adding resumes.
        </p>
      )}

      {loading && (
        <div className="flex items-center gap-3 text-[14px] text-[var(--adm-ink-mute)]">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--adm-line)] border-t-[var(--adm-accent)]" />
          Scoring the resume bank against this job…
        </div>
      )}

      {!loading && error && (
        <div className="flex items-start gap-2.5 rounded-lg bg-red-500/8 px-4 py-3 text-[14px] text-red-700">
          <IconWarning className="mt-0.5 h-[18px] w-[18px] flex-none" strokeWidth={1.75} />
          <span>{error}</span>
        </div>
      )}

      {!loading && !error && !ran && (
        <p className="text-[14px] leading-relaxed text-[var(--adm-ink-mute)]">
          Rank your resume bank against this job. Each candidate gets a fit score, a verdict, and the skills they match or miss.
        </p>
      )}

      {!loading && !error && ran && candidates.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <IconGroup className="h-8 w-8 text-[var(--adm-ink-subtle)]" strokeWidth={1.5} />
          <p className="text-[14px] text-[var(--adm-ink-mute)]">
            No candidates found. Index resumes in the Resumes tab so they&apos;re searchable.
          </p>
        </div>
      )}

      {!loading && candidates.length > 0 && (
        <ol className="flex flex-col gap-3">
          {candidates.map((c, i) => (
            <li key={c.resume_id} className="rounded-xl border border-[var(--adm-line)] bg-[var(--adm-surface)] p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-7 w-7 flex-none items-center justify-center rounded-lg bg-[var(--adm-surface-2)] text-[13px] font-semibold tabular-nums text-[var(--adm-ink-mute)]">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 truncate text-[15px] font-semibold text-[var(--adm-ink)]">
                      <span className="truncate">{c.candidate_name || "Unnamed candidate"}</span>
                      <OriginBadge origin={c.origin} className="flex-none" />
                    </p>
                    <p className="truncate text-[12px] text-[var(--adm-ink-subtle)]">
                      {[c.email, c.phone].filter(Boolean).join(" · ") || c.fileName || c.resume_id}
                    </p>
                  </div>
                </div>
                <div className="flex flex-none items-center gap-2 sm:gap-3">
                  <VerdictBadge verdict={c.verdict} className="hidden sm:inline" />
                  <div className="text-right">
                    <span className={cn("text-[20px] font-bold tabular-nums leading-none", fitScoreColor(c.fit_score))}>
                      {c.fit_score}
                    </span>
                    <span className="ml-0.5 text-[11px] font-medium text-[var(--adm-ink-subtle)]">/100</span>
                  </div>
                </div>
              </div>

              {c.rationale && <p className="mt-2.5 text-[13px] leading-relaxed text-[var(--adm-ink-mute)]">{c.rationale}</p>}

              <div className="mt-3">
                <SkillChips matched={c.matched_skills} missing={c.missing_skills} />
              </div>

              {c.profileId && (
                <Link
                  href={`/admin/candidates/${c.profileId}`}
                  className="mt-3 inline-flex items-center gap-1 text-[13px] font-semibold text-[var(--adm-accent)] hover:underline"
                >
                  View full profile →
                </Link>
              )}
            </li>
          ))}
        </ol>
      )}
    </>
  );

  if (bare) {
    return (
      <div className="p-5 sm:p-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-[15px] font-semibold text-[var(--adm-ink)]">Best candidates</h3>
            <p className="text-[13px] text-[var(--adm-ink-mute)]">Ranked from your resume bank and talent bench for this job.</p>
          </div>
          {actionButton}
        </div>
        {body}
      </div>
    );
  }

  return (
    <AdminCard>
      <AdminCardHeader icon={IconSource} title="Best candidates" count={candidates.length || undefined} action={actionButton} />
      <div className="p-6">{body}</div>
    </AdminCard>
  );
}
