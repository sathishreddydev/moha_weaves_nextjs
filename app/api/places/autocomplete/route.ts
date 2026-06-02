import { NextRequest, NextResponse } from "next/server";

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

export async function GET(request: NextRequest) {
  const input = request.nextUrl.searchParams.get("input");
  const pincode = request.nextUrl.searchParams.get("pincode");

  if (!input || input.length < 3) {
    return NextResponse.json({ suggestions: [] });
  }

  if (!GOOGLE_MAPS_API_KEY) {
    return NextResponse.json(
      { error: "Google Maps API key not configured" },
      { status: 500 }
    );
  }

  try {
    // Step 1: Geocode the pincode to get center coordinates
    let locationBias: { lat: number; lng: number } | null = null;

    if (pincode && /^[1-9][0-9]{5}$/.test(pincode)) {
      const geocodeUrl = new URL(
        "https://maps.googleapis.com/maps/api/geocode/json"
      );
      geocodeUrl.searchParams.set("address", pincode);
      geocodeUrl.searchParams.set(
        "components",
        `country:IN|postal_code:${pincode}`
      );
      geocodeUrl.searchParams.set("key", GOOGLE_MAPS_API_KEY);

      const geocodeRes = await fetch(geocodeUrl.toString());
      const geocodeData = await geocodeRes.json();

      if (geocodeData.status === "OK" && geocodeData.results?.length > 0) {
        const location = geocodeData.results[0].geometry.location;
        locationBias = { lat: location.lat, lng: location.lng };
      }
    }

    // Step 2: Call Places Autocomplete — DON'T append pincode to input text
    const url = new URL(
      "https://maps.googleapis.com/maps/api/place/autocomplete/json"
    );
    url.searchParams.set("input", input); // Only user's typed text
    url.searchParams.set("key", GOOGLE_MAPS_API_KEY);
    url.searchParams.set("components", "country:in");
    url.searchParams.set("language", "en");

    // Restrict results to the pincode area using location + radius + strictbounds
    if (locationBias) {
      url.searchParams.set(
        "location",
        `${locationBias.lat},${locationBias.lng}`
      );
      url.searchParams.set("radius", "15000"); // 15km covers most pincode areas
      url.searchParams.set("strictbounds", "true"); // ONLY results within this radius
    }

    const res = await fetch(url.toString());
    const data = await res.json();

    if (data.status === "OK" && data.predictions) {
      const suggestions = data.predictions.map(
        (prediction: {
          place_id: string;
          description: string;
          structured_formatting: {
            main_text: string;
            secondary_text: string;
          };
        }) => ({
          placeId: prediction.place_id,
          description: prediction.description,
          mainText: prediction.structured_formatting.main_text,
          secondaryText: prediction.structured_formatting.secondary_text,
        })
      );

      return NextResponse.json({ suggestions });
    }

    return NextResponse.json({ suggestions: [] });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch suggestions" },
      { status: 500 }
    );
  }
}
