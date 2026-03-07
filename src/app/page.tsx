"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";

// Components
import HeroSection from "@/components/HeroSection";
import PartnersCloud from "@/components/PartnersCloud";
import StatsSection from "@/components/StatsSection";
import IndustriesSection from "@/components/IndustriesSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import SolutionsStack from "@/components/SolutionsStack";

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="bg-white relative overflow-hidden">
      {/* Hero Section with split layout and 3D background */}
      <HeroSection />

      {/* Partners Cloud */}
      <PartnersCloud />

      {/* Solutions Grid */}
      <SolutionsStack />

      {/* Statistics */}
      <StatsSection />

      

      {/* Testimonials - compact */}
      <TestimonialsSection />

    
      {/* CTA Section with Wave Background */}
      <section className="relative pt-20 pb-20 md:pt-28 md:pb-28 overflow-hidden">
        {/* Dark gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900" />

        {/* Smooth curve transition from white */}
        <div className="absolute -top-px left-0 right-0">
          <svg viewBox="0 0 1440 120" className="w-full h-auto" preserveAspectRatio="none">
            <path
              fill="white"
              d="M0,0 L1440,0 L1440,40 Q1080,120 720,60 Q360,0 0,80 L0,0 Z"
            />
          </svg>
        </div>

        {/* Animated background orbs */}
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 -left-20 w-72 h-72 bg-blue-600/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.15, 0.3, 0.15] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-1/4 -right-20 w-72 h-72 bg-cyan-600/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 4 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl"
        />

        {/* Floating particles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            animate={{
              y: [0, -30, 0],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 4 + i,
              repeat: Infinity,
              delay: i * 0.5,
              ease: "easeInOut",
            }}
            className="absolute w-2 h-2 rounded-full bg-cyan-400/40"
            style={{
              left: `${15 + i * 15}%`,
              top: `${30 + (i % 3) * 20}%`,
            }}
          />
        ))}

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 mt-24
        ">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto text-center"
          >

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-light text-white mb-6 font-[family-name:var(--font-space-grotesk)] leading-tight">
              Ready to strengthen{" "}
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent font-medium">
                your team?
              </span>
            </h2>

            <p className="text-base md:text-lg text-gray-400 mb-10 max-w-lg mx-auto leading-relaxed">
              Let&apos;s talk about your goals — no jargon, no pressure. Just real solutions for real challenges.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="group px-8 py-4 bg-white text-gray-900 rounded-full hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl text-base font-medium inline-flex items-center justify-center gap-2"
              >
                Start the conversation
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                href="/services"
                className="group px-8 py-4 bg-white/10 backdrop-blur-sm text-white rounded-full hover:bg-white/20 transition-all border border-white/20 text-base font-medium inline-flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4" />
                See how we work
              </Link>
            </div>

            {/* Trust indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="mt-12 flex items-center justify-center gap-8 text-gray-500"
            >
            </motion.div>
          </motion.div>
        </div>

        {/* Wave bottom */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" className="w-full h-auto" preserveAspectRatio="none">
            <path
              fill="rgba(255,255,255,0.03)"
              d="M0,40 C480,100 960,0 1440,60 L1440,120 L0,120 Z"
            />
            <path
              fill="rgba(255,255,255,0.02)"
              d="M0,70 C360,30 720,90 1080,50 C1280,30 1380,60 1440,40 L1440,120 L0,120 Z"
            />
          </svg>
        </div>
      </section>
    </div>
  );
}
