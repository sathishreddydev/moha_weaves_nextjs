"use client";

import { Button } from "@/components/ui/button";
import { useWishlistStore } from "@/lib/stores";
import { getProductUrl } from "@/lib/utils/productUrl";
import { getAvailableStock } from "@/lib/stock-utils";
import { Heart, ImageIcon, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSocketStore } from "@/lib/stores/socketStore";
import { ProductWithDetails } from "@/shared/types";
import Image from "next/image";
import { useRouter } from "next/navigation";

// ── Variant picker state per product ─────────────────────────────────────────
type VariantSelections = Record<string, string>; // productId → variantId

export default function WishlistPage() {
  const router = useRouter();
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
  const [variantSelections, setVariantSelections] = useState<VariantSelections>(
    {},
  );
  // Track which items are showing a "please select size" error
  const [variantErrors, setVariantErrors] = useState<Record<string, boolean>>(
    {},
  );

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  // Auto-select first active variant for items that have multiple variants
  useEffect(() => {
    if (items.length === 0) return;

    const newSelections: VariantSelections = { ...variantSelections };
    let changed = false;

    for (const item of items) {
      if (newSelections[item.productId]) continue;
      const variants = item.product.variants ?? [];
      const activeVariants = variants.filter(
        (v) => v.isActive && v.onlineStock > 0,
      );
      if (activeVariants.length > 1) {
        newSelections[item.productId] = activeVariants[0].id;
        changed = true;
      }
    }

    if (changed) {
      setVariantSelections(newSelections);
    }
  }, [items]); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-fetch when admin updates/deletes a product so prices and names stay fresh
  useEffect(() => {
    if (!socket) return;
    socket.on("product_event", fetchWishlist);
    return () => {
      socket.off("product_event", fetchWishlist);
    };
  }, [socket, fetchWishlist]);

  const handleAddToCart = async (
    productId: string,
    product: ProductWithDetails,
  ) => {
    const variants = product.variants ?? [];
    const activeVariants = variants.filter(
      (v) => v.isActive && v.onlineStock > 0,
    );

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
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-stone-900"></div>
          <p className="mt-3 text-sm text-stone-500">Loading wishlist...</p>
        </div>
      </div>
    );
  }

  return (
    <div >
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-xl font-light text-gray-900 uppercase tracking-[0.1em]">
          My Wishlist
        </h1>
        <Button variant="outline" size="sm" asChild>
          <Link href="/collections">Continue Shopping</Link>
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-6 text-sm">
          {error}
        </div>
      )}

      {items.length === 0 ? (
        <div className="text-center py-16">
          <Heart className="w-12 h-12 text-stone-300 mx-auto mb-4" />
          <p className="text-stone-500 mb-4">Your wishlist is empty</p>
          <Button asChild>
            <Link href="/collections">Start Shopping</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-4 lg:grid-cols-5">
          {items.map((item) => {
            const product = item.product;
            const variants = product.variants ?? [];
            const activeVariants = variants.filter(
              (v) => v.isActive && v.onlineStock > 0,
            );
            const needsVariantSelection = activeVariants.length > 1;
            const totalOnlineStock = getAvailableStock(
              {
                id: product.id,
                name: product.name,
                onlineStock: (product as any).onlineStock ?? 0,
                totalStock: (product as any).totalStock ?? 0,
                variants: product.variants,
              },
              null,
            );
            const isOutOfStock = totalOnlineStock <= 0;
            const hasDiscount =
              product.discountedPrice != null &&
              product.discountedPrice < Number(product.price);
            const hasSale = !!product.activeSale;
            const selectedVariantId = variantSelections[item.productId];
            const hasVariantError = variantErrors[item.productId];

            return (
              <div key={item.id} className="flex flex-col gap-1 md:gap-2">
                {/* Image container — same as ProductCard */}
                <div
                  className={`relative aspect-[3/4] overflow-hidden bg-stone-100 rounded-sm ${
                    isOutOfStock
                      ? "cursor-not-allowed"
                      : "cursor-pointer group"
                  }`}
                  onClick={() => {
                    if (!isOutOfStock) router.push(getProductUrl(product));
                  }}
                >
                  {(product?.images?.length ?? 0) > 0 ? (
                    <Image
                      src={product.images?.[0] ?? ""}
                      alt={
                        product.name
                          ? `${product.name}${product.fabric ? ` – ${product.fabric.name}` : ""}${product.color ? ` in ${product.color.name}` : ""}`
                          : "Product image"
                      }
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      className={`object-cover transition-transform duration-[1.5s] ${
                        isOutOfStock
                          ? "opacity-60 grayscale"
                          : "group-hover:scale-110"
                      }`}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-16 h-16 text-purple-400" />
                    </div>
                  )}

                  {/* Out of stock overlay */}
                  {isOutOfStock && (
                    <div className="absolute inset-0 flex items-end justify-center pb-4">
                      <span className="bg-black/70 text-white text-[10px] font-bold uppercase tracking-[0.2em] px-4 py-2">
                        Out of Stock
                      </span>
                    </div>
                  )}

                  {/* Badges */}
                  <div className="absolute top-4 right-4 flex flex-col gap-2">
                    {hasSale && !isOutOfStock && (
                      <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                        Sale
                      </span>
                    )}
                  </div>

                  {/* Size selector + Add to Cart — overlaid on image bottom */}
                  {!isOutOfStock && (
                    <div
                      className="absolute inset-x-0 bottom-0 px-3 pb-3 pt-8 bg-gradient-to-t from-black/60 to-transparent translate-y-0 opacity-100 lg:translate-y-full lg:opacity-0 lg:group-hover:translate-y-0 lg:group-hover:opacity-100 transition-all duration-300"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Size pills */}
                      {needsVariantSelection && (
                        <div className="mb-2">
                          <div className="flex flex-wrap gap-1.5 justify-center">
                            {activeVariants.map((v) => (
                              <button
                                key={v.id}
                                type="button"
                                onClick={() =>
                                  handleVariantSelect(item.productId, v.id)
                                }
                                className={[
                                  "px-2.5 py-1 rounded border text-[11px] font-medium transition-colors",
                                  selectedVariantId === v.id
                                    ? "border-white bg-white text-stone-900"
                                    : "border-white/60 bg-transparent text-white hover:bg-white/20",
                                ].join(" ")}
                              >
                                {v.size}
                              </button>
                            ))}
                          </div>
                          {hasVariantError && (
                            <p className="text-[10px] text-red-300 mt-1 text-center">
                              Please select a size
                            </p>
                          )}
                        </div>
                      )}

                      {/* Add to Cart button */}
                      <button
                        onClick={() =>
                          handleAddToCart(item.productId, item.product)
                        }
                        disabled={updating === item.productId}
                        className="w-full py-2.5 bg-white hover:bg-stone-100 text-stone-900 text-[11px] font-bold uppercase tracking-[0.15em] rounded-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        {updating === item.productId ? "Adding..." : "Add to Cart"}
                      </button>
                    </div>
                  )}
                </div>

                {/* Product info — same structure as ProductCard */}
                <div className="space-y-0.5 md:space-y-1">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 pr-4">
                      {product.fabric && (
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-800 mb-0.5 font-sans">
                          {product.fabric.name}
                        </p>
                      )}
                      <h4
                        className={`text-sm font-light tracking-wide line-clamp-1 transition-colors ${
                          isOutOfStock
                            ? "text-stone-400 cursor-not-allowed"
                            : "cursor-pointer hover:text-amber-800"
                        }`}
                        onClick={() => {
                          if (!isOutOfStock) router.push(getProductUrl(product));
                        }}
                      >
                        {product.name}
                      </h4>
                    </div>

                    {/* Wishlist heart — same position as ProductCard */}
                    <button
                      onClick={() => removeFromWishlist(item.productId)}
                      disabled={updating === item.productId}
                      className="text-red-500 hover:text-red-700 transition-colors flex-shrink-0 disabled:opacity-50"
                      aria-label="Remove from wishlist"
                    >
                      <Heart
                        className="w-6 h-6 lg:w-5 lg:h-5"
                        fill="currentColor"
                      />
                    </button>
                  </div>

                  {/* Price */}
                  <div className="flex items-center gap-2">
                    {isOutOfStock ? (
                      <p className="text-sm text-stone-400 font-sans">
                        Unavailable
                      </p>
                    ) : hasDiscount ? (
                      <>
                        <p className="text-sm font-bold font-sans tracking-tight text-red-600">
                          ₹{product.discountedPrice}
                        </p>
                        <p className="text-xs text-gray-500 line-through">
                          ₹{product.price}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm font-bold font-sans tracking-tight">
                        ₹{product.price}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
