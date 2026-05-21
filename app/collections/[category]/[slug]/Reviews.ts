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
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const url = `${baseUrl}/api/products/${productId}/reviews?page=${page}&limit=${REVIEWS_PER_PAGE}`;

    const res = await fetch(url, {
      // Cache for 5 minutes on the server; router.refresh() busts this after a new review
      next: { revalidate: 300, tags: [`product-reviews-${productId}`] },
    });

    if (!res.ok) return EMPTY_REVIEWS;

    return res.json();
  } catch {
    return EMPTY_REVIEWS;
  }
}
