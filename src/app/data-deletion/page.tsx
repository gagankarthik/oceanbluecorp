import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Mail, Trash2, ShieldCheck, Clock, ExternalLink } from "lucide-react";

export const metadata: Metadata = {
  title: "Data Deletion Request | Ocean Blue Corporation",
  description: "Request deletion of your personal data held by Ocean Blue Corporation by emailing hr@oceanbluecorp.com.",
};

const DELETE_EMAIL = "hr@oceanbluecorp.com";
const SUBJECT = encodeURIComponent("Data deletion request");
const BODY = encodeURIComponent(
  "Hello Ocean Blue team,\n\nI would like to request deletion of my personal data.\n\nFull name:\nEmail used:\nPhone (optional):\n\nThank you.",
);

export default function DataDeletionPage() {
  return (
    <div className="horizon min-h-screen bg-white">
      {/* Hero */}
      <div
        className="border-b border-gray-100"
        style={{
          background: [
            "radial-gradient(ellipse 70% 55% at 10% 20%, rgba(29,78,216,0.07) 0%, transparent 60%)",
            "radial-gradient(ellipse 55% 45% at 90% 80%, rgba(6,182,212,0.05) 0%, transparent 60%)",
            "#FAFBFF",
          ].join(", "),
        }}
      >
        <div className="mx-auto max-w-3xl px-6 pt-24 pb-12 md:pt-28 lg:px-8">
          <Link
            href="/"
            className="group mb-8 inline-flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-gray-800"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            Back to Home
          </Link>

          <h1
            className="mt-5 text-[1.9rem] font-extrabold leading-[1.06] tracking-tight text-gray-900 sm:text-[2.6rem] md:text-5xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Data deletion request
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-gray-500">
            You can ask us to delete the personal data we hold about you — such as your contact form
            submissions, job application, resume, and account details — at any time.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-3xl px-6 py-12 lg:px-8">
        {/* Primary action */}
        <div className="rounded-2xl border border-[var(--hz-cobalt-100)] bg-[var(--hz-cobalt-100)]/40 p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <span className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-xl bg-[var(--hz-cobalt)] text-white">
              <Mail className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-gray-900" style={{ fontFamily: "var(--font-display)" }}>
                Email us to delete your data
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-gray-600">
                Send a request to{" "}
                <a href={`mailto:${DELETE_EMAIL}`} className="font-semibold text-[var(--hz-cobalt)] hover:underline">
                  {DELETE_EMAIL}
                </a>{" "}
                from the email address associated with your data. Include your full name and the email
                (and phone, if any) you used, so we can locate and verify your records.
              </p>
              <a
                href={`mailto:${DELETE_EMAIL}?subject=${SUBJECT}&body=${BODY}`}
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[var(--hz-cobalt)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--hz-cobalt-600)]"
              >
                <Mail className="h-4 w-4" /> Email {DELETE_EMAIL}
              </a>
            </div>
          </div>
        </div>

        {/* What happens */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-5">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-white text-[var(--hz-cobalt)] ring-1 ring-gray-100">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <h3 className="mt-3 text-sm font-bold text-gray-900">What we delete</h3>
            <p className="mt-1 text-sm leading-relaxed text-gray-600">
              Your contact submissions, job applications, uploaded resumes, candidate profile, and any
              account credentials — across our database and file storage.
            </p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-5">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-white text-[var(--hz-cobalt)] ring-1 ring-gray-100">
              <Clock className="h-4 w-4" />
            </span>
            <h3 className="mt-3 text-sm font-bold text-gray-900">How long it takes</h3>
            <p className="mt-1 text-sm leading-relaxed text-gray-600">
              We confirm receipt within 3-5 business days and complete deletion within 30 days. Some
              records may be retained where required by law (e.g. tax or contractual obligations).
            </p>
          </div>
        </div>

        {/* Related */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/privacy"
            className="flex flex-1 items-center justify-between rounded-xl border border-gray-200 bg-gray-50/60 px-5 py-4 text-sm font-semibold text-gray-700 transition-all hover:border-[var(--hz-cobalt-100)] hover:bg-[var(--hz-cobalt-100)] hover:text-[var(--hz-cobalt)]"
          >
            <span>Privacy Policy</span>
            <ExternalLink className="h-4 w-4" />
          </Link>
          <Link
            href="/contact"
            className="flex flex-1 items-center justify-between rounded-xl border border-gray-200 bg-gray-50/60 px-5 py-4 text-sm font-semibold text-gray-700 transition-all hover:border-[var(--hz-cobalt-100)] hover:bg-[var(--hz-cobalt-100)] hover:text-[var(--hz-cobalt)]"
          >
            <span>Contact Us</span>
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
