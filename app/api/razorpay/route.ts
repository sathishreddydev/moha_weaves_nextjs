import { NextRequest, NextResponse } from "next/server";
import { cartServices } from "../cart/cartService";
import { couponsService } from "../coupon/couponsService";
import { razorpay } from "@/lib/razorpay/razorpayClient";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/server";
import { calculatePricing, validateStockAvailability } from "@/lib/pricing-utils";

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);

    if (!session) {
        return NextResponse.json(
            { message: "Unauthorized" },
            { status: 401 }
        );
    }
    try {
        const user = session.user;
        const { couponId } = await req.json();

        const cartItems = await cartServices.getCartItems(user.id);

        if (cartItems.cart.length === 0) {
            return NextResponse.json(
                { message: "Cart is empty" },
                { status: 400 }
            );
        }

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
            coupon = await couponsService.getCoupon(couponId);
        }

        // Calculate pricing using shared utility
        const pricing = calculatePricing(cartItems.cart, coupon);
        const finalAmount = pricing.totalAmount;

        const razorpayOrder = await razorpay.orders.create({
            amount: Math.round(finalAmount * 100),
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
        console.error(err);

        return NextResponse.json(
            { message: "Failed to create Razorpay order" },
            { status: 500 }
        );
    }
}