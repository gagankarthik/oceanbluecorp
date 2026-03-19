"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";

// Components
import HeroSection from "@/components/HeroSection";
import PartnersCloud from "@/components/PartnersCloud";
import StatsSection from "@/components/StatsSection";
import IndustriesSection from "@/components/IndustriesSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import SolutionsStack from "@/components/SolutionsStack";
import CtaSection from "@/components/CtaSection";

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="bg-white relative overflow-hidden">
      {/* Hero Section with split layout and 3D background */}
      <HeroSection />

      {/* Partners Cloud */}
      <PartnersCloud />

      {/* Solutions Grid */}
      <SolutionsStack />

      {/* Statistics */}
      <StatsSection />

      

      {/* Testimonials - compact */}
      <TestimonialsSection />

    
      {/* CTA Section with Wave Background */}
     
      <CtaSection />




    </div>
  );
}
