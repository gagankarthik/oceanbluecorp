"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import HeroCarousel from "@/components/HeroCarousel";
import ConsultingShowcase from "@/components/ConsultingShowcase";
import {
  ArrowRight,
  Cloud,
  Database,
  Users,
  GraduationCap,
  Cpu,
  BarChart3,
  Globe,
  Award,
  Building2,
  Star,
  Settings,
  Headphones,
  Play,
  ChevronRight,
  Quote,
  Compass,
} from "lucide-react";

// ============================================================================
// DATA
// ============================================================================

const services = [
  {
    icon: BarChart3,
    title: "ERP Solutions",
    description: "SAP, Oracle, and Microsoft ERP implementation, integration, and support.",
    href: "/services#erp",
    gradient: "from-blue-600 to-indigo-600",
    bgLight: "bg-blue-50",
    accentPosition: "top-left",
  },
  {
    icon: Cloud,
    title: "Cloud Services",
    description: "Migration, modernization, DevOps, and cloud optimization.",
    href: "/services#cloud",
    gradient: "from-cyan-600 to-blue-600",
    bgLight: "bg-cyan-50",
    accentPosition: "top-right",
  },
  {
    icon: Cpu,
    title: "AI & Analytics",
    description: "Practical AI, automation, and data intelligence that drive efficiency.",
    href: "/services#ai",
    gradient: "from-violet-600 to-purple-600",
    bgLight: "bg-violet-50",
    accentPosition: "bottom-left",
  },
  {
    icon: Database,
    title: "Salesforce",
    description: "CRM optimization, custom development, and managed admin support.",
    href: "/services#salesforce",
    gradient: "from-sky-600 to-blue-600",
    bgLight: "bg-sky-50",
    accentPosition: "bottom-right",
  },
  {
    icon: Users,
    title: "IT Staffing",
    description: "Specialized talent across cloud, cybersecurity, ERP, Salesforce, data, and more.",
    href: "/services#staffing",
    gradient: "from-teal-600 to-cyan-600",
    bgLight: "bg-teal-50",
    accentPosition: "top-left",
  },
  {
    icon: GraduationCap,
    title: "Training",
    description: "Role‑based training that accelerates adoption and capability.",
    href: "/services#training",
    gradient: "from-amber-500 to-orange-500",
    bgLight: "bg-amber-50",
    accentPosition: "top-right",
  },
  {
    icon: Settings,
    title: "Managed Services",
    description: "Proactive monitoring, support, and performance management.",
    href: "/services#managed",
    gradient: "from-rose-600 to-pink-600",
    bgLight: "bg-rose-50",
    accentPosition: "bottom-left",
  },
  {
    icon: Headphones,
    title: "Outsourcing",
    description: "Global talent, local feel. Smart outsourcing.",
    href: "/services#outsourcing",
    gradient: "from-indigo-600 to-blue-600",
    bgLight: "bg-indigo-50",
    accentPosition: "bottom-right",
  },
];

const stats = [
  { value: "10+", label: "Years of Industry", icon: Building2, color: "from-blue-600 to-cyan-600" },
  { value: "8+", label: "Software & ERP Solutions experience", icon: Award, color: "from-amber-500 to-orange-500" },
  { value: "10+", label: "Data Warehousing", icon: Globe, color: "from-emerald-500 to-teal-500" },
  { value: "5+", label: "Client Engagnment", icon: Star, color: "from-purple-500 to-pink-500" },
];

const industries = [
  { name: "Manufacturing", logo: "/industry-alt.svg", gradient: "from-blue-600 to-indigo-600", bg: "bg-blue-50" },
  { name: "Retail", logo: "/icon-retail-commerce.svg", gradient: "from-cyan-500 to-blue-500",  bg: "bg-cyan-50" },
  { name: "Government", logo: "/icon-public-sector.svg", gradient: "from-indigo-500 to-purple-500",  bg: "bg-indigo-50" },
  { name: "Healthcare", logo: "/icon-healthcare.svg", gradient: "from-teal-500 to-cyan-500",  bg: "bg-teal-50" },
  { name: "Financial", logo: "/icon-banking.svg", gradient: "from-amber-500 to-orange-500",  bg: "bg-amber-50" },
  { name: "Technology", logo: "/chip-brain.svg", gradient: "from-violet-500 to-purple-500", bg: "bg-violet-50" },
];

