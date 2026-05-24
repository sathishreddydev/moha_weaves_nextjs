"use client";

import { useAuth } from "@/auth";
import MobileSidebar from "@/components/layout/MobileSidebar";
import MegaMenu from "@/components/navigation/MegaMenu";
import { useOffersBanner } from "@/hooks/use-offers-banner";
import { useSwipeToToggleMenu } from "@/hooks/use-swipe-gesture";
import { useCartStore, useWishlistStore } from "@/lib/stores";
import { Heart, Menu, ShoppingBag, UserIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import Search from "../navigation/Search";

export default function Header() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeMegaMenu, setActiveMegaMenu] = useState(null);
  const { hasOfferData, isBannerVisible } = useOffersBanner();
  const headerRef = useRef<HTMLElement>(null);

  const swipeMenuRef = useSwipeToToggleMenu(
    () => setIsMobileMenuOpen(true),
    () => setIsMobileMenuOpen(false),
  ) as React.RefObject<HTMLDivElement>;

  const { count: cartCount, fetchCart } = useCartStore();
  const { count: wishlistCount, fetchWishlist } = useWishlistStore();

  // Track previous auth state to detect login/logout transitions
  const prevAuthRef = useRef(isAuthenticated);

  useEffect(() => {
    if (authLoading) return; // Wait for auth status to resolve

    const authChanged = prevAuthRef.current !== isAuthenticated;
    prevAuthRef.current = isAuthenticated;

    if (isAuthenticated) {
      // Always fetch on auth change (login), or if count is 0 (initial load)
      if (authChanged || cartCount === 0) fetchCart();
      if (authChanged || wishlistCount === 0) fetchWishlist();
    } else {
      // Guest user — load cart/wishlist from localStorage
      if (authChanged || cartCount === 0) fetchCart();
      if (authChanged) fetchWishlist();
    }
  }, [
    authLoading,
    isAuthenticated,
    cartCount,
    wishlistCount,
    fetchCart,
    fetchWishlist,
  ]);

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
  const profileRoute = isMobile ? "/my" : "/my/details";

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
              Moha
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
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] rounded-full h-3 w-3 flex items-center justify-center">
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
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] rounded-full h-3 w-3 flex items-center justify-center">
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
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] rounded-full h-3 w-3 flex items-center justify-center">
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
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] rounded-full h-3 w-3 flex items-center justify-center">
                      {cartCount > 9 ? "9+" : cartCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => router.push("/login")}
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
