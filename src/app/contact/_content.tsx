"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import {
  Mail, Phone, MapPin, Clock, Send, CheckCircle2, Building2, Globe,
  MessageSquare, Headphones, ArrowRight, type LucideIcon,
} from "lucide-react";
import { Reveal, Stagger, StaggerItem } from "@/components/landing/motion/Primitives";
import { Eyebrow, Cta } from "@/components/landing/ui";
import Photo from "@/components/landing/Photo";
import PageHero from "@/components/landing/PageHero";
import { SOCIAL_LINKS } from "@/components/layout/social";
import Locations from "@/components/landing/Locations";
import { IMG } from "@/components/landing/media";

const contactInfo: {
  icon: LucideIcon; title: string; description: string; value: string; href: string | null;
}[] = [
  { icon: Phone, title: "Call us", description: "Speak with our team", value: "+1 (614) 844-6925", href: "tel:+16148446925" },
  { icon: Mail, title: "Email us", description: "Usually answered the same business day", value: "hr@oceanbluecorp.com", href: "mailto:hr@oceanbluecorp.com" },
  { icon: MapPin, title: "Visit us", description: "Headquarters", value: "9775 Fairway Drive, Suite C, Powell, OH 43065", href: "#locations" },
  { icon: Clock, title: "Business hours", description: "Monday – Friday", value: "8:00 AM – 5:00 PM EST", href: null },
];

const inquiryTypes = [
  "General Inquiry", "IT Staffing", "Cloud Services", "Cybersecurity",
  "ERP Solutions", "Salesforce", "Data & AI", "Managed Services", "Partnership Opportunity",
];

/* Rewritten off vague claims ("Round-the-clock assistance from certified
   experts", "Years of delivery across regulated industries") and one promise
   we should not be making in writing , "We reply within 24 hours, guaranteed."
   Each line now states something specific and checkable. */
