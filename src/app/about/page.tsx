import type { Metadata } from "next";
import AboutPage from "./_content";
import { getSiteContent } from "@/lib/content";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about Ocean Blue Corporation — our mission, values, leadership, and commitment to enterprise IT excellence. Trusted by Fortune 500 companies across ERP, cloud, AI, and IT staffing.",
  openGraph: {
    title: "About Ocean Blue Corporation",
    description:
      "Learn about Ocean Blue Corporation — our mission, values, and commitment to enterprise IT excellence.",
    url: "https://oceanbluecorp.com/about",
  },
  alternates: { canonical: "https://oceanbluecorp.com/about" },
};

export default async function About() {
  const content = await getSiteContent("about");
  return <AboutPage content={content} />;
}
