import { NextRequest, NextResponse } from "next/server";
import postalcodes from "postalcodes-india";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ pincode: string }> }
) {
  const { pincode } = await params;

  // Validate format
  if (!/^[1-9][0-9]{5}$/.test(pincode)) {
    return NextResponse.json(
      { available: false, message: "Invalid pincode format" },
      { status: 400 }
    );
  }

  try {
    const info = postalcodes.find(pincode);

    if (info && info.isValid) {
      return NextResponse.json({
        available: true,
        city: info.place,
        state: info.state,
        deliveryDays: 5,
      });
    }

    return NextResponse.json({
      available: false,
      message: "Delivery not available in this area",
    });
  } catch {
    return NextResponse.json(
      { message: "Failed to check pincode" },
      { status: 500 }
    );
  }
}
