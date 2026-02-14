"use client";

import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import HeroCarousel from "@/components/HeroCarousel";
import ConsultingShowcase from "@/components/ConsultingShowcase";
import {
  FadeUp,
  FadeIn,
  StaggerContainer,
  StaggerItem,
  SlideInLeft,
  SlideInRight,
  ScaleUp,
  Float,
  ParallaxSection,
} from "@/components/animations/ScrollAnimations";
import {
  ArrowRight,
  Cloud,
  Database,
  Users,
  GraduationCap,
  Cpu,
  BarChart3,
  CheckCircle2,
  Globe,
  Award,
  Building2,
  Shield,
  Zap,
  HeartHandshake,
  TrendingUp,
  Star,
  Settings,
  Headphones,
  Phone,
  Mail,
  MapPin,
  Play,
  Sparkles,
} from "lucide-react";

const services = [
  {
    icon: BarChart3,
    title: "ERP Solutions",
    description:
      "SAP & Oracle implementation tailored to streamline your business operations and maximize efficiency.",
    features: ["SAP S/4HANA", "Oracle Cloud ERP", "Microsoft Dynamics 365"],
    href: "/services#erp",
    color: "from-blue-500 to-blue-600",
  },
  {
    icon: Cloud,
    title: "Cloud Services",
    description:
      "Secure, scalable cloud migration and management solutions on AWS, Azure, and GCP.",
    features: ["Cloud Migration", "Infrastructure Management", "DevOps"],
    href: "/services#cloud",
    color: "from-cyan-500 to-cyan-600",
  },
  {
    icon: Cpu,
    title: "Data Analytics & AI",
    description:
      "Unlock actionable insights with advanced analytics, machine learning, and AI solutions.",
    features: ["Machine Learning", "Predictive Analytics", "Business Intelligence"],
    href: "/services#ai",
    color: "from-purple-500 to-purple-600",
  },
  {
    icon: Database,
    title: "Salesforce",
    description:
      "Transform customer engagement through intelligent Salesforce solutions—smart, simple, effective.",
    features: ["Sales Cloud", "Service Cloud", "Marketing Cloud"],
    href: "/services#salesforce",
    color: "from-sky-500 to-sky-600",
  },
  {
    icon: Users,
    title: "Staffing Services",
    description:
      "Access top-tier IT talent with our comprehensive staffing solutions for all engagement models.",
    features: ["Contract Staffing", "Direct Hire", "Managed Teams"],
    href: "/services#staffing",
    color: "from-emerald-500 to-emerald-600",
  },
  {
    icon: GraduationCap,
    title: "Training Services",
    description:
      "Empower your workforce with industry-leading certification programs and custom training.",
    features: ["IT Certifications", "Custom Programs", "E-Learning"],
    href: "/services#training",
    color: "from-orange-500 to-orange-600",
  },
  {
    icon: Settings,
    title: "Managed Services",
    description:
      "End-to-end IT management and support to keep your business running smoothly 24/7.",
    features: ["IT Support", "Infrastructure Management", "Security"],
    href: "/services#managed",
    color: "from-rose-500 to-rose-600",
  },
  {
    icon: Headphones,
    title: "Outsourcing",
    description:
      "Strategic outsourcing solutions to optimize costs and focus on your core business.",
    features: ["BPO Services", "IT Outsourcing", "Process Optimization"],
    href: "/services#outsourcing",
    color: "from-indigo-500 to-indigo-600",
  },
];

const stats = [
  { value: 500, suffix: "+", label: "Enterprise Clients", icon: Building2 },
  { value: 15, suffix: "+", label: "Years of Excellence", icon: Award },
  { value: 25, suffix: "+", label: "Global Locations", icon: Globe },
  { value: 98, suffix: "%", label: "Client Satisfaction", icon: Star },
];

const industries = [
  {
    name: "Manufacturing",
    description: "Smart factory solutions & supply chain optimization",
    icon: Settings,
    stats: "150+ Projects",
    color: "from-blue-500 to-blue-600",
  },
  {
    name: "Retail",
    description: "Omnichannel commerce & customer experience",
    icon: TrendingUp,
    stats: "80+ Clients",
    color: "from-emerald-500 to-emerald-600",
  },
  {
    name: "Government",
    description: "Secure digital transformation & compliance",
    icon: Shield,
    stats: "40+ Agencies",
    color: "from-slate-600 to-slate-700",
  },
  {
    name: "Healthcare",
    description: "Patient care innovation & data analytics",
    icon: HeartHandshake,
    stats: "60+ Providers",
    color: "from-rose-500 to-rose-600",
  },
  {
    name: "Financial Services",
    description: "Risk management & regulatory compliance",
    icon: BarChart3,
    stats: "90+ Firms",
    color: "from-amber-500 to-amber-600",
  },
  {
    name: "Technology",
    description: "Scalable infrastructure & innovation",
    icon: Cpu,
    stats: "120+ Companies",
    color: "from-purple-500 to-purple-600",
  },
];

