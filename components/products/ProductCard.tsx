"use client";

import { ProductWithDetails } from "@/shared";
import { Eye, Heart, ImageIcon } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";
import { getProductUrl } from "@/lib/utils/productUrl";

interface ProductCardProps {
  product:
    | ProductWithDetails
    | (ProductWithDetails & {
        category?: { name: string } | null;
        color?: { name: string } | null;
        fabric?: { name: string } | null;
        urlSlug?: string | null;
      });
  showNewBadge?: boolean;
  showFeaturedBadge?: boolean;
  onQuickView?: (product: ProductWithDetails) => void; // for quick view click
  onWishlistToggle?: (product: ProductWithDetails) => void; // for wishlist toggle
  isWishlisted?: boolean; // wishlist state
  disabled?: boolean; // disable interactions
  className?: string; // additional CSS classes
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
}: ProductCardProps) {
  const router = useRouter();

  const isNewProduct = (createdAt: Date) => {
    const createdDate = new Date(createdAt);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return createdDate >= thirtyDaysAgo;
  };

  const handleProductClick = () => {
    const url = getProductUrl(product);
    router.push(url);
  };

  return (
    <div className={`flex flex-col gap-1 md:gap-2 ${className}`}>
      <div
        className={`relative aspect-[3/4] overflow-hidden bg-stone-100 rounded-sm ${
          disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer group"
        }`}
        onClick={!disabled ? handleProductClick : undefined}
      >
        {(product?.images?.length ?? 0) > 0 ? (
          <Image
            src={product.images?.[0] ?? ""}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-[1.5s] group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-16 h-16 text-purple-400" />
          </div>
        )}

        {onQuickView && !disabled && (
          <div className="absolute inset-x-0 bottom-6 px-6 hidden lg:flex justify-center translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
            <div
              className="w-full py-4 bg-white/90 backdrop-blur-md text-stone-900 text-[9px] font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-stone-900 hover:text-white transition-colors shadow-xl min-h-[44px] touch-manipulation active:scale-95 cursor-pointer"
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
        {showNewBadge && isNewProduct(product.createdAt) && (
          <span className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
            New
          </span>
        )}
        {showFeaturedBadge && product.isFeatured && (
          <span className="absolute top-4 right-4 bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
            Featured
          </span>
        )}
      </div>

      {/* Product Info */}
      <div className="space-y-0.5 md:space-y-1">
        <div className="flex justify-between items-start">
          <div className="flex-1 pr-4">
            {(product as any).fabric && (
              <p className="text-[8px] md:text-[9px] font-bold uppercase tracking-[0.2em] text-amber-800 mb-0.5 font-sans">
                {(product as any).fabric.name}
              </p>
            )}
            <h4
              className="text-xs md:text-sm font-light tracking-wide line-clamp-1 cursor-pointer hover:text-amber-800 transition-colors min-h-[44px] flex items-center touch-manipulation active:scale-95"
              onClick={handleProductClick}
            >
              {product.name}
            </h4>
          </div>
          <Button
            className={`transition-colors p-2 min-h-[44px] min-w-[44px] touch-manipulation active:scale-95 ${
              isWishlisted
                ? "text-red-500 hover:text-red-700"
                : "text-stone-500 hover:text-red-700"
            } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              if (!disabled) {
                onWishlistToggle?.(product);
              }
            }}
            variant={"link"}
            disabled={disabled}
          >
            <Heart
              size={16}
              strokeWidth={1.2}
              fill={isWishlisted ? "currentColor" : "none"}
            />
          </Button>
        </div>
        <p className="text-xs md:text-sm font-bold font-sans tracking-tight">
          ₹{product.price}
        </p>
      </div>
    </div>
  );
}
