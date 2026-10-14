import type { Metadata } from "next";
import VendorsView from "./VendorsView";

export const metadata: Metadata = { title: "Vendors" };

export default function VendorsPage() {
  return <VendorsView />;
}
