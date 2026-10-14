import type { Metadata, Viewport } from "next";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import Providers from "@/components/providers/Providers";
import SiteShell from "@/components/site/SiteShell";
import CookieConsent from "@/components/layout/CookieConsent";
import { getAnnouncement, getMaintenance } from "@/lib/content";
import { jsonLdString } from "@/lib/seo";

// ISR: re-render the layout (which reads the CMS announcement) at most once a
// minute; content saves call revalidatePath("/", "layout") to push edits live.
export const revalidate = 60;

// General Sans (Fontshare, linked in <head>) for the site; Geist for the console.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0b2e46",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://oceanbluecorp.com"),
  title: {
    default: "Oceanblue Solutions, Inc. | Enterprise IT Solutions",
    template: "%s | Oceanblue Solutions, Inc.",
  },
  description:
    "Oceanblue Solutions, Inc. delivers IT staffing, enterprise solutions, and managed services across ERP, cloud, cybersecurity, AI and data, and Salesforce for Fortune 500 enterprises and state government agencies across North America.",
  applicationName: "Oceanblue Solutions, Inc.",
  keywords: [
    "Oceanblue Solutions, Inc.",
    "Oceanblue Solutions",
    "enterprise IT solutions",
    "ERP implementation",
    "cloud services",
    "digital transformation",
    "AI solutions",
    "data analytics",
    "Salesforce consulting",
    "IT staffing",
    "IT staffing agency Ohio",
    "engineering staffing",
    "IT training",
    "MBE WBE certified IT company",
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
  authors: [{ name: "Oceanblue Solutions, Inc." }],
  creator: "Oceanblue Solutions, Inc.",
  publisher: "Oceanblue Solutions, Inc.",
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
    siteName: "Oceanblue Solutions, Inc.",
    title: "Oceanblue Solutions, Inc. | Enterprise IT Solutions",
    description:
      "IT staffing, enterprise solutions, and managed services across ERP, cloud, cybersecurity, AI and data, and Salesforce for enterprises and government agencies.",
    // `images` is intentionally omitted: src/app/opengraph-image.tsx supplies a
    // 1200×630 card via the file convention. Declaring images here would
    // override it and drop us back to the small square logo.
  },
  // No title/description: every page inherits this object, so fixed copy put the
  // homepage headline on every card. Unset, Next fills both from the page's own
  // openGraph. No root canonical either: inherited, it pointed any page without
  // its own at the homepage.
  twitter: {
    card: "summary_large_image",
    site: "@OceanBlueSol",
    creator: "@OceanBlueSol",
  },
  category: "technology",
  classification: "Business",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  // Stable node id so page-level graphs (see src/app/page.tsx) can reference
  // this Organization instead of redeclaring it.
  "@id": "https://oceanbluecorp.com/#organization",
  name: "Oceanblue Solutions, Inc.",
  legalName: "Oceanblue Solutions, Inc.",
  // Former and short names, so searches for the old name still resolve here.
  alternateName: ["Oceanblue Solutions", "Oceanblue", "Ocean Blue Corporation", "OceanBlueCorp"],
  url: "https://oceanbluecorp.com",
  logo: { "@type": "ImageObject", url: "https://oceanbluecorp.com/brand/oceanblue-mark-512.png", width: 512, height: 512 },
  image: "https://oceanbluecorp.com/brand/oceanblue-logo.png",
  description:
    "Provider of IT staffing, enterprise solutions, and managed services across ERP, cloud, cybersecurity, AI and data, and Salesforce, serving enterprises and state government agencies across North America.",
  foundingDate: "2013",
  email: "hr@oceanbluecorp.com",
  areaServed: { "@type": "Country", name: "United States" },
  knowsAbout: [
    "IT staffing",
    "Engineering staffing",
    "Cloud engineering",
    "Cybersecurity",
    "ERP implementation",
    "Salesforce",
    "Artificial intelligence",
    "Data engineering",
    "Managed IT services",
    "Technology training",
  ],
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
  // `service` is not a schema.org Organization property, so the previous list
  // was silently discarded. `hasOfferCatalog` is the valid form.
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Solutions",
    itemListElement: [
      {
        name: "IT Staffing & Talent",
        description: "Vetted IT specialists embedded into your team on flexible or permanent terms, or as managed teams",
      },
      {
        name: "Cloud Engineering",
        description: "Cloud migration, modernization, and optimization across AWS, Azure, and GCP",
      },
      {
        name: "Cybersecurity",
        description: "Compliance-aligned security across cloud, identity, and applications",
      },
      {
        name: "ERP Solutions",
        description: "Implementations and integrations across SAP, Oracle, and Microsoft Dynamics",
      },
      {
        name: "Salesforce Services",
        description: "Salesforce implementation, development, automation, and managed admin",
      },
      {
        name: "AI & Data Intelligence",
        description: "Business-first AI, automation, predictive analytics, and data engineering",
      },
      {
        name: "Engineering Talent & Services",
        description: "Mechanical, electrical, civil and controls engineers on contract, direct hire, or as project teams",
      },
      {
        name: "Managed Services",
        description: "24/7 monitoring, helpdesk, and infrastructure management to one standard",
      },
      {
        name: "Training & Upskilling",
        description: "Instructor-led training in cloud, DevOps, data and AI, security, ERP, and Salesforce, with certification preparation",
      },
      {
        name: "Digital Transformation",
        description: "Technology strategy, architecture, and roadmaps with measurable outcomes",
      },
    ].map((s) => ({
      "@type": "Offer",
      itemOffered: { "@type": "Service", name: s.name, description: s.description },
    })),
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Both read the same ISR'd content table, so this is one extra lookup per
  // revalidation rather than per request.
  const [announcement, maintenance] = await Promise.all([
    getAnnouncement(),
    getMaintenance(),
  ]);
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Favicon (src/app/favicon.ico) and apple-touch-icon (src/app/apple-icon.tsx)
            and the manifest (src/app/manifest.ts) are injected by Next.js from the
            App Router file conventions. */}
        {/* Interior-page photography comes from Unsplash through /_next/image,
            so the browser never connects there itself; a DNS hint covers the
            few direct background images. */}
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link rel="preconnect" href="https://cdn.fontshare.com" crossOrigin="" />
        <link rel="stylesheet" href="https://api.fontshare.com/v2/css?f[]=general-sans@400,500,600&display=swap" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdString(jsonLd) }}
        />
      </head>
      <body
        className={`${GeistMono.variable} font-sans antialiased`}
      >
        {/* GDPR / CCPA cookie consent, outside Providers so it always shows, and
            first in the DOM so it is reached before the page (it is fixed to
            the bottom visually). */}
        <CookieConsent />
        <Providers>
          <SiteShell
            announcement={
              announcement.text
                ? {
                    id: `${announcement.tag}|${announcement.text}`,
                    tag: announcement.tag || undefined,
                    text: announcement.text,
                    link: announcement.href ? { href: announcement.href, label: announcement.linkLabel || "Learn more" } : undefined,
                  }
                : null
            }
            maintenance={maintenance}
          >
            {children}
          </SiteShell>
        </Providers>

      </body>
    </html>
  );
}
