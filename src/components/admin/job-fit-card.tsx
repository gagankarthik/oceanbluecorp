"use client";

// "Job fit" card for an application detail screen. Reads the cached verdict from
// /api/applications/[id]/job-fit (GET) and lets staff (re)score on demand (POST).
import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { AdminCard, AdminCardHeader } from "@/components/admin/admin-card";
import { WorkspaceButton } from "@/components/admin/workspace";
import { IconConversion, IconRefresh, IconWarning } from "@/components/admin/icons";
import { VerdictBadge, SkillChips, fitScoreColor, type Verdict } from "@/components/admin/fit-ui";
import { fmtDate } from "@/lib/format";
import { cn } from "@/lib/utils";

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** The cached verdict was scored against a different job and was withheld. */
  const [staleForJobChange, setStale] = useState(false);

  // Load the cached verdict on mount.
  useEffect(() => {
    let active = true;
    fetch(`/api/applications/${applicationId}/job-fit`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (active && d) {
          setFit(d.jobFit ?? null);
          setAt(d.jobFitAt ?? null);
          setStale(!!d.staleForJobChange);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [applicationId]);

  const score = useCallback(async () => {
    setLoading(true);
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
      setLoading(false);
    }
  }, [applicationId]);

  return (
    <AdminCard>
      <AdminCardHeader
        icon={IconConversion}
        title="Job fit"
        subtitle={at && fit ? `Scored ${fmtDate(at)}` : undefined}
        action={
          // Secondary: the record's one filled action is "Edit profile" in the pinned header.
          <WorkspaceButton onClick={score} disabled={loading}>
            {loading ? <Loader2 className="animate-spin" aria-hidden="true" /> : <IconRefresh aria-hidden="true" />}
            {loading ? "Scoring…" : fit ? "Re-score" : "Score fit"}
          </WorkspaceButton>
        }
      />

      <div className="p-4">
        {/* The previous verdict belongs to a different requisition, so it is withheld. */}
        {staleForJobChange && !fit && !error && (
          <div className="mb-4 flex items-start gap-2.5 rounded-[12px] bg-[var(--adm-warning-soft)] px-4 py-3 text-[13px] leading-relaxed text-[var(--adm-warning-ink)]">
            <IconWarning className="mt-0.5 h-4 w-4 flex-none" strokeWidth={1.75} aria-hidden="true" />
            <span>
              This candidate moved to a different job, so the previous fit score no longer
              applies. Score again to rate them against the job they are on now.
            </span>
          </div>
        )}

        {error && (
          <div role="alert" className="mb-4 flex items-start gap-2.5 rounded-[12px] bg-[var(--adm-danger-soft)] px-4 py-3 text-[13px] leading-relaxed text-[var(--adm-danger-ink)]">
            <IconWarning className="mt-0.5 h-4 w-4 flex-none" strokeWidth={1.75} aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        {!fit && !error && (
          <p className="text-[14px] leading-relaxed text-[var(--adm-ink-mute)]">
            Score this candidate&apos;s resume against the job they applied for. Requires a parsed resume.
          </p>
        )}

        {fit && (
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <VerdictBadge verdict={fit.verdict} />
              <p className="tabular-nums">
                <span className={cn("text-[24px] font-semibold leading-none tracking-[-0.02em]", fitScoreColor(fit.fitScore))}>
                  {fit.fitScore}
                </span>
                <span className="ml-0.5 text-[13px] font-medium text-[var(--adm-ink-subtle)]">/100</span>
              </p>
            </div>

            {fit.rationale && (
              <p className="mt-3 text-[14px] leading-relaxed text-[var(--adm-ink-mute)]">{fit.rationale}</p>
            )}

            <div className="mt-4">
              <SkillChips matched={fit.matchedSkills} missing={fit.missingSkills} />
            </div>
          </div>
        )}
      </div>
    </AdminCard>
  );
}
