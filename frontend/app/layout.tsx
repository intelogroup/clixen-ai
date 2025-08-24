import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  ),
  title: 'Clixen AI - AI-Powered Workflow Automation',
  description: 'Automate your business tasks with AI. Document analysis, scheduling, API integrations, and more. Start free with 100 monthly executions.',
  keywords: 'automation, AI, workflow, document analysis, scheduling, API integration, business automation, telegram bot',
  authors: [{ name: 'Clixen AI Team' }],
  openGraph: {
    title: 'Clixen AI - AI-Powered Workflow Automation',
    description: 'Automate your business tasks with AI. Document analysis, scheduling, API integrations, and more.',
    type: 'website',
    url: 'https://clixen.ai',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Clixen AI - AI Automation Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Clixen AI - AI-Powered Workflow Automation',
    description: 'Automate your business tasks with AI. Start free today.',
    images: ['/og-image.png'],
  },
  robots: 'index, follow',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={inter.className}>
        <div id="modal-root"></div>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
