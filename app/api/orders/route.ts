import { NextRequest, NextResponse } from "next/server";
import { orderService } from "./orderService";
import { cartServices } from "../cart/cartService";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/server";
import { couponsService } from "../coupon/couponsService";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        // Get pagination parameters from query string
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1');
        const pageSize = parseInt(searchParams.get('pageSize') || '10');

        // Validate parameters
        if (page < 1 || pageSize < 1 || pageSize > 100) {
            return NextResponse.json(
                { message: "Invalid pagination parameters" },
                { status: 400 }
            );
        }

        const paginatedOrders = await orderService.getOrders(session.user.id, page, pageSize);

        return NextResponse.json(paginatedOrders);
    } catch {
        return NextResponse.json(
            { message: "Failed to fetch orders" },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const body = await req.json();

        const { shippingAddress, phone, notes, couponId } = body;

        const cartItems = await cartServices.getCartItems(session.user.id);

        if (cartItems.cart.length === 0) {
            return NextResponse.json(
                { message: "Cart is empty" },
                { status: 400 }
            );
        }

        const totalAmount = cartItems.cart.reduce((sum, item) => {
            const originalPrice =
                typeof item.product.price === "string"
                    ? parseFloat(item.product.price)
                    : item.product.price;

            const price = (item.product as any).discountedPrice ?? originalPrice;

            return sum + price * item.quantity;
        }, 0);

        let discountAmount = 0;
        let validCoupon = null;

        if (couponId) {
            const coupon = await couponsService.getCoupon(couponId);

            if (coupon && coupon.isActive) {
                validCoupon = coupon;

                if (coupon.type === "percentage") {
                    discountAmount = (totalAmount * parseFloat(coupon.value)) / 100;

                    if (coupon.maxDiscount) {
                        discountAmount = Math.min(
                            discountAmount,
                            parseFloat(coupon.maxDiscount)
                        );
                    }
                } else {
                    discountAmount = parseFloat(coupon.value);
                }
            }
        }

        const finalAmount = totalAmount - discountAmount;

        const order = await orderService.createOrder(
            {
                userId: session.user.id,
                totalAmount: totalAmount.toString(),
                discountAmount: discountAmount.toString(),
                finalAmount: finalAmount.toString(),
                couponId,
                shippingAddress,
                phone,
                notes,
                status: "created",
                paymentStatus: "pending",
            },
            cartItems.cart.map((item) => {
                const originalPrice =
                    typeof item.product.price === "string"
                        ? parseFloat(item.product.price)
                        : item.product.price;

                const effectivePrice =
                    (item.product as any).discountedPrice ?? originalPrice;

                return {
                    productId: item.productId,
                    quantity: item.quantity,
                    price: effectivePrice.toString(),
                };
            })
        );

        if (validCoupon && discountAmount > 0) {
            await couponsService.applyCoupon(
                validCoupon.id,
                session.user.id,
                order.id,
                discountAmount.toString()
            );
        }

        await cartServices.clearCart(session.user.id);

        return NextResponse.json({ orderId: order.id });

    } catch {
        return NextResponse.json(
            { message: "Failed to place order" },
            { status: 500 }
        );
    }
}