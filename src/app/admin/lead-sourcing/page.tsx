"use client";

// Lead Sourcing, find the best-matching candidates from the resume bank for a
// job. Two inputs: pick one of your jobs, or paste a job description. Results are
// ranked by fit with matched/missing skills. Resumes are vectorized once at
// upload; searching only embeds the job + re-ranks, so it's fast.
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { AdminCard, AdminCardHeader } from "@/components/admin/admin-card";
import { WorkspaceButton } from "@/components/admin/workspace";
import { IconSource, IconWarning, IconRequisition, IconGroup } from "@/components/admin/icons";
import { VerdictBadge, SkillChips, OriginBadge, fitScoreColor, type Verdict, type MatchOrigin } from "@/components/admin/fit-ui";
import { cn } from "@/lib/utils";

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
    fetch("/api/jobs")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && Array.isArray(d.jobs)) {
          setJobs(
            d.jobs.map((j: JobOption) => ({ id: j.id, title: j.title, department: j.department, status: j.status })),
          );
        }
      })
      .catch(() => {});
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
      setError("Network error. Please try again.");
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

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="text-[22px] font-semibold text-[var(--adm-ink)]">Lead Sourcing</h1>
        <p className="mt-1 text-[14px] text-[var(--adm-ink-mute)]">
          Find the best-matching candidates across your resume bank and talent bench for a job, by fit score, with the skills they match and miss.
        </p>
      </header>

      <AdminCard>
        <AdminCardHeader icon={IconSource} title="Find candidates" />
        <div className="p-6">
          {/* Mode toggle */}
          <div className="mb-4 inline-flex rounded-[8px] border border-[var(--adm-line)] bg-[var(--adm-surface-2)] p-0.5">
            {(["job", "paste"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={cn(
                  "rounded-[6px] px-3.5 py-1.5 text-[13px] font-semibold transition-colors",
                  mode === m
                    ? "bg-[var(--adm-surface)] text-[var(--adm-ink)] shadow-[var(--adm-shadow-sm)]"
                    : "text-[var(--adm-ink-mute)] hover:text-[var(--adm-ink)]",
                )}
              >
                {m === "job" ? "From a job" : "Paste a JD"}
              </button>
            ))}
          </div>

          {mode === "job" ? (
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <IconRequisition
                  className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[var(--adm-ink-subtle)]"
                  strokeWidth={1.75}
                />
                <select
                  value={jobId}
                  onChange={(e) => setJobId(e.target.value)}
                  className="h-10 w-full appearance-none rounded-[8px] border border-[var(--adm-line)] bg-[var(--adm-surface)] pl-10 pr-3 text-[14px] text-[var(--adm-ink)] outline-none focus:border-[var(--adm-accent)]"
                >
                  <option value="">Select a job…</option>
                  {jobs.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.title}
                      {j.department ? ` , ${j.department}` : ""}
                      {j.status ? ` (${j.status})` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <WorkspaceButton variant="primary" onClick={find} disabled={loading || !canRun}>
                {loading ? "Finding…" : "Find candidates"}
              </WorkspaceButton>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <textarea
                value={jobText}
                onChange={(e) => setJobText(e.target.value)}
                rows={6}
                placeholder="Paste a job description, or list the skills / requirements you're sourcing for…"
                className="w-full rounded-[8px] border border-[var(--adm-line)] bg-[var(--adm-surface)] px-3.5 py-2.5 text-[14px] leading-relaxed text-[var(--adm-ink)] outline-none placeholder:text-[var(--adm-ink-subtle)] focus:border-[var(--adm-accent)]"
              />
              <div className="flex justify-end">
                <WorkspaceButton variant="primary" onClick={find} disabled={loading || !canRun}>
                  {loading ? "Finding…" : "Find candidates"}
                </WorkspaceButton>
              </div>
            </div>
          )}
        </div>
      </AdminCard>

      {/* Results */}
      {loading && (
        <AdminCard>
          <div className="flex items-center gap-3 p-6 text-[14px] text-[var(--adm-ink-mute)]">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--adm-line)] border-t-[var(--adm-accent)]" />
            Ranking your resume bank and talent bench…
          </div>
        </AdminCard>
      )}

      {!loading && error && (
        <AdminCard>
          <div className="flex items-start gap-2.5 p-6 text-[14px] text-red-700">
            <IconWarning className="mt-0.5 h-[18px] w-[18px] flex-none" strokeWidth={1.75} />
            <span>{error}</span>
          </div>
        </AdminCard>
      )}

      {!loading && !error && ran && candidates.length === 0 && (
        <AdminCard>
          <div className="flex flex-col items-center gap-2 p-10 text-center">
            <IconGroup className="h-8 w-8 text-[var(--adm-ink-subtle)]" strokeWidth={1.5} />
            <p className="text-[14px] text-[var(--adm-ink-mute)]">
              No candidates found. Resumes become searchable once indexed, open{" "}
              <Link href="/admin/resumes" className="font-semibold text-[var(--adm-accent)] hover:underline">Resumes</Link>{" "}
              and click &ldquo;Index all&rdquo; to make existing ones searchable.
            </p>
          </div>
        </AdminCard>
      )}

      {!loading && candidates.length > 0 && (
        <AdminCard>
          <AdminCardHeader icon={IconGroup} title="Matched candidates" count={candidates.length} />
          <ol className="flex flex-col divide-y divide-[var(--adm-line)]">
            {candidates.map((c, i) => {
              const open = !!expanded[c.resume_id];
              return (
                <li key={c.resume_id}>
                  <button
                    type="button"
                    aria-expanded={open}
                    onClick={() => setExpanded((m) => ({ ...m, [c.resume_id]: !m[c.resume_id] }))}
                    className="flex w-full items-center justify-between gap-3 p-4 text-left transition-colors hover:bg-[var(--adm-row-hover)] sm:gap-4 sm:p-5"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-[var(--adm-surface-2)] text-[13px] font-semibold tabular-nums text-[var(--adm-ink-mute)]">
                        {i + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="flex items-center gap-2 truncate text-[15px] font-semibold text-[var(--adm-ink)]">
                          <span className="truncate">{c.candidate_name || "Unnamed candidate"}</span>
                          <OriginBadge origin={c.origin} className="flex-none" />
                        </p>
                        <p className="truncate text-[12px] text-[var(--adm-ink-subtle)]">
                          {[c.email, c.phone].filter(Boolean).join(" · ") || c.fileName || c.resume_id}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-none items-center gap-2 sm:gap-3">
                      <VerdictBadge verdict={c.verdict} className="hidden sm:inline" />
                      <div className="text-right">
                        <span className={cn("text-[20px] font-bold tabular-nums leading-none sm:text-[22px]", fitScoreColor(c.fit_score))}>
                          {c.fit_score}
                        </span>
                        <span className="ml-0.5 text-[11px] font-medium text-[var(--adm-ink-subtle)]">/100</span>
                      </div>
                      <ChevronDown
                        className={cn("h-4 w-4 flex-none text-[var(--adm-ink-subtle)] transition-transform", open && "rotate-180")}
                      />
                    </div>
                  </button>

                  {open && (
                    <div className="px-4 pb-4 sm:px-5 sm:pb-5 sm:pl-16">
                      <VerdictBadge verdict={c.verdict} className="mb-3 inline-block sm:hidden" />
                      {c.rationale && (
                        <div className="mb-3">
                          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--adm-ink-subtle)]">
                            Why {c.qualified ? "they fit" : "they may not fit"}
                          </p>
                          <p className="text-[13px] leading-relaxed text-[var(--adm-ink-mute)]">{c.rationale}</p>
                        </div>
                      )}
                      <SkillChips matched={c.matched_skills} missing={c.missing_skills} />
                      {/* Bank hits are files, not candidate records, link each
                          hit to the thing it actually is. */}
                      {c.profileId ? (
                        <Link
                          href={`/admin/candidates/${c.profileId}`}
                          className="mt-3 inline-flex items-center gap-1 text-[13px] font-semibold text-[var(--adm-accent)] hover:underline"
                        >
                          View full profile →
                        </Link>
                      ) : c.bankId ? (
                        <button
                          type="button"
                          onClick={() => void openBankResume(c.bankId!)}
                          className="mt-3 inline-flex items-center gap-1 text-[13px] font-semibold text-[var(--adm-accent)] hover:underline"
                        >
                          Open resume →
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
