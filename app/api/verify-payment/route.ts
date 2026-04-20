import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/server";
import { cartServices } from "../cart/cartService";
import { orderService } from "../orders/orderService";
import { db } from "@/lib/db";
import { orders } from "@/shared";
import { eq } from "drizzle-orm";
import { calculatePricing, validateStockAvailability, getEffectivePrice } from "@/lib/pricing-utils";

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const user = session.user
        const {
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature,
            shippingAddress,
            phone,
            notes,
            couponId,
        } = await req.json();

        const generatedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
            .update(`${razorpayOrderId}|${razorpayPaymentId}`)
            .digest("hex");

        if (generatedSignature !== razorpaySignature) {
            return NextResponse.json(
                { message: "Payment verification failed" },
                { status: 400 }
            );
        }

        // Check if order already exists for this payment id (idempotency)
        const existingOrder = await db.select().from(orders).where(eq(orders.razorpayPaymentId, razorpayPaymentId)).limit(1);
        
        if (existingOrder.length > 0) {
            return NextResponse.json({
                orderId: existingOrder[0].id,
                message: "Order already exists for this payment",
            });
        }

        const cartItems = await cartServices.getCartItems(user.id);

        // Validate stock availability using shared utility
        const stockValidation = await validateStockAvailability(cartItems.cart);
        if (!stockValidation.valid) {
            return NextResponse.json(
                { 
                    message: stockValidation.message,
                    productId: stockValidation.productId 
                },
                { status: 400 }
            );
        }

        // Get coupon details if provided
        let coupon = null;
        if (couponId) {
            const { couponsService } = await import("../coupon/couponsService");
            coupon = await couponsService.getCoupon(couponId);
        }

        // Calculate pricing using shared utility
        const pricing = calculatePricing(cartItems.cart, coupon);

        // Create order and clear cart in a single transaction
        const result = await db.transaction(async (tx) => {
            const order = await orderService.createOrder(
                {
                    userId: user.id,
                    totalAmount: pricing.subtotal.toString(),
                    discountAmount: pricing.discountAmount.toString(),
                    finalAmount: pricing.totalAmount.toString(),
                    shippingAddress,
                    phone,
                    notes,
                    couponId,
                    status: "created",
                    paymentStatus: "paid",
                    paymentMethod: "razorpay",
                    razorpayPaymentId,
                },
                cartItems.cart.map((item) => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    price: getEffectivePrice(item.product).toString(),
                }))
            );

            // Clear cart only after successful order creation
            await cartServices.clearCart(user.id);
            
            return order;
        });

        return NextResponse.json({
            orderId: result.id,
            message: "Payment successful",
        });

    } catch (err) {
        console.error(err);

        return NextResponse.json(
            { message: "Payment verification failed" },
            { status: 500 }
        );
    }
}