import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders, refunds, auditLogs, pendingPayments } from "@/shared";
import { eq, and } from "drizzle-orm";
import { refundService } from "@/app/api/orders/refundService/refundService";
import { publishRealtimeEvent } from "@/realtime/publisher";
import { cartServices } from "@/app/api/cart/cartService";
import { stockTransactionService } from "@/lib/services/stockTransactionService";
import { couponsService } from "@/app/api/coupon/couponsService";
import { calculatePricing, getEffectivePrice } from "@/lib/pricing-utils";

/**
 * Razorpay Webhook Handler
 *
 * URL to configure in Razorpay Dashboard:
 *   https://yourdomain.com/api/razorpay/webhook
 *
 * Events handled:
 *   - payment.captured     → Mark order as paid (confirms payment)
 *   - payment.failed       → Mark order payment as failed
 *   - payment.authorized   → Payment authorized (awaiting capture)
 *   - order.paid           → Razorpay order fully paid
 *   - refund.processed     → Refund completed successfully
 *   - refund.failed        → Refund failed
 *   - refund.created       → Refund initiated
 */

function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string
): boolean {
  try {
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get("x-razorpay-signature");
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error("[razorpay-webhook] RAZORPAY_WEBHOOK_SECRET not configured");
      return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
    }

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    const body = await request.text();

    if (!verifyWebhookSignature(body, signature, webhookSecret)) {
      console.error("[razorpay-webhook] Invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(body);
    const eventType = event.event;

    console.log(`[razorpay-webhook] Received event: ${eventType}`);

    switch (eventType) {
      // ── Payment Events ────────────────────────────────────────────────────
      case "payment.captured":
        await handlePaymentCaptured(event.payload.payment.entity);
        break;

      case "payment.failed":
        await handlePaymentFailed(event.payload.payment.entity);
        break;

      case "payment.authorized":
        await handlePaymentAuthorized(event.payload.payment.entity);
        break;

      case "order.paid":
        await handleOrderPaid(event.payload.order.entity, event.payload.payment?.entity);
        break;

      // ── Refund Events ─────────────────────────────────────────────────────
      case "refund.processed":
        await handleRefundProcessed(event.payload.refund.entity);
        break;

      case "refund.failed":
        await handleRefundFailed(event.payload.refund.entity);
        break;

      case "refund.created":
        await handleRefundCreated(event.payload.refund.entity);
        break;

      default:
        console.log(`[razorpay-webhook] Unhandled event: ${eventType}`);
    }

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("[razorpay-webhook] Processing error:", error);
    // Return 200 even on internal errors to prevent Razorpay from retrying
    // endlessly. Log the error for investigation.
    return NextResponse.json({ status: "error", message: "Internal error" }, { status: 200 });
  }
}

// ─── Payment Handlers ──────────────────────────────────────────────────────────

/**
 * payment.captured — Payment successfully captured.
 * This is the definitive confirmation that money has been received.
 */
async function handlePaymentCaptured(payment: any): Promise<void> {
  try {
    const razorpayPaymentId = payment.id;
    const razorpayOrderId = payment.order_id;

    // Find order by payment ID first
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.razorpayPaymentId, razorpayPaymentId))
      .limit(1);

    if (order) {
      // Order exists — just confirm payment status if needed
      if (order.paymentStatus !== "paid") {
        await db
          .update(orders)
          .set({
            paymentStatus: "paid",
            status: order.status === "created" ? "processing" : order.status,
            updatedAt: new Date(),
          })
          .where(eq(orders.id, order.id));

        console.log(`[razorpay-webhook] payment.captured: Order ${order.id} marked as paid`);

        await publishRealtimeEvent("order_event", {
          target: { role: "admin" },
        }).catch(() => {});
      }
      return;
    }

    // ── No order found — check if verify-payment never completed ─────────────
    // Look up the pending payment record to create the order from the webhook
    const [pending] = await db
      .select()
      .from(pendingPayments)
      .where(
        and(
          eq(pendingPayments.razorpayOrderId, razorpayOrderId),
          eq(pendingPayments.status, "pending")
        )
      )
      .limit(1);

    if (!pending) {
      console.warn(
        `[razorpay-webhook] payment.captured: No order or pending payment found for paymentId=${razorpayPaymentId}, orderId=${razorpayOrderId}`
      );
      return;
    }

    console.log(`[razorpay-webhook] payment.captured: Creating order from pending payment for user=${pending.userId}`);

    // Recreate the order from the saved cart snapshot
    const cartItems = pending.cartSnapshot as any[];

    if (!cartItems || cartItems.length === 0) {
      console.error(`[razorpay-webhook] payment.captured: Empty cart snapshot for pending payment ${pending.id}`);
      return;
    }

    // Validate and deduct stock
    const stockResult = await stockTransactionService.validateAndDeductStock(
      cartItems,
      razorpayOrderId,
    );

    if (!stockResult.success) {
      console.error(`[razorpay-webhook] payment.captured: Stock deduction failed for pending payment ${pending.id}: ${stockResult.message}`);
      // Payment captured but can't fulfill — needs manual intervention
      // Log to audit for admin visibility
      await db.insert(auditLogs).values({
        userId: pending.userId,
        action: "order_creation_failed_webhook",
        entityType: "payment",
        entityId: razorpayOrderId,
        oldValues: null,
        newValues: { razorpayPaymentId, reason: stockResult.message },
        notes: `Payment captured but order creation failed: ${stockResult.message}. Manual refund may be needed.`,
      }).catch(() => {});
      return;
    }

    // Calculate pricing
    let coupon = null;
    if (pending.couponId) {
      const subtotal = cartItems.reduce((sum: number, item: any) => {
        const effectivePrice = getEffectivePrice(item.product);
        return sum + effectivePrice * item.quantity;
      }, 0);
      const validation = await couponsService.validateCoupon(pending.couponId, pending.userId, subtotal);
      if (validation.isValid) coupon = validation.coupon ?? null;
    }
    const pricing = calculatePricing(cartItems, coupon);

    // Create the order
    const newOrder = await couponsService.createOrderWithCoupon(
      {
        userId: pending.userId,
        totalAmount: pricing.subtotal.toString(),
        discountAmount: pricing.discountAmount.toString(),
        finalAmount: pricing.totalAmount.toString(),
        shippingAddress: pending.shippingAddress || "{}",
        phone: pending.phone || "",
        notes: pending.notes,
        couponId: pending.couponId,
        status: "processing",
        paymentStatus: "paid",
        paymentMethod: "razorpay",
        razorpayPaymentId,
      },
      cartItems.map((item: any) => {
        const variant = item.variantId
          ? item.product?.variants?.find((v: any) => v.id === item.variantId)
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
          offerDetails: item.product?.activeSale || null,
        };
      }),
      pending.couponId || undefined,
      pending.userId,
      pricing.discountAmount.toString(),
      "confirmed",
    );

    // Mark pending payment as completed
    await db
      .update(pendingPayments)
      .set({ status: "completed", completedAt: new Date() })
      .where(eq(pendingPayments.id, pending.id));

    // Clear user's cart
    await cartServices.clearCart(pending.userId).catch(() => {});

    // Notify admin
    await publishRealtimeEvent("order_event", {
      target: { role: "admin" },
    }).catch(() => {});

    console.log(`[razorpay-webhook] payment.captured: Order ${newOrder.id} created from webhook for user=${pending.userId}`);
  } catch (error) {
    console.error("[razorpay-webhook] Error handling payment.captured:", error);
  }
}

