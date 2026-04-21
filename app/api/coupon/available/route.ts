import { NextRequest, NextResponse } from "next/server";
import { couponsService } from "../couponsService";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/server";

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
    const orderAmount = searchParams.get('orderAmount');

    // Get coupons with usage status
    const couponsData = await couponsService.getCouponsWithUsageStatus(
      session.user.id,
      orderAmount ? parseFloat(orderAmount) : undefined
    );

    return NextResponse.json(couponsData);

  } catch (error) {
    console.error("Get available coupons error:", error);
    return NextResponse.json(
      { message: "Failed to get available coupons" },
      { status: 500 }
    );
  }
}
