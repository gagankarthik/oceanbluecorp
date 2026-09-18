"use client";

/**
 * Submissions raised against one requisition.
 *
 * A job used to show an application COUNT, which says how many people applied
 * and nothing about whether the desk has actually done anything with them. This
 * is the answer to "what has gone out for this role, at what rate, and what came
 * back", the view a manager asks for in a pipeline meeting.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { IconSend, IconWarning, IconInterview } from "@/components/admin/icons";
import type { Interview, Submission } from "@/lib/aws/dynamodb";
import { fmtDate } from "@/lib/format";
import { EmptyState } from "./empty-state";
import { AdminRowsSkeleton } from "./skeletons";
import { StatusBadge } from "./status-badge";
import {
  SUBMISSION_STATUS_LABELS, submissionTone, formatRate,
  INTERVIEW_STATUS_LABELS,
} from "@/lib/pipeline-records";

export function JobSubmissions({ jobId }: { jobId: string }) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      // Both kinds in one pass: a submission row is only useful next to whether
      // an interview came of it.
      const [subRes, ivRes] = await Promise.all([
        fetch(`/api/pipeline?kind=submission&jobId=${encodeURIComponent(jobId)}`),
        fetch(`/api/pipeline?kind=interview`),
      ]);
      const subData = await subRes.json();
      if (!subRes.ok) throw new Error(subData.error || "Could not load submissions");
      setSubmissions(subData.records || []);

      if (ivRes.ok) {
        const ivData = await ivRes.json();
        setInterviews((ivData.records || []).filter((r: Interview) => r.jobId === jobId));
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load submissions");
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => { void load(); }, [load]);

  /** Next scheduled interview per submission, so a row shows what is coming up. */
  const nextInterviewBySubmission = useMemo(() => {
    const map = new Map<string, Interview>();
    const now = Date.now();
    for (const iv of interviews) {
      if (!iv.submissionId) continue;
      const when = new Date(iv.scheduledAt || iv.occurredAt).getTime();
      const existing = map.get(iv.submissionId);
      // Prefer the soonest still-upcoming round; fall back to the latest past one
      // so a completed loop still shows something.
      if (!existing) { map.set(iv.submissionId, iv); continue; }
      const existingWhen = new Date(existing.scheduledAt || existing.occurredAt).getTime();
      const bothFuture = when >= now && existingWhen >= now;
      if (bothFuture ? when < existingWhen : when > existingWhen) map.set(iv.submissionId, iv);
    }
    return map;
  }, [interviews]);

  const countBySubmission = useMemo(() => {
    const counts = new Map<string, number>();
    for (const iv of interviews) {
      if (!iv.submissionId) continue;
      counts.set(iv.submissionId, (counts.get(iv.submissionId) || 0) + 1);
    }
    return counts;
  }, [interviews]);

  if (loading) {
    return (
      <div aria-busy="true" aria-label="Loading submissions">
        <AdminRowsSkeleton rows={4} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <p role="alert" className="flex items-start gap-2.5 rounded-[12px] bg-[var(--adm-danger-soft)] px-4 py-3 text-[13px] leading-relaxed text-[var(--adm-danger-ink)]">
          <IconWarning className="mt-0.5 h-4 w-4 flex-none" aria-hidden="true" />
          {error}
        </p>
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <EmptyState
        icon={IconSend}
        title="Nothing submitted for this role yet"
        description="Submissions are recorded from a candidate's page. Open an applicant and record where you sent them."
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="adm-grid w-full text-[14px]">
        <thead>
          <tr>
            <th className="px-4 py-2.5 text-left">Candidate</th>
            <th className="px-3 py-2.5 text-left">Submitted to</th>
            <th className="hidden px-3 py-2.5 text-right sm:table-cell">Rate</th>
            <th className="hidden px-3 py-2.5 text-left md:table-cell">Sent</th>
            <th className="px-3 py-2.5 text-left">Status</th>
            <th className="hidden px-4 py-2.5 text-left lg:table-cell">Interviews</th>
          </tr>
        </thead>
        <tbody>
          {submissions.map((s) => {
            const nextIv = nextInterviewBySubmission.get(s.id);
            const ivCount = countBySubmission.get(s.id) || 0;
            return (
              <tr key={s.id} className="transition-colors hover:bg-[var(--adm-row-hover)]">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/candidates/${s.applicationId}`}
                    className="font-medium text-[var(--adm-ink)] transition-colors hover:text-[var(--adm-accent)] hover:underline"
                  >
                    {s.candidateName || "Unnamed candidate"}
                  </Link>
                </td>
                <td className="px-3 py-3 text-[var(--adm-ink-mute)]">
                  {s.clientName || s.vendorName || "–"}
                  {s.clientName && s.vendorName && (
                    <span className="text-[var(--adm-ink-subtle)]"> via {s.vendorName}</span>
                  )}
                  {s.submittedTo && (
                    <span className="block text-[12.5px] text-[var(--adm-ink-subtle)]">{s.submittedTo}</span>
                  )}
                </td>
                <td className="hidden px-3 py-3 text-right tabular-nums text-[var(--adm-ink-mute)] sm:table-cell">
                  {formatRate(s.rate, s.rateUnit, s.currency)}
                </td>
                <td className="hidden px-3 py-3 tabular-nums text-[var(--adm-ink-mute)] md:table-cell">{fmtDate(s.occurredAt)}</td>
                <td className="px-3 py-3">
                  <StatusBadge tone={submissionTone(s.status)} label={SUBMISSION_STATUS_LABELS[s.status]} />
                </td>
                <td className="hidden px-4 py-3 text-[13px] text-[var(--adm-ink-mute)] lg:table-cell">
                  {ivCount === 0 ? (
                    <span className="text-[var(--adm-ink-subtle)]">–</span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 tabular-nums">
                      <IconInterview className="h-3.5 w-3.5 text-[var(--adm-ink-subtle)]" aria-hidden="true" />
                      {ivCount}
                      {nextIv && (
                        <span className="text-[12.5px] text-[var(--adm-ink-subtle)]">
                          · R{nextIv.round} {INTERVIEW_STATUS_LABELS[nextIv.status].toLowerCase()} {fmtDate(nextIv.scheduledAt)}
                        </span>
                      )}
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