/**
 * payment.failed — Payment attempt failed.
 * Logs to audit_logs so admins can see failed attempts (card declined,
 * insufficient funds, user abandoned, etc.). Useful for fraud detection
 * and customer support.
 */
async function handlePaymentFailed(payment: any): Promise<void> {
  try {
    const razorpayOrderId = payment.order_id;
    const errorCode = payment.error_code;
    const errorDescription = payment.error_description;
    const errorSource = payment.error_source;
    const errorReason = payment.error_reason;
    const contactEmail = payment.email;
    const contactPhone = payment.contact;
    const method = payment.method; // card, upi, netbanking, wallet
    const amount = payment.amount ? payment.amount / 100 : 0;

    // Get userId from order notes (we pass it when creating Razorpay order)
    const notes = payment.notes || {};
    const userId = notes.userId;

    // Only log to audit_logs if we have a valid userId (foreign key constraint)
    if (userId) {
      await db.insert(auditLogs).values({
        userId: userId,
        action: "payment_failed",
        entityType: "payment",
        entityId: razorpayOrderId || payment.id,
        oldValues: null,
        newValues: {
          razorpayPaymentId: payment.id,
          razorpayOrderId,
          amount,
          method,
          errorCode,
          errorReason,
          errorSource,
          errorDescription,
          contactEmail,
          contactPhone,
        },
        notes: `Payment of ₹${amount} failed: ${errorDescription || errorCode || "Unknown error"} (${method || "unknown method"})`,
      });
    }

    console.log(
      `[razorpay-webhook] payment.failed: user=${userId || "unknown"}, orderId=${razorpayOrderId}, ₹${amount}, ${method}, error=${errorCode}: ${errorDescription}`
    );
  } catch (error) {
    console.error("[razorpay-webhook] Error handling payment.failed:", error);
  }
}

