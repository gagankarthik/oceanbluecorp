import type { Metadata } from "next";
import BackLink from "@/components/site/BackLink";
import { notFound } from "next/navigation";
import { getJob, jobTypeLabel } from "@/lib/jobs";
import { jobPlace } from "@/lib/workplace";
import { richTextToPlain } from "@/lib/rich-text";
import { breadcrumbJsonLd, jsonLdString } from "@/lib/seo";
import { jobPostingJsonLd } from "@/lib/job-jsonld";
import JobPostingView from "@/components/site/JobPostingView";
import ApplyPanel from "./ApplyPanel";
import ShareJob from "./ShareJob";
import Link from "next/link";
import { company } from "@/lib/site-content";

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 60;

const SITE = "https://oceanbluecorp.com";

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

export default async function JobPage({ params }: Props) {
  const found = await getJob((await params).slug);
  if (!found) notFound();
  const { job, publishedAt } = found;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdString([
            jobPostingJsonLd(job, publishedAt),
            breadcrumbJsonLd([
              { name: "Find a job", path: "/jobs" },
              { name: job.title, path: `/jobs/${job.id}` },
            ]),
          ]),
        }}
      />
      <JobPostingView
        job={job}
        postedAt={publishedAt ?? job.createdAt}
        back={<BackLink href="/jobs" label="All openings" />}
        applyHref="#apply"
        applyPanel={<ApplyPanel jobId={job.id} title={job.title} />}
        share={<ShareJob url={`${SITE}/jobs/${job.id}`} title={job.title} />}
      />

      <section aria-labelledby="other-role-title" className="on-dark bg-navy-900 text-mist-50">
        <div className="gutter flex flex-wrap items-center justify-between gap-6 py-14 md:py-16">
          <div>
            <h2 id="other-role-title" className="display text-head-md">
              Not quite the right role?
            </h2>
            <p className="mt-2 max-w-measure text-tide-300">
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
