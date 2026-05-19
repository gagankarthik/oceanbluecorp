"use client";

import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, ChevronDown, Play } from "lucide-react";

/* Lazy-load the globe — it's heavy. Kick off prefetch in browser. */
if (typeof window !== "undefined") {
  import("./ui/globe");
}
const World = dynamic(() => import("./ui/globe").then((m) => m.World), {
  ssr: false,
});

/* ============================================================
   HERO — Ocean Blue original, refined.
   Dark slate → indigo gradient, interactive globe, simple copy.
   No fake stats. Tech Partners explicitly labelled.
   ============================================================ */

const globeConfig = {
  pointSize: 1,
  globeColor: "#1d072e",
  showAtmosphere: true,
  atmosphereColor: "#ffffff",
  atmosphereAltitude: 0.1,
  emissive: "#000000",
  emissiveIntensity: 0.1,
  shininess: 0.9,
  polygonColor: "rgba(255,255,255,0.7)",
  ambientLight: "#ffffff",
  directionalLeftLight: "#ffffff",
  directionalTopLight: "#ffffff",
  pointLight: "#ffffff",
  arcTime: 2000,
  arcLength: 0.9,
  rings: 1,
  maxRings: 3,
  autoRotate: true,
  autoRotateSpeed: 0.9,
};

const arcs = [
  { order: 1, startLat: 40.1573,  startLng: -83.0752,  endLat: 40.7128,  endLng: -74.0060,  arcAlt: 0.18, color: "#60a5fa" },
  { order: 2, startLat: 40.1573,  startLng: -83.0752,  endLat: 51.5074,  endLng: -0.1278,   arcAlt: 0.32, color: "#a78bfa" },
  { order: 3, startLat: 40.1573,  startLng: -83.0752,  endLat: 12.9716,  endLng: 77.5946,   arcAlt: 0.46, color: "#22d3ee" },
  { order: 4, startLat: 40.7128,  startLng: -74.0060,  endLat: 53.3498,  endLng: -6.2603,   arcAlt: 0.28, color: "#60a5fa" },
  { order: 5, startLat: 37.7749,  startLng: -122.4194, endLat: 43.6532,  endLng: -79.3832,  arcAlt: 0.22, color: "#a78bfa" },
];

const techPartners = [
  { name: "AWS Partner", logo: "/AWS-Partner.png", height: "h-12 md:h-14" },
  { name: "Snowflake",   logo: "/snowflake.svg",   height: "h-7 md:h-8" },
  { name: "Databricks",  logo: "/databricks.svg",  height: "h-7 md:h-8" },
];

export default function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const y       = useTransform(scrollYProgress, [0, 0.6], [0, 80]);

  const textVariants = {
    hidden: { opacity: 0, y: 18 },
    visible: (delay: number) => ({
      opacity: 1,
      y: 0,
      transition: { duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
    }),
  };

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900"
    >
      {/* Soft animated background orbs */}
      <div className="absolute inset-0" aria-hidden>
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.32, 0.5, 0.32] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -left-1/4 top-1/4 h-1/2 w-1/2 rounded-full bg-blue-600/20 blur-3xl"
        />
        <motion.div
          animate={{ scale: [1.15, 1, 1.15], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute -right-1/4 bottom-1/4 h-1/2 w-1/2 rounded-full bg-cyan-600/20 blur-3xl"
        />
      </div>

      {/* Wave bottom — subtle */}
      <div className="absolute inset-x-0 bottom-0" aria-hidden>
        <svg viewBox="0 0 1440 120" className="h-auto w-full" preserveAspectRatio="none">
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
        className="relative z-10 flex min-h-screen items-center pt-24 md:pt-28"
      >
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-6">
            {/* LEFT — Copy */}
            <div className="relative z-20 lg:pr-6">
              <motion.h1
                custom={0.05}
                variants={textVariants}
                initial="hidden"
                animate="visible"
                className="text-[2.4rem] font-light leading-[1.05] tracking-tight text-white sm:text-[3rem] md:text-[3.6rem] lg:text-[4.2rem]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Technology.
                <br />
                Talent.
                <br />
                <span className="bg-gradient-to-r from-cyan-300 via-blue-300 to-indigo-300 bg-clip-text font-medium text-transparent">
                  Transformation.
                </span>
              </motion.h1>

              <motion.p
                custom={0.18}
                variants={textVariants}
                initial="hidden"
                animate="visible"
                className="mt-6 max-w-md text-[15px] leading-relaxed text-gray-300 sm:text-[16px]"
              >
                Ocean Blue provides IT staffing, enterprise solutions, and
                managed services that help organisations modernise, scale, and
                operate with confidence.
              </motion.p>

              <motion.div
                custom={0.3}
                variants={textVariants}
                initial="hidden"
                animate="visible"
                className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"
              >
                <Link
                  href="/contact"
                  className="group inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-gray-900 shadow-lg transition-all hover:bg-gray-100 hover:shadow-xl"
                >
                  <span>Start a conversation</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="/services"
                  className="group inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20"
                >
                  <Play className="h-3.5 w-3.5" />
                  <span>See how we work</span>
                </Link>
              </motion.div>

              {/* Technology Partners — explicitly labelled */}
              <motion.div
                custom={0.45}
                variants={textVariants}
                initial="hidden"
                animate="visible"
                className="mt-12"
              >
                <p className="text-center text-[10.5px] font-semibold uppercase tracking-[0.18em] text-gray-400 sm:text-left">
                  Technology partners
                </p>
                <div className="mt-5 flex flex-wrap items-center justify-center gap-x-2 gap-y-3 sm:justify-start sm:gap-x-3">
                  {techPartners.map((p, i) => (
                    <motion.div
                      key={p.name}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.6 + i * 0.08 }}
                      className="flex items-center gap-3"
                    >
                      <div className="px-3 py-2 transition-opacity">
                        <Image
                          src={p.logo}
                          alt={p.name}
                          width={160}
                          height={56}
                          className={`${p.height} w-auto object-contain opacity-90 transition-opacity hover:opacity-100`}
                        />
                      </div>
                      {i < techPartners.length - 1 && (
                        <span className="h-8 w-px bg-white/15" />
                      )}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* RIGHT — Interactive globe */}
            <div className="relative h-[280px] w-full sm:h-[380px] md:h-[460px] lg:h-[620px]">
              <div className="absolute inset-0 cursor-grab active:cursor-grabbing">
                <World globeConfig={globeConfig} data={arcs} />
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1, duration: 0.8 }}
        className="absolute bottom-6 left-1/2 z-20 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="group flex cursor-pointer flex-col items-center gap-1.5"
          onClick={() =>
            window.scrollTo({ top: window.innerHeight, behavior: "smooth" })
          }
        >
          <span className="text-[10px] uppercase tracking-[0.2em] text-gray-400">
            Scroll
          </span>
          <ChevronDown className="h-4 w-4 text-gray-400 transition-colors group-hover:text-white" />
        </motion.div>
      </motion.div>
    </section>
  );
}
