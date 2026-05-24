import type { Metadata } from "next";
import BrandKitContent from "./_content";

export const metadata: Metadata = {
  title: "Brand Kit & Design System",
  description:
    "Ocean Blue Corporation's brand kit — logo, color palette, typography, and core components. The design system behind our website.",
  openGraph: {
    title: "Brand Kit | Ocean Blue Corporation",
    description: "Logo, colors, typography, and components — Ocean Blue's design system.",
    url: "https://oceanbluecorp.com/brand-kit",
  },
  alternates: { canonical: "https://oceanbluecorp.com/brand-kit" },
};

export default function BrandKitPage() {
  return <BrandKitContent />;
}
