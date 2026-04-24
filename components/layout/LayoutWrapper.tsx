"use client";

import { useOffersBanner } from "@/hooks/use-offers-banner";

interface LayoutWrapperProps {
  children: React.ReactNode;
}

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  const { hasOfferData, isBannerVisible } = useOffersBanner();

  return (
    <main className={`${hasOfferData && isBannerVisible ? "py-32" : "py-24"} px-6 min-h-screen bg-white font-sans text-slate-800 antialiased`}>
      {children}
    </main>
  );
}
