import { NextRequest, NextResponse } from "next/server";
import { reviewService } from "./reviewsService";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params;
        const productId = resolvedParams.id;
        const reviews = await reviewService.getProductReviews(productId);

        const totalReviews = reviews.length;

        const averageRating =
            totalReviews > 0
                ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
                : 0;

        const ratingDistribution: Record<number, number> = {
            1: 0,
            2: 0,
            3: 0,
            4: 0,
            5: 0,
        };

        reviews.forEach((r) => {
            if (ratingDistribution[r.rating] !== undefined) {
                ratingDistribution[r.rating]++;
            }
        });

        const response = {
            reviews,
            stats: {
                averageRating,
                totalReviews,
                ratingDistribution,
            },
        };

        return NextResponse.json(response);

    } catch (error) {
        console.error("Error fetching reviews:", error);

        return NextResponse.json(
            { message: "Failed to fetch reviews" },
            { status: 500 }
        );
    }
}