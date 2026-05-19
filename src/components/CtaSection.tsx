"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Sparkles as SparklesIcon,
} from "lucide-react";
import { Sparkles } from "./ui/sparkles";

/* ============================================================
   CTA — Ocean Blue brand, sparkles background + glassmorphism.
   ============================================================ */

export default function CtaSection() {
  return (
    <section className="relative overflow-hidden bg-white px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative isolate overflow-hidden rounded-3xl"
          style={{
            background:
              "linear-gradient(135deg, #0f172a 0%, #1e1b4b 45%, #312e81 100%)",
          }}
        >
          {/* Sparkles particle layer */}
          <Sparkles
            className="absolute inset-0 z-0"
            density={520}
            size={1.4}
            minSize={0.5}
            speed={0.5}
            minSpeed={0.08}
            opacity={0.9}
            opacitySpeed={2.4}
            minOpacity={0.05}
            color="#c4b5fd"
          />

          {/* Soft animated orbs — depth above particles */}
          <motion.div
            aria-hidden
            animate={{ scale: [1, 1.18, 1], opacity: [0.45, 0.7, 0.45] }}
            transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
            className="pointer-events-none absolute -right-32 -top-32 z-[1] h-96 w-96 rounded-full bg-blue-500/35 blur-3xl"
          />
          <motion.div
            aria-hidden
            animate={{ scale: [1.15, 1, 1.15], opacity: [0.3, 0.55, 0.3] }}
            transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="pointer-events-none absolute -bottom-40 -left-32 z-[1] h-96 w-96 rounded-full bg-cyan-500/30 blur-3xl"
          />

          {/* Bottom wave for continuity with hero */}
          <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 z-[2]">
            <svg viewBox="0 0 1440 80" className="h-auto w-full" preserveAspectRatio="none">
              <path
                fill="rgba(255,255,255,0.025)"
                d="M0,40 C360,80 720,0 1080,40 C1260,60 1380,50 1440,40 L1440,80 L0,80 Z"
              />
            </svg>
          </div>

          {/* Top glassmorphism overlay — the foreground card */}
          <div className="relative z-10 grid grid-cols-12 gap-10 p-8 sm:p-12 lg:p-16">
            {/* LEFT: glass headline panel */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="col-span-12 lg:col-span-7"
            >
              <div
                className="relative overflow-hidden rounded-2xl border border-white/15 p-6 sm:p-8"
                style={{
                  background: "rgba(255, 255, 255, 0.06)",
                  backdropFilter: "blur(20px) saturate(140%)",
                  WebkitBackdropFilter: "blur(20px) saturate(140%)",
                  boxShadow:
                    "inset 0 1px 0 0 rgba(255,255,255,0.18), 0 30px 80px -20px rgba(0,0,0,0.45)",
                }}
              >
                {/* Top sheen line */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 top-0 h-px"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)",
                  }}
                />

                <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/[0.08] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/90 backdrop-blur-sm">
                  <SparklesIcon className="h-3 w-3 text-cyan-300" />
                  Let's build something
                </span>

                <h2
                  className="mt-5 text-[2rem] font-light leading-[1.05] tracking-tight text-white sm:text-[2.6rem] lg:text-[3.4rem]"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Ready to modernise{" "}
                  <span className="bg-gradient-to-r from-cyan-300 via-blue-300 to-indigo-300 bg-clip-text font-medium text-transparent">
                    what's next?
                  </span>
                </h2>

                <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-white/75 sm:text-[16px]">
                  Tell us where you're headed. We'll bring the people, the
                  playbook, and the operating muscle to get you there — one
                  accountable partner, one consolidated SLA.
                </p>

                <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Link
                    href="/contact"
                    className="group inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-slate-900 shadow-lg shadow-blue-500/20 transition-all hover:-translate-y-0.5 hover:bg-gray-100 hover:shadow-xl"
                  >
                    <Calendar className="h-4 w-4" />
                    Book a discovery call
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                  <Link
                    href="/services"
                    className="group inline-flex items-center justify-center gap-2 rounded-full border border-white/25 bg-white/[0.08] px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:border-white/45 hover:bg-white/[0.14]"
                  >
                    Explore services
                  </Link>
                </div>
              </div>
            </motion.div>

            {/* RIGHT: glass contact card */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="col-span-12 lg:col-span-5"
            >
              <div
                className="relative overflow-hidden rounded-2xl border border-white/15 p-5 sm:p-6"
                style={{
                  background: "rgba(255, 255, 255, 0.06)",
                  backdropFilter: "blur(20px) saturate(140%)",
                  WebkitBackdropFilter: "blur(20px) saturate(140%)",
                  boxShadow:
                    "inset 0 1px 0 0 rgba(255,255,255,0.18), 0 30px 80px -20px rgba(0,0,0,0.45)",
                }}
              >
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 top-0 h-px"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)",
                  }}
                />

                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-cyan-200">
                  Get in touch
                </p>
                <p
                  className="mt-1 text-[18px] font-medium text-white"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Reach the team directly.
                </p>

                <ul className="mt-5 space-y-2.5 border-t border-white/10 pt-5">
                  <li>
                    <a
                      href="mailto:info@oceanbluecorp.com"
                      className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3 transition-all hover:border-cyan-300/40 hover:bg-white/[0.08]"
                    >
                      <span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-lg bg-gradient-to-br from-blue-500/30 to-cyan-500/30 ring-1 ring-white/15">
                        <Mail className="h-4 w-4 text-cyan-200" strokeWidth={2.25} />
                      </span>
                      <div className="min-w-0">
                        <p className="text-[10.5px] font-semibold uppercase tracking-wider text-white/55">
                          Email
                        </p>
                        <p className="truncate text-[13.5px] font-semibold text-white">
                          info@oceanbluecorp.com
                        </p>
                      </div>
                      <ArrowRight className="ml-auto h-4 w-4 text-white/40 transition-all group-hover:translate-x-0.5 group-hover:text-cyan-200" />
                    </a>
                  </li>
                  <li>
                    <a
                      href="tel:+16148446925"
                      className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3 transition-all hover:border-cyan-300/40 hover:bg-white/[0.08]"
                    >
                      <span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-lg bg-gradient-to-br from-indigo-500/30 to-violet-500/30 ring-1 ring-white/15">
                        <Phone className="h-4 w-4 text-cyan-200" strokeWidth={2.25} />
                      </span>
                      <div className="min-w-0">
                        <p className="text-[10.5px] font-semibold uppercase tracking-wider text-white/55">
                          Phone
                        </p>
                        <p className="truncate text-[13.5px] font-semibold text-white">
                          +1 (614) 844-6925
                        </p>
                      </div>
                      <ArrowRight className="ml-auto h-4 w-4 text-white/40 transition-all group-hover:translate-x-0.5 group-hover:text-cyan-200" />
                    </a>
                  </li>
                  <li>
                    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3">
                      <span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-lg bg-gradient-to-br from-cyan-500/30 to-blue-500/30 ring-1 ring-white/15">
                        <MapPin className="h-4 w-4 text-cyan-200" strokeWidth={2.25} />
                      </span>
                      <div className="min-w-0">
                        <p className="text-[10.5px] font-semibold uppercase tracking-wider text-white/55">
                          Headquarters
                        </p>
                        <p className="truncate text-[13.5px] font-semibold text-white">
                          Powell, Ohio · USA
                        </p>
                      </div>
                    </div>
                  </li>
                </ul>

                <div className="mt-4 flex items-center justify-between rounded-xl bg-white/[0.04] px-3 py-2.5 text-[11.5px] text-white/65">
                  <span className="inline-flex items-center gap-2">
                    <span className="relative inline-flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    </span>
                    Replies within 24 hours
                  </span>
                  <span className="text-white/45">Mon — Fri</span>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
