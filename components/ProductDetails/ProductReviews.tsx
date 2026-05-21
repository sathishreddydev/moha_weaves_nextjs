"use client";

import { useState, useTransition } from "react";
import { Star, ThumbsUp, ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";
import { ReviewWithUser } from "@/shared";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Record<number, number>;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ReviewsData {
  reviews: ReviewWithUser[];
  stats: ReviewStats;
  pagination?: Pagination;
}

interface ProductReviewsProps {
  reviewsData: ReviewsData;
  productId: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StarRow({ rating, size = "sm" }: { rating: number; size?: "xs" | "sm" | "md" }) {
  const cls = size === "md" ? "w-4 h-4" : size === "xs" ? "w-3 h-3" : "w-3.5 h-3.5";
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`${cls} ${
            s <= rating ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"
          }`}
        />
      ))}
    </div>
  );
}

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProductReviews({ reviewsData, productId }: ProductReviewsProps) {
  const [reviews, setReviews] = useState<ReviewWithUser[]>(reviewsData.reviews);
  const [stats] = useState<ReviewStats>(reviewsData.stats);
  const [pagination, setPagination] = useState<Pagination>(
    reviewsData.pagination ?? {
      page: 1,
      limit: 10,
      total: reviewsData.stats.totalReviews,
      totalPages: Math.ceil(reviewsData.stats.totalReviews / 10),
    }
  );
  const [helpfulIds, setHelpfulIds] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  // Lightbox: { images, index }
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number } | null>(null);

  // ── Pagination ──────────────────────────────────────────────────────────────

  const fetchPage = (page: number) => {
    startTransition(async () => {
      try {
        const res = await fetch(
          `/api/products/${productId}/reviews?page=${page}&limit=${pagination.limit}`
        );
        if (!res.ok) return;
        const data = await res.json();
        setReviews(data.reviews);
        setPagination(data.pagination);
        // Scroll to reviews section smoothly
        document.getElementById("product-reviews")?.scrollIntoView({ behavior: "smooth", block: "start" });
      } catch {
        // silently ignore — existing reviews stay visible
      }
    });
  };

  // ── Helpful ─────────────────────────────────────────────────────────────────

  const handleHelpful = async (reviewId: string) => {
    if (helpfulIds.has(reviewId)) return; // already voted this session

    try {
      const res = await fetch(`/api/products/${productId}/reviews`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId }),
      });
      if (!res.ok) return;

      const updated = await res.json();
      setHelpfulIds((prev) => new Set(prev).add(reviewId));
      setReviews((prev) =>
        prev.map((r) => (r.id === reviewId ? { ...r, helpfulCount: updated.helpfulCount } : r))
      );
    } catch {
      // silently ignore
    }
  };

  // ── Empty state ─────────────────────────────────────────────────────────────

  if (stats.totalReviews === 0) {
    return (
      <div id="product-reviews" className="border rounded-lg p-6 bg-white">
        <h3 className="text-base font-semibold text-gray-900 mb-3">Customer Reviews</h3>
        <p className="text-xs text-gray-500 text-center py-4 bg-gray-50 rounded-lg">
          No reviews yet. Be the first to review this product!
        </p>
      </div>
    );
  }

  const getRatingPct = (r: number) =>
    stats.totalReviews > 0
      ? (stats.ratingDistribution[r] / stats.totalReviews) * 100
      : 0;

  return (
    <div id="product-reviews" className="border rounded-lg p-6 bg-white space-y-6">
      <h3 className="text-base font-semibold text-gray-900">Customer Reviews</h3>

      {/* ── Summary ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
        {/* Overall score */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-4xl font-bold text-gray-900">
            {stats.averageRating.toFixed(1)}
          </span>
          <StarRow rating={Math.round(stats.averageRating)} size="md" />
          <p className="text-xs text-gray-500 mt-1">
            Based on {stats.totalReviews} {stats.totalReviews === 1 ? "review" : "reviews"}
          </p>
        </div>

        {/* Distribution bars */}
        <div className="space-y-1.5">
          {[5, 4, 3, 2, 1].map((r) => (
            <div key={r} className="flex items-center gap-2">
              <div className="flex items-center gap-0.5 w-10 flex-shrink-0">
                <span className="text-xs text-gray-600">{r}</span>
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              </div>
              <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-yellow-400 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${getRatingPct(r)}%` }}
                />
              </div>
              <span className="text-xs text-gray-500 w-6 text-right flex-shrink-0">
                {stats.ratingDistribution[r] ?? 0}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Reviews list ── */}
      <div className={`space-y-5 ${isPending ? "opacity-60 pointer-events-none" : ""}`}>
        {reviews.map((review) => (
          <div key={review.id} className="border-b pb-5 last:border-b-0 last:pb-0">
            {/* Header */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-gray-900">
                    {review.user.name}
                  </span>
                  {review.isVerifiedPurchase && (
                    <span className="text-[10px] bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-medium">
                      ✓ Verified Purchase
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <StarRow rating={review.rating} size="xs" />
                  <span className="text-[10px] text-gray-400">{formatDate(review.createdAt)}</span>
                </div>
              </div>
            </div>

            {/* Title */}
            {review.title && (
              <p className="text-xs font-semibold text-gray-800 mb-1">{review.title}</p>
            )}

            {/* Body */}
            {review.comment && (
              <p className="text-xs text-gray-700 leading-relaxed mb-3">{review.comment}</p>
            )}

            {/* Review images */}
            {review.images && review.images.length > 0 && (
              <div className="flex gap-2 mb-3 flex-wrap">
                {review.images.map((img, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setLightbox({ images: review.images!, index: i })}
                    className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-100 hover:border-gray-300 transition-colors group flex-shrink-0"
                    aria-label={`View review photo ${i + 1}`}
                  >
                    <img
                      src={img}
                      alt={`Review photo ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <ZoomIn className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Helpful */}
            <button
              type="button"
              onClick={() => handleHelpful(review.id)}
              disabled={helpfulIds.has(review.id)}
              className={`flex items-center gap-1.5 text-[11px] transition-colors ${
                helpfulIds.has(review.id)
                  ? "text-green-600 cursor-default"
                  : "text-gray-400 hover:text-gray-700"
              }`}
            >
              <ThumbsUp className="w-3.5 h-3.5" />
              {helpfulIds.has(review.id)
                ? `Helpful (${review.helpfulCount ?? 0})`
                : `Helpful${(review.helpfulCount ?? 0) > 0 ? ` (${review.helpfulCount})` : ""}`}
            </button>
          </div>
        ))}
      </div>

      {/* ── Pagination ── */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => fetchPage(pagination.page - 1)}
            disabled={pagination.page <= 1 || isPending}
            className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="text-xs text-gray-600">
            Page {pagination.page} of {pagination.totalPages}
          </span>

          <button
            type="button"
            onClick={() => fetchPage(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages || isPending}
            className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Next page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Image lightbox ── */}
      {lightbox && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          {/* Close */}
          <button
            type="button"
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Main image */}
          <div
            className="relative max-w-2xl max-h-[80vh] w-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={lightbox.images[lightbox.index]}
              alt={`Review photo ${lightbox.index + 1}`}
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
            />
          </div>

          {/* Prev / Next when multiple images */}
          {lightbox.images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightbox((lb) =>
                    lb
                      ? { ...lb, index: lb.index === 0 ? lb.images.length - 1 : lb.index - 1 }
                      : null
                  );
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-colors"
                aria-label="Previous photo"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightbox((lb) =>
                    lb
                      ? { ...lb, index: lb.index === lb.images.length - 1 ? 0 : lb.index + 1 }
                      : null
                  );
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-colors"
                aria-label="Next photo"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              {/* Counter */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/20 text-white text-xs px-3 py-1 rounded-full">
                {lightbox.index + 1} / {lightbox.images.length}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
