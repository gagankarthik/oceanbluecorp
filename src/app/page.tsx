"use client";

import Link from "next/link";
import Image from "next/image";
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
  Factory,
  ShoppingCart,
  Landmark,
  Stethoscope,
  Wallet,
  Monitor,
  Rocket,
  Target,
  Users2,
  BadgeCheck,
} from "lucide-react";

const services = [
  {
    icon: BarChart3,
    title: "ERP Solutions",
    description:
      "SAP & Oracle implementation tailored to streamline your business operations and maximize efficiency.",
    features: ["SAP S/4HANA", "Oracle Cloud ERP", "Microsoft Dynamics 365"],
    href: "/services#erp",
    color: "from-blue-500 to-indigo-600",
  },
  {
    icon: Cloud,
    title: "Cloud Services",
    description:
      "Secure, scalable cloud migration and management solutions on AWS, Azure, and GCP.",
    features: ["Cloud Migration", "Infrastructure Management", "DevOps"],
    href: "/services#cloud",
    color: "from-cyan-500 to-blue-600",
  },
  {
    icon: Cpu,
    title: "Data Analytics & AI",
    description:
      "Unlock actionable insights with advanced analytics, machine learning, and AI solutions.",
    features: ["Machine Learning", "Predictive Analytics", "Business Intelligence"],
    href: "/services#ai",
    color: "from-violet-500 to-purple-600",
  },
  {
    icon: Database,
    title: "Salesforce",
    description:
      "Transform customer engagement through intelligent Salesforce solutions—smart, simple, effective.",
    features: ["Sales Cloud", "Service Cloud", "Marketing Cloud"],
    href: "/services#salesforce",
    color: "from-sky-500 to-blue-600",
  },
  {
    icon: Users,
    title: "Staffing Services",
    description:
      "Access top-tier IT talent with our comprehensive staffing solutions for all engagement models.",
    features: ["Contract Staffing", "Direct Hire", "Managed Teams"],
    href: "/services#staffing",
    color: "from-teal-500 to-cyan-600",
  },
  {
    icon: GraduationCap,
    title: "Training Services",
    description:
      "Empower your workforce with industry-leading certification programs and custom training.",
    features: ["IT Certifications", "Custom Programs", "E-Learning"],
    href: "/services#training",
    color: "from-amber-500 to-orange-600",
  },
  {
    icon: Settings,
    title: "Managed Services",
    description:
      "End-to-end IT management and support to keep your business running smoothly 24/7.",
    features: ["IT Support", "Infrastructure Management", "Security"],
    href: "/services#managed",
    color: "from-rose-500 to-pink-600",
  },
  {
    icon: Headphones,
    title: "Outsourcing",
    description:
      "Strategic outsourcing solutions to optimize costs and focus on your core business.",
    features: ["BPO Services", "IT Outsourcing", "Process Optimization"],
    href: "/services#outsourcing",
    color: "from-indigo-500 to-blue-600",
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
    icon: Factory,
    stats: "150+ Projects",
    color: "from-blue-500 to-indigo-600",
    logo: "https://cdn-icons-png.flaticon.com/512/2936/2936690.png",
  },
  {
    name: "Retail",
    description: "Omnichannel commerce & customer experience",
    icon: ShoppingCart,
    stats: "80+ Clients",
    color: "from-cyan-500 to-blue-600",
    logo: "https://cdn-icons-png.flaticon.com/512/3081/3081559.png",
  },
  {
    name: "Government",
    description: "Secure digital transformation & compliance",
    icon: Landmark,
    stats: "40+ Agencies",
    color: "from-indigo-500 to-purple-600",
    logo: "https://cdn-icons-png.flaticon.com/512/2991/2991231.png",
  },
  {
    name: "Healthcare",
    description: "Patient care innovation & data analytics",
    icon: Stethoscope,
    stats: "60+ Providers",
    color: "from-teal-500 to-cyan-600",
    logo: "https://cdn-icons-png.flaticon.com/512/2966/2966327.png",
  },
  {
    name: "Financial Services",
    description: "Risk management & regulatory compliance",
    icon: Wallet,
    stats: "90+ Firms",
    color: "from-blue-600 to-indigo-700",
    logo: "https://cdn-icons-png.flaticon.com/512/2830/2830284.png",
  },
  {
    name: "Technology",
    description: "Scalable infrastructure & innovation",
    icon: Monitor,
    stats: "120+ Companies",
    color: "from-violet-500 to-purple-600",
    logo: "https://cdn-icons-png.flaticon.com/512/2920/2920244.png",
  },
];

