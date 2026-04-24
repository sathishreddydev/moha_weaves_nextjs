"use client";

import { ProductFilters } from "@/app/api/products/productService";
import ProductCard from "@/components/products/ProductCard";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
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
import {
  CategoryWithSubcategories,
  Color,
  Fabric,
  ProductWithDetails,
} from "@/shared";
import { FilterIcon, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState, useEffect } from "react";
import { useWishlistStore } from "@/lib/stores/wishlistStore";
import { getProductUrl } from "@/lib/utils/productUrl";

interface CategoryClientProps {
  categoryName: string;
  initialProducts: ProductWithDetails[];
  initialCount: number;
  initialFilters: ProductFilters;
  initialSidebarFilters: {
    categories: CategoryWithSubcategories[];
    colors: Color[];
    fabrics: Fabric[];
  };
}

export default function CategoryClient({
  initialProducts,
  initialCount,
  initialFilters,
  categoryName,
  initialSidebarFilters,
}: CategoryClientProps) {
  const router = useRouter();

  // Wishlist store
  const {
    fetchWishlist,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    updating,
  } = useWishlistStore();

  const { categories, colors, fabrics } = initialSidebarFilters;

  // State management
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(
    Math.floor((initialFilters.offset || 0) / 20) + 1,
  );
  const [isApplyingFilters, setIsApplyingFilters] = useState(false);
  const [currentFilters, setCurrentFilters] =
    useState<ProductFilters>(initialFilters);

  const products = initialProducts || [];
  const productsCount = initialCount || 0;

  // Fetch wishlist on component mount
  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);
  // Get current category and its subcategories
  const getCurrentCategory =
    useCallback((): CategoryWithSubcategories | null => {
      return (
        categories.find(
          (cat) => cat.name.toLowerCase() === categoryName.toLowerCase(),
        ) || null
      );
    }, [categories, categoryName]);

  const currentCategory = getCurrentCategory();
  const currentSubcategories = currentCategory?.subcategories || [];

  // Note: We no longer need to initialize filters from URL since they come from server props

  // Update URL without triggering fetch
  const updateURL = useCallback(
    (filters: ProductFilters) => {
      const params = new URLSearchParams();
      // Don't include categories in URL since we're already on the category route
      if (filters.subcategories?.length) {
        params.set("subcategories", filters.subcategories.join(","));
      }
      if (filters.colors?.length) {
        params.set("colors", filters.colors.join(","));
      }
      if (filters.fabrics?.length) {
        params.set("fabrics", filters.fabrics.join(","));
      }
      if (filters.minPrice || filters.maxPrice) {
        params.set(
          "price",
          `${filters.minPrice || 100}-${filters.maxPrice || 50000}`,
        );
      }
      if (filters.search) {
        params.set("search", filters.search);
      }
      if (filters.sort && filters.sort !== "newest") {
        params.set("sort", filters.sort);
      }
      if (filters.featured) {
        params.set("featured", "true");
      }
      if (filters.onSale) {
        params.set("onSale", "true");
      }

      const queryString = params.toString();
      const newUrl = queryString
        ? `/collections/${categoryName}?${queryString}`
        : `/collections/${categoryName}`;
      router.push(newUrl, { scroll: false });
    },
    [router, categoryName],
  );

  // Handle filter changes
  const handleFilterChange = useCallback(
    (newFilters: Partial<ProductFilters>) => {
      setIsApplyingFilters(true);
      const updatedFilters = {
        ...currentFilters,
        ...newFilters,
        offset: 0, // Reset to first page when filters change
      };
      
            
      setCurrentFilters(updatedFilters);
      setCurrentPage(1); // Reset page state
      updateURL(updatedFilters);

      // Remove loading state after a short delay for UX
      setTimeout(() => setIsApplyingFilters(false), 500);
    },
    [currentFilters, updateURL],
  );

  // Handle sort change
  const handleSortChange = useCallback(
    (sort: string) => {
      handleFilterChange({ sort });
    },
    [handleFilterChange],
  );

  // Handle quick view
  const handleQuickView = useCallback(
    (product: ProductWithDetails) => {
      router.push(getProductUrl(product));
    },
    [router],
  );

  // Handle color filter
  const handleColorChange = useCallback(
    (color: string, checked: boolean) => {
      const currentColors = currentFilters.colors || [];
      const newColors = checked
        ? [...currentColors, color.toLowerCase()]
        : currentColors.filter((c: string) => c !== color.toLowerCase());
      handleFilterChange({ colors: newColors });
    },
    [currentFilters, handleFilterChange],
  );

  // Handle fabric filter
  const handleFabricChange = useCallback(
    (fabric: string, checked: boolean) => {
      const currentFabrics = currentFilters.fabrics || [];
      const newFabrics = checked
        ? [...currentFabrics, fabric.toLowerCase()]
        : currentFabrics.filter((c: string) => c !== fabric.toLowerCase());
      handleFilterChange({ fabrics: newFabrics });
    },
    [currentFilters, handleFilterChange],
  );

  // Handle subcategory filter
  const handleSubcategoryChange = useCallback(
    (subcategory: string, checked: boolean) => {
      const currentSubcategories = currentFilters.subcategories || [];
      const newSubcategories = checked
        ? [...currentSubcategories, subcategory.toLowerCase()]
        : currentSubcategories.filter(
            (c: string) => c !== subcategory.toLowerCase(),
          );
      handleFilterChange({ subcategories: newSubcategories });
    },
    [currentFilters, handleFilterChange],
  );

  // Handle toggle filters
  const handleToggleFilter = useCallback(
    (filterType: "featured" | "onSale", checked: boolean) => {
      handleFilterChange({ [filterType]: checked });
    },
    [handleFilterChange],
  );

  // Handle price range filter
  const handlePriceRangeChange = useCallback(
    (priceRange: [number, number]) => {
      handleFilterChange({ 
        minPrice: priceRange[0] === 100 ? undefined : priceRange[0],
        maxPrice: priceRange[1] === 50000 ? undefined : priceRange[1]
      });
    },
    [handleFilterChange],
  );

  // Handle clear all filters
  const handleClearAllFilters = useCallback(() => {
    setIsApplyingFilters(true);
    const clearedFilters: ProductFilters = {
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
    setCurrentFilters(clearedFilters);
    setCurrentPage(1); // Reset page
    updateURL(clearedFilters);
    setTimeout(() => setIsApplyingFilters(false), 500);
  }, [updateURL, initialFilters]);

  // Handle pagination
  const handlePageChange = useCallback(
    (page: number) => {
      setIsApplyingFilters(true);
      setCurrentPage(page);
      const updatedFilters = {
        ...currentFilters,
        offset: (page - 1) * 20,
      };
      setCurrentFilters(updatedFilters);
      updateURL(updatedFilters);
      setTimeout(() => setIsApplyingFilters(false), 500);
    },
    [currentFilters, updateURL],
  );

  // Handle wishlist toggle
  const handleWishlistToggle = useCallback(
    async (product: ProductWithDetails) => {
      if (isInWishlist(product.id)) {
        await removeFromWishlist(product.id);
      } else {
        await addToWishlist(product.id);
      }
    },
    [isInWishlist, removeFromWishlist, addToWishlist],
  );

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters Sidebar - Desktop */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <div className="sticky top-24 space-y-6">
            <h1 className="text-xl font-light text-gray-900 uppercase tracking-[0.1em]">
              {currentCategory?.name ||
                categoryName.charAt(0).toUpperCase() + categoryName.slice(1)}
            </h1>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Filters</h3>
                <Button
                  variant={"link"}
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
            {currentCategory?.name ||
              categoryName.charAt(0).toUpperCase() + categoryName.slice(1)}
          </h1>
          <div className="flex justify-end items-center gap-4">
            <Select onValueChange={handleSortChange} defaultValue="newest">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="name">Name: A to Z</SelectItem>
              </SelectContent>
            </Select>
            {/* Mobile Filter Toggle */}
            <Drawer open={showFilters} onOpenChange={setShowFilters}>
              <DrawerTrigger asChild>
                <Button
                  variant="link"
                  className="sm:hidden p-2 border border-gray-300 rounded-lg"
                >
                  <FilterIcon className="h-4 w-4" />
                </Button>
              </DrawerTrigger>
              <DrawerContent className="h-[85vh]">
                <DrawerHeader>
                  <div className="flex items-center justify-between">
                    <DrawerTitle className="text-left">Filters</DrawerTitle>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="link"
                        onClick={handleClearAllFilters}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Clear All
                      </Button>
                    </div>
                  </div>
                </DrawerHeader>
                <div className="px-6 pb-6 overflow-y-auto">
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
              </DrawerContent>
            </Drawer>
          </div>

          {products.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No products found
              </h3>
              <p className="text-gray-600">
                Try adjusting your filters or search terms
              </p>
            </div>
          ) : (
            <div className="grid gap-6 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 pt-6">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  showNewBadge={true}
                  showFeaturedBadge={true}
                  onQuickView={handleQuickView}
                  onWishlistToggle={handleWishlistToggle}
                  isWishlisted={isInWishlist(product.id)}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {productsCount > 20 && (
            <div className="mt-8 flex items-center justify-center">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1 || isApplyingFilters}
                >
                  Previous
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({
                    length: Math.min(5, Math.ceil(productsCount / 20)),
                  }).map((_, index) => {
                    const pageNumber = index + 1;
                    const isActive = pageNumber === currentPage;
                    return (
                      <Button
                        key={pageNumber}
                        variant={isActive ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(pageNumber)}
                        disabled={isApplyingFilters}
                      >
                        {pageNumber}
                      </Button>
                    );
                  })}

                  {Math.ceil(productsCount / 20) > 5 && (
                    <>
                      <span className="px-2 text-gray-500">...</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handlePageChange(Math.ceil(productsCount / 20))
                        }
                        disabled={isApplyingFilters}
                      >
                        {Math.ceil(productsCount / 20)}
                      </Button>
                    </>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={
                    currentPage >= Math.ceil(productsCount / 20) ||
                    isApplyingFilters
                  }
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
