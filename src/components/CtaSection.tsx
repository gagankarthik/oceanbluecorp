"use client";

import Link from "next/link";
import { ArrowRight, Mail, Phone } from "lucide-react";
import { motion } from "framer-motion";

const MESH = [
  "radial-gradient(ellipse 90% 70% at 50% 120%, rgba(79,70,229,0.95) 0%, transparent 60%)",
  "radial-gradient(ellipse 65% 55% at 8%  15%,  rgba(37,99,235,0.7)  0%, transparent 50%)",
  "radial-gradient(ellipse 55% 45% at 92% 12%,  rgba(124,58,237,0.6) 0%, transparent 48%)",
  "radial-gradient(ellipse 50% 40% at 15% 92%,  rgba(6,182,212,0.45) 0%, transparent 48%)",
  "radial-gradient(ellipse 45% 38% at 88% 88%,  rgba(16,185,129,0.3) 0%, transparent 45%)",
  "#080C14",
].join(", ");

const NOISE = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

export default function CtaSection() {
  return (
    <section className="relative overflow-hidden" style={{ background: "#080C14" }}>
      {/* Rich Stripe-quality mesh gradient */}
      <div className="pointer-events-none absolute inset-0" style={{ background: MESH }} />

      {/* Grain texture */}
      <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: NOISE, opacity: 0.04 }} />

      {/* Fine dot grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-15"
        style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)", backgroundSize: "24px 24px" }}
      />

      {/* Radial top-bloom for depth */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(ellipse 70% 50% at 50% -5%, rgba(255,255,255,0.12) 0%, transparent 60%)" }}
      />

      <div className="relative z-10 mx-auto max-w-5xl px-6 py-24 text-center md:py-36 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Badge */}
          <div className="mb-9 flex justify-center">
            <span
              className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium backdrop-blur-sm"
              style={{
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.18)",
                color: "rgba(255,255,255,0.8)",
                fontFamily: "var(--font-display)",
              }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-white/55" />
              Ready to get started?
            </span>
          </div>

          {/* Headline — mixed typeface */}
          <div className="mb-7">
            <h2
              style={{
                fontSize: "clamp(2.8rem, 7vw, 5.5rem)",
                lineHeight: 1.02,
                letterSpacing: "-0.025em",
              }}
            >
              <span
                className="block text-white"
                style={{ fontFamily: "var(--font-display)", fontWeight: 800 }}
              >
                Let&rsquo;s build something
              </span>
              <span
                className="block"
                style={{
                  fontFamily: "var(--font-serif)",
                  fontStyle: "italic",
                  fontWeight: 400,
                  letterSpacing: "-0.015em",
                  background: "linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 35%, #a5b4fc 65%, #818cf8 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                extraordinary.
              </span>
            </h2>
          </div>

          {/* Subtext */}
          <p className="mx-auto mb-11 max-w-lg text-lg leading-relaxed text-white/55">
            Whether you need elite IT talent, cloud infrastructure, or a complete
            digital transformation — we deliver at every scale.
          </p>

          {/* CTAs */}
          <div className="mb-11 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/contact"
              className="group inline-flex items-center gap-2 rounded-full bg-white px-9 py-4 text-sm font-bold transition-all hover:bg-white/92"
              style={{
                color: "#4338ca",
                boxShadow: "0 8px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.9)",
                fontFamily: "var(--font-display)",
              }}
            >
              Contact us today
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/careers"
              className="inline-flex items-center gap-2 rounded-full border px-9 py-4 text-sm font-semibold backdrop-blur-sm transition-all hover:border-white/45 hover:bg-white/8 hover:text-white"
              style={{
                borderColor: "rgba(255,255,255,0.22)",
                color: "rgba(255,255,255,0.75)",
                fontFamily: "var(--font-display)",
              }}
            >
              Explore careers
            </Link>
          </div>

          {/* Contact details */}
          <div className="flex flex-col items-center justify-center gap-4 text-sm text-white/38 sm:flex-row sm:gap-7">
            <a
              href="mailto:hr@oceanbluecorp.com"
              className="flex items-center gap-2 transition-colors hover:text-white/72"
            >
              <Mail className="h-4 w-4" />
              hr@oceanbluecorp.com
            </a>
            <div className="hidden h-4 w-px bg-white/14 sm:block" />
            <a
              href="tel:+16148446925"
              className="flex items-center gap-2 transition-colors hover:text-white/72"
            >
              <Phone className="h-4 w-4" />
              +1 (614) 844-6925
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
