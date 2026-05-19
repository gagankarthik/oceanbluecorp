"use client";

import { useState, useEffect } from "react";

import HeroSection from "@/components/HeroSection";
import TrustedCompanies from "@/components/TrustedCompanies";
import TerminalServices from "@/components/TerminalServices";
import StatsSection from "@/components/StatsSection";
import Certifications from "@/components/Certifications";
import TestimonialsShowcase from "@/components/TestimonialsShowcase";
import CtaSection from "@/components/CtaSection";

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="relative overflow-hidden bg-white">
      {/* Hero — dark navy/indigo gradient with globe */}
      <HeroSection />

      {/* Clients — logo marquee */}
      <TrustedCompanies />

      {/* What We Offer — colorful 9-card service grid */}
      <TerminalServices />

      {/* Our Impact — stats on dark background */}
      <StatsSection />

      {/* Trust signals */}
      <Certifications />

      {/* Client testimonials */}
      <TestimonialsShowcase />

      {/* CTA */}
      <CtaSection />
    </div>
  );
}
