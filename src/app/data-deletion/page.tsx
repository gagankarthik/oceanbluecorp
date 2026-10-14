import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { LegalNav } from "@/components/site/LegalPage";
import { RelatedLinks } from "@/components/site/legal/doc";

export const metadata: Metadata = pageMetadata({
  path: "/data-deletion",
  title: "Data Deletion Request",
  description: "Ask Oceanblue Solutions, Inc. to delete the personal data we hold about you, such as a job application or resume. Email hr@oceanbluecorp.com to make a request.",
});

const DELETE_EMAIL = "hr@oceanbluecorp.com";
const SUBJECT = encodeURIComponent("Data deletion request");
const BODY = encodeURIComponent(
  "Hello Oceanblue team,\n\nI would like to request deletion of my personal data.\n\nFull name:\nEmail used:\nPhone (optional):\n\nThank you.",
);

const facts = [
  {
    title: "What we delete",
    body: "Your contact submissions, job applications, uploaded resumes, candidate profile, and any account credentials, across our database and file storage.",
  },
  {
    title: "How long it takes",
    body: "We confirm receipt within 3-5 business days and complete deletion within 30 days. Some records may be retained where required by law (e.g. tax or contractual obligations).",
  },
];

export default function DataDeletionPage() {
  return (
    <article className="bg-field-paper">
      <header id="top" className="gutter pb-12 pt-14 md:pb-16 md:pt-20">
        <LegalNav current="/data-deletion" />
        <h1 className="display mt-10 text-[clamp(2.5rem,5vw,4.5rem)]">Data deletion request</h1>
        <p className="mt-8 max-w-[60ch] text-[clamp(1.0625rem,1.2vw,1.1875rem)] leading-relaxed">
          You can ask us to delete the personal data we hold about you, such as your contact form submissions, job application, resume, and
          account details, at any time.
        </p>
      </header>

      <div className="gutter grid gap-12 pb-24 md:pb-32 lg:grid-cols-12">
        {/* The ask first, then what happens after */}
        <section aria-labelledby="ask-title" className="bg-navy-900 p-7 text-mist-50 sm:p-10 lg:col-span-7" data-reveal>
          <h2 id="ask-title" className="display text-[clamp(1.75rem,2.6vw,2.5rem)]">
            Email us to delete your data
          </h2>
          <p className="mt-4 max-w-[56ch] text-tide-300">
            Send a request to{" "}
            <a href={`mailto:${DELETE_EMAIL}`} className="font-medium text-white underline underline-offset-4">
              {DELETE_EMAIL}
            </a>{" "}
            from the email address associated with your data. Include your full name and the email (and phone, if any) you used, so we can locate
            and verify your records.
          </p>
          <a
            href={`mailto:${DELETE_EMAIL}?subject=${SUBJECT}&body=${BODY}`}
            className="mt-8 inline-flex min-h-12 max-w-full items-center bg-cyan-500 px-6 font-medium text-navy-950 btn-fill btn-fill-cyan active:scale-[0.98]"
          >
            Email {DELETE_EMAIL}
          </a>
        </section>

        <ul className="grid content-start gap-2 lg:col-span-5">
          {facts.map((f, i) => (
            <li key={f.title} className="bg-mist-0 p-7" data-reveal style={{ "--d": i + 1 } as React.CSSProperties}>
              <h2 className="text-[20px] font-semibold">{f.title}</h2>
              <p className="mt-2 leading-relaxed text-mist-600">{f.body}</p>
            </li>
          ))}
        </ul>

        <div className="max-w-[68ch] lg:col-span-7">
          <RelatedLinks
            links={[
              { href: "/privacy", label: "Privacy Policy" },
              { href: "/contact", label: "Contact us" },
            ]}
          />
        </div>
      </div>
    </article>
  );
}
