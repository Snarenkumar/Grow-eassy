import type { Metadata } from "next";
import { Space_Grotesk, Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "AI CSV Importer for GrowEasy CRM | Map Any Lead File Instantly",
  description:
    "Upload any CSV — Facebook Lead Ads, Google Ads, Excel exports, real-estate CRM dumps — and let AI map it straight into GrowEasy CRM's lead format. No fixed columns, no manual mapping.",
  keywords: [
    "AI CSV importer",
    "CRM lead import tool",
    "GrowEasy CRM",
    "automatic field mapping",
    "lead data import India",
    "CSV to CRM converter",
  ],
  openGraph: {
    title: "AI CSV Importer for GrowEasy CRM",
    description:
      "Any CSV, any column layout — mapped into clean CRM leads automatically by AI.",
    type: "website",
  },
  robots: { index: true, follow: true },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "GrowEasy AI CSV Importer",
  "url": "https://groweasy-csv-importer.vercel.app/",
  "description": "Upload any CRM lead CSV with any column names or layout and let AI intelligently map and extract details into the GrowEasy CRM format.",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "All",
  "browserRequirements": "Requires JavaScript. Requires HTML5.",
  "creator": {
    "@type": "Organization",
    "name": "GrowEasy",
    "url": "https://groweasy.ai"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${inter.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}
