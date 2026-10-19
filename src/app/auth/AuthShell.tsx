import Link from "next/link";
import BackLink from "@/components/site/BackLink";
import Logo from "@/components/site/Logo";
import Photo from "@/components/site/Photo";
import { company } from "@/lib/site-content";

/** Split layout shared by the sign-in and password reset pages; one back link, top-left */
export default function AuthShell({
  children,
  back = { href: "/", label: "Back to website" },
}: {
  children: React.ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <section className="grid min-h-svh bg-field-paper lg:h-svh lg:grid-cols-2 lg:overflow-hidden">
      {/* Brand panel */}
      <div className="on-dark relative hidden overflow-hidden bg-navy-900 text-mist-50 lg:block">
        <div aria-hidden className="absolute inset-0 opacity-35">
          <Photo name="tower" className="h-full" position="28% 50%" sizes="50vw" />
        </div>
        <div aria-hidden className="absolute inset-0 bg-navy-950/55" />
        <div className="relative flex h-full flex-col justify-between p-10 xl:p-12">
          <Link href="/" aria-label="Oceanblue Solutions home" className="w-fit">
            <Logo variant="white" className="h-11 w-[9.4rem]" />
          </Link>
          <div>
            <p className="display max-w-[16ch] text-head-md">{company.motto}</p>
            <p className="mt-4 max-w-measure-narrow text-tide-300">For Oceanblue employees and consultants on assignment.</p>
          </div>
          <p className="text-small text-tide-300">
            Not staff?{" "}
            <Link href="/jobs" className="text-white underline underline-offset-4">
              Find a job
            </Link>{" "}
            or{" "}
            <Link href="/contact" className="text-white underline underline-offset-4">
              contact us
            </Link>
            .
          </p>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex min-h-0 flex-col px-4 py-6 sm:px-8 lg:overflow-y-auto">
        <div className="flex items-center justify-between gap-4">
          <BackLink href={back.href} label={back.label} />
          <Link href="/" aria-label="Oceanblue Solutions home" className="lg:hidden">
            <Logo className="h-9 w-[7.6rem]" />
          </Link>
        </div>
        {/* Centred when there is room; on a short screen it scrolls instead of overlapping the back link */}
        <div className="flex flex-1 justify-center py-6">
          <div className="my-auto w-full max-w-[26rem]">{children}</div>
        </div>
      </div>
    </section>
  );
}
