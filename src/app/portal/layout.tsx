import type { Metadata } from "next";
import PortalShell from "@/components/portal/PortalShell";
import { SessionProvider } from "@/components/portal/session";
import { ToastProvider } from "@/components/portal/toast";
import "@/styles/portal-light.css";
import "@/styles/portal-dark.css";

export const metadata: Metadata = {
  title: { default: "Portal", template: "%s | Oceanblue Portal" },
  robots: { index: false },
};

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ToastProvider>
        <PortalShell>{children}</PortalShell>
      </ToastProvider>
    </SessionProvider>
  );
}
