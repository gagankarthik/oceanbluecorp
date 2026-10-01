import type { Metadata, Viewport } from "next";
import { Inter, IBM_Plex_Sans } from "next/font/google";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import Providers from "@/components/providers/Providers";
import LayoutWrapper from "@/components/layout/LayoutWrapper";
import CookieConsent from "@/components/layout/CookieConsent";
import { getAnnouncement, getMaintenance } from "@/lib/content";
import { Suspense } from "react";
import { jsonLdString } from "@/lib/seo";

// ISR: re-render the layout (which reads the CMS announcement) at most once a
// minute; content saves call revalidatePath("/", "layout") to push edits live.
export const revalidate = 60;

// Fallback face outside the .site and .adm-scope scopes; no page leads with
// it, so it is not preloaded.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  preload: false,
});

// The public site's typeface (.site scope in globals.css). Admin stays on Geist.
const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-plex-sans",
  weight: ["400", "500", "600", "700"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0b1a33",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://oceanbluecorp.com"),
  title: {
    default: "Ocean Blue Corporation | Enterprise IT Solutions",
    template: "%s | Ocean Blue Corporation",
  },
  description:
    "Ocean Blue Corporation delivers IT staffing, enterprise solutions, and managed services across ERP, cloud, cybersecurity, AI and data, and Salesforce for Fortune 500 enterprises and state government agencies across North America.",
  keywords: [
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
    creator: "@oceanbluecorp",
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
  name: "Ocean Blue Corporation",
  alternateName: "OceanBlueCorp",
  url: "https://oceanbluecorp.com",
  logo: "https://oceanbluecorp.com/Logo_400x400.png",
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
  // `scroll-smooth` was removed from <html> when Lenis was added: a Tailwind
  // utility sets scroll-behavior in the utilities layer, which outranks the
  // `html:not(.lenis)` guard in globals.css and would have re-introduced the
  // Lenis conflict on every page. That rule now lives entirely in the guard.
  // `data-scroll-behavior` stays, smooth scrolling is still in use wherever
  // Lenis is not, and the attribute is what tells Next to suspend it during
  // route transitions.
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        {/* Runs before first paint: a dismissed announcement never flashes. Keyed like
            LayoutWrapper (by the text), so a new announcement shows again. */}
        {announcement.text && (
          <script
            dangerouslySetInnerHTML={{
              __html: `try{var k=${jsonLdString(`ob.announcement.dismissed:${announcement.text}`)};if(localStorage.getItem(k)==="1"||sessionStorage.getItem(k)==="1")document.documentElement.setAttribute("data-ann-dismissed","")}catch(e){}`,
            }}
          />
        )}
        {/* Favicon (src/app/favicon.ico) and apple-touch-icon (src/app/apple-icon.tsx)
            and the manifest (src/app/manifest.ts) are injected by Next.js from the
            App Router file conventions. */}
        {/* Interior-page photography comes from Unsplash through /_next/image,
            so the browser never connects there itself; a DNS hint covers the
            few direct background images. */}
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdString(jsonLd) }}
        />
      </head>
      <body
        className={`${inter.variable} ${GeistSans.variable} ${GeistMono.variable} ${plexSans.variable} font-sans antialiased`}
      >
        {/* Skip links are provided per-shell: LayoutWrapper (public → #main-content)
            and the admin layout (→ #adm-main), so none is needed here. */}
        <Providers>
          <LayoutWrapper
            announcement={announcement.text}
            announcementHref={announcement.href}
            announcementScroll={announcement.scroll}
            maintenance={maintenance}
          >
            {children}
          </LayoutWrapper>
        </Providers>

        {/* GDPR / CCPA cookie consent, rendered outside Providers so it always shows */}
        <CookieConsent />
      </body>
    </html>
  );
}
