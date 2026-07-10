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

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "GrowEasy AI CSV Importer",
    "url": "https://groweasy-csv-importer.vercel.app/",
    "description": "Upload any CRM lead CSV with any column names or layout and let AI intelligently map and extract details into the GrowEasy CRM format.",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "All",
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
    "creator": { "@type": "Organization", "name": "GrowEasy", "url": "https://groweasy.ai" }
  },
  {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": "How to import leads from a CSV into GrowEasy CRM",
    "description": "Upload any CSV file and convert it into clean CRM-ready leads using AI field mapping.",
    "step": [
      { "@type": "HowToStep", "position": 1, "name": "Upload your CSV", "text": "Go to /import. Drag-and-drop or click to select a .csv file." },
      { "@type": "HowToStep", "position": 2, "name": "Preview the data", "text": "Review the raw CSV table. Confirm row and column counts." },
      { "@type": "HowToStep", "position": 3, "name": "Run AI Mapping", "text": "Click Map with Gemini AI. Batches are processed sequentially." },
      { "@type": "HowToStep", "position": 4, "name": "Review and export", "text": "Edit cells inline, then download the CRM-ready CSV or JSON." }
    ]
  }
];

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
