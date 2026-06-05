"use client";

import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { useCallback, useEffect, useRef, useState } from "react";
import { ProductWithDetails } from "@/shared";
import ProductCard from "./ProductCard";
import { Loader2 } from "lucide-react";

interface VirtualizedProductGridProps {
  products: ProductWithDetails[];
  hasMore: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
  onQuickView?: (product: ProductWithDetails) => void;
  onWishlistToggle?: (product: ProductWithDetails) => void;
  isWishlisted?: (productId: string) => boolean;
  /** Number of rows to render beyond the visible area */
  overscan?: number;
}

/**
 * Determines the number of columns based on container width.
 * Mirrors the Tailwind grid: grid-cols-2 sm:grid-cols-3 lg:grid-cols-4
 */
function getColumns(containerWidth: number): number {
  if (containerWidth >= 1024) return 4; // lg
  if (containerWidth >= 640) return 3; // sm
  return 2; // default
}

const GAP = 16;

export default function VirtualizedProductGrid({
  products,
  hasMore,
  isLoadingMore,
  onLoadMore,
  onQuickView,
  onWishlistToggle,
  isWishlisted,
  overscan = 5,
}: VirtualizedProductGridProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = useState(2);

  // Responsive column count
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;

    const updateColumns = () => {
      setColumns(getColumns(el.offsetWidth));
    };

    updateColumns();

    const observer = new ResizeObserver(updateColumns);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const rowCount = Math.ceil(products.length / columns);

  // Estimate row height based on card dimensions
  const estimateSize = useCallback(
    () => {
      const containerWidth = listRef.current?.offsetWidth ?? 800;
      const cardWidth = (containerWidth - GAP * (columns - 1)) / columns;
      const imageHeight = (cardWidth * 4) / 3; // aspect-[3/4]
      const textHeight = 80; // name + price + fabric info
      return imageHeight + textHeight + GAP;
    },
    [columns],
  );

  // Track scrollMargin dynamically so it updates when banner appears/disappears
  const [scrollMargin, setScrollMargin] = useState(0);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;

    const updateScrollMargin = () => {
      setScrollMargin(el.offsetTop);
    };

    updateScrollMargin();

    // Use MutationObserver on document to detect layout shifts (banner show/hide)
    const observer = new MutationObserver(updateScrollMargin);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style'],
    });

    // Also update on resize
    window.addEventListener('resize', updateScrollMargin);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateScrollMargin);
    };
  }, []);

  const virtualizer = useWindowVirtualizer({
    count: rowCount,
    estimateSize,
    overscan,
    scrollMargin,
  });

  // Infinite scroll: observe sentinel near the bottom
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && hasMore && !isLoadingMore) {
          onLoadMore();
        }
      },
      { rootMargin: "600px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, onLoadMore]);

  const virtualRows = virtualizer.getVirtualItems();

  return (
    <div ref={listRef} className="w-full pt-6">
      <div
        className="relative w-full"
        style={{ height: `${virtualizer.getTotalSize()}px` }}
      >
        {virtualRows.map((virtualRow) => {
          const startIndex = virtualRow.index * columns;
          const rowProducts = products.slice(startIndex, startIndex + columns);

          return (
            <div
              key={virtualRow.key}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              className="absolute left-0 w-full"
              style={{
                top: `${virtualRow.start - virtualizer.options.scrollMargin}px`,
              }}
            >
              <div
                className="grid gap-4"
                style={{
                  gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                }}
              >
                {rowProducts.map((product, colIndex) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    showNewBadge={true}
                    showFeaturedBadge={true}
                    onQuickView={onQuickView}
                    onWishlistToggle={onWishlistToggle}
                    isWishlisted={isWishlisted?.(product.id) ?? false}
                    priority={virtualRow.index === 0 && colIndex < 4}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Sentinel for infinite scroll trigger */}
      <div ref={sentinelRef} className="h-1" />

      {/* Loading indicator */}
      {isLoadingMore && (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          <span className="ml-2 text-sm text-gray-500">Loading more products...</span>
        </div>
      )}

      {/* End of results */}
      {!hasMore && products.length > 0 && (
        <p className="text-center text-sm text-gray-400 py-6">
          You&apos;ve seen all {products.length} products
        </p>
      )}
    </div>
  );
}
