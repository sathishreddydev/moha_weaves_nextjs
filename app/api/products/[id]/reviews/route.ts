import { NextRequest, NextResponse } from "next/server";
import { reviewService } from "./reviewsService";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/server";

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

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        
        if (!session) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        const resolvedParams = await params;
        const productId = resolvedParams.id;
        const body = await request.json();
        const { rating, comment } = body;

        // Validate required fields
        if (!rating || !comment) {
            return NextResponse.json(
                { message: "Rating and comment are required" },
                { status: 400 }
            );
        }

        // Validate rating range
        if (rating < 1 || rating > 5) {
            return NextResponse.json(
                { message: "Rating must be between 1 and 5" },
                { status: 400 }
            );
        }

        // Check if user can review this product
        const canReview = await reviewService.canUserReviewProduct(
            session.user.id,
            productId
        );

        if (!canReview) {
            return NextResponse.json(
                { message: "You can only review products from completed orders" },
                { status: 403 }
            );
        }

        // Create review
        const review = await reviewService.createReview({
            userId: session.user.id,
            productId,
            rating: parseInt(rating),
            comment,
            isVerified: true,
        });

        return NextResponse.json(review);

    } catch (error) {
        console.error("Error creating review:", error);

        return NextResponse.json(
            { message: "Failed to create review" },
            { status: 500 }
        );
    }
}