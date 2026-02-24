"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import {
  Lightbulb,
  Target,
  Rocket,
  TrendingUp,
  ArrowRight,
  Layers,
  Zap,
  Users,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const processSteps = [
  {
    number: "01",
    title: "Listen",
    description: "We start by understanding your goals, challenges, and environment.",
    icon: Lightbulb,
    gradient: "from-amber-500 to-orange-500",
    bg: "bg-amber-50",
  },
  {
    number: "02",
    title: "Plan",
    description: "We design a practical, outcome‑driven strategy tailored to your needs.",
    icon: Target,
    gradient: "from-blue-500 to-cyan-500",
    bg: "bg-blue-50",
  },
  {
    number: "03",
    title: "Build",
    description: "We execute with agility, transparency, and continuous collaboration.",
    icon: Rocket,
    gradient: "from-purple-500 to-pink-500",
    bg: "bg-purple-50",
  },
  {
    number: "04",
    title: "Evolve",
    description: "We support long‑term success with ongoing optimization and guidance.",
    icon: TrendingUp,
    gradient: "from-emerald-500 to-teal-500",
    bg: "bg-emerald-50",
  },
];

const capabilities = [
  {
    name: "IT Staffing & Talent Solutions",
    description: "Skilled, vetted professionals across cloud, cybersecurity, ERP, Salesforce, data, and more.",
    icon: Users,
    gradient: "from-blue-500 to-indigo-500",
  },
  {
    name: "Enterprise IT Services",
    description: "Cloud, ERP, Salesforce, AI, and integration services designed for real business outcomes.",
    icon: Layers,
    gradient: "from-cyan-500 to-blue-500",
  },
  {
    name: "Managed Services",
    description: "Proactive support, monitoring, and optimization to keep your systems running smoothly.",
    icon: Zap,
    gradient: "from-amber-500 to-orange-500",
  },
  {
    name: "Digital Transformation & Advisory",
    description: "Strategy, architecture, and process optimization that align technology with business goals.",
    icon: Target,
    gradient: "from-rose-500 to-pink-500",
  },
  
];

const certifications = [
  { name: "Ohio WBE", logo: "/wbe.png" },
  { name: "OHIO MBE", logo: "/ohiombe.png" },
  { name: "Ohio Edge", logo: "/edge.png" },
  { name: "MBE", logo: "/mbe.png" },
];

