"use client";

import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";

/**
 * Page-enter transition. `template.tsx` re-mounts on every navigation, which
 * is what gives each route its own enter without wiring anything per page.
 *
 * Opacity only, and nothing else, on purpose. A transform or filter on this
 * wrapper would create a containing block for the whole page and break
 * `position: sticky` everywhere inside it, which is the same trap that made
 * SmoothScroll pick Lenis over ScrollSmoother. The rise that would normally
 * pair with a fade is already carried per-section by Reveal.
 *
 * Short by design: this runs before the reader can read anything, so every
 * millisecond of it is latency they feel. Skipped for admin and auth, where
 * navigation is work rather than browsing, and under reduced motion.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const reduce = useReducedMotion();

  const isAppSurface = pathname?.startsWith("/admin") || pathname?.startsWith("/auth");
  if (isAppSurface || reduce) return <>{children}</>;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
