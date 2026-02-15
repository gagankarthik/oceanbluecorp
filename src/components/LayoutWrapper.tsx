"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Routes that should not show Header/Footer
  const isAdminRoute = pathname?.startsWith("/admin");
  const isDashboardRoute = pathname?.startsWith("/dashboard");
  const isAuthRoute = pathname?.startsWith("/auth");

  const hideHeaderFooter = isAdminRoute || isDashboardRoute;

  if (hideHeaderFooter) {
    return <>{children}</>;
  }

  return (
    <>
      {!isAuthRoute && <Header />}
      <main className="min-h-screen">{children}</main>
      {!isAuthRoute && <Footer />}
    </>
  );
}
