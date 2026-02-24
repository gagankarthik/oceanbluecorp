"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Twitter,
  Youtube,
  ArrowRight,
  Send,
  Sparkles,
  ChevronRight,
  Github,
  Instagram,
  X,
} from "lucide-react";
import { useState } from "react";

const footerLinks = {
  services: [
    { name: "ERP Solutions", href: "/services#erp" },
    { name: "Cloud Services", href: "/services#cloud" },
    { name: "AI & Analytics", href: "/services#ai" },
    { name: "Salesforce", href: "/services#salesforce" },
    { name: "Staffing", href: "/services#staffing" },
    { name: "Training", href: "/services#training" },
  ],
  company: [
    { name: "About", href: "/about" },
    { name: "Careers", href: "/careers" },
    { name: "Blog", href: "/resources/blog" },
    { name: "Case Studies", href: "/resources/case-studies" },
    { name: "Contact", href: "/contact" },
  ],
  resources: [
    { name: "E-Books", href: "/resources/ebook" },
    { name: "Whitepapers", href: "/resources" },
    { name: "Webinars", href: "/resources" },
    { name: "Documentation", href: "/resources" },
  ],
  legal: [
    { name: "Privacy", href: "/privacy" },
    { name: "Terms", href: "/terms" },
    { name: "Cookies", href: "/cookies" },
  ],
};

const socialLinks = [
  { name: "LinkedIn", href: "https://www.linkedin.com/company/ocean-blue-solutions-inc/", icon: Linkedin, color: "hover:bg-blue-600" },
  { name: "X", href: "https://x.com/OceanBlueSol", icon: X, color: "hover:bg-sky-500" },
  { name: "YouTube", href: "https://www.youtube.com/@OceanBlueSolutions", icon: Youtube, color: "hover:bg-red-600" },
  { name: "Instagram", href: "https://www.instagram.com/oceanbluesolutions", icon: Instagram, color: "hover:bg-gradient-to-br hover:from-purple-600 hover:to-pink-500" },
];

export default function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [focused, setFocused] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail("");
      setTimeout(() => setSubscribed(false), 3000);
    }
  };

  return (
    <footer className="bg-white border-t border-gray-100 relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0,0,0,0.015) 1px, transparent 0)`,
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      {/* Newsletter Section */}
      <div className="relative border-b border-gray-100 bg-gradient-to-b from-gray-50/50 to-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 lg:py-20">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-4 md:mb-6"
            >
              <span className="inline-flex items-center gap-2 text-xs sm:text-sm text-gray-400">
                <Sparkles className="w-3.5 h-3.5 md:w-4 md:h-4" />
                Stay in the loop
              </span>
            </motion.div>

            <motion.h3
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-2xl sm:text-3xl md:text-4xl font-light text-gray-900 mb-3 md:mb-4 font-[family-name:var(--font-space-grotesk)]"
            >
              Get insights that
              <br className="sm:hidden" />{" "}
              <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent font-medium">
                actually matter
              </span>
            </motion.h3>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-gray-500 mb-6 md:mb-8 max-w-lg mx-auto text-sm md:text-base"
            >
              No spam. Just thoughtful articles, case studies, and updates.
            </motion.p>

            {subscribed ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-3 px-5 md:px-6 py-2.5 md:py-3 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200"
              >
                <Send className="w-4 h-4" />
                <span className="text-sm font-medium">Thanks for subscribing!</span>
              </motion.div>
            ) : (
              <motion.form
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                onSubmit={handleSubscribe}
                className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto"
              >
                <div className="relative flex-1">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    placeholder="Enter your email"
                    required
                    className="w-full px-4 md:px-5 py-2.5 md:py-3 bg-white border border-gray-200 rounded-full text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all text-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="px-5 md:px-6 py-2.5 md:py-3 bg-gray-900 text-white rounded-full hover:bg-gray-800 transition-all text-sm font-medium flex items-center justify-center gap-2 group shadow-sm hover:shadow-md"
                >
                  Subscribe
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </motion.form>
            )}
          </div>
        </div>
      </div>

      {/* Main Footer Grid */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 lg:py-20">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 lg:gap-10">
          {/* Company Info */}
          <div className="col-span-2 md:col-span-3 lg:col-span-2">
            <Link href="/" className="inline-block mb-5 md:mb-6">
              <Image
                src="https://oceanbluecorp.com/images/logo.png"
                alt="Ocean Blue Corporation"
                width={180}
                height={40}
                className="h-7 md:h-8 w-auto"
              />
            </Link>
            {/*<p className="text-gray-500 mb-5 md:mb-6 leading-relaxed text-sm max-w-sm">
              Making enterprise tech less painful.
            </p>*/}
            <div className="space-y-2.5 md:space-y-3">
              <a
                href="mailto:hr@oceanbluecorp.com"
                className="flex items-center gap-2.5 md:gap-3 text-gray-500 hover:text-gray-900 transition-colors text-sm group"
              >
                <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                  <Mail className="w-3.5 h-3.5 md:w-4 md:h-4" />
                </div>
                <span>hr@oceanbluecorp.com</span>
              </a>
              <a
                href="tel:+16148446925"
                className="flex items-center gap-2.5 md:gap-3 text-gray-500 hover:text-gray-900 transition-colors text-sm group"
              >
                <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                  <Phone className="w-3.5 h-3.5 md:w-4 md:h-4" />
                </div>
                <span>+1 614-844-6925</span>
              </a>
              <div className="flex items-start gap-2.5 md:gap-3 text-gray-500 text-sm">
                <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 md:w-4 md:h-4" />
                </div>
                <span className="leading-relaxed">
                  9775 Fairway Drive, Suite #C<br />
                  Powell, OH 43065
                </span>
              </div>
            </div>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4">
              Services
            </h3>
            <ul className="space-y-2 md:space-y-2.5">
              {footerLinks.services.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-gray-600 hover:text-gray-900 transition-colors text-sm flex items-center gap-1 group"
                  >
                    <ChevronRight className="w-3 h-3 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4">
              Company
            </h3>
            <ul className="space-y-2 md:space-y-2.5">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-gray-600 hover:text-gray-900 transition-colors text-sm flex items-center gap-1 group"
                  >
                    <ChevronRight className="w-3 h-3 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4">
              Resources
            </h3>
            <ul className="space-y-2 md:space-y-2.5">
              {footerLinks.resources.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-gray-600 hover:text-gray-900 transition-colors text-sm flex items-center gap-1 group"
                  >
                    <ChevronRight className="w-3 h-3 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal & Social */}
          <div>
            <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4">
              Legal
            </h3>
            <ul className="space-y-2 md:space-y-2.5 mb-6">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-gray-600 hover:text-gray-900 transition-colors text-sm flex items-center gap-1 group"
                  >
                    <ChevronRight className="w-3 h-3 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Social Links */}
            <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4">
              Follow
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center transition-all group ${social.color} hover:text-white`}
                  aria-label={social.name}
                >
                  <social.icon className="w-3.5 h-3.5 text-gray-600 group-hover:text-white transition-colors" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-100 bg-gray-50/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-5 md:py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-400 text-xs">
              &copy; {new Date().getFullYear()} Ocean Blue Corporation. All rights reserved.
            </p>
            <div className="flex items-center gap-2 md:gap-3 text-gray-300 text-xs">
              <span className="text-gray-400">Innovation</span>
              <span className="w-1 h-1 rounded-full bg-gray-300" />
              <span className="text-gray-400">Dedication</span>
              <span className="w-1 h-1 rounded-full bg-gray-300" />
              <span className="text-gray-400">Excellence</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
