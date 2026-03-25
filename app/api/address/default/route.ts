import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { addressService } from "../addressService";
import { authOptions } from "@/auth/server";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { addressId } = await request.json();
    
    if (!addressId) {
      return NextResponse.json(
        { error: "Address ID is required" },
        { status: 400 }
      );
    }

    const addresses = await addressService.setDefaultAddress(
      session.user.id,
      addressId
    );
    
    return NextResponse.json({
      success: true,
      data: addresses,
    });
  } catch (error) {
    console.error("Error setting default address:", error);
    return NextResponse.json(
      { error: "Failed to set default address" },
      { status: 500 }
    );
  }
}
