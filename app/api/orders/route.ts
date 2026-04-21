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
            const validation = await couponsService.validateCoupon(couponId, session.user.id, totalAmount);
            
            if (!validation.isValid) {
                return NextResponse.json(
                    { message: validation.message || "Invalid coupon" },
                    { status: 400 }
                );
            }
            
            validCoupon = validation.coupon;
            discountAmount = validation.discountAmount || 0;
        }

        const finalAmount = totalAmount - discountAmount;


        const order = await couponsService.createOrderWithCoupon(
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
            }),
            validCoupon?.id,
            session.user.id,
            discountAmount.toString()
        );

        await cartServices.clearCart(session.user.id);

        return NextResponse.json({ orderId: order.id });

    } catch (error) {
        console.error("Order creation error:", error);
        
        // Handle specific database constraint violations
        if (error && typeof error === 'object' && 'code' in error) {
            if (error.code === '23505') { // Unique constraint violation
                return NextResponse.json(
                    { message: "Coupon has already been used" },
                    { status: 400 }
                );
            }
        }
        
        return NextResponse.json(
            { message: "Failed to place order" },
            { status: 500 }
        );
    }
}