const values = [
  {
    icon: Star,
    title: "Your Success, Our Priority",
    description: "We measure our success by yours, delivering solutions that drive real business outcomes.",
  },
  {
    icon: HeartHandshake,
    title: "Building Lasting Partnerships",
    description: "We don't just complete projects—we build long-term relationships based on trust.",
  },
  {
    icon: Shield,
    title: "Unwavering Customer Support",
    description: "24/7 dedicated support ensuring your systems run smoothly at all times.",
  },
  {
    icon: Zap,
    title: "Innovation & Excellence",
    description: "Continuously pushing boundaries with cutting-edge technology solutions.",
  },
];

const testimonials = [
  {
    quote:
      "Ocean Blue transformed our entire ERP infrastructure. Their expertise in SAP implementation was instrumental in achieving a 40% improvement in operational efficiency.",
    author: "Sarah Chen",
    role: "CTO",
    company: "TechForward Inc.",
  },
  {
    quote:
      "The Salesforce implementation was seamless. Their team understood our requirements and delivered a solution that exceeded our expectations.",
    author: "Michael Rodriguez",
    role: "VP of Sales",
    company: "Global Retail Corp",
  },
  {
    quote:
      "Their AI and data analytics solutions have given us unprecedented visibility into our operations. The ROI has been phenomenal.",
    author: "Jennifer Walsh",
    role: "Director of Operations",
    company: "Manufacturing Solutions",
  },
];

const partners = [
  { name: "SAP", logo: "SAP" },
  { name: "Oracle", logo: "Oracle" },
  { name: "Microsoft", logo: "Microsoft" },
  { name: "Salesforce", logo: "Salesforce" },
  { name: "AWS", logo: "AWS" },
  { name: "Google Cloud", logo: "Google Cloud" },
];

