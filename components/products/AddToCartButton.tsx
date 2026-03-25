'use client';

import React, { useState } from 'react';
import { useAuth } from '@/auth';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/lib/stores';
import { Button } from '@/components/ui/button';

interface AddToCartButtonProps {
  productId: string;
  onlineStock: number;
  variantId?: string | null;
}

export default function AddToCartButton({ productId, onlineStock, variantId }: AddToCartButtonProps) {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const { addToCart, updating } = useCartStore();
  const [quantity, setQuantity] = useState(1);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    await addToCart(productId, quantity, variantId);
    // Optionally show success message or redirect to cart
    // router.push('/cart');
  };

  const isUpdating = updating === productId;
  const isOutOfStock = !onlineStock || onlineStock === 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <label htmlFor="quantity" className="font-semibold text-gray-700">
          Quantity:
        </label>
        <select
          id="quantity"
          value={quantity}
          onChange={(e) => setQuantity(parseInt(e.target.value))}
          className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
          disabled={isOutOfStock}
        >
          {[...Array(Math.min(10, onlineStock || 1))].map((_, i) => (
            <option key={i + 1} value={i + 1}>
              {i + 1}
            </option>
          ))}
        </select>
        <span className="text-sm text-gray-600">
          ({onlineStock || 0} available)
        </span>
      </div>

      <Button
        onClick={handleAddToCart}
        disabled={isUpdating || isOutOfStock}
        className="w-full"
        size="lg"
      >
        {isUpdating ? 'Adding to Cart...' : 'Add to Cart'}
      </Button>

      {isOutOfStock ? (
        <p className="text-red-600 text-sm">This product is currently out of stock.</p>
      ) : null}
    </div>
  );
}