"use client";

import { ProductFilters } from "@/app/api/products/productService";
import ActiveFilterBadges from "@/components/filters/ActiveFilterBadges";
import CollectionsFilterSections from "@/components/filters/CollectionsFilterSections";
import VirtualizedProductGrid from "@/components/products/VirtualizedProductGrid";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFilterStore } from "@/lib/stores/fillterStore";
import { useSocketStore } from "@/lib/stores/socketStore";
import { useAuth } from "@/auth";
import { useWishlistQuery, useAddToWishlist, useRemoveFromWishlist, useGuestWishlist } from "@/hooks/useWishlistQueries";
import { getProductUrl } from "@/lib/utils/productUrl";
import { ProductWithDetails } from "@/shared";
import { FilterIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

const PAGE_SIZE = 20;

interface CollectionsClientProps {
  initialProducts: ProductWithDetails[];
  initialCount: number;
  initialFilters: ProductFilters;
}

export default function CollectionsClient({
  initialProducts,
  initialCount,
  initialFilters,
}: CollectionsClientProps) {
  const router = useRouter();
  const socket = useSocketStore((s) => s.socket);
  const isSocketConnected = useSocketStore((s) => s.isConnected);
  const { isAuthenticated } = useAuth();

  const { categories, colors, fabrics } = useFilterStore();
  const { data: wishlistData } = useWishlistQuery();
  const addToWishlistMutation = useAddToWishlist();
  const removeFromWishlistMutation = useRemoveFromWishlist();
  const guestWishlist = useGuestWishlist();
  
  const addToWishlist = (productId: string) => {
    if (isAuthenticated) addToWishlistMutation.mutate(productId);
    else guestWishlist.addToWishlist(productId);
  };
  const removeFromWishlist = (productId: string) => {
    if (isAuthenticated) removeFromWishlistMutation.mutate(productId);
    else guestWishlist.removeFromWishlist(productId);
  };
  const isInWishlist = (productId: string) => {
    if (isAuthenticated) return (wishlistData?.wishlist ?? []).some(item => item.productId === productId);
    return guestWishlist.isInWishlist(productId);
  };

  useEffect(() => {
    if (!isAuthenticated) guestWishlist.fetchWishlist();
  }, [isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!socket) return;
    const handleProductEvent = () => router.refresh();
    socket.on("product_event", handleProductEvent);
    socket.on("offer_event", handleProductEvent);
    return () => {
      socket.off("product_event", handleProductEvent);
      socket.off("offer_event", handleProductEvent);
    };
  }, [isSocketConnected, router]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── State ──────────────────────────────────────────────────────────────────
  const [showFilters, setShowFilters] = useState(false);
  const [currentFilters, setCurrentFilters] =
    useState<ProductFilters>(initialFilters);
  const [displayedProducts, setDisplayedProducts] = useState<
    ProductWithDetails[]
  >(initialProducts || []);
  const [totalCount, setTotalCount] = useState(initialCount || 0);
  const [offset, setOffset] = useState(initialProducts?.length || 0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isApplyingFilters, setIsApplyingFilters] = useState(false);

  // Reset when server re-renders with new filter results
  useEffect(() => {
    setDisplayedProducts(initialProducts || []);
    setTotalCount(initialCount || 0);
    setOffset(initialProducts?.length || 0);
  }, [initialProducts, initialCount]);

  // ── URL sync ───────────────────────────────────────────────────────────────
  const updateURL = useCallback(
    (filters: ProductFilters) => {
      const params = new URLSearchParams();
      if (filters.categories?.length)
        params.set("categories", filters.categories.join(","));
      if (filters.colors?.length)
        params.set("colors", filters.colors.join(","));
      if (filters.fabrics?.length)
        params.set("fabrics", filters.fabrics.join(","));
      if (filters.minPrice || filters.maxPrice)
        params.set(
          "price",
          `${filters.minPrice || 100}-${filters.maxPrice || 50000}`,
        );
      if (filters.search) params.set("search", filters.search);
      if (filters.sort && filters.sort !== "newest")
        params.set("sort", filters.sort);
      if (filters.featured) params.set("featured", "true");
      if (filters.onSale) params.set("onSale", "true");
      const qs = params.toString();
      router.push(qs ? `/collections?${qs}` : "/collections", {
        scroll: false,
      });
    },
    [router],
  );

  // ── Filter handlers ────────────────────────────────────────────────────────
  const handleFilterChange = useCallback(
    (newFilters: Partial<ProductFilters>) => {
      setIsApplyingFilters(true);
      const updated = { ...currentFilters, ...newFilters, offset: 0 };
      setCurrentFilters(updated);
      updateURL(updated);
      setTimeout(() => setIsApplyingFilters(false), 500);
    },
    [currentFilters, updateURL],
  );

  const handleSortChange = useCallback(
    (sort: string) => handleFilterChange({ sort }),
    [handleFilterChange],
  );

  const handleCategoryChange = useCallback(
    (category: string, checked: boolean) => {
      const next = checked
        ? [...(currentFilters.categories || []), category.toLowerCase()]
        : (currentFilters.categories || []).filter(
            (c) => c !== category.toLowerCase(),
          );
      handleFilterChange({ categories: next });
    },
    [currentFilters, handleFilterChange],
  );

  const handleColorChange = useCallback(
    (color: string, checked: boolean) => {
      const next = checked
        ? [...(currentFilters.colors || []), color.toLowerCase()]
        : (currentFilters.colors || []).filter(
            (c) => c !== color.toLowerCase(),
          );
      handleFilterChange({ colors: next });
    },
    [currentFilters, handleFilterChange],
  );

  const handleFabricChange = useCallback(
    (fabric: string, checked: boolean) => {
      const next = checked
        ? [...(currentFilters.fabrics || []), fabric.toLowerCase()]
        : (currentFilters.fabrics || []).filter(
            (c) => c !== fabric.toLowerCase(),
          );
      handleFilterChange({ fabrics: next });
    },
    [currentFilters, handleFilterChange],
  );

  const handleToggleFilter = useCallback(
    (filterType: "featured" | "onSale", checked: boolean) => {
      handleFilterChange({ [filterType]: checked });
    },
    [handleFilterChange],
  );

  const handlePriceRangeChange = useCallback(
    (priceRange: [number, number]) => {
      handleFilterChange({
        minPrice: priceRange[0] === 100 ? undefined : priceRange[0],
        maxPrice: priceRange[1] === 50000 ? undefined : priceRange[1],
      });
    },
    [handleFilterChange],
  );

  const handleClearAllFilters = useCallback(() => {
    setIsApplyingFilters(true);
    const cleared: ProductFilters = {
      limit: PAGE_SIZE,
      offset: 0,
      distributionChannel: "online",
    };
    setCurrentFilters(cleared);
    updateURL(cleared);
    setTimeout(() => setIsApplyingFilters(false), 500);
  }, [updateURL]);

  // ── Load More ──────────────────────────────────────────────────────────────
  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const params = new URLSearchParams();
      if (currentFilters.categories?.length)
        params.set("categories", currentFilters.categories.join(","));
      if (currentFilters.colors?.length)
        params.set("colors", currentFilters.colors.join(","));
      if (currentFilters.fabrics?.length)
        params.set("fabrics", currentFilters.fabrics.join(","));
      if (currentFilters.minPrice)
        params.set("minPrice", String(currentFilters.minPrice));
      if (currentFilters.maxPrice)
        params.set("maxPrice", String(currentFilters.maxPrice));
      if (currentFilters.search) params.set("search", currentFilters.search);
      if (currentFilters.sort) params.set("sort", currentFilters.sort);
      if (currentFilters.featured) params.set("featured", "true");
      if (currentFilters.onSale) params.set("onSale", "true");
      params.set("distributionChannel", "online");
      params.set("limit", String(PAGE_SIZE));
      params.set("offset", String(offset));

      const res = await fetch(`/api/products?${params.toString()}`);
      const data = await res.json();
      if (data.success && data.data?.length) {
        setDisplayedProducts((prev) => [...prev, ...data.data]);
        setOffset((prev) => prev + data.data.length);
      }
    } catch {
      // silently fail — user can retry
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, currentFilters, offset]);

  // ── Wishlist ───────────────────────────────────────────────────────────────
  const handleQuickView = useCallback(
    (product: ProductWithDetails) => router.push(getProductUrl(product)),
    [router],
  );

  const handleWishlistToggle = useCallback(
    async (product: ProductWithDetails) => {
      if (isInWishlist(product.id)) await removeFromWishlist(product.id);
      else await addToWishlist(product.id);
    },
    [isInWishlist, removeFromWishlist, addToWishlist],
  );

  const hasMore = displayedProducts.length < totalCount;

  // ── Active filter badges ───────────────────────────────────────────────────
  const activeBadges = [
    ...(currentFilters.categories || []).map((c) => ({
      label: c,
      onRemove: () => handleCategoryChange(c, false),
    })),
    ...(currentFilters.colors || []).map((c) => ({
      label: c,
      onRemove: () => handleColorChange(c, false),
    })),
    ...(currentFilters.fabrics || []).map((f) => ({
      label: f,
      onRemove: () => handleFabricChange(f, false),
    })),
    ...(currentFilters.minPrice || currentFilters.maxPrice
      ? [
          {
            label: `₹${currentFilters.minPrice ?? 100} – ₹${currentFilters.maxPrice ?? 50000}`,
            onRemove: () =>
              handleFilterChange({ minPrice: undefined, maxPrice: undefined }),
          },
        ]
      : []),
    ...(currentFilters.featured
      ? [
          {
            label: "Featured",
            onRemove: () => handleToggleFilter("featured", false),
          },
        ]
      : []),
    ...(currentFilters.onSale
      ? [
          {
            label: "On Sale",
            onRemove: () => handleToggleFilter("onSale", false),
          },
        ]
      : []),
  ];
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters Sidebar - Desktop */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <div
            className="sticky space-y-6"
            style={{
              top: "calc(var(--banner-height, 0px) + var(--header-height, 74px) + 1.5rem)",
            }}
          >
            <h1 className="text-xl font-light text-gray-900 uppercase tracking-[0.1em]">
              Collections
            </h1>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-light text-gray-900">Filters</h3>
                <Button
                  variant="link"
                  onClick={handleClearAllFilters}
                  className="text-sm text-blue-600 hover:text-blue-800 font-light"
                >
                  Clear All
                </Button>
              </div>
              <CollectionsFilterSections
                categories={categories}
                colors={colors}
                fabrics={fabrics}
                currentFilters={currentFilters}
                onCategoryChange={handleCategoryChange}
                onColorChange={handleColorChange}
                onFabricChange={handleFabricChange}
                onToggleFilter={handleToggleFilter}
                onPriceRangeChange={handlePriceRangeChange}
              />
            </div>
          </div>
        </aside>

        {/* Products Grid */}
        <div className="flex-1">
          <h1 className="lg:hidden text-xl font-light text-gray-900 uppercase tracking-[0.1em]">
            Collections
          </h1>

          {/* Sort + Mobile Filter */}
          <div className="flex justify-end items-center gap-2">
            <Select onValueChange={handleSortChange} defaultValue="newest">
              <SelectTrigger className="w-[120px] h-8 text-xs sm:w-[180px] sm:h-10 sm:text-sm">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest" className="text-xs sm:text-sm">
                  Newest First
                </SelectItem>
                <SelectItem value="price-low" className="text-xs sm:text-sm">
                  Price: Low to High
                </SelectItem>
                <SelectItem value="price-high" className="text-xs sm:text-sm">
                  Price: High to Low
                </SelectItem>
                <SelectItem value="name" className="text-xs sm:text-sm">
                  Name: A to Z
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Mobile-only filter drawer — hidden on sm+ so it never renders on desktop */}
            <div className="sm:hidden">
              <Drawer open={showFilters} onOpenChange={setShowFilters}>
                <DrawerTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-8 px-2 border border-gray-300 rounded-lg"
                  >
                    <FilterIcon className="h-4 w-4" />
                  </Button>
                </DrawerTrigger>
                <DrawerContent className="h-[85vh] flex flex-col overflow-hidden">
                  {/* Drag handle */}
                  <div className="mx-auto mt-3 mb-1 h-1.5 w-12 rounded-full bg-gray-300 flex-shrink-0" />
                  {/* Sticky header */}
                  <DrawerHeader className="flex-shrink-0 border-b border-gray-100 px-5 py-4">
                    <div className="flex items-center justify-between">
                      <DrawerTitle className="text-left text-base font-semibold">
                        Filters
                      </DrawerTitle>
                      <Button
                        variant="link"
                        onClick={handleClearAllFilters}
                        className="text-sm text-blue-600 hover:text-blue-800 font-light p-0 h-auto"
                      >
                        Clear All
                      </Button>
                    </div>
                  </DrawerHeader>
                  {/* Scrollable content */}
                  <div className="flex-1 min-h-0 overflow-y-auto px-5 py-5">
                    <CollectionsFilterSections
                      categories={categories}
                      colors={colors}
                      fabrics={fabrics}
                      currentFilters={currentFilters}
                      onCategoryChange={handleCategoryChange}
                      onColorChange={handleColorChange}
                      onFabricChange={handleFabricChange}
                      onToggleFilter={handleToggleFilter}
                      onPriceRangeChange={handlePriceRangeChange}
                    />
                  </div>
                  {/* Sticky footer */}
                  <div className="flex-shrink-0 px-5 py-4 border-t border-gray-100 bg-white">
                    <Button
                      className="w-full h-11 text-sm font-medium"
                      onClick={() => setShowFilters(false)}
                    >
                      Apply Filters
                    </Button>
                  </div>
                </DrawerContent>
              </Drawer>
            </div>
          </div>

          {/* Active Filter Badges - Mobile only */}
          <ActiveFilterBadges
            filters={activeBadges}
            onClearAll={handleClearAllFilters}
          />

          {/* Sale context banner — shown when user arrives via a sitewide offer link */}
          {currentFilters.onSale && (
            <div className="mt-4 mb-2 px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2 bg-red-50 border border-red-200 text-red-800">
              <span className="text-base">🎉</span>
              <span>
                Showing all sale items. Prices already reflect the discount.
              </span>
              <button
                onClick={() => handleToggleFilter("onSale", false)}
                className="ml-auto text-red-600 hover:text-red-800 underline text-xs whitespace-nowrap"
              >
                Show all
              </button>
            </div>
          )}

          {/* Products */}
          {displayedProducts.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No products found
              </h3>
              <p className="text-gray-600">
                Try adjusting your filters or search terms
              </p>
            </div>
          ) : (
            <VirtualizedProductGrid
              products={displayedProducts}
              hasMore={hasMore}
              isLoadingMore={isLoadingMore}
              onLoadMore={handleLoadMore}
              onQuickView={handleQuickView}
              onWishlistToggle={handleWishlistToggle}
              isWishlisted={isInWishlist}
            />
          )}
        </div>
      </div>
    </div>
  );
}
