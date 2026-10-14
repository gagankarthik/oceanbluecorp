import type { Metadata } from "next";
import DeveloperView from "./DeveloperView";

export const metadata: Metadata = { title: "Developer" };

export default async function DeveloperPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  return <DeveloperView initialTab={tab === "reference" ? "reference" : "keys"} />;
}
