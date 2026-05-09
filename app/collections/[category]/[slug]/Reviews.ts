export async function getProductReviews(productId: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/products/${productId}/reviews`, {
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      // Return empty reviews data instead of throwing error
      return {
        reviews: [],
        stats: {
          averageRating: 0,
          totalReviews: 0,
          ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        },
      };
    }

    return res.json();
  } catch (error) {
    // Return empty reviews data as fallback
    return {
      reviews: [],
      stats: {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      },
    };
  }
}