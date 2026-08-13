import type { SVGProps } from "react";
import { Linkedin, Youtube, Instagram } from "lucide-react";

/* ============================================================
   The company's social accounts, in one place.

   They were declared inside Footer.tsx, which meant the contact
   page had no way to show them without a second copy, and a
   second copy is how a dead handle survives on one page after
   being fixed on another.

   X has no lucide icon, so its mark is drawn here rather than
   approximated with something else.
   ============================================================ */

function XLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export const SOCIAL_LINKS = [
  { name: "LinkedIn", href: "https://www.linkedin.com/company/ocean-blue-solutions-inc/", icon: Linkedin },
  { name: "X", href: "https://x.com/OceanBlueSol", icon: XLogo },
  { name: "YouTube", href: "https://www.youtube.com/@OceanBlueSolutions", icon: Youtube },
  { name: "Instagram", href: "https://www.instagram.com/oceanbluesolutions", icon: Instagram },
] as const;