const whyPartner: { icon: LucideIcon; title: string; description: string }[] = [
  { icon: MessageSquare, title: "A named contact", description: "You get a person who knows your account, not a shared inbox and a ticket number." },
  { icon: Globe, title: "Four offices, three countries", description: "Powell, Ohio; Hyderabad and Vizianagaram, India; and London." },
  { icon: Building2, title: "Regulated industries", description: "Healthcare, state government, and financial services work under HIPAA, SOC 2, and NIST." },
  { icon: Headphones, title: "Support that stays", description: "The team that builds it is the team that runs it, on one SLA." },
];

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
  const methods = contactInfo.map((m) => {
    if (m.title === "Call us" && content.contactPhone)
      return { ...m, value: content.contactPhone, href: `tel:${content.contactPhone.replace(/[^\d+]/g, "")}` };
    if (m.title === "Email us" && content.contactEmail)
      return { ...m, value: content.contactEmail, href: `mailto:${content.contactEmail}` };
    if (m.title === "Visit us" && content.contactAddress)
      return { ...m, value: content.contactAddress };
    if (m.title === "Business hours" && content.contactHours)
      return { ...m, value: content.contactHours };
    return m;
  });

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

      {/* Contact info cards (overlap hero) */}
      <section className="relative z-20 mt-14 px-6 sm:px-8 sm:mt-16">
        <Stagger className="mx-auto grid max-w-7xl gap-5 sm:grid-cols-2 lg:grid-cols-4" gap={0.07}>
          {methods.map((info) => {
            const Inner = (
              <>
                <div className="text-[var(--hz-cobalt)]">
                  <info.icon className="h-6 w-6" strokeWidth={1.5} />
                </div>
                <h3 className="hz-display mt-5 text-[1.15rem] text-[var(--hz-text)]">{info.title}</h3>
                <p className="mt-1 text-[13px] text-[var(--hz-text-subtle)]">{info.description}</p>
                <p className="mt-2 text-[13.5px] font-medium" style={{ color: info.href ? "var(--hz-cobalt)" : "var(--hz-text)" }}>{info.value}</p>
              </>
            );
            const cls = "hz-card block h-full p-6";
            return (
              <StaggerItem key={info.title} className="h-full">
                {info.href ? <a href={info.href} className={cls}>{Inner}</a> : <div className={cls}>{Inner}</div>}
              </StaggerItem>
            );
          })}
        </Stagger>
      </section>

      {/* Route the visitor before the form.

          Everything on this page pointed at one HR address, so a Fortune 500
          buyer, a candidate and a client with a production incident were all
          being asked to fill in the same box and wait. Naming the three routes
          costs one row and gets each of them to the right place: the form for
          new work, the job board for candidates, and the phone plus the status
          page for anyone whose system is down right now, because someone with
          an outage should never be told to use a form. */}
      <section className="px-6 pt-16 sm:px-8 sm:pt-20">
        <div className="mx-auto max-w-7xl">
          <Reveal className="max-w-2xl">
            <Eyebrow>Who do you need?</Eyebrow>
            <h2 className="hz-display mt-5 text-[clamp(1.5rem,3vw,2.25rem)] text-[var(--hz-text)]">
              Three doors, so you do not queue behind the wrong one.
            </h2>
          </Reveal>
          <div className="mt-8 grid gap-4 sm:mt-10 sm:grid-cols-3">
            {[
              {
                title: "New work",
                body: "Staffing, an engineering programme, a platform, or all of it. Tell us what you are trying to fix and we will put the right people on the call.",
                cta: "Use the form below",
                href: "#contact-form",
              },
              {
                title: "Looking for a role",
                body: "Every open position is on the job board, and applying there reaches the recruiters directly rather than a general inbox.",
                cta: "See open roles",
                href: "/careers/search",
              },
              {
                title: "Already a client",
                body: "If something is down, call. Do not use the form. Live platform status is published, and your account contact is reachable on the same number.",
                cta: "Check system status",
                href: "/status",
              },
            ].map((r) => (
              <div key={r.title} className="hz-card flex h-full flex-col p-6">
                <h3 className="text-[15.5px] font-semibold text-[var(--hz-text)]">{r.title}</h3>
                <p className="mt-2.5 flex-1 text-[13.5px] leading-relaxed text-[var(--hz-text-mute)]">{r.body}</p>
                <a
                  href={r.href}
                  className="mt-5 inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-[var(--hz-cobalt)] transition-opacity hover:opacity-80"
                >
                  {r.cta}
                  <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
                </a>
              </div>
            ))}
          </div>

          {/* Some people would simply rather message than fill in a form. */}
          <div className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-[var(--hz-paper-line)] pt-6">
            <span className="text-[13.5px] text-[var(--hz-text-mute)]">Or reach us where you already are</span>
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
      </section>

      {/* Form + side */}
      <section id="contact-form" className="scroll-mt-24 px-6 py-24 sm:px-8 sm:py-28">
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

          {/* Side */}
          <div className="lg:pt-2">
            <Eyebrow>Why partner with us</Eyebrow>
            <h2 className="hz-display mt-5 text-[1.8rem] text-[var(--hz-text)] sm:text-[2.1rem]">Built for the long term.</h2>
            <p className="mt-3 text-[15px] text-[var(--hz-text-mute)]">
              Join the enterprises that trust Ocean Blue for IT staffing, solutions, and managed services.
            </p>

            <Stagger className="mt-8 space-y-3" gap={0.09}>
              {whyPartner.map((item) => (
                <StaggerItem key={item.title}>
                  <div className="hz-card group flex items-start gap-4 p-5 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5">
                    <div className="grid h-10 w-10 flex-none place-items-center rounded-lg bg-[var(--hz-cobalt-100)] text-[var(--hz-cobalt)] transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-110">
                      <item.icon className="h-5 w-5" strokeWidth={1.5} />
                    </div>
                    <div>
                      <h4 className="text-[14.5px] font-semibold text-[var(--hz-text)]">{item.title}</h4>
                      <p className="mt-0.5 text-[13.5px] text-[var(--hz-text-mute)]">{item.description}</p>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>

            <div className="mt-6 rounded-2xl border border-black/[0.08] bg-[var(--hz-surface-2)] p-6">
              <p className="hz-eyebrow text-[var(--hz-text-subtle)]">Prefer to talk now?</p>
              <a href="tel:+16148446925" className="mt-3 inline-flex items-center gap-2 text-[16px] font-semibold text-[var(--hz-cobalt)] hover:underline">
                <Phone className="h-4 w-4" strokeWidth={1.75} /> +1 (614) 844-6925
              </a>
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
