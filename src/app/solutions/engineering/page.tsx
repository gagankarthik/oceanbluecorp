import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import EngineeringContent from "./_content";

export const metadata: Metadata = pageMetadata({
  path: "/solutions/engineering",
  title: "Engineering Staffing & Services",
  description: "Mechanical, electrical, structural, aerospace, controls and manufacturing engineers for automotive, aerospace, power and manufacturing. Shortlists in 48 hours.",
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
});

export default function EngineeringPage() {
  return <EngineeringContent />;
}
