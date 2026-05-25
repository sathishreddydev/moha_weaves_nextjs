"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { useOffersBanner } from "@/hooks/use-offers-banner";
import { useSocketStore } from "@/lib/stores/socketStore";

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
  const [isClosed, setIsClosed] = useState(false);
  // Fix #1: measure banner height and expose as CSS variable so Header always sits below it
  const bannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateHeight = () => {
      if (bannerRef.current) {
        const h = bannerRef.current.offsetHeight;
        document.documentElement.style.setProperty("--banner-height", `${h}px`);
      }
    };
    updateHeight();
    const ro = new ResizeObserver(updateHeight);
    if (bannerRef.current) ro.observe(bannerRef.current);
    return () => ro.disconnect();
  }, [offers, currentIndex]);

  // Fix #4: use a ref for lastScrollY to avoid re-registering the listener on every scroll
  const lastScrollY = useRef(0);

  const { setHasOfferData, setBannerVisible } = useOffersBanner();
  const [localVisible, setLocalVisible] = useState(true);
  const { socket } = useSocketStore();

  // Fetch offers
  const fetchOffers = useCallback(async () => {
    try {
      const res = await fetch("/api/offers");
      const data: OffersResponse = await res.json();

      if (data.activeOffers?.length > 0) {
        setOffers(data.activeOffers);
        setHasOfferData(true);
      } else {
        setHasOfferData(false);
      }
    } catch {
      setHasOfferData(false);
    } finally {
      setIsLoading(false);
    }
  }, [setHasOfferData]);

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  // Re-fetch offers when admin updates products/sales
  useEffect(() => {
    if (!socket) return;
    const handler = () => fetchOffers();
    socket.on("product_event", handler);
    socket.on("offer_event", handler);
    return () => {
      socket.off("product_event", handler);
      socket.off("offer_event", handler);
    };
  }, [socket, fetchOffers]);

  // Fix #5: smooth fade transition — pause auto-rotate while fading
  const [fading, setFading] = useState(false);

  const goTo = useCallback((index: number) => {
    setFading(true);
    setTimeout(() => {
      setCurrentIndex((prev) => {
        // Clamp to valid range in case offers changed during the fade
        if (offers.length === 0) return 0;
        return index >= offers.length ? 0 : index;
      });
      setFading(false);
    }, 200);
  }, [offers.length]);

  const goNext = useCallback(() => {
    goTo((currentIndex + 1) % offers.length);
  }, [currentIndex, offers.length, goTo]);

  const goPrev = useCallback(() => {
    goTo((currentIndex - 1 + offers.length) % offers.length);
  }, [currentIndex, offers.length, goTo]);

  // Auto-rotate every 4s — only when not fading
  useEffect(() => {
    if (offers.length <= 1 || fading) return;
    const interval = setInterval(goNext, 4000);
    return () => clearInterval(interval);
  }, [offers.length, fading, goNext]);

  // Fix #4: scroll handler uses ref, registered once
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const shouldShow =
        currentScrollY < lastScrollY.current || currentScrollY <= 50;

      setLocalVisible(shouldShow);
      setBannerVisible(shouldShow);
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [setBannerVisible]); // stable — only registers once

  // Fix #3: close hides banner but doesn't permanently kill it
  const handleClose = () => {
    setIsClosed(true);
    setLocalVisible(false);
    setBannerVisible(false);
    setHasOfferData(false);
    // Reset the CSS variable so the header snaps back to top-0
    document.documentElement.style.setProperty("--banner-height", "0px");
  };

  if (isLoading || offers.length === 0 || isClosed) return null;

  // Guard against index going out of bounds during fade transitions or re-fetches
  const safeIndex = currentIndex >= offers.length ? 0 : currentIndex;
  const offer = offers[safeIndex];
  if (!offer) return null;

  const hasMultiple = offers.length > 1;

  return (
    // Fix #1: use min-h instead of fixed height so wrapping text doesn't overlap header
    <div
      ref={bannerRef}
      className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ${
        localVisible ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      <div
        className="relative w-full text-center py-2 px-4 text-sm font-medium"
        style={{
          backgroundColor: offer.backgroundColor,
          color: offer.textColor,
        }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">

          {/* Fix #2: prev arrow — only shown when multiple offers */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {hasMultiple && (
              <button
                onClick={goPrev}
                className="p-0.5 hover:opacity-70 transition-opacity rounded"
                style={{ color: offer.textColor }}
                aria-label="Previous offer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Offer content — Fix #5: fade transition */}
          <div
            className={`flex-1 flex items-center justify-center gap-2 transition-opacity duration-200 ${
              fading ? "opacity-0" : "opacity-100"
            }`}
          >
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

            {/* Fix #2: dot indicators */}
            {hasMultiple && (
              <div className="hidden sm:flex items-center gap-1 ml-3">
                {offers.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goTo(i)}
                    className="rounded-full transition-all duration-200"
                    style={{
                      backgroundColor: offer.textColor,
                      opacity: i === currentIndex ? 1 : 0.4,
                      width: i === currentIndex ? "16px" : "6px",
                      height: "6px",
                    }}
                    aria-label={`Go to offer ${i + 1}`}
                  />
                ))}
              </div>
            )}

            {/* Mobile: numeric counter */}
            {hasMultiple && (
              <span
                className="sm:hidden text-xs opacity-70 ml-2"
                style={{ color: offer.textColor }}
              >
                {currentIndex + 1}/{offers.length}
              </span>
            )}
          </div>

          {/* Right: next arrow + close */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {hasMultiple && (
              <button
                onClick={goNext}
                className="p-0.5 hover:opacity-70 transition-opacity rounded"
                style={{ color: offer.textColor }}
                aria-label="Next offer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={handleClose}
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