const sponsors = [
  { name: "Databricks", logo: "/databricks.svg" },
  { name: "Snowflake", logo: "/snowflake.svg" },
  { name: "AWS", logo: "/aws.svg" },
  { name: "Blueiq", logo: "/logo_medium.webp" },
];

const testimonials = [
  {
    quote: "They made SAP implementation feel like a conversation, not a root canal. Highly recommend.",
    author: "Sarah Chen",
    role: "CTO, TechForward Inc.",
    gradient: "from-indigo-600 to-purple-600",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
  },
  {
    quote: "Finally, a tech partner who speaks both engineer and executive. Pure gold.",
    author: "Michael Rodriguez",
    role: "VP Operations, Global Retail",
    gradient: "from-blue-600 to-cyan-600",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
  },
  {
    quote: "The ROI was great. The relationship was better. That's rare in this industry.",
    author: "Jennifer Walsh",
    role: "Operations Director, FinServe",
    gradient: "from-amber-500 to-orange-500",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
  },
];

const partners = [
  { name: "Ohio", logo: "https://development.ohio.gov/wps/wcm/connect/gov/7efff5ea-f9fd-4c0f-9a71-401183103f50/development-logo.png?MOD=AJPERES" },
  { name: "HGS", logo: "/hgs.svg" },
  { name: "Dieboldnixdorf", logo: "https://www.dieboldnixdorf.com/-/media/diebold/images/global/logo/dn-color-logo.svg" },
  { name: "Satyawholesale", logo: "https://www.satyawholesalers.com/_next/image?url=https%3A%2F%2Fsatyawholesalers.net%2Fstorage%2F3288%2Fsatya-wholesale-logo-(1).png&w=1920&q=75" },
  { name: "CityBareque", logo: "/citybarbeque.svg" },
  { name: "Tacos", logo: "/tacos.png" },
];

// ============================================================================
// COMPONENTS
// ============================================================================

const FloatingOrb = ({ className = "", delay = 0 }: { className?: string; delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 0.15, scale: 1 }}
    transition={{ duration: 1.5, delay }}
    className={`absolute rounded-full blur-3xl pointer-events-none ${className}`}
  />
);

