"use client";

import { Button } from "@/components/ui/button";
import { useWishlistStore } from "@/lib/stores";
import { getProductUrl } from "@/lib/utils/productUrl";
import { X } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

export default function WishlistPage() {
  const {
    items,
    loading,
    error,
    updating,
    count,
    fetchWishlist,
    removeFromWishlist,
    addToCartFromWishlist,
  } = useWishlistStore();

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const getProductPrice = (product: any) => {
    if (product.discountedPrice) {
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

                    <button
                      onClick={() => removeFromWishlist(item.productId)}
                      disabled={updating === item.productId}
                      className="absolute top-2 right-2 bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-600 hover:text-red-600 p-2 rounded-full shadow-md transition-all disabled:opacity-50"
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

                    <div className="flex items-center justify-between mb-4">
                      <div>
                        {price.hasDiscount ? (
                          <div className="flex items-center space-x-2">
                            <span className="text-lg font-bold text-red-600">
                              ${price.discounted?.toFixed(2)}
                            </span>
                            <span className="text-sm text-gray-500 line-through">
                              ${price.original.toFixed(2)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-lg font-bold text-gray-900">
                            ${price.original.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <Button
                        onClick={() => addToCartFromWishlist(item.productId)}
                        disabled={updating === item.productId}
                        className="flex-1"
                        size="sm"
                      >
                        {updating === item.productId
                          ? "Adding..."
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
