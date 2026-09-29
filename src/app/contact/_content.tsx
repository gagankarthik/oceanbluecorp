"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import PageHero from "@/components/landing/PageHero";
import { SOCIAL_LINKS } from "@/components/layout/social";
import Locations from "@/components/landing/Locations";
import { CONTAINER, SECTION_Y } from "@/components/site/sections";
import { buttonClass } from "@/components/site/button";
import { IconArrowRight, IconCheck, IconMail, IconClock } from "@/components/site/icons";
import { IconPhone, IconPin } from "@/components/site/company/icons";
import { Select } from "@/components/site/select";

const inquiryTypes = [
  "General Inquiry", "IT Staffing", "Cloud Services", "Cybersecurity",
  "ERP Solutions", "Salesforce", "Data & AI", "Managed Services", "Partnership Opportunity",
];

/* Rewritten off vague claims ("Round-the-clock assistance from certified
   experts", "Years of delivery across regulated industries") and one promise
   we should not be making in writing, "We reply within 24 hours, guaranteed."
   Each line now states something specific and checkable. */
const inputClass =
  "w-full rounded-xl border border-line-strong bg-white px-4 py-3 text-[15px] text-ink transition-[border-color,box-shadow] placeholder:text-ink-subtle focus:border-cobalt focus:outline-none focus:ring-4 focus:ring-cobalt-tint";
const labelClass = "mb-2 block text-[14px] font-medium text-ink";

/** Direct routes, for anyone who would rather not fill in a form. */
const DIRECT = [
  { icon: IconPhone, k: "Call", v: "+1 (614) 844-6925", href: "tel:+16148446925" },
  { icon: IconMail, k: "Email", v: "hr@oceanbluecorp.com", href: "mailto:hr@oceanbluecorp.com" },
  { icon: IconClock, k: "Hours", v: "Monday to Friday, 8:00 AM to 5:00 PM EST", href: null },
  { icon: IconPin, k: "Head office", v: "Powell, Ohio", href: "#locations" },
];

