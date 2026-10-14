import Link from "next/link";
import StatusCard, { LostIcon, primaryAction, secondaryAction } from "@/components/site/StatusCard";

const elsewhere = [
  { href: "/services", label: "Services" },
  { href: "/about", label: "About us" },
  { href: "/contact", label: "Contact us" },
  { href: "/sitemap", label: "Site map" },
];

export default function NotFound() {
  return (
    <StatusCard
      icon={<LostIcon />}
      eyebrow="Error 404"
      title="This page isn't here"
      body="The link may be old, or the address mistyped. Nothing is broken on your end."
      actions={
        <>
          <Link href="/" className={primaryAction}>
            Go to homepage
          </Link>
          <Link href="/jobs" className={secondaryAction}>
            Find a job
          </Link>
        </>
      }
      footnote={
        <nav aria-label="Other pages" className="flex flex-wrap justify-center gap-x-5 gap-y-2">
          {elsewhere.map((l) => (
            <Link key={l.href} href={l.href} className="font-medium text-ocean-700 underline-offset-4 hover:underline">
              {l.label}
            </Link>
          ))}
        </nav>
      }
    />
  );
}
