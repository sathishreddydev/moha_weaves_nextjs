"use client";

import { ProductFilters } from "@/app/api/products/productService";
import VirtualizedProductGrid from "@/components/products/VirtualizedProductGrid";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import CategoryFilterSections from "@/components/filters/CategoryFilterSections";
import ActiveFilterBadges from "@/components/filters/ActiveFilterBadges";
import StickyPanel from "@/components/ui/StickyPanel";
import { CategoryWithSubcategories, ProductWithDetails } from "@/shared";
import { FilterIcon, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState, useEffect } from "react";
import { useAuth } from "@/auth";
import { useWishlistQuery, useAddToWishlist, useRemoveFromWishlist, useGuestWishlist } from "@/hooks/useWishlistQueries";
import { useFilterStore } from "@/lib/stores/fillterStore";
import { getProductUrl } from "@/lib/utils/productUrl";
import { useSocketStore } from "@/lib/stores/socketStore";

const PAGE_SIZE = 20;

interface CategoryClientProps {
  categoryName: string;
  initialProducts: ProductWithDetails[];
  initialCount: number;
  initialFilters: ProductFilters;
}

export default function CategoryClient({
  initialProducts,
  initialCount,
  initialFilters,
  categoryName,
}: CategoryClientProps) {
  const router = useRouter();
  const { socket } = useSocketStore();
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
  // Fix: isInWishlist wrapped in useCallback so handleWishlistToggle truly memoizes
  const isInWishlist = useCallback(
    (productId: string) => {
      if (isAuthenticated)
        return (wishlistData?.wishlist ?? []).some(
          (item) => item.productId === productId,
        );
      return guestWishlist.isInWishlist(productId);
    },
    [isAuthenticated, wishlistData, guestWishlist],
  );

  useEffect(() => {
    if (!isAuthenticated) guestWishlist.fetchWishlist();
  }, [isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!socket) return;
    const handleProductEvent = () => router.refresh();
    socket.on("product_event", handleProductEvent);
    socket.on("offer_event", handleProductEvent);
    return () => { socket.off("product_event", handleProductEvent); socket.off("offer_event", handleProductEvent); };
  }, [socket, router]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 640px)");
    const handleChange = (e: MediaQueryListEvent) => {
      if (e.matches) setShowFilters(false);
    };
    mq.addEventListener("change", handleChange);
    return () => mq.removeEventListener("change", handleChange);
  }, []);
  const [currentFilters, setCurrentFilters] = useState<ProductFilters>(initialFilters);
  const [displayedProducts, setDisplayedProducts] = useState<ProductWithDetails[]>(initialProducts || []);
  const [totalCount, setTotalCount] = useState(initialCount || 0);
  const [offset, setOffset] = useState(initialProducts?.length || 0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Reset when server re-renders with new filter results
  useEffect(() => {
    setDisplayedProducts(initialProducts || []);
    setTotalCount(initialCount || 0);
    setOffset(initialProducts?.length || 0);
    setCurrentFilters(initialFilters);
  }, [initialProducts, initialCount, initialFilters]);

  // ── Category / subcategories ───────────────────────────────────────────────
  const currentCategory = categories.find(
    (cat) => cat.name.toLowerCase() === categoryName.toLowerCase(),
  ) as CategoryWithSubcategories | null ?? null;
  const currentSubcategories = currentCategory?.subcategories || [];

  // ── URL sync ───────────────────────────────────────────────────────────────
  const updateURL = useCallback(
    (filters: ProductFilters) => {
      const params = new URLSearchParams();
      if (filters.subcategories?.length) params.set("subcategories", filters.subcategories.join(","));
      if (filters.colors?.length) params.set("colors", filters.colors.join(","));
      if (filters.fabrics?.length) params.set("fabrics", filters.fabrics.join(","));
      if (filters.minPrice || filters.maxPrice)
        params.set("price", `${filters.minPrice || 100}-${filters.maxPrice || 50000}`);
      if (filters.search) params.set("search", filters.search);
      if (filters.sort && filters.sort !== "newest") params.set("sort", filters.sort);
      if (filters.featured) params.set("featured", "true");
      if (filters.onSale) params.set("onSale", "true");
      const qs = params.toString();
      router.push(qs ? `/collections/${categoryName}?${qs}` : `/collections/${categoryName}`, { scroll: false });
    },
    [router, categoryName],
  );

  // ── Filter handlers ────────────────────────────────────────────────────────
  const handleFilterChange = useCallback(
    (newFilters: Partial<ProductFilters>) => {
      const updated = { ...currentFilters, ...newFilters, offset: 0 };
      setCurrentFilters(updated);
      updateURL(updated);
    },
    [currentFilters, updateURL],
  );

  const handleSortChange = useCallback(
    (sort: string) => handleFilterChange({ sort }),
    [handleFilterChange],
  );

  const handleSubcategoryChange = useCallback(
    (subcategory: string, checked: boolean) => {
      const next = checked
        ? [...(currentFilters.subcategories || []), subcategory.toLowerCase()]
        : (currentFilters.subcategories || []).filter((c) => c !== subcategory.toLowerCase());
      handleFilterChange({ subcategories: next });
    },
    [currentFilters, handleFilterChange],
  );

  const handleColorChange = useCallback(
    (color: string, checked: boolean) => {
      const next = checked
        ? [...(currentFilters.colors || []), color.toLowerCase()]
        : (currentFilters.colors || []).filter((c) => c !== color.toLowerCase());
      handleFilterChange({ colors: next });
    },
    [currentFilters, handleFilterChange],
  );

  const handleFabricChange = useCallback(
    (fabric: string, checked: boolean) => {
      const next = checked
        ? [...(currentFilters.fabrics || []), fabric.toLowerCase()]
        : (currentFilters.fabrics || []).filter((c) => c !== fabric.toLowerCase());
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
    const cleared: ProductFilters = {
      ...initialFilters,
      subcategories: [],
      colors: [],
      fabrics: [],
      search: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      sort: undefined,
      featured: undefined,
      onSale: undefined,
      offset: 0,
    };
    setCurrentFilters(cleared);
    updateURL(cleared);
  }, [updateURL, initialFilters]);

  // ── Load More ──────────────────────────────────────────────────────────────
  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const params = new URLSearchParams();
      params.set("categories", categoryName);
      if (currentFilters.subcategories?.length) params.set("subcategories", currentFilters.subcategories.join(","));
      if (currentFilters.colors?.length) params.set("colors", currentFilters.colors.join(","));
      if (currentFilters.fabrics?.length) params.set("fabrics", currentFilters.fabrics.join(","));
      if (currentFilters.minPrice) params.set("minPrice", String(currentFilters.minPrice));
      if (currentFilters.maxPrice) params.set("maxPrice", String(currentFilters.maxPrice));
      if (currentFilters.search) params.set("search", currentFilters.search);
      if (currentFilters.sort) params.set("sort", currentFilters.sort);
      if (currentFilters.featured) params.set("featured", "true");
      if (currentFilters.onSale) params.set("onSale", "true");
      params.set("distributionChannel", "online");
      params.set("limit", String(PAGE_SIZE));
      params.set("offset", String(offset));

      const res = await fetch(`/api/products?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
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
  }, [isLoadingMore, currentFilters, offset, categoryName]);

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
    ...(currentFilters.search
      ? [{ label: `"${currentFilters.search}"`, onRemove: () => handleFilterChange({ search: undefined }) }]
      : []),
    ...(currentFilters.subcategories || []).map((s) => ({ label: s, onRemove: () => handleSubcategoryChange(s, false) })),
    ...(currentFilters.colors || []).map((c) => ({ label: c, onRemove: () => handleColorChange(c, false) })),
    ...(currentFilters.fabrics || []).map((f) => ({ label: f, onRemove: () => handleFabricChange(f, false) })),
    ...(currentFilters.minPrice || currentFilters.maxPrice
      ? [{ label: `₹${currentFilters.minPrice ?? 100} – ₹${currentFilters.maxPrice ?? 50000}`, onRemove: () => handleFilterChange({ minPrice: undefined, maxPrice: undefined }) }]
      : []),
    ...(currentFilters.featured ? [{ label: "Featured", onRemove: () => handleToggleFilter("featured", false) }] : []),
    ...(currentFilters.onSale ? [{ label: "On Sale", onRemove: () => handleToggleFilter("onSale", false) }] : []),
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters Sidebar - Desktop */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <div className="sticky space-y-6 overflow-y-auto" style={{ top: "calc(var(--banner-height, 0px) + var(--header-height, 74px) + 1.5rem)", maxHeight: "calc(100vh - var(--banner-height, 0px) - var(--header-height, 74px) - 3rem)" }}>
            <h1 className="text-xl font-light text-gray-900 uppercase tracking-[0.1em]">
              {currentCategory?.name || categoryName.charAt(0).toUpperCase() + categoryName.slice(1)}
            </h1>
            <div className="bg-white rounded-lg shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Filters</h3>
                <Button
                  variant="link"
                  onClick={handleClearAllFilters}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Clear All
                </Button>
              </div>
              <CategoryFilterSections
                categoryName={categoryName}
                currentCategory={currentCategory}
                currentSubcategories={currentSubcategories}
                colors={colors}
                fabrics={fabrics}
                currentFilters={currentFilters}
                onSubcategoryChange={handleSubcategoryChange}
                onColorChange={handleColorChange}
                onFabricChange={handleFabricChange}
                onToggleFilter={handleToggleFilter}
                onPriceRangeChange={handlePriceRangeChange}
              />
            </div>
          </div>
        </aside>

        <div className="flex-1">
          <h1 className="lg:hidden text-xl font-light text-gray-900 uppercase tracking-[0.1em]">
            {currentCategory?.name || categoryName.charAt(0).toUpperCase() + categoryName.slice(1)}
          </h1>

          {/* Sort + Mobile Filter */}
          <div className="flex justify-end items-center gap-2">
            <Select onValueChange={handleSortChange} defaultValue="newest">
              <SelectTrigger className="w-[120px] h-8 text-xs sm:w-[180px] sm:h-10 sm:text-sm">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest" className="text-xs sm:text-sm">Newest First</SelectItem>
                <SelectItem value="price-low" className="text-xs sm:text-sm">Price: Low to High</SelectItem>
                <SelectItem value="price-high" className="text-xs sm:text-sm">Price: High to Low</SelectItem>
                <SelectItem value="name" className="text-xs sm:text-sm">Name: A to Z</SelectItem>
              </SelectContent>
            </Select>

            {/* Mobile-only filter panel — hidden on sm+ so it never renders on desktop */}
            <div className="sm:hidden">
              <Button variant="outline" className="h-8 px-2 border border-gray-300 rounded-lg" onClick={() => setShowFilters(true)}>
                <FilterIcon className="h-4 w-4" />
              </Button>
              <StickyPanel
                isMobile
                isOpen={showFilters}
                onClose={() => setShowFilters(false)}
                title="Filters"
                footer={
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 h-10 text-sm font-medium"
                      onClick={handleClearAllFilters}
                    >
                      Clear All
                    </Button>
                    <Button
                      className="flex-1 h-10 text-sm font-medium"
                      onClick={() => setShowFilters(false)}
                    >
                      Apply Filters
                    </Button>
                  </div>
                }
              >
                <CategoryFilterSections
                  categoryName={categoryName}
                  currentCategory={currentCategory}
                  currentSubcategories={currentSubcategories}
                  colors={colors}
                  fabrics={fabrics}
                  currentFilters={currentFilters}
                  onSubcategoryChange={handleSubcategoryChange}
                  onColorChange={handleColorChange}
                  onFabricChange={handleFabricChange}
                  onToggleFilter={handleToggleFilter}
                  onPriceRangeChange={handlePriceRangeChange}
                />
              </StickyPanel>
            </div>
          </div>

          {/* Active Filter Badges - Mobile only */}
          <ActiveFilterBadges filters={activeBadges} onClearAll={handleClearAllFilters} />

          {/* Search term badge — visible on desktop only (mobile uses ActiveFilterBadges) */}
          {currentFilters.search && (
            <div className="hidden lg:flex items-center gap-2 mt-2">
              <span className="text-sm text-gray-500">Results for</span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-900 text-white text-xs font-medium">
                {currentFilters.search}
                <button
                  onClick={() => handleFilterChange({ search: undefined })}
                  className="ml-0.5 hover:text-gray-300 transition-colors"
                  aria-label="Clear search"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            </div>
          )}

          {/* Sale context banner — shown when user arrives via an offer link */}
          {/* {currentFilters.onSale && (
            <div className="mt-4 mb-2 px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2 bg-red-50 border border-red-200 text-red-800">
              <span className="text-base">🎉</span>
              <span>
                Showing sale items in{" "}
                <span className="font-semibold">
                  {currentCategory?.name || categoryName.charAt(0).toUpperCase() + categoryName.slice(1)}
                </span>
                . Prices already reflect the discount.
              </span>
              <button
                onClick={() => handleToggleFilter("onSale", false)}
                className="ml-auto text-red-600 hover:text-red-800 underline text-xs whitespace-nowrap"
              >
                Show all
              </button>
            </div>
          )} */}

          {/* Products */}
          {displayedProducts.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-600">Try adjusting your filters or search terms</p>
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
