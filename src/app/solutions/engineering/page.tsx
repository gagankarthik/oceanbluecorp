import type { Metadata } from "next";
import EngineeringContent from "./_content";

export const metadata: Metadata = {
  title: "Engineering Talent & Services",
  description:
    "Mechanical, electrical, structural, aerospace, controls and manufacturing engineers for automotive, aerospace, power and manufacturing. Shortlists in 48 hours.",
  keywords: [
    "mechanical engineer staffing",
    "aerospace engineering staffing",
    "structural engineer staffing",
    "controls engineer staffing",
    "manufacturing engineering staffing",
    "electrical engineering talent",
    "engineering contract staffing",
    "managed engineering SOW",
  ],
  openGraph: {
    title: "Engineering Talent & Services | Ocean Blue Corporation",
    description:
      "Engineers, embedded fast, across mechanical, electrical, structural, aerospace, controls and manufacturing disciplines for the industries that build things.",
    url: "https://oceanbluecorp.com/solutions/engineering",
  },
  alternates: { canonical: "https://oceanbluecorp.com/solutions/engineering" },
};

export default function EngineeringPage() {
  return <EngineeringContent />;
}
