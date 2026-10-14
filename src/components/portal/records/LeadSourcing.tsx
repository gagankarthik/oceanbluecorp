"use client";

// Rank the resume bank and talent bench against a job or pasted requirements.
// Resumes are vectorized at upload; a search embeds the job and re-ranks.
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Job } from "@/lib/aws/dynamodb";
import { useJobSummaries } from "@/hooks/use-console-data";
import { Badge, Button, EmptyState, ErrorState, Page, PageHeader, Panel, Segmented, Skeleton, type Tone } from "@/components/portal/kit";
import { useToast } from "@/components/portal/toast";
import { Field, JobPicker, TextArea } from "@/components/portal/fields";
import Icon from "@/components/portal/icons";

type Verdict = "strong" | "possible" | "weak";
type Origin = "bank" | "bench" | "applicant";

interface Candidate {
  resume_id: string;
  candidate_name: string | null;
  fit_score: number;
  qualified: boolean;
  verdict: Verdict;
  matched_skills: string[];
  missing_skills: string[];
  rationale: string | null;
  origin?: Origin;
  profileId?: string;
  email?: string;
  phone?: string;
  fileName?: string;
  bankId?: string;
}

const TEXT_MAX = 20_000;
const VERDICT: Record<Verdict, { label: string; tone: Tone }> = {
  strong: { label: "Strong fit", tone: "green" },
  possible: { label: "Possible", tone: "amber" },
  weak: { label: "Weak", tone: "grey" },
};
const ORIGIN: Record<Origin, string> = { bench: "Talent bench", applicant: "Applicant", bank: "Resume bank" };
/** Phrases the model sometimes puts in a skills list instead of leaving it empty. */
const NO_SKILL = /^(none|n\/?a|nil|nothing|-+|none (significant|identified|missing|noted)|no (major |significant )?(gaps?|missing skills?))\.?$/i;

function Skills({ matched, missing }: { matched: string[]; missing: string[] }) {
  const m = matched.filter((s) => !NO_SKILL.test(s.trim()));
  const x = missing.filter((s) => !NO_SKILL.test(s.trim()));
  if (!m.length && !x.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {m.map((s) => (
        <span key={`m-${s}`} className="inline-flex items-center gap-1 rounded-md bg-[#ecfdf3] px-2 py-0.5 text-[12px] font-medium text-[#067647]">
          <Icon name="check" className="size-3" />
          {s}
        </span>
      ))}
      {x.map((s) => (
        <span key={`x-${s}`} className="inline-flex items-center gap-1 rounded-md bg-mist-100 px-2 py-0.5 text-[12px] font-medium text-mist-700">
          <Icon name="x" className="size-3" />
          {s}
        </span>
      ))}
    </div>
  );
}

