"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { normalizeWebsite, website } from "@/lib/form-validation";

const RESUME_EXT = /\.(pdf|docx?)$/i;
const RESUME_MAX_BYTES = 5 * 1024 * 1024;
const linkedinRule = website("Enter your LinkedIn profile address, like linkedin.com/in/your-name.");

const field =
  "mt-2 block min-h-12 w-full bg-mist-0 px-4 text-[17px] text-navy-900 ring-1 ring-inset ring-mist-300 placeholder:text-mist-400 focus:outline-none focus:ring-2 focus:ring-ocean-600";

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
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  function pick(file: File | undefined) {
    if (!file) return;
    const problem = resumeProblem(file);
    setError(problem);
    setResume(problem ? null : file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const linkedin = form.linkedinUrl.trim();
    const liError = linkedin ? linkedinRule(linkedin) : undefined;
    if (liError) return setError(liError);
    if (!resume && !linkedin) return setError("Add your resume or your LinkedIn profile so we can review your experience.");
    setError(null);
    setBusy(true);
    try {
      let resumeId: string | null = null;
      if (resume && uploaded.current?.file === resume) {
        resumeId = uploaded.current.resumeId;
      } else if (resume) {
        const fd = new FormData();
        fd.append("file", resume);
        fd.append("userId", form.email);
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
          userId: form.email,
          name: `${form.firstName.trim()} ${form.lastName.trim()}`,
          email: form.email.trim(),
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

  if (done) {
    return (
      <div role="status" className="mt-6 bg-tide-100 p-7">
        <p className="display text-[1.75rem]">Application received</p>
        <p className="mt-2 max-w-[52ch]">
          Thank you for applying for {title}. A recruiter will review it and contact you if your experience fits. A confirmation is on
          its way to {form.email}.
        </p>
        <Link href="/jobs" className="mt-5 inline-block font-medium text-ocean-700 underline underline-offset-4">
          See other openings
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="mt-6 grid gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="font-medium">
          First name
          <input required autoComplete="given-name" value={form.firstName} onChange={set("firstName")} className={field} />
        </label>
        <label className="font-medium">
          Last name
          <input required autoComplete="family-name" value={form.lastName} onChange={set("lastName")} className={field} />
        </label>
        <label className="font-medium">
          Email
          <input required type="email" autoComplete="email" value={form.email} onChange={set("email")} className={field} />
        </label>
        <label className="font-medium">
          Phone
          <input required type="tel" autoComplete="tel" value={form.phone} onChange={set("phone")} className={field} />
        </label>
      </div>

      <div>
        <span className="font-medium">Resume</span>
        <label className="mt-2 flex min-h-24 cursor-pointer flex-col items-center justify-center gap-1 bg-mist-0 px-4 py-5 text-center ring-1 ring-inset ring-mist-300 transition-colors hover:bg-tide-100 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ocean-600">
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            className="sr-only"
            onChange={(e) => pick(e.target.files?.[0])}
          />
          <span className="font-medium text-ocean-700">{resume ? resume.name : "Choose a file"}</span>
          <span className="text-[14px] text-mist-600">PDF, DOC or DOCX, up to 5 MB</span>
        </label>
      </div>

      <label className="font-medium">
        LinkedIn profile <span className="font-normal text-mist-600">(optional with a resume)</span>
        <input
          type="url"
          inputMode="url"
          placeholder="linkedin.com/in/your-name"
          value={form.linkedinUrl}
          onChange={set("linkedinUrl")}
          className={field}
        />
      </label>

      <label className="font-medium">
        Anything you want us to know <span className="font-normal text-mist-600">(optional)</span>
        <textarea rows={4} value={form.coverLetter} onChange={set("coverLetter")} className={`${field} resize-y py-3`} />
      </label>

      {error && (
        <p role="alert" className="bg-buoy-300/30 px-4 py-3 text-[15px] text-navy-900">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-5">
        <button
          type="submit"
          disabled={busy}
          className="inline-flex min-h-12 items-center bg-ocean-600 px-7 font-medium text-white btn-fill btn-fill-ocean active:translate-y-px disabled:opacity-60"
        >
          {busy ? "Sending…" : "Submit application"}
        </button>
        <p className="max-w-[44ch] text-[14px] text-mist-600">
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
