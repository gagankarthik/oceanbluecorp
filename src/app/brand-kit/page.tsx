import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import BrandKitContent from "./_content";

export const metadata: Metadata = pageMetadata({
  path: "/brand-kit",
  title: "Brand Kit & Design System",
  description: "Oceanblue Solutions, Inc.'s brand kit, logo, color palette, typography, and core components. The design system behind our website.",
});

export default function BrandKitPage() {
  return <BrandKitContent />;
}