const values = [
  {
    icon: Star,
    title: "Your Success, Our Priority",
    description: "We measure our success by yours, delivering solutions that drive real business outcomes.",
    color: "from-amber-400 to-orange-500",
  },
  {
    icon: HeartHandshake,
    title: "Building Lasting Partnerships",
    description: "We don't just complete projects—we build long-term relationships based on trust.",
    color: "from-rose-400 to-pink-500",
  },
  {
    icon: Shield,
    title: "Unwavering Customer Support",
    description: "24/7 dedicated support ensuring your systems run smoothly at all times.",
    color: "from-blue-400 to-indigo-500",
  },
  {
    icon: Zap,
    title: "Innovation & Excellence",
    description: "Continuously pushing boundaries with cutting-edge technology solutions.",
    color: "from-cyan-400 to-blue-500",
  },
];

const testimonials = [
  {
    quote:
      "Ocean Blue transformed our entire ERP infrastructure. Their expertise in SAP implementation was instrumental in achieving a 40% improvement in operational efficiency.",
    author: "Sarah Chen",
    role: "CTO",
    company: "TechForward Inc.",
    avatar: "SC",
  },
  {
    quote:
      "The Salesforce implementation was seamless. Their team understood our requirements and delivered a solution that exceeded our expectations.",
    author: "Michael Rodriguez",
    role: "VP of Sales",
    company: "Global Retail Corp",
    avatar: "MR",
  },
  {
    quote:
      "Their AI and data analytics solutions have given us unprecedented visibility into our operations. The ROI has been phenomenal.",
    author: "Jennifer Walsh",
    role: "Director of Operations",
    company: "Manufacturing Solutions",
    avatar: "JW",
  },
];

const partners = [
  { name: "SAP", logo: "https://upload.wikimedia.org/wikipedia/commons/5/59/SAP_2011_logo.svg" },
  { name: "REX Auto Parts", logo: "https://oceanbluecorp.com/storage/images/1717579032.png" },
  { name: "Microsoft", logo: "https://upload.wikimedia.org/wikipedia/commons/9/96/Microsoft_logo_%282012%29.svg" },
  { name: "Salesforce", logo: "https://upload.wikimedia.org/wikipedia/commons/f/f9/Salesforce.com_logo.svg" },
  { name: "AWS", logo: "https://upload.wikimedia.org/wikipedia/commons/9/93/Amazon_Web_Services_Logo.svg" },
  { name: "Google Cloud", logo: "https://www.gstatic.com/devrel-devsite/prod/v0e0f589edd85502a40d78d7d0825db8ea5ef3b99ab4070381ee86977c9168730/cloud/images/cloud-logo.svg" },
];

