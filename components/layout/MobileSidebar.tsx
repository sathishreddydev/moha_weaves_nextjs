"use client";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import { useFilterStore } from "@/lib/stores";
import { ProductWithDetails } from "@/shared";
import { ProductService } from "@/lib/services/productService";
import { X, Search, User, Heart, ShoppingBag, HelpCircle } from "lucide-react";
import Link from "next/link";
import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  Suspense,
} from "react";

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onLinkClick?: () => void;
}

// Lazy loading image component
const LazyImage = ({
  src,
  alt,
  className,
  fallback,
}: {
  src: string;
  alt: string;
  className: string;
  fallback?: React.ReactNode;
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isLoaded && !hasError) {
            const img = entry.target as HTMLImageElement;
            img.src = src;
            img.onload = () => setIsLoaded(true);
            img.onerror = () => setHasError(true);
          }
        });
      },
      { threshold: 0.1 },
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [src, isLoaded, hasError]);

  if (hasError && fallback) {
    return <>{fallback}</>;
  }

  return (
    <img
      ref={imgRef}
      data-src={src}
      alt={alt}
      className={`${className} ${!isLoaded ? "opacity-0" : "opacity-100"} transition-opacity duration-300`}
      loading="lazy"
    />
  );
};

// Error boundary component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("MobileSidebar Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="p-4 text-center text-gray-500">
            <p>Something went wrong. Please try again.</p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="mt-2 text-purple-600 hover:text-purple-700"
            >
              Retry
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

