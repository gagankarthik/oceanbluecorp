import type { Metadata } from "next";
import BackLink from "@/components/site/BackLink";
import { notFound } from "next/navigation";
import { getJob, jobTypeLabel } from "@/lib/jobs";
import { workMode } from "@/lib/careers";
import { jobPlace } from "@/lib/workplace";
import { renderListField, renderRichText, richTextToPlain } from "@/lib/rich-text";
import { breadcrumbJsonLd, jsonLdString } from "@/lib/seo";
import type { CandidateJob } from "@/lib/aws/dynamodb";
import ApplyPanel from "./ApplyPanel";
import ShareJob from "./ShareJob";
import Link from "next/link";
import { company } from "@/lib/site-content";

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 60;

const SITE = "https://oceanbluecorp.com";

// Google's employmentType vocabulary, not ours.
const EMPLOYMENT_TYPE: Record<string, string> = {
  "full-time": "FULL_TIME",
  "part-time": "PART_TIME",
  contract: "CONTRACTOR",
  "contract-to-hire": "CONTRACTOR",
  "direct-hire": "FULL_TIME",
  "managed-teams": "CONTRACTOR",
  remote: "FULL_TIME",
};

/** JobPosting data; without it a role cannot appear in Google Jobs. No salary is ever published. */
function jobPostingLd(job: CandidateJob, publishedAt?: string) {
  const remote = workMode(job) === "Remote";
  const responsibilities = richTextToPlain(job.responsibilities);
  const qualifications = richTextToPlain(job.requirements);
  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: job.description,
    identifier: { "@type": "PropertyValue", name: "Oceanblue Solutions, Inc.", value: job.postingId || job.id },
    datePosted: publishedAt ?? job.createdAt,
    ...(job.submissionDueDate ? { validThrough: `${job.submissionDueDate.slice(0, 10)}T23:59:59` } : {}),
    employmentType: EMPLOYMENT_TYPE[job.type] ?? "OTHER",
    hiringOrganization: {
      "@type": "Organization",
      name: "Oceanblue Solutions, Inc.",
      sameAs: SITE,
      logo: `${SITE}/brand/oceanblue-mark-512.png`,
    },
    ...(job.department ? { industry: job.department } : {}),
    ...(remote
      ? { jobLocationType: "TELECOMMUTE", applicantLocationRequirements: { "@type": "Country", name: "US" } }
      : {
          jobLocation: {
            "@type": "Place",
            address: {
              "@type": "PostalAddress",
              ...(job.location ? { addressLocality: job.location.replace(/\([^)]*\)/g, "").trim() } : {}),
              ...(job.state ? { addressRegion: job.state } : {}),
              addressCountry: "US",
            },
          },
        }),
    ...(responsibilities ? { responsibilities } : {}),
    ...(qualifications ? { qualifications } : {}),
    directApply: true,
    url: `${SITE}/jobs/${job.id}`,
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const found = await getJob((await params).slug);
  if (!found) return {};
  const { job } = found;
  const where = jobPlace(job);
  const plain = richTextToPlain(job.description);
  const description = `${jobTypeLabel(job.type)}${where ? `, ${where}` : ""}. ${plain}`.slice(0, 157).trimEnd();
  return {
    title: where ? `${job.title}, ${where}` : job.title,
    description: description.length >= 157 ? `${description}…` : description,
    alternates: { canonical: `${SITE}/jobs/${job.id}` },
  };
}

const prose =
  "max-w-[64ch] [overflow-wrap:anywhere] [&_a]:text-ocean-700 [&_a]:underline [&_h2]:display [&_h2]:mt-8 [&_h2]:text-[1.5rem] [&_h3]:mt-6 [&_h3]:font-semibold [&_li]:mt-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mt-4 [&_ul]:list-disc [&_ul]:pl-6 [&_li]:marker:text-ocean-600";

