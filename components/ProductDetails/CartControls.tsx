"use client";

import { Button } from "@/components/ui/button";
import { ShoppingCart, Plus, Minus, ShoppingBag, User } from "lucide-react";
import { useState, useEffect } from "react";
import { useCartStore } from "@/lib/stores";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/auth";
import { CartItemWithProduct } from "@/shared";

interface CartControlsProps {
  product: any;
  selectedVariant: any;
  initialQuantity?: number;
}

export default function CartControls({
  product,
  selectedVariant,
  initialQuantity = 1,
}: CartControlsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuth();
  const { addToCart, removeFromCart, updateQuantity, updating, items } =
    useCartStore();
  const [isInCart, setIsInCart] = useState(false);
  const [cartQuantity, setCartQuantity] = useState(0);

  const currentPrice = Number(product.discountedPrice || product.price);

  // Check if user is logged in using NextAuth
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

  const handleLoginRedirect = () => {
    // Use Next.js pathname instead of window.location
    const returnUrl = encodeURIComponent(pathname);
    router.push(`/login?returnUrl=${returnUrl}`);
  };

  const handleAddToCart = async () => {
    if (!isLoggedIn) {
      handleLoginRedirect();
      return;
    }

    try {
      await addToCart(product.id, 1, selectedVariant?.id || null);
    } catch (error) {
      console.error("Failed to add to cart:", error);
      // TODO: Show user feedback for cart errors
    }
  };

  const handleIncreaseQuantity = async () => {
    if (!isLoggedIn) {
      handleLoginRedirect();
      return;
    }

    try {
      await addToCart(product.id, 1, selectedVariant?.id || null);
    } catch (error) {
      console.error("Failed to increase quantity:", error);
      // TODO: Show user feedback for cart errors
    }
  };

  const handleDecreaseQuantity = async () => {
    if (!isLoggedIn) {
      handleLoginRedirect();
      return;
    }

    if (cartQuantity <= 1) {
      // Remove from cart completely
      try {
        const cartItem = items.find(
          (item: CartItemWithProduct) =>
            item.product?.id === product.id &&
            (!selectedVariant?.id || item.variantId === selectedVariant.id),
        );
        if (cartItem) {
          await removeFromCart(cartItem.id);
        }
      } catch (error) {
        console.error("Failed to remove from cart:", error);
        // TODO: Show user feedback for cart errors
      }
    } else {
      // Decrease quantity
      try {
        const cartItem = items.find(
          (item: CartItemWithProduct) =>
            item.product?.id === product.id &&
            (!selectedVariant?.id || item.variantId === selectedVariant.id),
        );
        if (cartItem) {
          await updateQuantity(cartItem.id, cartQuantity - 1);
        }
      } catch (error) {
        console.error("Failed to decrease quantity:", error);
        // TODO: Show user feedback for cart errors
      }
    }
  };

  const handleCheckout = () => {
    if (!isLoggedIn) {
      handleLoginRedirect();
      return;
    }
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
  // If user is not logged in, show login prompt
  if (!isLoggedIn) {
    return (
      <div className="space-y-3">
        <Button
          onClick={handleLoginRedirect}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-12 sm:h-auto text-base sm:text-sm"
          size="lg"
        >
          <User className="h-5 w-5 mr-2" />
          Login to Add to Cart
        </Button>
        <p className="text-sm text-gray-500 text-center">
          Please login to add items to your cart and checkout
        </p>
      </div>
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
              className="h-10 w-10 rounded-none"
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
              disabled={updating === product.id}
              className="h-10 w-10 rounded-none"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <Button
            onClick={handleCheckout}
            disabled={updating === product.id || cartQuantity === 0}
            className="w-full"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Checkout
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
      disabled={product.onlineStock <= 0 || updating === product.id}
      size="lg"
      className="w-full"
    >
      <ShoppingBag className="h-5 w-5 mr-2" />
      {updating === product.id
        ? "Adding..."
        : product.onlineStock <= 0
          ? "Out of Stock"
          : "Add to Cart"}
    </Button>
  );
}
