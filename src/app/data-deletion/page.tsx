import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { CONTAINER, OPENER_Y, SECTION_Y } from "@/components/site/sections";
import { buttonClass } from "@/components/site/button";
import { IconMail, IconClock, IconShieldLock } from "@/components/site/icons";
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

export default function DataDeletionPage() {
  return (
    <>
      <header data-opener className="border-b border-line bg-paper">
        <div className={`${CONTAINER} ${OPENER_Y}`}>
          <p className="rise type-label font-semibold text-cobalt">Legal and privacy</p>
          <h1 className="rise mt-3 max-w-[18ch] type-headline-lg font-semibold text-ink" style={{ animationDelay: "80ms" }}>
            Data deletion request
          </h1>
          <p className="rise mt-5 max-w-[60ch] type-body-lg text-ink-muted" style={{ animationDelay: "180ms" }}>
            You can ask us to delete the personal data we hold about you, such as your contact form
            submissions, job application, resume, and account details, at any time.
          </p>
        </div>
      </header>

      <section data-tone="white" className={`bg-white ${SECTION_Y}`}>
        {/* The ask on the left, what happens after on the right: one action, then the facts that answer "and then what?". */}
        <div className={`${CONTAINER} grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-12`}>
          <div className="reveal rounded-2xl border border-line bg-white p-7 sm:p-10">
            <span className="flex size-12 items-center justify-center rounded-xl bg-cobalt text-white">
              <IconMail size={22} />
            </span>
            <h2 className="mt-6 type-headline-sm font-semibold text-ink">
              Email us to delete your data
            </h2>
            <p className="mt-3 max-w-[56ch] type-body text-ink-muted">
              Send a request to{" "}
              <a href={`mailto:${DELETE_EMAIL}`} className="font-semibold text-cobalt underline underline-offset-4">
                {DELETE_EMAIL}
              </a>{" "}
              from the email address associated with your data. Include your full name and the email
              (and phone, if any) you used, so we can locate and verify your records.
            </p>
            <a href={`mailto:${DELETE_EMAIL}?subject=${SUBJECT}&body=${BODY}`} className={buttonClass("accent", "lg", "mt-8 max-w-full whitespace-normal")}>
              <IconMail size={16} /> Email {DELETE_EMAIL}
            </a>
          </div>

          <ul className="reveal grid content-start gap-px overflow-hidden rounded-2xl border border-line bg-line">
            <li className="bg-paper p-7">
              <span className="flex size-10 items-center justify-center rounded-lg border border-line bg-white text-cobalt">
                <IconShieldLock size={18} />
              </span>
              <h3 className="mt-4 type-title font-semibold text-ink">What we delete</h3>
              <p className="mt-1.5 type-body text-ink-muted">
                Your contact submissions, job applications, uploaded resumes, candidate profile, and any
                account credentials, across our database and file storage.
              </p>
            </li>
            <li className="bg-paper p-7">
              <span className="flex size-10 items-center justify-center rounded-lg border border-line bg-white text-cobalt">
                <IconClock size={18} />
              </span>
              <h3 className="mt-4 type-title font-semibold text-ink">How long it takes</h3>
              <p className="mt-1.5 type-body text-ink-muted">
                We confirm receipt within 3-5 business days and complete deletion within 30 days. Some
                records may be retained where required by law (e.g. tax or contractual obligations).
              </p>
            </li>
          </ul>
        </div>
        <div className={`${CONTAINER} mt-10 sm:mt-12`}>
          <div className="max-w-[760px]">
            <RelatedLinks links={[{ href: "/privacy", label: "Privacy Policy" }, { href: "/contact", label: "Contact Us" }]} />
          </div>
        </div>
      </section>
    </>
  );
}