/**
 * payment.authorized — Payment authorized but not yet captured.
 * With payment_capture: true (auto-capture), this fires right before
 * payment.captured. Mostly informational.
 */
async function handlePaymentAuthorized(payment: any): Promise<void> {
  try {
    console.log(
      `[razorpay-webhook] payment.authorized: paymentId=${payment.id}, amount=${payment.amount / 100}`
    );
    // With auto-capture enabled, payment.captured will follow shortly.
    // No action needed.
  } catch (error) {
    console.error("[razorpay-webhook] Error handling payment.authorized:", error);
  }
}

/**
 * order.paid — Razorpay order is fully paid.
 * Similar to payment.captured but at the order level.
 */
async function handleOrderPaid(razorpayOrder: any, payment?: any): Promise<void> {
  try {
    console.log(
      `[razorpay-webhook] order.paid: razorpayOrderId=${razorpayOrder.id}, amount=${razorpayOrder.amount_paid / 100}`
    );
    // This is a redundant confirmation — payment.captured already handles
    // the order update. But if payment.captured was missed, we can use this
    // as a fallback.
    if (payment?.id) {
      const [order] = await db
        .select()
        .from(orders)
        .where(eq(orders.razorpayPaymentId, payment.id))
        .limit(1);

      if (order && order.paymentStatus !== "paid") {
        await db
          .update(orders)
          .set({
            paymentStatus: "paid",
            status: order.status === "created" ? "processing" : order.status,
            updatedAt: new Date(),
          })
          .where(eq(orders.id, order.id));

        console.log(`[razorpay-webhook] order.paid: Order ${order.id} marked as paid (fallback)`);
      }
    }
  } catch (error) {
    console.error("[razorpay-webhook] Error handling order.paid:", error);
  }
}

// ─── Refund Handlers ───────────────────────────────────────────────────────────

/**
 * refund.processed — Refund completed successfully.
 */
async function handleRefundProcessed(refundEntity: any): Promise<void> {
  try {
    const [refund] = await db
      .select()
      .from(refunds)
      .where(eq(refunds.razorpayRefundId, refundEntity.id))
      .limit(1);

    if (!refund) {
      console.warn(`[razorpay-webhook] refund.processed: No refund found for ${refundEntity.id}`);
      return;
    }

    await refundService.processRefundManually(refund.id, "completed");
    console.log(`[razorpay-webhook] refund.processed: Refund ${refund.id} completed`);
  } catch (error) {
    console.error("[razorpay-webhook] Error handling refund.processed:", error);
  }
}

/**
 * refund.failed — Refund attempt failed.
 */
async function handleRefundFailed(refundEntity: any): Promise<void> {
  try {
    const [refund] = await db
      .select()
      .from(refunds)
      .where(eq(refunds.razorpayRefundId, refundEntity.id))
      .limit(1);

    if (!refund) {
      console.warn(`[razorpay-webhook] refund.failed: No refund found for ${refundEntity.id}`);
      return;
    }

    await db
      .update(refunds)
      .set({
        status: "failed",
        failureReason: refundEntity.error_description || "Refund failed via webhook",
      })
      .where(eq(refunds.id, refund.id));

    console.log(`[razorpay-webhook] refund.failed: Refund ${refund.id} marked as failed`);
  } catch (error) {
    console.error("[razorpay-webhook] Error handling refund.failed:", error);
  }
}

/**
 * refund.created — Refund initiated on Razorpay's side.
 */
async function handleRefundCreated(refundEntity: any): Promise<void> {
  try {
    const [refund] = await db
      .select()
      .from(refunds)
      .where(eq(refunds.razorpayRefundId, refundEntity.id))
      .limit(1);

    if (!refund) {
      // This might be a refund created from Razorpay dashboard directly
      console.warn(`[razorpay-webhook] refund.created: No refund found for ${refundEntity.id}`);
      return;
    }

    await db
      .update(refunds)
      .set({
        status: "processing",
        razorpayRefundId: refundEntity.id,
        initiatedAt: new Date(),
      })
      .where(eq(refunds.id, refund.id));

    console.log(`[razorpay-webhook] refund.created: Refund ${refund.id} marked as processing`);
  } catch (error) {
    console.error("[razorpay-webhook] Error handling refund.created:", error);
  }
}
