import type { Metadata } from "next";
import Maintenance from "@/components/layout/Maintenance";
import { getMaintenance } from "@/lib/content";

/**
 * Preview route for the maintenance screen.
 *
 * The real screen is served by LayoutWrapper in place of the whole public site
 * once the switch is on; this route exists so an admin can see exactly what
 * visitors will get BEFORE flipping it, which is the difference between a
 * planned window and finding a typo while the site is down.
 *
 * It renders with whatever message and estimate are currently saved, so the
 * preview matches the real thing rather than showing defaults.
 */

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
