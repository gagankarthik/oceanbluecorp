"use client";

import { useState } from "react";
import { Metadata } from "next";
import Link from "next/link";
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
} from "lucide-react";

const contactInfo = [
  {
    icon: Phone,
    title: "Call Us",
    description: "Speak with our hiring team",
    value: "+1-614-844-6925",
    href: "tel:+16148446925",
  },
  {
    icon: Mail,
    title: "Email Us",
    description: "Get a response within 24 hours",
    value: "hr@oceanbluecorp.com",
    href: "mailto:hr@oceanbluecorp.com",
  },
  {
    icon: MapPin,
    title: "Visit Us",
    description: "Our headquarters location",
    value: "9775 Fairway Drive, Suite # C, Powell, OH - 43065",
    href: "#locations",
  },
  {
    icon: Clock,
    title: "Business Hours",
    description: "Monday - Friday",
    value: "9:00 AM - 5:00 PM EST",
    href: null,
  },
];

const offices = [
  {
    city: "Ohio",
    country: "United States",
    address: "9775 Fairway Drive, Suite #C, Powell, OH - 43065",
    phone: "+1 (614) 844-6925",
  },
  {
    city: "Hyderabad",
    country: "India",
    address: "13th Floor, Building Number 9, Raheja Mindspace, Madhapur, Hyderabad - 560081",
    phone: "+91 814 312 4665",
  },
  {
    city: "Vizianagaram",
    country: "India",
    address: "Plot No: 87, CMR Green Field Layout, Vizianagaram, Andhra Pradesh - 535004",
    phone: "+91 814 294 9111",
  },
  {
    city: "London",
    country: "United Kingdom",
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setSubmitted(true);
    setLoading(false);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <>
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 gradient-hero overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        </div>

        <div className="container-custom relative z-10">
          <div className="max-w-3xl">
            <p className="text-cyan-300 font-semibold mb-4">Contact Us</p>
            <h1 className="heading-xl text-white mb-6">
              Let&apos;s Start a Conversation
            </h1>
            <p className="text-xl text-white/80 leading-relaxed">
              Whether you have a question about our services, need a custom solution,
              or want to discuss a potential partnership, our team is ready to help.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="py-12 bg-white border-b border-border">
        <div className="container-custom">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {contactInfo.map((info) => (
              <div
                key={info.title}
                className="bg-card rounded-xl border border-border p-6 card-hover"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <info.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-1">{info.title}</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  {info.description}
                </p>
                {info.href ? (
                  <a
                    href={info.href}
                    className="text-primary font-medium hover:underline"
                  >
                    {info.value}
                  </a>
                ) : (
                  <p className="font-medium">{info.value}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="section-padding bg-muted">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-16">
            {/* Form */}
            <div className="bg-card rounded-2xl border border-border p-8 md:p-12">
              {submitted ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 rounded-full gradient-ocean flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="heading-md mb-4">Thank You!</h3>
                  <p className="text-muted-foreground mb-8">
                    Your message has been received. A member of our team will
                    contact you within 24 hours.
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="btn-secondary"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <>
                  <div className="mb-8">
                    <h2 className="heading-md mb-2">Send Us a Message</h2>
                    <p className="text-muted-foreground">
                      Fill out the form below and we&apos;ll get back to you as soon as
                      possible.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label
                          htmlFor="firstName"
                          className="block text-sm font-medium mb-2"
                        >
                          First Name *
                        </label>
                        <input
                          type="text"
                          id="firstName"
                          name="firstName"
                          required
                          value={formData.firstName}
                          onChange={handleChange}
                          className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                          placeholder="John"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="lastName"
                          className="block text-sm font-medium mb-2"
                        >
                          Last Name *
                        </label>
                        <input
                          type="text"
                          id="lastName"
                          name="lastName"
                          required
                          value={formData.lastName}
                          onChange={handleChange}
                          className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                          placeholder="Doe"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label
                          htmlFor="email"
                          className="block text-sm font-medium mb-2"
                        >
                          Work Email *
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          required
                          value={formData.email}
                          onChange={handleChange}
                          className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                          placeholder="john@company.com"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="phone"
                          className="block text-sm font-medium mb-2"
                        >
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                          placeholder="+1 (555) 000-0000"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label
                          htmlFor="company"
                          className="block text-sm font-medium mb-2"
                        >
                          Company *
                        </label>
                        <input
                          type="text"
                          id="company"
                          name="company"
                          required
                          value={formData.company}
                          onChange={handleChange}
                          className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                          placeholder="Company Name"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="jobTitle"
                          className="block text-sm font-medium mb-2"
                        >
                          Job Title
                        </label>
                        <input
                          type="text"
                          id="jobTitle"
                          name="jobTitle"
                          value={formData.jobTitle}
                          onChange={handleChange}
                          className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                          placeholder="Your Role"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="inquiryType"
                        className="block text-sm font-medium mb-2"
                      >
                        Inquiry Type *
                      </label>
                      <select
                        id="inquiryType"
                        name="inquiryType"
                        required
                        value={formData.inquiryType}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      >
                        <option value="">Select an option</option>
                        {inquiryTypes.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="message"
                        className="block text-sm font-medium mb-2"
                      >
                        Message *
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        required
                        rows={5}
                        value={formData.message}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
                        placeholder="Tell us about your project or inquiry..."
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="btn-primary w-full inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          Send Message
                          <Send className="w-5 h-5" />
                        </>
                      )}
                    </button>

                    <p className="text-sm text-muted-foreground text-center">
                      By submitting this form, you agree to our{" "}
                      <Link href="/privacy" className="text-primary hover:underline">
                        Privacy Policy
                      </Link>
                      .
                    </p>
                  </form>
                </>
              )}
            </div>

            {/* Side Content */}
            <div className="space-y-8">
              <div>
                <h2 className="heading-md mb-4">Why Partner With Us?</h2>
                <p className="text-muted-foreground mb-6">
                  Join 500+ enterprises that trust Ocean Blue Corporation for their
                  digital transformation journey.
                </p>

                <div className="space-y-4">
                  {[
                    {
                      icon: Headphones,
                      title: "24/7 Dedicated Support",
                      description: "Round-the-clock assistance from certified experts",
                    },
                    {
                      icon: Globe,
                      title: "Global Delivery",
                      description: "Offices in 25+ locations for local support",
                    },
                    {
                      icon: Building2,
                      title: "Enterprise Experience",
                      description: "500+ successful enterprise implementations",
                    },
                    {
                      icon: MessageSquare,
                      title: "Quick Response",
                      description: "Response within 24 hours guaranteed",
                    },
                  ].map((item) => (
                    <div
                      key={item.title}
                      className="flex items-start gap-4 bg-card rounded-xl border border-border p-4"
                    >
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <item.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold mb-1">{item.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Office Locations */}
      <section className="section-padding bg-background" id="locations">
        <div className="container-custom">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <p className="text-primary font-semibold mb-4">Our Offices</p>
            <h2 className="heading-lg mb-6">Global Presence, Local Expertise</h2>
            <p className="text-body">
              With offices around the world, we&apos;re always close to our clients.
              Visit us or schedule a meeting at any of our locations.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {offices.map((office) => (
              <div
                key={office.city}
                className="bg-card rounded-2xl border border-border p-6 card-hover"
              >
                <h3 className="text-xl font-semibold mb-1">{office.city}</h3>
                <p className="text-muted-foreground mb-4">{office.country}</p>
                <div className="space-y-2 text-sm">
                  <p className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{office.address}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <a
                      href={`tel:${office.phone.replace(/\s/g, "")}`}
                      className="text-primary hover:underline"
                    >
                      {office.phone}
                    </a>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
