"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import Image from "next/image";

const stats = [
  { id: 1, value: 10, label: "Years of Excellence", suffix: "+" },
  { id: 2, value: 150, label: "Enterprise Clients", suffix: "+" },
  { id: 3, value: 98, label: "Client Retention", suffix: "%" },
  { id: 4, value: 8, label: "Software Solutions", suffix: "+" },
];

function Counter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (isInView) {
      let start = 0;
      const duration = 2000;
      const increment = value / (duration / 16);
      
      const timer = setInterval(() => {
        start += increment;
        if (start >= value) {
          setCount(value);
          clearInterval(timer);
        } else {
          setCount(Math.floor(start));
        }
      }, 16);

      return () => clearInterval(timer);
    }
  }, [isInView, value]);

  return (
    <span ref={ref} className="text-5xl md:text-6xl font-light text-white inline-block drop-shadow-lg">
      {isInView ? count : 0}{suffix}
    </span>
  );
}

export default function StatsSections() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  return (
    <section ref={sectionRef} className="relative w-full py-24 md:py-32 overflow-hidden">
      {/* Background Image - Fully Visible */}
      <div className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1723307060937-b003478a2c03?q=80&w=2928&auto=format&fit=crop"
          alt="Background"
          fill
          className="object-cover"
          priority
        />
        {/* Very Subtle Darkening for Text Readability */}
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 max-w-6xl">
        <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
          {/* Left Column - Heading */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-white"
          >
            <span className="text-sm font-mono text-white/80 tracking-wider mb-4 block drop-shadow">
              — OUR IMPACT
            </span>
            <h2 className="text-4xl md:text-5xl font-serif leading-tight mb-6 drop-shadow-lg">
              Track record of
              <span className="block text-white mt-2 font-bold">Excellence</span>
            </h2>
            <p className="text-white/90 text-lg max-w-md drop-shadow">
              We deliver measurable results that help businesses scale faster with proven expertise across industries.
            </p>
          </motion.div>

          {/* Right Column - Stats Grid */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-2 gap-8 md:gap-12"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={stat.id}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="border-l-4 border-white/50 pl-4"
              >
                <div className="mb-1 drop-shadow-lg">
                  <Counter value={stat.value} suffix={stat.suffix} />
                </div>
                <p className="text-base text-white/90 font-medium tracking-wide drop-shadow">
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}