export default async function JobPage({ params }: Props) {
  const found = await getJob((await params).slug);
  if (!found) notFound();
  const { job, publishedAt } = found;

  const posted = new Date(publishedAt ?? job.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const facts = [
    { k: "Job ID", v: job.postingId },
    { k: "Location", v: jobPlace(job) },
    { k: "Workplace", v: workMode(job) },
    { k: "Job type", v: jobTypeLabel(job.type) },
    { k: "Practice", v: job.department },
    { k: "Posted", v: posted },
    {
      k: "Applications close",
      v: job.submissionDueDate
        ? new Date(job.submissionDueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
        : null,
    },
  ].filter((f): f is { k: string; v: string } => Boolean(f.v));

  const sections = [
    { title: "About the role", html: renderRichText(job.description) },
    { title: "What you will do", html: renderListField(job.responsibilities) },
    { title: "What you bring", html: renderListField(job.requirements) },
  ].filter((s) => s.html.__html);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdString([
            jobPostingLd(job, publishedAt),
            breadcrumbJsonLd([
              { name: "Find a job", path: "/jobs" },
              { name: job.title, path: `/jobs/${job.id}` },
            ]),
          ]),
        }}
      />
      <section id="top" className="bg-field-paper">
        <div className="gutter pb-12 pt-10 md:pt-14">
          <BackLink href="/jobs" label="All openings" />
          <div className="mt-10 grid gap-8 lg:grid-cols-12">
            <h1 className="lines poster min-w-0 text-[clamp(2.25rem,4.5vw,4rem)] [overflow-wrap:anywhere] lg:col-span-9">
              <span className="line">
                <span data-line style={{ "--i": 0 } as React.CSSProperties}>
                  {job.title}
                </span>
              </span>
            </h1>
          </div>
          {job.postingId && (
            <p data-after-lines className="mt-4 text-[15px] font-medium tabular-nums text-mist-600">
              Job ID {job.postingId}
            </p>
          )}
          {/* The first way to apply; the form itself waits at the foot of the page */}
          <a
            href="#apply"
            data-after-lines
            className="mt-6 inline-flex min-h-12 items-center bg-ocean-600 px-7 font-medium text-white btn-fill btn-fill-ocean active:scale-[0.98]"
          >
            Apply for this role
          </a>
        </div>
      </section>

      <section className="bg-field-paper">
        <div className="gutter grid gap-12 pb-24 md:pb-32 lg:grid-cols-12">
          <div className="grid min-w-0 content-start gap-12 lg:col-span-7">
            {sections.map((s) => (
              <div key={s.title}>
                <h2 className="display text-[clamp(1.75rem,2.6vw,2.5rem)]">{s.title}</h2>
                <div className={`mt-4 ${prose}`} dangerouslySetInnerHTML={s.html} />
              </div>
            ))}
            <ApplyPanel jobId={job.id} title={job.title} />
          </div>

          <aside className="content-start lg:col-span-4 lg:col-start-9">
            <div className="bg-mist-100 p-7 lg:sticky lg:top-24">
              <dl className="grid gap-4">
                {facts.map((f) => (
                  <div key={f.k}>
                    <dt className="text-[14px] text-mist-600">{f.k}</dt>
                    <dd className="font-medium">{f.v}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-6 border-t border-mist-300 pt-6">
                <ShareJob url={`${SITE}/jobs/${job.id}`} title={job.title} />
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section aria-labelledby="other-role-title" className="bg-navy-900 text-mist-50">
        <div className="gutter flex flex-wrap items-center justify-between gap-6 py-14 md:py-16">
          <div>
            <h2 id="other-role-title" className="display text-[clamp(1.75rem,2.6vw,2.5rem)]">
              Not quite the right role?
            </h2>
            <p className="mt-2 max-w-[56ch] text-tide-300">
              Tell us the work you are looking for. A recruiter will keep your details and contact you when something fits.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/contact?for=work"
              className="inline-flex min-h-12 items-center justify-center whitespace-nowrap bg-cyan-500 px-6 font-medium text-navy-950 btn-fill btn-fill-cyan"
            >
              Tell us what you are looking for
            </Link>
            <a
              href={`mailto:${company.email}?subject=${encodeURIComponent("Resume")}`}
              className="inline-flex min-h-12 items-center justify-center whitespace-nowrap px-6 font-medium text-white ring-2 ring-inset ring-white/70 btn-fill btn-fill-outline-light"
            >
              Email your resume
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
