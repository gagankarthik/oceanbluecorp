"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import {
  Zap,
  Cloud,
  Brain,
  Users,
  Shield,
  TrendingUp,
  ArrowRight,
  Briefcase,
  Sparkles,
  Cpu,
  Orbit,
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
  const [rayIntensity, setRayIntensity] = useState(1);

  const displayIndex = hoveredIndex !== null ? hoveredIndex : activeIndex;
  const activeSolution = solutions[displayIndex];

  // Pulsing ray effect
  useEffect(() => {
    const interval = setInterval(() => {
      setRayIntensity(prev => prev === 1 ? 1.5 : 1);
    }, 800);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 overflow-hidden">
      {/* Light Sci-fi Background Elements */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.08),transparent_50%),radial-gradient(ellipse_at_bottom,rgba(139,92,246,0.08),transparent_50%)]" />
      
      {/* Soft Grid Lines */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#94a3b810_1px,transparent_1px),linear-gradient(to_bottom,#94a3b810_1px,transparent_1px)] bg-[size:4rem_4rem]" />

      {/* Floating Light Orbs */}
      {solutions.map((solution, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full blur-3xl"
          style={{
            background: `radial-gradient(circle at center, ${solution.color}15, transparent 70%)`,
            width: 300,
            height: 300,
            left: `${10 + i * 15}%`,
            top: `${20 + i * 10}%`,
          }}
          animate={{
            x: [0, 30, 0],
            y: [0, 20, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 8 + i,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Floating Particles */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full"
          style={{
            background: `radial-gradient(circle at center, ${solutions[i % 6].color}, transparent)`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, Math.random() * 20 - 10, 0],
            opacity: [0.2, 0.6, 0.2],
          }}
          transition={{
            duration: 4 + Math.random() * 4,
            repeat: Infinity,
            ease: "easeInOut",
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
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
              className="absolute w-[250px] sm:w-[350px] lg:w-[450px] h-[250px] sm:h-[350px] lg:h-[450px] rounded-full"
              style={{ 
                border: `1px solid ${activeSolution.color}30`,
                boxShadow: `0 0 30px ${activeSolution.color}20`,
              }}
            >
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute inset-0 rounded-full"
                  style={{
                    border: `1px dashed ${activeSolution.color}20`,
                    transform: `rotate(${i * 30}deg)`,
                  }}
                  animate={{
                    scale: [1, 1.05, 1],
                    opacity: [0.3, 0.6, 0.3],
                  }}
                  transition={{
                    duration: 4 + i,
                    repeat: Infinity,
                    delay: i * 0.3,
                  }}
                />
              ))}
            </motion.div>

            {/* Center Core - Energy Source */}
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                boxShadow: [
                  `0 0 30px ${activeSolution.color}`,
                  `0 0 60px ${activeSolution.color}`,
                  `0 0 30px ${activeSolution.color}`,
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute w-20 h-20 sm:w-24 sm:h-24 lg:w-32 lg:h-32 rounded-full bg-white flex items-center justify-center z-10"
              style={{ 
                border: `3px solid ${activeSolution.color}`,
                boxShadow: `inset 0 0 20px ${activeSolution.color}`,
              }}
            >
              <motion.div
                key={activeSolution.id}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                <activeSolution.icon className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12" style={{ color: activeSolution.color }} />
              </motion.div>
            </motion.div>

            {/* Orbiting Service Icons with Rays from Center */}
            {solutions.map((solution, index) => {
              const angle = (index * 60) * (Math.PI / 180);
              const radius = window.innerWidth < 768 ? 140 : window.innerWidth < 1024 ? 180 : 220;
              const x = Math.cos(angle) * radius;
              const y = Math.sin(angle) * radius;
              const isActive = displayIndex === index;

              return (
                <motion.div
                  key={solution.id}
                  className="absolute"
                  style={{
                    left: `calc(50% + ${x}px)`,
                    top: `calc(50% + ${y}px)`,
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  {/* Ray from Center to Icon */}
                  <AnimatePresence>
                    {isActive && (
                      <>
                        {/* Main ray beam */}
                        <motion.div
                          initial={{ scaleX: 0, opacity: 0 }}
                          animate={{ scaleX: 1, opacity: rayIntensity * 0.6 }}
                          exit={{ scaleX: 0, opacity: 0 }}
                          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 origin-left"
                          style={{
                            width: radius,
                            height: '3px',
                            background: `linear-gradient(90deg, ${solution.color}, ${solution.color}80, transparent)`,
                            transformOrigin: 'left center',
                            rotate: `${angle}rad`,
                            filter: `blur(${rayIntensity * 2}px)`,
                          }}
                        />
                        
                        {/* Energy particles along ray */}
                        {[...Array(8)].map((_, i) => (
                          <motion.div
                            key={i}
                            className="absolute w-1.5 h-1.5 rounded-full"
                            style={{
                              backgroundColor: solution.color,
                              left: `${i * 12}%`,
                              top: '50%',
                              filter: 'blur(1px)',
                            }}
                            animate={{
                              x: [0, -radius * 0.1],
                              opacity: [1, 0],
                              scale: [1, 1.5, 1],
                            }}
                            transition={{
                              duration: 1,
                              repeat: Infinity,
                              delay: i * 0.1,
                              ease: "linear",
                            }}
                          />
                        ))}
                      </>
                    )}
                  </AnimatePresence>

                  {/* Icon Container */}
                  <motion.div
                    animate={{
                      scale: isActive ? 1.4 : 1,
                      boxShadow: isActive ? `0 0 40px ${solution.color}` : `0 0 20px ${solution.color}40`,
                    }}
                    whileHover={{ scale: 1.5 }}
                    onHoverStart={() => setHoveredIndex(index)}
                    onHoverEnd={() => setHoveredIndex(null)}
                    onClick={() => setActiveIndex(index)}
                    className="relative w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center cursor-pointer"
                    style={{
                      border: `2px solid ${isActive ? solution.color : '#e5e7eb'}`,
                      boxShadow: isActive ? `0 0 30px ${solution.color}` : 'none',
                    }}
                  >
                    <solution.icon 
                      className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7" 
                      style={{ color: isActive ? solution.color : '#94a3b8' }} 
                    />

                    {/* Pulsing dot */}
                    <motion.div
                      animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.5, 1, 0.5],
                      }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: solution.color }}
                    />
                  </motion.div>

                  {/* Label */}
                  <AnimatePresence>
                    {(hoveredIndex === index || isActive) && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute left-1/2 -translate-x-1/2 mt-3 whitespace-nowrap"
                      >
                        <div className="px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-full shadow-lg border border-gray-100 text-xs font-medium text-gray-700">
                          {solution.title}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}

            {/* HUD Corner Elements */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] sm:w-[380px] lg:w-[480px] h-[280px] sm:h-[380px] lg:h-[480px] pointer-events-none">
              <div className="absolute top-0 left-0 w-12 h-12 border-l-2 border-t-2 rounded-tl-3xl" style={{ borderColor: `${activeSolution.color}60` }} />
              <div className="absolute top-0 right-0 w-12 h-12 border-r-2 border-t-2 rounded-tr-3xl" style={{ borderColor: `${activeSolution.color}60` }} />
              <div className="absolute bottom-0 left-0 w-12 h-12 border-l-2 border-b-2 rounded-bl-3xl" style={{ borderColor: `${activeSolution.color}60` }} />
              <div className="absolute bottom-0 right-0 w-12 h-12 border-r-2 border-b-2 rounded-br-3xl" style={{ borderColor: `${activeSolution.color}60` }} />
            </div>
          </motion.div>

          {/* Right Side - Service Card with Rays from Center */}
          <motion.div
            key={activeSolution.id}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
            className="relative"
          >
            {/* Rays coming from center to card */}
            <AnimatePresence>
              {/* Main ray beam */}
              <motion.div
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: rayIntensity * 0.5 }}
                exit={{ scaleX: 0, opacity: 0 }}
                className="absolute -left-32 top-1/2 -translate-y-1/2 w-32 h-1 origin-right"
                style={{
                  background: `linear-gradient(90deg, ${activeSolution.color}, ${activeSolution.color}40, transparent)`,
                  filter: `blur(${rayIntensity * 3}px)`,
                }}
              />
              
              {/* Energy particles streaming */}
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: activeSolution.color,
                    left: -20 - i * 15,
                    top: '50%',
                    filter: 'blur(2px)',
                  }}
                  animate={{
                    x: [0, 100],
                    opacity: [1, 0],
                    scale: [1, 2, 1],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: "easeOut",
                  }}
                />
              ))}
            </AnimatePresence>

            {/* Main Card - Light Sci-fi Style */}
            <motion.div
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              className="relative bg-white/90 backdrop-blur-xl rounded-3xl p-6 sm:p-8 lg:p-10 shadow-2xl border border-white/50 overflow-hidden"
              style={{
                boxShadow: `0 20px 40px -20px ${activeSolution.color}, 0 0 0 1px ${activeSolution.color}20 inset`,
              }}
            >
             

              {/* Soft glow overlay */}
              <motion.div
                animate={{
                  opacity: [0.1, 0.2, 0.1],
                }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute inset-0"
                style={{
                  background: `radial-gradient(circle at 30% 50%, ${activeSolution.color}10, transparent 70%)`,
                }}
              />

              {/* Service Header */}
              <div className="flex items-center gap-3 mb-4 sm:mb-6 relative">
                <span className="text-xs sm:text-sm font-mono px-2 py-1 rounded-full bg-white/50" style={{ color: activeSolution.color }}>
                  0x{String(activeSolution.id).padStart(2, '0')}
                </span>
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                >
                  <Radar className="w-4 h-4" style={{ color: activeSolution.color }} />
                </motion.div>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                {activeSolution.features.map((feature, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.1 }}
                    className="flex items-center gap-2"
                  >
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: activeSolution.color }} />
                    <span className="text-xs sm:text-sm text-gray-600">{feature}</span>
                  </motion.div>
                ))}
              </div>

              {/* Tech Tags */}
              <div className="flex flex-wrap gap-2 mb-6 sm:mb-8">
                {activeSolution.tech.map((tech, i) => (
                  <motion.span
                    key={i}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    className="px-2 sm:px-3 py-1 rounded-full text-xs bg-white border"
                    style={{
                      borderColor: `${activeSolution.color}30`,
                      color: activeSolution.color,
                    }}
                  >
                    {tech}
                  </motion.span>
                ))}
              </div>

              {/* Action Button */}
              <Link href="/services">
                <motion.button
                  whileHover={{ scale: 1.02, x: 5 }}
                  whileTap={{ scale: 0.98 }}
                  className="group relative w-full sm:w-auto px-6 py-3 rounded-xl overflow-hidden text-white"
                  style={{
                    background: `linear-gradient(135deg, ${activeSolution.color}, ${activeSolution.color}dd)`,
                  }}
                >
                  <span className="relative z-10 flex items-center justify-center gap-2 text-sm sm:text-base">
                    Explore Services
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <motion.div
                    animate={{
                      x: ["-100%", "100%"],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  />
                </motion.button>
              </Link>

              {/* Status Indicator */}
              <div className="absolute top-4 right-4 flex items-center gap-2">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: activeSolution.color }}
                />
                <span className="text-xs text-gray-400">LINK ACTIVE</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Light Scanner Line */}
      <motion.div
        animate={{
          x: ["-100%", "100%"],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute top-1/2 left-0 w-32 h-px bg-gradient-to-r from-transparent via-white to-transparent"
        style={{ filter: `blur(2px)` }}
      />

    </section>
  );
}