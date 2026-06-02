import { NextRequest, NextResponse } from "next/server";

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

interface PostOffice {
  Name: string;
  District: string;
  Division: string;
  Region: string;
  Block: string;
  State: string;
}

/**
 * Pincode validation — hybrid approach:
 * 1. India Post API for accurate district/state (official postal data)
 * 2. Google Geocoding as fallback
 *
 * For city: picks the most common District among all post offices in the pincode
 * This gives the exact administrative district (e.g., "K.V.Rangareddy" not "Hyderabad")
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ pincode: string }> }
) {
  const { pincode } = await params;

  if (!/^[1-9][0-9]{5}$/.test(pincode)) {
    return NextResponse.json(
      { available: false, message: "Invalid pincode format" },
      { status: 400 }
    );
  }

  // Try India Post API first (most accurate for Indian pincodes)
  try {
    const indiaPostRes = await fetch(
      `https://api.postalpincode.in/pincode/${pincode}`,
      { next: { revalidate: 86400 } }
    );
    const indiaPostData = await indiaPostRes.json();

    if (
      indiaPostData?.[0]?.Status === "Success" &&
      indiaPostData[0].PostOffice?.length > 0
    ) {
      const postOffices: PostOffice[] = indiaPostData[0].PostOffice;

      // Get the most frequent district (majority wins)
      const districtCounts: Record<string, number> = {};
      for (const po of postOffices) {
        const d = po.District;
        districtCounts[d] = (districtCounts[d] || 0) + 1;
      }

      // Sort by count descending, pick the most common district
      const sortedDistricts = Object.entries(districtCounts).sort(
        (a, b) => b[1] - a[1]
      );
      const city = sortedDistricts[0][0]; // Most common district
      const state = postOffices[0].State;

      return NextResponse.json({
        available: true,
        city,
        state,
        deliveryDays: 5,
      });
    }
  } catch {
    // India Post failed, fall through to Google
  }

  // Fallback: Google Geocoding
  if (!GOOGLE_MAPS_API_KEY) {
    return NextResponse.json(
      { available: false, message: "Could not verify pincode" },
      { status: 500 }
    );
  }

  try {
    const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
    url.searchParams.set("address", pincode);
    url.searchParams.set("components", `country:IN|postal_code:${pincode}`);
    url.searchParams.set("key", GOOGLE_MAPS_API_KEY);

    const res = await fetch(url.toString());
    const data = await res.json();

    if (data.status === "OK" && data.results?.length > 0) {
      const components = data.results[0].address_components || [];

      const getComponent = (type: string): string => {
        const comp = components.find(
          (c: { types: string[]; long_name: string }) => c.types.includes(type)
        );
        return comp?.long_name || "";
      };

      const city =
        getComponent("administrative_area_level_2") ||
        getComponent("locality") ||
        getComponent("administrative_area_level_3") ||
        "";

      const state = getComponent("administrative_area_level_1");

      if (city || state) {
        return NextResponse.json({
          available: true,
          city,
          state,
          deliveryDays: 5,
        });
      }
    }

    return NextResponse.json({
      available: false,
      message: "Invalid pincode or delivery not available",
    });
  } catch {
    return NextResponse.json(
      { available: false, message: "Failed to check pincode" },
      { status: 500 }
    );
  }
}
