import HomeContent from '@/components/sections/HomeContent';

export const metadata = {
  title: 'Mohaweaves - Premium Fashion & Lifestyle Collection',
  description: 'Discover elegant fashion and lifestyle products at Mohaweaves. Shop our curated collection of premium clothing, accessories, and more with worldwide shipping.',
  keywords: 'fashion, clothing, lifestyle, premium, elegant, shopping, online store',
  openGraph: {
    title: 'Mohaweaves - Premium Fashion & Lifestyle Collection',
    description: 'Discover elegant fashion and lifestyle products at Mohaweaves. Shop our curated collection of premium clothing, accessories, and more.',
    type: 'website',
    siteName: 'Mohaweaves',
    locale: 'en_IN',
    images: [
      {
        url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: 'Mohaweaves - Premium Fashion Collection'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mohaweaves - Premium Fashion & Lifestyle Collection',
    description: 'Discover elegant fashion and lifestyle products at Mohaweaves. Shop our curated collection of premium clothing, accessories, and more.',
    images: [`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/og-image.jpg`]
  },
  alternates: {
    canonical: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  }
};

export default function HomePage() {
  return <HomeContent />;
}
