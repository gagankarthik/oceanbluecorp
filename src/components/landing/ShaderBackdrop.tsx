"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useReducedMotion } from "framer-motion";

/* ============================================================
   ShaderBackdrop — an animated WebGL gradient behind a section.

   ── What this costs ──────────────────────────────────────────
   three + @react-three/fiber + @shadergradient/react is roughly
   600KB of JavaScript and one live WebGL context that renders
   continuously. That is a real bill for a background, so it is
   paid on three conditions and never otherwise:

     1. Client-side only, behind next/dynamic with ssr:false, so
        none of it is in the server bundle or the first payload.
     2. Not requested until the section is actually near the
        viewport (IntersectionObserver, 300px margin). Put this
        behind the fold — on the hero it would compete with the
        LCP image, which is the one thing on this page that has
        been optimised hardest.
     3. Never for `prefers-reduced-motion`, and never when the
        browser cannot give us a WebGL context. Both fall back to
        the static CSS gradient below, which is what the section
        looked like before and is perfectly fine on its own.

   ── Why these colours ────────────────────────────────────────
   The preset this came from used #ff5005 / #dbba95 / #d0bce1 —
   orange, tan and lilac. Those are three new accents on a page
   that was just consolidated down to ONE, and none of them
   appear anywhere else in the product. The shader keeps its
   motion and grain; the palette is Ocean Blue's own: cobalt,
   the dark-ground cobalt tint, and the ink the section sits on.
   ============================================================ */

const ShaderGradientCanvas = dynamic(
  () => import("@shadergradient/react").then((m) => m.ShaderGradientCanvas),
  { ssr: false },
);
const ShaderGradient = dynamic(
  () => import("@shadergradient/react").then((m) => m.ShaderGradient),
  { ssr: false },
);

/** Cheap WebGL probe. Some locked-down browsers and VMs have none. */
function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

export default function ShaderBackdrop({
  className = "",
  /** 0-100. Lower keeps a dark section dark; the shader tints rather than
   *  replaces the ground it sits on. */
  intensity = 70,
}: {
  className?: string;
  intensity?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (reduce || !ref.current || !hasWebGL()) return;
    const el = ref.current;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShow(true);
          io.disconnect();
        }
      },
      { rootMargin: "300px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduce]);

  return (
    <div ref={ref} aria-hidden className={`absolute inset-0 overflow-hidden ${className}`}>
      {/* The floor. Present from first paint, and the permanent state for
          reduced-motion and no-WebGL visitors. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(65% 80% at 18% 15%, rgba(29,78,216,0.30), transparent 62%), radial-gradient(55% 70% at 92% 88%, rgba(143,180,253,0.14), transparent 60%)",
        }}
      />

      {show && (
        <div className="absolute inset-0 transition-opacity duration-1000" style={{ opacity: intensity / 100 }}>
          <ShaderGradientCanvas
            style={{ position: "absolute", inset: 0 }}
            pointerEvents="none"
          >
            <ShaderGradient
              animate="on"
              type="plane"
              shader="defaults"
              // Ocean Blue's palette, not the preset's orange/tan/lilac.
              color1="#1d4ed8"
              color2="#8fb4fd"
              color3="#050912"
              brightness={1.1}
              cAzimuthAngle={180}
              cDistance={3.6}
              cPolarAngle={90}
              cameraZoom={1}
              envPreset="city"
              grain="on"
              lightType="3d"
              positionX={-1.4}
              positionY={0}
              positionZ={0}
              reflection={0.1}
              rotationX={0}
              rotationY={10}
              rotationZ={50}
              uAmplitude={1}
              uDensity={1.3}
              uFrequency={5.5}
              // Slower than the preset's 0.4. A background that moves at a
              // speed you can notice stops being a background.
              uSpeed={0.18}
              uStrength={4}
              uTime={0}
            />
          </ShaderGradientCanvas>
        </div>
      )}
    </div>
  );
}
