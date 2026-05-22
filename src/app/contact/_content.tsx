"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  Building2,
  Globe,
  MessageSquare,
  Headphones,
  ArrowRight,
  Sparkles,
} from "lucide-react";

type Tint = { iColor: string; iBg: string };

const contactInfo: {
  icon: typeof Phone;
  title: string;
  description: string;
  value: string;
  href: string | null;
  tint: Tint;
}[] = [
  {
    icon: Phone,
    title: "Call Us",
    description: "Speak with our hiring team",
    value: "+1-614-844-6925",
    href: "tel:+16148446925",
    tint: { iColor: "#2563eb", iBg: "#eff6ff" },
  },
  {
    icon: Mail,
    title: "Email Us",
    description: "Get a response within 24 hours",
    value: "hr@oceanbluecorp.com",
    href: "mailto:hr@oceanbluecorp.com",
    tint: { iColor: "#7c3aed", iBg: "#f5f3ff" },
  },
  {
    icon: MapPin,
    title: "Visit Us",
    description: "Our headquarters location",
    value: "9775 Fairway Drive, Suite # C, Powell, OH - 43065",
    href: "#locations",
    tint: { iColor: "#059669", iBg: "#ecfdf5" },
  },
  {
    icon: Clock,
    title: "Business Hours",
    description: "Monday - Friday",
    value: "8:00 AM - 5:00 PM EST",
    href: null,
    tint: { iColor: "#d97706", iBg: "#fffbeb" },
  },
];

const offices = [
  {
    city: "Ohio",
    country: "United States",
    flag: "🇺🇸",
    address: "9775 Fairway Drive, Suite #C, Powell, OH - 43065",
    phone: "+1 (614) 844-6925",
  },
  {
    city: "Hyderabad",
    country: "India",
    flag: "🇮🇳",
    address: "13th Floor, Building Number 9, Raheja Mindspace, Madhapur, Hyderabad - 560081",
    phone: "+91 814 312 4665",
  },
  {
    city: "Vizianagaram",
    country: "India",
    flag: "🇮🇳",
    address: "Plot No: 87, CMR Green Field Layout, Vizianagaram, Andhra Pradesh - 535004",
    phone: "+91 814 294 9111",
  },
  {
    city: "London",
    country: "United Kingdom",
    flag: "🇬🇧",
    address: "910 London Road, Thornton Heath, CR7 7PE, UK",
    phone: "hr@oceanbluecorp.com",
  },
];

const inquiryTypes = [
  "General Inquiry",
  "ERP Solutions",
  "Cloud Services",
  "Data & AI",
  "Salesforce",
  "IT Staffing",
  "Corporate Training",
  "Partnership Opportunity",
];

