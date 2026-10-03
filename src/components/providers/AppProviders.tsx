"use client";

import { Toaster } from "sonner";
import { AuthProvider } from "@/lib/auth/AuthContext";

// Admin and /auth: auth plus an eagerly mounted Toaster, so early toasts are never dropped.
export default function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <Toaster
        position="bottom-right"
        richColors
        closeButton
        toastOptions={{ style: { fontFamily: "var(--font-geist-sans)" } }}
      />
    </AuthProvider>
  );
}
