"use client";

/**
 * Submissions raised against one requisition.
 *
 * A job used to show an application COUNT, which says how many people applied
 * and nothing about whether the desk has actually done anything with them. This
 * is the answer to "what has gone out for this role, at what rate, and what came
 * back" — the view a manager asks for in a pipeline meeting.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { IconSend, IconWarning, IconInterview } from "@/components/admin/icons";
import type { Interview, Submission } from "@/lib/aws/dynamodb";
import { fmtDate } from "@/lib/format";
import { EmptyState } from "./empty-state";
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
      <div className="flex items-center justify-center px-5 py-12">
        <Loader2 className="h-5 w-5 animate-spin text-[var(--adm-accent)]" />
      </div>
    );
  }

  if (error) {
    return (
      <p role="alert" className="mx-5 my-4 flex items-start gap-2 rounded-[6px] border border-[var(--adm-danger-soft)] bg-[var(--adm-danger-soft)] px-3 py-2.5 text-[13px] text-[var(--adm-danger)]">
        <IconWarning className="mt-0.5 h-3.5 w-3.5 flex-none" aria-hidden="true" />
        {error}
      </p>
    );
  }

  if (submissions.length === 0) {
    return (
      <EmptyState
        icon={IconSend}
        tone="blue"
        title="Nothing submitted for this role yet"
        description="Submissions are recorded from a candidate's page — open an applicant and record where you sent them."
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="adm-grid w-full text-[14px]">
        <thead>
          <tr>
            <th className="px-5 py-2.5 text-left">Candidate</th>
            <th className="px-3 py-2.5 text-left">Submitted to</th>
            <th className="px-3 py-2.5 text-right">Rate</th>
            <th className="px-3 py-2.5 text-left">Sent</th>
            <th className="px-3 py-2.5 text-left">Status</th>
            <th className="px-5 py-2.5 text-left">Interviews</th>
          </tr>
        </thead>
        <tbody>
          {submissions.map((s) => {
            const nextIv = nextInterviewBySubmission.get(s.id);
            const ivCount = countBySubmission.get(s.id) || 0;
            return (
              <tr key={s.id} className="hover:bg-[var(--adm-row-hover)]">
                <td className="px-5 py-3">
                  <Link
                    href={`/admin/candidates/${s.applicationId}`}
                    className="font-semibold text-[var(--adm-ink)] hover:text-[var(--adm-accent)] hover:underline"
                  >
                    {s.candidateName || "Unnamed candidate"}
                  </Link>
                </td>
                <td className="px-3 py-3 text-[var(--adm-ink-mute)]">
                  {s.clientName || s.vendorName || "—"}
                  {s.clientName && s.vendorName && (
                    <span className="text-[var(--adm-ink-subtle)]"> via {s.vendorName}</span>
                  )}
                  {s.submittedTo && (
                    <span className="block text-[12px] text-[var(--adm-ink-subtle)]">{s.submittedTo}</span>
                  )}
                </td>
                <td className="px-3 py-3 text-right tabular-nums text-[var(--adm-ink-mute)]">
                  {formatRate(s.rate, s.rateUnit, s.currency)}
                </td>
                <td className="px-3 py-3 tabular-nums text-[var(--adm-ink-mute)]">{fmtDate(s.occurredAt)}</td>
                <td className="px-3 py-3">
                  <StatusBadge tone={submissionTone(s.status)} label={SUBMISSION_STATUS_LABELS[s.status]} />
                </td>
                <td className="px-5 py-3 text-[13px] text-[var(--adm-ink-mute)]">
                  {ivCount === 0 ? (
                    <span className="text-[var(--adm-ink-subtle)]">—</span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5">
                      <IconInterview className="h-3.5 w-3.5 text-[var(--adm-ink-subtle)]" aria-hidden="true" />
                      {ivCount}
                      {nextIv && (
                        <span className="text-[12px] text-[var(--adm-ink-subtle)]">
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
