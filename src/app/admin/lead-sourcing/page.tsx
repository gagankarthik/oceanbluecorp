"use client";

// Lead Sourcing, find the best-matching candidates from the resume bank for a
// job. Two inputs: pick one of your jobs, or paste a job description. Results are
// ranked by fit with matched/missing skills. Resumes are vectorized once at
// upload; searching only embeds the job + re-ranks, so it's fast.
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowRight, ChevronDown } from "lucide-react";
import { AdminCard, AdminCardHeader } from "@/components/admin/admin-card";
import { RecordHeader, WorkspaceButton } from "@/components/admin/workspace";
import { PeriodSwitcher } from "@/components/admin/charts";
import { EmptyState } from "@/components/admin/empty-state";
import { Skel } from "@/components/admin/skeletons";
import { Field, FormSelect, FormTextarea } from "@/components/admin/forms/primitives";
import { IconGroup, IconWarning } from "@/components/admin/icons";
import { VerdictBadge, SkillChips, OriginBadge, fitScoreColor, type Verdict, type MatchOrigin } from "@/components/admin/fit-ui";
import { cn } from "@/lib/utils";

const MODES = [
  { value: "job", label: "From a job" },
  { value: "paste", label: "Paste a description" },
] as const;

interface Candidate {
  resume_id: string;
  candidate_name: string | null;
  fit_score: number;
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

interface JobOption {
  id: string;
  title: string;
  department?: string;
  status?: string;
}

export default function LeadSourcingPage() {
  /**
   * The bench tab the Lead Sourcing button was pressed from, so the back link
   * returns there instead of resetting to "All candidates". Defaults to "all"
   * for anyone arriving by a bare URL or a bookmark.
   */
  const [backPool, setBackPool] = useState("all");
  useEffect(() => {
    const from = new URLSearchParams(window.location.search).get("from");
    if (from === "all" || from === "internal" || from === "external") setBackPool(from);
  }, []);

  const [mode, setMode] = useState<"job" | "paste">("job");
  const [jobs, setJobs] = useState<JobOption[]>([]);
  const [jobId, setJobId] = useState("");
  const [jobText, setJobText] = useState("");
  const [loading, setLoading] = useState(false);
  const [ran, setRan] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  // Load jobs for the picker.
  useEffect(() => {
    fetch("/api/jobs?fields=summary")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => {
        if (d && Array.isArray(d.jobs)) {
          setJobs(
            d.jobs.map((j: JobOption) => ({ id: j.id, title: j.title, department: j.department, status: j.status })),
          );
        }
      })
      .catch((err) => {
        console.error("Failed to load jobs for lead sourcing:", err);
        toast.error("Couldn't load your jobs. You can still paste a job description.");
      });
  }, []);

