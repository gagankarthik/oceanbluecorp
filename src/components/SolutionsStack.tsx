"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import {
  Cloud,
  Brain,
  Users,
  Shield,
  TrendingUp,
  ArrowRight,
  Briefcase,
  Radar,
} from "lucide-react";
import Link from "next/link";

const solutions = [
  {
    id: 1,
    title: "Enterprise Transformation",
    description: "Modernize legacy systems with SAP, Oracle, and cloud-native platforms built for scale and performance.",
    icon: Briefcase,
    color: "#3B82F6",
    lightColor: "#EFF6FF",
    gradient: "from-blue-400 to-blue-600",
    features: ["Legacy Modernization", "System Integration", "Cloud Migration"],
    tech: ["SAP", "Oracle", "Cloud Native"],
  },
  {
    id: 2,
    title: "Cloud Infrastructure",
    description: "Secure, scalable infrastructure across AWS, Azure, and Google Cloud with 99.99% uptime guarantee.",
    icon: Cloud,
    color: "#0EA5E9",
    lightColor: "#F0F9FF",
    gradient: "from-sky-400 to-sky-600",
    features: ["Multi-Cloud Strategy", "DevOps Automation", "Cost Optimization"],
    tech: ["AWS", "Azure", "GCP"],
  },
  {
    id: 3,
    title: "AI & Data Analytics",
    description: "Transform raw data into actionable intelligence using machine learning and AI-driven automation.",
    icon: Brain,
    color: "#8B5CF6",
    lightColor: "#F5F3FF",
    gradient: "from-violet-400 to-violet-600",
    features: ["Predictive Analytics", "Computer Vision", "NLP Solutions"],
    tech: ["Machine Learning", "LLMs", "Computer Vision"],
  },
  {
    id: 4,
    title: "IT Talent Solutions",
    description: "Scale your engineering team instantly with pre-vetted specialists who integrate seamlessly.",
    icon: Users,
    color: "#14B8A6",
    lightColor: "#F0FDFA",
    gradient: "from-teal-400 to-teal-600",
    features: ["Staff Augmentation", "Executive Search", "Remote Teams"],
    tech: ["Tech Screening", "Remote Integration", "Team Scaling"],
  },
  {
    id: 5,
    title: "Managed Services",
    description: "24/7 proactive monitoring, maintenance, and performance optimization for your infrastructure.",
    icon: Shield,
    color: "#F43F5E",
    lightColor: "#FFF1F2",
    gradient: "from-rose-400 to-rose-600",
    features: ["24/7 Monitoring", "Incident Response", "Performance Tuning"],
    tech: ["Proactive Alerts", "Auto-remediation", "SLA Management"],
  },
  {
    id: 6,
    title: "Growth Enablement",
    description: "Strategic consulting that aligns technology with business goals to accelerate digital transformation.",
    icon: TrendingUp,
    color: "#F59E0B",
    lightColor: "#FFFBEB",
    gradient: "from-amber-400 to-amber-600",
    features: ["Digital Strategy", "Tech Roadmapping", "Innovation Labs"],
    tech: ["Strategy Consulting", "ROI Analysis", "Market Intelligence"],
  }
];

