"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

// Split by surface so public pages ship neither oidc-client-ts nor sonner up front.
// Public pages read the session through components/site/use-staff-session.
const AppProviders = dynamic(() => import("./AppProviders"));
const PublicToaster = dynamic(() => import("sonner").then((m) => m.Toaster), { ssr: false });

const isAppSurface = (path: string | null) => !!path && (path.startsWith("/admin") || path.startsWith("/auth"));

export default function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (isAppSurface(pathname)) return <AppProviders>{children}</AppProviders>;
  return (
    <>
      {children}
      <PublicToaster
        position="bottom-right"
        richColors
        closeButton
        toastOptions={{ style: { fontFamily: "var(--font-geist-sans)" } }}
      />
    </>
  );
}
