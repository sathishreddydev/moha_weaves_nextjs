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
}

interface OffersResponse {
  offer: Offer | null;
  activeOffers: Offer[];
  inactiveOffers: Offer[];
  hasOffer: boolean;
}

export default function OffersBanner() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const { setHasOfferData, setBannerVisible } = useOffersBanner();
  const [localVisible, setLocalVisible] = useState(true);

  // ✅ Fetch offers
  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const res = await fetch("/api/offers");
        const data: OffersResponse = await res.json();

        if (data.activeOffers?.length > 0) {
          setOffers(data.activeOffers);
          setHasOfferData(true);
        } else {
          setHasOfferData(false);
        }
      } catch (err) {
        console.error("Failed to fetch offers:", err);
        setHasOfferData(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOffers();
  }, [setHasOfferData]);

  // ✅ Auto-rotate offers (every 4s)
  useEffect(() => {
    if (offers.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % offers.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [offers]);

  // ✅ Scroll behavior
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const shouldShow =
        currentScrollY < lastScrollY || currentScrollY <= 50;

      setLocalVisible(shouldShow);
      setBannerVisible(shouldShow);
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY, setBannerVisible]);

  if (isLoading || offers.length === 0) return null;

  const offer = offers[currentIndex];

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ${
        localVisible ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      <div
        className="relative w-full text-center py-2 px-4 text-sm font-medium transition-all duration-300"
        style={{
          backgroundColor: offer.backgroundColor,
          color: offer.textColor,
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
                <span className="hidden sm:inline opacity-90">
                  {offer.description}
                </span>
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <span>{offer.title}</span>
                <span className="hidden sm:inline opacity-90">
                  {offer.description}
                </span>
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
    </div>
  );
}