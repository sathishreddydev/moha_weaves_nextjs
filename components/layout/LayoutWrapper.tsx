"use client";

import { useOffersBanner } from "@/hooks/use-offers-banner";

interface LayoutWrapperProps {
  children: React.ReactNode;
}

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  const { hasOfferData, isBannerVisible } = useOffersBanner();

  return (
    <main className={hasOfferData && isBannerVisible ? "pt-24" : "pt-16"}>
      {children}
    </main>
  );
}
