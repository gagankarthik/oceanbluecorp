"use client";

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
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (hasAnimated) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          // Use requestAnimationFrame for smoother animation
          const duration = 1500;
          const startTime = performance.now();

          const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic for smoother finish
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * value));

            if (progress < 1) {
              requestAnimationFrame(animate);
            } else {
              setCount(value);
            }
          };

          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [value, hasAnimated]);

  return (
    <span ref={ref} className="text-4xl sm:text-5xl md:text-6xl font-light text-white inline-block drop-shadow-lg">
      {count}{suffix}
    </span>
  );
}

export default function StatsSections() {
  return (
    <section className="relative w-full py-16 sm:py-24 md:py-32 overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1723307060937-b003478a2c03?q=80&w=1200&auto=format&fit=crop"
          alt="Background"
          fill
          className="object-cover"
          sizes="100vw"
          loading="lazy"
        />
        {/* Darkening for Text Readability */}
        <div className="absolute inset-0 bg-black/30" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 max-w-6xl">
        <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-center">
          {/* Left Column - Heading */}
          <div className="text-white text-center md:text-left">
            <span className="text-xs sm:text-sm font-mono text-white/80 tracking-wider mb-3 sm:mb-4 block drop-shadow">
              — OUR IMPACT
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif leading-tight mb-4 sm:mb-6 drop-shadow-lg">
              Track record of
              <span className="block text-white mt-2 font-bold">Excellence</span>
            </h2>
            <p className="text-white/90 text-base sm:text-lg max-w-md mx-auto md:mx-0 drop-shadow">
              We deliver measurable results that help businesses scale faster with proven expertise across industries.
            </p>
          </div>

          {/* Right Column - Stats Grid */}
          <div className="grid grid-cols-2 gap-6 sm:gap-8 md:gap-12">
            {stats.map((stat) => (
              <div key={stat.id} className="border-l-4 border-white/50 pl-3 sm:pl-4">
                <div className="mb-1 drop-shadow-lg">
                  <Counter value={stat.value} suffix={stat.suffix} />
                </div>
                <p className="text-sm sm:text-base text-white/90 font-medium tracking-wide drop-shadow">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}