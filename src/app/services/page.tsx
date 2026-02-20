"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Cloud,
  Database,
  Users,
  Cpu,
  CheckCircle2,
  Shield,
  Zap,
  Clock,
  Award,
  Headphones,
  Target,
  TrendingUp,
  Settings,
  ChevronRight,
  Sparkles,
  Lightbulb,
  Server,
  Lock,
  FileCheck,
  Bot,
  BarChart3,
  Workflow,
  RefreshCw,
  Compass,
  Rocket,
  Search,
} from "lucide-react";

const services = [
  {
    id: "staffing",
    icon: Users,
    title: "IT Staffing & Talent Solutions",
    shortName: "Staffing",
    tagline: "Build High-Performing Teams with Confidence",
    description:
      "We provide vetted, specialized IT professionals who integrate seamlessly into your environment.",
    capabilities: [
      "Cloud engineers & architects",
      "Cybersecurity analysts & engineers",
      "ERP specialists (SAP, Oracle, Microsoft)",
      "Salesforce developers & admins",
      "Data engineers & analysts",
      "AI/ML specialists",
      "Project & program managers",
      "Software developers & QA",
    ],
    engagementModels: ["Contract", "Contract-to-hire", "Direct hire", "Managed teams"],
    benefits: [
      { icon: Clock, text: "48-hour candidate presentation" },
      { icon: Award, text: "Pre-vetted top 5% talent" },
      { icon: TrendingUp, text: "Flexible engagement models" },
    ],
    color: "from-emerald-500 to-teal-500",
  },
  {
    id: "cloud",
    icon: Cloud,
    title: "Cloud Engineering & Modernization",
    shortName: "Cloud",
    tagline: "Modern Infrastructure for Modern Business",
    description:
      "We help organizations migrate, optimize, and scale cloud environments with security and performance at the core.",
    capabilities: [
      "Cloud migration (AWS, Azure, GCP)",
      "Infrastructure modernization",
      "DevOps & CI/CD automation",
      "API development & integrations",
      "Observability & performance tuning",
    ],
    benefits: [
      { icon: Zap, text: "99.99% uptime guarantee" },
      { icon: TrendingUp, text: "30% reduction in infrastructure costs" },
      { icon: Server, text: "Infinite scalability on demand" },
    ],
    color: "from-cyan-500 to-blue-500",
  },
  {
    id: "cybersecurity",
    icon: Shield,
    title: "Cybersecurity Services",
    shortName: "Cybersecurity",
    tagline: "Protect What Matters Most",
    description:
      "We strengthen your security posture with proactive, compliance-aligned cybersecurity services.",
    capabilities: [
      "Security assessments",
      "Cloud security hardening",
      "Identity & Access Management (IAM)",
      "Vulnerability management",
      "Compliance alignment (HIPAA, SOC2, NIST)",
      "Incident response planning",
    ],
    benefits: [
      { icon: Lock, text: "Proactive threat detection" },
      { icon: FileCheck, text: "Compliance-ready solutions" },
      { icon: Shield, text: "24/7 security monitoring" },
    ],
    color: "from-red-500 to-rose-500",
  },
  {
    id: "erp",
    icon: Database,
    title: "ERP Solutions",
    shortName: "ERP",
    tagline: "ERP Expertise That Drives Operational Excellence",
    description:
      "We support ERP implementations, integrations, and optimizations across major platforms including SAP, Oracle, and Microsoft Dynamics.",
    capabilities: [
      "Implementations",
      "Custom development",
      "Integrations",
      "Data migration",
      "Ongoing support",
    ],
    platforms: ["SAP", "Oracle", "Microsoft Dynamics"],
    benefits: [
      { icon: TrendingUp, text: "40% improvement in operational efficiency" },
      { icon: Clock, text: "50% faster reporting and analytics" },
      { icon: Settings, text: "Seamless system integration" },
    ],
    color: "from-blue-500 to-indigo-500",
  },
  {
    id: "salesforce",
    icon: Settings,
    title: "Salesforce Services",
    shortName: "Salesforce",
    tagline: "Make Salesforce Work the Way Your Business Needs It To",
    description:
      "We optimize, automate, and support Salesforce environments for better visibility and performance.",
    capabilities: [
      "Implementations & multi-cloud deployments",
      "Custom development (Apex, LWC)",
      "Workflow automation",
      "Org cleanup & technical debt reduction",
      "Managed admin services",
    ],
    benefits: [
      { icon: TrendingUp, text: "35% increase in sales productivity" },
      { icon: Headphones, text: "Improved customer satisfaction" },
      { icon: Target, text: "360-degree customer view" },
    ],
    color: "from-sky-500 to-cyan-500",
  },
  {
    id: "ai",
    icon: Cpu,
    title: "AI, Automation & Data Intelligence",
    shortName: "AI & Data",
    tagline: "Practical AI That Delivers Real Results",
    description:
      "We help organizations adopt secure, business-first AI and automation solutions.",
    capabilities: [
      "Workflow automation",
      "Intelligent document processing",
      "Predictive analytics",
      "LLM integrations",
      "Chatbots & virtual assistants",
      "Data engineering & analytics",
    ],
    benefits: [
      { icon: Bot, text: "Intelligent automation at scale" },
      { icon: BarChart3, text: "Data-driven decision making" },
      { icon: Zap, text: "10x faster data processing" },
    ],
    color: "from-purple-500 to-violet-500",
  },
  {
    id: "managed",
    icon: Headphones,
    title: "Managed Services",
    shortName: "Services",
    tagline: "Reliable Support. Proactive Optimization.",
    description:
      "We keep your systems running smoothly with ongoing monitoring, support, and performance management.",
    capabilities: [
      "24/7 monitoring",
      "Helpdesk & support",
      "Cloud & infrastructure management",
      "Application support",
      "Security monitoring",
    ],
    benefits: [
      { icon: Clock, text: "24/7 availability" },
      { icon: RefreshCw, text: "Proactive issue resolution" },
      { icon: TrendingUp, text: "Continuous optimization" },
    ],
    color: "from-amber-500 to-orange-500",
  },
  {
    id: "transformation",
    icon: Lightbulb,
    title: "Digital Transformation & Advisory",
    shortName: "Advisory",
    tagline: "Strategy and Execution That Align Technology with Business Goals",
    description:
      "We help organizations modernize processes, improve workflows, and adopt the right technologies.",
    capabilities: [
      "Technology strategy",
      "Architecture & roadmap development",
      "Process optimization",
      "Change management",
      "Training & enablement",
    ],
    benefits: [
      { icon: Target, text: "Aligned business & technology goals" },
      { icon: Workflow, text: "Streamlined processes" },
      { icon: Award, text: "Accelerated transformation" },
    ],
    color: "from-indigo-500 to-purple-500",
  },
];

