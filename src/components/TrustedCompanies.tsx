"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Sparkles } from "./ui/sparkles";
import { InfiniteSlider } from "./ui/infinite-slider";
import { ProgressiveBlur } from "./ui/progressive-blur";

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
    <div className="flex h-10 shrink-0 items-center">
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
  return (
    <section
      className="relative isolate w-full overflow-hidden"
      style={{
        // Top edge continues the hero's bottom gradient (slate-800 -> indigo-900),
        // then fades vertically into this section's own dark navy (#0f172a).
        background: [
          "linear-gradient(180deg, transparent 0%, #0f172a 72%, #0f172a 100%)",
          "linear-gradient(to right, #1e293b 0%, #312e81 100%)",
        ].join(", "),
      }}
    >
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pt-16 sm:px-6 sm:pt-20">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center gap-4 text-center"
        >
          <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-indigo-200/80">
            <span className="inline-block h-px w-6 bg-indigo-400/40" />
            Trusted by leaders across industries
            <span className="inline-block h-px w-6 bg-indigo-400/40" />
          </p>

          <h2
            className="text-[1.9rem] font-light leading-[1.08] tracking-tight text-white sm:text-[2.6rem]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            <span className="bg-gradient-to-r from-cyan-300 via-blue-300 to-indigo-300 bg-clip-text font-medium text-transparent">
              Trusted by experts.
            </span>
            <br />
            Chosen by the leaders.
          </h2>
        </motion.div>

        {/* Logo marquee with progressively blurred edges */}
        <div className="relative mt-12 h-[88px] w-full">
          <InfiniteSlider
            className="flex h-full w-full items-center"
            duration={40}
            durationOnHover={120}
            gap={72}
          >
            {partners.map((p) => (
              <LogoItem key={p.name} p={p} />
            ))}
          </InfiniteSlider>

          <ProgressiveBlur
            className="pointer-events-none absolute left-0 top-0 h-full w-[160px]"
            direction="left"
            blurIntensity={1}
          />
          <ProgressiveBlur
            className="pointer-events-none absolute right-0 top-0 h-full w-[160px]"
            direction="right"
            blurIntensity={1}
          />
        </div>
      </div>

      {/* Glowing horizon dome with rising sparkles */}
      <div className="relative -mt-10 h-80 w-full overflow-hidden [mask-image:radial-gradient(50%_50%,white,transparent)] sm:-mt-8">
        {/* Radial brand glow at the horizon */}
        <div className="absolute inset-0 before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_bottom_center,#8350e8,transparent_70%)] before:opacity-50" />

        {/* The curved horizon — matches the section background so only the arc reads */}
        <div
          className="absolute -left-1/2 top-1/2 z-10 aspect-[1/0.7] w-[200%] rounded-[100%] border-t border-white/20"
          style={{ background: "#0f172a" }}
        />

        {/* Sparkles converging at the horizon */}
        <Sparkles
          density={1000}
          size={1.3}
          minSize={0.4}
          speed={0.5}
          opacity={0.9}
          color="#ffffff"
          className="absolute inset-x-0 bottom-0 h-full w-full [mask-image:radial-gradient(50%_50%,white,transparent_85%)]"
        />
      </div>
    </section>
  );
}
