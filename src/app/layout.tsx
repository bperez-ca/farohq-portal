import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@farohq/ui'
import { Favicon } from '../components/Favicon'
import { ClerkProvider } from '@clerk/nextjs'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Faro Portal',
  description: 'FaroHQ - Portal',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Get API URL from environment or use default (always relative for same-origin)
  const apiUrl = process.env.NEXT_PUBLIC_API_URL 
    ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1/brand`
    : '/api/v1/brand'; // Relative URL - will use current origin

  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>
          <ThemeProvider
            brandApiUrl={apiUrl}
            enableBrandTheme={true}
          >
            <Favicon />
            {children}
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}



