"use client";

import Image from "next/image";
import { motion } from "framer-motion";

type Partner = {
  name: string;
  logo: string;
  className?: string;
};

const partners: Partner[] = [
  { name: "Ohio", logo: "https://development.ohio.gov/wps/wcm/connect/gov/7efff5ea-f9fd-4c0f-9a71-401183103f50/development-logo.png?MOD=AJPERES" },
  { name: "HGS", logo: "/hgs.svg" },
  { name: "Dieboldnixdorf", logo: "https://www.dieboldnixdorf.com/-/media/diebold/images/global/logo/dn-color-logo.svg" },
  { name: "Satyawholesale", logo: "https://www.satyawholesalers.com/_next/image?url=https%3A%2F%2Fsatyawholesalers.net%2Fstorage%2F3288%2Fsatya-wholesale-logo-(1).png&w=1920&q=75" },
  { name: "CityBarbeque", logo: "/citybarbeque.svg" },
  { name: "Tacos", logo: "/tacos.webp", className: "bg-black p-2 rounded-md" },
];

const techPartners: Partner[] = [
  { name: "NMSDC", logo: "/NMSDC.png" },
  { name: "Ohio WBE", logo: "/wbe.png" },
  { name: "Ohio MBE", logo: "/ohiombe.png" },
  { name: "MBE", logo: "/mbe.png" },
];

export default function PartnersCloud() {
  return (
    <section className="relative py-24 overflow-hidden bg-[#F5FEFD]">

      {/* subtle background glow */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.08),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,rgba(14,165,233,0.08),transparent_60%)]" />
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-10">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-3">
            Trusted by{" "}
            <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent font-medium">
              Industry Leaders
            </span>
          </h2>

          <p className="text-gray-600 text-lg">
            Partnerships powering innovation across industries
          </p>
        </motion.div>

        {/* TOP ROW SCROLL LEFT */}
        <div className="overflow-hidden mb-16">
          <motion.div
            className="flex gap-10"
            animate={{ x: ["0%", "-50%"] }}
            transition={{
              duration: 25,
              ease: "linear",
              repeat: Infinity,
            }}
          >
            {[...partners, ...partners].map((partner, i) => (
              <LogoCard key={i} partner={partner} />
            ))}
          </motion.div>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-12">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />

          <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
            Certified by
          </span>

          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
        </div>

        {/* BOTTOM ROW SCROLL RIGHT */}
        <div className="overflow-hidden">
          <motion.div
            className="flex gap-10"
            animate={{ x: ["-50%", "0%"] }}
            transition={{
              duration: 25,
              ease: "linear",
              repeat: Infinity,
            }}
          >
            {[...techPartners, ...techPartners].map((partner, i) => (
              <LogoCard key={i} partner={partner} large />
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* Logo Card */

function LogoCard({
  partner,
  large,
}: {
  partner: Partner;
  large?: boolean;
}) {
  return (
    <div className="group relative min-w-[180px]">

      {/* glow */}
      <div className="absolute inset-0 bg-blue-200/20 blur-xl opacity-0 group-hover:opacity-100 transition duration-300 rounded-2xl" />

      <div
        className={`relative flex items-center justify-center rounded-2xl border border-gray-200 bg-white/70 backdrop-blur-sm shadow-sm group-hover:shadow-lg transition-all duration-300
        ${large ? "p-8" : "p-6"}
        `}
      >
        <Image
          src={partner.logo}
          alt={partner.name}
          width={140}
          height={60}
          className={`object-contain ${
            large ? "h-12" : "h-10"
          } ${partner.className || ""}`}
          unoptimized
        />
      </div>
    </div>
  );
}