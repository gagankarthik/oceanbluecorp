"use client";

import { usePathname } from "next/navigation";
import { BREADCRUMB_TRAILS, breadcrumbJsonLd, jsonLdString } from "@/lib/seo";

/** BreadcrumbList JSON-LD for the current static page, if it has a trail. Rendered on the server like any client component. */
export function RouteBreadcrumbs() {
  const pathname = usePathname();
  const trail = BREADCRUMB_TRAILS[pathname];
  if (!trail) return null;
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(breadcrumbJsonLd(trail)) }} />;
}
