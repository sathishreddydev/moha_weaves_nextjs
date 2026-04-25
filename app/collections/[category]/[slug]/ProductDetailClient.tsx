"use client";

import ProductCard from "@/components/products/ProductCard";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Heart,
  RefreshCw,
  Share2,
  Shield,
  ShoppingBag,
  Star,
  Truck,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { ProductWithDetails } from "@/shared";
import { useCartStore, useWishlistStore } from "@/lib/stores";
import CartControls from "@/components/ProductDetails/CartControls";
import ProductReviews from "@/components/ProductDetails/ProductReviews";
import DeliveryOptions from "@/components/ProductDetails/DeliveryOptions";
import Specifications from "@/components/ProductDetails/Specifications";
import SizeGuide from "@/components/ProductDetails/SizeGuide";
import Breadcrumbs from "@/components/Breadcrumbs";
import Link from "next/link";
import { getAvailableStock, getStockStatus } from "@/lib/stock-utils";

interface ProductDetailClientProps {
  product: ProductWithDetails & {
    rating?: number;
    reviewCount?: number;
    material?: string;
    careInstructions?: string;
    weight?: number;
    dimensions?: string;
  };
  relatedProducts: ProductWithDetails[];
  categoryName: string;
  reviewsData: any;
}

export default function ProductDetailClient({
  product,
  relatedProducts,
  categoryName,
  reviewsData,
}: ProductDetailClientProps) {
  const router = useRouter();
  const { error } = useCartStore();
  const {
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    updating: wishlistUpdating,
    error: wishlistError,
  } = useWishlistStore();

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 });
  const [selectedVariant, setSelectedVariant] = useState<any>(
    product.variants && product.variants.length > 0
      ? product.variants[0]
      : null,
  );
  const [quantity, setQuantity] = useState(1);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [showSizeGuide, setShowSizeGuide] = useState(false);

  // Check if product is in wishlist
  const isWishlisted = isInWishlist(product.id);

  const currentPrice = Number(product.discountedPrice || product.price);
  const originalPrice = Number(product.price);
  const hasDiscount =
    product.discountedPrice &&
    Number(product?.discountedPrice ?? 0) < Number(product.price);

  // Stock status - using common utilities
  const currentStock = getAvailableStock(product, selectedVariant?.id);
  const stockStatus = getStockStatus(product, selectedVariant?.id);

  const images =
    (product?.images?.length ?? 0) > 0
      ? product.images || []
      : [product.imageUrl || "/placeholder-product.jpg"];

  // Add video to gallery if available
  const galleryItems = product.videoUrl
    ? [...images, product.videoUrl]
    : images;

  const currentImage = galleryItems?.[selectedImageIndex];
  const isVideo =
    currentImage?.includes(".mp4") ||
    currentImage?.includes(".webm") ||
    currentImage?.includes(".mov");

  const handleWishlistToggle = async () => {
    try {
      if (isWishlisted) {
        await removeFromWishlist(product.id);
      } else {
        await addToWishlist(product.id);
      }
    } catch (error) {
      console.error("Wishlist toggle error:", error);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: product?.description ?? "",
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      // TODO: Show toast notification
      console.log("Link copied to clipboard");
    }
  };

  const handleImageChange = useCallback(
    (direction: "prev" | "next") => {
      if (direction === "prev") {
        setSelectedImageIndex((prev) =>
          prev === 0 ? (galleryItems?.length ?? 0) - 1 : prev - 1,
        );
      } else {
        setSelectedImageIndex((prev) =>
          prev === (galleryItems?.length ?? 0) - 1 ? 0 : prev + 1,
        );
      }
      setIsImageLoading(true);
    },
    [galleryItems?.length],
  );

  // Keyboard navigation for images
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        handleImageChange("prev");
      } else if (e.key === "ArrowRight") {
        handleImageChange("next");
      } else if (e.key === "Escape") {
        setIsZoomed(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleImageChange]);

  // Preload adjacent images for smooth transitions
  useEffect(() => {
    if (galleryItems && galleryItems.length > 1) {
      const prevIndex =
        selectedImageIndex === 0
          ? galleryItems.length - 1
          : selectedImageIndex - 1;
      const nextIndex =
        selectedImageIndex === galleryItems.length - 1
          ? 0
          : selectedImageIndex + 1;

      const prevImg = document.createElement("img");
      const nextImg = document.createElement("img");

      prevImg.src = galleryItems[prevIndex];
      nextImg.src = galleryItems[nextIndex];
    }
  }, [selectedImageIndex, galleryItems]);

  // Lightbox keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isZoomed) return;

      if (e.key === "ArrowLeft") {
        handleImageChange("prev");
      } else if (e.key === "ArrowRight") {
        handleImageChange("next");
      } else if (e.key === "Escape") {
        handleLightboxClose();
      }
    };

    if (isZoomed) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isZoomed, handleImageChange]);

  const handleImageMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isZoomed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPosition({ x, y });
  };

  const handleImageClick = () => {
    setIsZoomed(!isZoomed);
  };

  const handleLightboxClose = () => {
    setIsZoomed(false);
  };

  // Swipe gesture handlers
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && (images?.length ?? 0) > 1) {
      handleImageChange("next");
    }
    if (isRightSwipe && (images?.length ?? 0) > 1) {
      handleImageChange("prev");
    }
  };

  return (
    <div>
      <div className="max-w-7xl mx-auto">
        {/* Mobile Breadcrumbs */}
        <div className="block lg:hidden mb-4 sticky top-16 z-10">
          <Breadcrumbs
            items={[
              { label: "Home", href: "/" },
              { label: "Collections", href: "/collections" },
              { label: categoryName, href: `/collections/${categoryName}` },
            ]}
            productName={product.name}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-10 gap-2 lg:gap-8">
          {/* Product Images */}
          <div className="lg:col-span-6 space-y-4 lg:sticky lg:top-24 lg:h-fit">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Thumbnail Gallery - Left side on desktop, Bottom on mobile */}
              {(galleryItems?.length ?? 0) > 1 && (
                <div className="flex lg:flex-col gap-2 order-2 lg:order-1 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 lg:sticky lg:top-24 lg:h-fit lg:self-start scroll-smooth snap-x snap-mandatory">
                  {galleryItems?.map((item: string, index: number) => {
                    const isVideoThumb =
                      item?.includes(".mp4") ||
                      item?.includes(".webm") ||
                      item?.includes(".mov");
                    return (
                      <button
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        aria-label={`View ${isVideoThumb ? "video" : "image"} ${index + 1} of ${galleryItems?.length}`}
                        aria-current={
                          selectedImageIndex === index ? "true" : "false"
                        }
                        className={`relative flex-shrink-0 w-16 h-16 lg:w-18 lg:h-18 bg-gray-100 rounded-md overflow-hidden border-2 transition-colors snap-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          selectedImageIndex === index
                            ? "border-blue-500"
                            : "border-transparent"
                        }`}
                      >
                        {isVideoThumb ? (
                          <div className="relative w-full h-full">
                            <video
                              src={item}
                              className="w-full h-full object-cover"
                              muted
                              onLoadStart={() => setIsImageLoading(false)}
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                              <svg
                                className="h-6 w-6 text-white"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path d="M8 5v14l11-7z" />
                              </svg>
                            </div>
                          </div>
                        ) : (
                          <Image
                            src={item}
                            alt={`${product.name} - ${product.color?.name || ""} ${product.category?.name || ""} - View ${index + 1}`}
                            fill
                            className="object-cover"
                            sizes="(max-width: 1024px) 25vw, 6vw"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Main Image */}
              <div className="order-1 lg:order-2 lg:flex-1">
                <div
                  className="relative aspect-square bg-white rounded-lg overflow-hidden cursor-zoom-in group"
                  onMouseMove={handleImageMouseMove}
                  onClick={handleImageClick}
                  onTouchStart={onTouchStart}
                  onTouchMove={onTouchMove}
                  onTouchEnd={onTouchEnd}
                  role="button"
                  aria-label="Click to zoom image"
                  tabIndex={0}
                >
                  {isImageLoading && !isVideo && (
                    <div className="absolute inset-0 bg-gray-200 animate-pulse" />
                  )}
                  {isVideo ? (
                    <video
                      src={currentImage}
                      className="w-full h-full object-cover"
                      controls
                      playsInline
                      muted
                      loop
                      onLoadStart={() => setIsImageLoading(false)}
                    />
                  ) : (
                    <Image
                      src={currentImage ?? ""}
                      alt={`${product.name} - ${product.color?.name || ""} ${product.category?.name || ""} - Main product image`}
                      fill
                      className={`object-cover transition-opacity duration-300 ${
                        isImageLoading ? "opacity-0" : "opacity-100"
                      }`}
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      onLoad={() => setIsImageLoading(false)}
                      onError={() => setIsImageLoading(false)}
                      placeholder="blur"
                      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
                      style={{
                        transformOrigin: isZoomed
                          ? `${zoomPosition.x}% ${zoomPosition.y}%`
                          : "center",
                        transform: isZoomed ? "scale(2.5)" : "scale(1)",
                        transition: "transform 0.3s ease",
                        cursor: isZoomed ? "zoom-out" : "zoom-in",
                      }}
                    />
                  )}

                  {/* Image Navigation */}
                  {(galleryItems?.length ?? 0) > 1 && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleImageChange("prev");
                        }}
                        aria-label="Previous image"
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm p-2 rounded-full shadow-lg hover:bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleImageChange("next");
                        }}
                        aria-label="Next image"
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm p-2 rounded-full shadow-lg hover:bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </>
                  )}

                  {/* Discount Badge */}
                  {hasDiscount && (
                    <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      {Math.round(
                        ((originalPrice - currentPrice) / originalPrice) * 100,
                      )}
                      % OFF
                    </div>
                  )}

                  {/* Zoom Indicator */}
                  <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-sm p-2 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Product Details */}
          <div className="lg:col-span-4 space-y-6">
            {/* Breadcrumb */}
            <div className="hidden lg:block">
              <Breadcrumbs
                items={[
                  { label: "Home", href: "/" },
                  { label: "Collections", href: "/collections" },
                  { label: categoryName, href: `/collections/${categoryName}` },
                ]}
                productName={product.name}
              />
            </div>

            <div className="space-y-4">
              {/* Product Header */}

              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {product.name}
                </h1>

                {/* Rating */}
                <div className="flex items-center space-x-2">
                  {reviewsData.stats.totalReviews > 0 ? (
                    <>
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < Math.round(reviewsData.stats.averageRating)
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-gray-600">
                        ({reviewsData.stats.averageRating.toFixed(1)} out of 5)
                      </span>
                      <span className="text-xs text-gray-400">|</span>
                      <span className="text-xs text-gray-600">
                        {reviewsData.stats.totalReviews} Reviews
                      </span>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 text-gray-300" />
                        ))}
                      </div>
                      <span className="text-xs text-gray-600">
                        No Reviews Yet
                      </span>
                      <span className="text-xs text-gray-400">|</span>
                      <span className="text-xs text-gray-600">
                        Be the first to review!
                      </span>
                    </>
                  )}
                </div>

                <div className="flex items-center justify-between mt-2 bg-gray-50 rounded-lg p-3">
                  <div className="flex items-baseline space-x-3">
                    <span className="text-2xl font-bold text-gray-900">
                      &#8377;{currentPrice.toLocaleString()}
                    </span>
                    {hasDiscount && (
                      <span className="text-xl text-gray-500 line-through">
                        &#8377;{originalPrice.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={handleWishlistToggle}
                      variant="outline"
                      size="sm"
                      disabled={wishlistUpdating === product.id}
                      className={`h-10 w-10 rounded-full border-2 transition-all duration-200 ${
                        isWishlisted
                          ? "border-red-500 bg-red-50 text-red-500 hover:bg-red-100"
                          : "border-gray-300 bg-white text-gray-600 hover:border-gray-400 hover:bg-gray-50"
                      } ${wishlistUpdating === product.id ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <Heart
                        className={`h-4 w-4 ${isWishlisted ? "fill-current" : ""} ${
                          wishlistUpdating === product.id ? "animate-pulse" : ""
                        }`}
                      />
                    </Button>
                    <Button
                      onClick={handleShare}
                      variant="outline"
                      size="sm"
                      className="h-10 w-10 rounded-full border-2 border-gray-300 bg-white text-gray-600 hover:border-gray-400 hover:bg-gray-50 transition-all duration-200"
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-base font-semibold text-gray-900">
                  Description
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {product.description ||
                    `Experience the elegance of traditional Indian craftsmanship with this beautiful ${product.name}. Perfect for special occasions and celebrations, this piece showcases the rich heritage of Indian ethnic wear.`}
                </p>
              </div>

              {/* Product Details */}
              {(product.careInstructions ||
                product.weight ||
                product.dimensions) && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Product Details
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {product.careInstructions && (
                      <div>
                        <span className="text-gray-500">Care:</span>
                        <span className="ml-2 font-medium">
                          {product.careInstructions}
                        </span>
                      </div>
                    )}
                    {product.weight && (
                      <div>
                        <span className="text-gray-500">Weight:</span>
                        <span className="ml-2 font-medium">
                          {product.weight}g
                        </span>
                      </div>
                    )}
                    {product.dimensions && (
                      <div>
                        <span className="text-gray-500">Dimensions:</span>
                        <span className="ml-2 font-medium">
                          {product.dimensions}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Variants */}
              {product.variants && product.variants.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base font-semibold text-gray-900">
                      Select Size
                    </h3>
                    <button
                      onClick={() => setShowSizeGuide(true)}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      Size Guide
                    </button>
                  </div>
                  <div className="flex gap-2">
                    {product.variants.map((variant: any) => (
                      <Button
                        variant="outline"
                        key={variant.id}
                        onClick={() => setSelectedVariant(variant)}
                        disabled={variant.onlineStock <= 0}
                        className={`px-4 py-2 text-sm font-medium rounded-full transition-colors min-w-[3rem] relative ${
                          selectedVariant?.id === variant.id
                            ? "border-blue-500 bg-blue-50 text-blue-700 hover:bg-blue-100"
                            : variant.onlineStock > 0
                              ? "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                              : "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
                        }`}
                      >
                        <span
                          className={`${variant.onlineStock <= 0 ? "line-through" : ""}`}
                        >
                          {variant.size}
                        </span>
                        {variant.onlineStock <= 0 && (
                          <span className="absolute -top-1 -right-1 bg-gray-500 text-white text-xs px-1 rounded">
                            OOT
                          </span>
                        )}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="hidden sm:flex flex-col sm:flex-row gap-4">
                <CartControls
                  product={product}
                  selectedVariant={selectedVariant}
                  initialQuantity={quantity}
                />
              </div>

              {/* Error Display */}
              {(error || wishlistError) && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                  {error || wishlistError}
                </div>
              )}

              {/* Features */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-6 border-t border-b text-xs">
                <div className="flex items-center space-x-3">
                  <Truck className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">Free Shipping</p>
                    <p className="text-gray-500">On orders above ₹999</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <RefreshCw className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">Easy Returns</p>
                    <p className="text-gray-500">30-day return policy</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Shield className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">Secure Payment</p>
                    <p className="text-gray-500">100% secure transactions</p>
                  </div>
                </div>
              </div>

              {/* Delivery Options */}
              <DeliveryOptions />

              {/* Specifications */}
              <Specifications product={product} />

              {/* Product Reviews */}
              <ProductReviews reviewsData={reviewsData} />
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <div className="flex items-center justify-between mb-8">
              <h1
                className="font-serif tracking-wide transition-colors text-2xl"
                data-testid="text-featured-title"
              >
                You May Also Like
              </h1>
              <Link
                href={`/collections/${categoryName}`}
                className="inline-flex items-center text-[10px] font-bold uppercase tracking-[0.2em] border-b border-black pb-2 transition-all"
              >
                <span>View All</span>
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
            {/* Mobile horizontal scroll container */}
            <div className="sm:hidden">
              <div
                className="flex gap-4 overflow-x-auto scroll-smooth pb-4 -mx-4 px-4"
                style={
                  {
                    scrollbarWidth: "none",
                    msOverflowStyle: "none",
                    WebkitScrollbar: { display: "none" },
                  } as React.CSSProperties
                }
              >
                {relatedProducts.slice(0, 4).map((relatedProduct) => (
                  <div key={relatedProduct.id} className="flex-shrink-0 w-72">
                    <ProductCard
                      product={relatedProduct}
                      showNewBadge={true}
                      showFeaturedBadge={true}
                      onQuickView={(product) => {
                        // Navigate to product detail page instead of modal
                        router.push(
                          `/collections/${categoryName}/${relatedProduct.urlSlug || relatedProduct.id}`,
                        );
                      }}
                      onWishlistToggle={() => {
                        if (isInWishlist(relatedProduct.id)) {
                          removeFromWishlist(relatedProduct.id);
                        } else {
                          addToWishlist(relatedProduct.id);
                        }
                      }}
                      isWishlisted={isInWishlist(relatedProduct.id)}
                      disabled={wishlistUpdating === relatedProduct.id}
                      className={`transition-all duration-200 ${
                        wishlistUpdating === relatedProduct.id
                          ? "opacity-50 cursor-not-allowed"
                          : "hover:scale-105"
                      }`}
                    />
                  </div>
                ))}
              </div>
            </div>
            {/* Desktop grid view */}
            <div className="hidden sm:grid grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.slice(0, 4).map((relatedProduct) => (
                <ProductCard
                  key={relatedProduct.id}
                  product={relatedProduct}
                  showNewBadge={true}
                  showFeaturedBadge={true}
                  onQuickView={(product) => {
                    // Navigate to product detail page instead of modal
                    router.push(
                      `/collections/${categoryName}/${relatedProduct.urlSlug || relatedProduct.id}`,
                    );
                  }}
                  onWishlistToggle={() => {
                    if (isInWishlist(relatedProduct.id)) {
                      removeFromWishlist(relatedProduct.id);
                    } else {
                      addToWishlist(relatedProduct.id);
                    }
                  }}
                  isWishlisted={isInWishlist(relatedProduct.id)}
                  disabled={wishlistUpdating === relatedProduct.id}
                  className={`transition-all duration-200 ${
                    wishlistUpdating === relatedProduct.id
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:scale-105"
                  }`}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Image Lightbox Modal */}
      {isZoomed && !isVideo && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={handleLightboxClose}
        >
          <div className="relative max-w-4xl max-h-full w-full h-full flex items-center justify-center">
            <Image
              src={currentImage ?? ""}
              alt={`${product.name} - Zoomed view`}
              fill
              className="object-contain"
              sizes="100vw"
              priority
            />

            {/* Close button */}
            <button
              onClick={handleLightboxClose}
              className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm p-2 rounded-full text-white hover:bg-white/30 transition-colors"
              aria-label="Close lightbox"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {/* Navigation arrows in lightbox */}
            {(galleryItems?.length ?? 0) > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleImageChange("prev");
                  }}
                  aria-label="Previous image"
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-sm p-3 rounded-full text-white hover:bg-white/30 transition-colors"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleImageChange("next");
                  }}
                  aria-label="Next image"
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-sm p-3 rounded-full text-white hover:bg-white/30 transition-colors"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}

            {/* Image counter */}
            {(galleryItems?.length ?? 0) > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-white text-sm">
                {selectedImageIndex + 1} / {galleryItems?.length}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Size Guide Modal */}
      <SizeGuide
        isOpen={showSizeGuide}
        onClose={() => setShowSizeGuide(false)}
      />

      {/* Mobile Sticky Add to Cart Bar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-xl z-50 px-4 py-4">
        <div className="max-w-md mx-auto flex justify-center">
          <CartControls
            product={product}
            selectedVariant={selectedVariant}
            initialQuantity={quantity}
          />
        </div>
      </div>
    </div>
  );
}
