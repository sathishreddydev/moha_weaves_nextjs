"use client";

import DesktopCartView from "@/components/cart/DesktopCartView";
import MobileCartView from "@/components/cart/MobileCartView";
import { CartItemStockStatus } from "@/hooks/useCartQueries";
import { ProductWithDetails } from "@/shared";

interface BagStepProps {
  items: any[];
  updating: string | null;
  updatingAction: "updating" | "removing" | "clearing" | null;
  stockStatus: Record<string, CartItemStockStatus>;
  hasStockIssues: boolean;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  calculateTotal: () => number;
  isGuest: boolean;
  relatedProducts: ProductWithDetails[];
  categoryName: string;
  onCheckout: () => void;
}

export default function BagStep({
  items,
  updating,
  updatingAction,
  stockStatus,
  hasStockIssues,
  updateQuantity,
  removeFromCart,
  calculateTotal,
  isGuest,
  relatedProducts,
  categoryName,
  onCheckout,
}: BagStepProps) {
  return (
    <>
      <DesktopCartView
        items={items}
        updating={updating}
        updatingAction={updatingAction}
        stockStatus={stockStatus}
        hasStockIssues={hasStockIssues}
        updateQuantity={updateQuantity}
        removeFromCart={removeFromCart}
        calculateTotal={calculateTotal}
        isGuest={isGuest}
        relatedProducts={relatedProducts}
        categoryName={categoryName}
        onCheckout={onCheckout}
      />
      <MobileCartView
        items={items}
        updating={updating}
        updatingAction={updatingAction}
        stockStatus={stockStatus}
        hasStockIssues={hasStockIssues}
        updateQuantity={updateQuantity}
        removeFromCart={removeFromCart}
        calculateTotal={calculateTotal}
        isGuest={isGuest}
        relatedProducts={relatedProducts}
        categoryName={categoryName}
        onCheckout={onCheckout}
      />
    </>
  );
}
