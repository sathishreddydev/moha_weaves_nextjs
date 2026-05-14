"use client";

import Link from "next/link";
import { Minus, Plus, X, ShoppingBag, Truck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatPrice } from "@/lib/formatters";
import { getProductUrl } from "@/lib/utils/productUrl";
import { getAvailableStock } from "@/lib/stock-utils";

interface CartViewProps {
  items: any[];
  updating: string | null;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  calculateTotal: () => number;
  isGuest: boolean;
}

const FREE_SHIPPING_THRESHOLD = 999;

export default function CartView({
  items,
  updating,
  updateQuantity,
  removeFromCart,
  clearCart,
  calculateTotal,
  isGuest,
}: CartViewProps) {
  const getProductPrice = (product: any) => {
    if (product.discountedPrice) {
      return {
        original: parseFloat(product.price),
        discounted: parseFloat(product.discountedPrice),
        hasDiscount: true,
      };
    }
    return { original: parseFloat(product.price), discounted: null, hasDiscount: false };
  };

  const subtotal = calculateTotal();
  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : 50;
  const total = subtotal + shipping;
  const toFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const shippingProgress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);

  const totalSavings = items.reduce((sum, item) => {
    const p = getProductPrice(item.product);
    return p.hasDiscount && p.discounted !== null
      ? sum + (p.original - p.discounted) * item.quantity
      : sum;
  }, 0);

  return (
    <div className="max-w-3xl mx-auto lg:max-w-none">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-semibold text-foreground">
          Your Cart
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            ({items.length} {items.length === 1 ? "item" : "items"})
          </span>
        </h1>
        {items.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearCart}
            disabled={updating === "all"}
            className="text-xs text-muted-foreground hover:text-destructive"
          >
            {updating === "all" ? "Clearing…" : "Clear all"}
          </Button>
        )}
      </div>

      {/* ── Free shipping progress ── */}
      <Card className={`mb-5 border ${toFreeShipping > 0 ? "border-amber-200 bg-amber-50" : "border-green-200 bg-green-50"}`}>
        <CardContent className="px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <Truck className={`w-4 h-4 flex-shrink-0 ${toFreeShipping > 0 ? "text-amber-500" : "text-green-600"}`} />
            {toFreeShipping > 0 ? (
              <p className="text-xs text-amber-700">
                Add <span className="font-semibold">{formatPrice(toFreeShipping)}</span> more to unlock free shipping
              </p>
            ) : (
              <p className="text-xs text-green-700 font-medium">You've unlocked free shipping!</p>
            )}
          </div>
          {toFreeShipping > 0 && (
            <div className="h-1.5 bg-amber-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-500"
                style={{ width: `${shippingProgress}%` }}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Item list ── */}
      <div className="space-y-3 pb-44 lg:pb-0">
        {items.map((item) => {
          const price = getProductPrice(item.product);
          const firstImage = item.product.images?.[0] || item.product.imageUrl;
          const variantInfo = item.variantId
            ? item.product.variants?.find((v: any) => v.id === item.variantId)
            : null;
          const effectivePrice = price.discounted ?? price.original;
          const lineTotal = effectivePrice * item.quantity;
          const lineSavings =
            price.hasDiscount && price.discounted !== null
              ? (price.original - price.discounted) * item.quantity
              : 0;
          const availableStock = getAvailableStock(item.product, item.variantId);
          const atStockLimit = item.quantity >= availableStock;

          return (
            <Card
              key={item.id}
              className="overflow-hidden border border-border hover:border-muted-foreground/20 hover:shadow-sm transition-all duration-200"
            >
              <div className="flex">
                {/* ── Product image ── */}
                <Link
                  href={getProductUrl(item.product)}
                  className="flex-shrink-0 w-28 sm:w-32 bg-muted overflow-hidden"
                >
                  {firstImage ? (
                    <img
                      src={firstImage}
                      alt={item.product.name}
                      className="w-full h-full object-cover aspect-[3/4] hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full aspect-[3/4] flex items-center justify-center">
                      <ShoppingBag className="w-8 h-8 text-muted-foreground/30" />
                    </div>
                  )}
                </Link>

                {/* ── Content ── */}
                <CardContent className="flex-1 min-w-0 p-4 flex flex-col justify-between">
                  {/* Top: name + remove */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-foreground leading-snug truncate">
                        <Link
                          href={getProductUrl(item.product)}
                          className="hover:text-muted-foreground transition-colors"
                        >
                          {item.product.name}
                        </Link>
                      </h3>

                      {/* Attribute + savings badges */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        {variantInfo && (
                          <Badge variant="secondary" className="text-xs font-normal">
                            {variantInfo.size}
                          </Badge>
                        )}
                        {item.product.color?.name && (
                          <Badge variant="secondary" className="text-xs font-normal">
                            {item.product.color.name}
                          </Badge>
                        )}
                        {lineSavings > 0 && (
                          <Badge className="text-xs bg-green-100 text-green-700 border-green-200 hover:bg-green-100">
                            Save {formatPrice(lineSavings)}
                          </Badge>
                        )}
                        {atStockLimit && (
                          <Badge variant="outline" className="text-xs text-amber-600 border-amber-300 bg-amber-50">
                            Max {availableStock}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Remove */}
                    <button
                      onClick={() => removeFromCart(item.id)}
                      disabled={updating === item.id}
                      aria-label="Remove item"
                      className="flex-shrink-0 -mt-0.5 -mr-0.5 p-1 rounded-md text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 disabled:opacity-40 disabled:pointer-events-none transition-colors touch-manipulation"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Bottom: price + stepper + line total */}
                  <div className="flex items-end justify-between mt-3 gap-2">
                    {/* Unit price */}
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-base font-bold text-foreground">
                        {formatPrice(effectivePrice)}
                      </span>
                      {price.hasDiscount && (
                        <span className="text-xs text-muted-foreground line-through">
                          {formatPrice(price.original)}
                        </span>
                      )}
                    </div>

                    {/* Stepper + line total */}
                    <div className="flex items-center gap-3">
                      {/* Qty stepper */}
                      <div className="flex items-center rounded-lg border border-input bg-background overflow-hidden">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={updating === item.id || item.quantity <= 1}
                          aria-label="Decrease quantity"
                          className="h-8 w-8 flex items-center justify-center text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:pointer-events-none transition-colors touch-manipulation"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center text-sm font-semibold text-foreground select-none">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={updating === item.id || atStockLimit}
                          title={atStockLimit ? `Only ${availableStock} in stock` : undefined}
                          aria-label="Increase quantity"
                          className="h-8 w-8 flex items-center justify-center text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:pointer-events-none disabled:cursor-not-allowed transition-colors touch-manipulation"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Line total */}
                      <span className="text-sm font-bold text-foreground w-16 text-right tabular-nums">
                        {formatPrice(lineTotal)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </div>
            </Card>
          );
        })}
      </div>

      {/* ── Desktop summary bar ── */}
      <div className="hidden lg:block mt-8">
        <Separator className="mb-6" />
        <div className="flex items-center justify-between gap-6">
          {/* Left: meta */}
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            {totalSavings > 0 && (
              <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100 font-medium">
                You save {formatPrice(totalSavings)}
              </Badge>
            )}
            <span>
              Subtotal{" "}
              <span className="font-semibold text-foreground">{formatPrice(subtotal)}</span>
            </span>
            <span>
              Shipping{" "}
              <span className={`font-semibold ${shipping === 0 ? "text-green-600" : "text-foreground"}`}>
                {shipping === 0 ? "FREE" : formatPrice(shipping)}
              </span>
            </span>
          </div>

          {/* Right: total + CTA */}
          <div className="flex items-center gap-5">
            <div className="text-right">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Total</p>
              <p className="text-2xl font-bold text-foreground tabular-nums">
                {formatPrice(total)}
              </p>
            </div>
            <Button asChild size="lg" className="px-8 h-12 text-sm font-semibold">
              {isGuest ? (
                <Link href="/login?redirect=/checkout">Sign In to Checkout</Link>
              ) : (
                <Link href="/checkout">Checkout</Link>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* ── Mobile fixed bottom bar ── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-t shadow-xl">
        <div className="px-4 pt-3 pb-5 space-y-3 max-w-lg mx-auto">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-3 text-muted-foreground">
              <span>
                Subtotal{" "}
                <span className="font-semibold text-foreground">{formatPrice(subtotal)}</span>
              </span>
              <Separator orientation="vertical" className="h-4" />
              <span>
                Ship{" "}
                <span className={`font-semibold ${shipping === 0 ? "text-green-600" : "text-foreground"}`}>
                  {shipping === 0 ? "FREE" : formatPrice(shipping)}
                </span>
              </span>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide leading-none mb-0.5">
                Total
              </p>
              <p className="text-lg font-bold text-foreground tabular-nums">{formatPrice(total)}</p>
            </div>
          </div>

          {totalSavings > 0 && (
            <p className="text-xs text-green-600 text-center font-medium -mt-1">
              You're saving {formatPrice(totalSavings)} on this order
            </p>
          )}

          <Button
            asChild
            size="lg"
            className="w-full h-12 text-sm font-semibold touch-manipulation active:scale-[0.98] transition-transform"
          >
            {isGuest ? (
              <Link href="/login?redirect=/checkout">Sign In to Checkout</Link>
            ) : (
              <Link href="/checkout">Checkout · {formatPrice(total)}</Link>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
