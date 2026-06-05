"use client";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import { useFilterStore } from "@/lib/stores/fillterStore";
import { ProductService } from "@/lib/services/productService";
import { useSocketStore } from "@/lib/stores/socketStore";
import {
  X,
  Search,
  User,
  ShoppingBag,
  HelpCircle,
  Info,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, {
  useEffect,
  useState,
  useCallback,
} from "react";
import Image from "next/image";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onLinkClick?: () => void;
}



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

  componentDidCatch(error: any, errorInfo: any) {}

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
  const router = useRouter();
  const { categories } = useFilterStore();
  const { socket } = useSocketStore();
  const queryClient = useQueryClient();
  const [mobileSearch, setMobileSearch] = useState("");

  // Fetch new products with react-query (cached, no refetch on every open)
  const { data: newProducts = [], isLoading: newProductsLoading } = useQuery({
    queryKey: ["newProducts", "sidebar"],
    queryFn: () => ProductService.getProducts("/api/products/new"),
    enabled: isOpen,
    staleTime: Infinity, // Never stale — only refetches on invalidation
  });

  // Invalidate new products cache when a product_event arrives via socket
  useEffect(() => {
    if (!socket) return;

    const handleProductEvent = () => {
      queryClient.invalidateQueries({ queryKey: ["newProducts"] });
    };

    socket.on("product_event", handleProductEvent);
    return () => {
      socket.off("product_event", handleProductEvent);
    };
  }, [socket, queryClient]);

  // Optimized mobile link click with useCallback
  const handleMobileLinkClick = useCallback(() => {
    if (onLinkClick) {
      onLinkClick();
    } else {
      onClose();
    }
  }, [onLinkClick, onClose]);

  const handleMobileSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (mobileSearch.trim()) {
        onClose();
        router.push(
          `/collections?search=${encodeURIComponent(mobileSearch.trim())}`,
        );
        setMobileSearch("");
      }
    },
    [mobileSearch, router, onClose],
  );

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

          {/* Mobile Search Bar */}
          <form onSubmit={handleMobileSearch} className="px-4 pt-3 pb-1">
            <div className="flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2">
              <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <input
                type="text"
                value={mobileSearch}
                onChange={(e) => setMobileSearch(e.target.value)}
                placeholder="Search products..."
                className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none"
                aria-label="Search products"
              />
              {mobileSearch && (
                <button
                  type="button"
                  onClick={() => setMobileSearch("")}
                  className="text-gray-400 hover:text-gray-600"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </form>
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
                <div className="grid grid-cols-3 gap-4" role="list">
                    {categories.slice(0, 6).map((category) => (
                      <Link
                        key={category.id}
                        href={`/collections/${encodeURIComponent(category.name)}`}
                        className="group text-center transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:ring-offset-1 rounded-lg"
                        onClick={handleMobileLinkClick}
                        role="listitem"
                        aria-label={`Browse ${category.name} collection`}
                      >
                        <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-gray-100 mb-2 mx-auto group-hover:scale-105 transition-transform duration-200 will-change-transform">
                          {category.imageUrl ? (
                            <Image
                              src={category.imageUrl}
                              alt={category.name}
                              fill
                              sizes="96px"
                              className="object-cover"
                              loading="lazy"
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
                <div className="mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full rounded-full uppercase tracking-wide text-gray-900 border-gray-300 hover:bg-gray-50 hover:border-gray-400 hover:text-gray-900 transition-all duration-200 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
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
                          href={`/collections/${product.category?.name || 'all'}/${product.urlSlug || product.id}`}
                          className="group text-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 rounded-lg p-1"
                          onClick={handleMobileLinkClick}
                          role="listitem"
                          aria-label={`View ${product.name} product`}
                        >
                          <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-gray-100 mb-2 mx-auto group-hover:scale-105 transition-transform duration-200 will-change-transform">
                            {product.imageUrl ? (
                              <Image
                                src={product.imageUrl}
                                alt={product.name}
                                fill
                                sizes="96px"
                                className="object-cover"
                                loading="lazy"
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
                      className="w-full rounded-full uppercase tracking-wide text-gray-900 border-gray-300 hover:bg-gray-50 hover:border-gray-400 hover:text-gray-900 transition-all duration-200 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
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
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  onClick={handleMobileLinkClick}
                  role="listitem"
                  scroll={true}
                >
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                    <Info className="w-4 h-4" />
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
