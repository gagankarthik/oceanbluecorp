"use client";

// The parsed resume, read as sections: summary and signals, skills, experience, then the rest.
import type { ResumeAnalysis, ResumeEducation, ResumeSkills, ResumeWorkExperience } from "@/lib/aws/dynamodb";
import { Panel, Skeleton } from "@/components/portal/kit";
import Icon from "@/components/portal/icons";

function dateRange(start?: string | null, end?: string | null, isCurrent?: boolean | null): string {
  const s = (start || "").trim();
  const e = isCurrent ? "Present" : (end || "").trim();
  if (s && e) return `${s} – ${e}`;
  return s || e || "";
}

function Chips({ items, tone = "blue" }: { items?: string[]; tone?: "blue" | "grey" }) {
  const list = (items || []).filter(Boolean);
  if (!list.length) return null;
  return (
    <ul className="flex flex-wrap gap-1.5">
      {list.map((it, i) => (
        <li
          key={`${it}-${i}`}
          className={`inline-flex max-w-full items-center rounded-md px-2 py-0.5 text-[12px] font-medium ${tone === "blue" ? "bg-ocean-50 text-ocean-700" : "bg-mist-100 text-mist-700"}`}
        >
          <span className="min-w-0 truncate">{it}</span>
        </li>
      ))}
    </ul>
  );
}

const Count = ({ n }: { n: number }) => <span className="ml-2 text-[13px] font-medium tabular-nums text-mist-500">{n}</span>;

/** One signal; blanks are skipped rather than shown as data. */
function Signal({ label, value }: { label: string; value?: string | number | null }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="min-w-0 rounded-lg bg-mist-50 px-3.5 py-3 ring-1 ring-inset ring-mist-200">
      <dt className="text-[12px] font-medium text-mist-600">{label}</dt>
      <dd className="mt-1 truncate text-[16px] font-semibold tabular-nums text-navy-900" title={String(value)}>
        {value}
      </dd>
    </div>
  );
}

const bullet = "relative pl-4 before:absolute before:left-0 before:top-[0.6em] before:size-1 before:rounded-full";

const SKILL_GROUPS: Array<{ key: keyof ResumeSkills; label: string }> = [
  { key: "technical_skills", label: "Technical" },
  { key: "programming_languages", label: "Languages" },
  { key: "frameworks_and_libraries", label: "Frameworks & libraries" },
  { key: "databases", label: "Databases" },
  { key: "cloud_platforms", label: "Cloud" },
  { key: "tools_and_platforms", label: "Tools & platforms" },
  { key: "methodologies", label: "Methodologies" },
  { key: "domain_skills", label: "Domain" },
  { key: "soft_skills", label: "Soft skills" },
  { key: "operating_systems", label: "Operating systems" },
  { key: "design_skills", label: "Design" },
  { key: "other_skills", label: "Other" },
];

/** Verbatim categories from the resume win over the parser's groups; the raw list is the last resort. */
function skillRows(s?: ResumeSkills): { label?: string; items: string[] }[] {
  if (!s) return [];
  const cats = (s.categories || []).filter((c) => (c.skills || []).length);
  if (cats.length) return cats.map((c) => ({ label: c.name || undefined, items: c.skills || [] }));
  const groups = SKILL_GROUPS.map((g) => ({ label: g.label, items: (s[g.key] as string[]) || [] })).filter((g) => g.items.length);
  if (groups.length) return groups;
  return (s.all_skills_raw || []).length ? [{ items: s.all_skills_raw! }] : [];
}

function WorkEntry({ w }: { w: ResumeWorkExperience }) {
  const range = dateRange(w.start_date, w.end_date, w.is_current);
  return (
    <li className="relative border-l-2 border-mist-200 pb-6 pl-5 last:border-transparent last:pb-0">
      <span aria-hidden className={`absolute -left-[7px] top-1.5 size-3 rounded-full ring-2 ring-mist-0 ${w.is_current ? "bg-ocean-600" : "bg-mist-400"}`} />
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
        <div className="min-w-0">
          <p className="text-[15px] font-semibold text-navy-900">{w.job_title || "Role"}</p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-mist-600">
            {w.company_name && (
              <span className="inline-flex min-w-0 items-center gap-1.5">
                <Icon name="building" className="size-4 shrink-0 text-mist-500" />
                {w.company_name}
              </span>
            )}
            {w.location && (
              <span className="inline-flex min-w-0 items-center gap-1.5">
                <Icon name="map" className="size-4 shrink-0 text-mist-500" />
                {w.location}
              </span>
            )}
          </p>
        </div>
        {range && <span className="shrink-0 text-[13px] tabular-nums text-mist-600">{range}</span>}
      </div>
      {!!w.responsibilities?.length && (
        <ul className="mt-3 grid max-w-[72ch] gap-1">
          {w.responsibilities.map((r, i) => (
            <li key={i} className={`${bullet} text-[14px] leading-relaxed text-mist-700 before:bg-mist-400`}>
              {r}
            </li>
          ))}
        </ul>
      )}
      {!!w.achievements?.length && (
        <ul className="mt-3 grid max-w-[72ch] gap-1" aria-label="Achievements">
          {w.achievements.map((a, i) => (
            <li key={i} className={`${bullet} text-[14px] leading-relaxed text-navy-900 before:bg-[#17b26a]`}>
              {a}
            </li>
          ))}
        </ul>
      )}
      {!!w.technologies_used?.length && (
        <div className="mt-3">
          <Chips items={w.technologies_used} tone="grey" />
        </div>
      )}
    </li>
  );
}

