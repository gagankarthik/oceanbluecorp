"use client";

import { useEffect, useRef } from "react";

/**
 * Home hero background: a live talent network.
 *
 * Nodes sit on an isometric grid (the site's drawing language). Near the
 * pointer they brighten and link to their neighbours, so a constellation
 * follows the visitor; a pulse ripples out from a random node every few
 * seconds, like work moving through the network; a click or tap sends one
 * from that point. One canvas, transform-free, paused when off screen or the
 * tab is hidden. Under reduced motion it draws the grid once and stops.
 */

const SPACING = 58; // horizontal distance between nodes
const REACH = 230; // pointer influence radius
const RIPPLE_SPEED = 0.32; // px per ms
const RIPPLE_WIDTH = 36;
const RIPPLE_LIFE = 3200; // ms
const AUTO_EVERY = 2600; // ms between idle pulses

type Node = { x: number; y: number; n: number[]; glow: number };
type Ripple = { x: number; y: number; t0: number };

function buildGrid(w: number, h: number): Node[] {
  const rowH = SPACING * 0.5 * Math.sqrt(3) * 0.62; // flattened isometric rows
  const cols = Math.ceil(w / SPACING) + 2;
  const rows = Math.ceil(h / rowH) + 2;
  const nodes: Node[] = [];
  const index = (c: number, r: number) => r * cols + c;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = (c - 1) * SPACING + (r % 2 ? SPACING / 2 : 0);
      const y = (r - 1) * rowH;
      nodes.push({ x, y, n: [], glow: 0 });
    }
  }
  // Neighbours: right, and the two below (isometric weave). Each edge once.
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const i = index(c, r);
      if (c + 1 < cols) nodes[i].n.push(index(c + 1, r));
      if (r + 1 < rows) {
        const shift = r % 2 ? 0 : -1;
        if (c + shift >= 0) nodes[i].n.push(index(c + shift, r + 1));
        if (c + shift + 1 < cols) nodes[i].n.push(index(c + shift + 1, r + 1));
      }
    }
  }
  return nodes;
}

