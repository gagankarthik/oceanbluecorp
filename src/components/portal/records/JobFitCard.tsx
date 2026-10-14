"use client";

// Job fit for one application: the cached verdict from GET /api/applications/[id]/job-fit,
// re-scored on demand with POST.
import { useCallback, useEffect, useState } from "react";
import { fmtDate } from "@/lib/format";
import { Button, Panel, Skeleton } from "@/components/portal/kit";
import { Notice } from "@/components/portal/fields";
import { FitScore, SkillChips, VerdictBadge, type Verdict } from "./fit";

interface JobFit {
  fitScore: number;
  qualified: boolean;
  verdict: Verdict;
  matchedSkills: string[];
  missingSkills: string[];
  rationale?: string | null;
}

export function JobFitCard({ applicationId }: { applicationId: string }) {
  const [fit, setFit] = useState<JobFit | null>(null);
  const [at, setAt] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [scoring, setScoring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** The cached verdict was scored against a different job and was withheld. */
  const [stale, setStale] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setLoadError(false);
    fetch(`/api/applications/${applicationId}/job-fit`)
      .then((r) => {
        // A 4xx just means nothing has been scored yet.
        if (r.status >= 500) throw new Error(`HTTP ${r.status}`);
        return r.ok ? r.json() : null;
      })
      .then((d) => {
        if (active && d) {
          setFit(d.jobFit ?? null);
          setAt(d.jobFitAt ?? null);
          setStale(!!d.staleForJobChange);
        }
      })
      .catch(() => {
        if (active) setLoadError(true);
      })
      .finally(() => {
        if (active) setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, [applicationId, loadAttempt]);

  const score = useCallback(async () => {
    setScoring(true);
    setError(null);
    try {
      const res = await fetch(`/api/applications/${applicationId}/job-fit`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data?.error === "string" ? data.error : "Unable to score this resume.");
      } else {
        setFit(data.jobFit ?? null);
        setAt(data.jobFitAt ?? null);
        setStale(false);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setScoring(false);
    }
  }, [applicationId]);

  return (
    <Panel
      title="Job fit"
      description={at && fit ? `Scored ${fmtDate(at)}` : "Resume scored against the job applied for"}
      action={
        <Button size="sm" variant="secondary" icon="refresh" loading={scoring} disabled={!loaded} onClick={() => void score()}>
          {scoring ? "Scoring…" : fit ? "Re-score" : "Score fit"}
        </Button>
      }
    >
      <div className="grid gap-4">
        {stale && !fit && !error && (
          <Notice tone="warning">
            This candidate moved to a different job, so the previous fit score no longer applies. Score again to rate them against the job they are on now.
          </Notice>
        )}

        {loadError && !fit && !error && (
          <Notice
            tone="error"
            action={
              <Button size="sm" variant="secondary" icon="refresh" onClick={() => setLoadAttempt((n) => n + 1)}>
                Retry
              </Button>
            }
          >
            The saved fit score couldn&apos;t be loaded.
          </Notice>
        )}

        {error && (
          <Notice
            tone="error"
            action={
              <Button size="sm" variant="secondary" onClick={() => void score()}>
                Try again
              </Button>
            }
          >
            {error}
          </Notice>
        )}

        {!loaded || (scoring && !fit) ? (
          <div role="status" aria-label={scoring ? "Scoring the resume" : "Loading the fit score"} className="grid gap-3">
            <div className="flex items-center justify-between gap-4">
              <Skeleton className="h-6 w-24 rounded-md" />
              <Skeleton className="h-8 w-24" />
            </div>
            <Skeleton className="h-3.5 w-11/12" />
            <Skeleton className="h-3.5 w-3/4" />
          </div>
        ) : fit ? (
          <div className={`grid gap-4 ${scoring ? "opacity-60" : ""}`} aria-busy={scoring || undefined}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="grid gap-1.5">
                <VerdictBadge verdict={fit.verdict} />
                <p className="text-adm-base text-mist-600">{fit.qualified ? "Meets the core requirements" : "Gaps against the core requirements"}</p>
              </div>
              <FitScore score={fit.fitScore} size="lg" />
            </div>
            {fit.rationale && <p className="max-w-[72ch] text-adm-base leading-normal text-mist-700">{fit.rationale}</p>}
            <SkillChips matched={fit.matchedSkills} missing={fit.missingSkills} />
          </div>
        ) : (
          !error && <p className="text-adm-base leading-normal text-mist-600">Score this candidate&apos;s resume against the job they applied for. Requires a parsed resume.</p>
        )}
      </div>
    </Panel>
  );
}
