import { authOptions } from "@/auth/server";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

// ─── Simple in-memory rate limiter ───────────────────────────────────────────
// Allows MAX_UPLOADS uploads per user per WINDOW_MS window.
const MAX_UPLOADS = 10;
const WINDOW_MS = 60 * 1000; // 1 minute
const uploadCounts = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(userId: string): boolean {
  const now = Date.now();
  const entry = uploadCounts.get(userId);

  if (!entry || now > entry.resetAt) {
    uploadCounts.set(userId, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  if (entry.count >= MAX_UPLOADS) return true;

  entry.count++;
  return false;
}

/**
 * POST /api/uploads/review-image
 * Accepts multipart/form-data with a single "file" field.
 * Uploads to Cloudinary under the "review-images" folder with auto resize + compress.
 * Returns { url: string }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Rate limit: max 10 uploads per user per minute
    if (isRateLimited(session.user.id)) {
      return NextResponse.json(
        { message: "Too many uploads. Please wait a moment and try again." },
        { status: 429 }
      );
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json(
        { message: "Image upload is not configured" },
        { status: 503 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ message: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { message: "Only JPEG, PNG, WebP and GIF images are allowed" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { message: "Image must be smaller than 5 MB" },
        { status: 400 }
      );
    }

    // Build signed upload request for Cloudinary REST API.
    // Transformation: resize to max 1200px wide, auto quality + format.
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const folder = "review-images";
    const transformation = "c_limit,w_1200,q_auto,f_auto";

    // Params must be sorted alphabetically for the signature
    const paramsToSign = `folder=${folder}&timestamp=${timestamp}&transformation=${transformation}`;

    const encoder = new TextEncoder();
    const msgData = encoder.encode(paramsToSign + apiSecret);
    const hashBuffer = await crypto.subtle.digest("SHA-1", msgData);
    const signature = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // Upload to Cloudinary
    const uploadForm = new FormData();
    uploadForm.append("file", file);
    uploadForm.append("api_key", apiKey);
    uploadForm.append("timestamp", timestamp);
    uploadForm.append("signature", signature);
    uploadForm.append("folder", folder);
    uploadForm.append("transformation", transformation);

    const cloudRes = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: "POST", body: uploadForm }
    );

    if (!cloudRes.ok) {
      const err = await cloudRes.json().catch(() => ({}));
      console.error("Cloudinary upload error:", err);
      return NextResponse.json(
        { message: "Failed to upload image" },
        { status: 500 }
      );
    }

    const result = await cloudRes.json();
    return NextResponse.json({ url: result.secure_url });
  } catch (error) {
    console.error("Review image upload error:", error);
    return NextResponse.json(
      { message: "Failed to upload image" },
      { status: 500 }
    );
  }
}
