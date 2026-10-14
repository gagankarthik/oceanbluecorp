"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { AdminProvider } from "@/components/portal/console/provider";
import { useSession } from "@/components/portal/session";
import { NoAccess } from "@/components/portal/ui";
import { canAccess } from "@/lib/portal/roles";

/**
 * Detail, editor and utility screens carried over from the old console. The
 * --adm-* tokens (.adm-scope) are retuned to the portal palette. Gutters come
 * from <main> (p-5 / sm:p-6 / lg:p-8) like every list page; FormActionBar and
 * the record header's negative margins are cut to that same padding.
 */
export default function ConsoleLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "/portal";
  const { role } = useSession();

  // Menus and drawers portal into <body>; this class keeps the console styles on them.
  useEffect(() => {
    document.body.classList.add("adm-portals");
    return () => document.body.classList.remove("adm-portals");
  }, []);

  if (!canAccess(role, pathname)) return <NoAccess section="this page" />;

  return (
    <AdminProvider>
      <div className="adm-scope flex min-w-0 flex-1 flex-col">
        {children}
      </div>
    </AdminProvider>
  );
}
