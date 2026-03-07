"use client";

import { motion } from "framer-motion";
import { Zap, Cloud, Brain, Users, Shield, TrendingUp, ArrowRight } from "lucide-react";
import Link from "next/link";

const solutions = [
  {
    title: "Enterprise Transformation",
    description: "Modernize legacy systems with SAP, Oracle, and cloud-native solutions that scale with your business.",
    icon: Zap,
    gradient: "from-blue-500 to-indigo-600",
    bgGradient: "from-blue-500/10 to-indigo-500/10",
    stat: "40%",
    statLabel: "Efficiency Gain",
  },
  {
    title: "Cloud Infrastructure",
    description: "Migrate, optimize, and manage your cloud environment across AWS, Azure, and GCP.",
    icon: Cloud,
    gradient: "from-cyan-500 to-blue-600",
    bgGradient: "from-cyan-500/10 to-blue-500/10",
    stat: "99.9%",
    statLabel: "Uptime SLA",
  },
  {
    title: "AI & Data Analytics",
    description: "Turn data into actionable insights with machine learning and intelligent automation.",
    icon: Brain,
    gradient: "from-violet-500 to-purple-600",
    bgGradient: "from-violet-500/10 to-purple-500/10",
    stat: "3x",
    statLabel: "Faster Decisions",
  },
  {
    title: "IT Talent Solutions",
    description: "Access pre-vetted engineers, architects, and specialists ready to integrate with your team.",
    icon: Users,
    gradient: "from-teal-500 to-cyan-600",
    bgGradient: "from-teal-500/10 to-cyan-500/10",
    stat: "500+",
    statLabel: "Placements/Year",
  },
  {
    title: "Managed Services",
    description: "24/7 monitoring, maintenance, and support so you can focus on your business.",
    icon: Shield,
    gradient: "from-rose-500 to-pink-600",
    bgGradient: "from-rose-500/10 to-pink-500/10",
    stat: "24/7",
    statLabel: "Support Coverage",
  },
  {
    title: "Growth Enablement",
    description: "Strategic consulting and implementation that accelerate your digital transformation.",
    icon: TrendingUp,
    gradient: "from-amber-500 to-orange-600",
    bgGradient: "from-amber-500/10 to-orange-500/10",
    stat: "150+",
    statLabel: "Success Stories",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.4, 0.25, 1] as [number, number, number, number],
    },
  },
};

export default function SolutionsStack() {
  return (
    <section className="relative py-20 md:py-28 bg-[#FBFBF9] overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-100/50 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-100/50 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12 md:mb-16"
        >
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-block px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-sm font-medium mb-4"
          >
            Our Solutions
          </motion.span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-light text-gray-900 font-[family-name:var(--font-space-grotesk)] mb-4">
            Solutions that deliver{" "}
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent font-medium">
              real impact
            </span>
          </h2>
          <p className="text-gray-600 text-base md:text-lg max-w-2xl mx-auto">
            End-to-end technology services designed to transform your business and drive measurable results.
          </p>
        </motion.div>

        {/* Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
        >
          {solutions.map((solution) => {
            const Icon = solution.icon;
            return (
              <motion.div
                key={solution.title}
                variants={cardVariants}
                whileHover={{ y: -8, transition: { duration: 0.3 } }}
                className="group relative"
              >
                <div className={`relative h-full p-6 md:p-8 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden`}>
                  {/* Hover gradient background */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${solution.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

                  {/* Content */}
                  <div className="relative z-10">
                    {/* Icon & Stat */}
                    <div className="flex items-start justify-between mb-5">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${solution.gradient} flex items-center justify-center shadow-lg`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-right">
                        <span className={`block text-2xl font-bold bg-gradient-to-r ${solution.gradient} bg-clip-text text-transparent font-[family-name:var(--font-space-grotesk)]`}>
                          {solution.stat}
                        </span>
                        <span className="text-xs text-gray-500 uppercase tracking-wide">
                          {solution.statLabel}
                        </span>
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-semibold text-gray-900 mb-3 font-[family-name:var(--font-space-grotesk)] group-hover:text-gray-900 transition-colors">
                      {solution.title}
                    </h3>

                    {/* Description */}
                    <p className="text-gray-600 text-sm leading-relaxed mb-5">
                      {solution.description}
                    </p>

                    {/* Learn more link */}
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-400 group-hover:text-blue-600 transition-colors">
                      <span>Learn more</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>

                  {/* Corner decoration */}
                  <div className={`absolute -bottom-8 -right-8 w-32 h-32 rounded-full bg-gradient-to-br ${solution.gradient} opacity-5 group-hover:opacity-10 transition-opacity`} />
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-12 md:mt-16"
        >
          <Link
            href="/services"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gray-900 text-white rounded-full hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl group text-base font-medium"
          >
            Explore all services
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
