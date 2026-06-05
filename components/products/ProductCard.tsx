"use client";

import { ProductWithDetails } from "@/shared";
import { Eye, Heart, ImageIcon } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { getProductUrl } from "@/lib/utils/productUrl";
import { isNewProduct, getAvailableStock } from "@/lib/stock-utils";

interface ProductCardProps {
  product: ProductWithDetails;
  showNewBadge?: boolean;
  showFeaturedBadge?: boolean;
  onQuickView?: (product: ProductWithDetails) => void;
  onWishlistToggle?: (product: ProductWithDetails) => void;
  isWishlisted?: boolean;
  disabled?: boolean;
  className?: string;
  /** Pass true for above-the-fold cards to improve LCP */
  priority?: boolean;
}

export default function ProductCard({
  product,
  showNewBadge = true,
  showFeaturedBadge = true,
  onQuickView,
  onWishlistToggle,
  isWishlisted = false,
  disabled = false,
  className = "",
  priority = false,
}: ProductCardProps) {
  const router = useRouter();

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
  const outOfStock = totalOnlineStock <= 0;

  const handleProductClick = () => {
    if (disabled || outOfStock) return;
    router.push(getProductUrl(product));
  };

  const isNew = showNewBadge && isNewProduct(product.createdAt);
  const isFeatured = showFeaturedBadge && product.isFeatured;
  const hasSale = !!product.activeSale;
  const hasDiscount =
    product.discountedPrice != null &&
    product.discountedPrice < Number(product.price);

  return (
    <div className={`flex flex-col gap-1 md:gap-2 ${className}`}>
      {/* Image container */}
      <div
        className={`relative aspect-[3/4] overflow-hidden bg-stone-100 ${
          outOfStock
            ? "cursor-not-allowed"
            : disabled
              ? "cursor-not-allowed opacity-50"
              : "cursor-pointer group"
        }`}
        onClick={handleProductClick}
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
            className={`object-cover transition-transform duration-[1.5s] ${outOfStock ? "opacity-60 grayscale" : "group-hover:scale-110"}`}
            priority={priority}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-16 h-16 text-purple-400" />
          </div>
        )}

        {/* Out of stock overlay */}
        {outOfStock && (
          <div className="absolute inset-0 flex items-end justify-center pb-4">
            <span className="bg-black/70 text-white text-[10px] font-bold uppercase tracking-[0.2em] px-4 py-2">
              Out of Stock
            </span>
          </div>
        )}

        {/* Quick Look — desktop only, only when in stock */}
        {onQuickView && !disabled && !outOfStock && (
          <div className="absolute inset-x-0 bottom-6 px-6 hidden lg:flex justify-center translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
            <div
              className="w-full py-4 bg-white/90 backdrop-blur-md text-stone-900 text-[9px] font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-stone-900 hover:text-white transition-colors shadow-xl cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                onQuickView(product);
              }}
            >
              <Eye size={14} /> Quick Look
            </div>
          </div>
        )}

        {/* Badges */}
        {isNew && !outOfStock && (
          <span className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
            New
          </span>
        )}
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          {isFeatured && !outOfStock && (
            <span className="bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
              Featured
            </span>
          )}
          {hasSale && !outOfStock && (
            <span
              className="text-white px-3 py-1 rounded-full text-sm font-semibold"
              style={{ backgroundColor: product.activeSale?.bgColor || '#ef4444' }}
            >
              Sale
            </span>
          )}
        </div>
      </div>

      {/* Product info */}
      <div className="space-y-0.5 md:space-y-1">
        <div className="flex justify-between items-start">
          <div className="flex-1 pr-4">
            {product.fabric && (
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-800 mb-0.5 font-sans">
                {product.fabric.name}
              </p>
            )}
            {/* {product.color && (
              <p className="text-[10px] uppercase tracking-[0.15em] text-stone-500 mb-0.5 font-sans">
                {product.color.name}
              </p>
            )} */}
            <h4
              className={`text-sm font-light tracking-wide line-clamp-1 flex items-center transition-colors ${
                outOfStock
                  ? "text-stone-400 cursor-not-allowed"
                  : "cursor-pointer hover:text-amber-800"
              }`}
              onClick={handleProductClick}
            >
              {product.name}
            </h4>
          </div>

          {/* Wishlist button — always rendered; prompts action via callback */}
          <button
            aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
            className={`transition-colors flex-shrink-0 ${
              isWishlisted
                ? "text-red-500 hover:text-red-700"
                : "text-stone-500 hover:text-red-700"
            } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              if (!disabled) onWishlistToggle?.(product);
            }}
            disabled={disabled}
          >
            <Heart
              className="w-6 h-6 lg:w-5 lg:h-5"
              fill={isWishlisted ? "currentColor" : "none"}
            />
          </button>
        </div>

        {/* Price */}
        <div className="flex items-center gap-2">
          {outOfStock ? (
            <p className="text-sm text-stone-400 font-sans">Unavailable</p>
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
}
