"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { useOffersBanner } from "@/hooks/use-offers-banner";
import { useSocketStore } from "@/lib/stores/socketStore";
import { useInitialOffers } from "@/components/providers";

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
  const serverOffers = useInitialOffers();

  // Pre-seed from server data — no loading flash on first render
  const [offers, setOffers] = useState<Offer[]>(serverOffers);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isClosed, setIsClosed] = useState(false);
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

  const lastScrollY = useRef(0);
  const { setHasOfferData, setBannerVisible } = useOffersBanner();
  const [localVisible, setLocalVisible] = useState(true);
  const { socket } = useSocketStore();

  // Sync hasOfferData with the seeded initial state on mount
  useEffect(() => {
    setHasOfferData(serverOffers.length > 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-fetch from API when socket fires offer_event or product_event
  const fetchOffers = useCallback(async () => {
    try {
      const res = await fetch("/api/offers");
      const data: OffersResponse = await res.json();

      if (data.activeOffers?.length > 0) {
        setOffers(data.activeOffers);
        setHasOfferData(true);
      } else {
        setOffers([]);
        setHasOfferData(false);
      }
    } catch {
      // keep existing offers on network error
    }
  }, [setHasOfferData]);

  // Socket-driven re-fetch only — no initial fetch needed
  useEffect(() => {
    if (!socket) return;
    socket.on("product_event", fetchOffers);
    socket.on("offer_event", fetchOffers);
    return () => {
      socket.off("product_event", fetchOffers);
      socket.off("offer_event", fetchOffers);
    };
  }, [socket, fetchOffers]);

  // Smooth fade transition
  const [fading, setFading] = useState(false);
  const offersRef = useRef<Offer[]>(offers);
  offersRef.current = offers;

  const goTo = useCallback((index: number) => {
    setFading(true);
    setTimeout(() => {
      setCurrentIndex(() => {
        const currentOffers = offersRef.current;
        if (currentOffers.length === 0) return 0;
        return index >= currentOffers.length ? 0 : index;
      });
      setFading(false);
    }, 200);
  }, []);

  const currentIndexRef = useRef(currentIndex);
  currentIndexRef.current = currentIndex;

  const goNext = useCallback(() => {
    const len = offersRef.current.length;
    if (len === 0) return;
    goTo((currentIndexRef.current + 1) % len);
  }, [goTo]);

  const goPrev = useCallback(() => {
    const len = offersRef.current.length;
    if (len === 0) return;
    goTo((currentIndexRef.current - 1 + len) % len);
  }, [goTo]);

  // Auto-rotate every 4s
  useEffect(() => {
    if (offers.length <= 1 || fading) return;
    const interval = setInterval(goNext, 4000);
    return () => clearInterval(interval);
  }, [offers.length, fading, goNext]);

  // Scroll hide/show
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
  }, [setBannerVisible]);

  const handleClose = () => {
    setIsClosed(true);
    setLocalVisible(false);
    setBannerVisible(false);
    setHasOfferData(false);
    document.documentElement.style.setProperty("--banner-height", "0px");
  };

  if (offers.length === 0 || isClosed) return null;

  const safeIndex = currentIndex >= offers.length ? 0 : currentIndex;
  const offer = offers[safeIndex];
  if (!offer) return null;

  const hasMultiple = offers.length > 1;

  return (
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

            {hasMultiple && (
              <span
                className="sm:hidden text-xs opacity-70 ml-2"
                style={{ color: offer.textColor }}
              >
                {currentIndex + 1}/{offers.length}
              </span>
            )}
          </div>

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
