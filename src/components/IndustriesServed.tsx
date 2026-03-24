"use client";

import { motion } from "framer-motion";
import { Building2, ShoppingCart, Factory, Hospital, Landmark, Plane } from "lucide-react";

const industries = [
  { name: "Financial Services", icon: Landmark, description: "Banking & Insurance" },
  { name: "Healthcare", icon: Hospital, description: "Medical & Life Sciences" },
  { name: "Retail & E-Commerce", icon: ShoppingCart, description: "Consumer Goods" },
  { name: "Manufacturing", icon: Factory, description: "Industrial & Logistics" },
  { name: "Enterprise", icon: Building2, description: "Fortune 500" },
  { name: "Transportation", icon: Plane, description: "Aviation & Shipping" },
];

export default function IndustriesServed() {
  return (
    <section className="relative bg-[#052424] py-24 md:py-32">
      <div className="px-6 md:px-12 lg:px-20 max-w-[1400px] mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="mb-16 text-center"
        >
          <span className="text-[#ABFF02] text-sm font-mono tracking-wider mb-4 block">
            TRUSTED BY INDUSTRIES
          </span>
          <h2 className="text-white text-[8vw] sm:text-[6vw] md:text-[5vw] lg:text-[3.5vw] font-light leading-[0.95] tracking-tight max-w-3xl mx-auto">
            Serving enterprises across diverse sectors
          </h2>
        </motion.div>

        {/* Industries Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {industries.map((industry, index) => (
            <motion.div
              key={industry.name}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="group relative"
            >
              <div className="p-8 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 hover:border-[#ABFF02] hover:bg-white/10 transition-all duration-500">
                {/* Icon */}
                <industry.icon className="w-10 h-10 text-[#C2C2C2] group-hover:text-[#ABFF02] mb-4 transition-colors" />

                {/* Title */}
                <h3 className="text-white text-lg font-medium mb-1 group-hover:text-[#ABFF02] transition-colors">
                  {industry.name}
                </h3>

                {/* Description */}
                <p className="text-[#C2C2C2] text-sm">
                  {industry.description}
                </p>

                {/* Hover line */}
                <div className="absolute bottom-0 left-0 h-1 w-0 bg-[#ABFF02] group-hover:w-full transition-all duration-500 rounded-b-lg" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
