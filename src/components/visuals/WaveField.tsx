"use client";

import { useEffect, useRef } from "react";

const SETTLE_MS = 4500;

/**
 * A field of small dots that drifts like water once, slows to rest within
 * SETTLE_MS, then only ripples away from the pointer. Decorative; fully
 * static when the visitor prefers less motion.
 */
export default function WaveField({ className = "", color = "10, 114, 192" }: { className?: string; color?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pointer = { x: -9999, y: -9999, active: false };
    let w = 0;
    let h = 0;
    let raf = 0;
    let start = 0;
    // Wave time; decelerates to a stop, so the last frame is the resting one.
    let tau = 0;
    const gap = 22;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      for (let y = gap / 2; y < h; y += gap) {
        for (let x = gap / 2; x < w; x += gap) {
          const wave = Math.sin(x * 0.018 + t * 0.0009) * Math.cos(y * 0.022 - t * 0.0007);
          let dx = 0;
          let dy = wave * 3;
          let boost = 0;
          if (pointer.active) {
            const ddx = x - pointer.x;
            const ddy = y - pointer.y;
            const d = Math.hypot(ddx, ddy);
            if (d < 140) {
              const f = (1 - d / 140) ** 2;
              dx += (ddx / (d || 1)) * f * 10;
              dy += (ddy / (d || 1)) * f * 10;
              boost = f;
            }
          }
          const alpha = 0.1 + (wave + 1) * 0.06 + boost * 0.45;
          ctx.fillStyle = `rgba(${color}, ${alpha.toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(x + dx, y + dy, 1.3 + boost * 1.4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    const loop = (now: number) => {
      start ||= now;
      const p = Math.min((now - start) / SETTLE_MS, 1);
      tau = SETTLE_MS * (p - (p * p) / 2);
      draw(tau);
      raf = p < 1 ? requestAnimationFrame(loop) : 0;
    };

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
      const was = pointer.active;
      pointer.active = pointer.x >= 0 && pointer.y >= 0 && pointer.x <= w && pointer.y <= h;
      // Settled: redraw only for the ripple, and once more to clear it on leaving.
      if (!raf && (pointer.active || was)) draw(tau);
    };

    resize();
    const ro = new ResizeObserver(() => {
      resize();
      if (!raf) draw(tau);
    });
    ro.observe(canvas);
    if (!reduce) window.addEventListener("pointermove", onMove, { passive: true });

    if (reduce) draw(0);
    else raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
    };
  }, [color]);

  return <canvas ref={ref} aria-hidden className={`pointer-events-none absolute inset-0 h-full w-full ${className}`} />;
}
