"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Target,
  Heart,
  Award,
  Globe,
  Users,
  Building2,
  TrendingUp,
  Lightbulb,
  Shield,
  Zap,
  Sparkles,
  Clock,
  Cpu,
  MessageSquare,
  Briefcase,
  CheckCircle2,
} from "lucide-react";

// How We Work - Our Approach
const approach = [
  {
    icon: Target,
    title: "Outcome-First",
    description: "We focus on business impact, not buzzwords.",
    gradient: "from-blue-600 to-cyan-600",
  },
  {
    icon: Award,
    title: "Expert-Led Execution",
    description: "Senior-level talent drives every engagement.",
    gradient: "from-violet-600 to-purple-600",
  },
  {
    icon: Cpu,
    title: "AI-Enabled by Default",
    description: "We leverage intelligent tools and automation to accelerate results.",
    gradient: "from-amber-500 to-orange-500",
  },
  {
    icon: Shield,
    title: "Security at the Core",
    description: "Every solution is built with compliance and protection in mind.",
    gradient: "from-emerald-500 to-teal-500",
  },
  {
    icon: MessageSquare,
    title: "Human-Centered Delivery",
    description: "Clear communication. Collaborative execution. No surprises.",
    gradient: "from-rose-500 to-pink-500",
  },
];

// What Sets Us Apart
const differentiators = [
  {
    icon: Users,
    title: "Specialized Talent",
    description: "We provide highly skilled IT professionals who integrate seamlessly into your teams.",
    gradient: "from-blue-600 to-cyan-600",
  },
  {
    icon: Building2,
    title: "Enterprise-Grade Solutions",
    description: "From cloud to ERP to AI, we deliver technology that scales.",
    gradient: "from-violet-600 to-purple-600",
  },
  {
    icon: CheckCircle2,
    title: "Proven Delivery",
    description: "We execute with precision, transparency, and accountability.",
    gradient: "from-amber-500 to-orange-500",
  },
  {
    icon: Briefcase,
    title: "Industry Expertise",
    description: "Healthcare, government, financial services, manufacturing, retail, and technology.",
    gradient: "from-emerald-500 to-teal-500",
  },
  {
    icon: Heart,
    title: "Long-Term Partnership",
    description: "We don't just deliver projects — we support your evolution.",
    gradient: "from-rose-500 to-pink-500",
  },
];
const milestones = [
  {
    year: "2013",
    title: "Foundation",
    description: "Ocean Blue Corporation founded with a vision to transform enterprise IT",
  },
  {
    year: "2015",
    title: "MSA with First Prime Vendor",
    description: "Established first Master Service Agreement with a prime vendor, expanding service delivery capabilities",
  },
  {
    year: "2021",
    title: "MSA with Major Client",
    description: "Secured Master Service Agreement with a Fortune 500 enterprise client, marking significant growth",
  },
  {
    year: "2022",
    title: "Global Expansion to India",
    description: "Strategic expansion into Indian market with new delivery center and local operations",
  },
  {
    year: "2024",
    title: "Offices in UK",
    description: "Opened new offices in United Kingdom to strengthen European presence and client services",
  },
  {
    year: "2025",
    title: "AI Practice Launch",
    description: "Launched dedicated AI practice to deliver cutting-edge artificial intelligence solutions",
  },
];
const leadership = [
  {
    name: "Sarojini Gude",
    role: "President",
    initials: "SG",
  },
  {
    name: "Brent Wallace",
    role: "SVP, Workforce Solutions",
    initials: "BW",
  },
  {
    name: "Sushma Moturu",
    role: "Human Resource Manager",
    initials: "SM",
  },
  {
    name: "Clark Cristofoli",
    role: "Executive Recruiter",
    initials: "CC",
  },
];

