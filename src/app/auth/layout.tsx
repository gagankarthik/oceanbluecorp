import type { Metadata } from "next";

/* Auth pages are client components and cannot export metadata themselves, so
   this layout carries it for the whole segment. */

export const metadata: Metadata = {
  title: "Sign in",
  description: "Staff sign-in for the Ocean Blue Corporation console.",
  // Never index these. The console is invite-only with no public sign-up, so a
  // sign-in screen in search results is noise that also advertises the door.
  // `nofollow` too: there is nothing beyond it a crawler should be reaching.
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
  // Was "Sign in or sign up", which described a registration flow this product
  // does not have.
  alternates: { canonical: "https://oceanbluecorp.com/auth/signin" },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  // Auth pages don't use the header/footer from the root layout.
  return <>{children}</>;
}
