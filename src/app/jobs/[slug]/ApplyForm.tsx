"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useFormErrors } from "@/hooks/use-form-errors";
import { check, collectErrors, email, maxLen, normalizeWebsite, phone, required, website } from "@/lib/form-validation";
import FieldError from "@/components/site/FieldError";
import SubmitButton from "@/components/site/SubmitButton";

const RESUME_EXT = /\.(pdf|docx?)$/i;
const RESUME_MAX_BYTES = 5 * 1024 * 1024;
const linkedinRule = website("Enter your LinkedIn profile address, like linkedin.com/in/your-name.");

const field =
  "mt-2 block min-h-12 w-full bg-mist-0 px-4 text-body text-navy-900 ring-1 ring-inset ring-[var(--color-border-control)] placeholder:text-placeholder focus:outline-none focus:ring-2 focus:ring-ocean-600 aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-coral-700";

type Field = "firstName" | "lastName" | "email" | "phone" | "resume" | "linkedinUrl";

/** Mirrors /api/resume/upload. */
function resumeProblem(file: File): string | null {
  if (!RESUME_EXT.test(file.name)) return "Choose a PDF, DOC or DOCX file.";
  if (file.size > RESUME_MAX_BYTES) return `That file is ${(file.size / 1048576).toFixed(1)} MB. The limit is 5 MB.`;
  return null;
}

export default function ApplyForm({ jobId, title }: { jobId: string; title: string }) {
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", linkedinUrl: "", coverLetter: "" });
  const [resume, setResume] = useState<File | null>(null);
  // A retry after a failed submit reuses the upload that already went through.
  const uploaded = useRef<{ file: File; resumeId: string } | null>(null);
  // A refused file, named at the picker before any submit.
  const [resumeIssue, setResumeIssue] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const doneRef = useRef<HTMLParagraphElement>(null);

  const { errors, validateAll, revalidate, invalidProps } = useFormErrors<Field>(() =>
    collectErrors<Field>({
      firstName: check(form.firstName, required("Enter your first name."), maxLen(100)),
      lastName: check(form.lastName, required("Enter your last name."), maxLen(100)),
      email: check(form.email, required("Enter your email address."), email()),
      phone: check(form.phone, required("Enter a phone number so a recruiter can reach you."), phone()),
      linkedinUrl: check(form.linkedinUrl, linkedinRule),
      resume:
        resumeIssue ??
        (!resume && !form.linkedinUrl.trim() ? "Add your resume or your LinkedIn profile so we can review your experience." : undefined),
    }),
  );

  useEffect(() => {
    if (done) doneRef.current?.focus();
  }, [done]);

  // A new pick settles the resume error without waiting for a blur.
  useEffect(revalidate, [resume, resumeIssue, revalidate]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  function pick(file: File | undefined) {
    if (!file) return;
    const problem = resumeProblem(file);
    setResumeIssue(problem);
    setResume(problem ? null : file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateAll()) return;
    const linkedin = form.linkedinUrl.trim();
    const applicant = form.email.trim();
    setError(null);
    setBusy(true);
    try {
      let resumeId: string | null = null;
      if (resume && uploaded.current?.file === resume) {
        resumeId = uploaded.current.resumeId;
      } else if (resume) {
        const fd = new FormData();
        fd.append("file", resume);
        fd.append("userId", applicant);
        const up = await fetch("/api/resume/upload", { method: "POST", body: fd });
        const data = await up.json().catch(() => ({}));
        if (!up.ok) throw new Error(data.error || "Your resume could not be uploaded. Try again.");
        resumeId = data.resumeId ?? null;
        if (resumeId) uploaded.current = { file: resume, resumeId };
      }

      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId,
          userId: applicant,
          name: `${form.firstName.trim()} ${form.lastName.trim()}`,
          email: applicant,
          phone: form.phone.trim(),
          coverLetter: form.coverLetter,
          resumeId,
          resumeFileName: resume?.name,
          ...(linkedin ? { linkedinUrl: normalizeWebsite(linkedin) } : {}),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Your application could not be submitted. Try again.");
      }
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Your application could not be submitted. Try again.");
    } finally {
      setBusy(false);
    }
  }

  const resumeError = errors.resume ?? resumeIssue ?? undefined;

  const input = (k: Exclude<Field, "resume">, text: string, props: React.InputHTMLAttributes<HTMLInputElement>, hint?: string) => (
    <div>
      <label htmlFor={k} className="font-medium">
        {text}
        {hint && <span className="font-normal text-mist-600"> {hint}</span>}
      </label>
      <input id={k} name={k} value={form[k]} onChange={set(k)} className={field} {...props} {...invalidProps(k)} />
      <FieldError id={k} message={errors[k]} />
    </div>
  );

  if (done) {
    return (
      <div role="status" className="mt-6 bg-tide-100 p-7">
        <p ref={doneRef} tabIndex={-1} className="display text-head-sm outline-none">
          Application received
        </p>
        <p className="mt-2 max-w-measure-narrow">
          Thank you for applying for {title}. A recruiter will review it and contact you if your experience fits. A confirmation is on
          its way to {form.email.trim()}.
        </p>
        <Link href="/jobs" className="mt-5 inline-block font-medium text-ocean-700 underline underline-offset-4">
          See other openings
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} onBlur={revalidate} noValidate className="mt-6 grid gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        {input("firstName", "First name", { autoComplete: "given-name", maxLength: 100 })}
        {input("lastName", "Last name", { autoComplete: "family-name", maxLength: 100 })}
        {input("email", "Email", { type: "email", autoComplete: "email", inputMode: "email", maxLength: 254 })}
        {input("phone", "Phone", { type: "tel", autoComplete: "tel", inputMode: "tel", maxLength: 40 })}
      </div>

      <div>
        <span className="font-medium">Resume</span>
        <label
          className={`mt-2 flex min-h-24 cursor-pointer flex-col items-center justify-center gap-1 bg-mist-0 px-4 py-5 text-center ring-inset transition-colors hover:bg-tide-100 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ocean-600 ${
            resumeError ? "ring-2 ring-coral-700" : "ring-1 ring-[var(--color-border-control)]"
          }`}
        >
          <input
            id="resume"
            type="file"
            accept=".pdf,.doc,.docx"
            className="sr-only"
            onChange={(e) => pick(e.target.files?.[0])}
            {...(resumeError ? { "aria-invalid": true, "aria-describedby": "resume-error" } : {})}
          />
          <span className="font-medium text-ocean-700">{resume ? resume.name : "Choose a file"}</span>
          <span className="text-small text-mist-600">PDF, DOC or DOCX, up to 5 MB</span>
        </label>
        <FieldError id="resume" message={resumeError} />
      </div>

      {input("linkedinUrl", "LinkedIn profile", { type: "url", inputMode: "url", maxLength: 2048, placeholder: "linkedin.com/in/your-name" }, "(optional with a resume)")}

      <label className="font-medium">
        Anything you want us to know <span className="font-normal text-mist-600">(optional)</span>
        <textarea rows={4} value={form.coverLetter} onChange={set("coverLetter")} className={`${field} resize-y py-3`} />
      </label>

      {error && (
        <p role="alert" className="bg-buoy-300/30 px-4 py-3 text-small text-navy-900">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-5">
        <SubmitButton busy={busy} busyLabel="Sending…">
          Submit application
        </SubmitButton>
        <p className="max-w-measure-narrow text-small text-mist-600">
          By applying you agree to our{" "}
          <Link href="/privacy" className="underline underline-offset-4">
            privacy policy
          </Link>
          . Oceanblue is an equal opportunity employer.
        </p>
      </div>
    </form>
  );
}
