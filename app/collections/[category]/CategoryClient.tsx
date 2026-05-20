"use client";

import { ProductFilters } from "@/app/api/products/productService";
import ProductCard from "@/components/products/ProductCard";
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
import CategoryFilterSections from "@/components/filters/CategoryFilterSections";
import ActiveFilterBadges from "@/components/filters/ActiveFilterBadges";
import { CategoryWithSubcategories, ProductWithDetails } from "@/shared";
import { FilterIcon, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState, useEffect } from "react";
import { useWishlistStore } from "@/lib/stores/wishlistStore";
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

  const { categories, colors, fabrics } = useFilterStore();
  const { fetchWishlist, addToWishlist, removeFromWishlist, isInWishlist } = useWishlistStore();

  useEffect(() => { fetchWishlist(); }, []);

  useEffect(() => {
    if (!socket) return;
    const handleProductEvent = () => router.refresh();
    socket.on("product_event", handleProductEvent);
    return () => { socket.off("product_event", handleProductEvent); };
  }, [socket, router]);

  // ── State ──────────────────────────────────────────────────────────────────
  const [showFilters, setShowFilters] = useState(false);
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
  }, [initialProducts, initialCount]);

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
          <div className="sticky space-y-6" style={{ top: "calc(var(--banner-height, 0px) + var(--header-height, 74px) + 1.5rem)" }}>
            <h1 className="text-xl font-light text-gray-900 uppercase tracking-[0.1em]">
              {currentCategory?.name || categoryName.charAt(0).toUpperCase() + categoryName.slice(1)}
            </h1>
            <div className="bg-white rounded-lg shadow-sm p-6">
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
          <div className="flex justify-end items-center gap-4">
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

            {/* Mobile-only filter drawer — hidden on sm+ so it never renders on desktop */}
            <div className="sm:hidden">
              <Drawer open={showFilters} onOpenChange={setShowFilters}>
                <DrawerTrigger asChild>
                  <Button variant="outline" className="h-8 px-2 border border-gray-300 rounded-lg">
                    <FilterIcon className="h-4 w-4" />
                  </Button>
                </DrawerTrigger>
                <DrawerContent className="h-[85vh] flex flex-col overflow-hidden">
                  {/* Drag handle */}
                  <div className="mx-auto mt-3 mb-1 h-1.5 w-12 rounded-full bg-gray-300 flex-shrink-0" />
                  {/* Sticky header */}
                  <DrawerHeader className="flex-shrink-0 border-b border-gray-100 px-5 py-4">
                    <div className="flex items-center justify-between">
                      <DrawerTitle className="text-left text-base font-semibold">Filters</DrawerTitle>
                      <Button
                        variant="link"
                        onClick={handleClearAllFilters}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium p-0 h-auto"
                      >
                        Clear All
                      </Button>
                    </div>
                  </DrawerHeader>
                  {/* Scrollable content */}
                  <div className="flex-1 min-h-0 overflow-y-auto px-5 py-5">
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
                  {/* Sticky footer */}
                  <div className="flex-shrink-0 px-5 py-4 border-t border-gray-100 bg-white">
                    <Button className="w-full h-11 text-sm font-medium" onClick={() => setShowFilters(false)}>
                      Apply Filters
                    </Button>
                  </div>
                </DrawerContent>
              </Drawer>
            </div>
          </div>

          {/* Active Filter Badges - Mobile only */}
          <ActiveFilterBadges filters={activeBadges} onClearAll={handleClearAllFilters} />

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
            <div className="grid gap-8 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 pt-6">
              {displayedProducts.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  showNewBadge={true}
                  showFeaturedBadge={true}
                  onQuickView={handleQuickView}
                  onWishlistToggle={handleWishlistToggle}
                  isWishlisted={isInWishlist(product.id)}
                  priority={index < 4}
                />
              ))}
            </div>
          )}

          {/* Load More */}
          {hasMore && (
            <div className="mt-10 flex justify-center">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="min-w-[200px]"
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  `Load More (${totalCount - displayedProducts.length} remaining)`
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
