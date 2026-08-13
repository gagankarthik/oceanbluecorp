"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { Phone, Send, CheckCircle2 } from "lucide-react";
import { Reveal } from "@/components/landing/motion/Primitives";
import { Eyebrow } from "@/components/landing/ui";
import PageHero from "@/components/landing/PageHero";
import { SOCIAL_LINKS } from "@/components/layout/social";
import Locations from "@/components/landing/Locations";
import { IMG } from "@/components/landing/media";

const inquiryTypes = [
  "General Inquiry", "IT Staffing", "Cloud Services", "Cybersecurity",
  "ERP Solutions", "Salesforce", "Data & AI", "Managed Services", "Partnership Opportunity",
];

/* Rewritten off vague claims ("Round-the-clock assistance from certified
   experts", "Years of delivery across regulated industries") and one promise
   we should not be making in writing , "We reply within 24 hours, guaranteed."
   Each line now states something specific and checkable. */
const inputClass =
  "w-full rounded-lg border border-black/[0.12] bg-white px-4 py-3 text-[14px] text-[var(--hz-text)] transition-all placeholder:text-[var(--hz-text-subtle)] focus:border-[var(--hz-cobalt)] focus:outline-none focus:ring-4 focus:ring-[var(--hz-cobalt-100)]";
const labelClass = "mb-2 block text-[13px] font-medium text-[var(--hz-text)]";

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

  // CMS overrides for the contact-method cards (blank → built-in default)
  return (
    <div className="horizon w-full bg-[var(--hz-canvas)]">
      {/* Hero */}
      <PageHero
        eyebrow="Contact us"
        title={content.contactTitle || "Let's start a conversation."}
        subtitle={
          content.contactSubtitle ||
          "A question about our services, a custom solution, or a partnership, our team is ready to help."
        }
      />

      {/* Form + side */}
      <section id="contact-form" className="scroll-mt-24 px-6 pb-24 pt-16 sm:px-8 sm:pb-28 sm:pt-20">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.4fr_1fr] lg:gap-16">
          {/* Form */}
          <div className="rounded-3xl border border-black/[0.08] bg-white p-6 shadow-[var(--hz-shadow-lg)] sm:p-10">
            {submitted ? (
              <div className="flex flex-col items-center py-12 text-center">
                <div className="grid h-20 w-20 place-items-center rounded-full bg-[var(--hz-cobalt)] text-white">
                  <CheckCircle2 className="h-10 w-10" strokeWidth={1.5} />
                </div>
                <h3 className="hz-display mt-6 text-[1.6rem] text-[var(--hz-text)]">Thank you.</h3>
                <p className="mt-3 max-w-sm text-[15px] text-[var(--hz-text-mute)]">
                  Your message has been received. A member of our team will contact you within 24 hours.
                </p>
                <button onClick={() => setSubmitted(false)} className="hz-btn-ghost mt-8">Send another message</button>
              </div>
            ) : (
              <>
                <Eyebrow>Send a message</Eyebrow>
                <h2 className="hz-display mt-5 text-[1.8rem] text-[var(--hz-text)] sm:text-[2.1rem]">Tell us about your project.</h2>
                <p className="mt-3 text-[15px] text-[var(--hz-text-mute)]">Fill out the form and we&apos;ll get back to you as soon as possible.</p>

                {error && (
                  <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4">
                    <p className="text-[14px] text-red-600">{error}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                  {/* Honeypot, hidden from people, but bots fill it. Do not remove. */}
                  <div aria-hidden="true" className="absolute left-[-9999px] top-0 h-0 w-0 overflow-hidden" tabIndex={-1}>
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
                  <div>
                    <label htmlFor="inquiryType" className={labelClass}>Inquiry type *</label>
                    <select id="inquiryType" name="inquiryType" required value={formData.inquiryType} onChange={handleChange} className={inputClass}>
                      <option value="">Select an option</option>
                      {inquiryTypes.map((type) => (<option key={type} value={type}>{type}</option>))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="message" className={labelClass}>Message *</label>
                    <textarea id="message" name="message" required minLength={10} maxLength={4000} rows={5} value={formData.message} onChange={handleChange} className={`${inputClass} resize-none`} placeholder="Tell us about your project or inquiry..." />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--hz-cobalt)] px-6 py-3.5 text-[14px] font-semibold text-white transition-all duration-300 hover:bg-[var(--hz-cobalt-600)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Sending…
                      </>
                    ) : (
                      <>Send message<Send className="h-4 w-4" strokeWidth={1.75} /></>
                    )}
                  </button>

                  <p className="text-center text-[13px] text-[var(--hz-text-subtle)]">
                    By submitting this form, you agree to our{" "}
                    <Link href="/privacy" className="font-medium text-[var(--hz-cobalt)] hover:underline">Privacy Policy</Link>.
                  </p>
                </form>
              </>
            )}
          </div>

          {/* Side. Was four "why partner with us" cards, each in a tinted
              icon chip with a hover lift, plus a third repeat of the phone
              number. That argument belongs on the landing page, the chip and
              the lift are patterns this site removed everywhere else, and by
              then the page had shown the phone three times. What a person
              needs beside a form is the way to skip it. */}
          <div className="lg:pt-2">
            <Eyebrow>Rather not fill in a form?</Eyebrow>
            <h2 className="hz-display mt-5 text-[1.6rem] text-[var(--hz-text)] sm:text-[1.9rem]">
              Reach a person directly.
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-[var(--hz-text-mute)]">
              No switchboard and no ticket number. Whoever picks up can put you
              through to the people who would actually do the work.
            </p>

            <dl className="mt-8 divide-y divide-[var(--hz-paper-line)] border-y border-[var(--hz-paper-line)]">
              {[
                { k: "Call", v: "+1 (614) 844-6925", href: "tel:+16148446925" },
                { k: "Email", v: "hr@oceanbluecorp.com", href: "mailto:hr@oceanbluecorp.com" },
                { k: "Hours", v: "Monday to Friday, 8:00 AM to 5:00 PM EST", href: null },
                { k: "Head office", v: "Powell, Ohio", href: "#locations" },
              ].map((row) => (
                <div key={row.k} className="flex items-baseline justify-between gap-6 py-3.5">
                  <dt className="text-[13px] uppercase tracking-[0.1em] text-[var(--hz-text-subtle)]">{row.k}</dt>
                  <dd className="text-right text-[14.5px] font-medium text-[var(--hz-text)]">
                    {row.href ? (
                      <a href={row.href} className="text-[var(--hz-cobalt)] transition-opacity hover:opacity-80">{row.v}</a>
                    ) : (
                      row.v
                    )}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="mt-7 flex flex-wrap items-center gap-4">
              <span className="text-[13.5px] text-[var(--hz-text-mute)]">Or message us on</span>
              {SOCIAL_LINKS.map((sl) => (
                <a
                  key={sl.name}
                  href={sl.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={sl.name}
                  className="text-[var(--hz-text-subtle)] transition-colors hover:text-[var(--hz-cobalt)]"
                >
                  <sl.icon className="h-[18px] w-[18px]" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Offices */}
      {/* The office list, with a map. It replaces a four-card grid that said
          the same thing without showing the shape of it: four pins across three
          countries reads as coverage at a glance, which a list of addresses
          does not. The addresses are still text underneath, so nothing depends
          on the picture. */}
      <Locations />
    </div>
  );
}
