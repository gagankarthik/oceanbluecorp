import type { Metadata } from "next";
import SecurityPage from "./_content";

export const metadata: Metadata = {
  title: "Security",
  description:
    "How Ocean Blue Corporation protects client and candidate data: encryption, access controls, where data is stored and who can reach it, and how to report a vulnerability.",
  openGraph: {
    title: "Security | Ocean Blue Corporation",
    description:
      "Encryption, access controls, data residency, and vulnerability reporting at Ocean Blue Corporation.",
    url: "https://oceanbluecorp.com/security",
  },
  alternates: { canonical: "https://oceanbluecorp.com/security" },
};

export default function Security() {
  return <SecurityPage />;
}