export default function SolutionsStack() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [radius, setRadius] = useState(220);

  const displayIndex = hoveredIndex !== null ? hoveredIndex : activeIndex;
  const activeSolution = solutions[displayIndex];

  // Handle responsive sizing
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      if (width < 640) {
        setRadius(100);
      } else if (width < 768) {
        setRadius(140);
      } else if (width < 1024) {
        setRadius(180);
      } else {
        setRadius(220);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Memoize particles to prevent re-renders - reduce count on mobile
  const particleCount = isMobile ? 0 : 12;

  return (
    <section className="relative min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 overflow-hidden">
      {/* Light Sci-fi Background Elements */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.08),transparent_50%),radial-gradient(ellipse_at_bottom,rgba(139,92,246,0.08),transparent_50%)]" />
      
      {/* Soft Grid Lines */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#94a3b810_1px,transparent_1px),linear-gradient(to_bottom,#94a3b810_1px,transparent_1px)] bg-[size:4rem_4rem]" />

      {/* Floating Light Orbs - Hidden on mobile for performance */}
      {!isMobile && solutions.slice(0, 3).map((solution, i) => (
        <div
          key={i}
          className="absolute rounded-full blur-3xl"
          style={{
            background: `radial-gradient(circle at center, ${solution.color}10, transparent 70%)`,
            width: 200,
            height: 200,
            left: `${15 + i * 25}%`,
            top: `${25 + i * 15}%`,
          }}
        />
      ))}

      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl min-h-screen flex items-center py-20 lg:py-0">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center w-full">
          
          {/* Left Side - Light Sci-fi Circle Navigation */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
            className="relative flex items-center justify-center py-12 lg:py-0"
          >
            {/* Holographic Rings - Light Version */}
            <div
              className="absolute w-[200px] sm:w-[300px] lg:w-[450px] h-[200px] sm:h-[300px] lg:h-[450px] rounded-full"
              style={{
                border: `1px solid ${activeSolution.color}30`,
                boxShadow: isMobile ? 'none' : `0 0 30px ${activeSolution.color}20`,
              }}
            />

            {/* Center Core - Energy Source */}
            <div
              className="absolute w-16 h-16 sm:w-24 sm:h-24 lg:w-32 lg:h-32 rounded-full bg-white flex items-center justify-center z-10"
              style={{
                border: `3px solid ${activeSolution.color}`,
                boxShadow: isMobile ? 'none' : `0 0 30px ${activeSolution.color}`,
              }}
            >
              <activeSolution.icon className="w-7 h-7 sm:w-10 sm:h-10 lg:w-12 lg:h-12" style={{ color: activeSolution.color }} />
            </div>

            {/* Orbiting Service Icons */}
            {solutions.map((solution, index) => {
              const angle = (index * 60) * (Math.PI / 180);
              const x = Math.cos(angle) * radius;
              const y = Math.sin(angle) * radius;
              const isActive = displayIndex === index;

              return (
                <div
                  key={solution.id}
                  className="absolute"
                  style={{
                    left: `calc(50% + ${x}px)`,
                    top: `calc(50% + ${y}px)`,
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  {/* Icon Container */}
                  <button
                    onClick={() => setActiveIndex(index)}
                    onMouseEnter={() => !isMobile && setHoveredIndex(index)}
                    onMouseLeave={() => !isMobile && setHoveredIndex(null)}
                    className="relative w-10 h-10 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-full bg-white flex items-center justify-center cursor-pointer transition-all duration-200"
                    style={{
                      border: `2px solid ${isActive ? solution.color : '#e5e7eb'}`,
                      boxShadow: isActive && !isMobile ? `0 0 20px ${solution.color}40` : 'none',
                      transform: isActive ? 'scale(1.15)' : 'scale(1)',
                    }}
                  >
                    <solution.icon
                      className="w-4 h-4 sm:w-6 sm:h-6 lg:w-7 lg:h-7"
                      style={{ color: isActive ? solution.color : '#94a3b8' }}
                    />
                  </button>

                  {/* Label - Show only on desktop hover or active */}
                  {!isMobile && (hoveredIndex === index || isActive) && (
                    <div className="absolute left-1/2 -translate-x-1/2 mt-2 whitespace-nowrap">
                      <div className="px-3 py-1.5 bg-white rounded-full shadow-lg border border-gray-100 text-xs font-medium text-gray-700">
                        {solution.title}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* HUD Corner Elements - Hidden on mobile */}
            {!isMobile && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] sm:w-[380px] lg:w-[480px] h-[280px] sm:h-[380px] lg:h-[480px] pointer-events-none">
                <div className="absolute top-0 left-0 w-12 h-12 border-l-2 border-t-2 rounded-tl-3xl" style={{ borderColor: `${activeSolution.color}60` }} />
                <div className="absolute top-0 right-0 w-12 h-12 border-r-2 border-t-2 rounded-tr-3xl" style={{ borderColor: `${activeSolution.color}60` }} />
                <div className="absolute bottom-0 left-0 w-12 h-12 border-l-2 border-b-2 rounded-bl-3xl" style={{ borderColor: `${activeSolution.color}60` }} />
                <div className="absolute bottom-0 right-0 w-12 h-12 border-r-2 border-b-2 rounded-br-3xl" style={{ borderColor: `${activeSolution.color}60` }} />
              </div>
            )}
          </motion.div>

          {/* Right Side - Service Card */}
          <div className="relative">
            {/* Main Card */}
            <div
              className="relative bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 lg:p-10 mt-16 sm:mt-0 shadow-xl border border-gray-100 overflow-hidden"
              style={{
                boxShadow: isMobile ? '0 4px 20px rgba(0,0,0,0.1)' : `0 20px 40px -20px ${activeSolution.color}40`,
              }}
            >

              {/* Service Header */}
              <div className="flex items-center gap-3 mb-4 sm:mb-6 relative">
                <span className="text-xs sm:text-sm font-mono px-2 py-1 rounded-full bg-gray-50" style={{ color: activeSolution.color }}>
                  0{activeSolution.id}
                </span>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
                <Radar className="w-4 h-4" style={{ color: activeSolution.color }} />
              </div>

              {/* Title with light effect */}
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 mb-2">
                {activeSolution.title}
              </h2>
              

              {/* Description */}
              <p className="text-sm sm:text-base text-gray-500 leading-relaxed mb-6 sm:mb-8">
                {activeSolution.description}
              </p>

              {/* Features Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mb-5 sm:mb-6">
                {activeSolution.features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: activeSolution.color }} />
                    <span className="text-xs sm:text-sm text-gray-600">{feature}</span>
                  </div>
                ))}
              </div>

              {/* Tech Tags */}
              <div className="flex flex-wrap gap-2 mb-5 sm:mb-8">
                {activeSolution.tech.map((tech, i) => (
                  <span
                    key={i}
                    className="px-2 sm:px-3 py-1 rounded-full text-xs bg-gray-50 border"
                    style={{
                      borderColor: `${activeSolution.color}30`,
                      color: activeSolution.color,
                    }}
                  >
                    {tech}
                  </span>
                ))}
              </div>

              {/* Action Button */}
              <Link href="/services">
                <button
                  className="group w-full sm:w-auto px-6 py-3 rounded-xl text-white transition-transform hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background: `linear-gradient(135deg, ${activeSolution.color}, ${activeSolution.color}dd)`,
                  }}
                >
                  <span className="flex items-center justify-center gap-2 text-sm sm:text-base">
                    Explore Services
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>
              </Link>

              {/* Status Indicator - Hidden on mobile */}
              {!isMobile && (
                <div className="absolute top-4 right-4 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: activeSolution.color }} />
                  <span className="text-xs text-gray-400">ACTIVE</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

    </section>
  );
}