"use client";

import { Button } from "@/components/ui/button";
import { useWishlistStore } from "@/lib/stores";
import { getProductUrl } from "@/lib/utils/productUrl";
import { X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSocketStore } from "@/lib/stores/socketStore";
import { ProductWithDetails } from "@/shared/types";

// ── Variant picker state per product ─────────────────────────────────────────
type VariantSelections = Record<string, string>; // productId → variantId

export default function WishlistPage() {
  const {
    items,
    loading,
    error,
    updating,
    fetchWishlist,
    removeFromWishlist,
    addToCartFromWishlist,
  } = useWishlistStore();

  const { socket } = useSocketStore();

  // Track selected variant per wishlist item
  const [variantSelections, setVariantSelections] = useState<VariantSelections>({});
  // Track which items are showing a "please select size" error
  const [variantErrors, setVariantErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  // Re-fetch when admin updates/deletes a product so prices and names stay fresh
  useEffect(() => {
    if (!socket) return;
    socket.on("product_event", fetchWishlist);
    return () => {
      socket.off("product_event", fetchWishlist);
    };
  }, [socket, fetchWishlist]);

  const getProductPrice = (product: ProductWithDetails) => {
    if (product.discountedPrice != null && product.discountedPrice < Number(product.price)) {
      return {
        original: parseFloat(product.price),
        discounted: product.discountedPrice,
        hasDiscount: true,
      };
    }
    return {
      original: parseFloat(product.price),
      discounted: null,
      hasDiscount: false,
    };
  };

  const handleAddToCart = async (productId: string, product: ProductWithDetails) => {
    const variants = product.variants ?? [];
    const activeVariants = variants.filter((v) => v.isActive && v.onlineStock > 0);

    // No variants at all — add directly
    if (variants.length === 0) {
      await addToCartFromWishlist(productId, null);
      return;
    }

    // Only one active variant — auto-select it
    if (activeVariants.length === 1) {
      await addToCartFromWishlist(productId, activeVariants[0].id);
      return;
    }

    // Multiple variants — require explicit selection
    const selectedVariantId = variantSelections[productId];
    if (!selectedVariantId) {
      setVariantErrors((prev) => ({ ...prev, [productId]: true }));
      return;
    }

    setVariantErrors((prev) => ({ ...prev, [productId]: false }));
    await addToCartFromWishlist(productId, selectedVariantId);
  };

  const handleVariantSelect = (productId: string, variantId: string) => {
    setVariantSelections((prev) => ({ ...prev, [productId]: variantId }));
    setVariantErrors((prev) => ({ ...prev, [productId]: false }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="mt-2 text-gray-600">Loading wishlist...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Wishlist</h1>
          <Button variant="outline" asChild>
            <Link href="/collections">Continue Shopping</Link>
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {items.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">Your wishlist is empty</div>
            <Button asChild>
              <Link href="/collections">Start Shopping</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((item) => {
              const price = getProductPrice(item.product);
              const firstImage = item.product.images?.[0];
              const variants = item.product.variants ?? [];
              const activeVariants = variants.filter((v) => v.isActive && v.onlineStock > 0);
              const needsVariantSelection = activeVariants.length > 1;
              const isOutOfStock = activeVariants.length === 0 && variants.length > 0;
              const selectedVariantId = variantSelections[item.productId];
              const hasVariantError = variantErrors[item.productId];

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="relative">
                    {firstImage ? (
                      <img
                        src={firstImage}
                        alt={item.product.name}
                        className="w-full h-48 object-cover"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-500">No image</span>
                      </div>
                    )}

                    {price.hasDiscount && (
                      <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-sm font-medium">
                        Sale
                      </div>
                    )}

                    {isOutOfStock && (
                      <div className="absolute inset-0 bg-black/40 flex items-end justify-center pb-3">
                        <span className="bg-black/70 text-white text-xs font-bold uppercase tracking-widest px-3 py-1">
                          Out of Stock
                        </span>
                      </div>
                    )}

                    <button
                      onClick={() => removeFromWishlist(item.productId)}
                      disabled={updating === item.productId}
                      className="absolute top-2 right-2 bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-600 hover:text-red-600 p-2 rounded-full shadow-md transition-all disabled:opacity-50"
                      aria-label="Remove from wishlist"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="p-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-2 line-clamp-2">
                      <Link
                        href={getProductUrl(item.product)}
                        className="hover:text-primary-600 transition-colors"
                      >
                        {item.product.name}
                      </Link>
                    </h3>

                    {item.product.category && (
                      <p className="text-sm text-gray-500 mb-2">
                        {item.product.category.name}
                      </p>
                    )}

                    {item.product.color && (
                      <p className="text-sm text-gray-500 mb-2">
                        Color: {item.product.color.name}
                      </p>
                    )}

                    <div className="flex items-center justify-between mb-3">
                      <div>
                        {price.hasDiscount ? (
                          <div className="flex items-center space-x-2">
                            <span className="text-lg font-bold text-red-600">
                              ₹{price.discounted?.toFixed(2)}
                            </span>
                            <span className="text-sm text-gray-500 line-through">
                              ₹{price.original.toFixed(2)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-lg font-bold text-gray-900">
                            ₹{price.original.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Size selector — only shown when multiple active variants exist */}
                    {needsVariantSelection && (
                      <div className="mb-3">
                        <p className="text-xs text-gray-500 mb-1.5">Select size:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {activeVariants.map((v) => (
                            <button
                              key={v.id}
                              type="button"
                              onClick={() => handleVariantSelect(item.productId, v.id)}
                              className={[
                                "px-2.5 py-1 rounded border text-xs font-medium transition-colors",
                                selectedVariantId === v.id
                                  ? "border-gray-900 bg-gray-900 text-white"
                                  : "border-gray-300 bg-white text-gray-700 hover:border-gray-500",
                              ].join(" ")}
                            >
                              {v.size}
                            </button>
                          ))}
                        </div>
                        {hasVariantError && (
                          <p className="text-xs text-red-500 mt-1">Please select a size</p>
                        )}
                      </div>
                    )}

                    <div className="flex space-x-2">
                      <Button
                        onClick={() => handleAddToCart(item.productId, item.product)}
                        disabled={updating === item.productId || isOutOfStock}
                        className="flex-1"
                        size="sm"
                      >
                        {updating === item.productId
                          ? "Adding..."
                          : isOutOfStock
                            ? "Out of Stock"
                            : "Add to Cart"}
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={getProductUrl(item.product)}>View</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