function EduEntry({ e }: { e: ResumeEducation }) {
  const range = dateRange(e.start_date, e.end_date, e.is_current);
  const degree = [e.degree_type || e.degree, e.field_of_study || e.major].filter(Boolean).join(", ");
  return (
    <li className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1 py-3 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <p className="text-[14px] font-semibold text-navy-900">{e.institution_name || "Institution"}</p>
        {degree && <p className="mt-0.5 text-[13px] text-mist-600">{degree}</p>}
        {(e.gpa || e.grade || e.percentage) && (
          <p className="mt-0.5 text-[12px] tabular-nums text-mist-500">{e.gpa ? `GPA ${e.gpa}` : e.percentage ? `${e.percentage}%` : e.grade}</p>
        )}
      </div>
      {range && <span className="shrink-0 text-[13px] tabular-nums text-mist-600">{range}</span>}
    </li>
  );
}

export function ResumeAnalysisPanel({ analysis }: { analysis: ResumeAnalysis }) {
  const a = analysis.analytics;
  const work = analysis.work_experience || [];
  const edu = analysis.education || [];
  const skills = skillRows(analysis.skills);
  const certs = analysis.certifications || [];
  const projects = analysis.projects || [];
  const awards = analysis.awards_and_honors || [];
  const langs = analysis.languages || [];
  const hasSummary = !!(analysis.professional_summary || analysis.objective);

  const signals = a && (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
      <Signal label="Experience" value={a.total_years_of_experience != null ? `${a.total_years_of_experience} yrs` : null} />
      <Signal label="Career level" value={a.career_level} />
      <Signal label="Primary industry" value={a.primary_industry} />
      <Signal label="Highest education" value={a.highest_education_level} />
      <Signal label="Companies" value={a.number_of_companies} />
      <Signal label="Roles" value={a.number_of_roles} />
      <Signal label="Avg tenure" value={a.average_tenure_months != null ? `${a.average_tenure_months} mo` : null} />
      <Signal label="Location" value={a.primary_location} />
    </dl>
  );

  return (
    <div className="grid gap-6">
      {(a || hasSummary) && (
        <Panel title="Summary" description={a ? "Signals the parser read from the resume" : undefined}>
          <div className="grid gap-5">
            {signals}
            {!!a?.job_functions?.length && (
              <div>
                <p className="mb-2 text-[12px] font-semibold text-mist-500">Job functions</p>
                <Chips items={a.job_functions} tone="grey" />
              </div>
            )}
            {analysis.professional_summary && <p className="max-w-[72ch] whitespace-pre-line text-[14px] leading-relaxed text-mist-700">{analysis.professional_summary}</p>}
            {analysis.objective && (
              <div>
                <p className="mb-1 text-[12px] font-semibold text-mist-500">Objective</p>
                <p className="max-w-[72ch] whitespace-pre-line text-[14px] leading-relaxed text-mist-700">{analysis.objective}</p>
              </div>
            )}
          </div>
        </Panel>
      )}

      {skills.length > 0 && (
        <Panel title="Skills">
          <dl className="grid gap-4">
            {skills.map((g, i) => (
              <div key={i} className="grid gap-2 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-4">
                {g.label ? <dt className="pt-0.5 text-[13px] font-medium text-mist-600">{g.label}</dt> : <dt className="sr-only">Skills</dt>}
                <dd className={g.label ? "" : "sm:col-span-2"}>
                  <Chips items={g.items} />
                </dd>
              </div>
            ))}
          </dl>
        </Panel>
      )}

      {work.length > 0 && (
        <Panel title={<>Experience<Count n={work.length} /></>}>
          <ol className="ml-1.5">
            {work.map((w, i) => (
              <WorkEntry key={i} w={w} />
            ))}
          </ol>
        </Panel>
      )}

      {(edu.length > 0 || certs.length > 0) && (
        <div className={`grid gap-6 ${edu.length > 0 && certs.length > 0 ? "xl:grid-cols-2" : ""}`}>
          {edu.length > 0 && (
            <Panel title={<>Education<Count n={edu.length} /></>}>
              <ul className="divide-y divide-mist-100">
                {edu.map((e, i) => (
                  <EduEntry key={i} e={e} />
                ))}
              </ul>
            </Panel>
          )}
          {certs.length > 0 && (
            <Panel title={<>Certifications<Count n={certs.length} /></>}>
              <ul className="divide-y divide-mist-100">
                {certs.map((c, i) => (
                  <li key={i} className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1 py-3 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="text-[14px] font-semibold text-navy-900">{c.name}</p>
                      {c.issuing_organization && <p className="mt-0.5 text-[13px] text-mist-600">{c.issuing_organization}</p>}
                    </div>
                    {(c.issue_date || c.expiry_date) && <span className="shrink-0 text-[13px] tabular-nums text-mist-600">{dateRange(c.issue_date, c.expiry_date)}</span>}
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </div>
      )}

      {projects.length > 0 && (
        <Panel title={<>Projects<Count n={projects.length} /></>}>
          <ul className="divide-y divide-mist-100">
            {projects.map((p, i) => {
              const range = dateRange(p.start_date, p.end_date, p.is_current);
              return (
                <li key={i} className="grid gap-2 py-4 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                    <p className="text-[14px] font-semibold text-navy-900">{p.name}</p>
                    {range && <span className="text-[13px] tabular-nums text-mist-600">{range}</span>}
                  </div>
                  {p.description && <p className="max-w-[72ch] text-[14px] leading-relaxed text-mist-700">{p.description}</p>}
                  {!!p.highlights?.length && (
                    <ul className="grid max-w-[72ch] gap-1">
                      {p.highlights.map((h, j) => (
                        <li key={j} className={`${bullet} text-[14px] leading-relaxed text-mist-700 before:bg-mist-400`}>
                          {h}
                        </li>
                      ))}
                    </ul>
                  )}
                  {!!p.technologies?.length && <Chips items={p.technologies} tone="grey" />}
                </li>
              );
            })}
          </ul>
        </Panel>
      )}

      {(awards.length > 0 || langs.length > 0) && (
        <div className={`grid gap-6 ${awards.length > 0 && langs.length > 0 ? "md:grid-cols-2" : ""}`}>
          {awards.length > 0 && (
            <Panel title={<>Awards<Count n={awards.length} /></>}>
              <ul className="divide-y divide-mist-100">
                {awards.map((aw, i) => (
                  <li key={i} className="py-3 first:pt-0 last:pb-0">
                    <p className="text-[14px] font-semibold text-navy-900">{aw.title}</p>
                    {(aw.issuer || aw.date) && <p className="mt-0.5 text-[13px] text-mist-600">{[aw.issuer, aw.date].filter(Boolean).join(" · ")}</p>}
                  </li>
                ))}
              </ul>
            </Panel>
          )}
          {langs.length > 0 && (
            <Panel title={<>Languages<Count n={langs.length} /></>}>
              <ul className="flex flex-wrap gap-2">
                {langs.map((l, i) => (
                  <li key={i} className="inline-flex items-center gap-1.5 rounded-lg bg-mist-50 px-3 py-1.5 text-[13px] ring-1 ring-inset ring-mist-200">
                    <span className="font-medium text-navy-900">{l.language}</span>
                    {l.proficiency && <span className="text-mist-600">{l.proficiency}</span>}
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </div>
      )}

      {!!analysis.interests_and_hobbies?.length && (
        <Panel title="Interests">
          <Chips items={analysis.interests_and_hobbies} tone="grey" />
        </Panel>
      )}
    </div>
  );
}

/** Same shape as the panels above, for the wait while a resume is analysed. */
export function ResumeAnalysisSkeleton({ label = "Analyzing the resume" }: { label?: string }) {
  const card = "rounded-xl bg-mist-0 ring-1 ring-mist-200";
  return (
    <div role="status" aria-busy="true" aria-label={label} className="grid gap-6">
      <div className={card}>
        <div className="border-b border-mist-200 px-5 py-4">
          <Skeleton className="h-4 w-28" />
        </div>
        <div className="grid gap-5 p-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-[66px] rounded-lg" />
            ))}
          </div>
          <div className="grid gap-2">
            <Skeleton className="h-3.5 w-11/12" />
            <Skeleton className="h-3.5 w-10/12" />
            <Skeleton className="h-3.5 w-2/3" />
          </div>
        </div>
      </div>
      <div className={card}>
        <div className="border-b border-mist-200 px-5 py-4">
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="flex flex-wrap gap-1.5 p-5">
          {["w-16", "w-20", "w-14", "w-24", "w-16", "w-12", "w-20"].map((w, i) => (
            <Skeleton key={i} className={`h-5 rounded-md ${w}`} />
          ))}
        </div>
      </div>
      <span className="sr-only">{label}</span>
    </div>
  );
}
