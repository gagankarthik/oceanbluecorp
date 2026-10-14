"use client";

// AI matches for a job: the saved ranking of the resume bank and talent bench,
// loaded on open and re-run on demand. Renders inside the job's tab panel.
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { fmtDate, fmtDateTime } from "@/lib/format";
import { Button, EmptyState, ErrorState, Skeleton } from "@/components/portal/kit";
import { Notice } from "@/components/portal/fields";
import Icon from "@/components/portal/icons";
import { FitScore, OriginBadge, SkillChips, VerdictBadge } from "./fit";
import { MatchProfileDrawer, type MatchProfile } from "./MatchProfileDrawer";

interface Candidate extends MatchProfile {
  similarity: number;
  profileId?: string;
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

/** How often to check on a ranking running elsewhere (another tab, another recruiter). */
const POLL_MS = 4000;

/** The name's ::after stretches over the whole card, so the card is one target. */
const STRETCHED =
  "truncate rounded after:absolute after:inset-0 after:rounded-xl after:content-[''] hover:text-ocean-700 focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-ocean-600";

function MatchSkeleton() {
  return (
    <div className="grid gap-3 rounded-xl p-4 ring-1 ring-mist-200">
      <div className="flex items-start justify-between gap-4">
        <div className="grid gap-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-56 max-w-[50vw]" />
        </div>
        <Skeleton className="h-8 w-16" />
      </div>
      <Skeleton className="h-3 w-11/12" />
      <div className="flex gap-1.5">
        <Skeleton className="h-5 w-16 rounded-md" />
        <Skeleton className="h-5 w-20 rounded-md" />
        <Skeleton className="h-5 w-14 rounded-md" />
      </div>
    </div>
  );
}

export function BestCandidates({ jobId }: { jobId: string }) {
  const [loading, setLoading] = useState(false);
  /** A run in flight that this tab didn't start: wait for it rather than start another. */
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
  const [profile, setProfile] = useState<Candidate | null>(null);

  const apply = useCallback((d: RankingResponse) => {
    if (Array.isArray(d.candidates) && (d.candidates.length || d.matchedAt)) {
      setCandidates(d.candidates);
      setMatchedAt(d.matchedAt ?? null);
      setRan(true);
    }
    setStale(!!d.stale);
    setRunningElsewhere(!!d.running);
  }, []);

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
      .catch(() => {
        if (active) setLoadError(true);
      })
      .finally(() => {
        if (active) setLoadingSaved(false);
      });
    return () => {
      active = false;
    };
  }, [jobId, loadAttempt, apply]);

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
        setError(
          typeof data?.error === "string"
            ? data.error
            : res.status === 504 || res.status === 502
              ? "The matching service took too long to answer. Try again."
              : "Unable to find candidates right now. Try again.",
        );
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

  let body: React.ReactNode;
  if (busy || loadingSaved) {
    body = (
      <div role="status" aria-busy="true" className="grid gap-3">
        <p className="text-[13px] text-mist-600">
          {loadingSaved && !busy
            ? "Loading the saved ranking…"
            : runningElsewhere && !loading
              ? "A ranking for this job is already running. The results appear here when it finishes."
              : "Ranking the resume bank against this role. This usually takes under a minute, and the result is saved for next time."}
        </p>
        {Array.from({ length: 3 }, (_, i) => (
          <MatchSkeleton key={i} />
        ))}
      </div>
    );
  } else if (error && candidates.length === 0) {
    body = <ErrorState framed={false} title="Couldn't rank candidates" message={error} onRetry={() => void run()} />;
  } else if (loadError && !ran) {
    body = <ErrorState framed={false} title="Couldn't load the saved ranking" onRetry={() => setLoadAttempt((n) => n + 1)} />;
  } else if (settled && !ran) {
    body = (
      <EmptyState
        compact
        variant="first-use"
        icon="sparkle"
        title="No ranking yet"
        body="Rank your resume bank and talent bench against this job. Each candidate gets a fit score, a verdict, and the skills they match or miss."
        primary={{ label: "Find candidates", icon: "sparkle", onClick: () => void run() }}
      />
    );
  } else if (candidates.length === 0) {
    body = (
      <EmptyState
        compact
        icon="bench"
        title="No matching candidates"
        body="Resumes become searchable once they are indexed. Index resumes in the resume bank, then re-run."
        primary={{ label: "Open resume bank", icon: "resume", href: "/portal/resumes" }}
        secondary={{ label: "Re-run", icon: "refresh", onClick: () => void run() }}
      />
    );
  } else {
    body = (
      <div className="grid gap-3">
        {error && <Notice tone="error" action={<Button size="sm" variant="secondary" onClick={() => void run()}>Try again</Button>}>{error}</Notice>}
        {stale && (
          <Notice tone="warning" role="status" action={<Button size="sm" variant="secondary" icon="refresh" onClick={() => void run()}>Re-run</Button>}>
            This job was edited after the ranking{matchedAt ? ` on ${fmtDate(matchedAt)}` : ""}. Re-run for a shortlist that matches the current posting.
          </Notice>
        )}
        {notSaved && (
          <Notice tone="warning" role="status">
            This ranking couldn&apos;t be saved, so it will be gone when you leave the page. Re-run to try saving again.
          </Notice>
        )}
        <ol className="grid gap-3">
          {candidates.map((c, i) => {
            const opens = !!(c.profileId || c.bankId);
            const name = c.candidate_name || "Unnamed candidate";
            return (
              <li
                key={c.resume_id}
                className={`relative min-w-0 rounded-xl bg-mist-0 p-4 ring-1 ring-mist-200 transition-shadow ${opens ? "hover:shadow-md hover:ring-mist-300" : ""}`}
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 w-5 shrink-0 text-right text-[12px] font-medium tabular-nums text-mist-500">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                      <p className="min-w-0 max-w-full truncate text-[15px] font-semibold text-navy-900">
                        {c.profileId ? (
                          <Link href={`/portal/candidates/${c.profileId}`} className={STRETCHED}>
                            {name}
                          </Link>
                        ) : c.bankId ? (
                          <button type="button" onClick={() => setProfile(c)} className={`${STRETCHED} text-left`}>
                            {name}
                          </button>
                        ) : (
                          name
                        )}
                      </p>
                      <OriginBadge origin={c.origin} />
                      <VerdictBadge verdict={c.verdict} />
                    </div>
                    <p className="mt-0.5 truncate text-[12px] text-mist-600">{[c.email, c.phone].filter(Boolean).join(" · ") || c.fileName || c.resume_id}</p>
                  </div>
                  <FitScore score={c.fit_score} />
                </div>
                <div className="mt-3 grid gap-3 sm:pl-8">
                  {c.rationale && <p className="max-w-[72ch] text-[13px] leading-relaxed text-mist-700">{c.rationale}</p>}
                  <SkillChips matched={c.matched_skills} missing={c.missing_skills} />
                  {opens && (
                    <p aria-hidden className="inline-flex items-center gap-1 text-[13px] font-medium text-ocean-700">
                      {c.profileId ? "Open profile" : "View profile and resume"}
                      <Icon name="chevronRight" className="size-4" />
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    );
  }

  return (
    <div className="grid gap-4 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[15px] font-semibold text-navy-900">Best candidates{candidates.length > 0 && !busy ? <span className="ml-2 text-[13px] font-medium tabular-nums text-mist-500">{candidates.length}</span> : null}</h3>
          <p className="mt-0.5 text-[13px] text-mist-600">
            {matchedAt && candidates.length > 0 && !busy && !stale
              ? `Saved ranking from ${fmtDateTime(matchedAt)}. Re-run after adding resumes.`
              : "Ranked from your resume bank and talent bench for this job."}
          </p>
        </div>
        {(ran || busy) && (
          <Button variant="secondary" icon="refresh" loading={busy} disabled={loadingSaved} onClick={() => void run()}>
            {busy ? "Ranking…" : "Re-run"}
          </Button>
        )}
      </div>
      {body}
      <MatchProfileDrawer candidate={profile} onClose={() => setProfile(null)} />
    </div>
  );
}
