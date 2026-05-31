"use client";

import { Button } from "@/components/ui/button";
import { ShoppingCart, Plus, Minus, ShoppingBag } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useAddToCart, useUpdateCartQuantity, useRemoveFromCart, useCartQuery, useGuestCart } from "@/hooks/useCartQueries";
import { useRouter } from "next/navigation";
import { useAuth } from "@/auth";
import { CartItemWithProduct } from "@/shared";
import { getAvailableStock } from "@/lib/stock-utils";
import { toast } from "sonner";

interface CartControlsProps {
  product: any;
  selectedVariant: any;
  initialQuantity?: number;
}

export default function CartControls({
  product,
  selectedVariant,
}: CartControlsProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  
  // React Query hooks for authenticated users
  const { data: cartData } = useCartQuery();
  const addToCartMutation = useAddToCart();
  const updateQuantityMutation = useUpdateCartQuantity();
  const removeFromCartMutation = useRemoveFromCart();
  
  // Guest cart hook
  const guestCart = useGuestCart();
  
  // Unified items
  const items = useMemo(
    () => isAuthenticated ? (cartData?.cart ?? []) : (guestCart.items as any),
    [isAuthenticated, cartData?.cart, guestCart.items]
  );
  const updating = addToCartMutation.isPending || updateQuantityMutation.isPending || removeFromCartMutation.isPending
    ? product.id
    : null;
  
  const [isInCart, setIsInCart] = useState(false);
  const [cartQuantity, setCartQuantity] = useState(0);

  const currentPrice = Number(product.discountedPrice || product.price);
  const availableStock = getAvailableStock(product, selectedVariant?.id);

  const isLoggedIn = isAuthenticated;

  // Sync cart state with actual cart items
  useEffect(() => {
    const existingItem = items.find(
      (item: CartItemWithProduct) =>
        item.product?.id === product.id &&
        (!selectedVariant?.id || item.variantId === selectedVariant.id),
    );

    if (existingItem) {
      setIsInCart(true);
      setCartQuantity(existingItem.quantity);
    } else {
      setIsInCart(false);
      setCartQuantity(0);
    }
  }, [items, product.id, selectedVariant?.id]);

  const handleAddToCart = async () => {
    if (availableStock <= 0) {
      toast.error("This item is out of stock.");
      return;
    }

    try {
      if (isAuthenticated) {
        addToCartMutation.mutate({ productId: product.id, quantity: 1, variantId: selectedVariant?.id || null });
      } else {
        await guestCart.addToCart(product.id, 1, selectedVariant?.id || null);
      }
      toast.success("Added to cart");
    } catch (error) {
      toast.error("Failed to add item to cart. Please try again.");
    }
  };

  const handleIncreaseQuantity = async () => {
    if (cartQuantity >= availableStock) {
      toast.error(`Only ${availableStock} items available in stock.`);
      return;
    }

    try {
      if (isAuthenticated) {
        const cartItem = items.find(
          (item: CartItemWithProduct) =>
            item.product?.id === product.id &&
            (!selectedVariant?.id || item.variantId === selectedVariant.id),
        );
        if (cartItem) {
          updateQuantityMutation.mutate({ itemId: cartItem.id, quantity: cartQuantity + 1 });
        }
      } else {
        const cartItem = items.find(
          (item: any) =>
            item.productId === product.id &&
            (!selectedVariant?.id || item.variantId === selectedVariant.id),
        );
        if (cartItem) {
          guestCart.updateQuantity(cartItem.id, cartQuantity + 1);
        }
      }
    } catch (error) {
      toast.error("Failed to update cart. Please try again.");
    }
  };

  const handleDecreaseQuantity = async () => {
    if (cartQuantity <= 1) {
      // Remove from cart completely
      try {
        const cartItem = items.find(
          (item: any) =>
            (item.product?.id === product.id || item.productId === product.id) &&
            (!selectedVariant?.id || item.variantId === selectedVariant.id),
        );
        if (cartItem) {
          if (isAuthenticated) {
            removeFromCartMutation.mutate(cartItem.id);
          } else {
            guestCart.removeFromCart(cartItem.id);
          }
        }
      } catch (error) {
        toast.error("Failed to remove item from cart. Please try again.");
      }
    } else {
      // Decrease quantity
      try {
        const cartItem = items.find(
          (item: any) =>
            (item.product?.id === product.id || item.productId === product.id) &&
            (!selectedVariant?.id || item.variantId === selectedVariant.id),
        );
        if (cartItem) {
          if (isAuthenticated) {
            updateQuantityMutation.mutate({ itemId: cartItem.id, quantity: cartQuantity - 1 });
          } else {
            guestCart.updateQuantity(cartItem.id, cartQuantity - 1);
          }
        }
      } catch (error) {
        toast.error("Failed to update cart. Please try again.");
      }
    }
  };

  const handleCheckout = () => {
    router.push("/cart");
  };

  // If session is loading, show loading state
  if (isLoading) {
    return (
      <Button
        disabled
        className="flex-1 bg-gray-300 text-gray-600 h-12 sm:h-auto text-base sm:text-sm"
        size="lg"
      >
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600 mr-2"></div>
        Loading...
      </Button>
    );
  }

  if (isInCart) {
    return (
      <div className="space-y-2 w-full">
        <div className="flex items-center gap-2">
          <div className="flex items-center border rounded-lg">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDecreaseQuantity}
              disabled={updating === product.id || cartQuantity <= 0}
              className="h-10 w-10 rounded-none active:scale-95 transition-transform"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="w-8 text-center font-semibold">
              {cartQuantity}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleIncreaseQuantity}
              disabled={updating === product.id || cartQuantity >= availableStock}
              className="h-10 w-10 rounded-none active:scale-95 transition-transform"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <Button
            onClick={handleCheckout}
            disabled={updating === product.id || cartQuantity === 0}
            className="w-full active:scale-95 transition-transform"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            {isLoggedIn ? "Checkout" : "View Cart"}
            {cartQuantity > 1 && ` (${cartQuantity})`}
            {cartQuantity > 0 &&
              ` - ₹${(cartQuantity * currentPrice).toLocaleString()}`}
          </Button>
        </div>
      </div>
    );
  }
  return (
    <Button
      onClick={handleAddToCart}
      disabled={availableStock <= 0 || updating === product.id}
      size="lg"
      className="w-full active:scale-95 transition-transform"
    >
      <ShoppingBag className="h-5 w-5 mr-2" />
      {updating === product.id
        ? "Adding..."
        : availableStock <= 0
          ? "Out of Stock"
          : "Add to Cart"}
    </Button>
  );
}
