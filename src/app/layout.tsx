import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Providers from "@/components/providers/Providers";
import LayoutWrapper from "@/components/LayoutWrapper";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
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
    default: "Ocean Blue Corporation | Enterprise IT Solutions & Digital Transformation",
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
    title: "Ocean Blue Corporation | Enterprise IT Solutions & Digital Transformation",
    description:
      "Transform your business with Ocean Blue Corporation's enterprise IT solutions. Expert services in ERP, Cloud, AI, Salesforce, Staffing & Training.",
    images: [
      {
        url: "/og-image.jpg",
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
    images: ["/og-image.jpg"],
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
  logo: "https://oceanbluecorp.com/logo.png",
  description:
    "Enterprise IT solutions provider specializing in ERP, Cloud, AI, Salesforce, IT Staffing, and Corporate Training.",
  foundingDate: "2010",
  address: {
    "@type": "PostalAddress",
    streetAddress: "123 Enterprise Drive, Suite 500",
    addressLocality: "San Francisco",
    addressRegion: "CA",
    postalCode: "94105",
    addressCountry: "US",
  },
  contactPoint: [
    {
      "@type": "ContactPoint",
      telephone: "+1-800-OCEAN-BLU",
      contactType: "customer service",
      availableLanguage: ["English"],
    },
    {
      "@type": "ContactPoint",
      telephone: "+1-800-OCEAN-BLU",
      contactType: "sales",
      availableLanguage: ["English"],
    },
  ],
  sameAs: [
    "https://www.linkedin.com/company/oceanbluecorp",
    "https://twitter.com/oceanbluecorp",
    "https://www.facebook.com/oceanbluecorp",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${inter.variable} ${plusJakarta.variable} font-sans antialiased`}
      >
        <Providers>
          <LayoutWrapper>{children}</LayoutWrapper>
        </Providers>
      </body>
    </html>
  );
}
