"use client";

import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import Link from "next/link";
import { useRef, useState, useEffect, useCallback, memo } from "react";
import { 
  Cloud, Brain, Users, Shield, TrendingUp, 
  Briefcase, Code, Database, Sparkles, 
  ArrowRight, Circle, ChevronRight 
} from "lucide-react";

const services = [
  {
    id: "01",
    title: "Cloud Infrastructure",
    description: "Scale seamlessly across AWS, Azure, and GCP with enterprise-grade architecture and 99.99% uptime.",
    icon: Cloud,
    color: "#3b82f6",
  },
  {
    id: "02",
    title: "AI & Machine Learning",
    description: "Transform data into intelligence with predictive analytics, NLP, and computer vision solutions.",
    icon: Brain,
    color: "#8b5cf6",
  },
  {
    id: "03",
    title: "IT Talent Solutions",
    description: "Build exceptional teams with pre-vetted specialists who integrate seamlessly into your organization.",
    icon: Users,
    color: "#10b981",
  },
  {
    id: "04",
    title: "Enterprise Systems",
    description: "Modernize legacy systems with SAP, Oracle, and cloud-native platform migrations.",
    icon: Briefcase,
    color: "#f59e0b",
  },
  {
    id: "05",
    title: "Managed Services",
    description: "24/7 proactive monitoring, maintenance, and performance optimization for your infrastructure.",
    icon: Shield,
    color: "#ef4444",
  },
  {
    id: "06",
    title: "Growth Strategy",
    description: "Strategic consulting that aligns technology roadmaps with business objectives.",
    icon: TrendingUp,
    color: "#22c55e",
  },
  {
    id: "07",
    title: "DevOps Excellence",
    description: "Automated CI/CD pipelines, container orchestration, and infrastructure as code solutions.",
    icon: Code,
    color: "#64748b",
  },
  {
    id: "08",
    title: "Data Analytics",
    description: "Real-time analytics, data warehousing, and business intelligence for data-driven decisions.",
    icon: Database,
    color: "#6366f1",
  },
  {
    id: "09",
    title: "Digital Transformation",
    description: "End-to-end digital transformation strategies that future-proof your business operations.",
    icon: Sparkles,
    color: "#eab308",
  },
];

// Optimized counter for desktop only
const AnimatedCounter = memo(({ value }: { value: number }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (!hasAnimated && ref.current) {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && !hasAnimated) {
            setHasAnimated(true);
            let start = 0;
            const duration = 1000;
            const step = (timestamp: number) => {
              const progress = Math.min((timestamp - start) / duration, 1);
              setCount(Math.floor(progress * value));
              if (progress < 1) requestAnimationFrame(step);
            };
            start = performance.now();
            requestAnimationFrame(step);
          }
        },
        { threshold: 0.1 }
      );
      if (ref.current) observer.observe(ref.current);
      return () => observer.disconnect();
    }
  }, [value, hasAnimated]);

  return <span ref={ref}>{count}</span>;
});
AnimatedCounter.displayName = "AnimatedCounter";

