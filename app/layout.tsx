import { authOptions } from "@/auth/config/auth";
import Footer from "@/components/layout/Footer";
import GlobalSwipeNavigation from "@/components/layout/GlobalSwipeNavigation";
import Header from "@/components/layout/Header";
import LayoutWrapper from "@/components/layout/LayoutWrapper";
import OffersBanner from "@/components/layout/OffersBanner";
import { Providers } from "@/components/providers";
import { OffersBannerProvider } from "@/hooks/use-offers-banner";
import type { Metadata, Viewport } from "next";
import { getServerSession } from "next-auth/next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000'),
  title: {
    default: "Moha Weaves - Handcrafted Sarees & Premium Indian Ethnic Wear",
    template: "%s | Moha Weaves",
  },
  description:
    "Discover exquisite handcrafted sarees celebrating India's rich textile heritage. Shop our collection of traditional and contemporary sarees.",
  keywords: ["sarees", "handcrafted", "ethnic wear", "indian fashion", "traditional clothing", "moha weaves", "indian sarees online"],
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "Mohaweaves",
    statusBarStyle: "default",
  },
  openGraph: {
    title: "Moha Weaves - Handcrafted Sarees",
    description: "Discover exquisite handcrafted sarees celebrating India's rich textile heritage",
    type: "website",
    locale: "en_IN",
    siteName: "Mohaweaves",
  },
  twitter: {
    card: "summary_large_image",
    site: "@mohaweaves",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  // Add your Google Search Console verification code here
  // verification: {
  //   google: "your-google-verification-code",
  // },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#991b1b",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Cache session to reduce API calls
  const session = await getServerSession(authOptions);

  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers session={session}>
          <OffersBannerProvider>
            {/* <GlobalSwipeNavigation> */}
              <OffersBanner />
              <Header />
              <LayoutWrapper>{children}</LayoutWrapper>
              <Footer />
            {/* </GlobalSwipeNavigation> */}
          </OffersBannerProvider>
        </Providers>
      </body>
    </html>
  );
}
