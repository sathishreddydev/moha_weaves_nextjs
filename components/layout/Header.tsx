"use client";

import { useAuth } from "@/auth";
import SearchComponent from "@/components/layout/SearchComponent";
import MegaMenu from "@/components/navigation/MegaMenu";
import { Button } from "@/components/ui/button";
import { useCartStore, useFilterStore, useWishlistStore } from "@/lib/stores";
import { getProductUrl } from "@/lib/utils/productUrl";
import { Heart, Menu, ShoppingBag, UserIcon, X, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import Search from "../navigation/Search";

export default function Header() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeMegaMenu, setActiveMegaMenu] = useState(null);
  const [activeMobileSection, setActiveMobileSection] = useState<string | null>(
    null,
  );
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Get cart and wishlist data from stores
  const { count: cartCount, fetchCart } = useCartStore();
  const { count: wishlistCount, fetchWishlist } = useWishlistStore();
  const { categories, loading, error, fetchFilters } = useFilterStore();

  // Fetch cart and wishlist data when user is authenticated
  useEffect(() => {
    if (isAuthenticated && cartCount === 0) {
      fetchCart();
      fetchWishlist();
    }
  }, [isAuthenticated]);

  // Fetch filters for mobile menu
  useEffect(() => {
    if (categories.length === 0) {
      fetchFilters();
    }
  }, [categories.length, fetchFilters]);

  // Fetch featured products for mobile menu
  useEffect(() => {
    if (isMobileMenuOpen && featuredProducts.length === 0) {
      fetchFeaturedProducts();
    }
  }, [isMobileMenuOpen, featuredProducts.length]);

  const fetchFeaturedProducts = async () => {
    try {
      const response = await fetch("/api/products/featured");
      const data = await response.json();
      if (data.products) {
        setFeaturedProducts(data.products.slice(0, 4));
      }
    } catch (error) {
      console.error("Error fetching featured products:", error);
    }
  };

  // Handle mobile menu toggle
  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    setActiveMobileSection(null);
  };

  // Handle keyboard events for mobile menu
  const handleMobileMenuKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsMobileMenuOpen(false);
      setActiveMobileSection(null);
    }
  };

  // Handle mobile section click
  const handleMobileSectionClick = (section: string) => {
    setActiveMobileSection(activeMobileSection === section ? null : section);
  };

  // Close mobile menu when navigating
  const handleMobileLinkClick = () => {
    setIsMobileMenuOpen(false);
    setActiveMobileSection(null);
  };

  // Handle click outside to close mobile menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Check if click is outside mobile menu
      if (
        isMobileMenuOpen &&
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node)
      ) {
        setIsMobileMenuOpen(false);
        setActiveMobileSection(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  return (
    <div>
      <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 fixed top-0 left-0 right-0 bg-white shadow-sm border-b z-50">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Mobile Menu */}
          <div className="flex items-center sm:space-x-4">
            {/* Mobile menu button - moved to left */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMobileMenuToggle}
              className="md:hidden p-2"
              aria-label="Open menu"
              aria-expanded={isMobileMenuOpen}
            >
              <Menu className="w-6 h-6" />
            </Button>

            <Link href="/" className="text-xl font-bold text-primary-600">
              Moha
            </Link>
            <MegaMenu
              activeMegaMenu={activeMegaMenu}
              setActiveMegaMenu={setActiveMegaMenu}
            />
          </div>

          <div className="flex items-center">
            <Search
              activeMegaMenu={activeMegaMenu}
              setActiveMegaMenu={setActiveMegaMenu}
            />
            {isAuthenticated ? (
              <>
                {/* Wishlist */}
                <Button
                  variant={"link"}
                  onClick={() => router.push("/wishlist")}
                  className="relative"
                >
                  <Heart className="w-6 h-6" onClick={() => router.push("/wishlist")} />
                  {wishlistCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {wishlistCount > 99 ? "99+" : wishlistCount}
                    </span>
                  )}
                </Button>

                {/* Cart */}
                <Button
                  variant={"link"}
                  size={"sm"}
                  className="relative"
                  onClick={() => router.push("/cart")}
                >
                  <ShoppingBag className="w-6 h-6" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {cartCount > 99 ? "99+" : cartCount}
                    </span>
                  )}
                </Button>

                {/* User Menu */}
                <div className="relative">
                  <Button
                    variant={"link"}
                    size={"sm"}
                    onClick={() => router.push("/my")}
                  >
                    <UserIcon className="w-6 h-6" />
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex space-x-4">
                <Button
                  variant={"link"}
                  size={"sm"}
                  onClick={() => router.push("/login")}
                >
                  <UserIcon className="w-6 h-6" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Extended Header */}
        {isMobileMenuOpen && (
          <div
            ref={mobileMenuRef}
            className="md:hidden bg-white border-b border-gray-200"
            onKeyDown={handleMobileMenuKeyDown}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {/* Mobile Menu Header */}
              <div className="flex items-center justify-between py-4 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">Menu</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMobileMenuToggle}
                  className="p-2"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Mobile Menu Items */}
              <div
                className="py-4 space-y-2"
                role="navigation"
                aria-label="Mobile navigation"
              >
                <button
                  onClick={() => handleMobileSectionClick("collections")}
                  className="w-full text-left px-4 py-3 text-gray-700 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors duration-200 flex items-center justify-between"
                  aria-expanded={activeMobileSection === "collections"}
                  aria-controls="collections-panel"
                >
                  <span className="font-medium">Collections</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${
                      activeMobileSection === "collections" ? "rotate-180" : ""
                    }`}
                    aria-hidden="true"
                  />
                </button>

                <button
                  onClick={() => handleMobileSectionClick("categories")}
                  className="w-full text-left px-4 py-3 text-gray-700 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors duration-200 flex items-center justify-between"
                  aria-expanded={activeMobileSection === "categories"}
                  aria-controls="categories-panel"
                >
                  <span className="font-medium">All Categories</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${
                      activeMobileSection === "categories" ? "rotate-180" : ""
                    }`}
                    aria-hidden="true"
                  />
                </button>
              </div>

              {/* Mobile Extended Content */}
              {activeMobileSection && (
                <div className="pb-4 border-t border-gray-100" role="region">
                  {activeMobileSection === "collections" && (
                    <div id="collections-panel" className="pt-4">
                      <h4 className="px-4 text-sm font-semibold text-gray-900 mb-3">
                        Featured Products
                      </h4>
                      <div className="grid grid-cols-2 gap-3 px-4">
                        {featuredProducts.length > 0
                          ? featuredProducts.map((product: any) => (
                              <Link
                                key={product.id}
                                href={getProductUrl(product)}
                                className="group"
                                onClick={handleMobileLinkClick}
                              >
                                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 mb-2">
                                  {product.images &&
                                  product.images.length > 0 ? (
                                    <img
                                      src={product.images[0]}
                                      alt={product.name}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                    />
                                  ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center">
                                      <span className="text-purple-600 text-xs font-medium">
                                        Product
                                      </span>
                                    </div>
                                  )}
                                </div>
                                <h5 className="text-xs font-medium text-gray-900 group-hover:text-purple-600 transition-colors">
                                  {product.name}
                                </h5>
                                <p className="text-xs text-gray-600">
                                  {product.price
                                    ? `₹${product.price}`
                                    : "Price on request"}
                                </p>
                              </Link>
                            ))
                          : // Loading state or fallback
                            [1, 2, 3, 4].map((item) => (
                              <div key={item} className="animate-pulse">
                                <div className="aspect-square rounded-lg overflow-hidden bg-gray-200 mb-2"></div>
                                <div className="h-3 bg-gray-200 rounded mb-1"></div>
                                <div className="h-3 bg-gray-200 rounded w-16"></div>
                              </div>
                            ))}
                      </div>
                      <div className="mt-4 px-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="uppercase tracking-wide text-slate-800 hover:text-slate-400 hover:bg-transparent"
                          onClick={handleMobileLinkClick}
                          asChild
                        >
                          <Link href="/collections">
                            View All Collections
                          </Link>
                        </Button>
                      </div>
                    </div>
                  )}

                  {activeMobileSection === "categories" && (
                    <div id="categories-panel" className="pt-4">
                      <h4 className="px-4 text-sm font-semibold text-gray-900 mb-3">
                        Shop by Category
                      </h4>
                      <div className="grid grid-cols-2 gap-3 px-4">
                        {loading
                          ? // Loading state for categories
                            [1, 2, 3, 4, 5, 6].map((item) => (
                              <div key={item} className="animate-pulse">
                                <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-200 mb-2 mx-auto"></div>
                                <div className="h-3 bg-gray-200 rounded mx-auto w-16 mb-1"></div>
                              </div>
                            ))
                          : categories.slice(0, 6).map((category) => (
                              <Link
                                key={category.id}
                                href={`/collections/${encodeURIComponent(category.name)}`}
                                className="group p-3 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all duration-200"
                                onClick={handleMobileLinkClick}
                              >
                                <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 mb-2 mx-auto">
                                  {category.imageUrl ? (
                                    <img
                                      src={category.imageUrl}
                                      alt={category.name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center">
                                      <span className="text-purple-600 text-xs font-medium">
                                        {category.name.slice(0, 2)}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                <h5 className="text-xs font-medium text-gray-900 text-center group-hover:text-purple-600 transition-colors">
                                  {category.name}
                                </h5>
                              </Link>
                            ))}
                      </div>
                      <div className="mt-4 px-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="uppercase tracking-wide text-slate-800 hover:text-slate-400 hover:bg-transparent"
                          onClick={handleMobileLinkClick}
                          asChild
                        >
                          <Link href="/categories">
                            View All Categories
                          </Link>
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </header>
    </div>
  );
}
