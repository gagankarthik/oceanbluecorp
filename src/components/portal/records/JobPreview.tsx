"use client";

import * as React from "react";
import JobPostingView, { type PostingJob } from "@/components/site/JobPostingView";
import type { QualityCheck } from "@/lib/job-quality";
import Icon from "@/components/portal/icons";

/**
 * The Review step: up to three suggestions, then the posting as the careers
 * site prints it. Loaded only when Review opens.
 */
export default function JobReview({
  job,
  jobId,
  suggestions,
  onJump,
}: {
  job: PostingJob;
  jobId?: string;
  suggestions: QualityCheck[];
  onJump: (field: string) => void;
}) {
  const today = React.useMemo(() => new Date().toISOString(), []);
  return (
    <div className="grid gap-6">
      {suggestions.length > 0 && (
        <div>
          <p className="text-adm-base font-medium text-navy-900">Before you publish</p>
          <ul className="mt-2 grid gap-1">
            {suggestions.slice(0, 3).map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => onJump(c.field)}
                  className="flex min-h-10 w-full items-start gap-2.5 rounded-lg py-2 text-left text-adm-base text-mist-700 hover:text-navy-900"
                >
                  <Icon name="alert" className="mt-0.5 size-4 shrink-0 text-status-warning" />
                  <span className="min-w-0">
                    <span className="font-medium text-navy-900 underline-offset-4 hover:underline">{c.label}</span>
                    {c.detail && <span> · {c.detail}</span>}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="overflow-hidden rounded-xl ring-1 ring-mist-200">
        <div className="flex h-9 items-center gap-2 border-b border-mist-200 bg-mist-50 px-3 text-adm-xs text-mist-600">
          <Icon name="lock" className="size-3.5 shrink-0" />
          <span className="truncate">oceanbluecorp.com/jobs/{jobId ?? "new-role"}</span>
        </div>
        {/* Scaled so the page's own layout fits the column, as a preview pane shows it. */}
        <div role="region" aria-label="Posting preview" style={{ zoom: 0.8 }}>
          <JobPostingView job={job} postedAt={today} preview />
        </div>
      </div>
    </div>
  );
}