// Animated Counter Component
function AnimatedNumber({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);

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
    <div ref={containerRef} className="overflow-x-hidden">
      {/* Hero Carousel */}
      <section>
        <HeroCarousel />
      </section>

      {/* Partners Section - Compact */}
      <section className="py-12 md:py-14 bg-[#0a192f] relative overflow-hidden">
        <div className="container-custom relative z-10">
          <FadeUp>
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8">
              <div className="text-center md:text-left">
                <p className="text-blue-300/80 font-medium text-sm uppercase tracking-wider">
                  Trusted by Industry Leaders
                </p>
              </div>

              {/* Partner Logos - Scrolling */}
              <div className="relative flex-1 w-full overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-[#0a192f] to-transparent z-10" />
                <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#0a192f] to-transparent z-10" />
                <motion.div
                  animate={{ x: ["0%", "-50%"] }}
                  transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                  className="flex items-center gap-12 md:gap-16"
                >
                  {[...partners, ...partners].map((partner, index) => (
                    <motion.div
                      key={`${partner.name}-${index}`}
                      whileHover={{ scale: 1.1 }}
                      className="flex-shrink-0"
                    >
                      <Image
                        src={partner.logo}
                        alt={partner.name}
                        width={120}
                        height={40}
                        className="h-7 md:h-9 w-auto object-contain filter brightness-0 invert opacity-50 hover:opacity-90 transition-all"
                        unoptimized
                      />
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* Consulting Showcase */}
      <ConsultingShowcase />

      {/* Services Section */}
      <section className="section-padding bg-gradient-to-br from-[#0a192f] via-[#0f2847] to-[#0a192f] relative overflow-hidden" id="services">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <motion.div
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.1, 0.2, 0.1],
              x: [-50, 50, -50],
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-0 left-1/4 w-[400px] md:w-[600px] h-[400px] md:h-[600px] bg-blue-500 rounded-full blur-[120px]"
          />
          <motion.div
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.1, 0.2, 0.1],
              x: [50, -50, 50],
            }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute bottom-0 right-1/4 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-cyan-500 rounded-full blur-[100px]"
          />
          {/* Grid Pattern */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
          }} />
        </div>

        <div className="container-custom relative z-10">
          <FadeUp>
            <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 backdrop-blur-sm rounded-full border border-cyan-500/30 mb-6"
              >
                <Rocket className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-semibold text-cyan-300">Our Services</span>
              </motion.div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
                Comprehensive IT Solutions for{" "}
                <span className="relative">
                  <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                    Modern Enterprises
                  </span>
                  <motion.span
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                    className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full origin-left"
                  />
                </span>
              </h2>
              <p className="text-lg text-blue-200/70 leading-relaxed">
                From legacy system modernization to cutting-edge AI implementation,
                we provide end-to-end solutions that drive business growth.
              </p>
            </div>
          </FadeUp>

          <StaggerContainer staggerDelay={0.08} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
            {services.map((service, index) => (
              <StaggerItem key={service.title}>
                <motion.div
                  whileHover={{ y: -10, transition: { duration: 0.3 } }}
                  className="h-full"
                >
                  <Link
                    href={service.href}
                    className="group relative bg-white/[0.03] backdrop-blur-sm rounded-2xl border border-white/10 p-6 hover:bg-white/[0.08] hover:border-cyan-500/40 transition-all duration-500 overflow-hidden flex flex-col h-full"
                  >
                    {/* Hover Gradient */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileHover={{ opacity: 1, scale: 1 }}
                      className={`absolute inset-0 bg-gradient-to-br ${service.color} opacity-5 rounded-2xl`}
                    />

                    {/* Glow Effect */}
                    <div className={`absolute -inset-px bg-gradient-to-br ${service.color} opacity-0 group-hover:opacity-20 rounded-2xl blur-xl transition-opacity duration-500`} />

                    {/* Number */}
                    <div className="absolute top-4 right-4">
                      <span className="text-sm font-bold text-white/20 group-hover:text-cyan-400/50 transition-colors">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                    </div>

                    <div className="relative z-10 flex-1">
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ type: "spring", stiffness: 300 }}
                        className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${service.color} flex items-center justify-center mb-5 shadow-lg shadow-black/20`}
                      >
                        <service.icon className="w-7 h-7 text-white" />
                      </motion.div>

                      <h3 className="text-lg font-bold text-white mb-3 group-hover:text-cyan-300 transition-colors">
                        {service.title}
                      </h3>

                      <p className="text-blue-200/60 text-sm mb-4 leading-relaxed line-clamp-2">
                        {service.description}
                      </p>

                      <div className="flex flex-wrap gap-2 mb-4">
                        {service.features.slice(0, 2).map((feature) => (
                          <span key={feature} className="px-2.5 py-1 bg-white/5 rounded-lg text-xs text-blue-200/70 border border-white/5">
                            {feature}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center gap-2 text-cyan-400 font-medium text-sm group-hover:gap-3 transition-all mt-auto">
                        Explore Service
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>

          <FadeUp delay={0.4}>
            <div className="text-center mt-12">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  href="/services"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-xl hover:from-cyan-400 hover:to-blue-500 transition-all shadow-lg shadow-cyan-500/25"
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
      <section className="section-padding bg-gray-50 relative overflow-hidden">
        <div className="container-custom relative z-10">
          <FadeUp>
            <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-full mb-6"
              >
                <Target className="w-4 h-4" />
                <span className="text-sm font-semibold">Why Ocean Blue</span>
              </motion.div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                Your Trusted Partner for{" "}
                <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  Digital Excellence
                </span>
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                Specializing in ERP, staffing, and Salesforce expertise for Manufacturing,
                Retail, and Government sectors.
              </p>
            </div>
          </FadeUp>

          <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Values Grid */}
            <div className="lg:col-span-2 grid sm:grid-cols-2 gap-4 md:gap-5">
              {values.map((value, index) => (
                <FadeUp key={value.title} delay={index * 0.1}>
                  <motion.div
                    whileHover={{ y: -5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className="group bg-white rounded-xl p-5 md:p-6 border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${value.color} flex items-center justify-center flex-shrink-0`}>
                        <value.icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 mb-1.5 text-base md:text-lg group-hover:text-blue-700 transition-colors">
                          {value.title}
                        </h4>
                        <p className="text-gray-600 text-sm leading-relaxed">
                          {value.description}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </FadeUp>
              ))}
            </div>

            {/* Stats Card */}
            <SlideInRight delay={0.3}>
              <div className="bg-gradient-to-br from-[#0a192f] to-[#112240] rounded-2xl p-6 md:p-8 text-white h-full">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-sm text-blue-300/70 mb-1">Project Success Rate</p>
                    <motion.p
                      initial={{ opacity: 0, scale: 0.5 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      className="text-4xl md:text-5xl font-bold text-white"
                    >
                      98.7%
                    </motion.p>
                  </div>
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                    <CheckCircle2 className="w-7 h-7 text-white" />
                  </div>
                </div>

                <div className="space-y-4 mb-6">
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
                      <div className="flex justify-between mb-1.5">
                        <span className="text-sm text-blue-200/80">{item.label}</span>
                        <span className="text-sm font-semibold text-cyan-400">{item.value}%</span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${item.value}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, delay: 0.8 + index * 0.1 }}
                          className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>

                <Link
                  href="/contact"
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-white text-gray-900 font-semibold rounded-xl hover:bg-gray-100 transition-colors"
                >
                  Start Your Project
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </SlideInRight>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 md:py-24 bg-gradient-to-r from-[#0a192f] via-[#112240] to-[#0a192f] text-white relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 100, repeat: Infinity, ease: "linear" }}
            className="absolute -top-1/2 -right-1/2 w-full h-full border border-cyan-500/10 rounded-full"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
            className="absolute -bottom-1/2 -left-1/2 w-full h-full border border-blue-500/10 rounded-full"
          />
          {/* Floating Particles */}
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-cyan-400/40 rounded-full"
              style={{
                left: `${10 + i * 12}%`,
                top: `${20 + (i % 4) * 20}%`,
              }}
              animate={{
                y: [-30, 30, -30],
                opacity: [0.2, 0.6, 0.2],
              }}
              transition={{
                duration: 4 + i,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.3,
              }}
            />
          ))}
        </div>

        <div className="container-custom relative z-10">
          <StaggerContainer staggerDelay={0.15} className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12">
            {stats.map((stat, index) => (
              <StaggerItem key={stat.label}>
                <motion.div
                  whileHover={{ y: -8, scale: 1.05 }}
                  className="text-center group"
                >
                  <Float duration={4 + index} y={10}>
                    <motion.div
                      whileHover={{ rotate: 10 }}
                      className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-5 border border-cyan-500/20 group-hover:border-cyan-400/40 transition-colors"
                    >
                      <stat.icon className="w-10 h-10 md:w-12 md:h-12 text-cyan-400" />
                    </motion.div>
                  </Float>
                  <p className="text-4xl md:text-5xl lg:text-6xl font-bold mb-2 bg-gradient-to-r from-white to-cyan-200 bg-clip-text text-transparent">
                    <AnimatedNumber value={stat.value} suffix={stat.suffix} />
                  </p>
                  <p className="text-blue-200/70 text-sm md:text-base">{stat.label}</p>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Industries Section */}
      <section className="section-padding bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-32 " />

        <div className="container-custom relative z-10 pt-16">
          <FadeUp>
            <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-full mb-6"
              >
                <Globe className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-semibold text-blue-700">Industries We Serve</span>
              </motion.div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                Deep Expertise Across{" "}
                <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  Key Sectors
                </span>
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                Industry-specific solutions built on deep domain knowledge and proven
                methodologies that address your unique challenges.
              </p>
            </div>
          </FadeUp>

          <StaggerContainer staggerDelay={0.1} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {industries.map((industry, index) => (
              <StaggerItem key={industry.name}>
                <motion.div
                  whileHover={{ y: -10, scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="group relative bg-white rounded-2xl p-6 md:p-8 shadow-lg shadow-gray-200/50 hover:shadow-xl hover:shadow-blue-200/50 border border-gray-100 hover:border-blue-200 transition-all duration-300 overflow-hidden cursor-pointer"
                >
                  {/* Hover Gradient */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${industry.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />

                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-6">
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${industry.color} flex items-center justify-center shadow-lg p-3`}
                      >
                        <Image
                          src={industry.logo}
                          alt={industry.name}
                          width={40}
                          height={40}
                          className="w-10 h-10 object-contain filter brightness-0 invert"
                          unoptimized
                        />
                      </motion.div>
                      <span className="px-3 py-1.5 bg-blue-50 rounded-full text-xs font-semibold text-blue-700 group-hover:bg-blue-100 transition-colors">
                        {industry.stats}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-700 transition-colors">
                      {industry.name}
                    </h3>

                    <p className="text-gray-600 text-sm leading-relaxed mb-6">
                      {industry.description}
                    </p>

                    <div className="flex items-center gap-2 text-blue-600 font-medium text-sm group-hover:gap-3 transition-all">
                      Explore Solutions
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>

          {/* Bottom Stats */}
          <FadeUp delay={0.4}>
            <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { value: "6+", label: "Industries Served", icon: Globe },
                { value: "500+", label: "Successful Projects", icon: CheckCircle2 },
                { value: "15+", label: "Years Experience", icon: Award },
                { value: "98%", label: "Client Satisfaction", icon: Star },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -5 }}
                  className="text-center group"
                >
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-200 transition-colors"
                  >
                    <stat.icon className="w-6 h-6 text-blue-600" />
                  </motion.div>
                  <p className="text-3xl md:text-4xl font-bold text-gray-900 mb-1">
                    {stat.value}
                  </p>
                  <p className="text-gray-600 text-sm">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </FadeUp>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="section-padding bg-gradient-to-b from-white to-blue-50/50 relative overflow-hidden">
        <div className="container-custom relative z-10">
          <FadeUp>
            <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-full mb-6"
              >
                <Users2 className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-semibold text-blue-700">Client Success Stories</span>
              </motion.div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                Trusted by{" "}
                <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  Industry Leaders
                </span>
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                See what our clients say about their transformational journey with Ocean Blue.
              </p>
            </div>
          </FadeUp>

          <StaggerContainer staggerDelay={0.15} className="grid md:grid-cols-3 gap-6 md:gap-8">
            {testimonials.map((testimonial, index) => (
              <StaggerItem key={index}>
                <motion.div
                  whileHover={{ y: -8, scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="bg-white rounded-2xl p-8 shadow-lg shadow-gray-200/50 hover:shadow-xl hover:shadow-blue-200/50 border border-gray-100 relative h-full"
                >
                  {/* Quote Mark */}
                  <div className="absolute top-6 right-6 text-6xl text-blue-100 font-serif leading-none">&ldquo;</div>

                  {/* Stars */}
                  <div className="flex gap-1 mb-6">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 + i * 0.1 }}
                      >
                        <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                      </motion.div>
                    ))}
                  </div>

                  <blockquote className="text-gray-700 mb-8 leading-relaxed relative z-10">
                    &ldquo;{testimonial.quote}&rdquo;
                  </blockquote>

                  <div className="flex items-center gap-4">
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white font-bold shadow-lg"
                    >
                      {testimonial.avatar}
                    </motion.div>
                    <div>
                      <p className="font-semibold text-gray-900">{testimonial.author}</p>
                      <p className="text-sm text-gray-500">
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

      {/* CTA Section */}
      <section className="section-padding bg-gradient-to-br from-[#0a192f] via-[#112240] to-[#0a192f] text-white relative overflow-hidden">
        {/* Animated Background */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.3, 0.2],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-cyan-500/30 to-blue-500/30 rounded-full blur-[120px]"
        />

        {/* Floating Elements */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-cyan-400/30 rounded-full"
              style={{
                left: `${15 + i * 15}%`,
                top: `${20 + (i % 3) * 25}%`,
              }}
              animate={{
                y: [-30, 30, -30],
                x: [-15, 15, -15],
                opacity: [0.2, 0.5, 0.2],
              }}
              transition={{
                duration: 5 + i,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.4,
              }}
            />
          ))}
        </div>

        <div className="container-custom relative z-10">
          <FadeUp>
            <div className="max-w-4xl mx-auto text-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="mb-8"
              >
                <Float duration={4} y={12}>
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mx-auto shadow-lg shadow-cyan-500/30">
                    <Sparkles className="w-10 h-10 text-white" />
                  </div>
                </Float>
              </motion.div>

              <h2 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold mb-6">
                Ready to{" "}
                <span className="bg-gradient-to-r from-cyan-400 to-white bg-clip-text text-transparent">
                  Transform
                </span>{" "}
                Your Business?
              </h2>
              <p className="text-xl text-blue-200/70 mb-10 leading-relaxed max-w-2xl mx-auto">
                Join 500+ enterprises that have accelerated their digital transformation
                with Ocean Blue. Let&apos;s discuss how we can help you achieve your business goals.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link
                    href="/contact"
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-xl hover:from-cyan-400 hover:to-blue-500 transition-all shadow-lg shadow-cyan-500/30"
                  >
                    Schedule a Consultation
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link
                    href="/services"
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/30 text-white font-semibold rounded-xl hover:bg-white/20 hover:border-white/50 transition-all"
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
                className="flex flex-wrap justify-center gap-6 md:gap-10 text-blue-200/70"
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
