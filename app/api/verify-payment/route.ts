import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/server";
import { cartServices } from "../cart/cartService";
import { stockTransactionService } from "@/lib/services/stockTransactionService";
import { db } from "@/lib/db";
import { orders } from "@/shared";
import { eq } from "drizzle-orm";
import { calculatePricing, getEffectivePrice } from "@/lib/pricing-utils";
import { couponsService } from "../coupon/couponsService";
import { publishRealtimeEvent } from "@/realtime/publisher";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 },
      );
    }
    const user = session.user;
    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      shippingAddress,
      phone,
      notes,
      couponId,
    } = await req.json();

    // ── 1. Verify Razorpay signature ──────────────────────────────────────────
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!razorpayKeySecret) {
      console.error("[verify-payment] RAZORPAY_KEY_SECRET is not set");
      return NextResponse.json({ message: "Payment configuration error" }, { status: 500 });
    }

    const generatedSignature = crypto
      .createHmac("sha256", razorpayKeySecret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    if (generatedSignature !== razorpaySignature) {
      return NextResponse.json(
        { message: "Payment verification failed" },
        { status: 400 },
      );
    }

    // ── 2. Idempotency: return existing order if payment already processed ────
    const existingOrder = await db
      .select()
      .from(orders)
      .where(eq(orders.razorpayPaymentId, razorpayPaymentId))
      .limit(1);

    if (existingOrder.length > 0) {
      return NextResponse.json({
        orderId: existingOrder[0].id,
        message: "Order already exists for this payment",
      });
    }

    // ── 3. Fetch cart ─────────────────────────────────────────────────────────
    const cartItems = await cartServices.getCartItems(user.id);

    if (cartItems.cart.length === 0) {
      return NextResponse.json(
        { message: "Cart is empty. Cannot create order." },
        { status: 400 },
      );
    }

    // ── 4. Validate stock (read-only check before deduction) ─────────────────
    const stockValidation =
      await stockTransactionService.validateStockAvailability(cartItems.cart);
    if (!stockValidation.valid) {
      return NextResponse.json(
        {
          message: stockValidation.message,
          productId: stockValidation.productId,
        },
        { status: 400 },
      );
    }

    // ── 5. Re-validate coupon at payment time (prevents stale coupon abuse) ───
    let coupon = null;
    if (couponId) {
      // Calculate subtotal for min-order validation
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

    // ── 6. Calculate final pricing ────────────────────────────────────────────
    const pricing = calculatePricing(cartItems.cart, coupon);

    // ── 7. Atomically deduct stock ────────────────────────────────────────────
    const stockResult = await stockTransactionService.validateAndDeductStock(
      cartItems.cart,
      razorpayOrderId,
    );

    if (!stockResult.success) {
      return NextResponse.json(
        {
          message: stockResult.message,
          productId: stockResult.productId,
        },
        { status: 400 },
      );
    }

    // ── 8. Create order (wrapped in transaction — rolls back stock on failure) ─
    let order;
    try {
      order = await couponsService.createOrderWithCoupon(
        {
          userId: user.id,
          totalAmount: pricing.subtotal.toString(),
          discountAmount: pricing.discountAmount.toString(),
          finalAmount: pricing.totalAmount.toString(),
          shippingAddress:
            typeof shippingAddress === "object"
              ? JSON.stringify(shippingAddress)
              : shippingAddress,
          phone,
          notes,
          couponId,
          status: "processing",
          paymentStatus: "paid",
          paymentMethod: "razorpay",
          razorpayPaymentId,
        },
        cartItems.cart.map((item) => {
          const variant = item.variantId
            ? (item.product as any).variants?.find(
                (v: any) => v.id === item.variantId,
              )
            : null;
          const variantPrice = variant?.price ? parseFloat(variant.price) : null;
          const effectivePrice = variantPrice ?? getEffectivePrice(item.product);

          return {
            productId: item.productId,
            variantId: item.variantId || undefined,
            quantity: item.quantity,
            price: effectivePrice.toString(),
            productPrice: item.product.price.toString(),
            discountedPrice: effectivePrice.toString(),
            offerDetails: (item.product as any).activeSale || null,
          };
        }),
        couponId,
        user.id,
        pricing.discountAmount.toString(),
      );
    } catch (orderErr) {
      // Order creation failed after stock was deducted — restore stock so
      // inventory is not permanently lost. Best-effort; log if it also fails.
      try {
        await stockTransactionService.restoreStock(cartItems.cart, razorpayOrderId);
      } catch (restoreErr) {
        console.error("[verify-payment] Failed to restore stock after order creation error:", restoreErr);
      }
      throw orderErr;
    }

    // ── 9. Clear cart after successful order creation ─────────────────────────
    await cartServices.clearCart(user.id);

    // ── 10. Notify admin/inventory of new order in real-time ──────────────────
    await publishRealtimeEvent("order_event", {
      target: { role: "admin" },
    });

    return NextResponse.json({
      orderId: order.id,
      message: "Payment successful",
    });
  } catch (err) {
    console.error("[verify-payment] Error:", err);
    return NextResponse.json(
      { message: "Payment verification failed" },
      { status: 500 },
    );
  }
}