{/*const stats = [
  { value: "500+", label: "Enterprise Clients", icon: Building2, gradient: "from-blue-600 to-cyan-600" },
  { value: "2,500+", label: "Team Members", icon: Users, gradient: "from-amber-500 to-orange-500" },
  { value: "25+", label: "Global Offices", icon: Globe, gradient: "from-emerald-500 to-teal-500" },
  { value: "98%", label: "Client Retention", icon: TrendingUp, gradient: "from-violet-500 to-purple-500" },
];
*/}

export default function AboutPage() {
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
              <span className="text-sm font-medium text-white/90">Purpose-Driven Technology. Human-Centered Delivery.</span>
            </motion.div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-light text-white mb-6 leading-tight">
              We Build Technology and Teams That{" "}
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent font-medium">
                Move Organizations Forward
              </span>
            </h1>
            <p className="text-xl text-white/60 leading-relaxed">
              Ocean Blue is a trusted partner for IT staffing, enterprise solutions, and digital transformation — delivering clarity, expertise, and measurable results.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats Section *
      <section className="py-16 md:py-20 bg-white border-b border-gray-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center group"
              >
                <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <stat.icon className="w-7 h-7 md:w-8 md:h-8 text-white" />
                </div>
                <p className="text-3xl md:text-4xl font-light text-gray-900 mb-1 font-[family-name:var(--font-space-grotesk)]">{stat.value}</p>
                <p className="text-sm md:text-base text-gray-500">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section*/}

      {/* Our Story & Our Purpose */}
      <section className="py-20 md:py-24 lg:py-32 bg-gray-50 relative overflow-hidden">
        {/* Floating orbs */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.1, scale: 1 }}
          transition={{ duration: 1.5 }}
          className="absolute top-20 -right-20 w-[400px] h-[400px] bg-blue-200 rounded-full blur-3xl pointer-events-none"
        />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-6 md:gap-8">
            {/* Our Story */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="group"
            >
              <div className="relative h-full bg-white rounded-3xl border border-gray-100 p-8 md:p-12 hover:border-gray-200 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden">
                {/* Corner accent */}
                <div className="absolute top-0 left-0 w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-blue-600 to-cyan-600 opacity-[0.06] group-hover:opacity-[0.1] transition-opacity rounded-tl-3xl" />

                <div className="relative mb-6">
                  <div className="absolute -inset-2 bg-gradient-to-br from-blue-600 to-cyan-600 opacity-10 rounded-2xl blur-xl group-hover:opacity-20 transition-opacity" />
                  <div className="relative w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                    <Lightbulb className="w-7 h-7 md:w-8 md:h-8 text-white" />
                  </div>
                </div>

                <span className="text-xs sm:text-sm font-medium text-gray-400 uppercase tracking-[0.2em] mb-2 block">
                  Our Story
                </span>
                <h2 className="text-2xl md:text-3xl font-light text-gray-900 mb-4 group-hover:text-blue-600 transition-colors">
                  Who We{" "}
                  <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent font-medium">
                    Are
                  </span>
                </h2>
                <p className="text-gray-500 leading-relaxed mb-4">
                  Ocean Blue was founded on a simple belief:
                </p>
                <p className="text-lg font-medium text-gray-800 mb-4 italic">
                  &ldquo;Technology should empower people, not complicate their work.&rdquo;
                </p>
                <p className="text-gray-500 leading-relaxed">
                  We help organizations modernize systems, strengthen teams, and adopt the technologies that drive real business impact — all with a human-centered approach that values clarity, collaboration, and execution.
                </p>

                {/* Hover gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-cyan-600 opacity-0 group-hover:opacity-[0.02] transition-opacity duration-500 pointer-events-none rounded-3xl" />
              </div>
            </motion.div>

            {/* Our Purpose */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="group"
            >
              <div className="relative h-full bg-white rounded-3xl border border-gray-100 p-8 md:p-12 hover:border-gray-200 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden">
                {/* Corner accent */}
                <div className="absolute top-0 right-0 w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-violet-600 to-purple-600 opacity-[0.06] group-hover:opacity-[0.1] transition-opacity rounded-tr-3xl" />

                <div className="relative mb-6">
                  <div className="absolute -inset-2 bg-gradient-to-br from-violet-600 to-purple-600 opacity-10 rounded-2xl blur-xl group-hover:opacity-20 transition-opacity" />
                  <div className="relative w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                    <Target className="w-7 h-7 md:w-8 md:h-8 text-white" />
                  </div>
                </div>

                <span className="text-xs sm:text-sm font-medium text-gray-400 uppercase tracking-[0.2em] mb-2 block">
                  Our Purpose
                </span>
                <h2 className="text-2xl md:text-3xl font-light text-gray-900 mb-4 group-hover:text-violet-600 transition-colors">
                  Why We{" "}
                  <span className="bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent font-medium">
                    Exist
                  </span>
                </h2>
                <p className="text-gray-500 leading-relaxed mb-4">
                  To empower organizations with the technology, talent, and support they need to operate smarter, faster, and more securely.
                </p>
                <p className="text-gray-500 leading-relaxed">
                  We combine deep technical expertise with a commitment to service — ensuring every engagement delivers meaningful outcomes.
                </p>

                {/* Hover gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-violet-600 to-purple-600 opacity-0 group-hover:opacity-[0.02] transition-opacity duration-500 pointer-events-none rounded-3xl" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Our Approach - How We Work */}
      <section className="py-20 md:py-24 lg:py-32 bg-white relative overflow-hidden">
        {/* Floating orb backgrounds */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.1, scale: 1 }}
          transition={{ duration: 1.5 }}
          className="absolute top-40 -right-20 w-[400px] h-[400px] bg-violet-200 rounded-full blur-3xl pointer-events-none"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.1, scale: 1 }}
          transition={{ duration: 1.5, delay: 0.2 }}
          className="absolute bottom-20 -left-20 w-[300px] h-[300px] bg-cyan-200 rounded-full blur-3xl pointer-events-none"
        />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center mb-16 md:mb-20">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-xs sm:text-sm font-medium text-gray-400 uppercase tracking-[0.2em] mb-4 block"
            >
              Our Approach
            </motion.span>

            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-3xl sm:text-4xl md:text-5xl font-light text-gray-900 mb-6"
            >
              How We{" "}
              <span className="relative inline-block">
                <span className="relative z-10 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent font-medium">
                  Work
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

          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {approach.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group"
              >
                <div className="relative h-full bg-white rounded-3xl p-6 md:p-8 border border-gray-100 hover:border-gray-200 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 text-center overflow-hidden">
                  {/* Corner accent */}
                  <div
                    className={`absolute top-0 right-0 w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br ${item.gradient} opacity-[0.06] group-hover:opacity-[0.1] transition-opacity rounded-tr-3xl`}
                  />

                  {/* Icon */}
                  <div className="relative mb-5 inline-block">
                    <div
                      className={`absolute -inset-2 bg-gradient-to-br ${item.gradient} opacity-10 rounded-2xl blur-xl group-hover:opacity-20 transition-opacity`}
                    />
                    <div
                      className={`relative w-14 h-14 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}
                    >
                      <item.icon className="w-7 h-7 text-white" />
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {item.description}
                  </p>

                  {/* Hover gradient overlay */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-[0.02] transition-opacity duration-500 pointer-events-none rounded-3xl`}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

       {/* Timeline Section */}
      <section className="py-20 md:py-24 lg:py-32 bg-gray-50 relative overflow-hidden">
        {/* Floating orb backgrounds */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.1, scale: 1 }}
          transition={{ duration: 1.5 }}
          className="absolute bottom-20 -right-20 w-[400px] h-[400px] bg-cyan-200 rounded-full blur-3xl pointer-events-none"
        />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center mb-16 md:mb-20">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-xs sm:text-sm font-medium text-gray-400 uppercase tracking-[0.2em] mb-4 block"
            >
              Our Journey
            </motion.span>

            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-3xl sm:text-4xl md:text-5xl font-light text-gray-900 mb-6"
            >
              Milestones That{" "}
              <span className="relative inline-block">
                <span className="relative z-10 bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent font-medium">
                  Define Us
                </span>
                <motion.span
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="absolute -bottom-1 left-0 right-0 h-3 bg-gradient-to-r from-cyan-200 to-blue-200 opacity-40 -z-0 rounded-full"
                  style={{ originX: 0 }}
                />
              </span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-gray-500 text-lg leading-relaxed"
            >
              From our humble beginnings to becoming a global leader, every milestone
              represents our commitment to growth and excellence.
            </motion.p>
          </div>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-cyan-400 to-blue-600 hidden lg:block" />

            <div className="space-y-8 lg:space-y-0">
              {milestones.map((milestone, index) => {
                const gradients = [
                  "from-blue-600 to-cyan-600",
                  "from-violet-600 to-purple-600",
                  "from-amber-500 to-orange-500",
                  "from-emerald-500 to-teal-500",
                  "from-rose-500 to-pink-500",
                  "from-indigo-600 to-blue-600",
                ];
                const gradient = gradients[index % gradients.length];

                return (
                  <motion.div
                    key={milestone.year}
                    initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className={`lg:flex items-center ${
                      index % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"
                    }`}
                  >
                    <div className="lg:w-1/2 lg:px-12">
                      <div
                        className={`group relative bg-white rounded-3xl border border-gray-100 p-6 md:p-8 hover:border-gray-200 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden ${
                          index % 2 === 0 ? "lg:text-right" : "lg:text-left"
                        }`}
                      >
                        {/* Corner accent */}
                        <div
                          className={`absolute ${index % 2 === 0 ? "top-0 right-0 rounded-tr-3xl" : "top-0 left-0 rounded-tl-3xl"} w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br ${gradient} opacity-[0.06] group-hover:opacity-[0.1] transition-opacity`}
                        />

                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold bg-gradient-to-r ${gradient} text-white shadow-sm mb-3`}>
                          {milestone.year}
                        </span>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                          {milestone.title}
                        </h3>
                        <p className="text-gray-500">
                          {milestone.description}
                        </p>

                        {/* Hover gradient overlay */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-[0.02] transition-opacity duration-500 pointer-events-none rounded-3xl`} />
                      </div>
                    </div>

                    {/* Timeline dot */}
                    <div className={`hidden lg:flex w-12 h-12 rounded-full bg-gradient-to-br ${gradient} items-center justify-center z-10 mx-auto shadow-lg`}>
                      <CheckCircle2 className="w-6 h-6 text-white" />
                    </div>

                    <div className="lg:w-1/2" />
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* What Sets Us Apart */}
      <section className="py-20 md:py-24 lg:py-32 bg-gray-50 relative overflow-hidden">
        {/* Floating orb backgrounds */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.1, scale: 1 }}
          transition={{ duration: 1.5 }}
          className="absolute bottom-20 -right-20 w-[400px] h-[400px] bg-cyan-200 rounded-full blur-3xl pointer-events-none"
        />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center mb-16 md:mb-20">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-xs sm:text-sm font-medium text-gray-400 uppercase tracking-[0.2em] mb-4 block"
            >
              What Sets Us Apart
            </motion.span>

            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-3xl sm:text-4xl md:text-5xl font-light text-gray-900 mb-6"
            >
              A Partner You Can{" "}
              <span className="relative inline-block">
                <span className="relative z-10 bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent font-medium">
                  Trust
                </span>
                <motion.span
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="absolute -bottom-1 left-0 right-0 h-3 bg-gradient-to-r from-violet-200 to-purple-200 opacity-40 -z-0 rounded-full"
                  style={{ originX: 0 }}
                />
              </span>
            </motion.h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {differentiators.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group"
              >
                <div className="relative h-full bg-white rounded-3xl p-6 md:p-8 border border-gray-100 hover:border-gray-200 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 text-center overflow-hidden">
                  {/* Corner accent */}
                  <div
                    className={`absolute top-0 right-0 w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br ${item.gradient} opacity-[0.06] group-hover:opacity-[0.1] transition-opacity rounded-tr-3xl`}
                  />

                  {/* Icon */}
                  <div className="relative mb-5 inline-block">
                    <div
                      className={`absolute -inset-2 bg-gradient-to-br ${item.gradient} opacity-10 rounded-2xl blur-xl group-hover:opacity-20 transition-opacity`}
                    />
                    <div
                      className={`relative w-14 h-14 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}
                    >
                      <item.icon className="w-7 h-7 text-white" />
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {item.description}
                  </p>

                  {/* Hover gradient overlay */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-[0.02] transition-opacity duration-500 pointer-events-none rounded-3xl`}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Leadership Section */}
      <section className="py-20 md:py-24 lg:py-32 bg-white relative overflow-hidden">
        {/* Floating orb backgrounds */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.1, scale: 1 }}
          transition={{ duration: 1.5 }}
          className="absolute top-20 -left-20 w-[400px] h-[400px] bg-blue-200 rounded-full blur-3xl pointer-events-none"
        />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center mb-16 md:mb-20">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-xs sm:text-sm font-medium text-gray-400 uppercase tracking-[0.2em] mb-4 block"
            >
              Leadership
            </motion.span>

            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-3xl sm:text-4xl md:text-5xl font-light text-gray-900 mb-6"
            >
              Meet Our{" "}
              <span className="relative inline-block">
                <span className="relative z-10 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent font-medium">
                  Team
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

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {leadership.map((leader, index) => {
              const gradients = [
                "from-blue-600 to-cyan-600",
                "from-indigo-600 to-purple-600",
                "from-amber-500 to-orange-500",
                "from-emerald-500 to-teal-500",
              ];
              const gradient = gradients[index % gradients.length];

              return (
                <motion.div
                  key={leader.name}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="group"
                >
                  <div className="relative h-full bg-gray-50 rounded-3xl p-8 border border-gray-100 hover:border-gray-200 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 text-center overflow-hidden">
                    {/* Corner accent */}
                    <div
                      className={`absolute bottom-0 right-0 w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br ${gradient} opacity-[0.06] group-hover:opacity-[0.1] transition-opacity rounded-br-3xl`}
                    />

                    {/* Avatar */}
                    <div className="relative mb-6 inline-block">
                      <div
                        className={`absolute -inset-2 bg-gradient-to-br ${gradient} opacity-10 rounded-full blur-xl group-hover:opacity-20 transition-opacity`}
                      />
                      <div
                        className={`relative w-24 h-24 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg group-hover:scale-105 transition-all duration-300 text-white text-2xl font-bold`}
                      >
                        {leader.initials}
                      </div>
                    </div>

                    {/* Content */}
                    <h3 className="text-xl font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                      {leader.name}
                    </h3>
                    <p className={`bg-gradient-to-r ${gradient} bg-clip-text text-transparent font-medium`}>
                      {leader.role}
                    </p>

                    {/* Hover gradient overlay */}
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-[0.02] transition-opacity duration-500 pointer-events-none rounded-3xl`}
                    />
                  </div>
                </motion.div>
              );
            })}
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
              Let&apos;s Build What&apos;s Next
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-cyan-300 bg-clip-text text-transparent font-medium">
                — Together
              </span>
            </h2>

            <p className="text-base md:text-lg text-white/50 mb-10 md:mb-12 max-w-2xl mx-auto leading-relaxed">
              Whether you&apos;re scaling your team or modernizing your technology, Ocean Blue is ready to help.
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
                href="/careers"
                className="group px-7 md:px-8 py-3.5 md:py-4 bg-white/10 backdrop-blur-sm text-white rounded-full hover:bg-white/20 transition-all border border-white/20"
              >
                <span className="flex items-center justify-center gap-2 text-sm md:text-base">
                  View Careers
                </span>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
