import { authOptions } from "@/auth/server";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { orderService } from "./orderService";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 },
      );
    }

    // Get pagination parameters from query string
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");

    // Validate parameters
    if (page < 1 || pageSize < 1 || pageSize > 100) {
      return NextResponse.json(
        { message: "Invalid pagination parameters" },
        { status: 400 },
      );
    }

    const paginatedOrders = await orderService.getOrders(
      session.user.id,
      page,
      pageSize,
    );

    return NextResponse.json(paginatedOrders);
  } catch {
    return NextResponse.json(
      { message: "Failed to fetch orders" },
      { status: 500 },
    );
  }
}