const industries = [
  "Healthcare",
  "Government",
  "Financial Services",
  "Manufacturing",
  "Retail",
  "Technology",
];

const processSteps = [
  {
    step: "01",
    icon: Search,
    title: "Discovery",
    description: "Understanding your business, challenges, and goals through deep analysis.",
    gradient: "from-blue-600 to-cyan-600",
  },
  {
    step: "02",
    icon: Compass,
    title: "Strategy",
    description: "Designing optimal solutions with clear roadmaps and success metrics.",
    gradient: "from-indigo-600 to-purple-600",
  },
  {
    step: "03",
    icon: Rocket,
    title: "Implementation",
    description: "Executing with precision using agile methodologies and best practices.",
    gradient: "from-amber-500 to-orange-500",
  },
  {
    step: "04",
    icon: RefreshCw,
    title: "Optimization",
    description: "Continuous improvement through monitoring and iterative enhancements.",
    gradient: "from-emerald-500 to-teal-500",
  },
];

export default function ServicesPage() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 bg-gradient-to-br from-[#0a192f] via-[#112240] to-[#1e3a8a] overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-20 -right-20 w-[400px] md:w-[600px] h-[400px] md:h-[600px] bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute -bottom-20 -left-20 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-gradient-to-tr from-blue-500/20 to-cyan-500/20 rounded-full blur-3xl"
          />
        </div>

        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl"
          >
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 mb-6"
            >
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-medium text-white/90">Technology. Talent. Transformation.</span>
            </motion.div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-light text-white mb-6 leading-tight">
              IT Services and Talent Solutions Built for{" "}
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent font-medium">
                Modern Organizations
              </span>
            </h1>
            <p className="text-xl text-white/70 leading-relaxed mb-8 max-w-3xl">
              From specialized staffing to enterprise-grade technology services, Ocean Blue delivers
              the expertise, execution, and support your organization needs to move faster and operate with confidence.
            </p>
            <Link
              href="/contact"
              className="group inline-flex items-center gap-2 px-8 py-4 bg-white text-gray-900 font-semibold rounded-xl hover:bg-gray-100 transition-all shadow-lg"
            >
              Start the Conversation
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Overview Section */}
      <section className="py-16 md:py-20 bg-white border-b border-gray-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl sm:text-4xl md:text-5xl font-light text-gray-900 mb-6"
            >
              The Services That Power Your{" "}
              <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent font-medium">
                Business Forward
              </span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-gray-500 text-lg leading-relaxed mb-8"
            >
              We help organizations modernize systems, strengthen teams, and accelerate digital
              transformation through a blend of IT staffing, consulting, and managed services.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-3 px-6 py-3 bg-gray-50 rounded-full border border-gray-200"
            >
              <span className="text-gray-600 font-medium">Our approach is simple:</span>
              <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent font-semibold">
                Expert talent. Proven delivery. Real business outcomes.
              </span>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Services Grid Navigation */}
      <section className="py-6 bg-white border-b border-gray-100 sticky top-[64px] md:top-[80px] z-40 backdrop-blur-md bg-white/95">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-3">
            {services.map((service, index) => (
              <motion.a
                key={service.id}
                href={`#${service.id}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all"
              >
                <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${service.color} flex items-center justify-center`}>
                  <service.icon className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 hidden sm:inline">{service.shortName}</span>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* Services Sections */}
      {services.map((service, index) => (
        <section
          key={service.id}
          id={service.id}
          className={`py-20 md:py-24 lg:py-32 relative overflow-hidden ${index % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
        >
          {/* Floating orb background */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 0.1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.5 }}
            className={`absolute ${index % 2 === 0 ? "top-20 -right-20" : "bottom-20 -left-20"} w-[400px] h-[400px] bg-gradient-to-br ${service.color.replace('500', '200')} rounded-full blur-3xl pointer-events-none`}
          />

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className={index % 2 === 0 ? "" : "lg:order-2"}
              >
                <div
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${service.color} text-white text-sm font-medium mb-6 shadow-lg`}
                >
                  <service.icon className="w-4 h-4" />
                  {service.tagline}
                </div>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-light text-gray-900 mb-6">
                  {service.title}
                </h2>
                <p className="text-gray-500 text-lg leading-relaxed mb-8">{service.description}</p>

                {/* Benefits */}
                <div className="space-y-4 mb-8">
                  {service.benefits.map((benefit, i) => (
                    <motion.div
                      key={benefit.text}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-center gap-4 group"
                    >
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${service.color} flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform`}>
                        <benefit.icon className="w-6 h-6 text-white" />
                      </div>
                      <span className="font-medium text-gray-800">{benefit.text}</span>
                    </motion.div>
                  ))}
                </div>

                {/* Platforms (if available) */}
                {service.platforms && (
                  <div className="mb-8">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Platforms:</h4>
                    <div className="flex flex-wrap gap-2">
                      {service.platforms.map((platform) => (
                        <span
                          key={platform}
                          className={`px-4 py-2 text-sm font-medium rounded-full bg-gradient-to-r ${service.color} text-white`}
                        >
                          {platform}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Engagement Models (if available) */}
                {service.engagementModels && (
                  <div className="mb-8">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Engagement Models:</h4>
                    <div className="flex flex-wrap gap-2">
                      {service.engagementModels.map((model) => (
                        <span
                          key={model}
                          className="px-4 py-2 text-sm font-medium rounded-full bg-gray-100 text-gray-700"
                        >
                          {model}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <Link
                  href="/contact"
                  className="group inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
                >
                  Get Started
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: index % 2 === 0 ? 30 : -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className={index % 2 === 0 ? "" : "lg:order-1"}
              >
                <div className="relative bg-white rounded-3xl border border-gray-100 p-8 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group">
                  {/* Corner accent */}
                  <div className={`absolute top-0 right-0 w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br ${service.color} opacity-[0.06] group-hover:opacity-[0.1] transition-opacity rounded-tr-3xl`} />

                  <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-lg bg-gradient-to-br ${service.color} flex items-center justify-center`}>
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </span>
                    {service.id === "staffing" ? "Capabilities Include" : "Services Include"}
                  </h3>
                  <ul className="space-y-4">
                    {service.capabilities.map((capability, i) => (
                      <motion.li
                        key={capability}
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-start gap-3 group/item"
                      >
                        <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${service.color} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                          <ChevronRight className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-gray-600 group-hover/item:text-gray-900 transition-colors">{capability}</span>
                      </motion.li>
                    ))}
                  </ul>

                  {/* Hover gradient overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${service.color} opacity-0 group-hover:opacity-[0.02] transition-opacity duration-500 pointer-events-none rounded-3xl`} />
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      ))}

      {/* Industries Section */}
      <section className="py-20 md:py-24 lg:py-32 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white relative overflow-hidden">
        {/* Animated orbs */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 20, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-20 -right-20 w-60 h-60 md:w-80 md:h-80 bg-blue-500/15 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            x: [0, -20, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute -bottom-20 -left-20 w-60 h-60 md:w-80 md:h-80 bg-cyan-500/15 rounded-full blur-3xl"
        />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-xs sm:text-sm font-medium text-gray-400 uppercase tracking-[0.2em] mb-4 block"
            >
              Industry Expertise
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-3xl sm:text-4xl md:text-5xl font-light text-white mb-6"
            >
              Trusted Across{" "}
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent font-medium">
                Industries
              </span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-white/60 text-lg"
            >
              We bring deep domain expertise to every engagement, delivering
              solutions tailored to your industry&apos;s unique challenges.
            </motion.p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {industries.map((industry, index) => (
              <motion.div
                key={industry}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center hover:bg-white/20 transition-all border border-white/10 hover:border-white/20 group cursor-pointer"
              >
                <span className="font-medium text-white group-hover:text-cyan-400 transition-colors">{industry}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-20 md:py-24 lg:py-32 bg-white relative overflow-hidden">
        {/* Floating orbs */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.1, scale: 1 }}
          transition={{ duration: 1.5 }}
          className="absolute top-20 -left-20 w-[400px] h-[400px] bg-blue-200 rounded-full blur-3xl pointer-events-none"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.1, scale: 1 }}
          transition={{ duration: 1.5, delay: 0.2 }}
          className="absolute bottom-20 -right-20 w-[300px] h-[300px] bg-cyan-200 rounded-full blur-3xl pointer-events-none"
        />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16 md:mb-20">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-xs sm:text-sm font-medium text-gray-400 uppercase tracking-[0.2em] mb-4 block"
            >
              Our Process
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-3xl sm:text-4xl md:text-5xl font-light text-gray-900 mb-6"
            >
              A Proven Approach to{" "}
              <span className="relative inline-block">
                <span className="relative z-10 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent font-medium">
                  Success
                </span>
                <motion.span
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="absolute -bottom-1 left-0 right-0 h-3 bg-gradient-to-r from-blue-200 to-cyan-200 opacity-40 -z-0 rounded-full"
                  style={{ originX: 0 }}
                />
              </span>
            </motion.h2>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {processSteps.map((phase, index) => (
              <motion.div
                key={phase.step}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group"
              >
                <div className="relative h-full bg-white rounded-3xl p-8 border border-gray-100 hover:border-gray-200 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 text-center overflow-hidden">
                  {/* Corner accent */}
                  <div className={`absolute top-0 left-0 w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br ${phase.gradient} opacity-[0.06] group-hover:opacity-[0.1] transition-opacity rounded-tl-3xl`} />

                  {/* Step number */}
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${phase.gradient} flex items-center justify-center mx-auto mb-6 text-white text-xl font-bold shadow-lg group-hover:scale-110 transition-transform`}>
                    {phase.step}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">{phase.title}</h3>
                  <p className="text-gray-500">{phase.description}</p>

                  {/* Hover gradient overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${phase.gradient} opacity-0 group-hover:opacity-[0.02] transition-opacity duration-500 pointer-events-none rounded-3xl`} />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 md:py-32 lg:py-40 overflow-hidden">
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
            {/* Animated icon */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              whileInView={{ scale: 1, rotate: 0 }}
              viewport={{ once: true }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-8 md:mb-10 rounded-2xl md:rounded-3xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-2xl"
            >
              <Sparkles className="w-8 h-8 md:w-10 md:h-10 text-white" />
            </motion.div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light text-white mb-5 md:mb-6 leading-tight">
              Let&apos;s Build
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-cyan-300 bg-clip-text text-transparent font-medium">
                What&apos;s Next
              </span>
            </h2>

            <p className="text-base md:text-lg text-white/50 mb-10 md:mb-12 max-w-2xl mx-auto leading-relaxed">
              Whether you need specialized talent, modern technology solutions, or long-term
              support — we&apos;re here to help.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="group relative px-7 md:px-8 py-3.5 md:py-4 bg-white text-gray-900 rounded-full hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl overflow-hidden"
              >
                <span className="relative z-10 flex items-center justify-center gap-2 font-medium text-sm md:text-base">
                  Start the Conversation
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>

              <Link
                href="/about"
                className="group px-7 md:px-8 py-3.5 md:py-4 bg-white/10 backdrop-blur-sm text-white rounded-full hover:bg-white/20 transition-all border border-white/20"
              >
                <span className="flex items-center justify-center gap-2 text-sm md:text-base">
                  Learn About Us
                </span>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