const whyPartner = [
  { icon: Headphones, title: "24/7 Dedicated Support", description: "Round-the-clock assistance from certified experts." },
  { icon: Globe, title: "Global Delivery", description: "Offices in 4 locations for local support." },
  { icon: Building2, title: "Enterprise Experience", description: "10+ years across regulated industries." },
  { icon: MessageSquare, title: "Quick Response", description: "Response within 24 hours, guaranteed." },
];

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition-all placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10";
const labelClass = "mb-2 block text-sm font-medium text-slate-700";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    company: "",
    jobTitle: "",
    inquiryType: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/contacts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit form");
      }

      setSubmitted(true);
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        company: "",
        jobTitle: "",
        inquiryType: "",
        message: "",
      });
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
    <div className="bg-white">
      {/* ===== Hero ===== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 px-4 pb-36 pt-32 sm:px-6 sm:pb-40">
        {/* Soft animated orbs */}
        <motion.div
          aria-hidden
          animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
          className="pointer-events-none absolute -left-1/4 top-0 h-1/2 w-1/2 rounded-full bg-blue-600/20 blur-3xl"
        />
        <motion.div
          aria-hidden
          animate={{ scale: [1.15, 1, 1.15], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="pointer-events-none absolute -right-1/4 bottom-0 h-1/2 w-1/2 rounded-full bg-cyan-600/20 blur-3xl"
        />

        <div className="relative z-10 mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-3xl"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-200 backdrop-blur-sm">
              <Sparkles className="h-3 w-3" />
              Contact Us
            </span>
            <h1
              className="mt-5 text-[2.4rem] font-light leading-[1.05] tracking-tight text-white sm:text-[3rem] md:text-[3.6rem]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Let&apos;s start a{" "}
              <span className="bg-gradient-to-r from-cyan-300 via-blue-300 to-indigo-300 bg-clip-text font-medium text-transparent">
                conversation.
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-white/75 sm:text-[16px]">
              Whether you have a question about our services, need a custom
              solution, or want to discuss a partnership, our team is ready to
              help.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ===== Contact info cards (overlapping the hero) ===== */}
      <section className="relative z-20 -mt-24 px-4 sm:px-6">
        <div className="mx-auto grid max-w-7xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {contactInfo.map((info, i) => {
            const Inner = (
              <>
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-xl"
                  style={{ background: info.tint.iBg }}
                >
                  <info.icon className="h-6 w-6" style={{ color: info.tint.iColor }} />
                </div>
                <h3
                  className="mt-5 text-[15px] font-bold text-slate-900"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {info.title}
                </h3>
                <p className="mt-1 text-sm text-slate-500">{info.description}</p>
                <p
                  className="mt-2 text-sm font-semibold"
                  style={{ color: info.href ? info.tint.iColor : "#0f172a" }}
                >
                  {info.value}
                </p>
              </>
            );

            const cardClass =
              "group block h-full rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_10px_40px_-12px_rgba(15,23,42,0.18)] transition-all hover:-translate-y-1 hover:shadow-[0_20px_50px_-12px_rgba(15,23,42,0.25)]";

            return (
              <motion.div
                key={info.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] }}
              >
                {info.href ? (
                  <a href={info.href} className={cardClass}>
                    {Inner}
                  </a>
                ) : (
                  <div className={cardClass}>{Inner}</div>
                )}
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ===== Form + side ===== */}
      <section className="px-4 py-20 sm:px-6 sm:py-28">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.4fr_1fr] lg:gap-16">
          {/* Form card */}
          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_20px_60px_-24px_rgba(15,23,42,0.25)] sm:p-10">
            {submitted ? (
              <div className="flex flex-col items-center py-12 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 shadow-lg shadow-blue-500/30">
                  <CheckCircle2 className="h-10 w-10 text-white" />
                </div>
                <h3
                  className="mt-6 text-2xl font-bold text-slate-900"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Thank you!
                </h3>
                <p className="mt-3 max-w-sm text-slate-500">
                  Your message has been received. A member of our team will
                  contact you within 24 hours.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="mt-8 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <>
                <div className="mb-8">
                  <h2
                    className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    Send us a message
                  </h2>
                  <p className="mt-2 text-slate-500">
                    Fill out the form below and we&apos;ll get back to you as soon as
                    possible.
                  </p>
                </div>

                {error && (
                  <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label htmlFor="firstName" className={labelClass}>First Name *</label>
                      <input type="text" id="firstName" name="firstName" required value={formData.firstName} onChange={handleChange} className={inputClass} placeholder="John" />
                    </div>
                    <div>
                      <label htmlFor="lastName" className={labelClass}>Last Name *</label>
                      <input type="text" id="lastName" name="lastName" required value={formData.lastName} onChange={handleChange} className={inputClass} placeholder="Doe" />
                    </div>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label htmlFor="email" className={labelClass}>Work Email *</label>
                      <input type="email" id="email" name="email" required value={formData.email} onChange={handleChange} className={inputClass} placeholder="john@company.com" />
                    </div>
                    <div>
                      <label htmlFor="phone" className={labelClass}>Phone Number</label>
                      <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} className={inputClass} placeholder="+1 (555) 000-0000" />
                    </div>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label htmlFor="company" className={labelClass}>Company *</label>
                      <input type="text" id="company" name="company" required value={formData.company} onChange={handleChange} className={inputClass} placeholder="Company Name" />
                    </div>
                    <div>
                      <label htmlFor="jobTitle" className={labelClass}>Job Title</label>
                      <input type="text" id="jobTitle" name="jobTitle" value={formData.jobTitle} onChange={handleChange} className={inputClass} placeholder="Your Role" />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="inquiryType" className={labelClass}>Inquiry Type *</label>
                    <select id="inquiryType" name="inquiryType" required value={formData.inquiryType} onChange={handleChange} className={inputClass}>
                      <option value="">Select an option</option>
                      {inquiryTypes.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="message" className={labelClass}>Message *</label>
                    <textarea id="message" name="message" required rows={5} value={formData.message} onChange={handleChange} className={`${inputClass} resize-none`} placeholder="Tell us about your project or inquiry..." />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {loading ? (
                      <>
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Sending...
                      </>
                    ) : (
                      <>
                        Send message
                        <Send className="h-4 w-4" />
                      </>
                    )}
                  </button>

                  <p className="text-center text-sm text-slate-400">
                    By submitting this form, you agree to our{" "}
                    <Link href="/privacy" className="font-medium text-blue-600 hover:underline">
                      Privacy Policy
                    </Link>
                    .
                  </p>
                </form>
              </>
            )}
          </div>

          {/* Side: Why partner */}
          <div className="lg:pt-4">
            <h2
              className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Why partner{" "}
              <span className="bg-gradient-to-r from-blue-600 via-violet-600 to-cyan-500 bg-clip-text text-transparent">
                with us?
              </span>
            </h2>
            <p className="mt-3 text-slate-500">
              Join the enterprises that trust Ocean Blue Corporation for their
              digital transformation journey.
            </p>

            <div className="mt-7 space-y-3">
              {whyPartner.map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, x: 16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                  className="flex items-start gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition-all hover:border-blue-100 hover:shadow-md"
                >
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-600">
                    <item.icon className="h-5 w-5" strokeWidth={2.25} />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900" style={{ fontFamily: "var(--font-display)" }}>
                      {item.title}
                    </h4>
                    <p className="mt-0.5 text-sm text-slate-500">{item.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Quick contact prompt */}
            <div className="mt-6 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-5">
              <p className="text-sm font-semibold text-slate-900" style={{ fontFamily: "var(--font-display)" }}>
                Prefer to talk now?
              </p>
              <a
                href="tel:+16148446925"
                className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:underline"
              >
                <Phone className="h-4 w-4" />
                +1 (614) 844-6925
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Offices ===== */}
      <section id="locations" className="border-t border-slate-100 bg-slate-50 px-4 py-20 sm:px-6 sm:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3.5 py-1.5 text-xs font-semibold text-blue-700" style={{ fontFamily: "var(--font-display)" }}>
              <Globe className="h-3.5 w-3.5" />
              Our Offices
            </span>
            <h2
              className="mt-5 text-[1.85rem] font-extrabold tracking-tight text-slate-900 sm:text-[2.4rem] md:text-5xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Global presence,{" "}
              <span className="bg-gradient-to-r from-blue-600 via-violet-600 to-cyan-500 bg-clip-text text-transparent">
                local expertise.
              </span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-slate-500">
              With offices around the world, we&apos;re always close to our
              clients. Visit us or schedule a meeting at any of our locations.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {offices.map((office, i) => (
              <motion.div
                key={office.city}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] }}
                className="group rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="mb-4 flex items-center gap-3">
                  <span className="text-2xl">{office.flag}</span>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900" style={{ fontFamily: "var(--font-display)" }}>
                      {office.city}
                    </h3>
                    <p className="text-xs text-slate-400">{office.country}</p>
                  </div>
                </div>
                <div className="space-y-2.5 border-t border-slate-100 pt-4 text-sm">
                  <p className="flex items-start gap-2 text-slate-500">
                    <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" />
                    <span>{office.address}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone className="h-4 w-4 flex-shrink-0 text-slate-400" />
                    <a
                      href={office.phone.includes("@") ? `mailto:${office.phone}` : `tel:${office.phone.replace(/\s/g, "")}`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {office.phone}
                    </a>
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Closing CTA row */}
          <div className="mt-12 flex flex-col items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm sm:flex-row sm:p-8">
            <p className="text-center text-slate-600 sm:text-left">
              Ready to discuss your project? Our team usually replies within a day.
            </p>
            <a
              href="mailto:hr@oceanbluecorp.com"
              className="group inline-flex flex-shrink-0 items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Email the team
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
