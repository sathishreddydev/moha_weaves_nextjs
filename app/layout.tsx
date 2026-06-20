import { authOptions } from "@/auth/config/auth";
import Footer from "@/components/layout/Footer";
import GlobalSwipeNavigation from "@/components/layout/GlobalSwipeNavigation";
import Header from "@/components/layout/Header";
import LayoutWrapper from "@/components/layout/LayoutWrapper";
import OffersBanner from "@/components/layout/OffersBanner";
import { Providers } from "@/components/providers";
import { OffersBannerProvider } from "@/hooks/use-offers-banner";
import { getFiltersData, FiltersData } from "@/app/api/filters/filterService";
import { getActiveOffers, Offer } from "@/app/api/offers/offersService";
import { getNewProducts } from "@/lib/services/productSectionService";
import { ProductWithDetails } from "@/shared";
import type { Metadata, Viewport } from "next";
import { getServerSession } from "next-auth/next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000'),
  title: {
    default: "Urumi by Mounika | Shop Trendy Women's Fashion, Ethnic Wear & Kids Clothing Online",
    template: "%s | Urumi by Mounika",
  },
  description:
    "Explore stunning sarees, lehengas, kurtis, salwar suits, indo-western & western outfits for women. Adorable baby frocks & stylish men's wear too. Handpicked designs, premium fabrics & free delivery across India.",
  keywords: [
    "urumi", "urumi fashion", "urumi by mounika", "urumibymounika", "urumi online store",
    "women clothing online india", "sarees online", "lehengas online", "designer kurtis",
    "short kurtis", "salwar suits", "dupattas", "blouses",
    "indo western wear", "fusion gowns", "cape dresses", "co-ord sets",
    "western wear women", "dresses", "tops", "jumpsuits", "skirts",
    "baby frocks online", "kids frocks india",
    "men designer outfits", "indian fashion online",
  ],
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "Urumi by Mounika",
    statusBarStyle: "default",
  },
  openGraph: {
    title: "Urumi by Mounika | Trendy Women's Fashion & Ethnic Wear Online",
    description: "From elegant sarees & lehengas to chic western outfits — shop the latest women's fashion at Urumi. Handpicked designs, premium fabrics, free delivery.",
    type: "website",
    locale: "en_IN",
    siteName: "Urumi by Mounika",
    url: "https://urumibymounika.com",
  },
  twitter: {
    card: "summary_large_image",
    site: "@urumifashion",
    title: "Urumi by Mounika | Trendy Women's Fashion & Ethnic Wear",
    description: "From elegant sarees & lehengas to chic western outfits — shop the latest women's fashion at Urumi. Free delivery across India.",
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
  verification: {
    // Add your Google Search Console verification code here after setting it up
    // google: "your-google-verification-code",
  },
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
  // Fetch session, filters, and offers in parallel on the server —
  // all three are ready before a single byte of HTML is sent to the browser.
  const [session, filters, initialOffers, initialNewProducts] = await Promise.all([
    getServerSession(authOptions),
    getFiltersData().catch(() => ({ categories: [], colors: [], fabrics: [] } as FiltersData)),
    getActiveOffers().catch(() => [] as Offer[]),
    getNewProducts().catch(() => [] as ProductWithDetails[]),
  ]);

  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers session={session} filters={filters} initialOffers={initialOffers}>
          <OffersBannerProvider>
            {/* <GlobalSwipeNavigation> */}
              <OffersBanner />
              <Header initialNewProducts={initialNewProducts} />
              <LayoutWrapper>{children}</LayoutWrapper>
              <Footer />
            {/* </GlobalSwipeNavigation> */}
          </OffersBannerProvider>
        </Providers>
      </body>
    </html>
  );
}
