"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { CONTAINER } from "@/components/site/sections";
import { IconArrowRight, IconChevronRight, IconX } from "@/components/site/icons";
import { IconBookmark, IconCheckCircle, IconFile, IconShare, IconSpinner, IconUpload } from "@/components/site/careers/careers-icons";
import type { PublicJob } from "@/lib/aws/dynamodb";
import { useAuth } from "@/lib/auth";
import { renderRichText } from "@/lib/rich-text";
import { SideSheet } from "@/components/site/side-sheet";
import { CAREER_BENEFITS, EEO_STATEMENT, HR_EMAIL, workMode } from "@/lib/careers";

const TYPE_LABEL: Record<string, string> = {
  "full-time": "Full-time",
  "part-time": "Part-time",
  contract: "Contract",
  "contract-to-hire": "Contract-to-hire",
  "direct-hire": "Direct hire",
  "managed-teams": "Managed teams",
  remote: "Remote",
};
const formatJobType = (type: string) => TYPE_LABEL[type] || type;

const dueLabel = (dueDate?: string): { text: string; urgent: boolean } | null => {
  if (!dueDate) return null;
  const due = new Date(dueDate);
  const days = Math.ceil((due.getTime() - Date.now()) / 86_400_000);
  if (days < 0) return { text: "Closed", urgent: true };
  if (days === 0) return { text: "Closes today", urgent: true };
  if (days === 1) return { text: "Closes tomorrow", urgent: true };
  if (days <= 7) return { text: `${days} days left`, urgent: true };
  return { text: due.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }), urgent: false };
};

const timeAgo = (date: Date): string => {
  const days = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
};

interface JobDetailsClientProps {
  job: PublicJob;
  jobId: string;
}

