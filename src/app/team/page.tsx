import type { Metadata } from "next";
import TeamPage from "./_content";

export const metadata: Metadata = {
  title: "Our Team",
  description:
    "Meet the leadership behind Ocean Blue Corporation — senior practitioners in IT staffing, enterprise solutions, and managed services.",
  openGraph: {
    title: "Our Team | Ocean Blue Corporation",
    description: "Meet the leadership behind Ocean Blue Corporation.",
    url: "https://oceanbluecorp.com/team",
  },
  alternates: { canonical: "https://oceanbluecorp.com/team" },
};

export default function Team() {
  return <TeamPage />;
}
