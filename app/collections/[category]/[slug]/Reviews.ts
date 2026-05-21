import { reviewService } from "@/app/api/products/[id]/reviews/reviewsService";

const REVIEWS_PER_PAGE = 10;

const EMPTY_REVIEWS = {
  reviews: [],
  stats: {
    averageRating: 0,
    totalReviews: 0,
    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  },
  pagination: {
    page: 1,
    limit: REVIEWS_PER_PAGE,
    total: 0,
    totalPages: 0,
  },
};

export async function getProductReviews(productId: string, page = 1) {
  try {
    const [{ reviews, total }, stats] = await Promise.all([
      reviewService.getProductReviews(productId, { page, limit: REVIEWS_PER_PAGE }),
      reviewService.getReviewStats(productId),
    ]);

    return {
      reviews,
      stats,
      pagination: {
        page,
        limit: REVIEWS_PER_PAGE,
        total,
        totalPages: Math.ceil(total / REVIEWS_PER_PAGE),
      },
    };
  } catch {
    return EMPTY_REVIEWS;
  }
}