// Simplified floating particles (fewer particles, CSS transitions)
const FloatingParticles = memo(() => {
  // Reduced particles for mobile
  const [particles] = useState(() => 
    Array.from({ length: 12 }, (_, i) => ({
      id: i,
      size: Math.random() * 2 + 1,
      x: Math.random() * 100,
      y: Math.random() * 100,
      duration: Math.random() * 15 + 10,
      delay: Math.random() * 5,
    }))
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full bg-[#8d81f0]/15 will-change-transform"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
            animation: `float ${p.duration}s linear infinite`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); opacity: 0; }
          50% { transform: translateY(-30px); opacity: 0.5; }
        }
      `}</style>
    </div>
  );
});
FloatingParticles.displayName = "FloatingParticles";

// Desktop glow card (only rendered on desktop)
const GlowCard = memo(({ service, index }: { service: typeof services[0]; index: number }) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    setIsMobile(window.innerWidth < 1024);
  }, []);
  
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (isMobile) return;
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  }, [isMobile, mouseX, mouseY]);
  
  const background = useMotionTemplate`radial-gradient(120px at ${mouseX}px ${mouseY}px, ${service.color}15, transparent 80%)`;

  if (isMobile) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4, delay: index * 0.02 }}
      className="relative p-6 lg:p-8 flex flex-col min-h-[320px] group"
      onMouseMove={handleMouseMove}
    >
      <motion.div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background }}
      />
      
      <Link href="/services" className="flex flex-col h-full relative z-10">
        <div className="flex items-center gap-3 mb-5">
          <span className="text-[#8d81f0] text-sm font-mono font-medium">
            {service.id}
          </span>
          <div className="h-px w-6 bg-[#8d81f0]/30" />
        </div>

        <div className="mb-5">
          <service.icon 
            className="w-10 h-10 transition-transform duration-300 group-hover:scale-110" 
            style={{ color: service.color }}
          />
        </div>

        <h3 className="text-slate-900 text-xl font-semibold mb-2 tracking-tight">
          {service.title}
        </h3>

        <p className="text-gray-600 text-sm leading-relaxed line-clamp-3">
          {service.description}
        </p>

        <div className="mt-5 flex items-center gap-2 text-[#8d81f0] opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-sm font-mono">Learn more</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </div>
      </Link>
    </motion.div>
  );
});
GlowCard.displayName = "GlowCard";

// Mobile card component (simplified, no heavy animations)
const MobileCard = memo(({ service, index }: { service: typeof services[0]; index: number }) => {
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={cardRef} className="w-[85vw] flex-shrink-0">
      <Link
        href="/services"
        className="block p-5 bg-white rounded-2xl shadow-md border border-gray-100 active:scale-[0.98] transition-transform"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#8d81f0]/10 to-transparent">
            <service.icon className="w-6 h-6" style={{ color: service.color }} />
          </div>
          <span className="text-[#8d81f0] font-mono text-sm">{service.id}</span>
        </div>
        <h3 className="text-slate-900 text-base font-semibold mb-2">{service.title}</h3>
        <p className="text-gray-500 text-xs leading-relaxed line-clamp-2">{service.description}</p>
        <div className="mt-3 flex items-center gap-1 text-[#8d81f0] text-xs">
          <span>Learn more</span>
          <ArrowRight className="w-3 h-3" />
        </div>
      </Link>
    </div>
  );
});
MobileCard.displayName = "MobileCard";

// Tablet card component
const TabletCard = memo(({ service, index }: { service: typeof services[0]; index: number }) => {
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 20 }}
      animate={isVisible ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.3, delay: index * 0.02 }}
      whileHover={{ y: -3 }}
    >
      <Link
        href="/services"
        className="group block p-5 bg-white rounded-xl transition-shadow duration-200 shadow-md hover:shadow-lg border border-gray-100"
      >
        <div className="flex items-start justify-between mb-3">
          <span className="text-[#8d81f0] font-mono text-xs bg-[#8d81f0]/8 px-2 py-0.5 rounded">
            {service.id}
          </span>
          <service.icon className="w-6 h-6" style={{ color: service.color }} />
        </div>
        <h3 className="text-slate-900 text-base font-semibold mb-1.5">{service.title}</h3>
        <p className="text-gray-500 text-xs leading-relaxed line-clamp-2">{service.description}</p>
        <div className="mt-3 flex items-center gap-1 text-[#8d81f0] text-xs opacity-0 group-hover:opacity-100 transition-opacity">
          <span>Learn more</span>
          <ChevronRight className="w-3 h-3" />
        </div>
      </Link>
    </motion.div>
  );
});
TabletCard.displayName = "TabletCard";

export default function TerminalServices() {
  const sectionRef = useRef<HTMLElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const checkScreen = () => {
      const width = window.innerWidth;
      setIsMobile(width < 640);
      setIsTablet(width >= 640 && width < 1024);
    };
    checkScreen();
    window.addEventListener('resize', checkScreen);
    return () => window.removeEventListener('resize', checkScreen);
  }, []);

  
  return (
    <section 
      ref={sectionRef}
      className="relative bg-gradient-to-b from-[#f8f8f8] to-[#f2f2f2] py-16 md:py-24 lg:py-32 overflow-hidden"
    >
      {/* Simplified background for mobile */}
      <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_0%,transparent_75%,rgba(141,129,240,0.02)_100%)]" />
      
      {!isMobile && <FloatingParticles />}
      
      {/* Animated gradient orbs - only on desktop/tablet */}
      {!isMobile && (
        <>
          <motion.div
            className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-[#8d81f0]/5 blur-3xl"
            animate={{ x: [0, 80, 0], y: [0, -30, 0] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full bg-[#8d81f0]/5 blur-3xl"
            animate={{ x: [0, -60, 0], y: [0, 30, 0] }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear", delay: 5 }}
          />
        </>
      )}

      <div className="px-5 md:px-8 lg:px-20 max-w-[1400px] mx-auto relative z-10">
        
        {/* Header - Simplified animations for mobile */}
        <div className="mb-12 md:mb-16 text-center">
          <div className="inline-flex items-center gap-2 bg-[#8d81f0]/8 rounded-full px-3 md:px-4 py-1 md:py-1.5 mb-5 md:mb-6">
            <Circle className="w-1.5 h-1.5 md:w-2 md:h-2 fill-[#8d81f0]" />
            <span className="text-[#8d81f0] text-[10px] md:text-xs font-mono tracking-wider">
              WHAT WE OFFER
            </span>
          </div>

          <h2 className="text-slate-900 text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-3 md:mb-5 leading-[1.2] tracking-tight">
            Comprehensive solutions
            <br />
            <span className="bg-gradient-to-r from-[#8d81f0] to-[#a9a1ee] bg-clip-text text-transparent">
              for modern enterprises
            </span>
          </h2>
          
          <p className="text-gray-600 text-sm md:text-base lg:text-lg max-w-2xl mx-auto px-4">
            End-to-end technology services that drive innovation and business growth
          </p>
        </div>

        {/* Desktop Grid */}
        <div className="hidden lg:block bg-white/40 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/50">
          <div className="grid grid-cols-3 divide-y divide-gray-200/50">
            {services.map((service, idx) => (
              <div key={service.id} className={`${(idx + 1) % 3 !== 0 ? 'border-r border-gray-200/50' : ''}`}>
                <GlowCard service={service} index={idx} />
              </div>
            ))}
          </div>
        </div>

        {/* Tablet Grid */}
        <div className="hidden sm:grid lg:hidden grid-cols-2 gap-4 md:gap-5">
          {services.map((service, index) => (
            <TabletCard key={service.id} service={service} index={index} />
          ))}
        </div>

        {/* Mobile Horizontal Scroll */}
        <div className="sm:hidden -mx-5 px-5 overflow-x-auto pb-3 scrollbar-hide">
          <div className="flex gap-3 min-w-full">
            {services.map((service, index) => (
              <MobileCard key={service.id} service={service} index={index} />
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 md:mt-16 text-center">
          <Link
            href="/services"
            className="inline-flex items-center gap-2 bg-[#8d81f0] text-white px-6 md:px-8 py-3 md:py-4 rounded-full text-sm md:text-base font-medium transition-all duration-200 shadow-md hover:shadow-lg active:scale-95"
          >
            <span>View all services</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
