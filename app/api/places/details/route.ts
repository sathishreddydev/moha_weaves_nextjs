import { NextRequest, NextResponse } from "next/server";

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

export async function GET(request: NextRequest) {
  const placeId = request.nextUrl.searchParams.get("placeId");

  if (!placeId) {
    return NextResponse.json(
      { error: "Place ID is required" },
      { status: 400 }
    );
  }

  if (!GOOGLE_MAPS_API_KEY) {
    return NextResponse.json(
      { error: "Google Maps API key not configured" },
      { status: 500 }
    );
  }

  try {
    const url = new URL(
      "https://maps.googleapis.com/maps/api/place/details/json"
    );
    url.searchParams.set("place_id", placeId);
    url.searchParams.set("key", GOOGLE_MAPS_API_KEY);
    url.searchParams.set(
      "fields",
      "address_components,formatted_address,geometry"
    );

    const res = await fetch(url.toString());
    const data = await res.json();

    if (data.status === "OK" && data.result) {
      const components = data.result.address_components || [];

      const getComponent = (type: string): string => {
        const comp = components.find(
          (c: { types: string[]; long_name: string }) => c.types.includes(type)
        );
        return comp?.long_name || "";
      };

      // Build address line from street number + route
      const streetNumber = getComponent("street_number");
      const route = getComponent("route");
      const premise = getComponent("premise");
      const subpremise = getComponent("subpremise");

      let addressLine1 = "";
      if (premise) {
        addressLine1 = subpremise
          ? `${premise}, ${subpremise}`
          : premise;
      }
      if (route) {
        addressLine1 = addressLine1
          ? `${addressLine1}, ${streetNumber} ${route}`.trim()
          : `${streetNumber} ${route}`.trim();
      }
      if (!addressLine1) {
        addressLine1 = data.result.formatted_address?.split(",")[0] || "";
      }

      const locality =
        getComponent("sublocality_level_1") ||
        getComponent("sublocality") ||
        getComponent("neighborhood") ||
        "";

      const city =
        getComponent("locality") ||
        getComponent("administrative_area_level_3") ||
        "";

      const state = getComponent("administrative_area_level_1");
      const pincode = getComponent("postal_code");

      return NextResponse.json({
        address: {
          addressLine1,
          locality,
          city,
          state,
          pincode,
        },
        formattedAddress: data.result.formatted_address,
      });
    }

    return NextResponse.json(
      { error: "Could not get place details" },
      { status: 404 }
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch place details" },
      { status: 500 }
    );
  }
}
