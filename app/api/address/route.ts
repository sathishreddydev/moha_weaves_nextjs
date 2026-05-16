import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { addressService } from "./addressService";
import { InsertUserAddress } from "@/shared";
import { authOptions } from "@/auth/server";
import { z } from "zod";

const addressSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  phone: z
    .string()
    .regex(
      /^(\+91[\-\s]?)?[6-9]\d{9}$/,
      "Enter a valid 10-digit Indian mobile number"
    ),
  addressLine1: z
    .string()
    .min(5, "Address line 1 must be at least 5 characters")
    .max(200),
  locality: z.string().min(2, "Locality must be at least 2 characters").max(200),
  city: z.string().min(2, "City must be at least 2 characters").max(100),
  state: z.string().min(2, "State is required").max(100),
  pincode: z
    .string()
    .regex(/^[1-9][0-9]{5}$/, "Enter a valid 6-digit pincode"),
  isDefault: z.boolean().optional().default(false),
  addressType: z.enum(["home", "work", "other"]).default("home"),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const addresses = await addressService.getUserAddresses(session.user.id);

    return NextResponse.json({
      success: true,
      data: addresses,
    });
  } catch (error) {
    console.error("Error fetching addresses:", error);
    return NextResponse.json(
      { error: "Failed to fetch addresses" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = addressSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const addressData: InsertUserAddress = {
      ...validation.data,
      userId: session.user.id,
    };

    const addresses = await addressService.createUserAddress(addressData);

    return NextResponse.json({
      success: true,
      data: addresses,
    });
  } catch (error) {
    console.error("Error creating address:", error);
    return NextResponse.json(
      { error: "Failed to create address" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id, ...updateData } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "Address ID is required" },
        { status: 400 }
      );
    }

    const validation = addressSchema.partial().safeParse(updateData);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const addresses = await addressService.updateUserAddress(id, validation.data);

    return NextResponse.json({
      success: true,
      data: addresses,
    });
  } catch (error) {
    console.error("Error updating address:", error);
    return NextResponse.json(
      { error: "Failed to update address" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: "Address ID is required" },
        { status: 400 }
      );
    }

    const addresses = await addressService.deleteUserAddress(id);

    return NextResponse.json({
      success: true,
      data: addresses,
    });
  } catch (error) {
    console.error("Error deleting address:", error);
    return NextResponse.json(
      { error: "Failed to delete address" },
      { status: 500 }
    );
  }
}