"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TextArea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getExchangeTimelineStep,
  getRefundStatusLabel,
  getStatusConfig,
} from "@/lib/orderStatus";
import {
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  ImagePlus,
  Package,
  RefreshCw,
  RotateCcw,
  Star,
  X,
  XCircle,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProductVariant {
  id: string;
  size: string;
  [key: string]: unknown;
}

interface OrderItemProduct {
  id: string;
  name: string;
  imageUrl?: string | null;
  variants?: ProductVariant[];
  [key: string]: unknown;
}

interface ReturnEligibility {
  eligible: boolean;
  reason?: string;
  remainingDays?: number;
}

interface ExchangeEligibility {
  eligible: boolean;
  reason?: string;
  remainingDays?: number;
}

interface RefundInfo {
  id: string;
  status: string;
  amount: string;
  initiatedAt?: string;
  completedAt?: string;
  failureReason?: string;
}

interface ReturnInfo {
  returnRequestId: string;
  status: string;
  resolution: string;
  reason: string;
  reasonDetails?: string;
  refundAmount?: string;
  createdAt: string;
  updatedAt: string;
  refund?: RefundInfo | null;
}

interface ExchangeInfo {
  exchangeId: string;
  status: string;
  reason: string;
  reasonDetails?: string;
  exchangeOrderId?: string | null;
  exchangeVariantId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItemType {
  id: string;
  orderId?: string;
  status: string;
  currentStatus?: string;
  quantity: number;
  price: string;
  productPrice?: string | null;
  discountedPrice?: string | null;
  variantId?: string | null;
  product: OrderItemProduct;
  returnEligibility?: ReturnEligibility;
  exchangeEligibility?: ExchangeEligibility;
  returnInfo?: ReturnInfo;
  exchangeInfo?: ExchangeInfo;
  /** True when the user has already submitted a review for this product */
  hasReviewed?: boolean;
  /** The user's submitted review for this product */
  reviewInfo?: {
    id: string;
    rating: number;
    title?: string | null;
    comment?: string | null;
    images?: string[] | null;
    isVerifiedPurchase?: boolean | null;
    helpfulCount?: number | null;
    createdAt: Date | string;
  };
}

const RATING_LABELS: Record<number, string> = {
  1: "Poor",
  2: "Fair",
  3: "Good",
  4: "Very Good",
  5: "Excellent",
};

// Shared star color utility — consistent with ProductReviews component
function getStarColorClass(rating: number): string {
  if (rating <= 1) return "fill-red-400 text-red-400";
  if (rating <= 2) return "fill-orange-400 text-orange-400";
  if (rating <= 3) return "fill-yellow-400 text-yellow-400";
  if (rating <= 4) return "fill-lime-500 text-lime-500";
  return "fill-green-500 text-green-500";
}

// ─── Inline Review Panel ──────────────────────────────────────────────────────

function InlineReviewPanel({
  item,
  orderId,
  onSubmitted,
  onCancel,
}: {
  item: OrderItemType;
  orderId: string;
  onSubmitted: (review: NonNullable<OrderItemType["reviewInfo"]>) => void;
  onCancel: () => void;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [images, setImages] = useState<string[]>([]); // uploaded Cloudinary URLs
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const displayRating = hoverRating || rating;
  const MAX_IMAGES = 3;

  // ── Image upload ────────────────────────────────────────────────────────────

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    const remaining = MAX_IMAGES - images.length;
    const toUpload = files.slice(0, remaining);

    setUploading(true);
    setError("");

    try {
      // Upload all selected files in parallel
      const uploadPromises = toUpload.map(async (file) => {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/uploads/review-image", {
          method: "POST",
          body: fd,
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || "Image upload failed");
        }
        const { url } = await res.json();
        return url as string;
      });

      const uploaded = await Promise.all(uploadPromises);
      setImages((prev) => [...prev, ...uploaded]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Image upload failed");
    } finally {
      setUploading(false);
      // Reset input so the same file can be re-selected if needed
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  // ── Submit ──────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!comment.trim()) {
      setError("Please write a review comment");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/products/${item.product.id}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          title: title.trim() || undefined,
          comment: comment.trim(),
          orderId,
          orderItemId: item.id,
          images,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to submit review");
      }
      const created = await res.json();
      setSuccess(true);
      setTimeout(() => {
        router.refresh(); // refresh after panel closes so it doesn't interrupt the success state
        onSubmitted({
          id: created.id,
          rating,
          title: title.trim() || null,
          comment: comment.trim(),
          images,
          isVerifiedPurchase: true,
          helpfulCount: 0,
          createdAt: created.createdAt ?? new Date().toISOString(),
        });
      }, 1600);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit review");
    } finally {
      setLoading(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="mt-3 pt-3 border-t border-yellow-100">
      {success ? (
        <div className="flex items-center gap-2 py-3 text-green-700">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold">Review submitted!</p>
            <p className="text-[10px] text-green-600">
              Thank you for your feedback.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              Rate this product
            </p>
            <button
              type="button"
              onClick={onCancel}
              className="text-slate-400 hover:text-slate-600 transition-colors"
              aria-label="Cancel review"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Stars */}
          <div className="space-y-1">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-transform hover:scale-110 focus:outline-none"
                  aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
                >
                  <Star
                    className={`w-5 h-5 transition-colors ${
                      star <= displayRating
                        ? getStarColorClass(displayRating)
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-500 font-medium">
              {RATING_LABELS[displayRating]}
            </p>
          </div>
          <Input
            id={`review-title-${item.id}`}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
            className="text-xs"
            label="Summarise your experience (optional)"
          />

          {/* Comment */}
          <div className="space-y-1">
           
            <TextArea
              required
              id={`review-comment-${item.id}`}
              label="Quality, fit, delivery — share what you think"
              value={comment}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setComment(e.target.value)}
              rows={3}
              maxLength={500}
              className="text-xs resize-none"
            />
            <p className="text-[10px] text-slate-400 text-right">
              {comment.length}/500
            </p>
          </div>

          {/* Image upload */}
          <div className="space-y-2">
            <Label className="text-xs text-slate-600">
              Photos{" "}
              <span className="text-slate-400 font-normal">
                (optional · up to {MAX_IMAGES}, max 5 MB each)
              </span>
            </Label>

            {/* Thumbnails + add button */}
            <div className="flex flex-wrap gap-2">
              {images.map((url, i) => (
                <div key={i} className="relative w-16 h-16 flex-shrink-0">
                  <Image
                    src={url}
                    alt={`Review photo ${i + 1}`}
                    fill
                    sizes="64px"
                    className="object-cover rounded-lg border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                    aria-label="Remove photo"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              ))}

              {images.length < MAX_IMAGES && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-16 h-16 flex-shrink-0 border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center gap-1 text-slate-400 hover:border-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Add photo"
                >
                  {uploading ? (
                    <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                  ) : (
                    <>
                      <ImagePlus className="w-4 h-4" />
                      <span className="text-[9px] font-medium">Add</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-100 rounded-lg">
              <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
              <p className="text-[11px] text-red-700">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={onCancel}
              disabled={loading || uploading}
              className="h-7 text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={loading || uploading || !comment.trim()}
              className="h-7 text-xs"
            >
              {loading ? "Submitting…" : "Submit Review"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── OrderItem ────────────────────────────────────────────────────────────────

export function OrderItem({
  item,
  orderId,
  onReviewSubmitted,
  onReturn,
}: {
  item: OrderItemType;
  /** The parent order's ID — needed to link the review to the order */
  orderId: string;
  /** Called after a successful review so the parent can mark the item as reviewed */
  onReviewSubmitted?: (
    orderItemId: string,
    reviewInfo: NonNullable<OrderItemType["reviewInfo"]>,
  ) => void;
  onReturn: (itemId: string, type: "return" | "exchange") => void;
}) {
  const [reviewOpen, setReviewOpen] = useState(false);
  // Local review — set immediately after submit so panel shows without waiting for server refetch
  const [localReview, setLocalReview] = useState<
    OrderItemType["reviewInfo"] | null
  >(null);

  const currentStatus: string = item.currentStatus || item.status || "pending";
  const statusCfg = getStatusConfig(currentStatus);
  const StatusIcon = statusCfg.Icon;

  const selectedVariant = item.variantId
    ? item.product?.variants?.find((v) => v.id === item.variantId)
    : item.product?.variants?.[0];

  const isDelivered = currentStatus === "delivered";
  const isCancelled = currentStatus === "cancelled";
  const returnInfo = item.returnInfo;
  const exchangeInfo = item.exchangeInfo;
  const isInReturn = currentStatus.startsWith("return_") || !!returnInfo;
  const isInExchange = currentStatus.startsWith("exchange_") || !!exchangeInfo;

  const alreadyReviewed = item.hasReviewed ?? !!localReview;
  // Use server-side reviewInfo OR locally-set review (just submitted this session)
  const activeReview = item.reviewInfo ?? localReview;
  const showReviewButton =
    isDelivered && !isInReturn && !isInExchange && !alreadyReviewed;

  return (
    <Card className="p-4 hover:border-slate-300 transition-colors bg-white">
      {/* ── Product row ── */}
      <div className="flex gap-4">
        <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 relative">
          {item.product?.imageUrl ? (
            <Image
              src={item.product.imageUrl}
              alt={item.product.name}
              fill
              sizes="64px"
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-8 h-8 text-gray-400" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-2">
            <div className="min-w-0">
              <h4 className="text-xs font-medium text-gray-900 truncate">
                {item.product?.name || "Product"}
              </h4>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="text-[10px] font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                  Qty: {item.quantity}
                </span>
                {selectedVariant?.size && (
                  <span className="text-[10px] font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                    Size: {selectedVariant.size}
                  </span>
                )}
              </div>
            </div>

            <div className="text-right flex-shrink-0">
              {item.productPrice != null &&
              parseFloat(item.productPrice) !== parseFloat(item.price) ? (
                <div className="flex items-center gap-1 justify-end">
                  <span className="text-xs text-gray-400 line-through">
                    ₹{parseFloat(item.productPrice).toFixed(2)}
                  </span>
                  <span className="text-xs font-bold text-green-600">
                    ₹{parseFloat(item.price).toFixed(2)}
                  </span>
                </div>
              ) : (
                <p className="text-xs font-bold">
                  ₹{parseFloat(item.price).toFixed(2)}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Status + Actions row ── */}
      <div className="flex flex-wrap items-center gap-3 pt-3 mt-3 border-t border-slate-100">
        <div className={`flex items-center gap-1 ${statusCfg.className}`}>
          <StatusIcon className="w-3.5 h-3.5" />
          <span className="text-xs font-semibold">{statusCfg.label}</span>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {/* Review button — toggles inline panel */}
          {showReviewButton && (
            <button
              type="button"
              className="text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1.5 transition-colors active:scale-95"
              onClick={() => setReviewOpen(!reviewOpen)}
            >
              <Star className="w-3.5 h-3.5 text-gray-400 fill-gray-400" />
              Review
              <ChevronDown
                className={`w-3 h-3 transition-transform ${reviewOpen ? "rotate-180" : ""}`}
              />
            </button>
          )}

          {/* Already reviewed badge */}
          {alreadyReviewed && isDelivered && !isInReturn && !isInExchange && (
            <span className="text-[10px] text-green-600 font-medium flex items-center gap-1">
              <Star className="w-3 h-3 fill-green-500 text-green-500" />
              Reviewed
            </span>
          )}

          {item.returnEligibility?.eligible && !isInReturn && !isInExchange && (
            <>
              {(isDelivered || showReviewButton || alreadyReviewed) && (
                <div className="w-1 h-1 bg-slate-300 rounded-full" />
              )}
              <button
                type="button"
                onClick={() => onReturn(item.id, "return")}
                className="text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1.5 transition-colors active:scale-95"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Return
              </button>
            </>
          )}

          {item.exchangeEligibility?.eligible &&
            !isInReturn &&
            !isInExchange && (
              <>
                {(isDelivered || item.returnEligibility?.eligible) && (
                  <div className="w-1 h-1 bg-slate-300 rounded-full" />
                )}
                <button
                  type="button"
                  onClick={() => onReturn(item.id, "exchange")}
                  className="text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1.5 transition-colors active:scale-95"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Exchange
                </button>
              </>
            )}

          {!isDelivered &&
            !item.returnEligibility?.eligible &&
            !item.exchangeEligibility?.eligible &&
            !isCancelled &&
            !isInReturn &&
            !isInExchange && (
              <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                <XCircle className="w-3 h-3" />
                {item.returnEligibility?.reason || "Non-returnable"}
              </span>
            )}
        </div>
      </div>

      {/* ── Inline review panel ── */}
      {reviewOpen && !alreadyReviewed && (
        <InlineReviewPanel
          item={item}
          orderId={orderId}
          onSubmitted={(submittedReview) => {
            setReviewOpen(false);
            setLocalReview(submittedReview);
            onReviewSubmitted?.(item.id, submittedReview); // pass orderItemId, not productId
          }}
          onCancel={() => setReviewOpen(false)}
        />
      )}

      {/* ── Submitted review panel ── */}
      {alreadyReviewed && activeReview && (
        <SubmittedReviewPanel review={activeReview} />
      )}

      {/* ── Return / Refund panel ── */}
      {returnInfo && <ReturnRefundPanel returnInfo={returnInfo} />}

      {/* ── Exchange panel ── */}
      {exchangeInfo && (
        <ExchangePanel
          exchangeInfo={exchangeInfo}
          variants={item.product?.variants ?? []}
        />
      )}
    </Card>
  );
}

// ─── Submitted Review Panel ───────────────────────────────────────────────────

function SubmittedReviewPanel({
  review,
}: {
  review: NonNullable<OrderItemType["reviewInfo"]>;
}) {
  const [open, setOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const images = review.images?.filter(Boolean) ?? [];

  return (
    <div className="mt-3 pt-3 border-t border-yellow-100">
      {/* ── Collapsed header — always visible ── */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 group"
        aria-expanded={open}
      >
        <div className="flex items-center gap-1.5">
          <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
          <span className="text-xs font-semibold text-slate-700">
            Your Review
          </span>
          {/* Star summary shown when collapsed */}
          {!open && (
            <div className="flex gap-0.5 ml-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`w-2.5 h-2.5 ${
                    s <= review.rating
                      ? getStarColorClass(review.rating)
                      : "fill-gray-200 text-gray-200"
                  }`}
                />
              ))}
            </div>
          )}
          {review.isVerifiedPurchase && (
            <span className="text-[9px] bg-green-50 text-green-700 border border-green-200 px-1.5 py-0.5 rounded-full font-medium">
              ✓ Verified
            </span>
          )}
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 flex-shrink-0 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* ── Expanded content ── */}
      {open && (
        <div className="mt-2 space-y-2">
          {/* Stars */}
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className={`w-3 h-3 ${
                  s <= review.rating
                    ? getStarColorClass(review.rating)
                    : "fill-gray-200 text-gray-200"
                }`}
              />
            ))}
          </div>

          {/* Title */}
          {review.title && (
            <p className="text-xs font-semibold text-gray-800">
              {review.title}
            </p>
          )}

          {/* Comment */}
          {review.comment && (
            <p className="text-xs text-gray-600 leading-relaxed">
              {review.comment}
            </p>
          )}

          {/* Images */}
          {images.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {images.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setLightboxIndex(i)}
                  className="relative w-14 h-14 rounded-lg overflow-hidden border border-gray-200 hover:border-gray-400 transition-colors flex-shrink-0 group"
                  aria-label={`View photo ${i + 1}`}
                >
                  <Image
                    src={img}
                    alt={`Review photo ${i + 1}`}
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                </button>
              ))}
            </div>
          )}

          {/* Date */}
          <p className="text-[10px] text-slate-400">
            Reviewed on{" "}
            {new Date(review.createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            type="button"
            onClick={() => setLightboxIndex(null)}
            className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
          <div
            className="relative max-w-lg max-h-[80vh] w-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={images[lightboxIndex]}
              alt={`Review photo ${lightboxIndex + 1}`}
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
            />
          </div>
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((i) =>
                    i === 0 ? images.length - 1 : (i ?? 0) - 1,
                  );
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex((i) =>
                    i === images.length - 1 ? 0 : (i ?? 0) + 1,
                  );
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/20 text-white text-xs px-3 py-1 rounded-full">
                {lightboxIndex + 1} / {images.length}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Return / Refund panel ────────────────────────────────────────────────────

function ReturnRefundPanel({ returnInfo }: { returnInfo: ReturnInfo }) {
  const { status, resolution, refundAmount, refund, createdAt } = returnInfo;
  const isRefundResolution = resolution === "refund";
  const isCreditResolution = resolution === "store_credit";
  const step = getReturnStep(status);

  return (
    <div className="mt-3 pt-3 border-t border-orange-100 space-y-3">
      <ReturnTimeline step={step} resolution={resolution} />

      {status === "return_completed" && isRefundResolution && refund && (
        <RefundDetail refund={refund} refundAmount={refundAmount} />
      )}

      {status === "return_completed" && isCreditResolution && (
        <div className="flex items-center gap-2 text-[10px] text-green-700 bg-green-50 rounded-lg px-3 py-2">
          <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>
            Store credit of ₹{parseFloat(refundAmount || "0").toFixed(2)} has
            been issued. Check your email for the coupon code.
          </span>
        </div>
      )}

      {status === "return_rejected" && returnInfo.reasonDetails && (
        <div className="flex items-start gap-2 text-[10px] text-red-600 bg-red-50 rounded-lg px-3 py-2">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>Rejected: {returnInfo.reasonDetails}</span>
        </div>
      )}

      <p className="text-[10px] text-slate-400">
        Return requested on{" "}
        {new Date(createdAt).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })}
      </p>
    </div>
  );
}

function getReturnStep(
  status: string,
): "requested" | "in_progress" | "done" | "rejected" {
  if (status === "return_requested") return "requested";
  if (
    [
      "return_approved",
      "return_pickup_scheduled",
      "return_picked_up",
      "return_in_transit",
      "return_received",
      "return_inspected",
    ].includes(status)
  )
    return "in_progress";
  if (status === "return_completed") return "done";
  return "rejected";
}

function ReturnTimeline({
  step,
  resolution,
}: {
  step: "requested" | "in_progress" | "done" | "rejected";
  resolution: string;
}) {
  const doneLabel =
    resolution === "refund"
      ? "Refund Initiated"
      : resolution === "store_credit"
        ? "Credit Issued"
        : "Completed";

  const steps = [
    { key: "requested", label: "Return Requested" },
    { key: "in_progress", label: "Return in Progress" },
    { key: "done", label: doneLabel },
  ];

  const order = ["requested", "in_progress", "done"];
  const currentIdx = step === "rejected" ? -1 : order.indexOf(step);

  if (step === "rejected") {
    return (
      <div className="flex items-center gap-2 text-[10px] text-red-500">
        <AlertCircle className="w-3.5 h-3.5" />
        <span className="font-semibold">Return Rejected</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      {steps.map((s, idx) => {
        const done = idx < currentIdx;
        const active = idx === currentIdx;
        return (
          <div key={s.key} className="flex items-center gap-1 flex-1 min-w-0">
            <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
              <div
                className={`w-4 h-4 rounded-full flex items-center justify-center ${
                  done || active
                    ? "bg-orange-500 text-white"
                    : "bg-slate-200 text-slate-400"
                }`}
              >
                {done ? (
                  <CheckCircle className="w-3 h-3" />
                ) : active ? (
                  <Clock className="w-3 h-3" />
                ) : (
                  <div className="w-1.5 h-1.5 rounded-full bg-current" />
                )}
              </div>
            </div>
            <span
              className={`text-[9px] leading-tight truncate ${
                active
                  ? "text-orange-600 font-semibold"
                  : done
                    ? "text-slate-500"
                    : "text-slate-300"
              }`}
            >
              {s.label}
            </span>
            {idx < steps.length - 1 && (
              <div
                className={`h-px flex-1 mx-1 ${done ? "bg-orange-400" : "bg-slate-200"}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function RefundDetail({
  refund,
  refundAmount,
}: {
  refund: RefundInfo;
  refundAmount?: string;
}) {
  const amount = parseFloat(refund.amount || refundAmount || "0").toFixed(2);
  const { label, className } = getRefundStatusLabel(refund.status);

  if (refund.status === "failed") {
    return (
      <div className="flex items-start gap-2 text-[10px] text-red-600 bg-red-50 rounded-lg px-3 py-2">
        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold">Refund Failed</p>
          {refund.failureReason && (
            <p className="text-red-500 mt-0.5">{refund.failureReason}</p>
          )}
          <p className="text-red-400 mt-0.5">Please contact support.</p>
        </div>
      </div>
    );
  }

  if (refund.status === "completed") {
    return (
      <div className="flex items-center gap-2 text-[10px] text-green-700 bg-green-50 rounded-lg px-3 py-2">
        <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
        <div>
          <span className="font-semibold">₹{amount} refunded</span>
          {refund.completedAt && (
            <span className="text-green-600 ml-1">
              on{" "}
              {new Date(refund.completedAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
              })}
            </span>
          )}
          <p className="text-green-600 mt-0.5">
            Refund has been credited to your original payment method.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2 text-[10px] text-orange-700 bg-orange-50 rounded-lg px-3 py-2">
      <Clock className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
      <div>
        <span className={`font-semibold ${className}`}>
          ₹{amount} — {label}
        </span>
        {refund.initiatedAt && (
          <span className="text-orange-500 ml-1">
            on{" "}
            {new Date(refund.initiatedAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
            })}
          </span>
        )}
        <p className="text-orange-600 mt-0.5">
          Expected in your account within 5–7 business days.
        </p>
      </div>
    </div>
  );
}

// ─── Exchange panel ───────────────────────────────────────────────────────────

function ExchangePanel({
  exchangeInfo,
  variants,
}: {
  exchangeInfo: ExchangeInfo;
  variants: ProductVariant[];
}) {
  const { status, exchangeOrderId, exchangeVariantId, createdAt } =
    exchangeInfo;
  const step = getExchangeTimelineStep(status);

  const requestedSize = exchangeVariantId
    ? (variants.find((v) => v.id === exchangeVariantId)?.size ?? null)
    : null;

  const steps = [
    { key: "requested", label: "Exchange Requested" },
    { key: "in_progress", label: "Exchange in Progress" },
    { key: "shipped", label: "Replacement Shipped" },
    { key: "done", label: "Exchange Completed" },
  ];

  const stepOrder = ["requested", "in_progress", "shipped", "done"];
  const currentIdx = step === "rejected" ? -1 : stepOrder.indexOf(step);

  return (
    <div className="mt-3 pt-3 border-t border-blue-100 space-y-3">
      {requestedSize && (
        <div className="flex items-center gap-2 text-[10px] text-blue-700 bg-blue-50 rounded-lg px-3 py-2">
          <RefreshCw className="w-3.5 h-3.5 flex-shrink-0" />
          <span>
            Replacement size requested:{" "}
            <span className="font-semibold">{requestedSize}</span>
          </span>
        </div>
      )}

      {step === "rejected" ? (
        <div className="flex items-center gap-2 text-[10px] text-red-500">
          <AlertCircle className="w-3.5 h-3.5" />
          <span className="font-semibold">Exchange Cancelled</span>
        </div>
      ) : (
        <div className="flex items-center gap-1">
          {steps.map((s, idx) => {
            const done = idx < currentIdx;
            const active = idx === currentIdx;
            return (
              <div
                key={s.key}
                className="flex items-center gap-1 flex-1 min-w-0"
              >
                <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center ${
                      done || active
                        ? "bg-blue-500 text-white"
                        : "bg-slate-200 text-slate-400"
                    }`}
                  >
                    {done ? (
                      <CheckCircle className="w-3 h-3" />
                    ) : active ? (
                      <Clock className="w-3 h-3" />
                    ) : (
                      <div className="w-1.5 h-1.5 rounded-full bg-current" />
                    )}
                  </div>
                </div>
                <span
                  className={`text-[9px] leading-tight truncate ${
                    active
                      ? "text-blue-600 font-semibold"
                      : done
                        ? "text-slate-500"
                        : "text-slate-300"
                  }`}
                >
                  {s.label}
                </span>
                {idx < steps.length - 1 && (
                  <div
                    className={`h-px flex-1 mx-1 ${done ? "bg-blue-400" : "bg-slate-200"}`}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {(step === "shipped" || step === "done") && exchangeOrderId && (
        <div className="flex items-center gap-2 text-[10px] text-blue-700 bg-blue-50 rounded-lg px-3 py-2">
          <Package className="w-3.5 h-3.5 flex-shrink-0" />
          <span>
            Replacement order{" "}
            <span className="font-semibold">#{exchangeOrderId}</span> is on its
            way.
          </span>
        </div>
      )}

      {step === "done" && (
        <div className="flex items-center gap-2 text-[10px] text-green-700 bg-green-50 rounded-lg px-3 py-2">
          <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="font-semibold">
            Exchange completed. Enjoy your new item!
          </span>
        </div>
      )}

      <p className="text-[10px] text-slate-400">
        Exchange requested on{" "}
        {new Date(createdAt).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })}
      </p>
    </div>
  );
}
