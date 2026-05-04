import type { Metadata } from "next";
import DevelopersContent from "./_content";

export const metadata: Metadata = {
  title: "Developers — Job Feed API",
  description:
    "Integrate Ocean Blue Corporation's live job feed into your platform. REST API with API key authentication — pull active job listings in real time.",
  openGraph: {
    title: "Job Feed API | Ocean Blue Corporation Developers",
    description: "Pull Ocean Blue Corporation's live job listings into your platform via REST API.",
    url: "https://oceanbluecorp.com/developers",
  },
  alternates: { canonical: "https://oceanbluecorp.com/developers" },
};

export default function DevelopersPage() {
  return <DevelopersContent />;
}
