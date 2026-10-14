import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import Link from "next/link";
import JobBoard from "./JobBoard";
import { company } from "@/lib/site-content";
import { getOpenJobs } from "@/lib/jobs";

export const metadata: Metadata = pageMetadata({
  path: "/jobs",
  title: "Find a Job",
  description:
    "Search open IT and engineering jobs with Oceanblue Solutions, Inc.: contract, contract-to-hire and direct-hire roles in Ohio and remote across the US.",
});

// Postings re-read at most once a minute.
export const revalidate = 60;

export default async function JobsPage() {
  const jobs = await getOpenJobs();
  return (
    <>
      <section id="top" className="bg-field-paper">
        <div className="gutter grid gap-8 pb-12 pt-16 md:pt-24 lg:grid-cols-12">
          <h1 className="lines poster text-poster lg:col-span-7">
            <span className="line">
              <span data-line style={{ "--i": 0 } as React.CSSProperties}>
                Find a job
              </span>
            </span>
          </h1>
          <div data-after-lines className="lg:col-span-4 lg:col-start-9 lg:self-end">
            <p className="text-title leading-snug">
              Open roles with our clients in IT and engineering. Search, filter and apply in a few minutes.
            </p>
            <p className="mt-3 text-small text-mist-600">
              Want to work at Oceanblue?{" "}
              <Link href="/careers" className="text-ocean-700 underline underline-offset-4">
                Careers at Oceanblue
              </Link>
            </p>
          </div>
        </div>
      </section>

      <section className="bg-field-paper">
        <div className="gutter pb-24 md:pb-32">
          <JobBoard jobs={jobs} />
          <p className="mt-6 text-small text-mist-600">
            Oceanblue is an equal opportunity employer.{" "}
            <Link href="/equal-opportunity" className="text-ocean-700 underline underline-offset-4">
              Read our statement
            </Link>
          </p>

          <div className="on-dark mt-16 grid gap-6 bg-navy-900 p-8 text-mist-50 md:grid-cols-[1fr_auto] md:items-center md:p-10">
            <div>
              <p className="display text-head-md">Don&apos;t see the right role?</p>
              <p className="mt-2 max-w-measure-narrow text-tide-300">Send your resume and tell us the work you want. We will contact you when a role fits.</p>
            </div>
            <a
              href={`mailto:${company.email}?subject=Resume`}
              className="inline-flex min-h-12 items-center justify-center bg-cyan-500 px-6 font-medium text-navy-950 btn-fill btn-fill-cyan active:scale-[0.98]"
            >
              Send your resume
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
