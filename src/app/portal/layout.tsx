import type { Metadata } from "next";
import { Inter } from "next/font/google";
import PortalShell from "@/components/portal/PortalShell";
import { SessionProvider } from "@/components/portal/session";
import { ToastProvider } from "@/components/portal/toast";
import "@/styles/portal-light.css";
import "@/styles/portal-dark.css";

// Plane's UI face, for the portal only; the public site keeps General Sans
const inter = Inter({ subsets: ["latin"], display: "swap" });
// Overlays portal into <body>, outside the shell, so the face is set from <html> down
const PORTAL_FONT = `html:has([data-portal-shell]) body, html:has([data-portal-shell]) .adm-scope, html:has([data-portal-shell]) .adm-portals { font-family: ${inter.style.fontFamily}, ui-sans-serif, system-ui, sans-serif; }`;

export const metadata: Metadata = {
  title: { default: "Portal", template: "%s | Oceanblue Portal" },
  robots: { index: false },
};

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <style>{PORTAL_FONT}</style>
      <ToastProvider>
        <PortalShell>{children}</PortalShell>
      </ToastProvider>
    </SessionProvider>
  );
}
