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
  title: "Moha Weaves - Handcrafted Sarees",
  description:
    "Discover exquisite handcrafted sarees celebrating India's rich textile heritage. Shop our collection of traditional and contemporary sarees.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
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
            <GlobalSwipeNavigation>
              <OffersBanner />
              <Header />
              <LayoutWrapper>
                {children}
              </LayoutWrapper>
              <Footer />
            </GlobalSwipeNavigation>
          </OffersBannerProvider>
        </Providers>
      </body>
    </html>
  );
}
