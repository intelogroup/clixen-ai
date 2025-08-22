import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'B2C Automation Platform - AI-Powered Workflow Automation',
  description: 'Automate your business tasks with AI. Document analysis, scheduling, API integrations, and more. Start free with 100 monthly executions.',
  keywords: 'automation, AI, workflow, document analysis, scheduling, API integration, business automation',
  authors: [{ name: 'B2C Platform Team' }],
  openGraph: {
    title: 'B2C Automation Platform - AI-Powered Workflow Automation',
    description: 'Automate your business tasks with AI. Document analysis, scheduling, API integrations, and more.',
    type: 'website',
    url: 'https://your-domain.com',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'B2C Automation Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'B2C Automation Platform - AI-Powered Workflow Automation',
    description: 'Automate your business tasks with AI. Start free today.',
    images: ['/og-image.png'],
  },
  viewport: 'width=device-width, initial-scale=1',
  robots: 'index, follow',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={inter.className}>
        <div id="modal-root"></div>
        {children}
      </body>
    </html>
  )
}