export default function MobileSidebar({
  isOpen,
  onClose,
  onLinkClick,
}: MobileSidebarProps) {
  const { categories, loading } = useFilterStore();
  const [newProducts, setNewProducts] = useState<ProductWithDetails[]>([]);
  const [newProductsLoading, setNewProductsLoading] = useState(false);

  // Fetch new products using ProductService
  const fetchNewProducts = useCallback(async () => {
    try {
      setNewProductsLoading(true);
      const products = await ProductService.getProducts("/api/products/new");
      setNewProducts(products);
    } catch (error) {
      console.error("Failed to fetch new products:", error);
      setNewProducts([]);
    } finally {
      setNewProductsLoading(false);
    }
  }, []);

  // Optimized mobile link click with useCallback
  const handleMobileLinkClick = useCallback(() => {
    if (onLinkClick) {
      onLinkClick();
    } else {
      onClose();
    }
  }, [onLinkClick, onClose]);

  // Fetch new products when sidebar opens
  useEffect(() => {
    if (isOpen) {
      fetchNewProducts();
    }
  }, [isOpen, fetchNewProducts]);

  // Focus management for accessibility
  useEffect(() => {
    if (isOpen) {
      // Prevent body scroll when sidebar is open
      document.body.style.overflow = "hidden";

      // Focus first focusable element when sidebar opens
      const firstFocusable = document.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      ) as HTMLElement;

      if (firstFocusable) {
        setTimeout(() => firstFocusable.focus(), 100);
      }
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <ErrorBoundary>
      <Sheet open={isOpen} onOpenChange={onClose} side="left">
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Menu</SheetTitle>
            <SheetClose onClick={onClose} aria-label="Close menu">
              <X className="w-5 h-5" />
            </SheetClose>
          </SheetHeader>

          {/* Main Content */}
          <main className="px-4 py-4">
            {/* Collections Section */}
            <section aria-labelledby="collections-title">
              <h3
                id="collections-title"
                className="text-sm font-semibold text-gray-900 mb-3"
              >
                Collections
              </h3>
              <div className="pb-4">
                <Suspense
                  fallback={
                    <div className="grid grid-cols-3 gap-4">
                      {[1, 2, 3, 4, 5, 6].map((item) => (
                        <div key={item} className="animate-pulse text-center">
                          <div className="w-28 h-28 rounded-lg overflow-hidden bg-gray-200 mb-2 mx-auto"></div>
                          <div className="h-3 bg-gray-200 rounded mx-auto w-16"></div>
                        </div>
                      ))}
                    </div>
                  }
                >
                  <div className="grid grid-cols-3 gap-4" role="list">
                    {loading
                      ? // Loading state for categories
                        [1, 2, 3, 4, 5, 6].map((item) => (
                          <div
                            key={item}
                            className="animate-pulse text-center"
                            role="listitem"
                          >
                            <div className="w-28 h-28 rounded-lg overflow-hidden bg-gray-200 mb-2 mx-auto"></div>
                            <div className="h-3 bg-gray-200 rounded mx-auto w-16"></div>
                          </div>
                        ))
                      : categories.slice(0, 6).map((category) => (
                          <Link
                            key={category.id}
                            href={`/collections/${encodeURIComponent(category.name)}`}
                            className="group text-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 rounded-lg p-1"
                            onClick={handleMobileLinkClick}
                            role="listitem"
                            aria-label={`Browse ${category.name} collection`}
                          >
                            <div className="w-28 h-28 rounded-lg overflow-hidden bg-gray-100 mb-2 mx-auto group-hover:scale-105 transition-transform duration-200 will-change-transform">
                              {category.imageUrl ? (
                                <LazyImage
                                  src={category.imageUrl}
                                  alt={category.name}
                                  className="w-full h-full object-cover"
                                  fallback={
                                    <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                                      <span className="text-gray-700 text-xs font-medium">
                                        {category.name.slice(0, 2)}
                                      </span>
                                    </div>
                                  }
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                                  <span className="text-gray-700 text-xs font-medium">
                                    {category.name.slice(0, 2)}
                                  </span>
                                </div>
                              )}
                            </div>
                            <h5 className="text-xs font-medium text-gray-900 group-hover:text-gray-700 transition-colors">
                              {category.name}
                            </h5>
                          </Link>
                        ))}
                  </div>
                </Suspense>
                <div className="mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full rounded-full uppercase tracking-wide text-gray-900 border-gray-300 hover:bg-gray-50 hover:border-gray-400 hover:text-gray-900 transition-all duration-200 touch-manipulation active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                    onClick={handleMobileLinkClick}
                    asChild
                  >
                    <Link href="/collections" aria-label="View all collections">
                      View All Collections
                    </Link>
                  </Button>
                </div>
              </div>
            </section>

            {/* New Arrivals Section */}
            {newProducts.length > 0 && (
              <section aria-labelledby="new-arrivals-title" className="mt-6">
                <h3
                  id="new-arrivals-title"
                  className="text-sm font-semibold text-gray-900 mb-3"
                >
                  New Arrivals
                </h3>
                <div className="pb-4">
                  {newProductsLoading ? (
                    <div className="grid grid-cols-3 gap-3">
                      {[1, 2, 3].map((item) => (
                        <div key={item} className="animate-pulse text-center">
                          <div className="w-28 h-28 rounded-lg overflow-hidden bg-gray-200 mb-2 mx-auto"></div>
                          <div className="h-3 bg-gray-200 rounded mx-auto w-20"></div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-3" role="list">
                      {newProducts.slice(0, 6).map((product) => (
                        <Link
                          key={product.id}
                          href={`/products/${product.id}`}
                          className="group text-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 rounded-lg p-1"
                          onClick={handleMobileLinkClick}
                          role="listitem"
                          aria-label={`View ${product.name} product`}
                        >
                          <div className="w-28 h-28 rounded-lg overflow-hidden bg-gray-100 mb-2 mx-auto group-hover:scale-105 transition-transform duration-200 will-change-transform">
                            {product.imageUrl ? (
                              <img
                                src={product.imageUrl}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                                <span className="text-gray-700 text-xs font-medium">
                                  {product.name.slice(0, 2)}
                                </span>
                              </div>
                            )}
                          </div>
                          <h5 className="text-xs font-medium text-gray-900 group-hover:text-gray-700 transition-colors truncate">
                            {product.name}
                          </h5>
                        </Link>
                      ))}
                    </div>
                  )}
                  <div className="mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full rounded-full uppercase tracking-wide text-gray-900 border-gray-300 hover:bg-gray-50 hover:border-gray-400 hover:text-gray-900 transition-all duration-200 touch-manipulation active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                      onClick={handleMobileLinkClick}
                      asChild
                    >
                      <Link
                        href="/collections/new-arrivals"
                        aria-label="View all new arrivals"
                      >
                        View All New Arrivals
                      </Link>
                    </Button>
                  </div>
                </div>
              </section>
            )}

            {/* Quick Access Section */}
            <section aria-labelledby="quick-access-title" className="mt-6">
              <h3
                id="quick-access-title"
                className="text-sm font-semibold text-gray-900 mb-3"
              >
                Quick Access
              </h3>
              <nav className="space-y-1" role="list">
                <Link
                  href="/about-us"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors touch-manipulation active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  onClick={handleMobileLinkClick}
                  role="listitem"
                  scroll={true}
                >
                  <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                    <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">
                      About Us
                    </p>
                  </div>
                </Link>

                <Link
                  href="/my"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors touch-manipulation active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  onClick={handleMobileLinkClick}
                  role="listitem"
                  scroll={true}
                >
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                    <User className="w-4 h-4 text-gray-700" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">
                      My Account
                    </p>
                  </div>
                </Link>

                <Link
                  href="/my/orders"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors touch-manipulation active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  onClick={handleMobileLinkClick}
                  role="listitem"
                  scroll={true}
                >
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                    <ShoppingBag className="w-4 h-4 text-gray-700" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">
                      Order History
                    </p>
                  </div>
                </Link>

                <Link
                  href="/contact"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors touch-manipulation active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  onClick={handleMobileLinkClick}
                  role="listitem"
                  scroll={true}
                >
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                    <HelpCircle className="w-4 h-4 text-gray-700" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">
                      Help & Support
                    </p>
                  </div>
                </Link>
              </nav>
            </section>
          </main>
        </SheetContent>
      </Sheet>
    </ErrorBoundary>
  );
}
