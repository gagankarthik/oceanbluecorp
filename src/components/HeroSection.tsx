"use client";

import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, ChevronDown, Play } from "lucide-react";

// Dynamic import for Three.js globe to avoid SSR issues
const ThreeGlobe = dynamic(() => import("./ThreeGlobe"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 animate-pulse" />
    </div>
  ),
});

// Partner logos configuration with individual sizing
const partners = [
  { name: "AWS Partner", logo: "/AWS-Partner.png", height: "h-24 md:h-18" },
  { name: "Snowflake", logo: "/snowflake.svg", height: "h-8 md:h-10" },
  { name: "Databricks", logo: "/databricks.svg", height: "h-8 md:h-10" },
];

export default function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const y = useTransform(scrollYProgress, [0, 0.5], [0, 100]);

  const textVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (delay: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        delay,
        ease: [0.25, 0.4, 0.25, 1] as [number, number, number, number],
      },
    }),
  };

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900"
    >
      {/* Animated background gradients */}
      <div className="absolute inset-0">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 -left-1/4 w-1/2 h-1/2 bg-blue-600/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-cyan-600/20 rounded-full blur-3xl"
        />
      </div>

      {/* Wave bottom */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" className="w-full h-auto" preserveAspectRatio="none">
          <path
            fill="rgba(255,255,255,0.03)"
            d="M0,60 C360,120 720,0 1080,60 C1260,90 1380,75 1440,60 L1440,120 L0,120 Z"
          />
          <path
            fill="rgba(255,255,255,0.02)"
            d="M0,80 C320,40 640,100 960,60 C1200,30 1360,70 1440,50 L1440,120 L0,120 Z"
          />
        </svg>
      </div>

      {/* Main content */}
      <motion.div
        style={{ opacity, y }}
        className="relative z-10 min-h-screen flex items-center pt-20 md:pt-24"
      >
        <div className="w-full px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-4 items-center">
            {/* Left side - Text content */}
            <div className="relative z-20 lg:pr-8">
              {/* Title */}
              <motion.h1
                custom={0.1}
                variants={textVariants}
                initial="hidden"
                animate="visible"
                className="text-3xl sm:text-4xl md:text-5xl font-light text-white mb-4 font-[family-name:var(--font-space-grotesk)] leading-[1.15]"
              >
                Technology.
                <br />
                Talent.
                 <br />{" "}
                <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent font-medium">
                  Transformation.
                </span>
              </motion.h1>

              {/* Description */}
              <motion.p
                custom={0.2}
                variants={textVariants}
                initial="hidden"
                animate="visible"
                className="text-base text-gray-400 mb-6 leading-relaxed max-w-md"
              >
                Ocean Blue provides IT staffing, enterprise solutions, and managed
                services that help organizations modernize, scale, and operate
                with confidence.
              </motion.p>

              {/* CTAs */}
              <motion.div
                custom={0.3}
                variants={textVariants}
                initial="hidden"
                animate="visible"
                className="flex flex-col sm:flex-row gap-3"
              >
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-900 text-sm rounded-full hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl group"
                >
                  <span className="font-medium">Start a conversation</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/services"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-sm text-white text-sm rounded-full border border-white/20 hover:bg-white/20 transition-all group"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span className="font-medium">See how we work</span>
                </Link>
              </motion.div>

              {/* Technology Partners Section */}
              <motion.div
                custom={0.4}
                variants={textVariants}
                initial="hidden"
                animate="visible"
                className="mt-12"
              >
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-5 text-center lg:text-left">
                  Technology Partners
                </p>

                <div className="flex items-center justify-center lg:justify-start gap-3">
                  {partners.map((partner, index) => (
                    <motion.div
                      key={partner.name}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      className="flex items-center gap-3"
                    >
                      <div className="group px-4 py-2">
                        <Image
                          src={partner.logo}
                          alt={partner.name}
                          width={160}
                          height={64}
                          className={`${partner.height} w-auto object-contain opacity-90 group-hover:opacity-100 transition-opacity duration-300`}
                        />
                      </div>
                      {/* Divider line between partners */}
                      {index < partners.length - 1 && (
                        <div className="w-px h-10 bg-white/20" />
                      )}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Right side - 3D Globe */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
              className="relative hidden lg:block h-[550px]"
            >
              {/* Globe container */}
              <div className="absolute inset-0 hover:cursor-grab">
                <ThreeGlobe />
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.8 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20"
      >
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="flex flex-col items-center gap-1.5 cursor-pointer group"
          onClick={() =>
            window.scrollTo({ top: window.innerHeight, behavior: "smooth" })
          }
        >
          <span className="text-[10px] text-gray-500 uppercase tracking-widest">
            Scroll
          </span>
          <ChevronDown className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
        </motion.div>
      </motion.div>
    </section>
  );
}
