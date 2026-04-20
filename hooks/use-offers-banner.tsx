"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface OffersBannerContextType {
  hasOfferData: boolean;
  setHasOfferData: (hasData: boolean) => void;
  isBannerVisible: boolean;
  setBannerVisible: (visible: boolean) => void;
}

export const OffersBannerContext = createContext<OffersBannerContextType | undefined>(undefined);

export function OffersBannerProvider({ children }: { children: ReactNode }) {
  const [hasOfferData, setHasOfferData] = useState(false);
  const [isBannerVisible, setBannerVisible] = useState(true);

  return (
    <OffersBannerContext.Provider value={{ hasOfferData, setHasOfferData, isBannerVisible, setBannerVisible }}>
      {children}
    </OffersBannerContext.Provider>
  );
}

export function useOffersBanner() {
  const context = useContext(OffersBannerContext);
  if (context === undefined) {
    throw new Error('useOffersBanner must be used within an OffersBannerProvider');
  }
  return context;
}
