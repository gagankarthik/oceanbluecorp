"use client";

// "Job fit" card for an application detail screen. Reads the cached verdict from
// /api/applications/[id]/job-fit (GET) and lets staff (re)score on demand (POST).
import { useCallback, useEffect, useState } from "react";
import { AdminCard, AdminCardHeader } from "@/components/admin/admin-card";
import { WorkspaceButton } from "@/components/admin/workspace";
import { IconConversion, IconWarning } from "@/components/admin/icons";
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

  // Load the cached verdict on mount.
  useEffect(() => {
    let active = true;
    fetch(`/api/applications/${applicationId}/job-fit`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (active && d) {
          setFit(d.jobFit ?? null);
          setAt(d.jobFitAt ?? null);
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
        action={
          <WorkspaceButton variant={fit ? "secondary" : "primary"} onClick={score} disabled={loading}>
            {loading ? "Scoring…" : fit ? "Re-score" : "Score fit"}
          </WorkspaceButton>
        }
      />

      <div className="p-6">
        {error && (
          <div className="mb-4 flex items-start gap-2.5 rounded-lg bg-red-500/8 px-4 py-3 text-[14px] text-red-700">
            <IconWarning className="mt-0.5 h-[18px] w-[18px] flex-none" strokeWidth={1.75} />
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
            <div className="flex items-center justify-between gap-4">
              <VerdictBadge verdict={fit.verdict} />
              <div className="text-right">
                <span className={cn("text-[28px] font-bold tabular-nums leading-none", fitScoreColor(fit.fitScore))}>
                  {fit.fitScore}
                </span>
                <span className="ml-0.5 text-[13px] font-medium text-[var(--adm-ink-subtle)]">/100</span>
              </div>
            </div>

            {fit.rationale && (
              <p className="mt-3 text-[13px] leading-relaxed text-[var(--adm-ink-mute)]">{fit.rationale}</p>
            )}

            <div className="mt-4">
              <SkillChips matched={fit.matchedSkills} missing={fit.missingSkills} />
            </div>

            {at && <p className="mt-4 text-[12px] text-[var(--adm-ink-subtle)]">Scored {fmtDate(at)}</p>}
          </div>
        )}
      </div>
    </AdminCard>
  );
}
