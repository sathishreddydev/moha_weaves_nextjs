import HomeContent from '@/components/sections/HomeContent';

export const metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL || 'http://localhost:3000'),
  title: 'Urumi by Mounika | Stunning Sarees, Lehengas, Kurtis & Trendy Fashion for Women',
  description: 'Your go-to destination for gorgeous ethnic & modern fashion. Shop sarees, lehengas, kurtis, salwar suits, indo-western outfits, western wear, cute baby frocks & men\'s designer looks. New arrivals every week. Free delivery across India.',
  keywords: 'urumi, urumi by mounika, urumi fashion, urumibymounika, women clothing online, sarees, lehengas, kurtis, salwar suits, dupattas, blouses, indo western wear, western wear, baby frocks, men designer outfits, indian fashion online',
  openGraph: {
    title: 'Urumi by Mounika | Stunning Sarees, Lehengas & Trendy Fashion for Women',
    description: 'Your go-to destination for gorgeous ethnic & modern fashion. Sarees, lehengas, kurtis, indo-western, western wear, baby frocks & more. Free delivery.',
    type: 'website',
    siteName: 'Urumi by Mounika',
    locale: 'en_IN',
    url: 'https://urumibymounika.com',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Urumi by Mounika | Stunning Sarees, Lehengas & Trendy Fashion',
    description: 'Your go-to destination for gorgeous ethnic & modern women\'s fashion. New arrivals every week. Free delivery across India.',
  },
  alternates: {
    canonical: '/'
  }
};

export default function HomePage() {
  return <HomeContent />;
}
