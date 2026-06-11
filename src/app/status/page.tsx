import type { Metadata } from "next";
import StatusContent from "./_content";

export const metadata: Metadata = {
  title: "System Status",
  description:
    "Real-time status of Ocean Blue Corporation's platform services — database, storage, authentication, email, and hosting.",
  openGraph: {
    title: "System Status | Ocean Blue Corporation",
    description: "Live service health for Ocean Blue Corporation's platform.",
    url: "https://oceanbluecorp.com/status",
  },
  alternates: { canonical: "https://oceanbluecorp.com/status" },
  // Operational/transient page — keep it out of search results.
  robots: { index: false, follow: true },
};

export default function StatusPage() {
  return <StatusContent />;
}
