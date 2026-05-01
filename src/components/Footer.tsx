"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Youtube,
  ChevronRight,
  Instagram,
  X,
  Heart,
} from "lucide-react";
import { TextHoverEffect } from "./ui/text-hover-effect";

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
    { name: "Open Positions", href: "/careers/search" },
    { name: "Contact", href: "/contact" },
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

type OverallStatus = "operational" | "degraded" | "outage" | "maintenance" | "unknown";

const STATUS_STYLE: Record<OverallStatus, { dot: string; text: string; label: string }> = {
  operational: { dot: "bg-emerald-500", text: "text-emerald-700", label: "All Systems Operational" },
  maintenance:  { dot: "bg-blue-500",    text: "text-blue-700",    label: "Scheduled Maintenance" },
  degraded:     { dot: "bg-amber-500",   text: "text-amber-700",   label: "Partial Degradation" },
  outage:       { dot: "bg-rose-500",    text: "text-rose-700",    label: "Service Disruption" },
  unknown:      { dot: "bg-gray-400",    text: "text-gray-500",    label: "Status Unknown" },
};

function FooterStatus() {
  const [status, setStatus] = useState<OverallStatus>("unknown");

  useEffect(() => {
    fetch("/api/status")
      .then((r) => r.json())
      .then((d) => { if (d?.overall) setStatus(d.overall as OverallStatus); })
      .catch(() => {});
  }, []);

  const cfg = STATUS_STYLE[status];

  return (
    <Link
      href="/status"
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm transition-all group"
    >
      <span className="relative flex h-2 w-2">
        {(status === "operational") && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${cfg.dot} opacity-50`} />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${cfg.dot}`} />
      </span>
      <span className={`text-xs font-medium ${cfg.text}`}>{cfg.label}</span>
    </Link>
  );
}

export default function Footer() {

  return (
    <footer className="bg-gradient-to-b from-white to-gray-50 border-t border-gray-100">
      {/* Main Footer Container - Centered with max-width */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16 lg:py-20">
       
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
      
      {/* Ocean Blue Text Effect */}
     <div className="flex items-center justify-center">
      <TextHoverEffect text="OCEANBLUE" />
    </div>
    
      {/* Bottom Bar */}
      <div className="border-t border-gray-200 bg-gray-50/80">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-gray-400 text-xs">
              &copy; {new Date().getFullYear()} Ocean Blue Corporation. All rights reserved.
            </p>
            <FooterStatus />
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