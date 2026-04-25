"use client";

import { useAuth } from "@/auth";
import MobileSidebar from "@/components/layout/MobileSidebar";
import MegaMenu from "@/components/navigation/MegaMenu";
import { useOffersBanner } from "@/hooks/use-offers-banner";
import { useSwipeToToggleMenu } from "@/hooks/use-swipe-gesture";
import { useCartStore, useWishlistStore } from "@/lib/stores";
import {
  Heart,
  Menu,
  ShoppingBag,
  UserIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import Search from "../navigation/Search";

export default function Header() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeMegaMenu, setActiveMegaMenu] = useState(null);
  const { hasOfferData, isBannerVisible } = useOffersBanner();

  const swipeMenuRef = useSwipeToToggleMenu(
    () => setIsMobileMenuOpen(true), // Swipe left to open menu
    () => setIsMobileMenuOpen(false), // Swipe right to close menu
  ) as React.RefObject<HTMLDivElement>;

  const { count: cartCount, fetchCart } = useCartStore();
  const { count: wishlistCount, fetchWishlist } = useWishlistStore();

  useEffect(() => {
    if (isAuthenticated && cartCount === 0) {
      fetchCart();
      fetchWishlist();
    }
  }, [isAuthenticated]);

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div ref={swipeMenuRef}>
      <header
        className={`max-w-7xl mx-auto py-6 lg:py-4 px-4 sm:px-6 lg:px-8 fixed left-0 right-0 bg-white shadow-sm border-b z-40 transition-all duration-300 ease-in-out ${
          hasOfferData && isBannerVisible ? "top-8" : "top-0"
        }`}
      >
        <div className="flex justify-between items-center">
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
                  onClick={() => router.push("/my")}
                  className="touch-manipulation active:scale-95 transition-transform"
                >
                  <UserIcon className="w-6 h-6 lg:w-5 lg:h-5" />
                </button>
              </>
            ) : (
              <button
                onClick={() => router.push("/login")}
                className="touch-manipulation active:scale-95 transition-transform"
              >
                <UserIcon className="w-6 h-6 lg:w-5 lg:h-5" />
              </button>
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
