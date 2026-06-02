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
    // Step 1: Geocode the pincode to get center coordinates and viewport bounds
    let locationBias: { lat: number; lng: number } | null = null;
    let radiusMeters = 5000; // Default 5km — typical Indian pincode area

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
        const result = geocodeData.results[0];
        const location = result.geometry.location;
        locationBias = { lat: location.lat, lng: location.lng };

        // Calculate radius from viewport bounds if available
        // This gives us the actual geographic extent of the pincode area
        if (result.geometry.viewport) {
          const { northeast, southwest } = result.geometry.viewport;
          // Haversine-based distance across the viewport diagonal, halved for radius
          const dlat = Math.abs(northeast.lat - southwest.lat);
          const dlng = Math.abs(northeast.lng - southwest.lng);
          // Approximate: 1 degree lat ≈ 111km, 1 degree lng ≈ 85km (at ~20°N India avg)
          const latDist = dlat * 111000;
          const lngDist = dlng * 85000;
          const diagonal = Math.sqrt(latDist * latDist + lngDist * lngDist);
          // Use half the diagonal as radius, with a minimum of 3km and max of 8km
          radiusMeters = Math.min(8000, Math.max(3000, Math.round(diagonal / 2)));
        }
      }
    }

    // Step 2: Call Places Autocomplete restricted tightly to pincode area
    const url = new URL(
      "https://maps.googleapis.com/maps/api/place/autocomplete/json"
    );
    url.searchParams.set("input", input);
    url.searchParams.set("key", GOOGLE_MAPS_API_KEY);
    url.searchParams.set("components", "country:in");
    url.searchParams.set("language", "en");

    // Restrict results strictly to the pincode's geographic area
    if (locationBias) {
      url.searchParams.set(
        "location",
        `${locationBias.lat},${locationBias.lng}`
      );
      url.searchParams.set("radius", String(radiusMeters));
      url.searchParams.set("strictbounds", "true");
    }

    const res = await fetch(url.toString());
    const data = await res.json();

    if (data.status === "OK" && data.predictions) {
      // Filter out results that contain a different pincode in description
      const suggestions = data.predictions
        .map(
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
        )
        .filter(
          (s: { description: string }) => {
            // If description contains a 6-digit pincode that doesn't match, exclude it
            const foundPincode = s.description.match(/\b[1-9][0-9]{5}\b/);
            if (foundPincode && pincode && foundPincode[0] !== pincode) {
              return false;
            }
            return true;
          }
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
