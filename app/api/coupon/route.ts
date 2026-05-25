import { NextRequest, NextResponse } from "next/server";
import { couponsService } from "./couponsService";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/server";
import { cartServices } from "../cart/cartService";
import { getEffectivePrice } from "@/lib/pricing-utils";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { code, orderAmount: clientOrderAmount } = await req.json();

    if (!code) {
      return NextResponse.json(
        { message: "Coupon code is required" },
        { status: 400 }
      );
    }

    // Compute order amount server-side from the user's actual cart
    let orderAmount = clientOrderAmount;
    try {
      const cartData = await cartServices.getCartItems(session.user.id);
      if (cartData.cart.length > 0) {
        orderAmount = cartData.cart.reduce((sum: number, item: any) => {
          const price = getEffectivePrice(item.product);
          return sum + price * item.quantity;
        }, 0);
      }
    } catch {
      // Fall back to client-provided amount if cart fetch fails
    }

    // Find coupon by code
    const coupon = await couponsService.getCouponByCode(code);

    if (!coupon) {
      return NextResponse.json(
        { message: "Invalid coupon code" },
        { status: 404 }
      );
    }

    // Validate coupon
    const validation = await couponsService.validateCoupon(coupon.id, session.user.id, orderAmount);

    if (!validation.isValid) {
      return NextResponse.json(
        { 
          message: validation.message || "Coupon is not valid",
          coupon: null 
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: "Coupon applied successfully",
      coupon: validation.coupon,
      discountAmount: validation.discountAmount
    });

  } catch (error) {
    console.error("Coupon validation error:", error);
    return NextResponse.json(
      { message: "Failed to validate coupon" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json(
        { message: "Coupon code is required" },
        { status: 400 }
      );
    }

    const coupon = await couponsService.getCouponByCode(code);

    if (!coupon) {
      return NextResponse.json(
        { message: "Coupon not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      coupon
    });

  } catch (error) {
    console.error("Get coupon error:", error);
    return NextResponse.json(
      { message: "Failed to get coupon" },
      { status: 500 }
    );
  }
}
