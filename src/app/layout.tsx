import type { Metadata, Viewport } from "next";
import { Inter, Bricolage_Grotesque, Instrument_Serif } from "next/font/google";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import Providers from "@/components/providers/Providers";
import LayoutWrapper from "@/components/layout/LayoutWrapper";
import CookieConsent from "@/components/layout/CookieConsent";
import { getAnnouncement } from "@/lib/content";
import { Suspense } from "react";

// ISR: re-render the layout (which reads the CMS announcement) at most once a
// minute; content saves call revalidatePath("/", "layout") to push edits live.
export const revalidate = 60;

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700", "800"],
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: ["400"],
  style: ["normal", "italic"],
});
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0066cc",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://oceanbluecorp.com"),
  title: {
    default: "Ocean Blue Corporation | Enterprise IT Solutions",
    template: "%s | Ocean Blue Corporation",
  },
  description:
    "Ocean Blue Corporation delivers IT staffing, enterprise solutions, and managed services — ERP, cloud, cybersecurity, AI & data, and Salesforce — for Fortune 500 enterprises and state government agencies across North America.",
  keywords: [
    "enterprise IT solutions",
    "ERP implementation",
    "cloud services",
    "digital transformation",
    "AI solutions",
    "data analytics",
    "Salesforce consulting",
    "IT staffing",
    "managed services",
    "cybersecurity services",
    "government IT services",
    "public sector technology",
    "enterprise software",
    "business consulting",
    "technology solutions",
    "SAP implementation",
    "Oracle ERP",
    "Microsoft Azure",
    "AWS cloud",
    "machine learning",
    "IT consulting",
  ],
  authors: [{ name: "Ocean Blue Corporation" }],
  creator: "Ocean Blue Corporation",
  publisher: "Ocean Blue Corporation",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://oceanbluecorp.com",
    siteName: "Ocean Blue Corporation",
    title: "Ocean Blue Corporation | Enterprise IT Solutions",
    description:
      "IT staffing, enterprise solutions, and managed services — ERP, cloud, cybersecurity, AI & data, and Salesforce — for enterprises and government agencies.",
    images: [
      {
        url: "/Logo_400x400.jpg",
        width: 400,
        height: 400,
        alt: "Ocean Blue Solutions",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Ocean Blue Corporation | Enterprise IT Solutions",
    description:
      "IT staffing, enterprise solutions, and managed services for enterprises and government agencies — ERP, cloud, cybersecurity, AI, and Salesforce.",
    images: ["/Logo_400x400.jpg"],
    creator: "@oceanbluecorp",
  },
  alternates: {
    canonical: "https://oceanbluecorp.com",
  },
  category: "technology",
  classification: "Business",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Ocean Blue Corporation",
  alternateName: "OceanBlueCorp",
  url: "https://oceanbluecorp.com",
  logo: "https://oceanbluecorp.com/Logo_400x400.jpg",
  description:
    "IT staffing, enterprise solutions, and managed services provider — ERP, cloud, cybersecurity, AI & data, and Salesforce — serving enterprises and state government agencies across North America.",
  foundingDate: "2013",
  address: {
    "@type": "PostalAddress",
    streetAddress: "9775 Fairway Drive, Suite C",
    addressLocality: "Powell",
    addressRegion: "OH",
    postalCode: "43065",
    addressCountry: "US",
  },
  contactPoint: [
    {
      "@type": "ContactPoint",
      telephone: "+1-614-844-6925",
      contactType: "customer service",
      availableLanguage: ["English"],
    },
    {
       "@type": "ContactPoint",
      telephone: "+1-614-844-6925",
      contactType: "Human Resource",
      availableLanguage: ["English"],
    },
  ],
  sameAs: [
    "https://www.linkedin.com/company/ocean-blue-solutions-inc/",
    "https://x.com/OceanBlueSol",
    "https://www.instagram.com/oceanbluesolutions",
  ],
  service: [
    {
      "@type": "Service",
      name: "IT Staffing & Talent",
      description: "Vetted IT specialists embedded into your team on flexible or permanent terms, or as managed teams",
    },
    {
      "@type": "Service",
      name: "Cloud Engineering",
      description: "Cloud migration, modernization, and optimization across AWS, Azure, and GCP",
    },
    {
      "@type": "Service",
      name: "Cybersecurity",
      description: "Compliance-aligned security across cloud, identity, and applications",
    },
    {
      "@type": "Service",
      name: "ERP Solutions",
      description: "Implementations and integrations across SAP, Oracle, and Microsoft Dynamics",
    },
    {
      "@type": "Service",
      name: "Salesforce Services",
      description: "Salesforce implementation, development, automation, and managed admin",
    },
    {
      "@type": "Service",
      name: "AI & Data Intelligence",
      description: "Business-first AI, automation, predictive analytics, and data engineering",
    },
    {
      "@type": "Service",
      name: "Managed Services",
      description: "24/7 monitoring, helpdesk, and infrastructure management to one standard",
    },
    {
      "@type": "Service",
      name: "Digital Transformation",
      description: "Technology strategy, architecture, and roadmaps with measurable outcomes",
    },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const announcement = await getAnnouncement();
  return (
    <html lang="en" className="scroll-smooth" data-scroll-behavior="smooth">
      <head>
        {/* Favicon (src/app/favicon.ico) and apple-touch-icon (src/app/apple-icon.tsx)
            are injected automatically by Next.js from the App Router file conventions. */}
        <link rel="manifest" href="/manifest.json" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${inter.variable} ${bricolage.variable} ${instrumentSerif.variable} ${GeistSans.variable} ${GeistMono.variable} font-sans antialiased`}
      >
        {/* Skip links are provided per-shell: LayoutWrapper (public → #main-content)
            and the admin layout (→ #adm-main), so none is needed here. */}
        <Providers>
          <LayoutWrapper announcement={announcement.text} announcementHref={announcement.href} announcementScroll={announcement.scroll}>
            {children}
          </LayoutWrapper>
        </Providers>

        {/* GDPR / CCPA cookie consent — rendered outside Providers so it always shows */}
        <CookieConsent />
      </body>
    </html>
  );
}
