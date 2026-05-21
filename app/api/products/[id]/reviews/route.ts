import { authOptions } from "@/auth/server";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { reviewService } from "./reviewsService";

// ─── GET /api/products/[id]/reviews ──────────────────────────────────────────
// Public. Returns paginated reviews + aggregate stats.
// ?page=1&limit=10
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;
    const { searchParams } = new URL(request.url);

    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));

    // Run paginated reviews + stats in parallel
    const [{ reviews, total }, stats] = await Promise.all([
      reviewService.getProductReviews(productId, { page, limit }),
      reviewService.getReviewStats(productId),
    ]);

    return NextResponse.json({
      reviews,
      stats,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GET /reviews error:", error);
    return NextResponse.json({ message: "Failed to fetch reviews" }, { status: 500 });
  }
}

// ─── POST /api/products/[id]/reviews ─────────────────────────────────────────
// Authenticated. Creates a review. Requires a delivered order for the product.
// One review per user per product.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id: productId } = await params;
    const body = await request.json();
    const { rating, comment, title, orderId, orderItemId, images } = body;

    // Validate
    if (!rating || !comment?.trim()) {
      return NextResponse.json(
        { message: "Rating and comment are required" },
        { status: 400 }
      );
    }
    if (typeof rating !== "number" || rating < 1 || rating > 5) {
      return NextResponse.json(
        { message: "Rating must be a number between 1 and 5" },
        { status: 400 }
      );
    }

    // Eligibility check: delivered order item + not already reviewed this item
    const canReview = await reviewService.canUserReviewProduct(
      session.user.id,
      productId,
      orderItemId ?? undefined
    );
    if (!canReview) {
      return NextResponse.json(
        { message: "You can only review products you have purchased and received, or you have already reviewed this product." },
        { status: 403 }
      );
    }

    const review = await reviewService.createReview({
      userId: session.user.id,
      productId,
      orderId: orderId ?? undefined,
      orderItemId: orderItemId ?? undefined,
      rating,
      title: title?.trim() || undefined,
      comment: comment.trim(),
      // Only store non-empty validated image URLs
      images: Array.isArray(images) && images.length > 0 ? images : undefined,
      isVerifiedPurchase: true,
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    console.error("POST /reviews error:", error);
    return NextResponse.json({ message: "Failed to submit review" }, { status: 500 });
  }
}

// ─── PATCH /api/products/[id]/reviews ────────────────────────────────────────
// Authenticated. Marks a review as helpful (increments helpfulCount).
// Body: { reviewId: string }
export async function PATCH(
  request: NextRequest,
  { params: _params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { reviewId } = body;

    if (!reviewId) {
      return NextResponse.json({ message: "reviewId is required" }, { status: 400 });
    }

    const updated = await reviewService.markHelpful(reviewId);
    if (!updated) {
      return NextResponse.json({ message: "Review not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /reviews error:", error);
    return NextResponse.json({ message: "Failed to mark review as helpful" }, { status: 500 });
  }
}