// Animated Counter Component
function AnimatedNumber({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  return (
    <motion.span
      ref={ref}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      className="tabular-nums"
    >
      <motion.span
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        onViewportEnter={() => {
          if (ref.current) {
            let start = 0;
            const end = value;
            const duration = 2000;
            const increment = end / (duration / 16);
            const timer = setInterval(() => {
              start += increment;
              if (start >= end) {
                clearInterval(timer);
                if (ref.current) ref.current.textContent = `${end}${suffix}`;
              } else {
                if (ref.current) ref.current.textContent = `${Math.floor(start)}${suffix}`;
              }
            }, 16);
          }
        }}
      >
        0{suffix}
      </motion.span>
    </motion.span>
  );
}

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef}>
      {/* Hero Carousel */}
      <section>
        <HeroCarousel />
      </section>

      {/* Partners Section - Animated */}
      <section className="py-12 bg-white border-b border-slate-100 overflow-hidden">
        <div className="container-custom">
          <FadeUp>
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
              <p className="text-slate-500 font-medium whitespace-nowrap text-sm uppercase tracking-wider">
                Trusted by Industry Leaders
              </p>
              <div className="relative w-full lg:w-auto overflow-hidden">
                <motion.div
                  animate={{ x: ["0%", "-50%"] }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="flex items-center gap-16"
                >
                  {[...partners, ...partners].map((partner, index) => (
                    <motion.div
                      key={`${partner.name}-${index}`}
                      whileHover={{ scale: 1.1 }}
                      className="text-2xl md:text-3xl font-bold text-slate-300 hover:text-blue-600 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      {partner.logo}
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* Consulting Showcase - New 3D Animated Section */}
      <ConsultingShowcase />

      {/* Services Section with Scroll Animations */}
      <section className="section-padding bg-slate-900 relative overflow-hidden" id="services">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.15, 0.1],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-500 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.1, 0.15, 0.1],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-cyan-500 rounded-full blur-3xl"
          />
        </div>

        <div className="container-custom relative z-10">
          <FadeUp>
            <div className="text-center max-w-3xl mx-auto mb-16">
              <motion.span
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-cyan-400 font-semibold text-sm rounded-full mb-6 backdrop-blur-sm"
              >
                <Sparkles className="w-4 h-4" />
                Our Services
              </motion.span>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Comprehensive IT Solutions for{" "}
                <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  Modern Enterprises
                </span>
              </h2>
              <p className="text-lg text-slate-400 leading-relaxed">
                From legacy system modernization to cutting-edge AI implementation,
                we provide end-to-end solutions that drive business growth.
              </p>
            </div>
          </FadeUp>

          <StaggerContainer staggerDelay={0.1} className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {services.map((service, index) => (
              <StaggerItem key={service.title}>
                <motion.div
                  whileHover={{ y: -8, transition: { duration: 0.3 } }}
                  className="h-full"
                >
                  <Link
                    href={service.href}
                    className="group relative bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 hover:bg-white/10 hover:border-cyan-500/50 transition-all duration-500 overflow-hidden flex flex-col h-full"
                  >
                    {/* Hover Glow Effect */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      whileHover={{ opacity: 1 }}
                      className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-2xl"
                    />

                    {/* Number Badge */}
                    <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                      <span className="text-sm font-bold text-white/30 group-hover:text-cyan-400 transition-colors">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                    </div>

                    <div className="relative z-10 flex-1">
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ type: "spring", stiffness: 300 }}
                        className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${service.color} flex items-center justify-center mb-5 shadow-lg`}
                      >
                        <service.icon className="w-7 h-7 text-white" />
                      </motion.div>

                      <h3 className="text-lg font-semibold text-white mb-3 group-hover:text-cyan-400 transition-colors">
                        {service.title}
                      </h3>

                      <p className="text-slate-400 text-sm mb-4 leading-relaxed line-clamp-2">
                        {service.description}
                      </p>

                      {/* Feature Tags */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {service.features.slice(0, 2).map((feature) => (
                          <span key={feature} className="px-2 py-1 bg-white/5 rounded-lg text-xs text-slate-400">
                            {feature}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center gap-2 text-cyan-400 font-medium text-sm group-hover:gap-3 transition-all">
                        Explore Service
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>

          {/* Bottom CTA */}
          <FadeUp delay={0.4}>
            <div className="text-center mt-12">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  href="/services"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-xl hover:from-cyan-400 hover:to-blue-500 transition-all shadow-lg shadow-cyan-500/25"
                >
                  View All Services
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </motion.div>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="section-padding bg-gradient-to-b from-slate-50 via-white to-blue-50 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #1e3a8a 1px, transparent 0)`,
          backgroundSize: '40px 40px',
        }} />

        <div className="container-custom relative z-10">
          {/* Section Header */}
          <FadeUp>
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="inline-block px-4 py-2 bg-blue-100 text-blue-700 font-semibold text-sm rounded-full mb-4">
                Why Ocean Blue
              </span>
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
                Your Trusted Partner for{" "}
                <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  Digital Excellence
                </span>
              </h2>
              <p className="text-lg text-slate-600 leading-relaxed">
                Specializing in ERP, staffing, and Salesforce expertise for Manufacturing,
                Retail, and Government sectors.
              </p>
            </div>
          </FadeUp>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Values */}
            <div className="lg:col-span-2 grid sm:grid-cols-2 gap-6">
              {values.map((value, index) => (
                <FadeUp key={value.title} delay={index * 0.1}>
                  <motion.div
                    whileHover={{ y: -5, transition: { duration: 0.2 } }}
                    className="group bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-xl hover:border-blue-200 transition-all duration-300 h-full"
                  >
                    <div className="flex items-start gap-4">
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/25"
                      >
                        <value.icon className="w-7 h-7 text-white" />
                      </motion.div>
                      <div>
                        <h4 className="font-bold text-slate-900 mb-2 text-lg group-hover:text-blue-700 transition-colors">
                          {value.title}
                        </h4>
                        <p className="text-slate-600 text-sm leading-relaxed">
                          {value.description}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </FadeUp>
              ))}
            </div>

            {/* Right Column - Stats Card */}
            <SlideInRight delay={0.3}>
              <div className="relative h-full">
                <motion.div
                  animate={{
                    scale: [1, 1.02, 1],
                    opacity: [0.2, 0.3, 0.2],
                  }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -inset-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-3xl blur-2xl"
                />
                <div className="relative bg-gradient-to-br from-slate-900 to-blue-900 rounded-2xl p-8 text-white h-full">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <p className="text-sm text-white/60 mb-1">Project Success Rate</p>
                      <p className="text-5xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                        98.7%
                      </p>
                    </div>
                    <Float duration={3} y={5}>
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                        <CheckCircle2 className="w-8 h-8 text-white" />
                      </div>
                    </Float>
                  </div>

                  <div className="space-y-5 mb-8">
                    {[
                      { label: "ERP Implementations", value: 95 },
                      { label: "Salesforce Projects", value: 99 },
                      { label: "Cloud Migrations", value: 97 },
                    ].map((item, index) => (
                      <motion.div
                        key={item.label}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.5 + index * 0.1 }}
                      >
                        <div className="flex justify-between mb-2">
                          <span className="text-sm text-white/70">{item.label}</span>
                          <span className="text-sm font-semibold text-cyan-400">{item.value}%</span>
                        </div>
                        <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            whileInView={{ width: `${item.value}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 1, delay: 0.8 + index * 0.1, ease: "easeOut" }}
                            className="h-full bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full"
                          />
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Link
                      href="/contact"
                      className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-xl hover:from-cyan-400 hover:to-blue-400 transition-all shadow-lg shadow-cyan-500/30"
                    >
                      Start Your Project
                      <ArrowRight className="w-5 h-5" />
                    </Link>
                  </motion.div>
                </div>
              </div>
            </SlideInRight>
          </div>
        </div>
      </section>

      {/* Stats Section with Animated Counters */}
      <section className="py-20 bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
            className="absolute -top-1/2 -right-1/2 w-full h-full border border-white/5 rounded-full"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
            className="absolute -bottom-1/2 -left-1/2 w-full h-full border border-white/5 rounded-full"
          />
        </div>

        <div className="container-custom relative z-10">
          <StaggerContainer staggerDelay={0.15} className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <StaggerItem key={stat.label}>
                <motion.div
                  whileHover={{ y: -5 }}
                  className="text-center"
                >
                  <Float duration={4} y={8}>
                    <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center mx-auto mb-4 border border-white/10">
                      <stat.icon className="w-10 h-10" />
                    </div>
                  </Float>
                  <p className="text-5xl font-bold mb-2">
                    <AnimatedNumber value={stat.value} suffix={stat.suffix} />
                  </p>
                  <p className="text-white/80 text-lg">{stat.label}</p>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Industries Section with Scroll Animations */}
      <section className="section-padding bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <motion.div
            animate={{
              x: [0, 50, 0],
              y: [0, 30, 0],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2"
          />
          <motion.div
            animate={{
              x: [0, -30, 0],
              y: [0, 50, 0],
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-cyan-500/10 rounded-full blur-3xl"
          />
        </div>

        <div className="container-custom relative z-10">
          <FadeUp>
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="inline-block px-4 py-2 bg-cyan-500/20 text-cyan-400 font-semibold text-sm rounded-full mb-4">
                Industries We Serve
              </span>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Deep Expertise Across{" "}
                <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  Key Sectors
                </span>
              </h2>
              <p className="text-lg text-slate-400 leading-relaxed">
                Industry-specific solutions built on deep domain knowledge and proven
                methodologies that address your unique challenges.
              </p>
            </div>
          </FadeUp>

          <StaggerContainer staggerDelay={0.1} className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {industries.map((industry) => (
              <StaggerItem key={industry.name}>
                <motion.div
                  whileHover={{ y: -8, transition: { duration: 0.3 } }}
                  className="group relative bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8 hover:bg-white/10 hover:border-cyan-500/50 transition-all duration-500 cursor-pointer overflow-hidden"
                >
                  {/* Hover Gradient */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                    className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-500/10 rounded-2xl"
                  />

                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-6">
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${industry.color} flex items-center justify-center shadow-lg`}
                      >
                        <industry.icon className="w-8 h-8 text-white" />
                      </motion.div>
                      <span className="px-3 py-1.5 bg-white/10 rounded-full text-xs font-semibold text-cyan-400">
                        {industry.stats}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-white mb-3 group-hover:text-cyan-400 transition-colors">
                      {industry.name}
                    </h3>

                    <p className="text-slate-400 text-sm leading-relaxed mb-6">
                      {industry.description}
                    </p>

                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      whileHover={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-2 text-cyan-400 font-medium text-sm"
                    >
                      Explore Solutions
                      <ArrowRight className="w-4 h-4" />
                    </motion.div>
                  </div>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>

          {/* Bottom Stats */}
          <FadeUp delay={0.4}>
            <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { value: "6+", label: "Industries Served" },
                { value: "500+", label: "Successful Projects" },
                { value: "15+", label: "Years Experience" },
                { value: "98%", label: "Client Satisfaction" },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center"
                >
                  <p className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-2">
                    {stat.value}
                  </p>
                  <p className="text-slate-400 text-sm">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </FadeUp>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="section-padding bg-gradient-to-b from-white to-slate-50 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #1e3a8a 1px, transparent 0)`,
          backgroundSize: '40px 40px',
        }} />

        <div className="container-custom relative z-10">
          <FadeUp>
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="inline-block px-4 py-2 bg-blue-100 text-blue-700 font-semibold text-sm rounded-full mb-4">
                Client Success Stories
              </span>
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
                Trusted by{" "}
                <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  Industry Leaders
                </span>
              </h2>
              <p className="text-lg text-slate-600 leading-relaxed">
                See what our clients say about their transformational journey with Ocean Blue.
              </p>
            </div>
          </FadeUp>

          <StaggerContainer staggerDelay={0.15} className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <StaggerItem key={index}>
                <motion.div
                  whileHover={{ y: -5 }}
                  className="bg-white rounded-2xl border border-slate-200 p-8 shadow-lg hover:shadow-xl transition-all duration-300 relative h-full"
                >
                  <div className="absolute top-6 right-6 text-6xl text-blue-100 font-serif">&ldquo;</div>

                  <div className="flex gap-1 mb-6">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 + i * 0.1 }}
                      >
                        <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                      </motion.div>
                    ))}
                  </div>

                  <blockquote className="text-slate-700 mb-8 leading-relaxed relative z-10">
                    &ldquo;{testimonial.quote}&rdquo;
                  </blockquote>

                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white font-bold">
                      {testimonial.author.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{testimonial.author}</p>
                      <p className="text-sm text-slate-500">
                        {testimonial.role}, {testimonial.company}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* CTA Section with Parallax */}
      <section className="section-padding bg-slate-900 text-white relative overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.2, 0.3, 0.2],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full blur-3xl"
        />

        <div className="container-custom relative z-10">
          <FadeUp>
            <div className="max-w-4xl mx-auto text-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="mb-8"
              >
                <Float duration={4} y={10}>
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mx-auto shadow-lg shadow-cyan-500/30">
                    <Sparkles className="w-10 h-10 text-white" />
                  </div>
                </Float>
              </motion.div>

              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                Ready to{" "}
                <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  Transform
                </span>{" "}
                Your Business?
              </h2>
              <p className="text-xl text-slate-400 mb-10 leading-relaxed max-w-2xl mx-auto">
                Join 500+ enterprises that have accelerated their digital transformation
                with Ocean Blue. Let&apos;s discuss how we can help you achieve your business goals.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link
                    href="/contact"
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-xl hover:from-cyan-400 hover:to-blue-500 transition-all shadow-lg shadow-cyan-500/25"
                  >
                    Schedule a Consultation
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link
                    href="/services"
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-white/30 text-white font-semibold rounded-xl hover:bg-white/10 hover:border-white/50 transition-all"
                  >
                    <Play className="w-5 h-5" />
                    Watch Demo
                  </Link>
                </motion.div>
              </div>

              {/* Contact Info */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="flex flex-wrap justify-center gap-8 text-slate-400"
              >
                <motion.a
                  href="tel:+16148446925"
                  whileHover={{ scale: 1.05, color: "#fff" }}
                  className="flex items-center gap-2 transition-colors"
                >
                  <Phone className="w-5 h-5" />
                  +1 614-844-6925
                </motion.a>
                <motion.a
                  href="mailto:hr@oceanbluecorp.com"
                  whileHover={{ scale: 1.05, color: "#fff" }}
                  className="flex items-center gap-2 transition-colors"
                >
                  <Mail className="w-5 h-5" />
                  hr@oceanbluecorp.com
                </motion.a>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center gap-2"
                >
                  <MapPin className="w-5 h-5" />
                  Powell, OH 43065
                </motion.div>
              </motion.div>
            </div>
          </FadeUp>
        </div>
      </section>
    </div>
  );
}
