"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { buttonClass } from "@/components/site/button";
import { IconArrowRight, IconCheck, IconClock, IconMail } from "@/components/site/icons";
import { IconPhone, IconPin } from "@/components/site/company/icons";
import { Select } from "@/components/site/select";
import { cn } from "@/lib/utils";
import { useFormErrors } from "@/hooks/use-form-errors";
import { check, collectErrors, email, maxLen, minLen, normalizeWebsite, phone, required, website } from "@/lib/form-validation";
import { CONTACT_PATH_PARAM, type ContactPath } from "./paths";

const HIRING_TYPES = [
  "IT Staffing", "Contract Staffing", "Contract-to-Hire", "Direct Hire", "Managed Teams",
  "Cloud Services", "Cybersecurity", "ERP Solutions", "Salesforce", "Data & AI",
  "Managed Services", "Partnership Opportunity", "General Inquiry",
];

// Sent as "Job Seeker - <area>"; /api/contacts relaxes `company` on that prefix.
const JOB_SEEKER = "Job Seeker - ";
const EXPERTISE = [
  "Software Development", "Cloud & DevOps", "Cybersecurity", "ERP", "Salesforce",
  "Data & AI", "Project Management", "Other",
];

/** Everything on the sheet that changes with the path. */
const COPY: Record<ContactPath, {
  option: string;
  lead: string;
  steps: string[];
  formTitle: string;
  formLead: string;
  messageHint: string;
  done: { title: string; body: string };
}> = {
  hiring: {
    option: "I'm hiring",
    lead: "Contract, contract-to-hire, direct hire or a managed team. Tell us who you need and by when.",
    steps: [
      "We reply within one business day.",
      "A short call about the roles, skills and timeline.",
      "A shortlist or a scoped proposal, usually within the week.",
    ],
    formTitle: "Tell us who you need",
    formLead: "Roles, headcount and timeline are enough to start.",
    messageHint: "The roles you need filled, how many, and when they should start.",
    done: {
      title: "Your message is with our team.",
      body: "Someone will reply within one business day, usually with a few questions and a time to talk.",
    },
  },
  work: {
    option: "I'm looking for work",
    lead: "Tell our recruiters what you do and we'll keep you in mind for the searches that fit.",
    steps: [
      "A recruiter reads every submission.",
      "If you fit a current search, we reach out within one business day.",
      "If not yet, your details stay on file for the searches that do.",
    ],
    formTitle: "Tell us what you do",
    formLead: "A posting that already fits? Applying to it reaches the hiring team faster.",
    messageHint: "Your experience, the kind of role you want, and when you can start.",
    done: {
      title: "Your details are with our recruiters.",
      body: "We reach out within one business day if your background fits a current search. Applying to an open role gets your resume in front of a hiring team now.",
    },
  },
};

export type ContactDetails = { phone: string; email: string; hours: string; address: string };

const directRows = (d: ContactDetails) => [
  { icon: IconPhone, label: "Call", value: d.phone, href: `tel:${d.phone.replace(/[^\d+]/g, "")}` },
  { icon: IconMail, label: "Email", value: d.email, href: `mailto:${d.email}` },
  { icon: IconClock, label: "Hours", value: d.hours, href: null },
  { icon: IconPin, label: "Head office", value: d.address, href: "#locations" },
];

const EMPTY = {
  firstName: "", lastName: "", email: "", phone: "", company: "", jobTitle: "", inquiryType: "", linkedinUrl: "", message: "",
};
type Field = keyof typeof EMPTY;

const inputClass =
  "w-full rounded-xl border border-line-strong bg-white px-4 py-3 text-[15px] text-ink transition-[border-color,box-shadow] duration-150 placeholder:text-ink-subtle hover:border-ink-subtle focus:border-cobalt focus:outline-none focus:ring-4 focus:ring-cobalt-tint aria-[invalid=true]:border-danger";
