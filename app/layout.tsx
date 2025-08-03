import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Maan Shanti - Temple of the Mind",
  description:
    "A mystical 3D journey through the layers of consciousness. Enter the temple of your mind and discover inner peace.",
  keywords: ["meditation", "mindfulness", "3D visualization", "mental health", "peace", "consciousness"],
  authors: [{ name: "Maan Shanti" }],
  creator: "Maan Shanti",
  publisher: "Maan Shanti",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://maanshanti.vercel.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "Maan Shanti - Temple of the Mind",
    description: "A mystical 3D journey through the layers of consciousness. Enter the temple of your mind and discover inner peace.",
    url: 'https://maanshanti.vercel.app',
    siteName: 'Maan Shanti',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Maan Shanti - Temple of the Mind',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Maan Shanti - Temple of the Mind",
    description: "A mystical 3D journey through the layers of consciousness. Enter the temple of your mind and discover inner peace.",
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
