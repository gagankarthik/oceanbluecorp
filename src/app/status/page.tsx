import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import StatusContent from "./_content";

export const metadata: Metadata = pageMetadata({
  path: "/status",
  title: "System Status",
  description: "Real-time status of Ocean Blue Corporation's platform services, database, storage, authentication, email, and hosting.",
  noIndex: true,
});

export default function StatusPage() {
  return <StatusContent />;
}
