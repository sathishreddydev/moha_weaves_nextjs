"use client";

import ProductCard from "@/components/products/ProductCard";
import { Button } from "@/components/ui/button";
import {
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
import { useCartStore } from "@/lib/stores";
import CartControls from "@/components/ProductDetails/CartControls";
import ProductReviews from "@/components/ProductDetails/ProductReviews";
import DeliveryOptions from "@/components/ProductDetails/DeliveryOptions";
import Specifications from "@/components/ProductDetails/Specifications";

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
  const [isWishlisted, setIsWishlisted] = useState(false);

  const currentPrice = Number(product.discountedPrice || product.price);
  const originalPrice = Number(product.price);
  const hasDiscount =
    product.discountedPrice &&
    Number(product?.discountedPrice ?? 0) < Number(product.price);

  const images =
    (product?.images?.length ?? 0) > 0
      ? product.images
      : [product.imageUrl || "/placeholder-product.jpg"];
  const currentImage = images?.[selectedImageIndex];

  const handleWishlistToggle = () => {
    setIsWishlisted(!isWishlisted);
    // TODO: Implement wishlist functionality
    console.log("Wishlist toggle:", product.name);
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
          prev === 0 ? (images?.length ?? 0) - 1 : prev - 1,
        );
      } else {
        setSelectedImageIndex((prev) =>
          prev === (images?.length ?? 0) - 1 ? 0 : prev + 1,
        );
      }
      setIsImageLoading(true);
    },
    [images?.length],
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-2">
          {/* Product Images */}
          <div className="lg:col-span-6 space-y-4 lg:sticky lg:top-24 lg:h-fit">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Thumbnail Gallery - Left side on desktop */}
              {(images?.length ?? 0) > 1 && (
                <div className="flex flex-col gap-2">
                  {images?.map((image: string, index: number) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`relative w-16 h-16 lg:w-18 lg:h-18 bg-gray-100 rounded-md overflow-hidden border-2 transition-colors ${
                        selectedImageIndex === index
                          ? "border-blue-500"
                          : "border-transparent"
                      }`}
                    >
                      <Image
                        src={image}
                        alt={`${product.name} - ${product.color?.name || ""} ${product.category?.name || ""} - View ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 1024px) 25vw, 6vw"
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Main Image */}
              <div className="order-1 lg:order-2 lg:w-[82%]">
                <div
                  className="relative aspect-square bg-white rounded-lg overflow-hidden cursor-zoom-in"
                  onMouseMove={handleImageMouseMove}
                  onClick={handleImageClick}
                >
                  <Image
                    src={currentImage ?? ""}
                    alt={`${product.name} - ${product.color?.name || ""} ${product.category?.name || ""} - Main product image`}
                    fill
                    className={`object-cover transition-opacity duration-300 ${
                      isImageLoading ? "opacity-0" : "opacity-100"
                    }`}
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    onLoad={() => setIsImageLoading(false)}
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

                  {/* Image Navigation */}
                  {(images?.length ?? 0) > 1 && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleImageChange("prev");
                        }}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm p-2 rounded-full shadow-lg hover:bg-white transition-colors"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleImageChange("next");
                        }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm p-2 rounded-full shadow-lg hover:bg-white transition-colors"
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
                </div>
              </div>
            </div>
          </div>

          {/* Product Details */}
          <div className="lg:col-span-4 space-y-6">
            {/* Breadcrumb */}
            <div className="">
              <nav className="flex text-sm text-gray-500">
                <button
                  onClick={() => router.push("/")}
                  className="hover:text-gray-700"
                >
                  Home
                </button>
                <span className="mx-2">/</span>
                <button
                  onClick={() => router.push("/collections")}
                  className="hover:text-gray-700"
                >
                  Collections
                </button>
                <span className="mx-2">/</span>
                <button
                  onClick={() => router.push(`/collections/${categoryName}`)}
                  className="hover:text-gray-700 capitalize"
                >
                  {categoryName}
                </button>
                <span className="mx-2">/</span>
                <span className="text-gray-900">{product.name}</span>
              </nav>
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
                            className={`h-3 w-3 ${
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
                          <Star key={i} className="h-3 w-3 text-gray-300" />
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

                {/* Price */}
                <div className="flex items-baseline space-x-3 mt-2">
                  <span className="text-2xl font-bold text-gray-900">
                    ₹{currentPrice.toLocaleString()}
                  </span>
                  {hasDiscount && (
                    <span className="text-xl text-gray-500 line-through">
                      ₹{originalPrice.toLocaleString()}
                    </span>
                  )}
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
                  <h3 className="text-base font-semibold text-gray-900 mb-1">
                    Select Size
                  </h3>
                  <div className="flex gap-2">
                    {product.variants.map((variant: any) => (
                      <Button
                        variant="outline"
                        size="icon"
                        key={variant.id}
                        onClick={() => setSelectedVariant(variant)}
                        disabled={variant.onlineStock <= 0}
                        className={`text-xs font-medium transition-colors ${
                          selectedVariant?.id === variant.id
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : variant.onlineStock > 0
                              ? "border-gray-300 hover:border-gray-400"
                              : "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
                        }`}
                      >
                        {variant.size}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 sticky bottom-0 bg-white pt-4 border-t sm:border-0 sm:pt-0">
                <CartControls
                  product={product}
                  selectedVariant={selectedVariant}
                  initialQuantity={quantity}
                />

                <Button
                  onClick={handleWishlistToggle}
                  variant="outline"
                  size="lg"
                  className={isWishlisted ? "border-red-500 text-red-500" : ""}
                >
                  <Heart
                    className={`h-5 w-5 ${isWishlisted ? "fill-current" : ""}`}
                  />
                </Button>

                <Button onClick={handleShare} variant="outline" size="lg">
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>

              {/* Error Display */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                  {error}
                </div>
              )}

              {/* Features */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-6 border-t border-b text-xs">
                <div className="flex items-center space-x-3">
                  <Truck className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">
                      Free Shipping
                    </p>
                    <p className="text-gray-500">
                      On orders above ₹999
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <RefreshCw className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">
                      Easy Returns
                    </p>
                    <p className="text-gray-500">
                      30-day return policy
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Shield className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">
                      Secure Payment
                    </p>
                    <p className="text-gray-500">
                      100% secure transactions
                    </p>
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
            <h2 className="text-2xl font-bold text-gray-900 mb-8">
              You May Also Like
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
                    console.log("Wishlist toggle:", relatedProduct.name);
                  }}
                  isWishlisted={false}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
