"use client";

import { motion } from "framer-motion";
import Image from "next/image";

type Partner = {
  name: string;
  logo: string;
  className?: string;
};

const techPartners: Partner[] = [
  { name: "NMSDC", logo: "/NMSDC.png" },
  { name: "Ohio WBE", logo: "/wbe.png" },
  { name: "Ohio MBE", logo: "/ohiombe.png" },
  { name: "MBE", logo: "/mbe.png" },
];

function LogoCard({ partner, large = false }: { partner: Partner; large?: boolean }) {
  return (
    <div className="relative group cursor-pointer">
      <div className={`relative flex items-center justify-center transition-all duration-300 group-hover:scale-105 ${
        large ? "h-20 sm:h-24 w-32 sm:w-40 md:w-48" 
          : "h-16 sm:h-20 w-24 sm:w-28 md:w-32"
      }`}>
        <Image
          src={partner.logo}
          alt={partner.name}
          fill
          className={`object-contain ${partner.className || ""}`}
          sizes="(max-width: 768px) 100px, 200px"
        />
      </div>
      <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
      </div>
    </div>
  );
}

export default function Certifications() {
  return (
    <section className="relative bg-gray-50 py-20">
      <div className="px-6 md:px-12 lg:px-20 max-w-[1400px] mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <p className="text-gray-600 text-sm font-medium tracking-wider uppercase mb-3">
            Certified & Trusted
          </p>
          <h2 className="text-gray-900 text-4xl md:text-5xl font-light tracking-tight">
            Industry-recognized excellence
          </h2>
        </motion.div>

        {/* Certifications Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 sm:grid-cols-2 gap-8 items-center justify-items-center">
          {techPartners.map((cert, index) => (
            <motion.div
              key={cert.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="w-full flex justify-center"
            >
              <LogoCard partner={cert} large />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}