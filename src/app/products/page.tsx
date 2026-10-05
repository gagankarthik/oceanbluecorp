import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import ProductsPage from "./_content";

export const metadata: Metadata = pageMetadata({
  path: "/products",
  title: "Products",
  description: "Enterprise software and products from Oceanblue Solutions, Inc.: purpose-built tools for workforce management, ERP integration, and digital operations.",
});

export default function Products() {
  return <ProductsPage />;
}
