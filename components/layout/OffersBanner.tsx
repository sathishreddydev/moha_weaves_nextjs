"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { useOffersBanner } from "@/hooks/use-offers-banner";

interface Offer {
  id: string;
  title: string;
  description: string;
  backgroundColor: string;
  textColor: string;
  link: string | null;
  isActive: boolean;
  priority: number;
}

interface OffersResponse {
  offer: Offer | null;
  hasOffer: boolean;
  totalActiveOffers: number;
}

export default function OffersBanner() {
  const [offer, setOffer] = useState<Offer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const { setHasOfferData, setBannerVisible } = useOffersBanner();
  const [localVisible, setLocalVisible] = useState(true);

  // Fetch offers from API
  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const response = await fetch('/api/offers');
        const data: OffersResponse = await response.json();
        
        if (data.hasOffer && data.offer) {
          setOffer(data.offer);
          setHasOfferData(true);
        } else {
          setHasOfferData(false);
        }
      } catch (error) {
        console.error('Failed to fetch offers:', error);
        setHasOfferData(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOffers();
  }, [setHasOfferData]);

  // Handle scroll behavior
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollThreshold = 50; // Minimum scroll to trigger hide/show
      const shouldShow = currentScrollY < lastScrollY || currentScrollY <= scrollThreshold;

      // Hide banner when scrolling down, show when scrolling up
      setLocalVisible(shouldShow);
      setBannerVisible(shouldShow);

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY, setBannerVisible]);

  // Don't render if loading, no offer, or offer is not active
  if (isLoading || !offer || !offer.isActive) {
    return null;
  }

  const BannerContent = () => (
    <div 
      className="relative w-full text-center py-2 px-4 text-sm font-medium transition-all duration-300 ease-in-out"
      style={{ 
        backgroundColor: offer.backgroundColor,
        color: offer.textColor
      }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex-1" />
        
        <div className="flex items-center justify-center gap-2">
          {offer.link ? (
            <Link 
              href={offer.link}
              className="hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              <span>{offer.title}</span>
              <span className="hidden sm:inline opacity-90">{offer.description}</span>
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <span>{offer.title}</span>
              <span className="hidden sm:inline opacity-90">{offer.description}</span>
            </div>
          )}
        </div>

        <div className="flex-1 flex justify-end">
          <button
            onClick={() => {
              setLocalVisible(false);
              setBannerVisible(false);
            }}
            className="p-1 hover:opacity-70 transition-opacity rounded"
            style={{ color: offer.textColor }}
            aria-label="Close offer banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ease-in-out ${
        localVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <BannerContent />
    </div>
  );
}