export default function ContactPage({ content = {} }: { content?: Record<string, string> }) {
  const [formData, setFormData] = useState({
    firstName: "", lastName: "", email: "", phone: "", company: "", jobTitle: "", inquiryType: "", message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const honeypotRef = useRef<HTMLInputElement>(null);
  const renderedAt = useRef<number>(Date.now());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          website: honeypotRef.current?.value || "",
          _elapsedMs: Date.now() - renderedAt.current,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to submit form");
      setSubmitted(true);
      setFormData({ firstName: "", lastName: "", email: "", phone: "", company: "", jobTitle: "", inquiryType: "", message: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <>
      <PageHero
        eyebrow="Contact us"
        title={content.contactTitle || "Let's start a conversation."}
        subtitle={
          content.contactSubtitle ||
          "A question about our services, a custom solution, or a partnership, our team is ready to help."
        }
      />

      <section id="contact-form" data-tone="white" className={`scroll-mt-28 bg-white ${SECTION_Y}`}>
        <div className={`${CONTAINER} grid gap-12 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-16`}>
          {/* Form */}
          <div className="rounded-2xl border border-line bg-white p-6 shadow-[var(--shadow-raised)] sm:p-10">
            {submitted ? (
              <div className="flex flex-col items-center py-12 text-center" role="status">
                <span className="flex size-16 items-center justify-center rounded-full bg-cobalt text-white">
                  <IconCheck size={30} />
                </span>
                <h2 className="mt-6 type-title-lg text-ink">Thank you.</h2>
                <p className="mt-3 max-w-sm type-body text-ink-muted">
                  Your message has been received. A member of our team will be in touch.
                </p>
                <button type="button" onClick={() => setSubmitted(false)} className={buttonClass("outline", "lg", "mt-8")}>
                  Send another message
                </button>
              </div>
            ) : (
              <>
                <h2 className="type-headline-sm text-ink">Tell us about your project.</h2>
                <p className="mt-2 text-[16px] text-ink-muted">Fill out the form and we&apos;ll get back to you as soon as possible.</p>

                {error && (
                  <div role="alert" className="mt-6 rounded-xl border border-danger/25 bg-danger-container p-4">
                    <p className="text-[14.5px] text-danger">{error}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                  {/* Honeypot, hidden from people, but bots fill it. Do not remove. */}
                  <div aria-hidden="true" className="absolute top-0 left-[-9999px] h-0 w-0 overflow-hidden" tabIndex={-1}>
                    <label htmlFor="website">Website (leave this field empty)</label>
                    <input ref={honeypotRef} type="text" id="website" name="website" tabIndex={-1} autoComplete="off" />
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label htmlFor="firstName" className={labelClass}>First name *</label>
                      <input type="text" id="firstName" name="firstName" autoComplete="given-name" required maxLength={60} value={formData.firstName} onChange={handleChange} className={inputClass} placeholder="Jordan" />
                    </div>
                    <div>
                      <label htmlFor="lastName" className={labelClass}>Last name *</label>
                      <input type="text" id="lastName" name="lastName" autoComplete="family-name" required maxLength={60} value={formData.lastName} onChange={handleChange} className={inputClass} placeholder="Reyes" />
                    </div>
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label htmlFor="email" className={labelClass}>Work email *</label>
                      <input type="email" id="email" name="email" autoComplete="email" inputMode="email" required maxLength={254} value={formData.email} onChange={handleChange} className={inputClass} placeholder="jordan@company.com" />
                    </div>
                    <div>
                      <label htmlFor="phone" className={labelClass}>Phone number</label>
                      <input type="tel" id="phone" name="phone" autoComplete="tel" inputMode="tel" maxLength={30} pattern="\+?[\d\s().\-]{7,20}" value={formData.phone} onChange={handleChange} className={inputClass} placeholder="+1 (555) 000-0000" />
                    </div>
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label htmlFor="company" className={labelClass}>Company *</label>
                      <input type="text" id="company" name="company" autoComplete="organization" required maxLength={120} value={formData.company} onChange={handleChange} className={inputClass} placeholder="Company name" />
                    </div>
                    <div>
                      <label htmlFor="jobTitle" className={labelClass}>Job title</label>
                      <input type="text" id="jobTitle" name="jobTitle" autoComplete="organization-title" maxLength={120} value={formData.jobTitle} onChange={handleChange} className={inputClass} placeholder="Your role" />
                    </div>
                  </div>
                  <Select
                    id="inquiryType"
                    name="inquiryType"
                    label="Inquiry type"
                    required
                    shape="field"
                    value={formData.inquiryType}
                    onValueChange={(v) => setFormData((prev) => ({ ...prev, inquiryType: v }))}
                    options={inquiryTypes.map((t) => ({ value: t, label: t }))}
                  />
                  <div>
                    <label htmlFor="message" className={labelClass}>Message *</label>
                    <textarea id="message" name="message" required minLength={10} maxLength={4000} rows={5} value={formData.message} onChange={handleChange} className={`${inputClass} resize-none`} placeholder="Tell us about your project or inquiry..." />
                  </div>

                  <button type="submit" disabled={loading} className={buttonClass("primary", "lg", "w-full")}>
                    {loading ? (
                      <>
                        <span className="size-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Sending…
                      </>
                    ) : (
                      <>
                        Send message
                        <IconArrowRight size={16} />
                      </>
                    )}
                  </button>

                  <p className="text-center text-[13.5px] text-ink-subtle">
                    By submitting this form, you agree to our{" "}
                    <Link href="/privacy" className="font-medium text-cobalt underline-offset-4 hover:underline">Privacy Policy</Link>.
                  </p>
                </form>
              </>
            )}
          </div>

          {/* What a person needs beside a form: the way to skip it. */}
          <aside className="lg:pt-4">
            <h2 className="type-headline-sm text-ink">Reach a person directly.</h2>
            <p className="mt-3 type-body text-ink-muted">
              No switchboard and no ticket number. Whoever picks up can put you through to the people who would actually do the work.
            </p>

            <ul className="mt-8 divide-y divide-line border-y border-line">
              {DIRECT.map((row) => (
                <li key={row.k} className="flex items-start gap-4 py-4">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-line bg-white text-ink">
                    <row.icon size={18} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13.5px] text-ink-subtle">{row.k}</span>
                    {row.href ? (
                      <a href={row.href} className="block text-[16px] font-semibold text-ink underline-offset-4 hover:text-cobalt hover:underline">
                        {row.v}
                      </a>
                    ) : (
                      <span className="block text-[16px] font-semibold text-ink">{row.v}</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <span className="text-[14.5px] text-ink-muted">Or message us on</span>
              {SOCIAL_LINKS.map((sl) => (
                <a
                  key={sl.name}
                  href={sl.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={sl.name}
                  className="flex size-11 items-center justify-center rounded-full border border-line-strong text-ink-muted transition-colors hover:border-ink hover:text-ink"
                >
                  <sl.icon className="size-4" />
                </a>
              ))}
            </div>
          </aside>
        </div>
      </section>

      {/* Offices, with a map: four pins across three countries reads as coverage at a glance. */}
      <Locations />
    </>
  );
}