const SectionHeader = ({
  eyebrow,
  title,
  highlight,
  description,
  centered = true,
  highlightGradient = "from-blue-600 to-cyan-600",
}: {
  eyebrow: string;
  title: string;
  highlight: string;
  description?: string;
  centered?: boolean;
  highlightGradient?: string;
}) => (
  <div className={`max-w-3xl ${centered ? "mx-auto text-center" : ""} mb-16 md:mb-20`}>
    <motion.span
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="text-xs sm:text-sm font-medium text-gray-400 uppercase tracking-[0.2em] mb-4 block"
    >
      {eyebrow}
    </motion.span>

    <motion.h2
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.1 }}
      className="heading-section text-gray-900 mb-6"
    >
      {title}{" "}
      <span className="relative inline-block">
        <span className={`relative z-10 bg-gradient-to-r ${highlightGradient} bg-clip-text text-transparent font-medium`}>
          {highlight}
        </span>
        <motion.span
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className={`absolute -bottom-1 left-0 right-0 h-3 bg-gradient-to-r ${highlightGradient.replace('600', '200').replace('500', '200')} opacity-40 -z-0 rounded-full`}
          style={{ originX: 0 }}
        />
      </span>
    </motion.h2>

    {description && (
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.2 }}
        className="text-gray-500 text-lg leading-relaxed"
      >
        {description}
      </motion.p>
    )}
  </div>
);

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const ctaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="bg-white relative overflow-hidden">
      {/* Hero */}
      <HeroCarousel />

      {/* Partners Marquee */}
      <section className="relative py-12 md:py-16 overflow-hidden border-y border-gray-100 bg-white">
        {/* Fade edges */}
        <div className="absolute inset-y-0 left-0 w-24 md:w-40 bg-gradient-to-r from-white via-white to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-24 md:w-40 bg-gradient-to-l from-white via-white to-transparent z-10 pointer-events-none" />

        <div className="flex items-center overflow-hidden">
          <motion.div
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
            className="flex items-center gap-12 md:gap-20 whitespace-nowrap"
          >
            {[...partners, ...partners, ...partners, ...partners].map((partner, index) => (
              <div
                key={index}
                className="flex-shrink-0 flex items-center justify-center h-8 md:h-10 w-24 md:w-32"
              >
                <Image
                  src={partner.logo}
                  alt={partner.name}
                  width={120}
                  height={40}
                  className="h-6 md:h-8 w-auto object-contain opacity-30 hover:opacity-60 transition-all duration-300 grayscale hover:grayscale-0"
                  unoptimized
                />
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Consulting Showcase */}
      <ConsultingShowcase />

      {/* Services Section */}
      <section className="py-20 md:py-24 lg:py-32 bg-white relative overflow-hidden" id="services">
        {/* Background decorations */}
        <FloatingOrb className="top-20 -left-20 w-[500px] h-[500px] bg-blue-200" delay={0.1} />
        <FloatingOrb className="bottom-20 -right-20 w-[400px] h-[400px] bg-cyan-200" delay={0.2} />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Decorative corners */}
          <div className="relative mb-16 md:mb-20">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="absolute -top-8 left-0 w-24 h-24 md:w-32 md:h-32 border-l-2 border-t-2 border-gray-200 rounded-tl-3xl hidden sm:block"
            />
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="absolute -bottom-8 right-0 w-24 h-24 md:w-32 md:h-32 border-r-2 border-b-2 border-gray-200 rounded-br-3xl hidden sm:block"
            />
            <SectionHeader
              eyebrow="What we do"
              title="Solutions that Deliver"
              highlight="Real Business Impact"
              highlightGradient="from-blue-600 to-cyan-600"
            />
          </div>

          {/* Services Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {services.map((service, index) => {
              const Icon = service.icon;
              const accentClasses = {
                "top-left": "top-0 left-0 rounded-tl-3xl",
                "top-right": "top-0 right-0 rounded-tr-3xl",
                "bottom-left": "bottom-0 left-0 rounded-bl-3xl",
                "bottom-right": "bottom-0 right-0 rounded-br-3xl",
              };

              return (
                <motion.div
                  key={service.title}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.08 }}
                  className="group"
                >
                  <Link href={service.href}>
                    <div className="relative h-full bg-white rounded-3xl p-6 md:p-8 border border-gray-100 hover:border-gray-200 transition-all duration-300 card-lift overflow-hidden">
                      {/* Corner accent */}
                      <div
                        className={`absolute ${accentClasses[service.accentPosition as keyof typeof accentClasses]} w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br ${service.gradient} opacity-[0.06] group-hover:opacity-[0.1] transition-opacity`}
                      />

                      {/* Icon */}
                      <div className="relative mb-5 md:mb-6">
                        <div
                          className={`absolute -inset-2 bg-gradient-to-br ${service.gradient} opacity-10 rounded-2xl blur-xl group-hover:opacity-20 transition-opacity`}
                        />
                        <div
                          className={`relative w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br ${service.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}
                        >
                          <Icon className="w-6 h-6 md:w-7 md:h-7 text-white" />
                        </div>
                      </div>

                      {/* Content */}
                      <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2 md:mb-3 group-hover:text-blue-600 transition-colors">
                        {service.title}
                      </h3>
                      <p className="text-gray-500 text-sm md:text-base leading-relaxed mb-4 md:mb-6">
                        {service.description}
                      </p>

                      {/* Link */}
                      <div className="flex items-center gap-2 text-blue-600 font-medium text-sm">
                        <span>Learn more</span>
                        <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>

                      {/* Hover gradient overlay */}
                      <div
                        className={`absolute inset-0 bg-gradient-to-br ${service.gradient} opacity-0 group-hover:opacity-[0.02] transition-opacity duration-500 pointer-events-none rounded-3xl`}
                      />
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats & Philosophy Section */}
      <section className="relative py-20 md:py-24 lg:py-32 overflow-hidden">
        {/* Diagonal background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gray-50 transform -skew-y-2 origin-top-left scale-110" />
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Stats Section */}
          <div className="text-center mb-12 md:mb-16">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-xs sm:text-sm font-medium text-gray-400 uppercase tracking-[0.2em] mb-4 block"
            >
              By the numbers
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-2xl md:text-3xl lg:text-4xl font-light text-gray-900 font-[family-name:var(--font-space-grotesk)]"
            >
              Our Track Record of{" "}
              <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent font-medium">
                Excellence
              </span>
            </motion.h2>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-16 md:mb-20">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 + index * 0.08 }}
                  className="group"
                >
                  <div className="relative bg-white rounded-2xl p-6 md:p-8 border border-gray-100 hover:border-gray-200 hover:shadow-xl transition-all duration-300 text-center h-full">
                    {/* Gradient accent */}
                    <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-gradient-to-r ${stat.color} rounded-b-full`} />

                    {/* Icon */}
                    <div className={`w-12 h-12 md:w-14 md:h-14 mx-auto mb-4 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-6 h-6 md:w-7 md:h-7 text-white" />
                    </div>

                    {/* Value */}
                    <div className="text-3xl md:text-4xl lg:text-5xl font-light text-gray-900 mb-2 font-[family-name:var(--font-space-grotesk)]">
                      {stat.value}
                    </div>

                    {/* Label */}
                    <div className="text-sm md:text-base text-gray-500 leading-tight">
                      {stat.label}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Partners Section */}
          <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl p-8 md:p-12 lg:p-16 overflow-hidden">
            {/* Background decorations */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl" />
            </div>

            <div className="relative z-10">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center mb-10 md:mb-12"
              >
                <span className="text-xs sm:text-sm font-medium text-gray-400 uppercase tracking-[0.2em] mb-3 block">
                  Trusted by Industry Leaders
                </span>
                <h3 className="text-2xl md:text-3xl font-light text-white font-[family-name:var(--font-space-grotesk)]">
                  Our{" "}
                  <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent font-medium">
                    Partners
                  </span>
                </h3>
              </motion.div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 max-w-3xl mx-auto">
                {sponsors.map((sponsor, index) => (
                  <motion.div
                    key={sponsor.name}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 + index * 0.08 }}
                    className="group"
                  >
                    <div className="bg-white backdrop-blur-sm rounded-2xl p-5 md:p-6 border border-white/10 hover:border-white/25 hover:bg-white/15 transition-all duration-300 flex items-center justify-center h-24 md:h-28">
                      <Image
                        src={sponsor.logo}
                        alt={sponsor.name}
                        width={120}
                        height={50}
                        className="h-10 md:h-12 w-auto object-contain opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300"
                        unoptimized
                      />
                    </div>
                    <p className="text-sm text-gray-400 text-center mt-2 font-medium">{sponsor.name}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Industries Section */}
      <section className="py-20 md:py-24 lg:py-32 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Where we work"
            title="Industries we've"
            highlight="transformed"
            highlightGradient="from-blue-600 to-cyan-600"
          />

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
            {industries.map((industry, index) => (
              <motion.div
                key={industry.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="group cursor-pointer"
              >
                <div className="relative bg-gray-50 rounded-2xl p-5 md:p-6 text-center hover:bg-white transition-all duration-300 card-lift border border-transparent hover:border-gray-100">
                  {/* Hover gradient */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${industry.gradient} opacity-0 group-hover:opacity-[0.04] rounded-2xl transition-opacity duration-300`}
                  />

                  <div
                    className={`w-14 h-14 md:w-16 md:h-16 mx-auto mb-3 rounded-xl ${industry.bg} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
                  >
                    <Image
                      src={industry.logo}
                      alt={industry.name}
                      width={32}
                      height={32}
                      className="w-7 h-7 md:w-8 md:h-8 object-contain"
                    />
                  </div>

                  <h3 className="font-medium text-gray-900 mb-1 text-sm md:text-base">
                    {industry.name}
                  </h3>


                  {/* Chevron on hover */}
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 md:py-24 lg:py-32 bg-gray-50 overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Client love"
            title="People seem to"
            highlight="like us"
            highlightGradient="from-indigo-600 to-purple-600"
          />

          <div className="grid md:grid-cols-3 gap-5 md:gap-6 perspective">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30, rotateX: 10 }}
                whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group preserve-3d"
              >
                <div className="relative bg-white rounded-2xl p-6 md:p-8 shadow-sm hover:shadow-xl transition-all duration-400 border border-gray-100 tilt-card">
                  {/* Background quote mark */}
                  <div className="absolute top-4 right-4 md:top-6 md:right-6">
                    <Quote className="w-10 h-10 md:w-12 md:h-12 text-gray-100" />
                  </div>

                  {/* Content */}
                  <div className="relative z-10">
                    <p className="text-gray-700 text-sm md:text-base mb-6 leading-relaxed">
                      "{testimonial.quote}"
                    </p>

                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden">
                        <Image
                          src={testimonial.image}
                          alt={testimonial.author}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm md:text-base">
                          {testimonial.author}
                        </p>
                        <p className="text-xs md:text-sm text-gray-400">{testimonial.role}</p>
                      </div>
                    </div>

                    {/* Gradient accent corner */}
                    <div
                      className={`absolute bottom-0 right-0 w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br ${testimonial.gradient} opacity-[0.04] rounded-bl-[100px] pointer-events-none`}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section ref={ctaRef} className="relative py-24 md:py-32 lg:py-40 overflow-hidden">
        {/* Layered dark background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" />

          {/* Animated orbs */}
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              x: [0, 20, 0],
              y: [0, -20, 0],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-20 -right-20 w-60 h-60 md:w-80 md:h-80 bg-blue-500/15 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1.2, 1, 1.2],
              x: [0, -20, 0],
              y: [0, 20, 0],
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute -bottom-20 -left-20 w-60 h-60 md:w-80 md:h-80 bg-cyan-500/15 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1, 1.3, 1],
              rotate: [0, 10, 0],
            }}
            transition={{ duration: 30, repeat: Infinity, ease: "easeInOut", delay: 5 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"
          />

          {/* Subtle grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
              backgroundSize: "60px 60px",
            }}
          />
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center"
          >
            {/* Animated compass icon */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              whileInView={{ scale: 1, rotate: 0 }}
              viewport={{ once: true }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-8 md:mb-10 rounded-2xl md:rounded-3xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-2xl"
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <Image src="/goals.svg" alt="Goals" height={40} width={20} className="w-8 h-8 md:w-10 md:h-10 text-white" />
              </motion.div>
            </motion.div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light text-white mb-5 md:mb-6 font-[family-name:var(--font-space-grotesk)] leading-tight">
              Ready to Strengthen
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-cyan-300 bg-clip-text text-transparent font-medium">
                Your Technology and Your Team?
              </span>
            </h2>

            <p className="text-base md:text-lg text-white/50 mb-10 md:mb-12 max-w-2xl mx-auto leading-relaxed">
              Let’s talk about your goals — no jargon, no pressure.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="group relative px-7 md:px-8 py-3.5 md:py-4 bg-white text-gray-900 rounded-full hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl overflow-hidden"
              >
                <span className="relative z-10 flex items-center justify-center gap-2 font-medium text-sm md:text-base">
                  Start the conversation
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>

              <Link
                href="/services"
                className="group px-7 md:px-8 py-3.5 md:py-4 bg-white/10 backdrop-blur-sm text-white rounded-full hover:bg-white/20 transition-all border border-white/20"
              >
                <span className="flex items-center justify-center gap-2 text-sm md:text-base">
                  <Play className="w-4 h-4" />
                  See how we work
                </span>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
