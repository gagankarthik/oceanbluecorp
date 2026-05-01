"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Home, ArrowLeft } from "lucide-react";

/* ── Twinkling star dot ──────────────────────────────────────────────────── */
function Star({ x, y, size, delay }: { x: number; y: number; size: number; delay: number }) {
  return (
    <motion.span
      className="absolute rounded-full bg-white pointer-events-none"
      style={{ left: `${x}%`, top: `${y}%`, width: size, height: size }}
      animate={{ opacity: [0.15, 0.9, 0.15], scale: [0.7, 1.3, 0.7] }}
      transition={{ duration: 2.4 + delay * 0.6, repeat: Infinity, delay, ease: "easeInOut" }}
    />
  );
}

/* ── The fluffy-haired SVG character ─────────────────────────────────────── */
function FluffyCharacter() {
  return (
    <svg
      viewBox="0 0 260 330"
      width="240"
      height="305"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Confused fluffy-haired character"
    >
      {/* ── Ground shadow ── */}
      <ellipse cx="130" cy="323" rx="56" ry="7" fill="#000" opacity="0.18" />

      {/* ════════════════════════
          HAIR — big puffy cloud
          (dark→light, bottom→top)
         ════════════════════════ */}

      {/* Deepest base blobs — widest lateral spread */}
      <circle cx="74"  cy="148" r="42" fill="#3B0764" />
      <circle cx="186" cy="148" r="42" fill="#3B0764" />
      <circle cx="130" cy="132" r="50" fill="#3B0764" />

      {/* Side ear-puffs */}
      <circle cx="55"  cy="164" r="30" fill="#4C1D95" />
      <circle cx="205" cy="164" r="30" fill="#4C1D95" />

      {/* Mid layer */}
      <circle cx="86"  cy="108" r="40" fill="#5B21B6" />
      <circle cx="174" cy="108" r="40" fill="#5B21B6" />
      <circle cx="130" cy="96"  r="46" fill="#5B21B6" />

      {/* Upper layer */}
      <circle cx="100" cy="74"  r="34" fill="#6D28D9" />
      <circle cx="160" cy="74"  r="34" fill="#6D28D9" />
      <circle cx="130" cy="62"  r="38" fill="#6D28D9" />

      {/* Near-top puffs */}
      <circle cx="88"  cy="50"  r="26" fill="#7C3AED" />
      <circle cx="172" cy="50"  r="26" fill="#7C3AED" />
      <circle cx="130" cy="42"  r="30" fill="#7C3AED" />

      {/* Very top accent puffs */}
      <circle cx="108" cy="36"  r="19" fill="#8B5CF6" />
      <circle cx="152" cy="36"  r="19" fill="#8B5CF6" />
      <circle cx="130" cy="28"  r="22" fill="#8B5CF6" />

      {/* Tiny tip puffs */}
      <circle cx="118" cy="22"  r="13" fill="#A78BFA" />
      <circle cx="142" cy="22"  r="13" fill="#A78BFA" />
      <circle cx="130" cy="16"  r="14" fill="#A78BFA" />

      {/* Highlight sheen on hair */}
      <circle cx="112" cy="52"  r="12" fill="#C4B5FD" opacity="0.38" />
      <circle cx="150" cy="44"  r="9"  fill="#DDD6FE" opacity="0.32" />
      <circle cx="130" cy="34"  r="8"  fill="#EDE9FE" opacity="0.3"  />

      {/* ════════════════════════
          HEAD & FACE
         ════════════════════════ */}

      {/* Ears (behind head) */}
      <circle cx="72"  cy="174" r="13" fill="#FDE68A" />
      <circle cx="188" cy="174" r="13" fill="#FDE68A" />
      <circle cx="72"  cy="174" r="8"  fill="#FCA5A5" opacity="0.45" />
      <circle cx="188" cy="174" r="8"  fill="#FCA5A5" opacity="0.45" />

      {/* Head */}
      <circle cx="130" cy="175" r="58" fill="#FDE68A" />

      {/* Cheek blush */}
      <circle cx="100" cy="190" r="12" fill="#FCA5A5" opacity="0.45" />
      <circle cx="160" cy="190" r="12" fill="#FCA5A5" opacity="0.45" />

      {/* Left eye */}
      <circle cx="112" cy="168" r="10" fill="white" />
      <circle cx="114" cy="168" r="6"  fill="#1E1B4B" />
      <circle cx="116" cy="165" r="2"  fill="white" />
      {/* Left eyelash */}
      <path d="M104 161 Q108 157 113 160" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" fill="none" />

      {/* Right eye */}
      <circle cx="148" cy="168" r="10" fill="white" />
      <circle cx="150" cy="168" r="6"  fill="#1E1B4B" />
      <circle cx="152" cy="165" r="2"  fill="white" />
      {/* Right eyelash */}
      <path d="M143 160 Q148 157 152 161" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" fill="none" />

      {/* Eyebrows — raised / surprised */}
      <path d="M102 153 Q112 146 122 151" stroke="#5B21B6" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <path d="M138 151 Q148 146 158 153" stroke="#5B21B6" strokeWidth="3.5" strokeLinecap="round" fill="none" />

      {/* Nose */}
      <circle cx="130" cy="180" r="3" fill="#F59E0B" opacity="0.55" />

      {/* Mouth — surprised O */}
      <ellipse cx="130" cy="196" rx="9" ry="10" fill="#F97316" />
      <ellipse cx="130" cy="197" rx="6"  ry="7"  fill="#7C2D12" />

      {/* ════════════════════════
          BODY
         ════════════════════════ */}

      {/* Neck */}
      <rect x="118" y="226" width="24" height="18" rx="9" fill="#FDE68A" />

      {/* Shirt */}
      <rect x="82" y="238" width="96" height="74" rx="20" fill="#2563EB" />

      {/* V collar detail */}
      <path d="M112 238 L130 257 L148 238" fill="#1D4ED8" />

      {/* Arms */}
      <path d="M82 254 Q48 272 52 296"  stroke="#2563EB" strokeWidth="22" strokeLinecap="round" fill="none" />
      <path d="M178 254 Q212 272 208 296" stroke="#2563EB" strokeWidth="22" strokeLinecap="round" fill="none" />

      {/* Hands */}
      <circle cx="51"  cy="300" r="15" fill="#FDE68A" />
      <circle cx="209" cy="300" r="15" fill="#FDE68A" />

      {/* Legs */}
      <rect x="90"  y="307" width="30" height="16" rx="7" fill="#1E3A5F" />
      <rect x="140" y="307" width="30" height="16" rx="7" fill="#1E3A5F" />

      {/* Shoes */}
      <ellipse cx="105" cy="323" rx="21" ry="8" fill="#0F172A" />
      <ellipse cx="155" cy="323" rx="21" ry="8" fill="#0F172A" />
    </svg>
  );
}