  const find = useCallback(async () => {
    if (mode === "job" && !jobId) return;
    if (mode === "paste" && !jobText.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res =
        mode === "job"
          ? await fetch(`/api/jobs/${jobId}/match-candidates`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ topK: 15 }),
            })
          : await fetch(`/api/match`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ jobText: jobText.trim(), topK: 15 }),
            });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data?.error === "string" ? data.error : "Unable to find candidates right now.");
      } else {
        setCandidates(Array.isArray(data.candidates) ? data.candidates : []);
        setExpanded({});
      }
    } catch {
      setError("Couldn't reach the matcher. Check your connection and try again.");
    } finally {
      setLoading(false);
      setRan(true);
    }
  }, [mode, jobId, jobText]);

  const canRun = mode === "job" ? !!jobId : !!jobText.trim();

  /** Open a resume-bank file via its presigned download URL. */
  const openBankResume = async (bankId: string) => {
    try {
      const res = await fetch(`/api/resume-bank/${bankId}`);
      const data = await res.json();
      if (!res.ok || !data.downloadUrl) throw new Error();
      window.open(data.downloadUrl, "_blank");
    } catch {
      setError("Could not open this resume file.");
    }
  };

  const findButton = (
    <WorkspaceButton variant="primary" onClick={find} disabled={loading || !canRun}>
      {loading ? "Finding…" : "Find candidates"}
    </WorkspaceButton>
  );

  return (
    <div className="flex flex-col gap-4 pb-6 lg:gap-5">
      {/* Carries ?from= so the round trip lands on the pool tab you left. */}
      <RecordHeader
        className="mb-0"
        back={{ label: "Talent bench", href: `/admin/bench?pool=${backPool}` }}
        title="Lead sourcing"
        subtitle="Rank your resume bank and talent bench against a job, with the skills each candidate matches and misses."
      />

      <AdminCard>
        <AdminCardHeader
          title="Find candidates"
          subtitle="Start from an open job, or paste the requirements you are sourcing for"
          action={
            <PeriodSwitcher
              label="Search input"
              options={MODES}
              value={mode}
              onChange={setMode}
            />
          }
        />
        <div className="p-4">
          {mode === "job" ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <Field label="Job" htmlFor="ls-job" className="min-w-0 flex-1">
                <FormSelect id="ls-job" value={jobId} onChange={(e) => setJobId(e.target.value)}>
                  <option value="">Select a job…</option>
                  {jobs.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.title}
                      {j.department ? ` · ${j.department}` : ""}
                      {j.status ? ` (${j.status})` : ""}
                    </option>
                  ))}
                </FormSelect>
              </Field>
              {findButton}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <Field label="Job description" htmlFor="ls-jd">
                <FormTextarea
                  id="ls-jd"
                  value={jobText}
                  onChange={(e) => setJobText(e.target.value)}
                  rows={6}
                  placeholder="Paste a job description, or list the skills and requirements you're sourcing for…"
                />
              </Field>
              <div className="flex justify-end">{findButton}</div>
            </div>
          )}
        </div>
      </AdminCard>

      {loading && (
        <AdminCard>
          <AdminCardHeader title="Matched candidates" meta="Ranking your resume bank and talent bench…" />
          <div className="divide-y divide-[var(--adm-line-soft)]" aria-hidden="true">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 sm:gap-4">
                <Skel className="h-3.5 w-5" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skel className="h-4 w-44 max-w-[60%]" />
                  <Skel className="h-3 w-60 max-w-[80%]" />
                </div>
                <Skel className="hidden h-6 w-20 rounded-full sm:block" />
                <Skel className="h-6 w-12" />
              </div>
            ))}
          </div>
        </AdminCard>
      )}

      {!loading && error && (
        <div role="alert" className="flex items-start gap-2.5 rounded-[12px] border border-[var(--adm-danger-soft)] bg-[var(--adm-danger-soft)] px-4 py-3">
          <IconWarning className="mt-0.5 h-4 w-4 flex-none text-[var(--adm-danger-ink)]" aria-hidden="true" />
          <p className="text-[13.5px] leading-relaxed text-[var(--adm-danger-ink)]">{error}</p>
        </div>
      )}

      {!loading && !error && ran && candidates.length === 0 && (
        <AdminCard>
          <EmptyState
            icon={IconGroup}
            title="No matching candidates"
            description="Resumes become searchable once they are indexed. Open the resume bank and choose Index all to include existing files."
            action={
              <WorkspaceButton asChild>
                <Link href="/admin/resumes">Open resume bank</Link>
              </WorkspaceButton>
            }
          />
        </AdminCard>
      )}

      {!loading && candidates.length > 0 && (
        <AdminCard>
          <AdminCardHeader title="Matched candidates" meta="Ranked by fit score" count={candidates.length} />
          <ol className="divide-y divide-[var(--adm-line-soft)]">
            {candidates.map((c, i) => {
              const open = !!expanded[c.resume_id];
              return (
                <li key={c.resume_id}>
                  <button
                    type="button"
                    aria-expanded={open}
                    onClick={() => setExpanded((m) => ({ ...m, [c.resume_id]: !m[c.resume_id] }))}
                    className="flex w-full items-center justify-between gap-3 p-4 text-left transition-colors hover:bg-[var(--adm-row-hover)] sm:gap-4"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="w-6 flex-none text-right text-[13px] font-medium tabular-nums text-[var(--adm-ink-subtle)]">
                        {i + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="flex min-w-0 items-center gap-2">
                          <span className="truncate text-[15px] font-semibold text-[var(--adm-ink)]">
                            {c.candidate_name || "Unnamed candidate"}
                          </span>
                          <OriginBadge origin={c.origin} className="flex-none" />
                        </p>
                        <p className="mt-0.5 truncate text-[13px] text-[var(--adm-ink-mute)]">
                          {[c.email, c.phone].filter(Boolean).join(" · ") || c.fileName || c.resume_id}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-none items-center gap-3 sm:gap-4">
                      <VerdictBadge verdict={c.verdict} className="hidden sm:inline" />
                      <span className="text-right">
                        <span className={cn("text-[20px] font-semibold leading-none tracking-[-0.02em] tabular-nums", fitScoreColor(c.fit_score))}>
                          {c.fit_score}
                        </span>
                        <span className="ml-0.5 text-[12px] tabular-nums text-[var(--adm-ink-subtle)]">/100</span>
                      </span>
                      <ChevronDown
                        aria-hidden="true"
                        className={cn("h-4 w-4 flex-none text-[var(--adm-ink-subtle)] transition-transform duration-200", open && "rotate-180")}
                      />
                    </div>
                  </button>

                  {open && (
                    <div className="space-y-3 px-4 pb-4 sm:pl-[3.25rem]">
                      <VerdictBadge verdict={c.verdict} className="inline-block sm:hidden" />
                      {c.rationale && (
                        <div>
                          <p className="mb-1 text-[13px] font-medium text-[var(--adm-ink-mute)]">
                            Why {c.qualified ? "they fit" : "they may not fit"}
                          </p>
                          <p className="max-w-[72ch] text-[13.5px] leading-relaxed text-[var(--adm-ink-mute)]">{c.rationale}</p>
                        </div>
                      )}
                      <SkillChips matched={c.matched_skills} missing={c.missing_skills} />
                      {/* Bank hits are files, not candidate records: link each to what it is. */}
                      {c.profileId ? (
                        <Link
                          href={`/admin/candidates/${c.profileId}`}
                          className="inline-flex items-center gap-1 rounded-[6px] text-[13px] font-semibold text-[var(--adm-accent)] transition-colors hover:text-[var(--adm-accent-strong)] hover:underline"
                        >
                          View full profile <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                        </Link>
                      ) : c.bankId ? (
                        <button
                          type="button"
                          onClick={() => void openBankResume(c.bankId!)}
                          className="inline-flex items-center gap-1 rounded-[6px] text-[13px] font-semibold text-[var(--adm-accent)] transition-colors hover:text-[var(--adm-accent-strong)] hover:underline"
                        >
                          Open resume <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      ) : null}
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        </AdminCard>
      )}
    </div>
  );
}
