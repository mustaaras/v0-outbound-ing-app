import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import ErrorBoundary from "@/components/error-boundary"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Analytics } from "@vercel/analytics/react"

const inter = Inter({ subsets: ["latin"] })

// Site-wide URL (ensure NEXT_PUBLIC_SITE_URL is set in env for production)
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://outbound.ing"

export const metadata: Metadata = {
  title: "Outbound.ing - AI-Powered Cold Outreach Emails",
  description: "Generate personalized, high-converting cold outreach emails using AI and proven strategies",
  icons: {
    icon: [
      { url: "/favicon.svg" },
      { url: "/icon-light-32x32.png", media: "(prefers-color-scheme: light)" },
      { url: "/icon-dark-32x32.png", media: "(prefers-color-scheme: dark)" },
    ],
    apple: "/apple-icon.png",
  },
  // Open Graph / Social defaults
  openGraph: {
    title: "Outbound.ing - AI-Powered Cold Outreach Emails",
    description: "Generate personalized, high-converting cold outreach emails using AI and proven strategies",
    url: SITE_URL,
    siteName: "Outbound.ing",
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Outbound.ing - AI cold outreach"
      },
      {
        url: `${SITE_URL}/favicon.svg`,
        width: 512,
        height: 512,
        alt: "Outbound.ing logo"
      }
    ],
    locale: "en_US",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Outbound.ing - AI-Powered Cold Outreach Emails",
    description: "Generate personalized, high-converting cold outreach emails using AI and proven strategies",
    creator: "@outbound_ing",
    images: [`${SITE_URL}/favicon.svg`]
  },
  generator: 'v0.app'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Google tag (gtag.js) */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-7C86NQPQLZ"></script>
        <script dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-7C86NQPQLZ');
          `,
        }} />
        {/* Canonical link */}
        <link rel="canonical" href={SITE_URL} />

        {/* JSON-LD organization + website schema for rich results */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "Outbound.ing",
              "url": SITE_URL,
              "logo": `${SITE_URL}/favicon.svg`,
              "sameAs": [
                "https://x.com/outbound_ing"
              ]
            })
          }}
        />
      </head>
      <body className={inter.className}>
  {/* Default to dark for first-time visitors (when no stored preference exists). */}
  <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
          <Toaster />
        </ThemeProvider>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  )
}
