import type { Metadata } from "next";
import ProductsPage from "./_content";

export const metadata: Metadata = {
  title: "Products",
  description:
    "Enterprise software and products from Ocean Blue Corporation: purpose-built tools for workforce management, ERP integration, and digital operations.",
  openGraph: {
    title: "Products | Ocean Blue Corporation",
    description:
      "Purpose-built enterprise products for workforce management, ERP integration, and digital operations.",
    url: "https://oceanbluecorp.com/products",
  },
  alternates: { canonical: "https://oceanbluecorp.com/products" },
};

export default function Products() {
  return <ProductsPage />;
}
