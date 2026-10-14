"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useFormErrors } from "@/hooks/use-form-errors";
import { check, collectErrors, email, maxLen, minLen, normalizeWebsite, phone, required, website } from "@/lib/form-validation";
import { JOB_SEEKER_PREFIX } from "@/lib/contact";
import { CONTACT_PATH_PARAM, type ContactPath } from "./paths";

const HIRING_TYPES = [
  "IT Staffing", "Contract Staffing", "Contract-to-Hire", "Direct Hire", "Managed Teams",
  "Cloud Services", "Cybersecurity", "ERP Solutions", "Salesforce", "Data & AI",
  "Managed Services", "Partnership Opportunity", "General Inquiry",
];

// Sent as "Job Seeker - <area>"; /api/contacts drops the company requirement on that prefix.
const EXPERTISE = [
  "Software Development", "Cloud & DevOps", "Cybersecurity", "ERP", "Salesforce",
  "Data & AI", "Project Management", "Other",
];

const COPY: Record<ContactPath, {
  option: string;
  lead: string;
  next: string;
  messageLabel: string;
  messageHint: string;
  done: { title: string; body: string };
}> = {
  hiring: {
    option: "I'm hiring",
    lead: "Contract, contract-to-hire, direct hire or a managed team. Tell us who you need and by when.",
    next: "We reply within one business day, then a short call about roles and timeline.",
    messageLabel: "What are you working on?",
    messageHint: "For example: two AWS engineers for a migration starting next month.",
    done: {
      title: "Your message is with our team.",
      body: "Someone will reply within one business day, usually with a few questions and a time to talk.",
    },
  },
  work: {
    option: "I'm looking for work",
    lead: "Tell our recruiters what you do and we'll keep you in mind for the searches that fit.",
    next: "A recruiter reads every submission and replies within one business day if you fit a current search.",
    messageLabel: "About your experience",
    messageHint: "Your experience, the kind of role you want, and when you can start.",
    done: {
      title: "Your details are with our recruiters.",
      body: "We reach out within one business day if your background fits a current search. Applying to an open job gets your resume in front of a hiring team now.",
    },
  },
};

const EMPTY = { firstName: "", lastName: "", email: "", phone: "", company: "", jobTitle: "", inquiryType: "", linkedinUrl: "", message: "" };
type Field = keyof typeof EMPTY;

const base =
  "mt-2 w-full border-0 border-b-2 border-mist-300 bg-transparent px-0 text-navy-900 placeholder:text-mist-500 transition-colors focus:border-ocean-600 focus:outline-none aria-[invalid=true]:border-navy-900";
const field = `${base} py-3 text-lead`;
// Body size, so the open list of options stays a normal size too
const selectField = `${base} py-2.5 text-[17px]`;

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={`${id}-error`} className="mt-2 flex items-center gap-2 text-[15px] font-normal text-navy-900">
      <span aria-hidden className="size-2 shrink-0 bg-buoy-500" />
      {message}
    </p>
  );
}

