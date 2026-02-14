"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Menu,
  X,
  ChevronDown,
  Cloud,
  Database,
  Users,
  GraduationCap,
  Cpu,
  BarChart3,
  Settings,
  Headphones,
  BookOpen,
  FileText,
  Briefcase,
} from "lucide-react";

const services = [
  {
    name: "ERP Solutions",
    href: "/services#erp",
    icon: BarChart3,
    description: "SAP & Oracle Implementation",
  },
  {
    name: "Cloud Services",
    href: "/services#cloud",
    icon: Cloud,
    description: "Cloud Migration & Management",
  },
  {
    name: "Data Analytics & AI",
    href: "/services#ai",
    icon: Cpu,
    description: "AI & Machine Learning Solutions",
  },
  {
    name: "Salesforce",
    href: "/services#salesforce",
    icon: Database,
    description: "CRM Implementation",
  },
  {
    name: "Staffing Services",
    href: "/services#staffing",
    icon: Users,
    description: "IT Talent Acquisition",
  },
  {
    name: "Training Services",
    href: "/services#training",
    icon: GraduationCap,
    description: "Corporate Training Programs",
  },
  {
    name: "Managed Services",
    href: "/services#managed",
    icon: Settings,
    description: "IT Management & Support",
  },
  {
    name: "Outsourcing",
    href: "/services#outsourcing",
    icon: Headphones,
    description: "Business Process Outsourcing",
  },
];

const resources = [
  {
    name: "Ebook",
    href: "/resources/ebook",
    icon: BookOpen,
    description: "Free guides & whitepapers",
  },
  {
    name: "Blog",
    href: "/resources/blog",
    icon: FileText,
    description: "Latest insights & articles",
  },
  {
    name: "Case Studies",
    href: "/resources/case-studies",
    icon: Briefcase,
    description: "Success stories & results",
  },
];

const navigation = [
  { name: "Home", href: "/" },
  { name: "About", href: "/about" },
  { name: "Services", href: "/services", hasDropdown: true, dropdownType: "services" },
  { name: "Resources", href: "/resources", hasDropdown: true, dropdownType: "resources" },
  { name: "Careers", href: "/careers" },
  { name: "Contact", href: "/contact" },
];

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const getDropdownItems = (type: string) => {
    return type === "services" ? services : resources;
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white shadow-lg shadow-blue-900/5"
          : "bg-[#1e3a8a]"
      }`}
    >
      <nav className="container-custom" aria-label="Global">
        <div className="flex items-center justify-between h-[72px] lg:h-[80px]">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image
              src="https://oceanbluecorp.com/images/logo-oc.png"
              alt="Ocean Blue Corporation"
              width={160}
              height={45}
              className={`h-10 lg:h-11 w-auto transition-all ${
                scrolled ? "" : "brightness-0 invert"
              }`}
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex lg:items-center lg:gap-1">
            {navigation.map((item) =>
              item.hasDropdown ? (
                <div
                  key={item.name}
                  className="relative"
                  onMouseEnter={() => setActiveDropdown(item.dropdownType || null)}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                  <button
                    className={`flex items-center gap-1 px-4 py-2 rounded-lg font-medium transition-all ${
                      scrolled
                        ? "text-slate-700 hover:text-blue-700 hover:bg-blue-50"
                        : "text-white/90 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    {item.name}
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${
                        activeDropdown === item.dropdownType ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* Dropdown */}
                  <div
                    className={`absolute top-full left-1/2 -translate-x-1/2 pt-2 transition-all duration-200 ${
                      activeDropdown === item.dropdownType
                        ? "opacity-100 visible translate-y-0"
                        : "opacity-0 invisible -translate-y-2"
                    }`}
                  >
                    <div className={`bg-white rounded-xl shadow-xl shadow-blue-900/10 border border-slate-100 p-4 ${
                      item.dropdownType === "services" ? "w-[540px] grid grid-cols-2 gap-1" : "w-[320px] space-y-1"
                    }`}>
                      {getDropdownItems(item.dropdownType || "").map((dropItem) => (
                        <Link
                          key={dropItem.name}
                          href={dropItem.href}
                          className="flex items-start gap-3 p-3 rounded-lg hover:bg-blue-50 transition-colors group"
                        >
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center group-hover:from-blue-600 group-hover:to-blue-700 transition-colors shadow-sm">
                            <dropItem.icon className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-800 group-hover:text-blue-700">
                              {dropItem.name}
                            </p>
                            <p className="text-sm text-slate-500">
                              {dropItem.description}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    scrolled
                      ? "text-slate-700 hover:text-blue-700 hover:bg-blue-50"
                      : "text-white/90 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {item.name}
                </Link>
              )
            )}
          </div>

          {/* CTA Button */}
          <div className="hidden lg:flex lg:items-center lg:gap-4">
            <Link
              href="/contact"
              className={`px-5 py-2.5 rounded-lg font-semibold transition-all duration-300 ${
                scrolled
                  ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-md shadow-blue-500/20"
                  : "bg-white text-blue-800 hover:bg-blue-50"
              }`}
            >
              Get Started
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            className={`lg:hidden p-2 rounded-lg transition-colors ${
              scrolled
                ? "text-slate-700 hover:bg-slate-100"
                : "text-white hover:bg-white/10"
            }`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className="sr-only">Open menu</span>
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile menu */}
        <div
          className={`lg:hidden overflow-hidden transition-all duration-300 ${
            mobileMenuOpen ? "max-h-[900px] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="bg-white rounded-xl shadow-xl mb-4 p-4 space-y-2 border border-slate-100">
            {navigation.map((item) => (
              <div key={item.name}>
                {item.hasDropdown ? (
                  <div className="space-y-2">
                    <p className="px-3 py-2 font-semibold text-slate-800">{item.name}</p>
                    <div className={`${item.dropdownType === "services" ? "grid grid-cols-2" : "flex flex-col"} gap-1 pl-2`}>
                      {getDropdownItems(item.dropdownType || "").map((dropItem) => (
                        <Link
                          key={dropItem.name}
                          href={dropItem.href}
                          className="flex items-center gap-2 p-2 rounded-lg hover:bg-blue-50 text-sm text-slate-600 hover:text-blue-700"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <dropItem.icon className="w-4 h-4 text-blue-600" />
                          <span>{dropItem.name}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : (
                  <Link
                    href={item.href}
                    className="block px-3 py-2 rounded-lg font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                )}
              </div>
            ))}
            <div className="pt-2">
              <Link
                href="/contact"
                className="block w-full text-center px-4 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold hover:from-blue-700 hover:to-blue-800 transition-all"
                onClick={() => setMobileMenuOpen(false)}
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
