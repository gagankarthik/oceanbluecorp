"use client";

import { usePathname } from "next/navigation";
import { BREADCRUMB_TRAILS, breadcrumbJsonLd, jsonLdString } from "@/lib/seo";

/** BreadcrumbList JSON-LD for the current static page, if it has a trail. */
export default function RouteBreadcrumbs() {
  const trail = BREADCRUMB_TRAILS[usePathname() ?? ""];
  if (!trail) return null;
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(breadcrumbJsonLd(trail)) }} />;
}
