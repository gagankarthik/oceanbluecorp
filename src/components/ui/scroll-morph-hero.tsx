"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, useTransform, useSpring, useMotionValue } from "framer-motion";
import {
  Cloud, Brain, Users, Shield, TrendingUp,
  Briefcase, Code, Database, Sparkles, type LucideIcon,
} from "lucide-react";

// --- Types ---
export type AnimationPhase = "scatter" | "line" | "circle" | "bottom-strip";

type Service = {
  id: string;
  title: string;
  desc: string;
  icon: LucideIcon;
  iColor: string;
  iBg: string;
};

interface FlipCardProps {
  service: Service;
  index: number;
  target: { x: number; y: number; rotation: number; scale: number; opacity: number };
}

// --- Card dimensions (larger than the demo's image thumbs so text reads) ---
const IMG_WIDTH = 128;
const IMG_HEIGHT = 172;

// --- FlipCard Component ---
function FlipCard({ service, index, target }: FlipCardProps) {
  const Icon = service.icon;
  return (
    <motion.div
      animate={{
        x: target.x,
        y: target.y,
        rotate: target.rotation,
        scale: target.scale,
        opacity: target.opacity,
      }}
      transition={{ type: "spring", stiffness: 40, damping: 15 }}
      style={{
        position: "absolute",
        width: IMG_WIDTH,
        height: IMG_HEIGHT,
        transformStyle: "preserve-3d",
        perspective: "1000px",
      }}
      className="cursor-pointer group"
    >
      <motion.div
        className="relative h-full w-full"
        style={{ transformStyle: "preserve-3d" }}
        transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
        whileHover={{ rotateY: 180 }}
      >
        {/* Front Face — service icon + title */}
        <div
          className="absolute inset-0 flex h-full w-full flex-col overflow-hidden rounded-2xl border border-black/5 p-3.5"
          style={{
            backfaceVisibility: "hidden",
            // Subtle white -> service-tint wash so the card has depth (not flat #fff).
            background: `linear-gradient(180deg, #ffffff 0%, ${service.iBg} 140%)`,
            boxShadow:
              "0 12px 28px -10px rgba(15,23,42,0.22), 0 2px 6px rgba(15,23,42,0.06)",
          }}
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white ring-1 ring-black/5 shadow-sm">
            <Icon className="h-5 w-5" style={{ color: service.iColor }} aria-label={service.title} />
          </div>
          <span className="absolute right-3.5 top-3.5 font-mono text-[9px] font-semibold text-gray-400">
            {service.id}
          </span>
          <div className="mt-auto">
            <div className="mb-2 h-[3px] w-7 rounded-full" style={{ background: service.iColor }} />
            <h3
              className="text-[11.5px] font-bold leading-tight text-gray-900"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {service.title}
            </h3>
          </div>
        </div>

        {/* Back Face — description */}
        <div
          className="absolute inset-0 flex h-full w-full flex-col overflow-hidden rounded-2xl p-3.5"
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            background: "linear-gradient(180deg, #0f172a 0%, #1e293b 100%)",
            boxShadow: "0 12px 28px -10px rgba(15,23,42,0.4)",
          }}
        >
          <p className="mb-1.5 text-[8px] font-bold uppercase tracking-widest text-blue-300">
            Service {index + 1}
          </p>
          <p className="text-[8.5px] leading-snug text-slate-300">{service.desc}</p>
          <p className="mt-auto inline-flex items-center gap-1 text-[9px] font-semibold text-white">
            Learn more →
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

// --- Main Hero Component ---
const MAX_SCROLL = 3000; // Virtual scroll range

