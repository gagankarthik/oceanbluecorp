"use client";

import { useState, useEffect } from "react";

// Landing page components with updated blue/purple color scheme
import TrustedCompanies from "@/components/TrustedCompanies";
import Certifications from "@/components/Certifications";
import TestimonialsShowcase from "@/components/TestimonialsShowcase";
import HeroSection from "@/components/HeroSection";
import CtaSection from "@/components/CtaSection";
import TerminalServices from "@/components/TerminalServices";
import StatsSections from "@/components/StatsSection";

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="bg-[#f8fafc] relative overflow-hidden">
      {/* Hero Section with Sky/Stars Background and Globe */}
      <HeroSection />

      {/* Scrolling Trusted Companies */}
      <TrustedCompanies />

      {/* Comprehensive Services - White background */}
     
      <TerminalServices />
      
      {/* Animated Stats - Dark background */}
      <StatsSections />

      {/* Certifications - Light background */}
      <Certifications />

      {/* Testimonials - White background */}
      <TestimonialsShowcase />

      {/* CTA Section - Blue gradient */}
      <CtaSection />

    </div>
  );
}
