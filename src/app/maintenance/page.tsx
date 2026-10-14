import type { Metadata } from "next";
import Maintenance from "@/components/layout/Maintenance";
import { getMaintenance } from "@/lib/content";

/* Preview of the maintenance screen SiteShell serves while the switch is on,
   rendered with the saved message and estimate so admins see the real thing. */

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Maintenance",
  // Never index this: it would compete with the real pages in search results
  // and tell crawlers the site is down when it is not.
  robots: { index: false, follow: false },
};

export default async function MaintenancePreview() {
  const { message, eta } = await getMaintenance();
  return <Maintenance message={message} eta={eta} />;
}
