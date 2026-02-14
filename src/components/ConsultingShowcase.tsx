"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import {
  Lightbulb,
  Target,
  Rocket,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

const processSteps = [
  {
    number: "01",
    title: "Discover",
    description: "Deep dive into your business challenges and opportunities",
    icon: Lightbulb,
    color: "from-amber-400 to-orange-500",
  },
  {
    number: "02",
    title: "Strategize",
    description: "Craft tailored solutions aligned with your goals",
    icon: Target,
    color: "from-blue-400 to-cyan-500",
  },
  {
    number: "03",
    title: "Execute",
    description: "Implement with precision and agile methodology",
    icon: Rocket,
    color: "from-purple-400 to-pink-500",
  },
  {
    number: "04",
    title: "Transform",
    description: "Measure results and drive continuous improvement",
    icon: TrendingUp,
    color: "from-emerald-400 to-teal-500",
  },
];

const capabilities = [
  "Enterprise Architecture",
  "Digital Strategy",
  "Process Optimization",
  "Change Management",
  "Technology Integration",
  "Performance Analytics",
];

export default function ConsultingShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const y1 = useTransform(scrollYProgress, [0, 1], [100, -100]);
  const y2 = useTransform(scrollYProgress, [0, 1], [-50, 50]);
  const rotate = useTransform(scrollYProgress, [0, 1], [0, 15]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.8, 1, 0.9]);

  return (
    <section
      ref={containerRef}
      className="relative py-24 lg:py-32 bg-gradient-to-b from-slate-50 via-white to-blue-50 overflow-hidden"
    >
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating Orbs */}
        <motion.div
          style={{ y: y1 }}
          className="absolute top-20 left-[10%] w-72 h-72 bg-gradient-to-br from-blue-200/40 to-cyan-200/40 rounded-full blur-3xl"
        />
        <motion.div
          style={{ y: y2 }}
          className="absolute bottom-20 right-[10%] w-96 h-96 bg-gradient-to-br from-purple-200/30 to-pink-200/30 rounded-full blur-3xl"
        />
        <motion.div
          style={{ y: y1, rotate }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-blue-200/30 rounded-full"
        />
        <motion.div
          style={{ y: y2, rotate }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-blue-100/20 rounded-full"
        />

        {/* Grid Pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(to right, #1e3a8a 1px, transparent 1px),
                             linear-gradient(to bottom, #1e3a8a 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <div className="container-custom relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease: [0.25, 0.4, 0.25, 1] }}
          className="text-center max-w-4xl mx-auto mb-20"
        >
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 font-semibold text-sm rounded-full mb-6"
          >
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            Our Approach
          </motion.span>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 mb-6 leading-tight">
            Transform Ideas Into{" "}
            <span className="relative">
              <span className="bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 bg-clip-text text-transparent">
                Impactful Results
              </span>
              <motion.span
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
                className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-cyan-500 origin-left rounded-full"
              />
            </span>
          </h2>

          <p className="text-lg md:text-xl text-slate-600 leading-relaxed max-w-3xl mx-auto">
            We combine deep industry expertise with innovative technology solutions
            to help enterprises navigate complexity and achieve sustainable growth.
          </p>
        </motion.div>

        {/* Process Steps - 3D Card Layout */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {processSteps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 60, rotateX: 10 }}
              whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{
                duration: 0.6,
                delay: index * 0.15,
                ease: [0.25, 0.4, 0.25, 1],
              }}
              whileHover={{
                y: -10,
                transition: { duration: 0.3 },
              }}
              className="group relative"
              style={{ perspective: "1000px" }}
            >
              <div className="relative bg-white rounded-2xl p-8 border border-slate-200 shadow-lg shadow-slate-200/50 hover:shadow-xl hover:shadow-blue-200/30 transition-all duration-500 overflow-hidden h-full">
                {/* Background Gradient on Hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${step.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />

                {/* Step Number */}
                <div className="absolute top-4 right-4">
                  <span className="text-5xl font-bold text-slate-100 group-hover:text-blue-100 transition-colors">
                    {step.number}
                  </span>
                </div>

                {/* Icon */}
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className={`relative w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-6 shadow-lg group-hover:shadow-xl transition-shadow`}
                >
                  <step.icon className="w-8 h-8 text-white" />
                </motion.div>

                {/* Content */}
                <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-blue-700 transition-colors">
                  {step.title}
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  {step.description}
                </p>

                {/* Bottom Accent Line */}
                <motion.div
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + index * 0.1, duration: 0.6 }}
                  className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${step.color} origin-left`}
                />
              </div>

              {/* Connector Line (for desktop) */}
              {index < processSteps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-0.5 bg-gradient-to-r from-slate-300 to-transparent" />
              )}
            </motion.div>
          ))}
        </div>

        {/* Capabilities Section */}
        <motion.div
          style={{ scale }}
          className="relative bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 rounded-3xl p-8 md:p-12 lg:p-16 overflow-hidden"
        >
          {/* Background Effects */}
          <div className="absolute inset-0">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-500/10 rounded-full blur-3xl" />
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
                backgroundSize: "32px 32px",
              }}
            />
          </div>

          <div className="relative z-10 grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div>
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="inline-block px-4 py-2 bg-cyan-500/20 text-cyan-400 font-semibold text-sm rounded-full mb-6"
              >
                Core Capabilities
              </motion.span>

              <motion.h3
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1, duration: 0.6 }}
                className="text-3xl md:text-4xl font-bold text-white mb-6"
              >
                End-to-End Consulting Excellence
              </motion.h3>

              <motion.p
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="text-lg text-slate-300 mb-8 leading-relaxed"
              >
                Our multidisciplinary team brings together strategic thinking,
                technical expertise, and industry knowledge to deliver solutions
                that create lasting value.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3, duration: 0.6 }}
              >
                <Link
                  href="/services"
                  className="group inline-flex items-center gap-3 px-6 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-xl hover:from-cyan-400 hover:to-blue-400 transition-all shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40"
                >
                  Explore All Services
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </motion.div>
            </div>

            {/* Right - Capabilities Grid */}
            <div className="grid grid-cols-2 gap-4">
              {capabilities.map((capability, index) => (
                <motion.div
                  key={capability}
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  whileHover={{ scale: 1.02, x: 5 }}
                  className="flex items-center gap-3 p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:border-cyan-500/30 hover:bg-white/10 transition-all cursor-default"
                >
                  <CheckCircle2 className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                  <span className="text-white font-medium">{capability}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
