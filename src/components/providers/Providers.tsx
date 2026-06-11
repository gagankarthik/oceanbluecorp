"use client";

import { Toaster } from "sonner";
import { AuthProvider } from "@/lib/auth";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
      {/* App-wide toasts (public + admin) so every page can surface errors/success. */}
      <Toaster
        position="bottom-right"
        richColors
        closeButton
        toastOptions={{ style: { fontFamily: "var(--font-geist-sans)" } }}
      />
    </AuthProvider>
  );
}
