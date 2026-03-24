"use client";

import { motion } from "framer-motion";
import Image from "next/image";

type Partner = {
  name: string;
  logo: string;
  className?: string;
};

const partners: Partner[] = [
  { 
    name: "Ohio", 
    logo: "https://development.ohio.gov/wps/wcm/connect/gov/7efff5ea-f9fd-4c0f-9a71-401183103f50/development-logo.png?MOD=AJPERES",
    className: "h-12 w-auto"
  },
  { 
    name: "HGS", 
    logo: "/hgs.svg",
    className: "h-12 w-auto"
  },
  { 
    name: "Dieboldnixdorf", 
    logo: "https://www.dieboldnixdorf.com/-/media/diebold/images/global/logo/dn-color-logo.svg",
    className: "h-12 w-auto"
  },
  { 
    name: "Satyawholesale", 
    logo: "https://www.satyawholesalers.com/_next/image?url=https%3A%2F%2Fsatyawholesalers.net%2Fstorage%2F3288%2Fsatya-wholesale-logo-(1).png&w=1920&q=75",
    className: "h-12 w-auto"
  },
  { 
    name: "CityBarbeque", 
    logo: "/citybarbeque.svg",
    className: "h-12 w-auto"
  },
  { 
    name: "Tacos", 
    logo: "/tacos.webp", 
    className: "h-12 w-auto bg-black p-2 rounded-md"
  },
];

function LogoCard({ partner }: { partner: Partner }) {
  return (
    <div className="flex-shrink-0 px-8 group">
      <div className="relative h-16 w-32 flex items-center justify-center transition-all duration-300 group-hover:scale-105">
        {partner.logo.startsWith("http") ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={partner.logo}
            alt={partner.name}
            className={`object-contain max-h-full max-w-full ${partner.className || ""}`}
          />
        ) : (
          <Image
            src={partner.logo}
            alt={partner.name}
            fill
            className={`object-contain ${partner.className || ""}`}
            sizes="(max-width: 768px) 100px, 128px"
          />
        )}
      </div>
    </div>
  );
}

export default function TrustedCompanies() {
  return (
    <section className="relative bg-white py-16 overflow-hidden border-y border-gray-200">
      <div className="px-6 md:px-12 lg:px-20 max-w-[1400px] mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <p className="text-gray-600 text-sm font-medium tracking-wider uppercase">
            Trusted by industry leaders
          </p>
        </motion.div>

        {/* Scrolling logos */}
        <div className="relative">
          <div className="flex overflow-hidden">
            <motion.div
              className="flex gap-16 items-center"
              animate={{
                x: [0, -1920],
              }}
              transition={{
                x: {
                  repeat: Infinity,
                  repeatType: "loop",
                  duration: 30,
                  ease: "linear",
                },
              }}
            >
              {/* First set */}
              {partners.map((partner, index) => (
                <LogoCard key={`first-${index}`} partner={partner} />
              ))}
              {/* Duplicate set for seamless loop */}
              {partners.map((partner, index) => (
                <LogoCard key={`second-${index}`} partner={partner} />
              ))}
            </motion.div>
          </div>

          {/* Gradient overlays */}
          <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-white to-transparent pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-white to-transparent pointer-events-none" />
        </div>
      </div>
    </section>
  );
}