"use client";

import { useState, useEffect, useCallback } from "react";
import ProductCard from "@/components/products/ProductCard";
import { ProductWithDetails } from "@/shared";
import { ProductService } from "@/lib/services/productService";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/auth";
import { useWishlistQuery, useAddToWishlist, useRemoveFromWishlist, useGuestWishlist } from "@/hooks/useWishlistQueries";
import { useSocketStore } from "@/lib/stores/socketStore";
import { useRouter } from "next/navigation";
import { getProductUrl } from "@/lib/utils/productUrl";

interface ProductSectionClientProps {
  title: string;
  subtitle: string;
  endpoint: string;
  viewAllLink: string;
  initialProducts: ProductWithDetails[];
}

export default function ProductSectionClient({
  title,
  subtitle,
  endpoint,
  viewAllLink,
  initialProducts,
}: ProductSectionClientProps) {
  // Pre-seeded from server — no loading state on first render
  const [products, setProducts] = useState<ProductWithDetails[]>(initialProducts);

  const { isAuthenticated } = useAuth();
  const { data: wishlistData } = useWishlistQuery();
  const addToWishlistMutation = useAddToWishlist();
  const removeFromWishlistMutation = useRemoveFromWishlist();
  const guestWishlist = useGuestWishlist();
  const { socket } = useSocketStore();
  const router = useRouter();

  const addToWishlist = (productId: string) => {
    if (isAuthenticated) addToWishlistMutation.mutate(productId);
    else guestWishlist.addToWishlist(productId);
  };
  const removeFromWishlist = (productId: string) => {
    if (isAuthenticated) removeFromWishlistMutation.mutate(productId);
    else guestWishlist.removeFromWishlist(productId);
  };
  const isInWishlist = (productId: string) => {
    if (isAuthenticated)
      return (wishlistData?.wishlist ?? []).some((item) => item.productId === productId);
    return guestWishlist.isInWishlist(productId);
  };
  const updating =
    addToWishlistMutation.isPending || removeFromWishlistMutation.isPending
      ? addToWishlistMutation.variables || removeFromWishlistMutation.variables || null
      : guestWishlist.updating;

  // Socket-driven re-fetch — keeps product list fresh when admin makes changes
  const fetchProducts = useCallback(async () => {
    try {
      const fetched = await ProductService.getProducts(endpoint);
      setProducts(fetched);
    } catch {
      // silently fail — keep existing products
    }
  }, [endpoint]);

  useEffect(() => {
    if (!socket) return;
    socket.on("product_event", fetchProducts);
    socket.on("offer_event", fetchProducts);
    return () => {
      socket.off("product_event", fetchProducts);
      socket.off("offer_event", fetchProducts);
    };
  }, [socket, fetchProducts]);

  const handleWishlistToggle = async (product: ProductWithDetails) => {
    try {
      if (isInWishlist(product.id)) await removeFromWishlist(product.id);
      else await addToWishlist(product.id);
    } catch {
      // silently fail
    }
  };

  const handleQuickView = useCallback(
    (product: ProductWithDetails) => router.push(getProductUrl(product)),
    [router]
  );

  if (products.length === 0) return null;

  return (
    <section>
      <div className="max-w-7xl mx-auto">
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

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              showNewBadge={true}
              showFeaturedBadge={true}
              onQuickView={handleQuickView}
              onWishlistToggle={handleWishlistToggle}
              isWishlisted={isInWishlist(product.id)}
              disabled={updating === product.id}
              priority={index < 4}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