export function HeroNetwork() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.parentElement;
    if (!canvas || !host) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // The backdrop ignores the pointer (so it never blocks the hero's links);
    // listen on the hero section itself, which sees every move inside it.
    const events: HTMLElement = host.parentElement ?? host;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0;
    let h = 0;
    let nodes: Node[] = [];
    const ripples: Ripple[] = [];
    // Pointer: target and eased position; starts off-canvas so nothing lights until it moves.
    const target = { x: -9999, y: -9999 };
    const pointer = { x: -9999, y: -9999 };
    let raf = 0;
    let running = false;
    let lastAuto = 0;

    const resize = () => {
      const rect = host.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = rect.width;
      h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      nodes = buildGrid(w, h);
      // Always paint a still frame, so the grid is there before (or without) the loop.
      draw(performance.now());
    };

    const draw = (now: number) => {
      ctx.clearRect(0, 0, w, h);

      // Ease the pointer so the constellation trails it rather than snapping.
      pointer.x += (target.x - pointer.x) * 0.12;
      pointer.y += (target.y - pointer.y) * 0.12;

      // Idle pulse from a random node in the visible field.
      if (!reduce && now - lastAuto > AUTO_EVERY && nodes.length) {
        const pick = nodes[Math.floor(Math.random() * nodes.length)];
        ripples.push({ x: pick.x, y: pick.y, t0: now });
        lastAuto = now;
      }
      for (let i = ripples.length - 1; i >= 0; i--) if (now - ripples[i].t0 > RIPPLE_LIFE) ripples.splice(i, 1);

      // Per-node energy: pointer proximity plus any ripple ring passing through it.
      for (const nd of nodes) {
        const dx = nd.x - pointer.x;
        const dy = nd.y - pointer.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        let e = d < REACH ? Math.pow(1 - d / REACH, 1.6) : 0;
        for (const rp of ripples) {
          const age = now - rp.t0;
          const radius = age * RIPPLE_SPEED;
          const dist = Math.hypot(nd.x - rp.x, nd.y - rp.y);
          const band = Math.abs(dist - radius);
          if (band < RIPPLE_WIDTH) {
            const fade = 1 - age / RIPPLE_LIFE;
            e = Math.max(e, (1 - band / RIPPLE_WIDTH) * 0.85 * fade);
          }
        }
        // Glow decays smoothly so lit nodes fade rather than blink off.
        nd.glow = Math.max(e, nd.glow * 0.9);
      }

      // Edges: a faint weave everywhere, brighter where either end is lit.
      ctx.lineWidth = 1;
      for (const nd of nodes) {
        for (const j of nd.n) {
          const m = nodes[j];
          const g = Math.max(nd.glow, m.glow);
          const alpha = 0.08 + g * 0.55;
          ctx.strokeStyle = g > 0.02 ? `rgba(169, 193, 255, ${alpha})` : "rgba(255, 255, 255, 0.08)";
          ctx.beginPath();
          ctx.moveTo(nd.x, nd.y);
          ctx.lineTo(m.x, m.y);
          ctx.stroke();
        }
      }

      // Nodes: small squares (the site's vertex mark), growing and warming toward white when lit.
      for (const nd of nodes) {
        const g = nd.glow;
        const size = 2.5 + g * 3.2;
        ctx.fillStyle = g > 0.02 ? `rgba(${Math.round(169 + 86 * g)}, ${Math.round(193 + 62 * g)}, 255, ${0.35 + g * 0.65})` : "rgba(255, 255, 255, 0.4)";
        ctx.fillRect(nd.x - size / 2, nd.y - size / 2, size, size);
        // The brightest nodes get a halo, the "selected" people in the network.
        if (g > 0.55) {
          ctx.strokeStyle = `rgba(169, 193, 255, ${(g - 0.55) * 1.6})`;
          ctx.strokeRect(nd.x - 7, nd.y - 7, 14, 14);
        }
      }
    };

    const loop = (now: number) => {
      draw(now);
      raf = requestAnimationFrame(loop);
    };
    const start = () => {
      if (running || reduce) return;
      running = true;
      raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    const toLocal = (clientX: number, clientY: number) => {
      const r = host.getBoundingClientRect();
      return { x: clientX - r.left, y: clientY - r.top, inside: clientY >= r.top && clientY <= r.bottom };
    };
    const onMove = (e: PointerEvent) => {
      const p = toLocal(e.clientX, e.clientY);
      if (p.inside) {
        target.x = p.x;
        target.y = p.y;
      } else {
        target.x = target.y = -9999;
      }
    };
    const onLeave = () => {
      target.x = target.y = -9999;
    };
    const onDown = (e: PointerEvent) => {
      const p = toLocal(e.clientX, e.clientY);
      if (p.inside) ripples.push({ x: p.x, y: p.y, t0: performance.now() });
    };

    const ro = new ResizeObserver(resize);
    ro.observe(host);
    resize();

    // Only animate while the hero is on screen and the tab is visible.
    const io = new IntersectionObserver(([entry]) => (entry.isIntersecting && !document.hidden ? start() : stop()), { threshold: 0 });
    io.observe(host);
    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVisibility);
    if (!reduce) {
      events.addEventListener("pointermove", onMove);
      events.addEventListener("pointerleave", onLeave);
      events.addEventListener("pointerdown", onDown);
    }

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      events.removeEventListener("pointermove", onMove);
      events.removeEventListener("pointerleave", onLeave);
      events.removeEventListener("pointerdown", onDown);
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_0%,#1c3fa8_0%,#14307e_38%,#0e2159_72%,#0a1636_100%)]" />
      <canvas ref={canvasRef} className="absolute inset-0" />
      {/* Readability veil behind the headline: keeps white copy above 7:1 whatever is lit. */}
      <div className="absolute inset-0 bg-[radial-gradient(55%_45%_at_50%_45%,rgb(8_20_66/0.6),transparent_75%)]" />
    </div>
  );
}
