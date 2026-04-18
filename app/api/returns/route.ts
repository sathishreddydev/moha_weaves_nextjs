import { NextRequest, NextResponse } from "next/server";
import { returnService } from "../orders/returnService/returnService";
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
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;

    const returnRequests = await returnService.getReturnRequests({
      userId: session.user.id,
      status,
      search,
      page,
      pageSize,
    });

    return NextResponse.json(returnRequests);
  } catch (error) {
    console.error("Error fetching return requests:", error);
    return NextResponse.json(
      { message: "Failed to fetch return requests" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { orderId, reason, reasonDetails, resolution, items } = body;

    if (!orderId || !reason || !items || !Array.isArray(items)) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create return request
    const returnRequest = await returnService.createReturnRequest(
      {
        userId: session.user.id,
        orderId,
        reason,
        reasonDetails,
        resolution: resolution || "refund",
        status: "return_requested",
      },
      items
    );

    return NextResponse.json(returnRequest);
  } catch (error) {
    console.error("Error creating return request:", error);
    return NextResponse.json(
      { message: "Failed to create return request" },
      { status: 500 }
    );
  }
}
