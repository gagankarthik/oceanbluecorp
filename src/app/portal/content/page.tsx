import type { Metadata } from "next";
import { RoleGate } from "@/components/portal/session";
import ContentView from "./ContentView";

export const metadata: Metadata = { title: "Content" };

export default function ContentPage() {
  return (
    <RoleGate href="/portal/content">
      <ContentView />
    </RoleGate>
  );
}
