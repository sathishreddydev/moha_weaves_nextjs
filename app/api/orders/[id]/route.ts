import { NextRequest, NextResponse } from "next/server";
import { orderService } from "../orderService";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json(
      { message: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const user = session.user;

    const order = await orderService.getOrder(params.id);

    if (!order || order.userId !== user.id) {
      return NextResponse.json(
        { message: "Order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(order);

  } catch {
    return NextResponse.json(
      { message: "Failed to fetch order" },
      { status: 500 }
    );
  }
}