"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star, AlertCircle, CheckCircle } from "lucide-react";
import { OrderWithItems } from "@/shared";

interface ReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Full order — used to look up the item's product image/name */
  order: OrderWithItems;
  /** The order item being reviewed */
  orderItemId: string;
  productId: string;
  /** Called after a successful submission so the parent can hide the Review button */
  onReviewSubmitted?: () => void;
}

const RATING_LABELS: Record<number, string> = {
  1: "Poor",
  2: "Fair",
  3: "Good",
  4: "Very Good",
  5: "Excellent",
};

export default function ReviewModal({
  open,
  onOpenChange,
  order,
  orderItemId,
  productId,
  onReviewSubmitted,
}: ReviewModalProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const orderItem = order.items?.find((item) => item.id === orderItemId);

  const resetForm = () => {
    setRating(5);
    setHoverRating(0);
    setTitle("");
    setComment("");
    setError("");
    setSuccess(false);
  };

  const handleOpenChange = (value: boolean) => {
    if (!value) resetForm();
    onOpenChange(value);
  };

  const handleSubmit = async () => {
    if (!comment.trim()) {
      setError("Please write a review comment");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/products/${productId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          title: title.trim() || undefined,
          comment: comment.trim(),
          orderId: order.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to submit review");
      }

      setSuccess(true);

      // Notify parent to hide the Review button immediately
      onReviewSubmitted?.();

      // Refresh the product page cache so the new review appears
      router.refresh();

      setTimeout(() => handleOpenChange(false), 1800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit review");
    } finally {
      setLoading(false);
    }
  };

  if (!orderItem) return null;

  const displayRating = hoverRating || rating;

  const titleContent = (
    <>
      <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
      Write a Review
    </>
  );

  const content = (
    <div className="px-4 space-y-4 pb-2">
      {success ? (
        /* ── Success state ── */
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <CheckCircle className="w-14 h-14 text-green-500" />
          <p className="text-sm font-semibold text-gray-900">Review submitted!</p>
          <p className="text-xs text-gray-500">Thank you for your feedback.</p>
        </div>
      ) : (
        <>
          {/* ── Product preview ── */}
          <div className="border rounded-lg p-3 bg-gray-50">
            <div className="flex gap-3">
              <div className="w-12 h-12 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                {orderItem.product?.imageUrl ? (
                  <img
                    src={orderItem.product.imageUrl}
                    alt={orderItem.product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Star className="w-6 h-6 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">
                  {orderItem.product?.name || "Product"}
                </p>
                <p className="text-xs text-gray-500">
                  {(orderItem.product as any)?.category?.name}
                  {(orderItem.product as any)?.color?.name &&
                    ` · ${(orderItem.product as any).color.name}`}
                </p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-gray-500">Qty: {orderItem.quantity}</span>
                  <span className="text-xs font-medium">
                    ₹{parseFloat(orderItem.price).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Star rating ── */}
          <div className="space-y-1.5">
            <Label>Overall Rating *</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-0.5 transition-transform hover:scale-110 focus:outline-none"
                  aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
                >
                  <Star
                    className={`w-7 h-7 transition-colors ${
                      star <= displayRating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 font-medium">{RATING_LABELS[displayRating]}</p>
          </div>

          {/* ── Review title (optional) ── */}
          <div className="space-y-1.5">
            <Label htmlFor="review-title">
              Review Title{" "}
              <span className="text-gray-400 font-normal">(optional)</span>
            </Label>
            <Input
              id="review-title"
              placeholder="Summarise your experience in a few words"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
            />
            <p className="text-xs text-gray-400 text-right">{title.length}/100</p>
          </div>

          {/* ── Review body ── */}
          <div className="space-y-1.5">
            <Label htmlFor="review-comment">Your Review *</Label>
            <Textarea
              id="review-comment"
              placeholder="What did you like or dislike? How was the quality, fit, and delivery?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              maxLength={500}
              inputMode="text"
            />
            <p className="text-xs text-gray-400 text-right">{comment.length}/500</p>
          </div>

          {/* ── Error ── */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <p className="text-xs text-red-800">{error}</p>
            </div>
          )}
        </>
      )}
    </div>
  );

  const footerButtons = !success && (
    <>
      <Button
        variant="outline"
        onClick={() => handleOpenChange(false)}
        disabled={loading}
      >
        Cancel
      </Button>
      <Button
        onClick={handleSubmit}
        disabled={loading || !comment.trim()}
      >
        {loading ? "Submitting…" : "Submit Review"}
      </Button>
    </>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={handleOpenChange}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="flex items-center gap-2">{titleContent}</DrawerTitle>
            <DrawerDescription>
              Share your honest experience — it helps other shoppers
            </DrawerDescription>
          </DrawerHeader>
          {content}
          {footerButtons && <DrawerFooter className="pt-2">{footerButtons}</DrawerFooter>}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">{titleContent}</DialogTitle>
          <DialogDescription>
            Share your honest experience — it helps other shoppers
          </DialogDescription>
        </DialogHeader>
        {content}
        {footerButtons && <DialogFooter className="pt-2">{footerButtons}</DialogFooter>}
      </DialogContent>
    </Dialog>
  );
}
