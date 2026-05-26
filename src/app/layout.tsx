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
    "Transform your business with Ocean Blue Corporation's enterprise IT solutions. Expert services in ERP, Cloud Computing, AI & Data Analytics, Salesforce CRM, IT Staffing, and Corporate Training. Trusted by Fortune 500 companies worldwide.",
  keywords: [
    "enterprise IT solutions",
    "ERP implementation",
    "cloud services",
    "digital transformation",
    "AI solutions",
    "data analytics",
    "Salesforce consulting",
    "IT staffing",
    "corporate training",
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
      "Transform your business with Ocean Blue Corporation's enterprise IT solutions. Expert services in ERP, Cloud, AI, Salesforce, Staffing & Training.",
    images: [
      {
        url: "/logo.ico",
        width: 1200,
        height: 630,
        alt: "Ocean Blue Corporation - Enterprise IT Solutions",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ocean Blue Corporation | Enterprise IT Solutions",
    description:
      "Transform your business with enterprise IT solutions. Expert services in ERP, Cloud, AI, Salesforce & more.",
    images: ["/logo.png"],
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
  logo: "/logo.png",
  description:
    "Enterprise IT solutions provider specializing in ERP, Cloud, AI, Salesforce, IT Staffing, and Corporate Training.",
  foundingDate: "2010",
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
      name: "ERP Solutions",
      description: "Enterprise Resource Planning implementation and consulting",
    },
    {
      "@type": "Service",
      name: "Cloud Services",
      description: "Cloud migration, management, and optimization",
    },
    {
      "@type": "Service",
      name: "Data & AI Solutions",
      description: "Artificial intelligence and data analytics services",
    },
    {
      "@type": "Service",
      name: "Salesforce Consulting",
      description: "Salesforce CRM implementation and customization",
    },
    {
      "@type": "Service",
      name: "IT Staffing",
      description: "Technical talent acquisition and staffing solutions",
    },
    {
      "@type": "Service",
      name: "Corporate Training",
      description: "Professional IT training and certification programs",
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
    <html lang="en" className="scroll-smooth">
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
        {/* ADA / WCAG 2.1 — skip to main content */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[99999] focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:text-sm focus:font-semibold focus:rounded-lg focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-white"
        >
          Skip to main content
        </a>

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
