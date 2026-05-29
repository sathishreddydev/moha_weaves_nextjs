import HomeContent from '@/components/sections/HomeContent';

export const metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000'),
  title: 'Mohaweaves - Premium Fashion & Lifestyle Collection',
  description: 'Discover elegant fashion and lifestyle products at Mohaweaves. Shop our curated collection of premium clothing, accessories, and more with worldwide shipping.',
  keywords: 'fashion, clothing, lifestyle, premium, elegant, shopping, online store',
  openGraph: {
    title: 'Mohaweaves - Premium Fashion & Lifestyle Collection',
    description: 'Discover elegant fashion and lifestyle products at Mohaweaves. Shop our curated collection of premium clothing, accessories, and more.',
    type: 'website',
    siteName: 'Mohaweaves',
    locale: 'en_IN',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mohaweaves - Premium Fashion & Lifestyle Collection',
    description: 'Discover elegant fashion and lifestyle products at Mohaweaves. Shop our curated collection of premium clothing, accessories, and more.',
  },
  alternates: {
    canonical: '/'
  }
};

export default function HomePage() {
  return <HomeContent />;
}