export default function ConsultingShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const y1 = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, 60]);
  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0.2, 0.4, 0.4, 0.2]);

  return (
    <section
      ref={containerRef}
      className="relative py-20 md:py-24 lg:py-32 bg-[#f4f6f4] overflow-hidden"
    >
      {/* Elegant background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-50 via-white to-white" />

        {/* Animated floating elements */}
        <motion.div
          style={{ y: y1, opacity }}
          className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full blur-3xl"
        />
        <motion.div
          style={{ y: y2, opacity }}
          className="absolute bottom-20 right-10 w-80 h-80 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full blur-3xl"
        />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-16 md:mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-4 md:mb-6"
          >
            <span className="text-xs sm:text-sm font-medium text-gray-400 tracking-[0.2em] uppercase">
              How we work
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="heading-section text-gray-900 mb-5 md:mb-6"
          >
            We Deliver the Technology and Talent That Move Your 
            <br />
            <span className="relative inline-block">
              <span className="relative z-10 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent font-medium">
                 Business Forward
              </span>
              <motion.span
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="absolute -bottom-1 left-0 right-0 h-3 bg-gradient-to-r from-blue-200 to-cyan-200 opacity-50 -z-0 rounded-full"
                style={{ originX: 0 }}
              />
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-base md:text-lg text-gray-500 leading-relaxed"
          >
            From IT staffing to enterprise solutions, Ocean Blue helps organizations build stronger teams, modernize systems, and accelerate digital transformation — without the complexity.
          </motion.p>
        </div>

        {/* Process Steps */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 mb-20 md:mb-24">
          {processSteps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group"
              >
                <div className="relative bg-[#f2f2f2] rounded-2xl p-6 md:p-8 border border-gray-100 hover:border-gray-200 transition-all duration-300 card-lift h-full">
                  {/* Step number */}
                  <div className="absolute top-5 right-5 md:top-6 md:right-6">
                    <span className="text-2xl md:text-3xl font-light text-gray-200 font-[family-name:var(--font-space-grotesk)]">
                      {step.number}
                    </span>
                  </div>

                  {/* Icon */}
                  <div
                    className={`w-12 h-12 md:w-14 md:h-14 rounded-xl ${step.bg} flex items-center justify-center mb-4 md:mb-5 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <div className={`w-6 h-6 md:w-7 md:h-7 bg-gradient-to-br ${step.gradient} rounded-lg flex items-center justify-center`}>
                      <Icon className="w-4 h-4 md:w-4.5 md:h-4.5 text-white" />
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className="text-lg md:text-xl font-medium text-gray-900 mb-2 md:mb-3">
                    {step.title}
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {step.description}
                  </p>

                  {/* Decorative corner line */}
                  <div className="absolute bottom-4 right-4 w-8 h-8 border-b border-r border-gray-100 rounded-br-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Capabilities - Two column layout */}
        <div className="grid lg:grid-cols-2 gap-10 md:gap-12 items-center mb-20 md:mb-24">
          {/* Left side - Text */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-xs sm:text-sm font-medium text-gray-400 uppercase tracking-[0.2em] mb-4 block">
              What we bring
            </span>

            <h3 className="heading-subsection text-gray-900 mb-5 md:mb-6">
              More than just
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent font-medium">
                technical expertise
              </span>
            </h3>

            <p className="text-gray-500 leading-relaxed mb-6 md:mb-8 text-sm md:text-base">
              We combine deep industry knowledge with practical experience.
              Our team has been where you are — we understand the challenges
              because we've solved them before.
            </p>

            <Link
              href="/services"
              className="inline-flex items-center gap-2 text-gray-900 hover:text-blue-600 transition-colors group font-medium text-sm md:text-base"
            >
              <span>Explore our services</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>

          {/* Right side - Capabilities grid */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="grid gap-2 md:gap-3"
          >
            {capabilities.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08 }}
                  className="group flex items-start gap-3 md:gap-4 p-3 md:p-4 rounded-xl hover:bg-gray-50 transition-colors cursor-default"
                >
                  <div className={`w-9 h-9 md:w-10 md:h-10 rounded-lg bg-gradient-to-br ${item.gradient} flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-105 transition-transform`}>
                    <Icon className="w-4 h-4 md:w-5 md:h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 mb-0.5 text-sm md:text-base">
                      {item.name}
                    </h4>
                    <p className="text-xs md:text-sm text-gray-500">{item.description}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-400 group-hover:translate-x-1 transition-all ml-auto flex-shrink-0 mt-0.5" />
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        {/* Certifications */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative p-8 md:p-12 lg:p-16 overflow-hidden bg-white border-radius rounded-2xl"
        >
         

          <div className="relative z-10 ">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-center mb-10 md:mb-14"
            >
              <span className="text-xs sm:text-sm font-medium text-gray-400 uppercase tracking-[0.2em] mb-3 block">
                Trusted & Certified
              </span>
              <h3 className="text-2xl md:text-3xl font-light text-black font-[family-name:var(--font-space-grotesk)]">
                Our{" "}
                <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent font-medium">
                  Certifications
                </span>
              </h3>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 max-w-4xl mx-auto ">
              {certifications.map((cert, index) => (
                <motion.div
                  key={cert.name}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 + index * 0.08 }}
                  className="group"
                >
                  <div className=" backdrop-blur-sm rounded-2xl p-6 md:p-8 transition-all duration-300 flex flex-col items-center justify-center h-32 md:h-40">
                    <Image
                      src={cert.logo}
                      alt={cert.name}
                      width={140}
                      height={80}
                      className="h-16 md:h-20 w-auto object-contain opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300"
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-center mt-16 md:mt-20"
        >
          <p className="text-gray-500 mb-5 md:mb-6 text-sm md:text-base">
            Ready to have an honest conversation about your challenges?
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-3 px-6 md:px-8 py-3.5 md:py-4 bg-gray-900 text-white rounded-full hover:bg-gray-800 transition-all shadow-sm hover:shadow-lg group"
          >
            <span className="font-medium text-sm md:text-base">Let's talk</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