const labelClass = "mb-1.5 block type-label text-ink";
// Focus on navy needs a white ring; the site default is cobalt.
const onNavyFocus = "outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-night";

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return <p id={`${id}-error`} className="mt-2 type-body-sm text-danger">{message}</p>;
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="grid gap-5 border-t border-line pt-7 first-of-type:border-t-0 first-of-type:pt-0 sm:grid-cols-2">
      <legend className="contents">
        <span className="type-title font-semibold text-ink sm:col-span-2">{title}</span>
      </legend>
      {children}
    </fieldset>
  );
}

/**
 * The contact sheet: a navy side that asks who you are and says what happens
 * next, and the form. The path switch rewrites both sides at once.
 */
export function ContactSheet({ initialPath, details }: { initialPath: ContactPath; details: ContactDetails }) {
  const [path, setPath] = useState<ContactPath>(initialPath);
  const seeker = path === "work";
  const copy = COPY[path];
  const [formData, setFormData] = useState(EMPTY);
  const [submitted, setSubmitted] = useState<ContactPath | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const honeypotRef = useRef<HTMLInputElement>(null);
  const renderedAt = useRef<number>(Date.now());

  const { errors, validateAll, revalidate, reset, invalidProps } = useFormErrors<Field>(() =>
    collectErrors<Field>({
      firstName: check(formData.firstName, required("Enter your first name.")),
      lastName: check(formData.lastName, required("Enter your last name.")),
      email: check(formData.email, required("Enter your email address."), email()),
      phone: check(formData.phone, phone()),
      company: seeker ? undefined : check(formData.company, required("Enter your company name."), maxLen(120)),
      jobTitle: seeker ? undefined : check(formData.jobTitle, maxLen(120)),
      linkedinUrl: seeker ? check(formData.linkedinUrl, website("Enter your LinkedIn profile address, like linkedin.com/in/your-name.")) : undefined,
      inquiryType: check(formData.inquiryType, required(seeker ? "Choose your area of expertise." : "Choose what you need help with.")),
      message: check(formData.message, required("Add a short message."), minLen(10, "Add a little more detail, at least 10 characters."), maxLen(4000)),
    }),
  );

  useEffect(() => {
    if (error) errorRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [error]);

  const choose = (next: ContactPath) => {
    if (next === path) return;
    setPath(next);
    setSubmitted(null);
    setError(null);
    reset();
    // An inquiry type from the other path is meaningless here.
    setFormData((prev) => ({ ...prev, inquiryType: "" }));
    const url = new URL(window.location.href);
    url.searchParams.set(CONTACT_PATH_PARAM, next);
    window.history.replaceState(window.history.state, "", url);
  };

  const set = (field: Field, value: string) => setFormData((prev) => ({ ...prev, [field]: value }));
  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => set(e.target.name as Field, e.target.value);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAll()) return;
    setLoading(true);
    setError(null);
    const { linkedinUrl, ...rest } = formData;
    const li = linkedinUrl.trim();
    const payload = seeker
      ? { ...rest, company: "", jobTitle: "", ...(li ? { linkedinUrl: normalizeWebsite(li) } : {}) }
      : rest;
    try {
      const response = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          website: honeypotRef.current?.value || "",
          _elapsedMs: Date.now() - renderedAt.current,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Your message wasn't sent. Check your connection and try again.");
      setSubmitted(path);
      setFormData(EMPTY);
      reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Your message wasn't sent. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const field = (id: Field, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div>
      <label htmlFor={id} className={labelClass}>{label}</label>
      <input id={id} name={id} value={formData[id]} onChange={onChange} className={inputClass} {...invalidProps(id)} {...props} />
      <FieldError id={id} message={errors[id]} />
    </div>
  );

  return (
    <div className="grid overflow-hidden rounded-[28px] border border-line bg-white lg:grid-cols-12">
      {/* ── Navy side, top: who are you ── */}
      <div className="bg-night px-6 pt-8 pb-8 text-white sm:px-10 sm:pt-12 lg:col-span-5 lg:row-start-1 lg:px-12 lg:pt-14 lg:pb-10">
        <p className="type-label text-white/75">Contact Ocean Blue</p>
        <h1 className="mt-3 max-w-[14ch] type-headline-lg text-white">Hiring, or looking for work?</h1>

        {/* Native radios: arrow keys switch, Tab enters and leaves the group. */}
        <fieldset className="mt-8">
          <legend className="sr-only">Choose what brings you here</legend>
          <div className="relative grid grid-cols-2 rounded-full bg-white/10 p-1 ring-1 ring-white/15">
            <span
              aria-hidden="true"
              className={cn(
                "absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-full bg-white transition-transform duration-[var(--dur-medium)] ease-[var(--ease-standard)] motion-reduce:transition-none",
                seeker && "translate-x-full",
              )}
            />
            {(Object.keys(COPY) as ContactPath[]).map((p) => {
              const active = path === p;
              return (
                <label
                  key={p}
                  className={cn(
                    "relative z-10 flex min-h-11 cursor-pointer items-center justify-center rounded-full px-3 text-center type-label transition-colors duration-150",
                    "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-white has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-night",
                    active ? "text-ink" : "text-white/85 hover:text-white",
                  )}
                >
                  <input
                    type="radio"
                    id={`path-${p}`}
                    name="contact-path"
                    value={p}
                    checked={active}
                    onChange={() => choose(p)}
                    className="sr-only"
                  />
                  {COPY[p].option}
                </label>
              );
            })}
          </div>
        </fieldset>

        <p className="mt-6 max-w-[42ch] type-body-lg text-white/85" aria-live="polite">{copy.lead}</p>
      </div>

      {/* ── Form side ── */}
      <div className="px-6 py-10 sm:px-10 lg:col-span-7 lg:col-start-6 lg:row-span-2 lg:row-start-1 lg:px-14 lg:py-14">
        {submitted ? (
          <div className="flex h-full flex-col items-start justify-center py-6" role="status">
            <span className="flex size-12 items-center justify-center rounded-full bg-success-container text-success">
              <IconCheck size={24} />
            </span>
            <h2 className="mt-6 max-w-[22ch] type-headline-sm text-ink">{COPY[submitted].done.title}</h2>
            <p className="mt-3 max-w-[52ch] type-body text-ink-muted">{COPY[submitted].done.body}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              {submitted === "work" && (
                <Link href="/careers/search" className={buttonClass("primary", "lg")}>
                  Browse open roles
                  <IconArrowRight size={16} />
                </Link>
              )}
              <button type="button" onClick={() => setSubmitted(null)} className={buttonClass("outline", "lg")}>
                Send another message
              </button>
            </div>
          </div>
        ) : (
          <>
            <h2 className="type-headline-sm text-ink">{copy.formTitle}</h2>
            <p className="mt-2 type-body text-ink-muted">
              {copy.formLead}
              {seeker && (
                <>
                  {" "}
                  <Link href="/careers/search" className="font-semibold text-cobalt underline underline-offset-4 hover:text-cobalt-deep">
                    Browse open roles
                  </Link>
                </>
              )}
            </p>

            {error && (
              <div role="alert" ref={errorRef} className="mt-6 rounded-xl border border-danger/25 bg-danger-container p-4">
                <p className="type-body-sm text-danger">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} onBlur={revalidate} noValidate className="mt-9 space-y-8">
              {/* Honeypot, hidden from people, but bots fill it. Do not remove. */}
              <div aria-hidden="true" className="absolute top-0 left-[-9999px] h-0 w-0 overflow-hidden" tabIndex={-1}>
                <label htmlFor="website">Website (leave this field empty)</label>
                <input ref={honeypotRef} type="text" id="website" name="website" tabIndex={-1} autoComplete="off" />
              </div>

              <Group title="About you">
                {field("firstName", "First name", { autoComplete: "given-name", maxLength: 60 })}
                {field("lastName", "Last name", { autoComplete: "family-name", maxLength: 60 })}
                {field("email", seeker ? "Email" : "Work email", {
                  type: "email", autoComplete: "email", inputMode: "email", maxLength: 254,
                  placeholder: seeker ? "jordan@example.com" : "jordan@company.com",
                })}
                {field("phone", "Phone (optional)", { type: "tel", autoComplete: "tel", inputMode: "tel", maxLength: 30, placeholder: "+1 (555) 000-0000" })}
              </Group>

              {seeker ? (
                <Group title="Your background">
                  <div>
                    <Select
                      id="inquiryType"
                      name="inquiryType"
                      label="Area of expertise"
                      shape="field"
                      value={formData.inquiryType}
                      onValueChange={(v) => set("inquiryType", v)}
                      options={EXPERTISE.map((t) => ({ value: JOB_SEEKER + t, label: t }))}
                      invalid={!!errors.inquiryType}
                      describedBy={errors.inquiryType ? "inquiryType-error" : undefined}
                    />
                    <FieldError id="inquiryType" message={errors.inquiryType} />
                  </div>
                  {field("linkedinUrl", "LinkedIn profile (optional)", { autoComplete: "url", inputMode: "url", maxLength: 2048, placeholder: "linkedin.com/in/your-name" })}
                </Group>
              ) : (
                <Group title="Your company">
                  {field("company", "Company", { autoComplete: "organization", maxLength: 120 })}
                  {field("jobTitle", "Your role (optional)", { autoComplete: "organization-title", maxLength: 120 })}
                  <div className="sm:col-span-2">
                    <Select
                      id="inquiryType"
                      name="inquiryType"
                      label="What you need"
                      shape="field"
                      value={formData.inquiryType}
                      onValueChange={(v) => set("inquiryType", v)}
                      options={HIRING_TYPES.map((t) => ({ value: t, label: t }))}
                      invalid={!!errors.inquiryType}
                      describedBy={errors.inquiryType ? "inquiryType-error" : undefined}
                    />
                    <FieldError id="inquiryType" message={errors.inquiryType} />
                  </div>
                </Group>
              )}

              <div className="border-t border-line pt-7">
                <label htmlFor="message" className={labelClass}>Message</label>
                <textarea
                  id="message"
                  name="message"
                  maxLength={4000}
                  rows={5}
                  value={formData.message}
                  onChange={onChange}
                  {...invalidProps("message")}
                  className={`${inputClass} resize-y`}
                  placeholder={copy.messageHint}
                />
                <FieldError id="message" message={errors.message} />
              </div>

              <div className="flex flex-col-reverse gap-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="type-caption text-ink-subtle">
                  We use your details only to reply. See our{" "}
                  <Link href="/privacy" className="font-medium text-cobalt underline-offset-4 hover:underline">privacy policy</Link>.
                </p>
                <button type="submit" disabled={loading} aria-busy={loading} className={buttonClass("primary", "lg", "w-full sm:w-auto")}>
                  {loading ? (
                    <>
                      <span className="size-5 animate-spin rounded-full border-2 border-white/30 border-t-white motion-reduce:animate-none" />
                      Sending…
                    </>
                  ) : (
                    <>
                      Send message
                      <IconArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </div>

      {/* ── Navy side, bottom: what happens next and direct lines. After the form on phones. ── */}
      <div className="bg-night px-6 pt-2 pb-10 text-white sm:px-10 lg:col-span-5 lg:row-start-2 lg:px-12 lg:pb-14">
        <div className="border-t border-white/15 pt-8">
          <h2 className="type-title font-semibold text-white">What happens next</h2>
          <ol className="mt-5 space-y-4" aria-live="polite">
            {copy.steps.map((s, i) => (
              <li key={s} className="flex gap-4">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full ring-1 ring-white/35 type-caption font-semibold tabular-nums text-white">
                  {i + 1}
                </span>
                <span className="pt-0.5 type-body-sm text-white/85">{s}</span>
              </li>
            ))}
          </ol>
        </div>

        <dl className="mt-10 grid gap-5 border-t border-white/15 pt-8 sm:grid-cols-2 lg:grid-cols-1">
          {directRows(details).map((row) => (
            <div key={row.label} className="flex gap-3">
              <row.icon size={18} className="mt-0.5 shrink-0 text-white/70" aria-hidden="true" />
              <div className="min-w-0">
                <dt className="type-caption text-white/70">{row.label}</dt>
                <dd className="mt-0.5 type-body-sm font-semibold text-white">
                  {row.href ? (
                    <a href={row.href} className={cn("underline-offset-4 hover:underline", onNavyFocus)}>{row.value}</a>
                  ) : row.value}
                </dd>
              </div>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
