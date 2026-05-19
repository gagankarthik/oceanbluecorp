"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Sparkles } from "./ui/sparkles";

type Partner = {
  name: string;
  logo: string;
  width?: number;
};

/* Clients only — tech partners (AWS, Snowflake, Databricks) live in the Hero */
const partners: Partner[] = [
  { name: "Ohio Development",   logo: "https://development.ohio.gov/wps/wcm/connect/gov/7efff5ea-f9fd-4c0f-9a71-401183103f50/development-logo.png?MOD=AJPERES", width: 130 },
  { name: "HGS",                logo: "/hgs.svg",                     width: 110 },
  { name: "Diebold Nixdorf",    logo: "https://www.dieboldnixdorf.com/-/media/diebold/images/global/logo/dn-color-logo.svg", width: 150 },
  { name: "Satya Wholesalers",  logo: "https://www.satyawholesalers.com/_next/image?url=https%3A%2F%2Fsatyawholesalers.net%2Fstorage%2F3288%2Fsatya-wholesale-logo-(1).png&w=1920&q=75", width: 130 },
  { name: "City Barbeque",      logo: "/citybarbeque.svg",            width: 130 },
];

function LogoItem({ p }: { p: Partner }) {
  return (
    <div className="flex h-10 shrink-0 items-center px-6 sm:px-9">
      {p.logo.startsWith("http") ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={p.logo}
          alt={p.name}
          width={p.width ?? 120}
          height={32}
          className="h-7 w-auto object-contain opacity-65 brightness-0 invert transition-all duration-300 hover:opacity-100"
          style={{ maxWidth: p.width ?? 120 }}
        />
      ) : (
        <Image
          src={p.logo}
          alt={p.name}
          width={p.width ?? 120}
          height={32}
          className="h-7 w-auto object-contain opacity-65 brightness-0 invert transition-all duration-300 hover:opacity-100"
        />
      )}
    </div>
  );
}

export default function TrustedCompanies() {
  const list = [...partners, ...partners]; // duplicate for seamless loop

  return (
    <section
      className="relative isolate overflow-hidden py-14 sm:py-16"
      style={{
        background:
          "linear-gradient(180deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)",
      }}
    >
      {/* Sparkles particle background */}
      <Sparkles
        className="absolute inset-0 z-0"
        density={460}
        size={1.1}
        minSize={0.4}
        speed={0.45}
        minSpeed={0.08}
        opacity={0.85}
        opacitySpeed={2}
        minOpacity={0.05}
        color="#a5b4fc"
      />

      {/* Subtle radial wash on top of particles for depth */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          background:
            "radial-gradient(60% 60% at 50% 50%, transparent 0%, rgba(15,23,42,0.55) 100%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center gap-2 text-center"
        >
          <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-indigo-200/80">
            <span className="inline-block h-px w-6 bg-indigo-400/40" />
            Trusted by leaders across industries
            <span className="inline-block h-px w-6 bg-indigo-400/40" />
          </p>
        </motion.div>

        <div className="relative mt-10 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
          <div className="flex reg-marquee">
            {list.map((p, i) => (
              <LogoItem key={`${p.name}-${i}`} p={p} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
