import type { CSSProperties, ReactNode } from "react";
import { workMode } from "@/lib/careers";
import { jobPlace } from "@/lib/workplace";
import { jobTypeLabel } from "@/lib/job-options";
import { renderListField, renderRichText } from "@/lib/rich-text";
import { formatSalary, type Salary } from "@/lib/salary";

/** The public fields of a posting. Commercial fields never reach this component. */
export interface PostingJob {
  postingId?: string;
  title: string;
  department?: string;
  location?: string;
  state?: string;
  type: string;
  workplace?: string;
  description?: string;
  requirements?: string | string[];
  responsibilities?: string | string[];
  submissionDueDate?: string;
  skills?: string[];
  salary?: Salary | null;
  /** Present on a record: pay shows only when true. Absent on a projection whose salary is already gated. */
  showPay?: boolean;
}

const prose =
  "max-w-measure [overflow-wrap:anywhere] [&_a]:text-ocean-700 [&_a]:underline [&_h2]:display [&_h2]:mt-8 [&_h2]:text-head-sm [&_h3]:mt-6 [&_h3]:font-semibold [&_li]:mt-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mt-4 [&_ul]:list-disc [&_ul]:pl-6 [&_li]:marker:text-ocean-600";

// The site's own body type, so the preview escapes .adm-scope's 14px console text.
const SITE_TYPE = {
  fontFamily: "var(--font-sans)",
  fontSize: "var(--text-body)",
  lineHeight: 1.5,
  letterSpacing: "normal",
  color: "var(--color-ink)",
} as CSSProperties;

// Phone ends of the site type scale, for a phone-width preview in a wide viewport.
const PHONE_TYPE = {
  ...SITE_TYPE,
  "--text-caption": "0.8125rem",
  "--text-small": "0.875rem",
  "--text-body": "1.0625rem",
  "--text-title": "1.1875rem",
  "--text-lead": "1.25rem",
  "--text-head-sm": "1.5rem",
  "--text-head-md": "1.75rem",
  "--text-head": "2.25rem",
  "--text-head-xl": "2.5rem",
} as CSSProperties;

const fmt = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

/** The salary a visitor sees: gated by `showPay` on a record, as-is on a projection. */
export function shownSalary(job: Pick<PostingJob, "salary" | "showPay">): Salary | undefined {
  if (!job.salary) return undefined;
  return "showPay" in job && job.showPay !== undefined ? (job.showPay ? job.salary : undefined) : job.salary;
}

/**
 * A job posting as the careers site prints it: title block, the three copy
 * sections and the facts aside. The public page passes its live controls in
 * slots; the portal editor renders it with `preview` (static controls,
 * empty-state prompts) inside a frame. `preview="phone"` also forces the phone
 * layout and type, for a frame narrower than the viewport.
 */
