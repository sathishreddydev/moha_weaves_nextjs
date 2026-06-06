"use client";

import { useAuth } from "@/auth";
import MobileSidebar from "@/components/layout/MobileSidebar";
import MegaMenu from "@/components/navigation/MegaMenu";
import { useOffersBanner } from "@/hooks/use-offers-banner";
import { useSwipeToToggleMenu } from "@/hooks/use-swipe-gesture";
import { useCartCount } from "@/hooks/useCartQueries";
import { useWishlistCount } from "@/hooks/useWishlistQueries";
import { useCartSocketSync } from "@/hooks/useCartSocketSync";
import { Heart, Menu, ShoppingBag, UserIcon } from "lucide-react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import Search from "../navigation/Search";

export default function Header() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeMegaMenu, setActiveMegaMenu] = useState(null);
  const { hasOfferData, isBannerVisible } = useOffersBanner();
  const headerRef = useRef<HTMLElement>(null);

  const swipeMenuRef = useSwipeToToggleMenu(
    () => setIsMobileMenuOpen(true),
    () => setIsMobileMenuOpen(false),
  ) as React.RefObject<HTMLDivElement>;

  const { count: cartCount } = useCartCount();
  const { count: wishlistCount } = useWishlistCount();

  // Socket sync — invalidates cart cache on product_purchased, offer_event, etc.
  useCartSocketSync();

  // Expose --header-height CSS variable so LayoutWrapper and sticky elements
  // can always reference the real measured height instead of hardcoded values.
  useEffect(() => {
    const updateHeaderHeight = () => {
      if (headerRef.current) {
        const h = headerRef.current.offsetHeight;
        document.documentElement.style.setProperty("--header-height", `${h}px`);
      }
    };
    updateHeaderHeight();
    const ro = new ResizeObserver(updateHeaderHeight);
    if (headerRef.current) ro.observe(headerRef.current);
    return () => ro.disconnect();
  }, []);

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const profileRoute = "/my";

  return (
    <div ref={swipeMenuRef}>
      {/* Full-viewport-width fixed bar — shadow/border spans the whole screen */}
      <header
        ref={headerRef}
        className={`fixed left-0 right-0 bg-white shadow-sm border-b z-40 transition-all duration-300 ease-in-out ${
          hasOfferData && isBannerVisible
            ? "top-[var(--banner-height,0px)]"
            : "top-0"
        }`}
      >
        {/* Inner content constrained to max-w-7xl */}
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={handleMobileMenuToggle}
              className="md:hidden touch-manipulation active:scale-95 transition-transform"
              aria-label="Open menu"
              aria-expanded={isMobileMenuOpen}
            >
              <Menu className="w-6 h-6" />
            </button>
            <Link href="/" className="text-xl font-bold text-primary-600">
              Urumi
            </Link>
            <MegaMenu
              activeMegaMenu={activeMegaMenu}
              setActiveMegaMenu={setActiveMegaMenu}
            />
          </div>

          <div className="flex items-center space-x-3">
            <Search
              activeMegaMenu={activeMegaMenu}
              setActiveMegaMenu={setActiveMegaMenu}
            />
            {isAuthenticated ? (
              <>
                <button
                  onClick={() => router.push("/wishlist")}
                  className="relative touch-manipulation active:scale-95 transition-transform"
                >
                  <Heart className="w-6 h-6 lg:w-5 lg:h-5" />
                  {wishlistCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-gray-900 text-white text-[9px] font-semibold rounded-full min-w-[16px] h-4 px-0.5 flex items-center justify-center leading-none">
                      {wishlistCount > 9 ? "9+" : wishlistCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => router.push("/cart")}
                  className="relative touch-manipulation active:scale-95 transition-transform"
                >
                  <ShoppingBag className="w-6 h-6 lg:w-5 lg:h-5" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-gray-900 text-white text-[9px] font-semibold rounded-full min-w-[16px] h-4 px-0.5 flex items-center justify-center leading-none">
                      {cartCount > 9 ? "9+" : cartCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => router.push(profileRoute)}
                  className="touch-manipulation active:scale-95 transition-transform"
                >
                  <UserIcon className="w-6 h-6 lg:w-5 lg:h-5" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => router.push("/wishlist")}
                  className="relative touch-manipulation active:scale-95 transition-transform"
                >
                  <Heart className="w-6 h-6 lg:w-5 lg:h-5" />
                  {wishlistCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-gray-900 text-white text-[9px] font-semibold rounded-full min-w-[16px] h-4 px-0.5 flex items-center justify-center leading-none">
                      {wishlistCount > 9 ? "9+" : wishlistCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => router.push("/cart")}
                  className="relative touch-manipulation active:scale-95 transition-transform"
                >
                  <ShoppingBag className="w-6 h-6 lg:w-5 lg:h-5" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-gray-900 text-white text-[9px] font-semibold rounded-full min-w-[16px] h-4 px-0.5 flex items-center justify-center leading-none">
                      {cartCount > 9 ? "9+" : cartCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => router.push(`/login?returnUrl=${encodeURIComponent(pathname)}`)}
                  className="touch-manipulation active:scale-95 transition-transform"
                >
                  <UserIcon className="w-6 h-6 lg:w-5 lg:h-5" />
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <MobileSidebar
        isOpen={isMobileMenuOpen}
        onClose={handleMobileMenuToggle}
      />
    </div>
  );
}