/* ── Floating question mark decoration ───────────────────────────────────── */
function FloatingGlyph({ char, x, y, delay, color }: { char: string; x: string; y: string; delay: number; color: string }) {
  return (
    <motion.span
      className={`absolute text-2xl font-black select-none pointer-events-none ${color}`}
      style={{ left: x, top: y, opacity: 0 }}
      animate={{ opacity: [0, 0.6, 0], y: [0, -30, -60] }}
      transition={{ duration: 4, repeat: Infinity, delay, ease: "easeInOut" }}
    >
      {char}
    </motion.span>
  );
}

/* ── Page ─────────────────────────────────────────────────────────────────── */
export default function NotFound() {
  const stars = [
    { x: 4,  y: 8,  size: 3, delay: 0    },
    { x: 12, y: 22, size: 2, delay: 0.5  },
    { x: 88, y: 12, size: 3, delay: 1.1  },
    { x: 94, y: 38, size: 2, delay: 0.3  },
    { x: 22, y: 72, size: 2, delay: 0.8  },
    { x: 78, y: 68, size: 3, delay: 1.4  },
    { x: 8,  y: 82, size: 2, delay: 0.4  },
    { x: 92, y: 82, size: 2, delay: 1.0  },
    { x: 48, y: 6,  size: 2, delay: 1.7  },
    { x: 33, y: 90, size: 3, delay: 0.6  },
    { x: 68, y: 92, size: 2, delay: 1.3  },
    { x: 55, y: 18, size: 2, delay: 2.0  },
    { x: 3,  y: 50, size: 2, delay: 0.2  },
    { x: 96, y: 55, size: 2, delay: 1.8  },
  ];

  return (
    <div className="relative min-h-screen bg-[#050D1A] flex flex-col items-center justify-center overflow-hidden px-4 py-20">

      {/* Ambient glow blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-violet-950/40 blur-[130px]" />
        <div className="absolute top-1/3 right-1/4 w-[350px] h-[350px] rounded-full bg-indigo-950/30 blur-[90px]" />
        <div className="absolute bottom-1/4 left-1/4 w-[280px] h-[280px] rounded-full bg-blue-950/30 blur-[80px]" />
      </div>

      {/* Twinkling stars */}
      {stars.map((s, i) => <Star key={i} {...s} />)}

      {/* Ghost "404" watermark behind everything */}
      <div
        className="absolute inset-0 flex items-center justify-center select-none pointer-events-none"
        aria-hidden
      >
        <span
          className="text-[38vw] sm:text-[32vw] lg:text-[26vw] font-black leading-none"
          style={{
            color: "transparent",
            WebkitTextStroke: "2px rgba(139,92,246,0.09)",
            fontFamily: "'Space Grotesk', system-ui, sans-serif",
          }}
        >
          404
        </span>
      </div>

      {/* ── Content ── */}
      <div className="relative z-10 flex flex-col items-center text-center gap-7">

        {/* Floating question marks orbiting the character */}
        <div className="relative">
          <FloatingGlyph char="?" x="5%"  y="30%" delay={0}   color="text-violet-400/60" />
          <FloatingGlyph char="?" x="88%" y="20%" delay={1.2} color="text-indigo-400/60" />
          <FloatingGlyph char="¿" x="2%"  y="55%" delay={2.1} color="text-purple-400/50" />
          <FloatingGlyph char="?" x="90%" y="60%" delay={0.7} color="text-violet-300/50" />

          {/* Character with float animation */}
          <motion.div
            animate={{ y: [0, -16, 0] }}
            transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut" }}
          >
            {/* Hair shimmer: subtle whole-character scale pulse */}
            <motion.div
              animate={{ scale: [1, 1.015, 1] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
            >
              <FluffyCharacter />
            </motion.div>
          </motion.div>
        </div>

        {/* 404 + title */}
        <div className="space-y-2">
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.15 }}
            className="text-7xl sm:text-8xl font-black tracking-tight leading-none"
            style={{
              background: "linear-gradient(135deg, #e0e7ff 0%, #a5b4fc 35%, #818cf8 65%, #6366f1 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              fontFamily: "'Space Grotesk', system-ui, sans-serif",
            }}
          >
            404
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-xl sm:text-2xl font-bold text-white/90 tracking-tight"
            style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
          >
            Oops — page not found
          </motion.p>
        </div>

        {/* Sub-message */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.55, delay: 0.45 }}
          className="text-slate-400 text-sm sm:text-base max-w-xs sm:max-w-sm leading-relaxed"
        >
          Even our fluffiest helper searched everywhere and came up empty.
          The page you&rsquo;re looking for doesn&rsquo;t exist or has been moved.
        </motion.p>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="flex items-center gap-3 flex-wrap justify-center"
        >
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-all hover:shadow-xl hover:shadow-indigo-500/30 hover:-translate-y-0.5 active:translate-y-0"
          >
            <Home className="w-4 h-4" />
            Back to Home
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 px-6 py-3 border border-slate-700 hover:border-violet-500/60 text-slate-400 hover:text-white text-sm font-semibold rounded-xl transition-all hover:-translate-y-0.5 active:translate-y-0 bg-white/[0.03] hover:bg-white/[0.07]"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
        </motion.div>

        {/* Footer hint */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="text-[11px] text-slate-600 mt-2"
        >
          Error code 404 &middot; Page not found
        </motion.p>
      </div>
    </div>
  );
}