export default function JobPostingView({
  job,
  postedAt,
  back,
  applyHref,
  applyPanel,
  share,
  preview = false,
}: {
  job: PostingJob;
  /** ISO date it went live; the preview passes today */
  postedAt: string;
  back?: ReactNode;
  /** Target of the first apply button; omitted in the preview */
  applyHref?: string;
  /** The application form at the foot of the copy */
  applyPanel?: ReactNode;
  share?: ReactNode;
  preview?: boolean | "phone";
}) {
  const phone = preview === "phone";
  const wide = (cls: string) => (phone ? "" : cls);
  const pay = formatSalary(shownSalary(job));
  const skills = (job.skills ?? []).filter((s) => s.trim());
  const facts = [
    { k: "Job ID", v: job.postingId },
    { k: "Location", v: jobPlace(job) },
    { k: "Workplace", v: workMode(job) },
    { k: "Job type", v: job.type ? jobTypeLabel(job.type) : "" },
    { k: "Pay", v: pay },
    { k: "Practice", v: job.department },
    { k: "Posted", v: fmt(postedAt) },
    { k: "Applications close", v: job.submissionDueDate ? fmt(job.submissionDueDate) : null },
  ].filter((f): f is { k: string; v: string } => Boolean(f.v));

  const sections = [
    { title: "About the role", html: renderRichText(job.description) },
    { title: "What you will do", html: renderListField(job.responsibilities) },
    { title: "What you bring", html: renderListField(job.requirements) },
  ].filter((s) => s.html.__html);

  const applyCls = "mt-6 inline-flex min-h-12 items-center bg-ocean-600 px-7 font-medium text-white btn-fill btn-fill-ocean active:scale-[0.98]";
  const gutter = phone ? "px-4" : "gutter";

  const body = (
    <>
      <section id={preview ? undefined : "top"} className="bg-field-paper">
        <div className={`${gutter} pb-12 pt-10 ${wide("md:pt-14")}`}>
          {back}
          <div className={`${back ? "mt-10" : ""} grid gap-8 ${wide("lg:grid-cols-12")}`}>
            <h1 className={`${preview ? "" : "lines "}poster min-w-0 text-head-xl [overflow-wrap:anywhere] ${wide("lg:col-span-9")}`}>
              {preview ? (
                job.title.trim() || <span className="text-mist-550">Job title</span>
              ) : (
                <span className="line">
                  <span data-line style={{ "--i": 0 } as CSSProperties}>
                    {job.title}
                  </span>
                </span>
              )}
            </h1>
          </div>
          {job.postingId && (
            <p data-after-lines={preview ? undefined : true} className="mt-4 text-small font-medium tabular-nums text-mist-600">
              Job ID {job.postingId}
            </p>
          )}
          {applyHref ? (
            <a href={applyHref} data-after-lines className={applyCls}>
              Apply for this role
            </a>
          ) : (
            <span aria-hidden className={applyCls}>
              Apply for this role
            </span>
          )}
        </div>
      </section>

      <section className="bg-field-paper">
        <div className={`${gutter} grid gap-12 pb-24 ${wide("md:pb-32 lg:grid-cols-12")}`}>
          <div className={`grid min-w-0 content-start gap-12 ${wide("lg:col-span-7")}`}>
            {sections.map((s) => (
              <div key={s.title}>
                <h2 className="display text-head-md">{s.title}</h2>
                <div className={`mt-4 ${prose}`} dangerouslySetInnerHTML={s.html} />
              </div>
            ))}
            {preview && sections.length === 0 && (
              <div>
                <h2 className="display text-head-md">About the role</h2>
                <p className="mt-4 text-mist-550">Write About the role to see it here.</p>
              </div>
            )}
            {applyPanel}
          </div>

          <aside className={`content-start ${wide("lg:col-span-4 lg:col-start-9")}`}>
            <div className={`bg-mist-100 p-7 ${wide("lg:sticky lg:top-24")}`}>
              <dl className="grid gap-4">
                {facts.map((f) => (
                  <div key={f.k}>
                    <dt className="text-small text-mist-600">{f.k}</dt>
                    <dd className="font-medium">{f.v}</dd>
                  </div>
                ))}
                {skills.length > 0 && (
                  <div>
                    <dt className="text-small text-mist-600">Skills</dt>
                    <dd className="mt-2">
                      <ul className="flex flex-wrap gap-2" aria-label="Skills">
                        {skills.map((s) => (
                          <li key={s} className="bg-mist-0 px-2.5 py-1 text-small font-medium ring-1 ring-inset ring-mist-300">
                            {s}
                          </li>
                        ))}
                      </ul>
                    </dd>
                  </div>
                )}
              </dl>
              {share && <div className="mt-6 border-t border-mist-300 pt-6">{share}</div>}
            </div>
          </aside>
        </div>
      </section>
    </>
  );

  if (!preview) return body;
  return (
    <div style={phone ? PHONE_TYPE : SITE_TYPE} className="bg-field-paper text-left antialiased">
      {body}
    </div>
  );
}
