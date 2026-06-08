import { authOptions } from "@/auth/server";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

/**
 * DELETE /api/uploads/cloudinary
 * Body: { url: string }
 *
 * Deletes a file from Cloudinary by extracting the public_id from the URL.
 * Handles optional version segments (e.g. /v1718000000/) in the URL.
 * Returns { success: true } on successful deletion.
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const url: string | undefined = body?.url;

    if (!url || typeof url !== "string") {
      return NextResponse.json({ message: "URL is required" }, { status: 400 });
    }

    // Only allow deleting files hosted on Cloudinary
    if (!url.includes("res.cloudinary.com")) {
      return NextResponse.json(
        { message: "Invalid Cloudinary URL" },
        { status: 400 }
      );
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json(
        { message: "Image service is not configured" },
        { status: 503 }
      );
    }

    // ── Extract public_id from URL ──────────────────────────────────────────
    // Format: https://res.cloudinary.com/{cloud}/image/upload/v123456/{folder}/{id}.ext
    // Version segment (v + digits) must be skipped to get the correct public_id.
    const urlParts = url.split("/");
    const uploadIndex = urlParts.indexOf("upload");

    if (uploadIndex === -1) {
      return NextResponse.json(
        { message: "Invalid Cloudinary URL" },
        { status: 400 }
      );
    }

    let afterUpload = urlParts.slice(uploadIndex + 1);

    // Skip optional version segment e.g. "v1718000000"
    if (afterUpload[0] && /^v\d+$/.test(afterUpload[0])) {
      afterUpload = afterUpload.slice(1);
    }

    const publicIdWithExt = afterUpload.join("/");
    if (!publicIdWithExt) {
      return NextResponse.json(
        { message: "Could not extract public_id from URL" },
        { status: 400 }
      );
    }

    // Strip file extension to get the public_id
    const publicId = publicIdWithExt.substring(
      0,
      publicIdWithExt.lastIndexOf(".")
    );

    // Determine resource type from URL path
    const resourceType = url.includes("/video/") ? "video" : "image";

    // ── Build signed delete request for Cloudinary REST API ────────────────
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const paramsToSign = `public_id=${publicId}&timestamp=${timestamp}`;
    const signature = crypto
      .createHmac("sha1", apiSecret)
      .update(paramsToSign)
      .digest("hex");

    const deleteForm = new FormData();
    deleteForm.append("public_id", publicId);
    deleteForm.append("api_key", apiKey);
    deleteForm.append("timestamp", timestamp);
    deleteForm.append("signature", signature);

    const cloudRes = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/destroy`,
      { method: "POST", body: deleteForm }
    );

    if (!cloudRes.ok) {
      const err = await cloudRes.json().catch(() => ({}));
      console.error("Cloudinary delete error:", err);
      return NextResponse.json(
        { message: "Failed to delete file from Cloudinary" },
        { status: 500 }
      );
    }

    const result = await cloudRes.json();

    // Cloudinary returns { result: "not found" } without an HTTP error when the file doesn't exist
    if (result.result !== "ok") {
      console.error("Cloudinary delete failed:", result);
      return NextResponse.json(
        { message: `Cloudinary could not delete the file: ${result.result}` },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: "File deleted successfully" });
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    return NextResponse.json(
      { message: "Failed to delete file" },
      { status: 500 }
    );
  }
}
