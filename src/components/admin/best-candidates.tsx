"use client";

// Ranks the resume bank against a job. Loads the cached ranking on open, re-runs
// on demand. `bare` renders inside a tab panel (no card shell).
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Loader2 } from "lucide-react";
import { AdminCard, AdminCardHeader } from "@/components/admin/admin-card";
import { WorkspaceButton } from "@/components/admin/workspace";
import { EmptyState } from "@/components/admin/empty-state";
import { Skel } from "@/components/admin/skeletons";
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

  // Load the cached ranking on open, instant, no re-vectorizing.
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

  // Secondary: the job page's one filled action is "Add applicant" in its header.
  const actionButton = (
    <WorkspaceButton onClick={run} disabled={loading}>
      {loading ? <Loader2 className="animate-spin" aria-hidden="true" /> : <IconSource aria-hidden="true" />}
      {loading ? "Scoring…" : ran ? "Re-run" : "Find candidates"}
    </WorkspaceButton>
  );

  const body = (
    <>
      {matchedAt && !loading && candidates.length > 0 && (
        <p className="mb-3 text-[12.5px] text-[var(--adm-ink-subtle)]">
          Saved ranking, updated {fmtDate(matchedAt)}. Re-run after adding resumes.
        </p>
      )}

      {loading && (
        <div aria-busy="true" aria-label="Scoring the resume bank" className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-3 rounded-[12px] border border-[var(--adm-line)] p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-2">
                  <Skel className="h-4 w-40" />
                  <Skel className="h-3 w-56 max-w-[50vw]" />
                </div>
                <Skel className="h-6 w-12" />
              </div>
              <Skel className="h-3 w-11/12" />
              <div className="flex gap-1.5">
                <Skel className="h-5 w-16" />
                <Skel className="h-5 w-20" />
                <Skel className="h-5 w-14" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && error && (
        <div role="alert" className="flex items-start gap-2.5 rounded-[12px] bg-[var(--adm-danger-soft)] px-4 py-3 text-[13px] leading-relaxed text-[var(--adm-danger-ink)]">
          <IconWarning className="mt-0.5 h-4 w-4 flex-none" strokeWidth={1.75} aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {!loading && !error && !ran && (
        <p className="text-[14px] leading-relaxed text-[var(--adm-ink-mute)]">
          Rank your resume bank against this job. Each candidate gets a fit score, a verdict, and the skills they match or miss.
        </p>
      )}

      {!loading && !error && ran && candidates.length === 0 && (
        <EmptyState
          size="sm"
          icon={IconGroup}
          title="No matching candidates"
          description="Index resumes in the Resumes tab so they're searchable, then re-run."
        />
      )}

      {!loading && candidates.length > 0 && (
        <ol className="flex flex-col gap-3">
          {candidates.map((c, i) => (
            <li key={c.resume_id} className="rounded-[12px] border border-[var(--adm-line)] bg-[var(--adm-surface)] p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-baseline gap-3">
                  <span className="w-5 flex-none text-right text-[13px] font-medium tabular-nums text-[var(--adm-ink-subtle)]">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="flex min-w-0 items-center gap-2 text-[15px] font-semibold text-[var(--adm-ink)]">
                      <span className="truncate">{c.candidate_name || "Unnamed candidate"}</span>
                      <OriginBadge origin={c.origin} className="flex-none" />
                    </p>
                    <p className="mt-0.5 truncate text-[12.5px] text-[var(--adm-ink-subtle)]">
                      {[c.email, c.phone].filter(Boolean).join(" · ") || c.fileName || c.resume_id}
                    </p>
                  </div>
                </div>
                <div className="flex flex-none items-center gap-3">
                  <VerdictBadge verdict={c.verdict} className="hidden sm:inline" />
                  <p className="tabular-nums">
                    <span className={cn("text-[20px] font-semibold leading-none tracking-[-0.01em]", fitScoreColor(c.fit_score))}>
                      {c.fit_score}
                    </span>
                    <span className="ml-0.5 text-[12px] font-medium text-[var(--adm-ink-subtle)]">/100</span>
                  </p>
                </div>
              </div>

              <div className="pl-8">
                {c.rationale && <p className="mt-2.5 text-[13px] leading-relaxed text-[var(--adm-ink-mute)]">{c.rationale}</p>}

                <div className="mt-3">
                  <SkillChips matched={c.matched_skills} missing={c.missing_skills} />
                </div>

                {c.profileId && (
                  <Link
                    href={`/admin/candidates/${c.profileId}`}
                    className="mt-3 inline-flex items-center gap-1 rounded-[6px] text-[13px] font-medium text-[var(--adm-accent)] transition-colors hover:text-[var(--adm-accent-strong)] hover:underline"
                  >
                    View full profile
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </>
  );

  if (bare) {
    return (
      <div className="p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-[var(--adm-ink)]">Best candidates</h3>
            <p className="mt-0.5 text-[13px] text-[var(--adm-ink-mute)]">Ranked from your resume bank and talent bench for this job.</p>
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
      <div className="p-4">{body}</div>
    </AdminCard>
  );
}
