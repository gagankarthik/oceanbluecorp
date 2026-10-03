"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

// Server HTML and the hydrating render never animate, so first paint (and LCP)
// is never hidden. Later client navigations remount this and get the CSS fade.
let hydrated = false;

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Fixed per mount, so a later re-render never replays the fade.
  const [animate] = useState(() => hydrated);
  const appSurface = pathname?.startsWith("/admin") || pathname?.startsWith("/auth");

  useEffect(() => {
    hydrated = true;
  }, []);

  if (appSurface) return <>{children}</>;
  return <div className={animate ? "page-enter" : undefined}>{children}</div>;
}
