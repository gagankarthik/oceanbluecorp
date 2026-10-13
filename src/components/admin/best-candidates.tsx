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
import { MatchProfileDrawer } from "@/components/admin/match-profile-drawer";
import { fmtDate, fmtDateTime } from "@/lib/format";
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

interface RankingResponse {
  candidates?: Candidate[];
  matchedAt?: string | null;
  running?: boolean;
  stale?: boolean;
  lastError?: string | null;
  saved?: boolean;
  error?: string;
}

/** A link or button whose hit area covers the whole positioned card it sits in. */
const STRETCHED =
  "truncate rounded-[4px] after:absolute after:inset-0 after:rounded-[12px] after:content-[''] hover:text-[var(--adm-accent)] focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-[var(--adm-focus-ring)]";

/** How often to check on a ranking that is running elsewhere (another tab, another recruiter). */
const POLL_MS = 4000;

export function BestCandidates({ jobId, bare = false }: { jobId: string; bare?: boolean }) {
  const [loading, setLoading] = useState(false);
  /** A run in flight that this tab didn't start: we wait for it rather than start another. */
  const [runningElsewhere, setRunningElsewhere] = useState(false);
  const [ran, setRan] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [matchedAt, setMatchedAt] = useState<string | null>(null);
  const [stale, setStale] = useState(false);
  const [notSaved, setNotSaved] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  /** Until the saved ranking has been read, we don't know whether one exists. */
  const [loadingSaved, setLoadingSaved] = useState(true);

  const apply = useCallback((d: RankingResponse) => {
    if (Array.isArray(d.candidates) && (d.candidates.length || d.matchedAt)) {
      setCandidates(d.candidates);
      setMatchedAt(d.matchedAt ?? null);
      setRan(true);
    }
    setStale(!!d.stale);
    setRunningElsewhere(!!d.running);
  }, []);

  // Load the saved ranking on open: instant, no engine work.
  useEffect(() => {
    let active = true;
    setLoadError(false);
    setLoadingSaved(true);
    fetch(`/api/jobs/${jobId}/match-candidates`)
      .then((r) => {
        // A 4xx just means no saved ranking yet.
        if (r.status >= 500) throw new Error(`HTTP ${r.status}`);
        return r.ok ? r.json() : null;
      })
      .then((d: RankingResponse | null) => {
        if (!active || !d) return;
        apply(d);
        if (d.lastError && !d.running) setError(d.lastError);
      })
      .catch(() => { if (active) setLoadError(true); })
      .finally(() => { if (active) setLoadingSaved(false); });
    return () => {
      active = false;
    };
  }, [jobId, loadAttempt, apply]);

  // While someone else's run is in flight, check back until it lands.
  useEffect(() => {
    if (!runningElsewhere) return;
    const timer = setInterval(() => {
      fetch(`/api/jobs/${jobId}/match-candidates`)
        .then((r) => (r.ok ? r.json() : null))
        .then((d: RankingResponse | null) => {
          if (!d) return;
          apply(d);
          if (!d.running && d.lastError) setError(d.lastError);
        })
        .catch(() => {});
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [runningElsewhere, jobId, apply]);

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNotSaved(false);
    try {
      const res = await fetch(`/api/jobs/${jobId}/match-candidates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topK: 10 }),
      });
      const data: RankingResponse = await res.json().catch(() => ({}));
      if (res.status === 409) {
        setRunningElsewhere(true);
      } else if (!res.ok) {
        setError(typeof data?.error === "string"
          ? data.error
          : res.status === 504 || res.status === 502
            ? "The matching service took too long to answer. Try again."
            : "Unable to find candidates right now. Try again.");
      } else {
        apply({ ...data, candidates: Array.isArray(data.candidates) ? data.candidates : [] });
        setRan(true);
        setNotSaved(data.saved === false);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [jobId, apply]);

  const busy = loading || runningElsewhere;
  const settled = !busy && !loadingSaved;

  // A bank hit has no candidate record; its profile is the match and the file.
  const [profile, setProfile] = useState<Candidate | null>(null);

  // Secondary: the job page's one filled action is "Add applicant" in its header.
  const actionButton = (
    <WorkspaceButton loading={busy} onClick={run} disabled={busy || loadingSaved}>
      <IconSource aria-hidden="true" />
      {busy ? "Ranking…" : ran ? "Re-run" : "Find candidates"}
    </WorkspaceButton>
  );

  const body = (
    <>
      {matchedAt && !busy && candidates.length > 0 && !stale && (
        <p className="mb-3 text-adm-xs text-[var(--adm-ink-mute)]">
          Saved ranking from {fmtDateTime(matchedAt)}. It stays until you re-run it; re-run after adding resumes.
        </p>
      )}

      {!busy && stale && candidates.length > 0 && (
        <div role="status" className="mb-3 flex flex-wrap items-center gap-3 rounded-[var(--adm-radius-card)] border border-[var(--adm-warning-line)] bg-[var(--adm-warning-soft)] px-4 py-3 text-adm-xs text-[var(--adm-warning-ink)]">
          <IconWarning className="h-4 w-4 flex-none" strokeWidth={1.75} aria-hidden="true" />
          <span className="min-w-0 flex-1">
            This job was edited after the ranking{matchedAt ? ` on ${fmtDate(matchedAt)}` : ""}. Re-run for a shortlist that matches the current posting.
          </span>
          <WorkspaceButton size="sm" onClick={run}>Re-run</WorkspaceButton>
        </div>
      )}

      {!busy && notSaved && (
        <p role="status" className="mb-3 text-adm-xs text-[var(--adm-warning-ink)]">
          This ranking couldn&apos;t be saved, so it will be gone when you leave the page. Re-run to try saving again.
        </p>
      )}

      {loadingSaved && !busy && (
        <p role="status" className="flex items-center gap-2 py-2 text-adm-xs text-[var(--adm-ink-mute)]">
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />Loading the saved ranking…
        </p>
      )}

      {busy && (
        <div aria-busy="true" aria-label="Scoring the resume bank" className="flex flex-col gap-3">
          <p role="status" className="text-adm-xs text-[var(--adm-ink-mute)]">
            {runningElsewhere && !busy
              ? "A ranking for this job is already running. The results will appear here when it finishes."
              : "Ranking the resume bank against this role. This usually takes under a minute, and the result is saved for next time."}
          </p>
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

      {!busy && !error && loadError && !ran && (
        <div role="alert" className="mb-3 flex flex-wrap items-center gap-3 rounded-[12px] bg-[var(--adm-danger-soft)] px-4 py-3 text-adm-xs leading-relaxed text-[var(--adm-danger-ink)]">
          <IconWarning className="h-4 w-4 flex-none" strokeWidth={1.75} aria-hidden="true" />
          <span className="min-w-0 flex-1">The saved ranking couldn&apos;t be loaded.</span>
          <WorkspaceButton className="h-8 px-3 text-adm-base" onClick={() => setLoadAttempt((n) => n + 1)}>Retry</WorkspaceButton>
        </div>
      )}

      {!busy && error && (
        <div role="alert" className="flex items-start gap-3 rounded-[12px] bg-[var(--adm-danger-soft)] px-4 py-3 text-adm-xs leading-relaxed text-[var(--adm-danger-ink)]">
          <IconWarning className="mt-0.5 h-4 w-4 flex-none" strokeWidth={1.75} aria-hidden="true" />
          <span className="min-w-0 flex-1">{error}</span>
          <WorkspaceButton className="h-8 px-3 text-adm-base" onClick={run}>Try again</WorkspaceButton>
        </div>
      )}

      {settled && !error && !ran && (
        <p className="text-adm-base leading-relaxed text-[var(--adm-ink-mute)]">
          Rank your resume bank against this job. Each candidate gets a fit score, a verdict, and the skills they match or miss.
        </p>
      )}

      {!busy && !error && ran && candidates.length === 0 && (
        <EmptyState
          size="sm"
          icon={IconGroup}
          title="No matching candidates"
          description="Index resumes in the Resumes tab so they're searchable, then re-run."
        />
      )}

      {!busy && candidates.length > 0 && (
        <ol className="flex flex-col gap-3">
          {candidates.map((c, i) => (
            <li
              key={c.resume_id}
              className={cn(
                "relative rounded-[12px] border border-[var(--adm-line)] bg-[var(--adm-surface)] p-4 transition-[border-color,box-shadow] duration-150",
                (c.profileId || c.bankId) && "hover:border-[var(--adm-line-control)] hover:shadow-[var(--adm-shadow-md)] focus-within:border-[var(--adm-accent)]",
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-baseline gap-3">
                  <span className="w-5 flex-none text-right text-adm-xs font-medium tabular-nums text-[var(--adm-ink-subtle)]">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="flex min-w-0 items-center gap-2 text-adm-md font-semibold text-[var(--adm-ink)]">
                      {/* The name is the card's one link; its ::after stretches over the whole card. */}
                      {c.profileId ? (
                        <Link href={`/admin/candidates/${c.profileId}`} className={STRETCHED}>
                          {c.candidate_name || "Unnamed candidate"}
                        </Link>
                      ) : c.bankId ? (
                        <button type="button" onClick={() => setProfile(c)} className={cn(STRETCHED, "text-left")}>
                          {c.candidate_name || "Unnamed candidate"}
                        </button>
                      ) : (
                        <span className="truncate">{c.candidate_name || "Unnamed candidate"}</span>
                      )}
                      <OriginBadge origin={c.origin} className="flex-none" />
                    </p>
                    <p className="mt-0.5 truncate text-adm-xs text-[var(--adm-ink-subtle)]">
                      {[c.email, c.phone].filter(Boolean).join(" · ") || c.fileName || c.resume_id}
                    </p>
                  </div>
                </div>
                <div className="flex flex-none items-center gap-3">
                  <VerdictBadge verdict={c.verdict} className="hidden sm:inline" />
                  <p className="tabular-nums">
                    <span className={cn("text-adm-lg font-semibold leading-none tracking-[-0.01em]", fitScoreColor(c.fit_score))}>
                      {c.fit_score}
                    </span>
                    <span className="ml-0.5 text-adm-xs font-medium text-[var(--adm-ink-subtle)]">/100</span>
                  </p>
                </div>
              </div>

              <div className="pl-8">
                {c.rationale && <p className="mt-3 text-adm-xs leading-relaxed text-[var(--adm-ink-mute)]">{c.rationale}</p>}

                <div className="mt-3">
                  <SkillChips matched={c.matched_skills} missing={c.missing_skills} />
                </div>

                {(c.profileId || c.bankId) && (
                  <p aria-hidden="true" className="mt-3 inline-flex items-center gap-1 text-adm-xs font-medium text-[var(--adm-accent)]">
                    {c.profileId ? "Open profile" : "View profile and resume"}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </>
  );

  const previewDialog = <MatchProfileDrawer candidate={profile} onClose={() => setProfile(null)} />;

  if (bare) {
    return (
      <div className="p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-adm-md font-semibold tracking-[-0.01em] text-[var(--adm-ink)]">Best candidates</h3>
            <p className="mt-0.5 text-adm-xs text-[var(--adm-ink-mute)]">Ranked from your resume bank and talent bench for this job.</p>
          </div>
          {actionButton}
        </div>
        {body}
        {previewDialog}
      </div>
    );
  }

  return (
    <AdminCard>
      <AdminCardHeader icon={IconSource} title="Best candidates" count={candidates.length || undefined} action={actionButton} />
      <div className="p-4">{body}</div>
      {previewDialog}
    </AdminCard>
  );
}
