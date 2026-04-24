"use client";

import ProductCard from "@/components/products/ProductCard";
import { ProductWithDetails } from "@/shared";
import { ArrowRight, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useWishlistStore } from "@/lib/stores";

interface ProductSectionProps {
  title: string;
  subtitle: string;
  endpoint: string;
  viewAllLink: string;
}

async function getProducts(endpoint: string): Promise<ProductWithDetails[]> {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const response = await fetch(`${baseUrl}${endpoint}`, {
      cache: "no-store",
    });
    const data = await response.json();
    return data.products || [];
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
}

export default function ProductSection({
  title,
  subtitle,
  endpoint,
  viewAllLink,
}: ProductSectionProps) {
  const [products, setProducts] = useState<ProductWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const { items, addToWishlist, removeFromWishlist, isInWishlist, updating } =
    useWishlistStore();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const fetchedProducts = await getProducts(endpoint);
        setProducts(fetchedProducts);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [endpoint]);

  const handleWishlistToggle = async (product: ProductWithDetails) => {
    try {
      if (isInWishlist(product.id)) {
        await removeFromWishlist(product.id);
      } else {
        await addToWishlist(product.id);
      }
    } catch (error) {
      console.error("Error toggling wishlist:", error);
    }
  };

  if (loading) {
    return (
      <section>
        <div className="max-w-7xl mx-auto lg:px-10 px-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="font-serif tracking-wide transition-colors text-2xl">
                {title}
              </h1>
              <p className="text-muted-foreground text-xs">{subtitle}</p>
            </div>

            <Link
              href={viewAllLink}
              className="inline-flex items-center text-[10px] font-bold uppercase tracking-[0.2em] border-b border-black pb-2 transition-all touch-manipulation active:scale-95"
            >
              <span>View All</span>
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-8">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="bg-gray-200 aspect-[3/4] rounded-sm mb-2"></div>
                <div className="h-4 bg-gray-200 rounded mb-1"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return (
      <section>
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1
                className="font-serif tracking-wide transition-colors text-2xl"
                data-testid="text-featured-title"
              >
                {title}
              </h1>
              <p className="text-muted-foreground text-xs">{subtitle}</p>
            </div>

            <Link
              href={viewAllLink}
              className="inline-flex items-center text-[10px] font-bold uppercase tracking-[0.2em] border-b border-black pb-2 transition-all touch-manipulation active:scale-95"
            >
              <span>View All</span>
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>

          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <RefreshCw className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No products available
            </h3>
            <p className="text-gray-500 text-sm mb-6">
              Check back later for new arrivals
            </p>
            <Link
              href={viewAllLink}
              className="inline-flex items-center px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <span>Browse All Products</span>
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="max-w-7xl mx-auto lg:px-10 px-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1
              className="font-serif tracking-wide transition-colors text-2xl"
              data-testid="text-featured-title"
            >
              {title}
            </h1>
            <p className="text-muted-foreground text-xs">{subtitle}</p>
          </div>

          <Link
            href={viewAllLink}
            className="inline-flex items-center text-[10px] font-bold uppercase tracking-[0.2em] border-b border-black pb-2 transition-all touch-manipulation active:scale-95"
          >
            <span>View All</span>
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-8">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              showNewBadge={endpoint.includes("/new")}
              showFeaturedBadge={endpoint.includes("/featured")}
              onWishlistToggle={handleWishlistToggle}
              isWishlisted={isInWishlist(product.id)}
              disabled={updating === product.id}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
