import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { TRPCReactProvider } from '@/trpc/react'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'RACI Matrix - Collaborative Role Management',
  description: 'Professional RACI matrix application with real-time collaboration, validation, and analytics for managing project responsibilities',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <TRPCReactProvider>{children}</TRPCReactProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
