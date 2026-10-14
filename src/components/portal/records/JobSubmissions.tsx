"use client";

// What has gone out for one requisition, at what rate, and what came back.
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Interview, Submission } from "@/lib/aws/dynamodb";
import { fmtDate } from "@/lib/format";
import { SUBMISSION_STATUS_LABELS, INTERVIEW_STATUS_LABELS, formatRate, submissionTone } from "@/lib/pipeline-records";
import { Badge, EmptyState, ErrorState, Skeleton } from "@/components/portal/kit";
import Icon from "@/components/portal/icons";
import { kitTone } from "./PipelinePanel";

export function JobSubmissions({ jobId }: { jobId: string }) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Both kinds in one pass: a submission row is only useful next to whether an interview came of it.
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

  useEffect(() => {
    void load();
  }, [load]);

  /** Soonest upcoming round per submission, else the latest past one. */
  const nextInterview = useMemo(() => {
    const map = new Map<string, Interview>();
    const now = Date.now();
    for (const iv of interviews) {
      if (!iv.submissionId) continue;
      const when = new Date(iv.scheduledAt || iv.occurredAt).getTime();
      const existing = map.get(iv.submissionId);
      if (!existing) {
        map.set(iv.submissionId, iv);
        continue;
      }
      const existingWhen = new Date(existing.scheduledAt || existing.occurredAt).getTime();
      const bothFuture = when >= now && existingWhen >= now;
      if (bothFuture ? when < existingWhen : when > existingWhen) map.set(iv.submissionId, iv);
    }
    return map;
  }, [interviews]);

  const ivCount = useMemo(() => {
    const counts = new Map<string, number>();
    for (const iv of interviews) if (iv.submissionId) counts.set(iv.submissionId, (counts.get(iv.submissionId) || 0) + 1);
    return counts;
  }, [interviews]);

  if (loading && submissions.length === 0 && !error) {
    return (
      <ul role="status" aria-label="Loading submissions" className="divide-y divide-mist-100">
        {Array.from({ length: 4 }, (_, i) => (
          <li key={i} className="flex items-center gap-4 px-5 py-4">
            <span className="grid flex-1 gap-1.5">
              <Skeleton className="h-3.5 w-40" />
              <Skeleton className="h-3 w-56 max-w-full" />
            </span>
            <Skeleton className="h-5 w-20 rounded-md" />
          </li>
        ))}
      </ul>
    );
  }

  if (error) return <ErrorState framed={false} title="Couldn't load submissions" message={error} onRetry={() => void load()} retrying={loading} />;

  if (submissions.length === 0) {
    return (
      <EmptyState
        compact
        icon="send"
        title="Nothing submitted for this role yet"
        body="Submissions are recorded from a candidate's page. Open an applicant and record where you sent them."
      />
    );
  }

  return (
    <div>
      {/* Column heads from md, where rows line up as a table. */}
      <div aria-hidden className="hidden gap-4 border-b border-mist-200 px-5 py-2.5 text-adm-xs font-medium text-mist-600 md:flex">
        <span className="min-w-0 flex-1">Candidate</span>
        <span className="w-24 shrink-0 text-right">Rate</span>
        <span className="w-24 shrink-0">Sent</span>
        <span className="hidden w-48 shrink-0 lg:block">Interviews</span>
        <span className="w-28 shrink-0">Status</span>
      </div>
      <ul className="divide-y divide-mist-100">
        {submissions.map((s) => {
          const next = nextInterview.get(s.id);
          const count = ivCount.get(s.id) || 0;
          const target = s.clientName || s.vendorName;
          return (
            <li key={s.id} className="relative flex flex-wrap items-center gap-x-4 gap-y-1.5 px-5 py-3.5 hover:bg-mist-50">
              <span className="min-w-0 flex-1 basis-56">
                <Link href={`/portal/candidates/${s.applicationId}`} className="block truncate text-adm-base font-medium text-navy-900 after:absolute after:inset-0 hover:text-ocean-700">
                  {s.candidateName || "Unnamed candidate"}
                </Link>
                <span className="block truncate text-adm-xs text-mist-600">
                  {target ? `To ${target}` : "Recipient not recorded"}
                  {s.clientName && s.vendorName && ` via ${s.vendorName}`}
                  {s.submittedTo && ` · ${s.submittedTo}`}
                </span>
              </span>
              <span className="text-adm-base tabular-nums text-mist-700 md:w-24 md:shrink-0 md:text-right">
                <span className="md:hidden">Rate </span>
                {formatRate(s.rate, s.rateUnit, s.currency)}
              </span>
              <span className="text-adm-base tabular-nums text-mist-600 md:w-24 md:shrink-0">
                <span className="md:hidden">Sent </span>
                {fmtDate(s.occurredAt)}
              </span>
              <span className="hidden w-48 shrink-0 text-adm-xs text-mist-600 lg:block">
                {count === 0 ? (
                  <span className="text-mist-600">–</span>
                ) : (
                  <span className="inline-flex min-w-0 items-center gap-1.5 tabular-nums">
                    <Icon name="calendar" className="size-3.5 shrink-0 text-mist-500" />
                    <span className="truncate">
                      {count}
                      {next && ` · R${next.round} ${INTERVIEW_STATUS_LABELS[next.status].toLowerCase()} ${fmtDate(next.scheduledAt)}`}
                    </span>
                  </span>
                )}
              </span>
              <span className="md:w-28 md:shrink-0">
                <Badge tone={kitTone(submissionTone(s.status))} dot>{SUBMISSION_STATUS_LABELS[s.status]}</Badge>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