export default function ContactForm({ initialPath = "hiring" }: { initialPath?: ContactPath }) {
  const [path, setPath] = useState<ContactPath>(initialPath);
  const seeker = path === "work";
  const copy = COPY[path];
  const [form, setForm] = useState(EMPTY);
  const [sent, setSent] = useState<ContactPath | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const doneRef = useRef<HTMLHeadingElement>(null);
  // Anti-spam: a hidden decoy field and the time taken to fill the form.
  const honeypot = useRef<HTMLInputElement>(null);
  const renderedAt = useRef(Date.now());

  useEffect(() => {
    if (sent) doneRef.current?.focus();
  }, [sent]);

  const { errors, validateAll, revalidate, reset, invalidProps } = useFormErrors<Field>(() =>
    collectErrors<Field>({
      firstName: check(form.firstName, required("Enter your first name."), maxLen(60)),
      lastName: check(form.lastName, required("Enter your last name."), maxLen(60)),
      email: check(form.email, required("Enter your email address."), email()),
      phone: check(form.phone, phone()),
      company: seeker ? undefined : check(form.company, required("Enter your company or agency."), maxLen(120)),
      jobTitle: seeker ? undefined : check(form.jobTitle, maxLen(120)),
      linkedinUrl: seeker ? check(form.linkedinUrl, website("Enter your LinkedIn profile address, like linkedin.com/in/your-name.")) : undefined,
      inquiryType: check(form.inquiryType, required(seeker ? "Choose your area of expertise." : "Choose what you need help with.")),
      message: check(form.message, required("Add a short message."), minLen(10, "Add a little more detail, at least 10 characters."), maxLen(4000)),
    }),
  );

  function choose(next: ContactPath) {
    if (next === path) return;
    setPath(next);
    setSent(null);
    setError(null);
    reset();
    // An inquiry type from the other path means nothing here.
    setForm((f) => ({ ...f, inquiryType: "" }));
    const url = new URL(window.location.href);
    url.searchParams.set(CONTACT_PATH_PARAM, next);
    window.history.replaceState(window.history.state, "", url);
  }

  const set = (k: Field, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const bind = (k: Field) => ({
    id: k,
    name: k,
    value: form[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => set(k, e.target.value),
    ...invalidProps(k),
  });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!validateAll()) return;
    setError(null);
    setBusy(true);
    const { linkedinUrl, ...rest } = form;
    const li = linkedinUrl.trim();
    const payload = seeker ? { ...rest, company: "", jobTitle: "", ...(li ? { linkedinUrl: normalizeWebsite(li) } : {}) } : rest;
    try {
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          website: honeypot.current?.value ?? "",
          _elapsedMs: Date.now() - renderedAt.current,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Your message wasn't sent. Check your connection and try again.");
      setForm(EMPTY);
      reset();
      setSent(path);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Your message wasn't sent. Try again.");
    } finally {
      setBusy(false);
    }
  }

  const label = (k: Field, text: string) => (
    <label htmlFor={k} className="font-medium">
      {text}
    </label>
  );

  const select = (k: Field, text: string, options: { value: string; label: string }[]) => (
    <div>
      {label(k, text)}
      <div className="relative">
        <select {...bind(k)} className={`${selectField} cursor-pointer appearance-none pr-8`}>
          <option value="" disabled>
            Choose one
          </option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <svg aria-hidden viewBox="0 0 16 16" className="pointer-events-none absolute right-1 top-1/2 size-4 text-navy-900" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="m4 6 4 4 4-4" />
        </svg>
      </div>
      <FieldError id={k} message={errors[k]} />
    </div>
  );

  const input = (k: Field, text: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div>
      {label(k, text)}
      <input {...bind(k)} className={field} {...props} />
      <FieldError id={k} message={errors[k]} />
    </div>
  );

  return (
    <div>
      {/* Once sent, the confirmation stands alone */}
      {!sent && (
        <>
          <fieldset>
            <legend className="display text-[clamp(2rem,3.4vw,3.25rem)]">Hiring, or looking for work?</legend>
            <div className="mt-8 flex flex-wrap gap-2">
              {(Object.keys(COPY) as ContactPath[]).map((p) => (
                <label
                  key={p}
                  className={`flex min-h-12 cursor-pointer items-center px-5 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-cyan-500 ${
                    path === p ? "bg-navy-900 text-white" : "bg-mist-0 text-navy-900 hover:bg-tide-200"
                  }`}
                >
                  <input type="radio" name="contact-path" value={p} checked={path === p} onChange={() => choose(p)} className="sr-only" />
                  {COPY[p].option}
                </label>
              ))}
            </div>
          </fieldset>
          <p className="mt-6 max-w-[52ch]" aria-live="polite">
            {copy.lead}
            {seeker && (
              <>
                {" "}
                A posting that already fits?{" "}
                <Link href="/jobs" className="font-medium text-ocean-700 underline underline-offset-4">
                  Applying to it
                </Link>{" "}
                reaches the hiring team faster.
              </>
            )}
          </p>
        </>
      )}

      {sent ? (
        <div role="status">
          <span aria-hidden className="grid size-12 place-items-center rounded-full bg-[#079455] text-white">
            <svg viewBox="0 0 20 20" className="size-6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m4.5 10.5 3.5 3.5 7.5-8" />
            </svg>
          </span>
          <h2 ref={doneRef} tabIndex={-1} className="display mt-6 text-[clamp(1.75rem,2.6vw,2.5rem)] outline-none">
            {COPY[sent].done.title}
          </h2>
          <p className="mt-4 max-w-[52ch]">{COPY[sent].done.body}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            {sent === "work" && (
              <Link href="/jobs" className="inline-flex min-h-12 items-center bg-ocean-600 px-6 font-medium text-white btn-fill btn-fill-ocean">
                Browse open jobs
              </Link>
            )}
            <button
              type="button"
              onClick={() => setSent(null)}
              className="inline-flex min-h-12 items-center px-6 font-medium text-navy-900 ring-2 ring-inset ring-navy-900 btn-fill btn-fill-outline"
            >
              Send another message
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} onBlur={revalidate} noValidate className="relative">
          <div className="mt-12 grid gap-x-10 gap-y-8 sm:grid-cols-2">
            {input("firstName", "First name", { autoComplete: "given-name", maxLength: 60 })}
            {input("lastName", "Last name", { autoComplete: "family-name", maxLength: 60 })}
            {input("email", seeker ? "Email" : "Work email", { type: "email", autoComplete: "email", inputMode: "email", maxLength: 254 })}
            {input("phone", "Phone, if you prefer a call", { type: "tel", autoComplete: "tel", inputMode: "tel", maxLength: 30 })}
            {seeker ? (
              <>
                {select("inquiryType", "Area of expertise", EXPERTISE.map((t) => ({ value: `${JOB_SEEKER_PREFIX} - ${t}`, label: t })))}
                {input("linkedinUrl", "LinkedIn profile, optional", { autoComplete: "url", inputMode: "url", maxLength: 2048, placeholder: "linkedin.com/in/your-name" })}
              </>
            ) : (
              <>
                {input("company", "Company or agency", { autoComplete: "organization", maxLength: 120 })}
                {input("jobTitle", "Your role, optional", { autoComplete: "organization-title", maxLength: 120 })}
                {select("inquiryType", "What do you need?", HIRING_TYPES.map((t) => ({ value: t, label: t })))}
              </>
            )}
          </div>
          <div className="mt-8">
            {label("message", copy.messageLabel)}
            <textarea {...bind("message")} rows={4} maxLength={4000} placeholder={copy.messageHint} className={`${field} resize-none`} />
            <FieldError id="message" message={errors.message} />
          </div>

          {/* Honeypot: hidden from people, filled by bots. */}
          <div aria-hidden className="absolute -left-[9999px] size-px overflow-hidden">
            <label htmlFor="website">Website, leave this empty</label>
            <input ref={honeypot} id="website" name="website" tabIndex={-1} autoComplete="off" />
          </div>

          {error && (
            <p role="alert" className="mt-8 bg-buoy-300/30 px-4 py-3 text-[15px] text-navy-900">
              {error}
            </p>
          )}

          <div className="mt-12 flex flex-wrap items-center gap-6">
            <button
              type="submit"
              disabled={busy}
              className="inline-flex min-h-12 items-center bg-ocean-600 px-7 font-medium text-white btn-fill btn-fill-ocean active:translate-y-px disabled:opacity-60"
            >
              {busy ? "Sending…" : "Send message"}
            </button>
            <p className="max-w-[44ch] text-[15px] text-mist-600">
              {copy.next} We use your details only to reply. See our{" "}
              <Link href="/privacy" className="font-medium text-ocean-700 underline underline-offset-4">
                privacy policy
              </Link>
              .
            </p>
          </div>
        </form>
      )}
    </div>
  );
}
