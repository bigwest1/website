import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { siteConfig } from "@/lib/site";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SmoothScrollProvider } from "@/components/smooth-scroll-provider";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: siteConfig.title,
  description: siteConfig.description,
  applicationName: siteConfig.name,
  keywords: [
    "UX Designer",
    "UX Strategy",
    "Interaction Design",
    "Product Design",
    "UX Consultant",
    "Jesse Westlund"
  ],
  openGraph: {
    title: siteConfig.title,
    description: siteConfig.description,
    url: siteConfig.url,
    siteName: siteConfig.name,
    images: [
      {
        url: "/images/JesseWestlundUPtop.png",
        width: 1200,
        height: 630,
        alt: "Jesse Westlund UX Portfolio"
      }
    ],
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.title,
    description: siteConfig.description,
    images: ["/images/JesseWestlundUPtop.png"]
  },
  alternates: {
    canonical: "/"
  },
  icons: {
    icon: "/images/favicon.ico"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const isVercelDeployment = process.env.VERCEL === "1";

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <SmoothScrollProvider>
          <div className="site-shell">
            <SiteHeader />
            <main>{children}</main>
            <SiteFooter />
          </div>
        </SmoothScrollProvider>
        {isVercelDeployment ? <Analytics /> : null}
        {isVercelDeployment ? <SpeedInsights /> : null}
      </body>
    </html>
  );
}