export function LeadSourcing() {
  const notify = useToast();
  // The bench tab the button was pressed from, so Back returns there.
  const [backPool, setBackPool] = useState("all");
  useEffect(() => {
    const from = new URLSearchParams(window.location.search).get("from");
    if (from === "all" || from === "internal" || from === "external") setBackPool(from);
  }, []);

  const [mode, setMode] = useState<"job" | "paste">("job");
  const [jobId, setJobId] = useState("");
  const [jobText, setJobText] = useState("");
  const [loading, setLoading] = useState(false);
  const [ran, setRan] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const { jobs: allJobs, error: jobsError } = useJobSummaries();
  const jobs = useMemo<Job[]>(() => allJobs ?? [], [allJobs]);
  useEffect(() => {
    if (jobsError) notify("Couldn't load your jobs. You can still paste a job description.", { tone: "error" });
  }, [jobsError, notify]);

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

  const canRun = mode === "job" ? !!jobId : !!jobText.trim() && jobText.length <= TEXT_MAX;

  const openBankResume = async (bankId: string) => {
    try {
      const res = await fetch(`/api/resume-bank/${bankId}`);
      const data = await res.json();
      if (!res.ok || !data.downloadUrl) throw new Error();
      window.open(data.downloadUrl, "_blank");
    } catch {
      notify("Couldn't open this resume file. Try again.", { tone: "error" });
    }
  };

  return (
    <Page width="narrow">
      <PageHeader
        back={{ label: "Talent bench", href: `/portal/talent-bench?pool=${backPool}` }}
        icon="target"
        title="Lead sourcing"
        description="Rank your resume bank and talent bench against a job, with the skills each person matches and misses."
      />

      <Panel
        title="Find candidates"
        description="Start from a job, or paste the requirements you are sourcing for."
        action={
          <Segmented
            label="Search input"
            size="sm"
            value={mode}
            onChange={setMode}
            options={[
              { value: "job", label: "From a job" },
              { value: "paste", label: "Paste a description" },
            ]}
          />
        }
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void find();
          }}
          className="grid gap-4"
        >
          {mode === "job" ? (
            <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
              <Field label="Job" required htmlFor="ls-job">
                <JobPicker id="ls-job" jobs={jobs} value={jobId} includeClosed noneLabel="Select a job…" onChange={(_, id) => setJobId(id)} />
              </Field>
              <Button type="submit" icon="search" loading={loading} disabled={!canRun}>
                Find candidates
              </Button>
              <p className="text-[12px] text-mist-600 sm:col-span-2">The ranking is saved on the job and also shows in its AI matches tab.</p>
            </div>
          ) : (
            <>
              <Field
                label="Job description"
                required
                htmlFor="ls-jd"
                hint={`${jobText.length.toLocaleString()} / ${TEXT_MAX.toLocaleString()}`}
                error={jobText.length > TEXT_MAX ? "That's longer than 20,000 characters. Trim it to the requirements." : undefined}
              >
                <TextArea id="ls-jd" rows={7} value={jobText} onChange={(e) => setJobText(e.target.value)} placeholder="Paste a job description, or list the skills and requirements…" />
              </Field>
              <div className="flex justify-end">
                <Button type="submit" icon="search" loading={loading} disabled={!canRun}>
                  Find candidates
                </Button>
              </div>
            </>
          )}
        </form>
      </Panel>

      {loading ? (
        <Panel title="Matched candidates" description="Ranking your resume bank and talent bench…" padded={false}>
          <ul role="status" aria-label="Ranking candidates" className="divide-y divide-mist-100">
            {Array.from({ length: 4 }, (_, i) => (
              <li key={i} className="flex items-center gap-4 px-5 py-4">
                <Skeleton className="h-3.5 w-5" />
                <span className="grid flex-1 gap-2">
                  <Skeleton className="h-4 w-44 max-w-[60%]" />
                  <Skeleton className="h-3 w-60 max-w-[80%]" />
                </span>
                <Skeleton className="hidden h-6 w-20 rounded-md sm:block" />
                <Skeleton className="h-6 w-12" />
              </li>
            ))}
          </ul>
        </Panel>
      ) : error ? (
        <ErrorState title="Couldn't find candidates" message={error} onRetry={() => void find()} />
      ) : ran && candidates.length === 0 ? (
        <EmptyState
          framed
          icon="bench"
          title="No matching candidates"
          body="Resumes become searchable once they are indexed. Open the resume bank and choose Index all to include existing files."
          primary={{ label: "Open resume bank", icon: "resume", href: "/portal/resumes" }}
        />
      ) : candidates.length > 0 ? (
        <Panel title="Matched candidates" description={`${candidates.length} ranked by fit score`} padded={false}>
          <ol className="divide-y divide-mist-100">
            {candidates.map((c, i) => {
              const open = !!expanded[c.resume_id];
              const v = VERDICT[c.verdict] ?? VERDICT.weak;
              return (
                <li key={c.resume_id}>
                  <button
                    type="button"
                    aria-expanded={open}
                    onClick={() => setExpanded((m) => ({ ...m, [c.resume_id]: !m[c.resume_id] }))}
                    className="flex min-h-16 w-full items-center gap-3 px-5 py-3 text-left hover:bg-mist-50 sm:gap-4"
                  >
                    <span className="w-5 shrink-0 text-right text-[12px] font-medium tabular-nums text-mist-500">{i + 1}</span>
                    <span className="min-w-0 flex-1">
                      <span className="flex min-w-0 flex-wrap items-center gap-2">
                        <span className="truncate text-[15px] font-semibold text-navy-900">{c.candidate_name || "Unnamed candidate"}</span>
                        {c.origin && <Badge tone={c.origin === "bench" ? "blue" : "grey"}>{ORIGIN[c.origin]}</Badge>}
                      </span>
                      <span className="mt-0.5 block truncate text-[12px] text-mist-600">{[c.email, c.phone].filter(Boolean).join(" · ") || c.fileName || c.resume_id}</span>
                    </span>
                    <span className="hidden sm:block">
                      <Badge tone={v.tone}>{v.label}</Badge>
                    </span>
                    <span className="shrink-0 text-right tabular-nums">
                      <span className={`text-[20px] font-semibold leading-none ${c.fit_score >= 60 ? "text-[#067647]" : "text-[#b42318]"}`}>{c.fit_score}</span>
                      <span className="text-[12px] text-mist-500">/100</span>
                    </span>
                    <Icon name="chevronDown" className={`size-4 shrink-0 text-mist-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
                  </button>
                  {open && (
                    <div className="grid gap-3 px-5 pb-5 sm:pl-[3.25rem]">
                      <span className="sm:hidden">
                        <Badge tone={v.tone}>{v.label}</Badge>
                      </span>
                      {c.rationale && (
                        <div>
                          <p className="text-[12px] font-semibold text-mist-500">Why {c.qualified ? "they fit" : "they may not fit"}</p>
                          <p className="mt-1 max-w-[72ch] text-[14px] leading-relaxed text-mist-700">{c.rationale}</p>
                        </div>
                      )}
                      <Skills matched={c.matched_skills} missing={c.missing_skills} />
                      <div className="flex flex-wrap gap-2">
                        {/* Bank hits are files, not records: link each to what it is. */}
                        {c.profileId ? (
                          <Button size="sm" variant="secondary" icon="chevronRight" href={`/portal/candidates/${c.profileId}`}>
                            View full profile
                          </Button>
                        ) : c.bankId ? (
                          <Button size="sm" variant="secondary" icon="external" onClick={() => void openBankResume(c.bankId!)}>
                            Open resume
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        </Panel>
      ) : null}
      {!ran && !loading && (
        <p className="text-center text-[13px] text-mist-600">
          Results are ranked from indexed resumes. Manage files in the{" "}
          <Link href="/portal/resumes" className="font-medium text-ocean-700 underline-offset-4 hover:underline">
            resume bank
          </Link>
          .
        </p>
      )}
    </Page>
  );
}
