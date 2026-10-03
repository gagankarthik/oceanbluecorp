import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { getSiteContent } from "@/lib/content";
import ContactPage from "./_content";
import { CONTACT_PATH_PARAM, parseContactPath } from "./paths";

export const metadata: Metadata = pageMetadata({
  path: "/contact",
  title: "Contact Us",
  description: "Hiring staff or finding work: talk to Ocean Blue Corporation about IT staffing, enterprise solutions, managed services or your next role. Call +1 (614) 844-6925 or email hr@oceanbluecorp.com.",
});

// Reads ?for= on the server so the chosen path renders without a flash.
export default async function Contact({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [content, params] = await Promise.all([getSiteContent("contact"), searchParams]);
  return <ContactPage content={content} initialPath={parseContactPath(params[CONTACT_PATH_PARAM])} />;
}
