import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import AboutPage from "./_content";
import { getSiteContent } from "@/lib/content";

export const revalidate = 60;

export const metadata: Metadata = pageMetadata({
  path: "/about",
  title: "About Ocean Blue",
  description: "Since 2013, Ocean Blue Corporation has supplied IT talent, enterprise solutions and managed services to enterprises and state agencies from Powell, Ohio.",
});

export default async function About() {
  const content = await getSiteContent("about");
  return <AboutPage content={content} />;
}