// Ocean Blue services (replaces the demo's Unsplash images)
const SERVICES: Service[] = [
  { id: "01", title: "Cloud Infrastructure",   icon: Cloud,      iColor: "#2563eb", iBg: "#eff6ff", desc: "Scale across AWS, Azure, and GCP with enterprise-grade architecture and 99.99% uptime SLA." },
  { id: "02", title: "AI & Machine Learning",  icon: Brain,      iColor: "#7c3aed", iBg: "#f5f3ff", desc: "Predictive analytics, NLP, and computer vision built and deployed for production workloads." },
  { id: "03", title: "IT Talent Solutions",    icon: Users,      iColor: "#059669", iBg: "#ecfdf5", desc: "Pre-vetted specialists who integrate fast and ship from day one — contract or direct-hire." },
  { id: "04", title: "Enterprise Systems",     icon: Briefcase,  iColor: "#d97706", iBg: "#fffbeb", desc: "Modernize SAP, Oracle, and cloud-native migrations with zero operational disruption." },
  { id: "05", title: "Managed Services",       icon: Shield,     iColor: "#dc2626", iBg: "#fef2f2", desc: "24/7 proactive monitoring, incident response, and performance optimization." },
  { id: "06", title: "Growth Strategy",        icon: TrendingUp, iColor: "#16a34a", iBg: "#f0fdf4", desc: "Align technology investments with measurable outcomes through strategic advisory." },
  { id: "07", title: "DevOps Excellence",      icon: Code,       iColor: "#4f46e5", iBg: "#eef2ff", desc: "CI/CD pipelines, Kubernetes orchestration, and infrastructure-as-code at scale." },
  { id: "08", title: "Data Analytics",         icon: Database,   iColor: "#0284c7", iBg: "#f0f9ff", desc: "Real-time analytics, warehousing, and BI dashboards — raw data into clear decisions." },
  { id: "09", title: "Digital Transformation", icon: Sparkles,   iColor: "#b45309", iBg: "#fefce8", desc: "End-to-end transformation strategies that future-proof operations and accelerate velocity." },
];

const TOTAL = SERVICES.length;

// Helper for linear interpolation
const lerp = (start: number, end: number, t: number) => start * (1 - t) + end * t;

