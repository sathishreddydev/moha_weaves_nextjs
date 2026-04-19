import Footer from '@/components/layout/Footer'
import Header from '@/components/layout/Header'
import GlobalSwipeNavigation from '@/components/layout/GlobalSwipeNavigation'
import { Providers } from '@/components/providers'
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/auth/config/auth'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Moha Weaves - Handcrafted Sarees',
  description:
    "Discover exquisite handcrafted sarees celebrating India's rich textile heritage. Shop our collection of traditional and contemporary sarees.",
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Cache session to reduce API calls
  const session = await getServerSession(authOptions)

  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers session={session}>
          <GlobalSwipeNavigation>
            <Header />
            <main className="pt-16">{children}</main>
            <Footer />
          </GlobalSwipeNavigation>
        </Providers>
      </body>
    </html>
  )
}