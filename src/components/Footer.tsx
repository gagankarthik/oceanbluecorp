"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Youtube,
  ArrowRight,
  ChevronRight,
  Instagram,
  X,
  Heart,
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
    { name: "About Us", href: "/about" },
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
    { name: "FAQ", href: "/faq" },
  ],
  legal: [
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms of Service", href: "/terms" },
    { name: "Cookie Policy", href: "/cookies" },
  ],
};

const socialLinks = [
  { name: "LinkedIn", href: "https://www.linkedin.com/company/ocean-blue-solutions-inc/", icon: Linkedin, color: "hover:bg-[#0A66C2]" },
  { name: "X", href: "https://x.com/OceanBlueSol", icon: X, color: "hover:bg-black" },
  { name: "YouTube", href: "https://www.youtube.com/@OceanBlueSolutions", icon: Youtube, color: "hover:bg-[#FF0000]" },
  { name: "Instagram", href: "https://www.instagram.com/oceanbluesolutions", icon: Instagram, color: "hover:bg-gradient-to-br hover:from-[#E4405F] hover:to-[#F56040]" },
];

export default function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail("");
      setTimeout(() => setSubscribed(false), 3000);
    }
  };

  return (
    <footer className="bg-gradient-to-b from-white to-gray-50 border-t border-gray-100">
      {/* Main Footer Container - Centered with max-width */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16 lg:py-20">
        {/* Newsletter Section 
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 pb-8 border-b border-gray-200"
        >
          <div className="max-w-3xl mx-auto text-center">
            <h3 className="text-2xl md:text-3xl font-light text-gray-900 mb-3">
              Stay ahead with insights that
              <span className="block text-blue-600 font-medium mt-1">
                actually matter
              </span>
            </h3>
            <p className="text-gray-500 mb-6 max-w-lg mx-auto text-sm">
              No spam. Just thoughtful articles, case studies, and updates.
            </p>

            {subscribed ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-3 px-6 py-3 bg-green-50 text-green-700 rounded-full border border-green-200"
              >
                <ArrowRight className="w-4 h-4" />
                <span className="text-sm font-medium">Thanks for subscribing!</span>
              </motion.div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="flex-1 px-5 py-3 bg-white border border-gray-200 rounded-full text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all text-sm"
                />
                <button
                  type="submit"
                  className="px-6 py-3 bg-gray-900 text-white rounded-full hover:bg-blue-600 transition-all text-sm font-medium flex items-center justify-center gap-2 group shadow-sm hover:shadow-md"
                >
                  Subscribe
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </form>
            )}
          </div>
        </motion.div>
*/}
        {/* Main Footer Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Company Info */}
          <div className="col-span-2 md:col-span-4 lg:col-span-2">
            <Link href="/" className="inline-block mb-6">
              <Image
                src="/logo.png"
                alt="Ocean Blue Corporation"
                width={180}
                height={40}
                className="h-8 w-auto"
              />
            </Link>
            <p className="text-gray-500 mb-6 leading-relaxed text-sm max-w-sm">
              Making enterprise tech less painful with innovative solutions and dedicated support.
            </p>
            <div className="space-y-3">
              <a
                href="mailto:hr@oceanbluecorp.com"
                className="flex items-center gap-3 text-gray-500 hover:text-gray-900 transition-colors text-sm group"
              >
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                  <Mail className="w-4 h-4" />
                </div>
                <span>hr@oceanbluecorp.com</span>
              </a>
              <a
                href="tel:+16148446925"
                className="flex items-center gap-3 text-gray-500 hover:text-gray-900 transition-colors text-sm group"
              >
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                  <Phone className="w-4 h-4" />
                </div>
                <span>+1 614-844-6925</span>
              </a>
              <div className="flex items-start gap-3 text-gray-500 text-sm">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4" />
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
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-5">
              Services
            </h3>
            <ul className="space-y-2.5">
              {footerLinks.services.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-gray-500 hover:text-blue-600 transition-colors text-sm flex items-center gap-1.5 group"
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
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-5">
              Company
            </h3>
            <ul className="space-y-2.5">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-gray-500 hover:text-blue-600 transition-colors text-sm flex items-center gap-1.5 group"
                  >
                    <ChevronRight className="w-3 h-3 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources 
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-5">
              Resources
            </h3>
            <ul className="space-y-2.5">
              {footerLinks.resources.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-gray-500 hover:text-blue-600 transition-colors text-sm flex items-center gap-1.5 group"
                  >
                    <ChevronRight className="w-3 h-3 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
*/}
          {/* Legal & Social */}
          <div className="col-span-2 md:col-span-4 lg:col-span-1">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-5">
              Legal
            </h3>
            <ul className="space-y-2.5 mb-8">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-gray-500 hover:text-blue-600 transition-colors text-sm flex items-center gap-1.5 group"
                  >
                    <ChevronRight className="w-3 h-3 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Social Links */}
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-5">
              Follow Us
            </h3>
            <div className="flex items-center gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center transition-all hover:scale-110 hover:text-white ${social.color}`}
                  aria-label={social.name}
                >
                  <social.icon className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-200 bg-gray-50/80">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-400 text-xs">
              &copy; {new Date().getFullYear()} Ocean Blue Corporation. All rights reserved.
            </p>
            <div className="flex items-center gap-2 text-gray-400 text-xs">
              <span>Built with</span>
              <Heart className="w-3 h-3 text-red-400 fill-red-400" />
              <span>for enterprise excellence</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}