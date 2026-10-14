import type { Metadata } from "next";
import HelpView from "@/components/portal/workspace/HelpView";

export const metadata: Metadata = { title: "Help" };

export default function HelpPage() {
  return <HelpView />;
}
