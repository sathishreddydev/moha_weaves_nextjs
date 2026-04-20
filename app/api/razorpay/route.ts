import { NextRequest, NextResponse } from "next/server";
import { cartServices } from "../cart/cartService";
import { couponsService } from "../coupon/couponsService";
import { razorpay } from "@/lib/razorpay/razorpayClient";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/server";

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

        // Validate stock availability before creating order
        for (const item of cartItems.cart) {
            if (item.product.onlineStock < item.quantity) {
                return NextResponse.json(
                    { 
                        message: `Insufficient stock for ${item.product.name}. Only ${item.product.onlineStock} items available.`,
                        productId: item.productId 
                    },
                    { status: 400 }
                );
            }
        }

        const totalAmount = cartItems.cart.reduce((sum, item) => {
            const price = (item.product as any).discountedPrice 
                ? (item.product as any).discountedPrice
                : typeof item.product.price === "string"
                    ? parseFloat(item.product.price)
                    : item.product.price;

            return sum + price * item.quantity;
        }, 0);

        let discountAmount = 0;

        if (couponId) {
            const coupon = await couponsService.getCoupon(couponId);

            if (coupon && coupon.isActive) {
                if (coupon.type === "percentage") {
                    discountAmount = (totalAmount * parseFloat(coupon.value)) / 100;
                } else {
                    discountAmount = parseFloat(coupon.value);
                }
            }
        }

        const finalAmount = totalAmount - discountAmount;

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