"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { ReviewWithUser } from "@/shared";

interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Record<number, number>;
}

interface ProductReviewsProps {
  reviewsData: {
    reviews: ReviewWithUser[];
    stats: ReviewStats;
  };
}

export default function ProductReviews({ reviewsData }: ProductReviewsProps) {
  const [showAllReviews, setShowAllReviews] = useState(false);
  const { reviews, stats } = reviewsData;

  const displayReviews = showAllReviews ? reviews : reviews.slice(0, 3);

  const renderStars = (rating: number, size = "sm") => {
    const starSize =
      size === "lg" ? "w-6 h-6" : size === "md" ? "w-4 h-4" : "w-3 h-3";
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${starSize} ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "fill-gray-200 text-gray-200"
            }`}
          />
        ))}
      </div>
    );
  };

  const getRatingPercentage = (rating: number) => {
    return stats.totalReviews > 0
      ? (stats.ratingDistribution[rating] / stats.totalReviews) * 100
      : 0;
  };

  if (reviews.length === 0) {
    return (
      <div className="border rounded-lg p-6 bg-white">
        <h3 className="text-base font-semibold text-gray-900 mb-4">
          Customer Reviews
        </h3>
        <div className="text-xs text-center bg-gray-50 rounded-lg">
          <p className="text-gray-500">
            No reviews yet. Be the first to review this product!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-6 bg-white">
      <h3 className="text-base font-semibold text-gray-900 mb-4">
        Customer Reviews
      </h3>
      {/* Review Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 items-center">
        {/* Overall Rating */}
        <div className="flex flex-col items-center">
          <div className="text-xl font-bold mb-2">
            {stats.averageRating.toFixed(1)}
          </div>
          {renderStars(Math.round(stats.averageRating), "md")}
          <p className="text-xs text-gray-600 mt-2">
            Based on {stats.totalReviews}{" "}
            {stats.totalReviews === 1 ? "review" : "reviews"}
          </p>
        </div>

        {/* Rating Distribution */}
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((rating) => (
            <div key={rating} className="flex items-center gap-3">
              <div className="flex items-center gap-1 w-12">
                <span className="text-xs">{rating}</span>
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              </div>
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-yellow-400 h-2 rounded-full"
                  style={{ width: `${getRatingPercentage(rating)}%` }}
                />
              </div>
              <span className="text-xs text-gray-600 w-8 text-right">
                {stats.ratingDistribution[rating]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-6">
        {displayReviews.map((review) => (
          <div key={review.id} className="border-b pb-6 last:border-b-0">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h4 className="text-sm font-medium">{review.user.name}</h4>
                  {review.isVerifiedPurchase && (
                    <span className="text-[10px] bg-green-100 text-green-800 px-2 py-1 rounded">
                      Verified Purchase
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {renderStars(review.rating, "xs")}
                  <span className="text-xs text-gray-500">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {review.title && (
              <h5 className="text-xs font-medium mb-2">{review.title}</h5>
            )}

            {review.comment && (
              <p className="text-xs text-gray-700 mb-3">{review.comment}</p>
            )}

            {review.images && review.images.length > 0 && (
              <div className="flex gap-2 mb-3">
                {review.images.map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt={`Review image ${index + 1}`}
                    className="w-20 h-20 object-cover rounded"
                  />
                ))}
              </div>
            )}

            <div className="text-xs flex items-center gap-4 text-sm text-gray-500">
              <button className="hover:text-gray-700">
                Helpful ({review.helpfulCount})
              </button>
              <button className="hover:text-gray-700">Report</button>
            </div>
          </div>
        ))}
      </div>

      {/* Show More/Less Button */}
      {reviews.length > 3 && (
        <div className="text-xs text-center mt-6">
          <button
            onClick={() => setShowAllReviews(!showAllReviews)}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {showAllReviews
              ? "Show Less"
              : `Show All Reviews (${reviews.length})`}
          </button>
        </div>
      )}
    </div>
  );
}
