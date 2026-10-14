import type { Metadata } from "next";
import SettingsView, { type SettingsTab } from "@/components/portal/workspace/SettingsView";

export const metadata: Metadata = { title: "Settings" };

const TABS: SettingsTab[] = ["profile", "security", "system"];

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  return <SettingsView initialTab={TABS.includes(tab as SettingsTab) ? (tab as SettingsTab) : "profile"} />;
}