export default function IntroAnimation() {
  const [introPhase, setIntroPhase] = useState<AnimationPhase>("scatter");
  const [hasEntered, setHasEntered] = useState(false);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // --- Container Size ---
  useEffect(() => {
    if (!containerRef.current) return;

    const handleResize = (entries: ResizeObserverEntry[]) => {
      for (const entry of entries) {
        setContainerSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    };

    const observer = new ResizeObserver(handleResize);
    observer.observe(containerRef.current);

    setContainerSize({
      width: containerRef.current.offsetWidth,
      height: containerRef.current.offsetHeight,
    });

    return () => observer.disconnect();
  }, []);

  // --- Virtual Scroll Logic ---
  const virtualScroll = useMotionValue(0);
  const scrollRef = useRef(0); // Track scroll value without re-renders

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      const current = scrollRef.current;
      // Release the wheel at the ends of the morph so the page can scroll past.
      const atEnd = current >= MAX_SCROLL && e.deltaY > 0;
      const atStart = current <= 0 && e.deltaY < 0;
      if (atEnd || atStart) return;

      e.preventDefault();
      const newScroll = Math.min(Math.max(current + e.deltaY, 0), MAX_SCROLL);
      scrollRef.current = newScroll;
      virtualScroll.set(newScroll);
    };

    // Touch support
    let touchStartY = 0;
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };
    const handleTouchMove = (e: TouchEvent) => {
      const touchY = e.touches[0].clientY;
      const deltaY = touchStartY - touchY;
      touchStartY = touchY;

      const current = scrollRef.current;
      const atEnd = current >= MAX_SCROLL && deltaY > 0;
      const atStart = current <= 0 && deltaY < 0;
      if (atEnd || atStart) return;

      e.preventDefault();
      const newScroll = Math.min(Math.max(current + deltaY, 0), MAX_SCROLL);
      scrollRef.current = newScroll;
      virtualScroll.set(newScroll);
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    container.addEventListener("touchstart", handleTouchStart, { passive: false });
    container.addEventListener("touchmove", handleTouchMove, { passive: false });

    return () => {
      container.removeEventListener("wheel", handleWheel);
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
    };
  }, [virtualScroll]);

  // 1. Morph Progress: 0 (Circle) -> 1 (Bottom Arc) between scroll 0 and 600
  const morphProgress = useTransform(virtualScroll, [0, 600], [0, 1]);
  const smoothMorph = useSpring(morphProgress, { stiffness: 40, damping: 20 });

  // 2. Scroll Rotation (Shuffling): rotate the arc as scrolling continues
  const scrollRotate = useTransform(virtualScroll, [600, 3000], [0, 360]);
  const smoothScrollRotate = useSpring(scrollRotate, { stiffness: 40, damping: 20 });

  // --- Mouse Parallax ---
  const mouseX = useMotionValue(0);
  const smoothMouseX = useSpring(mouseX, { stiffness: 30, damping: 20 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const relativeX = e.clientX - rect.left;
      const normalizedX = (relativeX / rect.width) * 2 - 1;
      mouseX.set(normalizedX * 100);
    };
    container.addEventListener("mousemove", handleMouseMove);
    return () => container.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX]);

  // --- Trigger only when the section reaches the CENTER of the screen ---
  // The center-band rootMargin shrinks the root to a strip across the middle of
  // the viewport, so this fires only once the section dominates the screen —
  // the user never sees the intro play while it's still scrolling into view.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasEntered(true);
          observer.disconnect(); // play once
        }
      },
      { root: null, rootMargin: "-35% 0px -35% 0px", threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // --- Intro Sequence (scatter -> line -> circle), gated on entering view ---
  useEffect(() => {
    if (!hasEntered) return;
    const timer1 = setTimeout(() => setIntroPhase("line"), 400);
    const timer2 = setTimeout(() => setIntroPhase("circle"), 2200);
    return () => { clearTimeout(timer1); clearTimeout(timer2); };
  }, [hasEntered]);

  // --- Random Scatter Positions ---
  const scatterPositions = useMemo(() => {
    return SERVICES.map(() => ({
      x: (Math.random() - 0.5) * 1500,
      y: (Math.random() - 0.5) * 1000,
      rotation: (Math.random() - 0.5) * 180,
      scale: 0.6,
      opacity: 0,
    }));
  }, []);

  // --- Render Loop (Manual Calculation for Morph) ---
  const [morphValue, setMorphValue] = useState(0);
  const [rotateValue, setRotateValue] = useState(0);
  const [parallaxValue, setParallaxValue] = useState(0);

  useEffect(() => {
    const unsubscribeMorph = smoothMorph.on("change", setMorphValue);
    const unsubscribeRotate = smoothScrollRotate.on("change", setRotateValue);
    const unsubscribeParallax = smoothMouseX.on("change", setParallaxValue);
    return () => {
      unsubscribeMorph();
      unsubscribeRotate();
      unsubscribeParallax();
    };
  }, [smoothMorph, smoothScrollRotate, smoothMouseX]);

  // --- Content Opacity (fades in when arc is formed) ---
  const contentOpacity = useTransform(smoothMorph, [0.8, 1], [0, 1]);
  const contentY = useTransform(smoothMorph, [0.8, 1], [20, 0]);

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden"
      // Neat off-white (not pure #fff) so the white cards read with contrast.
      style={{ background: "linear-gradient(180deg, #f6f8fb 0%, #eceff4 100%)" }}
    >
      <div className="flex h-full w-full flex-col items-center justify-center">

        {/* Intro Text (Fades out) */}
        <div className="pointer-events-none absolute top-1/2 z-0 flex -translate-y-1/2 flex-col items-center justify-center text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
            animate={introPhase === "circle" && morphValue < 0.5 ? { opacity: 1 - morphValue * 2, y: 0, filter: "blur(0px)" } : { opacity: 0, filter: "blur(10px)" }}
            transition={{ duration: 1 }}
            className="text-2xl font-medium tracking-tight text-gray-800 md:text-4xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Everything your enterprise needs.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={introPhase === "circle" && morphValue < 0.5 ? { opacity: 0.5 - morphValue } : { opacity: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="mt-4 text-xs font-bold tracking-[0.2em] text-gray-500"
          >
            SCROLL TO EXPLORE
          </motion.p>
        </div>

        {/* Arc Active Content (Fades in) */}
        <motion.div
          style={{ opacity: contentOpacity, y: contentY }}
          className="pointer-events-none absolute top-[10%] z-10 flex flex-col items-center justify-center px-4 text-center"
        >
          <h2
            className="mb-4 text-3xl font-semibold tracking-tight text-gray-900 md:text-5xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            What We Offer
          </h2>
          <p className="max-w-lg text-sm leading-relaxed text-gray-600 md:text-base">
            From cloud to talent — end-to-end solutions that drive measurable
            business outcomes. <br className="hidden md:block" />
            Scroll through the services that move your enterprise faster.
          </p>
        </motion.div>

        {/* Main Container */}
        <div className="relative flex h-full w-full items-center justify-center">
          {SERVICES.map((service, i) => {
            let target = { x: 0, y: 0, rotation: 0, scale: 1, opacity: 1 };

            // 1. Intro Phases (Scatter -> Line)
            if (introPhase === "scatter") {
              target = scatterPositions[i];
            } else if (introPhase === "line") {
              const lineSpacing = 144; // 128px card + gap
              const lineTotalWidth = TOTAL * lineSpacing;
              const lineX = i * lineSpacing - lineTotalWidth / 2;
              target = { x: lineX, y: 0, rotation: 0, scale: 1, opacity: 1 };
            } else {
              // 2. Circle Phase & Morph Logic
              const isMobile = containerSize.width < 768;
              const minDimension = Math.min(containerSize.width, containerSize.height);

              // A. Circle Position
              const circleRadius = Math.min(minDimension * 0.35, 350);
              const circleAngle = (i / TOTAL) * 360;
              const circleRad = (circleAngle * Math.PI) / 180;
              const circlePos = {
                x: Math.cos(circleRad) * circleRadius,
                y: Math.sin(circleRad) * circleRadius,
                rotation: circleAngle + 90,
              };

              // B. Bottom Arc Position ("rainbow" arch, convex up)
              const baseRadius = Math.min(containerSize.width, containerSize.height * 1.5);
              const arcRadius = baseRadius * (isMobile ? 1.4 : 1.1);
              const arcApexY = containerSize.height * (isMobile ? 0.35 : 0.25);
              const arcCenterY = arcApexY + arcRadius;

              const spreadAngle = isMobile ? 100 : 130;
              const startAngle = -90 - (spreadAngle / 2);
              const step = spreadAngle / (TOTAL - 1);

              const scrollProgress = Math.min(Math.max(rotateValue / 360, 0), 1);
              const maxRotation = spreadAngle * 0.8;
              const boundedRotation = -scrollProgress * maxRotation;

              const currentArcAngle = startAngle + (i * step) + boundedRotation;
              const arcRad = (currentArcAngle * Math.PI) / 180;

              const arcPos = {
                x: Math.cos(arcRad) * arcRadius + parallaxValue,
                y: Math.sin(arcRad) * arcRadius + arcCenterY,
                rotation: currentArcAngle + 90,
                scale: isMobile ? 1.25 : 1.5,
              };

              // C. Interpolate (Morph)
              target = {
                x: lerp(circlePos.x, arcPos.x, morphValue),
                y: lerp(circlePos.y, arcPos.y, morphValue),
                rotation: lerp(circlePos.rotation, arcPos.rotation, morphValue),
                scale: lerp(1, arcPos.scale, morphValue),
                opacity: 1,
              };
            }

            return <FlipCard key={service.id} service={service} index={i} target={target} />;
          })}
        </div>
      </div>
    </div>
  );
}