export default function JobDetailsClient({ job, jobId }: JobDetailsClientProps) {
  const { user, isAuthenticated } = useAuth();

  const [showApply, setShowApply] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [applicationSubmitted, setApplicationSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState<string | null>(null);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [formData, setFormData] = useState({ firstName: "", lastName: "", email: "", phone: "", coverLetter: "" });

  // Has the signed-in visitor already applied? Checked by id and by email, to
  // catch applications submitted before they signed in.
  useEffect(() => {
    if (!isAuthenticated || (!user?.id && !user?.email) || !jobId) return;
    (async () => {
      try {
        const urls: string[] = [];
        if (user?.id) urls.push(`/api/applications?userId=${user.id}`);
        if (user?.email) {
          urls.push(`/api/applications?userId=${encodeURIComponent(user.email)}`);
          urls.push(`/api/applications?email=${encodeURIComponent(user.email)}`);
        }
        for (const res of await Promise.all(urls.map((u) => fetch(u)))) {
          if (!res.ok) continue;
          const data = await res.json();
          const app = (data.applications || []).find((a: { jobId: string; status: string }) => a.jobId === jobId);
          if (app) {
            setHasApplied(true);
            setApplicationStatus(app.status);
            return;
          }
        }
      } catch (err) {
        console.error("Failed to check application status:", err);
      }
    })();
  }, [isAuthenticated, user?.id, user?.email, jobId]);

  // Prefill from the signed-in profile.
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    const parts = user.name?.split(" ") || [];
    setFormData((prev) => ({
      ...prev,
      firstName: parts[0] || prev.firstName,
      lastName: parts.slice(1).join(" ") || prev.lastName,
      email: user.email || prev.email,
    }));
  }, [isAuthenticated, user]);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setApplyError(null);
    try {
      let resumeId = null;
      if (resumeFile) {
        const fd = new FormData();
        fd.append("file", resumeFile);
        fd.append("userId", formData.email);
        const up = await fetch("/api/resume/upload", { method: "POST", body: fd });
        if (!up.ok) {
          const data = await up.json();
          throw new Error(data.error || "Failed to upload resume");
        }
        resumeId = (await up.json()).resumeId;
      }

      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: job.id,
          userId: isAuthenticated && user?.id ? user.id : formData.email,
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          phone: formData.phone,
          coverLetter: formData.coverLetter,
          resumeId,
          resumeFileName: resumeFile?.name,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit application");
      }
      setApplicationSubmitted(true);
      setHasApplied(true);
      setApplicationStatus("pending");
      toast.success("Application submitted! Check your email for confirmation.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to submit application. Please try again.";
      setApplyError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: job.title,
          text: `Check out this job opening: ${job.title} at Ocean Blue Corporation`,
          url: window.location.href,
        });
      } catch (err) {
        // The visitor dismissed the native share sheet.
        console.error("Failed to share job link:", err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  const due = dueLabel(job.submissionDueDate);
  const postedDate = new Date(job.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const statusLabel = applicationStatus ? applicationStatus.replace("-", " ") : null;
  const salary = job.salary
    ? `${job.salary.currency}${job.salary.min.toLocaleString()} – ${job.salary.currency}${job.salary.max.toLocaleString()}`
    : null;

  const mode = workMode(job);
  const facts = [
    { k: "Employment type", v: formatJobType(job.type) },
    { k: "Location", v: job.location },
    mode ? { k: "Work arrangement", v: mode } : null,
    salary ? { k: "Compensation", v: salary } : null,
    { k: "Posted", v: postedDate },
    due ? { k: "Applications close", v: due.text, urgent: due.urgent } : null,
  ].filter(Boolean) as { k: string; v: string; urgent?: boolean }[];

  const hasContent = (v: string | string[] | undefined): v is string | string[] => Boolean(v && (typeof v === "string" ? v : v.length > 0));

  const proseCls =
    "type-body-lg break-words text-ink-muted [&_a]:font-medium [&_a]:text-cobalt [&_a]:underline [&_h2]:mt-8 [&_h2]:type-title-lg [&_h2]:text-ink [&_h3]:mt-6 [&_h3]:font-semibold [&_h3]:text-ink [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-6 [&_p]:mb-4 [&_strong]:text-ink [&_ul]:my-3 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6 [&_li]:marker:text-cobalt";

  const saveBtn = (
    <button
      type="button"
      onClick={() => setSaved(!saved)}
      aria-pressed={saved}
      className={cn(
        "inline-flex h-12 items-center justify-center gap-2 rounded-full border px-5 text-[15px] font-semibold transition-colors",
        saved ? "border-cobalt bg-cobalt text-white" : "border-line-strong bg-white text-ink hover:border-ink",
      )}
    >
      <IconBookmark size={16} />
      {saved ? "Saved" : "Save"}
    </button>
  );
  const shareBtn = (
    <button
      type="button"
      onClick={handleShare}
      className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-line-strong bg-white px-5 text-[15px] font-semibold text-ink hover:border-cobalt"
    >
      <IconShare size={16} />
      Share
    </button>
  );
  const applyBtn = (cls?: string) => (
    <button
      type="button"
      onClick={() => setShowApply(true)}
      className={cn(
        "group inline-flex h-12 items-center justify-center gap-2 rounded-full bg-cobalt px-6 text-[15.5px] font-semibold text-white transition-colors hover:bg-cobalt-deep",
        cls,
      )}
    >
      Apply now
      <IconArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
    </button>
  );
  const appliedBadge = (cls?: string) => (
    <div className={cn("inline-flex h-12 items-center justify-center gap-2 rounded-full bg-success-container px-5 text-[15px] font-semibold text-success", cls)}>
      <IconCheckCircle size={18} />
      Applied{statusLabel ? <span className="font-normal capitalize">· {statusLabel}</span> : null}
    </div>
  );

  const section = (title: string, value: string | string[]) => (
    <section className="border-t border-line pt-10">
      <h2 className="type-title-lg font-semibold text-ink">{title}</h2>
      <div className="mt-5">
        {typeof value === "string" ? (
          <div className={proseCls} dangerouslySetInnerHTML={renderRichText(value)} />
        ) : (
          <ul className="space-y-3">
            {value.map((item, i) => (
              <li key={i} className="flex gap-4 type-body-lg break-words text-ink-muted">
                <span aria-hidden className="mt-[11px] size-1.5 shrink-0 rounded-full bg-cobalt" />
                <span className="min-w-0">{item}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );

  const inputCls =
    "h-12 w-full rounded-xl border border-line-strong bg-white px-4 type-body text-ink placeholder:text-ink-subtle focus:border-cobalt focus:ring-4 focus:ring-cobalt/15 focus:outline-none";
  const labelCls = "mb-1.5 block type-body-sm font-medium text-ink";

  return (
    <>
      {/* Header */}
      <section className="border-b border-line bg-paper">
        <div className={cn(CONTAINER, "pt-28 pb-10 sm:pt-32 sm:pb-12 lg:pt-36")}>
          <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-1.5 type-body-sm text-ink-subtle">
              <li>
                <Link href="/careers" className="hover:text-ink">
                  Careers
                </Link>
              </li>
              <IconChevronRight size={14} aria-hidden />
              <li>
                <Link href="/careers/search" className="hover:text-ink">
                  Open positions
                </Link>
              </li>
              <IconChevronRight size={14} aria-hidden />
              <li>
                <Link href={`/careers/search?department=${encodeURIComponent(job.department)}`} className="hover:text-ink">
                  {job.department}
                </Link>
              </li>
            </ol>
          </nav>

          <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <h1 className="rise max-w-[26ch] type-headline font-semibold break-words text-ink">{job.title}</h1>
              {job.postingId && (
                <p className="rise mt-4 type-body-sm text-ink-subtle" style={{ animationDelay: "80ms" }}>
                  Job ID {job.postingId}
                </p>
              )}
            </div>
            {/* Actions in the header from tablet up; phones get the fixed bar at the bottom. */}
            <div className="rise hidden shrink-0 flex-wrap items-center gap-2.5 sm:flex" style={{ animationDelay: "120ms" }}>
              {hasApplied ? appliedBadge() : applyBtn()}
              {saveBtn}
              {shareBtn}
            </div>
          </div>

          {/* Key facts: a hairline strip, read at a glance. */}
          <dl className="rise mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-3 lg:grid-flow-col lg:auto-cols-fr lg:grid-cols-none" style={{ animationDelay: "160ms" }}>
            {facts.map((f) => (
              <div key={f.k} className="bg-white px-5 py-4">
                <dt className="type-caption text-ink-subtle">{f.k}</dt>
                <dd className={cn("mt-1 text-[15.5px] font-semibold break-words tabular-nums", f.urgent ? "text-warning" : "text-ink")}>{f.v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Body */}
      <div className="bg-white">
        <div className={cn(CONTAINER, "grid gap-12 pt-12 pb-28 sm:pt-14 sm:pb-20 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-16 lg:pb-24")}>
          <article className="min-w-0 max-w-[760px] space-y-10">
            {job.description && (
              <section>
                <h2 className="type-title-lg font-semibold text-ink">About the role</h2>
                <div className={cn(proseCls, "mt-5")} dangerouslySetInnerHTML={renderRichText(job.description)} />
              </section>
            )}
            {hasContent(job.responsibilities) && section("What you'll do", job.responsibilities)}
            {hasContent(job.requirements) && section("What we're looking for", job.requirements)}

            <section className="border-t border-line pt-10">
              <h2 className="type-title-lg font-semibold text-ink">What we offer</h2>
              <ul className="mt-6 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-3">
                {CAREER_BENEFITS.map((b) => (
                  <li key={b.title} className="bg-white p-5">
                    <p className="text-[15.5px] font-semibold text-ink">{b.title}</p>
                    <p className="mt-1.5 type-body-sm text-ink-muted">{b.desc}</p>
                  </li>
                ))}
              </ul>
              <p className="mt-5 type-body-sm text-ink-subtle">{EEO_STATEMENT}</p>
            </section>

            {/* The ask, once more, where the reader finishes. */}
            <div className="rounded-2xl bg-ink p-8 text-white sm:p-10">
              {hasApplied ? (
                <>
                  <p className="flex items-center gap-2 type-title-lg font-semibold">
                    <IconCheckCircle size={22} className="text-emerald-300" />
                    Application submitted
                  </p>
                  <p className="mt-2 type-body text-white/80">
                    You have already applied for this position{statusLabel ? `. Status: ${statusLabel}` : ""}.
                  </p>
                  <Link
                    href="/careers/search"
                    className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-[15px] font-semibold text-ink hover:bg-cobalt-tint"
                  >
                    Browse more openings
                    <IconArrowRight size={16} />
                  </Link>
                </>
              ) : (
                <div>
                  <p className="type-title-lg font-semibold">Not quite the right role?</p>
                  <p className="mt-1.5 max-w-[52ch] type-body text-white/80">
                    Send us your resume and tell us the role you are looking for. We will keep it on file and reach out when something fits.
                  </p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <a
                      href={`mailto:${HR_EMAIL}?subject=${encodeURIComponent("Resume: role I'm looking for")}&body=${encodeURIComponent(
                        "Hello Ocean Blue team,\n\nThe role I'm looking for:\nPreferred location / work arrangement:\n\nMy resume is attached.\n\nThank you,\n",
                      )}`}
                      className="group inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-6 text-[15.5px] font-semibold text-ink hover:bg-cobalt-tint"
                    >
                      Email HR your resume
                      <IconArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                    </a>
                    <Link
                      href="/contact"
                      className="inline-flex h-12 items-center justify-center rounded-full border border-white/45 px-6 text-[15.5px] font-semibold text-white hover:border-white hover:bg-white/10"
                    >
                      Contact us
                    </Link>
                  </div>
                  <p className="mt-4 type-body-sm text-white/70">
                    Or write to <a href={`mailto:${HR_EMAIL}`} className="font-medium text-white underline underline-offset-4">{HR_EMAIL}</a>
                  </p>
                </div>
              )}
            </div>
          </article>

          {/* Side column: the summary that follows the reader down the page. */}
          <aside className="space-y-5 lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-2xl border border-line bg-white p-6">
              <p className="type-caption font-semibold text-cobalt">{job.department}</p>
              <p className="mt-1.5 type-title-lg font-semibold break-words text-ink">{job.title}</p>
              <p className="mt-2 type-body-sm text-ink-muted">
                {[formatJobType(job.type), mode, job.location].filter(Boolean).join(" · ")}
              </p>
              {due && (
                <p className={cn("mt-4 rounded-xl px-4 py-3 type-body-sm font-medium", due.urgent ? "bg-warning-container text-warning" : "bg-paper text-ink-muted")}>
                  {due.text === "Closed" ? "Applications have closed" : `Applications close: ${due.text}`}
                </p>
              )}
              <div className="mt-5 grid gap-2.5">
                {hasApplied ? appliedBadge("w-full") : applyBtn("w-full")}
                <div className="grid grid-cols-2 gap-2.5">
                  {saveBtn}
                  {shareBtn}
                </div>
              </div>
              <p className="mt-5 border-t border-line pt-4 type-caption text-ink-subtle">Posted {timeAgo(new Date(job.createdAt)).toLowerCase()}</p>
            </div>

            <div className="rounded-2xl bg-paper p-6">
              <p className="text-[16px] font-semibold text-ink">Ocean Blue Solutions</p>
              <p className="mt-2 type-body-sm text-ink-muted">
                IT staffing, engineering, enterprise solutions, managed services and training for enterprises and government agencies.
              </p>
              <Link href="/careers" className="mt-4 inline-flex items-center gap-1.5 type-label font-semibold text-ink hover:text-cobalt">
                Life at Ocean Blue <IconArrowRight size={14} />
              </Link>
            </div>
          </aside>
        </div>
      </div>

      {/* Phones: the action stays in reach at the bottom of the screen. */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 px-4 py-3 backdrop-blur-md sm:hidden">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate type-label font-semibold text-ink">{job.title}</p>
            <p className="truncate type-caption text-ink-subtle">{due ? due.text : formatJobType(job.type)}</p>
          </div>
          {hasApplied ? (
            <span className="inline-flex h-11 items-center gap-1.5 rounded-full bg-success-container px-4 type-label font-semibold text-success">
              <IconCheckCircle size={16} />
              Applied
            </span>
          ) : (
            <button type="button" onClick={() => setShowApply(true)} className="h-11 shrink-0 rounded-full bg-cobalt px-5 text-[15px] font-semibold text-white">
              Apply now
            </button>
          )}
        </div>
      </div>

      {/* Apply: a side sheet from sm up, a bottom sheet on phones. */}
      <SideSheet
        open={showApply}
        onOpenChange={(o) => {
          setShowApply(o);
          if (!o) setApplicationSubmitted(false);
        }}
        title={applicationSubmitted ? "Application sent" : "Apply for this role"}
        description={`${job.title} · ${job.location}`}
        footer={
          applicationSubmitted ? undefined : (
            <div className="space-y-3">
              <button
            type="submit"
            form="apply-form"
            disabled={submitting}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-cobalt text-[15.5px] font-semibold text-white transition-colors hover:bg-cobalt-deep disabled:opacity-60"
          >
            {submitting ? (
              <>
                <IconSpinner size={18} className="animate-spin" />
                Submitting…
              </>
            ) : (
              <>
                Submit application
                <IconArrowRight size={16} />
              </>
            )}
          </button>
              <p className="text-center type-caption text-ink-subtle">Fields marked * are required.</p>
            </div>
          )
        }
      >
              {applicationSubmitted ? (
                <div className="py-10 text-center" role="status">
                  <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-success-container text-success">
                    <IconCheckCircle size={30} />
                  </span>
                  <h3 className="mt-5 type-title-lg font-semibold text-ink">Application submitted</h3>
                  <p className="mt-2 type-body text-ink-muted">Thank you for applying. We will get back to you soon.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setShowApply(false);
                      setApplicationSubmitted(false);
                    }}
                    className="mt-7 inline-flex h-11 items-center rounded-full border border-line-strong px-5 type-label font-semibold text-ink hover:border-cobalt"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <form id="apply-form" onSubmit={handleApply} className="space-y-6">
                  <div className="rounded-2xl bg-paper p-4">
                    <p className="type-caption font-semibold text-cobalt">{job.department}</p>
                    <p className="mt-1 text-[15.5px] leading-snug font-semibold text-ink">{job.title}</p>
                    <p className="mt-1 type-body-sm text-ink-muted">{[formatJobType(job.type), mode, job.location].filter(Boolean).join(" · ")}</p>
                  </div>
                  <fieldset className="space-y-4">
                    <legend className="mb-3 type-caption font-semibold text-ink-subtle">Your details</legend>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor="apply-first" className={labelCls}>
                          First name <span className="text-danger">*</span>
                        </label>
                        <input id="apply-first" type="text" autoComplete="given-name" required value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} className={inputCls} />
                      </div>
                      <div>
                        <label htmlFor="apply-last" className={labelCls}>
                          Last name <span className="text-danger">*</span>
                        </label>
                        <input id="apply-last" type="text" autoComplete="family-name" required value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} className={inputCls} />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="apply-email" className={labelCls}>
                        Email <span className="text-danger">*</span>
                      </label>
                      <input id="apply-email" type="email" autoComplete="email" inputMode="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className={inputCls} />
                    </div>
                    <div>
                      <label htmlFor="apply-phone" className={labelCls}>
                        Phone
                      </label>
                      <input id="apply-phone" type="tel" autoComplete="tel" inputMode="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className={inputCls} />
                    </div>
                  </fieldset>

                  <fieldset className="space-y-4 border-t border-line pt-5">
                    <legend className="mb-3 type-caption font-semibold text-ink-subtle">Resume and note</legend>
                    <div>
                      <p id="apply-resume-label" className={labelCls}>
                        Resume
                      </p>
                      {resumeFile ? (
                        <div className="flex items-center gap-3 rounded-xl border border-success/25 bg-success-container p-3.5">
                          <IconFile size={22} className="shrink-0 text-success" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate type-body-sm font-medium text-ink">{resumeFile.name}</p>
                            <p className="type-caption text-ink-subtle">{(resumeFile.size / 1024).toFixed(1)} KB</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setResumeFile(null)}
                            aria-label="Remove resume"
                            className="flex size-9 items-center justify-center rounded-full text-ink-muted hover:bg-white hover:text-ink"
                          >
                            <IconX size={16} />
                          </button>
                        </div>
                      ) : (
                        <label className="flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed border-line-strong bg-paper px-4 py-7 text-center transition-colors focus-within:border-cobalt hover:border-ink-subtle">
                          <IconUpload size={24} className="text-ink-subtle" />
                          <span className="mt-2 type-label font-semibold text-ink">Upload resume</span>
                          <span className="type-caption text-ink-subtle">PDF, DOC, DOCX (max 5MB)</span>
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx"
                            aria-labelledby="apply-resume-label"
                            onChange={(e) => e.target.files?.[0] && setResumeFile(e.target.files[0])}
                            className="sr-only"
                          />
                        </label>
                      )}
                    </div>
                    <div>
                      <label htmlFor="apply-cover" className={labelCls}>
                        Cover letter <span className="font-normal text-ink-subtle">(optional)</span>
                      </label>
                      <textarea
                        id="apply-cover"
                        rows={5}
                        autoComplete="off"
                        value={formData.coverLetter}
                        onChange={(e) => setFormData({ ...formData, coverLetter: e.target.value })}
                        className={cn(inputCls, "h-auto resize-none py-3")}
                        placeholder="Tell us why you're interested"
                      />
                    </div>
                  </fieldset>

                  {applyError && (
                    <p role="alert" className="rounded-xl border border-danger/25 bg-danger-container px-4 py-3 type-body-sm text-danger">
                      {applyError}
                    </p>
                  )}
                </form>
              )}
      </SideSheet>
    </>
  );
}
