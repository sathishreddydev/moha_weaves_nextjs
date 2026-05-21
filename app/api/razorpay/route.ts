import { NextRequest, NextResponse } from "next/server";
import { cartServices } from "../cart/cartService";
import { couponsService } from "../coupon/couponsService";
import { razorpay } from "@/lib/razorpay/razorpayClient";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/server";
import { calculatePricing } from "@/lib/pricing-utils";
import { stockTransactionService } from "@/lib/services/stockTransactionService";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = session.user;
    const body = await req.json();
    const { couponId, previewOnly } = body;

    const cartItems = await cartServices.getCartItems(user.id);

    if (cartItems.cart.length === 0) {
      return NextResponse.json({ message: "Cart is empty" }, { status: 400 });
    }

    // ── Stock validation (read-only) ────────────────────────────────────────
    const stockValidation = await stockTransactionService.validateStockAvailability(
      cartItems.cart,
    );
    if (!stockValidation.valid) {
      return NextResponse.json(
        { message: stockValidation.message, productId: stockValidation.productId },
        { status: 400 },
      );
    }

    // ── Coupon validation ───────────────────────────────────────────────────
    let coupon = null;
    if (couponId) {
      const subtotalForValidation = cartItems.cart.reduce((sum: number, item: any) => {
        const product = item.product as any;
        const variant = item.variantId
          ? product.variants?.find((v: any) => v.id === item.variantId)
          : null;
        const variantPrice = variant?.price ? parseFloat(variant.price) : null;
        const price =
          variantPrice ??
          (product.discountedPrice ? product.discountedPrice : null) ??
          (typeof product.price === "string" ? parseFloat(product.price) : product.price);
        return sum + price * item.quantity;
      }, 0);

      const validation = await couponsService.validateCoupon(
        couponId,
        user.id,
        subtotalForValidation,
      );
      if (!validation.isValid) {
        return NextResponse.json(
          { message: validation.message || "Coupon is no longer valid" },
          { status: 400 },
        );
      }
      coupon = validation.coupon ?? null;
    }

    // ── Pricing ─────────────────────────────────────────────────────────────
    const pricing = calculatePricing(cartItems.cart, coupon);
    const amountInPaise = Math.round(pricing.totalAmount * 100);

    // ── previewOnly: return server-computed amount without creating a Razorpay
    // order. Used by the checkout UI to show the confirmed total before the
    // user clicks Pay — avoids creating abandoned orders on every page load.
    if (previewOnly) {
      return NextResponse.json({ amount: amountInPaise, currency: "INR" });
    }

    // ── Create Razorpay order ────────────────────────────────────────────────
    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: `r${Date.now()}`,
      payment_capture: true,
    });

    return NextResponse.json({
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
    });
  } catch (err) {
    console.error("[razorpay] Failed to create order:", err);
    return NextResponse.json(
      { message: "Failed to create Razorpay order" },
      { status: 500 },
    );
  }
}
